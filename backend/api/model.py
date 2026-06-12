import joblib
import json
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from backend.api.fighter_stats import fetch_fighter_fights, compute_stats
from backend.api.fighter_info import get_fighter_info

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Model laden ───────────────────────────────────────────────────────────────
model = joblib.load(BASE_DIR / 'models' / 'model_v4.pkl')

with open(BASE_DIR / 'models' / 'feature_names_v4.json') as f:
    FEATURES = json.load(f)

# ── Dataset + fighters lijst ──────────────────────────────────────────────────
df = pd.read_csv(BASE_DIR / 'data' / 'ufc_clean.csv')

ALL_FIGHTERS = sorted(set(df['RedFighter'].dropna()) | set(df['BlueFighter'].dropna()))
FIGHTERS_SET = set(ALL_FIGHTERS)
TOTAL_FIGHTS = len(df)

# ── Model accuracy ────────────────────────────────────────────────────────────
_X = df[FEATURES].fillna(0)
_y = (df['Winner'] == 'Red').astype(int)
_, _X_test, _, _y_test = train_test_split(_X, _y, test_size=0.2, random_state=42)
MODEL_ACCURACY = round(float(accuracy_score(_y_test, model.predict(_X_test))) * 100, 2)


# ── Build input voor model ────────────────────────────────────────────────────

def build_input(red_name: str, blue_name: str) -> pd.DataFrame:
    red_stats  = compute_stats(fetch_fighter_fights(red_name))
    blue_stats = compute_stats(fetch_fighter_fights(blue_name))

    row = {}
    for feat in FEATURES:
        if feat.startswith("Red"):
            row[feat] = red_stats.get(feat[3:], 0.0)
        elif feat.startswith("Blue"):
            row[feat] = blue_stats.get(feat[4:], 0.0)
        elif feat.startswith("Dif"):
            key = feat[3:]
            row[feat] = red_stats.get(key, 0.0) - blue_stats.get(key, 0.0)
        else:
            row[feat] = 0.0

    return pd.DataFrame([row])[FEATURES]


# ── Predict ───────────────────────────────────────────────────────────────────

def predict_fight(red_name: str, blue_name: str) -> dict:
    input_df = build_input(red_name, blue_name)

    prediction = model.predict(input_df)[0]
    probas     = model.predict_proba(input_df)[0]
    confidence = float(probas[1] if prediction == 1 else probas[0])

    winner_name   = red_name  if prediction == 1 else blue_name
    loser_name    = blue_name if prediction == 1 else red_name
    winner_corner = "red"     if prediction == 1 else "blue"

    red_info    = get_fighter_info(red_name)
    blue_info   = get_fighter_info(blue_name)
    winner_info = red_info if prediction == 1 else blue_info

    # Finish methode schatten
    if winner_info["avgTD"] > 1.5:
        method, round_est = "Submission", "Rd 3"
    elif winner_info["avgSigStr"] > 5 and confidence > 0.72:
        method, round_est = "KO/TKO", f"Rd {2 if confidence > 0.82 else 3}"
    else:
        method, round_est = "Decision", "Rd 5 (25:00)"

    # Top 3 factoren
    dif_feats = [(f, float(input_df[f].iloc[0])) for f in FEATURES if f.startswith("Dif")]
    sign = 1 if prediction == 1 else -1
    top3 = sorted([(f, sign * v) for f, v in dif_feats if sign * v > 0], key=lambda x: -x[1])[:3]
    factors = [{"label": f[3:].replace("Avg", "Avg ").replace("Recent", "Recent "), "delta": round(d, 2)} for f, d in top3]

    return {
        "winner":        winner_name,
        "loser":         loser_name,
        "confidence":    round(confidence * 100, 1),
        "winner_corner": winner_corner,
        "method":        method,
        "round":         round_est,
        "red_fighter":   red_info,
        "blue_fighter":  blue_info,
        "factors":       factors,
    }