# Week 2 — scikit-learn & Model trainen

## Doel
Een ML model trainen dat voorspelt wie een UFC gevecht wint, en de accuracy meten.

---

## Wo 1 apr — Wat is ML? Data splitsen

### Wat ik geleerd heb
- Wat machine learning is: patronen leren uit historische data
- Verschil tussen training set en test set
- Hoe je data splitst met `train_test_split`

### Wat ik gebouwd heb
- Data gesplitst: 80% training, 20% test
- Features (X) en label (y) gedefinieerd

### Problemen + oplossingen
_Vul hier in wat je tegenkwam_

---

## Vr 3 apr — Eerste model trainen

### Wat ik geleerd heb
- Hoe een Random Forest werkt (simpel: veel beslisbomen die samen stemmen)
- Hoe je een model traint met `.fit()`
- Hoe je een voorspelling doet met `.predict()`

### Wat ik gebouwd heb
- Random Forest v1 getraind → **61.62% accuracy** (15 features)
- XGBoost getraind → **57.81% accuracy**
- Random Forest v2 getraind → **63.52% accuracy** (meer features) ← beste model

### Model versies overzicht

| Versie | Model | Features | Accuracy |
|---|---|---|---|
| v1 | Random Forest | 15 Dif features | 61.62% |
| v2 | Random Forest | Meer features | **63.52%** |
| v3 | Random Forest | BetterRank + 300 bomen | 62.95% |
| v4 | Random Forest | NumberOfRounds verwijderd | 62.57% |
| XGBoost | XGBoost | - | 57.81% |

### Problemen + oplossingen
_Vul hier in wat je tegenkwam_

---

## Ma 6 apr — Model testen

### Wat ik geleerd heb
_Vul hier in_

### Wat ik gebouwd heb
_Vul hier in_

---

## Di 7 apr — Model opslaan

### Wat ik geleerd heb
- Hoe je een getraind model opslaat met `joblib` of `pickle`

### Wat ik gebouwd heb
_Vul hier in_

---

## Accuracy plafond zonder odds
Uit onderzoek blijkt dat vergelijkbare projecten zonder kansen/odds uitkomen op 63–66% accuracy. Met odds erbij stijgt dit naar ~70%+. Mijn beste model (63.52%) zit dus al op het verwachte plafond.

## Ideeën om accuracy te verbeteren
- [ ] **Odds toevoegen** → verwachte winst: +5-8%
- [ ] **Stacking** (RF + XGBoost + meta-model) → +1-3%
- [ ] **SMOTE** (dataset balanceren) → +1-2%
- [ ] **Rolling averages** (vorm laatste 5 gevechten) → +2-4%
- [ ] **Deep Learning** (Keras/TensorFlow) → tot +10%

---

## Bronnen
- [scikit-learn documentatie](https://scikit-learn.org/stable/)
- [Random Forest uitleg (simpel)](https://www.youtube.com/results?search_query=random+forest+explained+simply)