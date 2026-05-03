"""
Live fighter stats scraper from ufcstats.com.
Caches results in-memory for 1 hour to avoid repeated requests.
"""
from __future__ import annotations

import re
import time
from datetime import date
from pathlib import Path
from typing import Optional

import requests
import pandas as pd
from bs4 import BeautifulSoup

_SESSION = requests.Session()
_SESSION.headers.update({'User-Agent': 'Mozilla/5.0 (compatible; fight-oracle/1.0)'})

_CACHE: dict[str, tuple[float, dict]] = {}   # name -> (timestamp, result)
_URL_MAP: dict[str, str] = {}                # lowercase name -> ufcstats URL
_CACHE_TTL = 3600  # seconds

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Build name→URL index from local tott file at startup ───────────────────
def _load_url_map() -> dict[str, str]:
    path = BASE_DIR / 'data' / 'raw' / 'ufc_fighter_tott.csv'
    if not path.exists():
        return {}
    df = pd.read_csv(path)
    return {str(row['FIGHTER']).strip().lower(): str(row['URL']).strip()
            for _, row in df.iterrows()
            if pd.notna(row['FIGHTER']) and pd.notna(row['URL'])}

_URL_MAP = _load_url_map()


# ── Helpers ─────────────────────────────────────────────────────────────────
def _get(url: str, timeout: int = 10) -> BeautifulSoup | None:
    try:
        r = _SESSION.get(url, timeout=timeout)
        r.raise_for_status()
        return BeautifulSoup(r.text, 'html.parser')
    except Exception:
        return None


def _parse_height(h: str) -> float:
    """5' 4" → cm"""
    m = re.match(r"(\d+)'\s*(\d+)", h)
    if m:
        return round((int(m.group(1)) * 12 + int(m.group(2))) * 2.54, 1)
    return 0.0


def _parse_reach(r: str) -> float:
    """79" → cm"""
    m = re.match(r"([\d.]+)", r)
    return round(float(m.group(1)) * 2.54, 1) if m else 0.0


def _parse_weight(w: str) -> float:
    m = re.match(r"([\d.]+)", w)
    return float(m.group(1)) if m else 0.0


def _parse_pct(s: str) -> float:
    """'62%' → 62.0"""
    m = re.match(r"([\d.]+)", s.strip())
    return float(m.group(1)) if m else 0.0


def _age_from_dob(dob_str: str) -> int:
    try:
        dob = pd.to_datetime(dob_str, format='%b %d, %Y').date()
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return 0


# ── Search ufcstats.com for a fighter URL ───────────────────────────────────
def _search_url(name: str) -> str | None:
    """Return ufcstats fighter URL by searching; returns best match or None."""
    query = name.strip().replace(' ', '+')
    soup = _get(f'http://ufcstats.com/statistics/fighters?action=search&SearchTerm={query}&page=all')
    if not soup:
        return None
    rows = soup.select('tr.b-statistics__table-row')
    name_lower = name.lower()
    for row in rows[1:]:
        cols = row.select('td')
        links = row.select('a')
        if not links or len(cols) < 2:
            continue
        full = f"{cols[0].get_text(strip=True)} {cols[1].get_text(strip=True)}".strip().lower()
        if full == name_lower:
            return links[0]['href']
    # fuzzy: first partial match
    for row in rows[1:]:
        cols = row.select('td')
        links = row.select('a')
        if not links or len(cols) < 2:
            continue
        full = f"{cols[0].get_text(strip=True)} {cols[1].get_text(strip=True)}".strip().lower()
        if name_lower in full or all(part in full for part in name_lower.split()):
            return links[0]['href']
    return None


def _fighter_url(name: str) -> str | None:
    key = name.strip().lower()
    if key in _URL_MAP:
        return _URL_MAP[key]
    url = _search_url(name)
    if url:
        _URL_MAP[key] = url
    return url


# ── Parse a fighter details page ────────────────────────────────────────────
def _parse_fighter_page(soup: BeautifulSoup, name: str) -> dict:
    # --- Record ---
    record_el = soup.select_one('span.b-content__title-record')
    wins = losses = draws = 0
    if record_el:
        m = re.search(r'(\d+)-(\d+)-(\d+)', record_el.get_text())
        if m:
            wins, losses, draws = int(m.group(1)), int(m.group(2)), int(m.group(3))

    # --- Summary stats (li items) ---
    # Structure: <li><i>Key:</i> value</li>
    stat_map: dict[str, str] = {}
    for li in soup.select('li.b-list__box-list-item'):
        i_tag = li.select_one('i')
        if not i_tag:
            continue
        key = i_tag.get_text(strip=True).rstrip(':').strip().lower()
        i_tag.decompose()
        val = li.get_text(strip=True)
        if key and val:
            stat_map[key] = val

    height_cm  = _parse_height(stat_map.get('height', ''))
    reach_cm   = _parse_reach(stat_map.get('reach', ''))
    weight_lbs = _parse_weight(stat_map.get('weight', ''))
    stance     = stat_map.get('stance', 'Orthodox')
    dob_str    = stat_map.get('dob', '')
    age        = _age_from_dob(dob_str) if dob_str else 0

    slpm       = float(stat_map.get('slpm', 0) or 0)
    str_acc    = _parse_pct(stat_map.get('str. acc.', '0%'))
    td_avg     = float(stat_map.get('td avg.', 0) or 0)
    td_acc     = _parse_pct(stat_map.get('td acc.', '0%'))
    sub_avg    = float(stat_map.get('sub. avg.', 0) or 0)

    # Weight class from weight
    weight_class = _weight_class(weight_lbs)

    # --- Fight history ---
    ko_wins = sub_wins = dec_wins = total_rounds = title_bouts = 0
    win_streak = lose_streak = longest_win_streak = 0

    fight_rows = soup.select('tr.b-fight-details__table-row')
    past_fights: list[dict] = []

    for row in fight_rows[1:]:
        cols = row.select('td')
        if len(cols) < 9:
            continue
        result  = cols[0].get_text(strip=True).lower()
        event   = cols[6].get_text(separator=' ', strip=True) if len(cols) > 6 else ''
        method  = cols[7].get_text(strip=True).upper() if len(cols) > 7 else ''
        rnd_str = cols[8].get_text(strip=True) if len(cols) > 8 else '0'
        if result not in ('win', 'loss', 'draw', 'nc', 'no contest'):
            continue
        try:
            rnd = int(rnd_str)
        except ValueError:
            rnd = 0
        past_fights.append({'result': result, 'method': method, 'event': event, 'rnd': rnd})

    # Aggregate totals (all fights)
    for fight in past_fights:
        total_rounds += fight['rnd']
        if fight['result'] == 'win':
            m = fight['method']
            if 'KO' in m or 'TKO' in m:
                ko_wins += 1
            elif 'SUB' in m:
                sub_wins += 1
            elif 'DEC' in m:
                dec_wins += 1

    # Current streak — walk newest-first, stop at first direction change
    for fight in past_fights:
        res = fight['result']
        if res == 'win':
            if lose_streak > 0:
                break
            win_streak += 1
        elif res == 'loss':
            if win_streak > 0:
                break
            lose_streak += 1
        else:
            break  # draw / NC resets streak

    # Longest win streak — walk oldest-first
    _cur = 0
    for fight in reversed(past_fights):
        if fight['result'] == 'win':
            _cur += 1
            longest_win_streak = max(longest_win_streak, _cur)
        else:
            _cur = 0

    total = wins + losses
    win_rate = round(wins / total * 100, 1) if total > 0 else 0.0

    return {
        'name':             name,
        'record':           f"{wins}-{losses}-{draws}",
        'wins':             wins,
        'losses':           losses,
        'winRate':          win_rate,
        'age':              age,
        'heightCms':        height_cm,
        'reachCms':         reach_cm,
        'weightLbs':        weight_lbs,
        'stance':           stance,
        'weightClass':      weight_class,
        'avgSigStr':        round(slpm, 2),
        'avgTD':            round(td_avg, 2),
        'winStreak':        win_streak,
        'loseStreak':       lose_streak,
        'longestWinStreak': longest_win_streak,
        'koWins':           ko_wins,
        'subWins':          sub_wins,
        'decWins':          dec_wins,
        'totalRounds':      total_rounds,
        'titleBouts':       title_bouts,
        'sigStrAcc':        round(str_acc, 1),
        'tdAcc':            round(td_acc, 1),
        'avgSubAtt':        round(sub_avg, 2),
    }


def _weight_class(lbs: float) -> str:
    if lbs <= 0:   return '—'
    if lbs <= 115: return 'Strawweight'
    if lbs <= 125: return 'Flyweight'
    if lbs <= 135: return 'Bantamweight'
    if lbs <= 145: return 'Featherweight'
    if lbs <= 155: return 'Lightweight'
    if lbs <= 170: return 'Welterweight'
    if lbs <= 185: return 'Middleweight'
    if lbs <= 205: return 'Light Heavyweight'
    return 'Heavyweight'


# ── Public API ───────────────────────────────────────────────────────────────
def get_fighter_stats_live(name: str) -> dict | None:
    """
    Fetch live fighter stats from ufcstats.com.
    Returns None if the fighter cannot be found or the request fails.
    Results are cached for 1 hour.
    """
    key = name.strip().lower()

    # Cache hit
    if key in _CACHE:
        ts, data = _CACHE[key]
        if time.time() - ts < _CACHE_TTL:
            return data

    url = _fighter_url(name)
    if not url:
        return None

    soup = _get(url)
    if not soup:
        return None

    result = _parse_fighter_page(soup, name)
    _CACHE[key] = (time.time(), result)
    return result
