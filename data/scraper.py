"""
Scraper: haalt alle UFC fight data op van ufcstats.com
en slaat het op in Supabase.
"""
import os
import re
import time
import requests
from bs4 import BeautifulSoup
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0 (compatible; fight-oracle/1.0)"})

BASE = "http://ufcstats.com"


def get(url):
    try:
        r = SESSION.get(url, timeout=10)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  ⚠️  Request failed: {url} — {e}")
        return None


# ── Helpers ──────────────────────────────────────────────────────────────────

def parse_of(s):
    """'11 of 38' → (11, 38)"""
    m = re.match(r"(\d+)\s+of\s+(\d+)", str(s).strip())
    return (int(m.group(1)), int(m.group(2))) if m else (0, 0)


def parse_pct(s):
    """'62%' → 62.0"""
    m = re.match(r"([\d.]+)", str(s).strip())
    return float(m.group(1)) if m else 0.0


def parse_ctrl(s):
    """'1:23' → 83 seconden"""
    s = str(s).strip()
    m = re.match(r"(\d+):(\d+)", s)
    return int(m.group(1)) * 60 + int(m.group(2)) if m else 0


def empty_stats(prefix):
    """Geeft lege stats dict terug voor red of blue."""
    return {
        f"{prefix}_kd": 0,
        f"{prefix}_sig_land": 0, f"{prefix}_sig_att": 0, f"{prefix}_sig_pct": 0.0,
        f"{prefix}_total_land": 0, f"{prefix}_total_att": 0,
        f"{prefix}_td_land": 0, f"{prefix}_td_att": 0, f"{prefix}_td_pct": 0.0,
        f"{prefix}_sub_att": 0,
        f"{prefix}_ctrl_sec": 0,
        f"{prefix}_head_land": 0, f"{prefix}_head_att": 0,
        f"{prefix}_body_land": 0, f"{prefix}_body_att": 0,
        f"{prefix}_leg_land": 0, f"{prefix}_leg_att": 0,
        f"{prefix}_distance_land": 0, f"{prefix}_distance_att": 0,
        f"{prefix}_clinch_land": 0, f"{prefix}_clinch_att": 0,
        f"{prefix}_ground_land": 0, f"{prefix}_ground_att": 0,
    }


# ── Events ───────────────────────────────────────────────────────────────────

def get_all_events():
    soup = get(f"{BASE}/statistics/events/completed?page=all")
    if not soup:
        return []
    events = []
    for row in soup.select("tr.b-statistics__table-row"):
        link = row.select_one("a.b-link")
        if not link:
            continue
        events.append({"name": link.get_text(strip=True), "url": link["href"]})
    print(f"✅ {len(events)} events gevonden")
    return events


# ── Fights per event ──────────────────────────────────────────────────────────

def get_fight_urls(event_url):
    soup = get(event_url)
    if not soup:
        return []
    return [row.get("data-link") for row in soup.select("tr.b-fight-details__table-row") if row.get("data-link")]


# ── Fight details ─────────────────────────────────────────────────────────────

def get_fight_details(fight_url, event_name):
    soup = get(fight_url)
    if not soup:
        return None

    # Fighters + winnaar
    persons = soup.select("div.b-fight-details__person")
    if len(persons) < 2:
        return None

    def status(el):
        i = el.select_one("i.b-fight-details__person-status")
        return i.get_text(strip=True) if i else ""

    red_status  = status(persons[0])
    blue_status = status(persons[1])

    if red_status == "W":
        winner = "Red"
    elif blue_status == "W":
        winner = "Blue"
    else:
        return None  # draw / NC overslaan

    def fighter_name(el):
        a = el.select_one("h3.b-fight-details__person-name a")
        return a.get_text(strip=True) if a else ""

    red_name  = fighter_name(persons[0])
    blue_name = fighter_name(persons[1])
    if not red_name or not blue_name:
        return None

    # Fight info (methode, ronde, tijd, gewichtsklasse)
    info = {}
    for p in soup.select("div.b-fight-details__content p.b-fight-details__text"):
        text = p.get_text(" ", strip=True)
        for key in ["Method", "Round", "Time", "Time format", "Weight class"]:
            if text.startswith(key):
                info[key] = text.replace(key + ":", "").strip()

    method           = info.get("Method", "")
    finish_detail    = ""
    # finish detail staat soms als tweede regel bij Method
    detail_el = soup.select_one("p.b-fight-details__text i[style]")
    if detail_el:
        finish_detail = detail_el.get_text(strip=True)

    round_num        = int(info.get("Round", 0) or 0)
    fight_time       = info.get("Time", "")
    time_format      = info.get("Time format", "")
    weight_class     = info.get("Weight class", "")
    title_bout       = "Title" in time_format

    scheduled = 3
    m = re.search(r"(\d+)\s+Rnd", time_format)
    if m:
        scheduled = int(m.group(1))

    # Stats tabellen — ufcstats heeft twee tabellen:
    # Tabel 1: totaal (eerste rij = totaal over alle rondes)
    # Tabel 2: per ronde
    # We pakken tabel 1, eerste data-rij
    tables = soup.select("table.b-fight-details__table")

    red_s  = empty_stats("red")
    blue_s = empty_stats("blue")

    if tables:
        rows = tables[0].select("tbody tr")
        if rows:
            cols = rows[0].select("td")
            if len(cols) >= 10:
                # Kolom volgorde: Fighter | KD | Sig.Str. | Sig.Str.% | Total Str. | TD | TD% | Sub.Att | Rev | Ctrl
                # Elke kolom heeft twee waarden: red bovenaan, blue onderaan (als <p> tags)
                def col_vals(col):
                    ps = col.select("p")
                    return (ps[0].get_text(strip=True) if len(ps) > 0 else "0",
                            ps[1].get_text(strip=True) if len(ps) > 1 else "0")

                r_kd, b_kd       = col_vals(cols[1])
                r_sig, b_sig     = col_vals(cols[2])
                r_sigp, b_sigp   = col_vals(cols[3])
                r_tot, b_tot     = col_vals(cols[4])
                r_td, b_td       = col_vals(cols[5])
                r_tdp, b_tdp     = col_vals(cols[6])
                r_sub, b_sub     = col_vals(cols[7])
                r_ctrl, b_ctrl   = col_vals(cols[9])

                r_sl, r_sa = parse_of(r_sig)
                b_sl, b_sa = parse_of(b_sig)
                r_tl, r_ta = parse_of(r_td)
                b_tl, b_ta = parse_of(b_td)
                r_ttl, r_tta = parse_of(r_tot)
                b_ttl, b_tta = parse_of(b_tot)

                red_s.update({
                    "red_kd": int(r_kd or 0),
                    "red_sig_land": r_sl, "red_sig_att": r_sa, "red_sig_pct": parse_pct(r_sigp),
                    "red_total_land": r_ttl, "red_total_att": r_tta,
                    "red_td_land": r_tl, "red_td_att": r_ta, "red_td_pct": parse_pct(r_tdp),
                    "red_sub_att": int(r_sub or 0),
                    "red_ctrl_sec": parse_ctrl(r_ctrl),
                })
                blue_s.update({
                    "blue_kd": int(b_kd or 0),
                    "blue_sig_land": b_sl, "blue_sig_att": b_sa, "blue_sig_pct": parse_pct(b_sigp),
                    "blue_total_land": b_ttl, "blue_total_att": b_tta,
                    "blue_td_land": b_tl, "blue_td_att": b_ta, "blue_td_pct": parse_pct(b_tdp),
                    "blue_sub_att": int(b_sub or 0),
                    "blue_ctrl_sec": parse_ctrl(b_ctrl),
                })

        # Tabel 2: head/body/leg/distance/clinch/ground
        if len(tables) > 1:
            rows2 = tables[1].select("tbody tr")
            if rows2:
                cols2 = rows2[0].select("td")
                if len(cols2) >= 7:
                    def col_vals2(col):
                        ps = col.select("p")
                        return (ps[0].get_text(strip=True) if len(ps) > 0 else "0 of 0",
                                ps[1].get_text(strip=True) if len(ps) > 1 else "0 of 0")

                    r_head, b_head = col_vals2(cols2[3])
                    r_body, b_body = col_vals2(cols2[4])
                    r_leg,  b_leg  = col_vals2(cols2[5])
                    r_dist, b_dist = col_vals2(cols2[1])
                    r_clinch, b_clinch = col_vals2(cols2[2])
                    r_ground, b_ground = col_vals2(cols2[6]) if len(cols2) > 6 else ("0 of 0", "0 of 0")

                    rhl, rha = parse_of(r_head)
                    bhl, bha = parse_of(b_head)
                    rbl, rba = parse_of(r_body)
                    bbl, bba = parse_of(b_body)
                    rll, rla = parse_of(r_leg)
                    bll, bla = parse_of(b_leg)
                    rdl, rda = parse_of(r_dist)
                    bdl, bda = parse_of(b_dist)
                    rcl, rca = parse_of(r_clinch)
                    bcl, bca = parse_of(b_clinch)
                    rgl, rga = parse_of(r_ground)
                    bgl, bga = parse_of(b_ground)

                    red_s.update({
                        "red_head_land": rhl, "red_head_att": rha,
                        "red_body_land": rbl, "red_body_att": rba,
                        "red_leg_land": rll, "red_leg_att": rla,
                        "red_distance_land": rdl, "red_distance_att": rda,
                        "red_clinch_land": rcl, "red_clinch_att": rca,
                        "red_ground_land": rgl, "red_ground_att": rga,
                    })
                    blue_s.update({
                        "blue_head_land": bhl, "blue_head_att": bha,
                        "blue_body_land": bbl, "blue_body_att": bba,
                        "blue_leg_land": bll, "blue_leg_att": bla,
                        "blue_distance_land": bdl, "blue_distance_att": bda,
                        "blue_clinch_land": bcl, "blue_clinch_att": bca,
                        "blue_ground_land": bgl, "blue_ground_att": bga,
                    })

    return {
        "event": event_name,
        "red_fighter": red_name,
        "blue_fighter": blue_name,
        "winner": winner,
        "method": method,
        "finish_detail": finish_detail,
        "round": round_num,
        "fight_time": fight_time,
        "scheduled_rounds": scheduled,
        "weight_class": weight_class,
        "title_bout": title_bout,
        **red_s,
        **blue_s,
    }


# ── Opslaan in Supabase ───────────────────────────────────────────────────────

def save_fight(fight):
    print(f"    DEBUG keys: {list(fight.keys())}")
    try:
        result = supabase.table("fights").insert(fight).execute()
        print(f"    DEBUG result: {result}")
    except Exception as e:
        print(f"    DEBUG error: {e}")


# ── Main ──────────────────────────────────────────────────────────────────────

def run():
    events = get_all_events()

    for i, event in enumerate(events):
        print(f"\n[{i+1}/{len(events)}] {event['name']}")
        fight_urls = get_fight_urls(event["url"])
        print(f"  {len(fight_urls)} fights")

        for url in fight_urls:
            data = get_fight_details(url, event["name"])
            if data:
                save_fight(data)
                print(f"  ✅ {data['red_fighter']} vs {data['blue_fighter']} → {data['winner']}")
            time.sleep(0.3)

    print("\n🏁 Klaar!")


if __name__ == "__main__":
    run()