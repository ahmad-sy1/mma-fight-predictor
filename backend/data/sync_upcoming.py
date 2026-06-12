"""
Scrapet aankomende UFC fights en slaat ze op in Supabase.
Wordt aangeroepen door de GitHub Actions CI.
"""
import os
import time
from dotenv import load_dotenv
from supabase import create_client
import undetected_chromedriver as uc
from selenium.webdriver.support.ui import WebDriverWait
from bs4 import BeautifulSoup

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

BASE = "http://ufcstats.com"

_driver = None


def _get_driver():
    global _driver
    if _driver is None:
        options = uc.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        _driver = uc.Chrome(options=options)
    return _driver


def _get(url: str):
    try:
        driver = _get_driver()
        driver.get(url)
        WebDriverWait(driver, 15).until(lambda d: d.title != "Loading…")
        return BeautifulSoup(driver.page_source, "html.parser")
    except Exception as e:
        print(f"  ⚠️  Request failed: {url} — {e}")
        return None


def scrape_upcoming_fights() -> list[dict]:
    soup = _get(f"{BASE}/statistics/events/upcoming?page=all")
    if not soup:
        return []

    fights = []
    for row in soup.select("tr.b-statistics__table-row"):
        link = row.select_one("a.b-link")
        if not link:
            continue

        date_el = row.select_one("span.b-statistics__date")
        tds = row.select("td")

        event = {
            "name":     link.get_text(strip=True),
            "url":      link["href"],
            "date":     date_el.get_text(strip=True) if date_el else "",
            "location": tds[1].get_text(strip=True) if len(tds) > 1 else "",
        }

        soup2 = _get(event["url"])
        if not soup2:
            continue

        for fight_row in soup2.select("tr.b-fight-details__table-row"):
            cols = fight_row.select("td")
            if len(cols) < 2:
                continue
            fighters = cols[1].select("a.b-link")
            if len(fighters) < 2:
                continue

            fights.append({
                "event":       event["name"],
                "date":        event["date"],
                "location":    event["location"],
                "red_fighter": fighters[0].get_text(strip=True),
                "blue_fighter": fighters[1].get_text(strip=True),
                "weight_class": cols[6].get_text(strip=True) if len(cols) > 6 else "",
            })

        time.sleep(0.5)

    return fights


def run_sync():
    print("🔍 Aankomende fights scrapen...")
    fights = scrape_upcoming_fights()
    print(f"✅ {len(fights)} fights gevonden")

    if not fights:
        print("⚠️  Geen fights gevonden, tabel niet gewijzigd")
        return

    # Wis oude data en insert nieuwe
    supabase.table("upcoming_fights").delete().neq("id", 0).execute()
    supabase.table("upcoming_fights").insert(fights).execute()
    print(f"🏁 {len(fights)} upcoming fights opgeslagen in Supabase")


if __name__ == "__main__":
    run_sync()
