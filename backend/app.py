from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import os
import requests

app = FastAPI(title="Landslide Early Warning System - Production Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationNode(BaseModel):
    name: str
    lat: float
    lon: float
    slope_angle: float
    soil_moisture: float
    elevation_m: float
    soil_cohesion: float

model = None
if os.path.exists("rf_model.pkl"):
    with open("rf_model.pkl", "rb") as f:
        model = pickle.load(f)

API_KEY = "ebc6a4827f6ae7858fd0985b81bcfd54"

@app.get("/")
def home():
    return {"status": "Live", "service": "NER Landslide AI Engine"}

@app.post("/predict-risk")
def predict_landslide_risk(node: LocationNode):
    # Fetch live telemetry from OpenWeatherMap
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={node.lat}&lon={node.lon}&appid={API_KEY}&units=metric"
    response = requests.get(url).json()
    
    rainfall_mm = 0.0
    if "rain" in response and "1h" in response["rain"]:
        rainfall_mm = response["rain"]["1h"]
    
    status = "SAFE - Low Risk Detected"
    color = "green"
    alert_triggered = False
    
    if model:
        # Evaluate using all 5 geotechnical features
        features = [[rainfall_mm, node.slope_angle, node.soil_moisture, node.elevation_m, node.soil_cohesion]]
        prediction = model.predict(features)[0]
        if prediction == 1:
            status = "HIGH RISK - Immediate Attention Required"
            color = "red"
            alert_triggered = True

    return {
        "node_name": node.name,
        "prediction": status,
        "map_color": color,
        "alert_triggered": alert_triggered,
        "live_rainfall_mm": rainfall_mm,
        "location_temp": response.get("main", {}).get("temp", "N/A"),
        "weather_desc": response.get("weather", [{}])[0].get("description", "Clear / Normal")
    }