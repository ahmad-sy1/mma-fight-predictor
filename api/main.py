from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.model import predict_fight, get_fighter_info, ALL_FIGHTERS, FIGHTERS_SET

app = FastAPI(title="MMA Fight Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "total_fighters": len(ALL_FIGHTERS)}


@app.get("/fighters")
def search_fighters(q: str = ""):
    """Autocomplete: geeft namen terug die matchen met de zoekterm."""
    if not q or len(q) < 2:
        return {"fighters": ALL_FIGHTERS[:20]}
    q_lower = q.lower()
    results = [n for n in ALL_FIGHTERS if q_lower in n.lower()]
    return {"fighters": results[:15]}


@app.get("/fighters/{name}")
def get_fighter(name: str):
    """Statistieken voor één specifieke vechter."""
    if name not in FIGHTERS_SET:
        raise HTTPException(status_code=404, detail=f"Vechter niet gevonden: {name}")
    return get_fighter_info(name)


class PredictRequest(BaseModel):
    red_fighter: str
    blue_fighter: str


@app.post("/predict")
def predict(req: PredictRequest):
    """Voorspel de winnaar op basis van twee namen."""
    if req.red_fighter not in FIGHTERS_SET:
        raise HTTPException(status_code=404, detail=f"Vechter niet gevonden: {req.red_fighter}")
    if req.blue_fighter not in FIGHTERS_SET:
        raise HTTPException(status_code=404, detail=f"Vechter niet gevonden: {req.blue_fighter}")
    if req.red_fighter == req.blue_fighter:
        raise HTTPException(status_code=400, detail="Kies twee verschillende vechters")
    return predict_fight(req.red_fighter, req.blue_fighter)