# Beslissingen log

Dit bestand legt vast *waarom* bepaalde keuzes zijn gemaakt.
Handig voor je portfolio en voor als je later vergeet waarom je iets deed.

---

## Dataset keuze — mdabbert Ultimate UFC Dataset

**Keuze:** mdabbert dataset van Kaggle (`ufc-master.csv` + `upcoming.csv`)

**Waarom:**
- Bevat gambling odds als feature → hogere voorspelbaarheid (~70%+)
- Heeft een `upcoming.csv` met aankomende gevechten
- Wordt actief bijgehouden door de maker
- Alternatief (Amine Alibi dataset) was minder recent en had geen odds

---

## IDE keuze — PyCharm Professional

**Keuze:** PyCharm in plaats van Jupyter in de browser

**Waarom:**
- Betere integratie met virtual environments
- Vertrouwder gevoel als developer (vs. browser-based notebooks)
- Jupyter Notebook werkt ook gewoon binnen PyCharm

---

## Model keuze — Random Forest boven XGBoost

**Keuze:** Random Forest als primair model

**Waarom:**
- Random Forest v2 haalde 63.52% — beter dan XGBoost (57.81%)
- Random Forest is makkelijker te begrijpen en te debuggen als beginner
- XGBoost kan later nog worden toegevoegd als onderdeel van stacking

---

_Voeg hier nieuwe beslissingen toe als je ze maakt_