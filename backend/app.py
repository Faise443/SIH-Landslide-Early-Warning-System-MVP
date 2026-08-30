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


# Load trained AI model
model = None

if os.path.exists("rf_model.pkl"):
    with open("rf_model.pkl", "rb") as f:
        model = pickle.load(f)


# Get OpenWeather API key from Render Environment Variables
API_KEY = os.getenv("OPENWEATHER_API_KEY")


@app.get("/")
def home():
    return {
        "status": "Live",
        "service": "NER Landslide AI Engine"
    }


@app.post("/predict-risk")
def predict_landslide_risk(node: LocationNode):

    # Check API key
    if not API_KEY:
        return {
            "node_name": node.name,
            "prediction": "Weather data unavailable",
            "map_color": "orange",
            "alert_triggered": False,
            "live_rainfall_mm": 0.0,
            "location_temp": "N/A",
            "weather_desc": "OpenWeather API key is not configured"
        }

    # OpenWeatherMap request
    url = "https://api.openweathermap.org/data/2.5/weather"

    params = {
        "lat": node.lat,
        "lon": node.lon,
        "appid": API_KEY,
        "units": "metric"
    }

    try:
        weather_response = requests.get(
            url,
            params=params,
            timeout=10
        )

        # Check if OpenWeather rejected the request
        if weather_response.status_code != 200:
            return {
                "node_name": node.name,
                "prediction": "Weather data unavailable",
                "map_color": "orange",
                "alert_triggered": False,
                "live_rainfall_mm": 0.0,
                "location_temp": "N/A",
                "weather_desc": f"OpenWeather error: {weather_response.status_code}"
            }

        response = weather_response.json()

    except requests.RequestException as error:
        print("OpenWeather request error:", error)

        return {
            "node_name": node.name,
            "prediction": "Weather data unavailable",
            "map_color": "orange",
            "alert_triggered": False,
            "live_rainfall_mm": 0.0,
            "location_temp": "N/A",
            "weather_desc": "Unable to connect to weather service"
        }

    # Extract rainfall
    rainfall_mm = 0.0

    if "rain" in response and "1h" in response["rain"]:
        rainfall_mm = response["rain"]["1h"]

    # Default risk
    status = "SAFE - Low Risk Detected"
    color = "green"
    alert_triggered = False

    # AI prediction
    if model is not None:

        features = [[
            rainfall_mm,
            node.slope_angle,
            node.soil_moisture,
            node.elevation_m,
            node.soil_cohesion
        ]]

        prediction = model.predict(features)[0]

        if prediction == 1:
            status = "HIGH RISK - Immediate Attention Required"
            color = "red"
            alert_triggered = True

    # Return complete result
    return {
        "node_name": node.name,
        "prediction": status,
        "map_color": color,
        "alert_triggered": alert_triggered,
        "live_rainfall_mm": rainfall_mm,
        "location_temp": response.get("main", {}).get("temp", "N/A"),
        "weather_desc": response.get("weather", [{}])[0].get(
            "description",
            "Clear / Normal"
        )
    }