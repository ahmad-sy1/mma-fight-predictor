"""
Build dataset from Supabase fights table.
Produces data/ufc_clean.csv with career averages + recent form + differentials.
"""
import os
import pandas as pd
import numpy as np
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()

supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

BASE_DIR = Path(__file__).resolve().parent.parent
OUT = str(BASE_DIR / 'data' / 'ufc_clean.csv')
RECENT_N = 5  # aantal gevechten voor "recent form"


# ── Data ophalen uit Supabase ─────────────────────────────────────────────────

def fetch_all_fights():
    print("Fetching fights from Supabase...")
    all_rows = []
    page_size = 1000
    offset = 0

    while True:
        result = supabase.table("fights").select("*").range(offset, offset + page_size - 1).execute()
        rows = result.data
        if not rows:
            break
        all_rows.extend(rows)
        offset += page_size
        if len(rows) < page_size:
            break

    df = pd.DataFrame(all_rows)
    print(f"  {len(df)} fights opgehaald")
    return df


# ── Fighter tracker ───────────────────────────────────────────────────────────

class FighterTracker:
    def __init__(self):
        self.fights = []  # lijst van alle vorige gevechten

    def snapshot(self):
        """Career averages + recent form op basis van alle vorige gevechten."""
        n = len(self.fights)
        recent = self.fights[-RECENT_N:] if n >= RECENT_N else self.fights
        r = len(recent)

        def avg(key, fights_list):
            vals = [f[key] for f in fights_list if f[key] is not None]
            return np.mean(vals) if vals else 0.0

        def safe_pct(land, att):
            return land / att if att > 0 else 0.0

        # Career totalen
        wins   = sum(1 for f in self.fights if f["won"])
        losses = sum(1 for f in self.fights if not f["won"])

        win_streak = lose_streak = 0
        for f in reversed(self.fights):
            if f["won"]:
                if lose_streak > 0: break
                win_streak += 1
            else:
                if win_streak > 0: break
                lose_streak += 1

        longest_win = cur = 0
        for f in self.fights:
            cur = cur + 1 if f["won"] else 0
            longest_win = max(longest_win, cur)

        ko_wins  = sum(1 for f in self.fights if f["won"] and "KO" in f["method"])
        sub_wins = sum(1 for f in self.fights if f["won"] and "Sub" in f["method"])
        dec_wins = sum(1 for f in self.fights if f["won"] and "Dec" in f["method"])
        title_bouts = sum(1 for f in self.fights if f["title_bout"])

        # Career averages
        c_sig_land = avg("sig_land", self.fights)
        c_sig_att  = avg("sig_att",  self.fights)
        c_sig_pct  = safe_pct(
            sum(f["sig_land"] for f in self.fights),
            sum(f["sig_att"]  for f in self.fights)
        )
        c_td_land  = avg("td_land",  self.fights)
        c_td_att   = avg("td_att",   self.fights)
        c_td_pct   = safe_pct(
            sum(f["td_land"] for f in self.fights),
            sum(f["td_att"]  for f in self.fights)
        )
        c_sub_att  = avg("sub_att",  self.fights)
        c_ctrl_sec = avg("ctrl_sec", self.fights)
        c_kd       = avg("kd",       self.fights)
        c_head_land = avg("head_land", self.fights)
        c_body_land = avg("body_land", self.fights)
        c_leg_land  = avg("leg_land",  self.fights)
        c_distance_land = avg("distance_land", self.fights)
        c_clinch_land   = avg("clinch_land",   self.fights)
        c_ground_land   = avg("ground_land",   self.fights)

        # Recent form (laatste N)
        r_wins     = sum(1 for f in recent if f["won"])
        r_sig_land = avg("sig_land", recent)
        r_sig_pct  = safe_pct(
            sum(f["sig_land"] for f in recent),
            sum(f["sig_att"]  for f in recent)
        )
        r_td_land  = avg("td_land",  recent)
        r_td_pct   = safe_pct(
            sum(f["td_land"] for f in recent),
            sum(f["td_att"]  for f in recent)
        )
        r_sub_att  = avg("sub_att",  recent)
        r_ctrl_sec = avg("ctrl_sec", recent)
        r_kd       = avg("kd",       recent)

        return {
            # Record
            "Wins": wins,
            "Losses": losses,
            "WinStreak": win_streak,
            "LoseStreak": lose_streak,
            "LongestWinStreak": longest_win,
            "KOWins": ko_wins,
            "SubWins": sub_wins,
            "DecWins": dec_wins,
            "TitleBouts": title_bouts,
            # Career averages
            "AvgSigStrLand": c_sig_land,
            "AvgSigStrAtt": c_sig_att,
            "AvgSigStrPct": c_sig_pct,
            "AvgTDLand": c_td_land,
            "AvgTDPct": c_td_pct,
            "AvgSubAtt": c_sub_att,
            "AvgCtrlSec": c_ctrl_sec,
            "AvgKD": c_kd,
            "AvgHeadLand": c_head_land,
            "AvgBodyLand": c_body_land,
            "AvgLegLand": c_leg_land,
            "AvgDistanceLand": c_distance_land,
            "AvgClinchLand": c_clinch_land,
            "AvgGroundLand": c_ground_land,
            # Recent form
            "RecentWins": r_wins,
            "RecentAvgSigStrLand": r_sig_land,
            "RecentAvgSigStrPct": r_sig_pct,
            "RecentAvgTDLand": r_td_land,
            "RecentAvgTDPct": r_td_pct,
            "RecentAvgSubAtt": r_sub_att,
            "RecentAvgCtrlSec": r_ctrl_sec,
            "RecentAvgKD": r_kd,
        }

    def update(self, won, method, title_bout, stats):
        self.fights.append({
            "won": won,
            "method": method,
            "title_bout": title_bout,
            **stats,
        })


# ── Dataset bouwen ────────────────────────────────────────────────────────────

def build_dataset(df):
    print("Building dataset...")

    # Sorteer op inserted_at zodat we chronologisch werken
    df = df.sort_values("inserted_at", ascending=False).reset_index(drop=True)

    trackers = defaultdict(FighterTracker)
    rows_out = []

    for _, fight in df.iterrows():
        r = fight["red_fighter"]
        b = fight["blue_fighter"]

        red_snap  = trackers[r].snapshot()
        blue_snap = trackers[b].snapshot()

        # Differentials (red - blue)
        def dif(key):
            return red_snap[key] - blue_snap[key]

        row = {
            "RedFighter":  r,
            "BlueFighter": b,
            "Winner":      fight["winner"],
            "WeightClass": fight["weight_class"],
            "TitleBout":   fight["title_bout"],
            "Method":      fight["method"],
        }

        # Red features
        for key, val in red_snap.items():
            row[f"Red{key}"] = val

        # Blue features
        for key, val in blue_snap.items():
            row[f"Blue{key}"] = val

        # Differentials
        for key in red_snap.keys():
            row[f"Dif{key}"] = dif(key)

        rows_out.append(row)

        # Update trackers
        def fighter_stats(prefix):
            return {
                "sig_land":     fight.get(f"{prefix}_sig_land", 0) or 0,
                "sig_att":      fight.get(f"{prefix}_sig_att",  0) or 0,
                "td_land":      fight.get(f"{prefix}_td_land",  0) or 0,
                "td_att":       fight.get(f"{prefix}_td_att",   0) or 0,
                "sub_att":      fight.get(f"{prefix}_sub_att",  0) or 0,
                "ctrl_sec":     fight.get(f"{prefix}_ctrl_sec", 0) or 0,
                "kd":           fight.get(f"{prefix}_kd",       0) or 0,
                "head_land":    fight.get(f"{prefix}_head_land",0) or 0,
                "body_land":    fight.get(f"{prefix}_body_land",0) or 0,
                "leg_land":     fight.get(f"{prefix}_leg_land", 0) or 0,
                "distance_land":fight.get(f"{prefix}_distance_land", 0) or 0,
                "clinch_land":  fight.get(f"{prefix}_clinch_land",   0) or 0,
                "ground_land":  fight.get(f"{prefix}_ground_land",   0) or 0,
            }

        trackers[r].update(
            won=fight["winner"] == "Red",
            method=fight["method"] or "",
            title_bout=fight["title_bout"] or False,
            stats=fighter_stats("red"),
        )
        trackers[b].update(
            won=fight["winner"] == "Blue",
            method=fight["method"] or "",
            title_bout=fight["title_bout"] or False,
            stats=fighter_stats("blue"),
        )

    out = pd.DataFrame(rows_out)
    print(f"  {len(out)} rijen gebouwd")
    print(f"  {len(out.columns)} kolommen")
    print(f"  Winner verdeling:\n{out['Winner'].value_counts()}")
    return out


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    df = fetch_all_fights()
    dataset = build_dataset(df)
    dataset.to_csv(OUT, index=False)
    print(f"\n✅ Opgeslagen → {OUT}")