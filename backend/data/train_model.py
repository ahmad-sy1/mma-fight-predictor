"""
Train RandomForestClassifier op ufc_clean.csv (eigen pipeline).
Slaat op als models/model_v4.pkl + models/feature_names_v4.json
"""
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib, json

BASE_DIR = Path(__file__).resolve().parent.parent

df = pd.read_csv(BASE_DIR / 'data' / 'ufc_clean.csv')
print(f"Dataset: {df.shape}")
print(f"Winner verdeling:\n{df['Winner'].value_counts()}")

with open(BASE_DIR / 'models' / 'feature_names_v4.json') as f:
    features = json.load(f)

# Alleen rijen zonder NaN in features of target
df_model = df[features + ['Winner']].dropna()
print(f"\nRijen na dropna: {len(df_model)}")

X = df_model[features]
y = (df_model['Winner'] == 'Red').astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train: {X_train.shape}  Test: {X_test.shape}")

model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

accuracy = accuracy_score(y_test, model.predict(X_test))
print(f"\nAccuraatheid: {accuracy:.2%}")

joblib.dump(model, BASE_DIR / 'models' / 'model_v4.pkl')
print(f"\n✅ Model opgeslagen → backend/models/model_v4.pkl")
print(f"   Features: {len(features)}")