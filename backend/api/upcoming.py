import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

_supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def get_upcoming_fights() -> list[dict]:
    r = _supabase.table("upcoming_fights").select("*").execute()
    fights = []
    for row in r.data:
        fights.append({
            "event":       row["event"],
            "date":        row.get("date", ""),
            "location":    row.get("location", ""),
            "redFighter":  row["red_fighter"],
            "blueFighter": row["blue_fighter"],
            "weightClass": row.get("weight_class", ""),
        })
    return fights
