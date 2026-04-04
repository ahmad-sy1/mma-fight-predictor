# Week 1 — Pandas

## Doel
De UFC dataset inladen, begrijpen en opschonen zodat hij klaar is voor het model.

---

## Do 26 mrt — Dataset downloaden + inladen

### Wat ik geleerd heb
- Hoe je een Kaggle dataset downloadt en in een project plaatst
- Hoe je een CSV inlaadt met Pandas (`pd.read_csv`)
- Hoe je snel een overzicht krijgt van je data met `.shape`, `.head()`, `.columns`

### Wat ik gebouwd heb
- Jupyter Notebook aangemaakt: `notebooks/01_data_verkenning.ipynb`
- Dataset ingeladen: `ufc-master.csv` (6528 rijen, 118 kolommen)

### Problemen + oplossingen
- `python` commando werkte niet op Mac → oplossing: `python3` gebruiken
- `.idea/` map werd per ongeluk gecommit → `.gitignore` bijgewerkt

---

## Vr 27 mrt — Data bekijken + opschonen

### Wat ik geleerd heb
- Hoe je ontbrekende waarden detecteert met `.isnull().sum()`
- Hoe je kolommen verwijdert met `.drop()`
- Hoe je rijen met ontbrekende waarden verwijdert met `.dropna()`
- Hoe je een opgeschoonde dataset opslaat met `.to_csv()`

### Wat ik gebouwd heb
- 47 overbodige kolommen verwijderd (ranking kolommen met 97%+ missing data, post-fight uitkomst kolommen)
- Rijen met ontbrekende waarden verwijderd → van 6528 naar 5246 rijen
- Opgeslagen als: `data/ufc_clean.csv`

### Problemen + oplossingen
- `/data` map stond niet in `.gitignore` → toegevoegd zodat grote CSV bestanden niet worden gecommit

---

## Di 31 mrt — Kolommen selecteren als input voor het model

### Wat ik geleerd heb
- Welke kolommen nuttig zijn als features voor een ML model
- Verschil tussen features (input) en label (wat je wil voorspellen)

### Wat ik gebouwd heb
- Features geselecteerd op basis van statistieken zoals reach, win streak, knockouts etc.

### Geselecteerde features
_Vul hier de uiteindelijke lijst in_

---

## Bronnen
- [Pandas documentatie](https://pandas.pydata.org/docs/)
- [Kaggle dataset — mdabbert Ultimate UFC Dataset](https://www.kaggle.com/datasets/mdabbert/ultimate-ufc-dataset)