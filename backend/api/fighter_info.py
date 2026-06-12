from backend.api.fighter_stats import fetch_fighter_fights, compute_stats, supabase


def get_fighter_info(name: str) -> dict:
    fights = fetch_fighter_fights(name)
    stats  = compute_stats(fights)

    red_wc  = supabase.table("fights").select("weight_class").eq("red_fighter",  name).execute().data
    blue_wc = supabase.table("fights").select("weight_class").eq("blue_fighter", name).execute().data
    all_wc  = [f["weight_class"] for f in red_wc + blue_wc if f.get("weight_class")]
    weight_class = max(set(all_wc), key=all_wc.count) if all_wc else "—"

    wins   = stats["Wins"]
    losses = stats["Losses"]
    total  = wins + losses

    return {
        "name":             name,
        "record":           f"{wins}-{losses}-0",
        "wins":             wins,
        "losses":           losses,
        "winRate":          round(wins / total * 100, 1) if total > 0 else 0.0,
        "weightClass":      weight_class,
        "winStreak":        stats["WinStreak"],
        "loseStreak":       stats["LoseStreak"],
        "longestWinStreak": stats["LongestWinStreak"],
        "koWins":           stats["KOWins"],
        "subWins":          stats["SubWins"],
        "decWins":          stats["DecWins"],
        "titleBouts":       stats["TitleBouts"],
        "avgSigStr":        round(stats["AvgSigStrLand"], 2),
        "avgTD":            round(stats["AvgTDLand"], 2),
        "sigStrAcc":        round(stats["AvgSigStrPct"] * 100, 1),
        "tdAcc":            round(stats["AvgTDPct"] * 100, 1),
        "avgSubAtt":        round(stats["AvgSubAtt"], 2),
        "avgCtrlSec":       round(stats["AvgCtrlSec"], 1),
        "avgKD":            round(stats["AvgKD"], 2),
        "recentWins":       stats["RecentWins"],
    }