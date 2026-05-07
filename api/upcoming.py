"""
Scrapt aankomende UFC events + fights van ufcstats.com
en combineert met voorspellingen waar mogelijk.
"""
import requests
from bs4 import BeautifulSoup

BASE = "http://ufcstats.com"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "Mozilla/5.0 (compatible; fight-oracle/1.0)"})


def _get(url: str):
    try:
        r = SESSION.get(url, timeout=10)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception:
        return None


def scrape_upcoming_events() -> list[dict]:
    """Geeft lijst van aankomende events terug."""
    soup = _get(f"{BASE}/statistics/events/upcoming?page=all")
    if not soup:
        return []

    events = []
    for row in soup.select("tr.b-statistics__table-row"):
        link = row.select_one("a.b-link")
        if not link:
            continue
        date_el    = row.select_one("span.b-statistics__date")
        location_tds = row.select("td")
        events.append({
            "name":     link.get_text(strip=True),
            "url":      link["href"],
            "date":     date_el.get_text(strip=True) if date_el else "",
            "location": location_tds[1].get_text(strip=True) if len(location_tds) > 1 else "",
        })

    return events


def scrape_event_fights(event: dict) -> list[dict]:
    """Geeft lijst van fights voor één event."""
    soup = _get(event["url"])
    if not soup:
        return []

    fights = []
    for row in soup.select("tr.b-fight-details__table-row"):
        cols = row.select("td")
        if len(cols) < 2:
            continue
        fighters = cols[1].select("a.b-link")
        if len(fighters) < 2:
            continue

        red  = fighters[0].get_text(strip=True)
        blue = fighters[1].get_text(strip=True)
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
    """Hoofdfunctie: events + fights ophalen."""
    events = scrape_upcoming_events()
    all_fights = []
    for event in events:
        all_fights.extend(scrape_event_fights(event))
    return all_fights