from fastapi import FastAPI
from pydantic import BaseModel
from api.model import predict, features

app = FastAPI()

class FightInput(BaseModel):
    LoseStreakDif: float
    WinStreakDif: float
    LongestWinStreakDif: float
    WinDif: float
    LossDif: float
    TotalRoundDif: float
    TotalTitleBoutDif: float
    KODif: float
    SubDif: float
    HeightDif: float
    ReachDif: float
    AgeDif: float
    SigStrDif: float
    AvgSubAttDif: float
    AvgTDDif: float
    RedOdds: float
    BlueOdds: float

@app.get("/")
def root():
    return {"status": "MMA Predictor API draait!"}

@app.post("/predict")
def predict_fight(input: FightInput):
    result = predict(input.model_dump())
    return {"winner": result}