"""
Dagelijkse sync: haalt alleen nieuwe UFC events op en slaat ze op in Supabase.
Wordt aangeroepen door de GitHub Actions CI.
"""
import os
import time
import sys
from dotenv import load_dotenv
from supabase import create_client
from data.scraper import get, get_all_events, get_fight_urls, get_fight_details, save_fight

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def run_sync():
    all_events = get_all_events()

    response = supabase.table("fights").select("event").order("event", desc=True).limit(1).execute()
    latest_known = response.data[0]["event"] if response.data else None
    print(f"📦 Laatste bekende event: {latest_known}")

    new_events = []
    for event in all_events:
        if event["name"] == latest_known:
            break
        new_events.append(event)

    print(f"🆕 {len(new_events)} nieuwe events gevonden")
    if not new_events:
        print("✅ Database is al up-to-date")
        return

    for i, event in enumerate(new_events):
        print(f"\n[{i+1}/{len(new_events)}] {event['name']}")
        fight_urls = get_fight_urls(event["url"])
        print(f"  {len(fight_urls)} fights")

        for url in fight_urls:
            data = get_fight_details(url, event["name"])
            if data:
                save_fight(data)
                print(f"  ✅ {data['red_fighter']} vs {data['blue_fighter']} → {data['winner']}")
            time.sleep(0.3)

    print(f"\n🏁 Klaar! {len(new_events)} nieuwe events toegevoegd")


if __name__ == "__main__":
    run_sync()