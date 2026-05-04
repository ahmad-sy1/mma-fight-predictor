"""
Train RandomForestClassifier on ufc_clean_v2.csv and save to models/.
Uses the same feature set as notebooks/02_model_training.ipynb,
minus odds (not available in new raw data).
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib, json

df = pd.read_csv('data/ufc_clean_v2.csv')
print(f"Dataset: {df.shape}")
print(f"Winner distribution:\n{df['Winner'].value_counts()}")

features = [
    # Differentials
    'LoseStreakDif', 'WinStreakDif', 'LongestWinStreakDif',
    'WinDif', 'LossDif', 'TotalRoundDif', 'TotalTitleBoutDif',
    'KODif', 'SubDif', 'HeightDif', 'ReachDif', 'AgeDif',
    'SigStrDif', 'AvgSubAttDif', 'AvgTDDif',
    # Individual Red stats
    'RedCurrentWinStreak', 'RedCurrentLoseStreak', 'RedAvgSigStrLanded',
    'RedAvgSigStrPct', 'RedAvgTDLanded', 'RedAvgTDPct',
    'RedWins', 'RedLosses', 'RedHeightCms', 'RedReachCms',
    # Individual Blue stats
    'BlueCurrentWinStreak', 'BlueCurrentLoseStreak', 'BlueAvgSigStrLanded',
    'BlueAvgSigStrPct', 'BlueAvgTDLanded', 'BlueAvgTDPct',
    'BlueWins', 'BlueLosses', 'BlueHeightCms', 'BlueReachCms',
]

# Drop rows with NaN in any feature or target
df_model = df[features + ['Winner']].dropna()
print(f"\nRows na dropna: {len(df_model)}")

X = df_model[features]
y = df_model['Winner']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train: {X_train.shape}  Test: {X_test.shape}")

model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\nAccuraatheid: {accuracy:.2%}")

joblib.dump(model, 'models/model_v2.pkl')
with open('models/feature_names_v2.json', 'w') as f:
    json.dump(features, f)

print(f"\n✅ Model opgeslagen → models/model_v2.pkl")
print(f"✅ Features opgeslagen → models/feature_names_v2.json")
print(f"   Aantal features: {len(features)}")