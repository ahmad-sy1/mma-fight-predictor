import os
import numpy as np
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

RECENT_N = 5


def fetch_fighter_fights(name: str) -> list[dict]:
    """Haal alle fights op voor een fighter uit Supabase."""
    red  = supabase.table("fights").select("*").eq("red_fighter", name).execute().data
    blue = supabase.table("fights").select("*").eq("blue_fighter", name).execute().data

    fights = []

    for f in red:
        fights.append({
            "won":        f["winner"] == "Red",
            "method":     f.get("method") or "",
            "title_bout": f.get("title_bout") or False,
            "inserted_at": f.get("inserted_at") or "",
            "sig_land":   f.get("red_sig_land", 0) or 0,
            "sig_att":    f.get("red_sig_att",  0) or 0,
            "td_land":    f.get("red_td_land",  0) or 0,
            "td_att":     f.get("red_td_att",   0) or 0,
            "sub_att":    f.get("red_sub_att",  0) or 0,
            "ctrl_sec":   f.get("red_ctrl_sec", 0) or 0,
            "kd":         f.get("red_kd",       0) or 0,
            "head_land":  f.get("red_head_land",0) or 0,
            "body_land":  f.get("red_body_land",0) or 0,
            "leg_land":   f.get("red_leg_land", 0) or 0,
            "distance_land": f.get("red_distance_land", 0) or 0,
            "clinch_land":   f.get("red_clinch_land",   0) or 0,
            "ground_land":   f.get("red_ground_land",   0) or 0,
        })

    for f in blue:
        fights.append({
            "won":        f["winner"] == "Blue",
            "method":     f.get("method") or "",
            "title_bout": f.get("title_bout") or False,
            "inserted_at": f.get("inserted_at") or "",
            "sig_land":   f.get("blue_sig_land", 0) or 0,
            "sig_att":    f.get("blue_sig_att",  0) or 0,
            "td_land":    f.get("blue_td_land",  0) or 0,
            "td_att":     f.get("blue_td_att",   0) or 0,
            "sub_att":    f.get("blue_sub_att",  0) or 0,
            "ctrl_sec":   f.get("blue_ctrl_sec", 0) or 0,
            "kd":         f.get("blue_kd",       0) or 0,
            "head_land":  f.get("blue_head_land",0) or 0,
            "body_land":  f.get("blue_body_land",0) or 0,
            "leg_land":   f.get("blue_leg_land", 0) or 0,
            "distance_land": f.get("blue_distance_land", 0) or 0,
            "clinch_land":   f.get("blue_clinch_land",   0) or 0,
            "ground_land":   f.get("blue_ground_land",   0) or 0,
        })

    fights.sort(key=lambda x: x["inserted_at"], reverse=True)
    return fights


def compute_stats(fights: list[dict]) -> dict:
    """Bereken career averages + recent form."""
    recent = fights[-RECENT_N:] if len(fights) >= RECENT_N else fights

    def avg(key, lst):
        vals = [f[key] for f in lst if f[key] is not None]
        return float(np.mean(vals)) if vals else 0.0

    def safe_pct(land_key, att_key, lst):
        land = sum(f[land_key] for f in lst)
        att  = sum(f[att_key]  for f in lst)
        return land / att if att > 0 else 0.0

    wins   = sum(1 for f in fights if f["won"])
    losses = sum(1 for f in fights if not f["won"])

    win_streak = lose_streak = 0
    for f in reversed(fights):
        if f["won"]:
            if lose_streak > 0: break
            win_streak += 1
        else:
            if win_streak > 0: break
            lose_streak += 1

    longest = cur = 0
    for f in fights:
        cur = cur + 1 if f["won"] else 0
        longest = max(longest, cur)

    return {
        "Wins":             wins,
        "Losses":           losses,
        "WinStreak":        win_streak,
        "LoseStreak":       lose_streak,
        "LongestWinStreak": longest,
        "KOWins":           sum(1 for f in fights if f["won"] and "KO"  in f["method"].upper()),
        "SubWins":          sum(1 for f in fights if f["won"] and "SUB" in f["method"].upper()),
        "DecWins":          sum(1 for f in fights if f["won"] and "DEC" in f["method"].upper()),
        "TitleBouts":       sum(1 for f in fights if f["title_bout"]),
        "AvgSigStrLand":    avg("sig_land", fights),
        "AvgSigStrAtt":     avg("sig_att",  fights),
        "AvgSigStrPct":     safe_pct("sig_land", "sig_att", fights),
        "AvgTDLand":        avg("td_land",  fights),
        "AvgTDPct":         safe_pct("td_land", "td_att", fights),
        "AvgSubAtt":        avg("sub_att",  fights),
        "AvgCtrlSec":       avg("ctrl_sec", fights),
        "AvgKD":            avg("kd",       fights),
        "AvgHeadLand":      avg("head_land", fights),
        "AvgBodyLand":      avg("body_land", fights),
        "AvgLegLand":       avg("leg_land",  fights),
        "AvgDistanceLand":  avg("distance_land", fights),
        "AvgClinchLand":    avg("clinch_land",   fights),
        "AvgGroundLand":    avg("ground_land",   fights),
        "RecentWins":          sum(1 for f in recent if f["won"]),
        "RecentAvgSigStrLand": avg("sig_land", recent),
        "RecentAvgSigStrPct":  safe_pct("sig_land", "sig_att", recent),
        "RecentAvgTDLand":     avg("td_land",  recent),
        "RecentAvgTDPct":      safe_pct("td_land", "td_att", recent),
        "RecentAvgSubAtt":     avg("sub_att",  recent),
        "RecentAvgCtrlSec":    avg("ctrl_sec", recent),
        "RecentAvgKD":         avg("kd",       recent),
    }