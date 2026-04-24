import joblib
import json
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

BASE_DIR = Path(__file__).resolve().parent.parent

model = joblib.load(BASE_DIR / 'models' / 'model.pkl')

with open(BASE_DIR / 'models' / 'feature_names.json') as f:
    FEATURES = json.load(f)

# Één dataset met alles: namen + statistieken
df = pd.read_csv(BASE_DIR / 'data' / 'ufc_clean.csv')

# Alle unieke vechtersnamen
red_names  = set(df['RedFighter'].dropna().unique())
blue_names = set(df['BlueFighter'].dropna().unique())
ALL_FIGHTERS = sorted(red_names | blue_names)
FIGHTERS_SET = set(ALL_FIGHTERS)

# Model accuracy berekenen op dezelfde test-split als tijdens training
_available = [f for f in FEATURES if f in df.columns]
_X = df[_available].fillna(0)
_y = df['Winner']
_, _X_test, _, _y_test = train_test_split(_X, _y, test_size=0.2, random_state=42)
MODEL_ACCURACY = round(float(accuracy_score(_y_test, model.predict(_X_test))) * 100, 2)
TOTAL_FIGHTS = len(df)

# Mapping: Dif feature -> (red kolom, blue kolom)
DIF_TO_COLS = {
    'LoseStreakDif':       ('RedCurrentLoseStreak',  'BlueCurrentLoseStreak'),
    'WinStreakDif':        ('RedCurrentWinStreak',    'BlueCurrentWinStreak'),
    'LongestWinStreakDif': ('RedLongestWinStreak',    'BlueLongestWinStreak'),
    'WinDif':              ('RedWins',                'BlueWins'),
    'LossDif':             ('RedLosses',              'BlueLosses'),
    'TotalRoundDif':       ('RedTotalRoundsFought',   'BlueTotalRoundsFought'),
    'TotalTitleBoutDif':   ('RedTotalTitleBouts',     'BlueTotalTitleBouts'),
    'KODif':               ('RedWinsByKO',            'BlueWinsByKO'),
    'SubDif':              ('RedWinsBySubmission',    'BlueWinsBySubmission'),
    'HeightDif':           ('RedHeightCms',           'BlueHeightCms'),
    'ReachDif':            ('RedReachCms',            'BlueReachCms'),
    'AgeDif':              ('RedAge',                 'BlueAge'),
    'SigStrDif':           ('RedAvgSigStrLanded',     'BlueAvgSigStrLanded'),
    'AvgSubAttDif':        ('RedAvgSubAtt',           'BlueAvgSubAtt'),
    'AvgTDDif':            ('RedAvgTDLanded',         'BlueAvgTDLanded'),
}

FEATURE_LABELS = {
    'SigStrDif':            ('Striking edge',       'Avg significant strikes per fight'),
    'AvgTDDif':             ('Grappling control',   'Avg takedowns landed per fight'),
    'WinDif':               ('Record superiority',  'Total wins differential'),
    'WinStreakDif':         ('Momentum',             'Current win streak advantage'),
    'ReachDif':             ('Reach advantage',      'Arm reach in centimetres'),
    'KODif':                ('Finishing power',      'KO wins differential'),
    'LongestWinStreakDif':  ('Peak form',            'Longest career win streak'),
    'AgeDif':               ('Age factor',           'Prime years vs experience'),
    'SubDif':               ('Submission threat',    'Submission wins differential'),
    'TotalRoundDif':        ('Durability',           'Total rounds fought'),
    'RedAvgSigStrLanded':   ('Striking output',      'Significant strikes per fight'),
    'BlueAvgSigStrLanded':  ('Striking output',      'Significant strikes per fight'),
    'RedAvgTDLanded':       ('Takedown game',        'Avg takedowns per fight'),
    'BlueAvgTDLanded':      ('Takedown game',        'Avg takedowns per fight'),
    'RedCurrentWinStreak':  ('Hot streak',           'Consecutive wins'),
    'BlueCurrentWinStreak': ('Hot streak',           'Consecutive wins'),
    'RedWins':              ('Experience',           'Total professional wins'),
    'BlueWins':             ('Experience',           'Total professional wins'),
}


def _mean_stat(name: str, red_col: str, blue_col: str, default: float = 0.0) -> float:
    """Gemiddelde van een statistiek voor een vechter over al zijn gevechten."""
    r = df.loc[df['RedFighter'] == name, red_col].dropna() \
        if red_col in df.columns else pd.Series(dtype=float)
    b = df.loc[df['BlueFighter'] == name, blue_col].dropna() \
        if blue_col in df.columns else pd.Series(dtype=float)
    combined = pd.concat([r, b])
    return float(combined.mean()) if len(combined) > 0 else default


def build_input(red_name: str, blue_name: str) -> pd.DataFrame:
    """Bouw de feature-rij voor het model op basis van twee namen."""
    row = {}
    for feat in FEATURES:
        if feat in DIF_TO_COLS:
            rc, bc = DIF_TO_COLS[feat]
            row[feat] = _mean_stat(red_name, rc, bc) - _mean_stat(blue_name, rc, bc)
        elif feat.startswith('Red'):
            rc = feat
            bc = 'Blue' + feat[3:]
            row[feat] = _mean_stat(red_name, rc, bc)
        elif feat.startswith('Blue'):
            rc = 'Red' + feat[4:]
            bc = feat
            row[feat] = _mean_stat(blue_name, rc, bc)
        elif feat == 'NumberOfRounds':
            row[feat] = 3.0
        elif feat in ('RedOdds', 'BlueOdds', 'BetterRank_encoded'):
            row[feat] = 0.0
        else:
            row[feat] = 0.0
    return pd.DataFrame([row])[FEATURES]


def get_fighter_info(name: str) -> dict:
    """Haal display-informatie op voor een vechter."""
    def stat(rc, bc, default=0.0):
        return _mean_stat(name, rc, bc, default)

    wins   = int(stat('RedWins', 'BlueWins'))
    losses = int(stat('RedLosses', 'BlueLosses'))
    total  = wins + losses

    stances = []
    if 'RedStance' in df.columns:
        stances += df.loc[df['RedFighter'] == name, 'RedStance'].dropna().tolist()
    if 'BlueStance' in df.columns:
        stances += df.loc[df['BlueFighter'] == name, 'BlueStance'].dropna().tolist()
    stance = max(set(stances), key=stances.count) if stances else 'Orthodox'

    wcs = []
    if 'WeightClass' in df.columns:
        wcs += df.loc[df['RedFighter'] == name, 'WeightClass'].dropna().tolist()
        wcs += df.loc[df['BlueFighter'] == name, 'WeightClass'].dropna().tolist()
    weight_class = max(set(wcs), key=wcs.count) if wcs else '—'

    return {
        'name':        name,
        'record':      f"{wins}-{losses}-0",
        'wins':        wins,
        'losses':      losses,
        'winRate':     round(wins / total * 100, 1) if total > 0 else 0,
        'age':         int(stat('RedAge', 'BlueAge', 28)),
        'heightCms':   round(stat('RedHeightCms', 'BlueHeightCms', 175), 1),
        'reachCms':    round(stat('RedReachCms', 'BlueReachCms', 180), 1),
        'stance':      stance,
        'weightClass': weight_class,
        'avgSigStr':   round(stat('RedAvgSigStrLanded', 'BlueAvgSigStrLanded'), 2),
        'avgTD':       round(stat('RedAvgTDLanded', 'BlueAvgTDLanded'), 2),
    }


def predict_fight(red_name: str, blue_name: str) -> dict:
    """Voorspel de winnaar + geef volledige response voor de frontend."""
    input_df = build_input(red_name, blue_name)

    prediction = model.predict(input_df)[0]
    probas     = model.predict_proba(input_df)[0]
    classes    = list(model.classes_)
    confidence = float(probas[classes.index(prediction)])

    winner_name = red_name if prediction == 'Red' else blue_name
    loser_name  = blue_name if prediction == 'Red' else red_name

    # Alleen Dif-features gebruiken voor factors (dit zijn echte voor/nadelen)
    sign = 1 if prediction == 'Red' else -1
    contribs = [
        (feat, sign * float(input_df[feat].iloc[0]))
        for feat in FEATURES
        if feat in input_df.columns and feat in DIF_TO_COLS
    ]
    top3 = sorted([(f, v) for f, v in contribs if v > 0], key=lambda x: -x[1])[:3]

    factors = []
    for feat, delta in top3:
        label, sub = FEATURE_LABELS.get(feat, (feat, ''))
        factors.append({'label': label, 'sub': sub, 'delta': round(delta, 2)})

    red_info    = get_fighter_info(red_name)
    blue_info   = get_fighter_info(blue_name)
    winner_info = red_info if prediction == 'Red' else blue_info

    if winner_info['avgTD'] > 1.5:
        method, round_est = 'Submission', 'Rd 3'
    elif winner_info['avgSigStr'] > 5 and confidence > 0.72:
        method, round_est = 'KO/TKO', f"Rd {2 if confidence > 0.82 else 3}"
    else:
        method, round_est = 'Decision', 'Rd 5 (25:00)'

    return {
        'winner':        winner_name,
        'loser':         loser_name,
        'confidence':    round(confidence * 100, 1),
        'winner_corner': prediction.lower(),
        'method':        method,
        'round':         round_est,
        'red_fighter':   red_info,
        'blue_fighter':  blue_info,
        'factors':       factors,
    }