"""
Scrapt het eerstvolgende UFC event van ufcstats.com.
Resultaten worden 1 uur gecached zodat herhaalde requests instant zijn.
"""
import time
import requests
from bs4 import BeautifulSoup

BASE    = "http://ufcstats.com"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0 (compatible; fight-oracle/1.0)"})

# ── Cache ─────────────────────────────────────────────────────────────────────
_cache: dict = {"data": None, "expires": 0}
CACHE_TTL = 3600  # 1 uur


def _get(url: str):
    try:
        r = SESSION.get(url, timeout=10)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception:
        return None


def _scrape_next_event() -> list[dict]:
    """Haalt alleen het eerstvolgende event op (= 2 HTTP requests totaal)."""
    soup = _get(f"{BASE}/statistics/events/upcoming?page=all")
    if not soup:
        return []

    # Pak alleen de EERSTE rij — dat is het volgende event
    rows = soup.select("tr.b-statistics__table-row")
    first_row = next((r for r in rows if r.select_one("a.b-link")), None)
    if not first_row:
        return []

    link      = first_row.select_one("a.b-link")
    date_el   = first_row.select_one("span.b-statistics__date")
    tds       = first_row.select("td")

    event = {
        "name":     link.get_text(strip=True),
        "url":      link["href"],
        "date":     date_el.get_text(strip=True) if date_el else "",
        "location": tds[1].get_text(strip=True) if len(tds) > 1 else "",
    }

    # Haal de fights op voor dit ene event
    soup2 = _get(event["url"])
    if not soup2:
        return []

    fights = []
    for row in soup2.select("tr.b-fight-details__table-row"):
        cols = row.select("td")
        if len(cols) < 2:
            continue
        fighters = cols[1].select("a.b-link")
        if len(fighters) < 2:
            continue

        red    = fighters[0].get_text(strip=True)
        blue   = fighters[1].get_text(strip=True)
        weight = cols[6].get_text(strip=True) if len(cols) > 6 else ""

        fights.append({
            "event":       event["name"],
            "date":        event["date"],
            "location":    event["location"],
            "redFighter":  red,
            "blueFighter": blue,
            "weightClass": weight,
        })

    return fights


def get_upcoming_fights() -> list[dict]:
    """Geeft gecachede fights terug. Scrapet alleen als cache verlopen is."""
    now = time.time()
    if _cache["data"] is not None and now < _cache["expires"]:
        return _cache["data"]

    fights = _scrape_next_event()
    _cache["data"]    = fights
    _cache["expires"] = now + CACHE_TTL
    return fights