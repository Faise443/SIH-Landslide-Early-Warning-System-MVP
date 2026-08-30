import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle

# Generate a synthetic, scientifically bounded dataset representing NER mountainous terrain
# Features: [Rainfall (mm), Slope (deg), Moisture (%), Elevation (m), Soil_Cohesion (1-5)]
np.random.seed(42)
n_samples = 1500

rainfall = np.random.uniform(0, 250, n_samples)
slope = np.random.uniform(10, 80, n_samples)
moisture = np.random.uniform(20, 100, n_samples)
elevation = np.random.uniform(200, 3500, n_samples)
cohesion = np.random.uniform(1, 5, n_samples)

# Geotechnical Landslide Susceptibility Index calculation
# High risk occurs when rain, slope, and moisture are high while soil cohesion is low
susceptibility_score = (
    (0.35 * (rainfall / 250)) +
    (0.30 * (slope / 80)) +
    (0.25 * (moisture / 100)) +
    (0.10 * (elevation / 3500)) -
    (0.15 * (cohesion / 5))
)

# Binary classification threshold
y = np.where(susceptibility_score > 0.52, 1, 0)

X = pd.DataFrame({
    'rainfall_mm': rainfall,
    'slope_angle': slope,
    'soil_moisture': moisture,
    'elevation_m': elevation,
    'soil_cohesion': cohesion
})

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the Random Forest Classifier
rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
print(f"✅ Retrained Model Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")

# Export retrained model
with open("rf_model.pkl", "wb") as f:
    pickle.dump(rf_model, f)
print("✅ Saved retrained model to rf_model.pkl")