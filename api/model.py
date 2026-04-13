import joblib
import pandas as pd

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
model = joblib.load(BASE_DIR / 'models' / 'model.pkl')

features = [
    'LoseStreakDif', 'WinStreakDif', 'LongestWinStreakDif',
    'WinDif', 'LossDif', 'TotalRoundDif', 'TotalTitleBoutDif',
    'KODif', 'SubDif', 'HeightDif', 'ReachDif', 'AgeDif',
    'SigStrDif', 'AvgSubAttDif', 'AvgTDDif', 'RedOdds', 'BlueOdds'
]

def predict(input_data: dict) -> str:
    df = pd.DataFrame([input_data])
    df = df[features]
    result = model.predict(df)
    return result[0]