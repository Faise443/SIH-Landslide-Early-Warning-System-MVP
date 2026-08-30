import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';

const LocationClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const MapDashboard = ({ language }) => {
  const [authorityNodes, setAuthorityNodes] = useState([]);
  const [citizenNode, setCitizenNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const nerCenter = [26.1158, 91.7086];

  const vulnerableNodes = [
    { name: "Guwahati, Assam", lat: 26.1158, lon: 91.7086, slope_angle: 35, soil_moisture: 55, elevation_m: 55, soil_cohesion: 4.2 },
    { name: "Shillong, Meghalaya", lat: 25.5788, lon: 91.8933, slope_angle: 65, soil_moisture: 88, elevation_m: 1525, soil_cohesion: 2.1 },
    { name: "Cherrapunji, Meghalaya", lat: 25.2702, lon: 91.7323, slope_angle: 75, soil_moisture: 95, elevation_m: 1430, soil_cohesion: 1.8 },
    { name: "Kohima, Nagaland", lat: 25.6701, lon: 94.1077, slope_angle: 58, soil_moisture: 78, elevation_m: 1444, soil_cohesion: 2.5 },
    { name: "Gangtok, Sikkim", lat: 27.3314, lon: 88.6138, slope_angle: 70, soil_moisture: 82, elevation_m: 1650, soil_cohesion: 1.9 }
  ];

  const fetchAuthorityRisks = async () => {
    try {
      const promises = vulnerableNodes.map(async (node) => {
        const response = await axios.post(
          'https://sih-landslide-early-warning-system-mvp.onrender.com/predict-risk',
          node
        );
        return { ...node, ...response.data };
      });

      const results = await Promise.all(promises);
      setAuthorityNodes(results);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching authority predictions:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  fetchAuthorityRisks();
  const interval = setInterval(fetchAuthorityRisks, 60000);
  return () => clearInterval(interval);
}, []);

  const evaluateCoordinates = async (name, lat, lon) => {
    setLoading(true);

    try {
      const payload = {
        name: name,
        lat: lat,
        lon: lon,
        slope_angle: 55,
        soil_moisture: 80,
        elevation_m: 900,
        soil_cohesion: 2.5
      };

      const response = await axios.post(
        'https://sih-landslide-early-warning-system-mvp.onrender.com/predict-risk',
        payload
      );

      setCitizenNode({ ...payload, ...response.data });
    } catch (error) {
      console.error("Error evaluating citizen location:", error);
    }

    setLoading(false);
  };

  const handleMapClick = (latlng) => {
    evaluateCoordinates(
      `Custom Point (${latlng.lat.toFixed(2)}, ${latlng.lng.toFixed(2)})`,
      latlng.lat,
      latlng.lng
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Expanded database of North Eastern towns and hill stations
    const coordsMap = {
      "itanagar": { lat: 27.0844, lon: 93.6053 },
      "agartala": { lat: 23.8315, lon: 91.2868 },
      "imphal": { lat: 24.8170, lon: 93.9368 },
      "aizawl": { lat: 23.7271, lon: 92.7176 },
      "tura": { lat: 25.5141, lon: 90.2023 },
      "silchar": { lat: 24.8333, lon: 92.7789 },
      "dibrugarh": { lat: 27.4728, lon: 94.9120 },
      "jorhat": { lat: 26.7509, lon: 94.2037 },
      "tezpur": { lat: 26.6528, lon: 92.7926 },
      "tawang": { lat: 27.5861, lon: 91.8601 },
      "dimapur": { lat: 25.9094, lon: 93.7273 },
      "mokokchung": { lat: 26.3323, lon: 94.5246 },
      "pelling": { lat: 27.3013, lon: 88.2323 },
      "namchi": { lat: 27.1667, lon: 88.3500 },
      "lunglei": { lat: 22.8879, lon: 92.7441 },
      "churachandpur": { lat: 24.3413, lon: 93.6744 },
      "udaipur": { lat: 23.5358, lon: 91.4851 },
      "jowai": { lat: 25.5978, lon: 92.2036 },
      "ziro": { lat: 27.5501, lon: 93.8317 },
      "pasighat": { lat: 28.0671, lon: 95.3283 },
      "karimganj": { lat: 24.8680, lon: 92.3577 },
      "bongaigaon": { lat: 26.4735, lon: 90.5486 },
      "diphu": { lat: 25.8454, lon: 93.4363 }
    };

    const key = searchQuery.toLowerCase().trim();

    if (coordsMap[key]) {
      evaluateCoordinates(
        searchQuery.toUpperCase(),
        coordsMap[key].lat,
        coordsMap[key].lon
      );
    } else {
      alert(
        `Town not found in quick-index. Please click directly on the map near your location, or search major towns like Tawang, Ziro, Silchar, Dimapur, Pasighat, etc.`
      );
    }
  };

  const translations = {
    en: {
      authTitle: "🛡️ Authority Dashboard: Automated Regional Risk Surveillance",
      citizenTitle: "🔍 Citizen Portal: Search Town or Click Map",
      searchPlaceholder: "Search town (e.g. Tawang, Ziro, Silchar)...",
      searchBtn: "Check Risk",
      clickTip: "Or click anywhere on the map to evaluate coordinates.",
      popupTitle: "Risk Status",
      rain: "Live Rainfall",
      temp: "Temperature",
      weather: "Weather"
    },

    bn: {
      authTitle: "🛡️ কর্তৃপক্ষ ড্যাশবোর্ড: স্বয়ংক্রিয় আঞ্চলিক ঝুঁকি পর্যবেক্ষণ",
      citizenTitle: "🔍 নাগরিক পোর্টাল: শহর খুঁজুন বা মানচিত্রে ক্লিক করুন",
      searchPlaceholder: "শহর খুঁজুন...",
      searchBtn: "ঝুঁকি পরীক্ষা করুন",
      clickTip: "অথবা মানচিত্রে ক্লিক করে স্থানাঙ্ক পরীক্ষা করুন।",
      popupTitle: "ঝুঁকির অবস্থা",
      rain: "লাইভ বৃষ্টি",
      temp: "তাপমাত্রা",
      weather: "আবহাওয়া"
    }
  };

  const t = translations[language] || translations.en;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
          marginBottom: "15px"
        }}
      >

        <div
          style={{
            padding: "12px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            border: "1px solid #90caf9"
          }}
        >
          <h4
            style={{
              margin: "0 0 5px 0",
              color: "#0d47a1",
              fontSize: "14px"
            }}
          >
            {t.authTitle}
          </h4>

          <span style={{ fontSize: "12px", color: "#333" }}>
            Monitoring 5 high-priority regional nodes. Auto-updates every 60s.
          </span>
        </div>

        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            borderRadius: "8px",
            border: "1px solid #a5d6a7"
          }}
        >
          <h4
            style={{
              margin: "0 0 5px 0",
              color: "#1b5e20",
              fontSize: "14px"
            }}
          >
            {t.citizenTitle}
          </h4>

          <form
            onSubmit={handleSearchSubmit}
            style={{ display: "flex", gap: "5px" }}
          >
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "12px",
                flex: 1
              }}
            />

            <button
              type="submit"
              style={{
                padding: "4px 10px",
                backgroundColor: "#2e7d32",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              {t.searchBtn}
            </button>
          </form>

          <div
            style={{
              fontSize: "11px",
              color: "#555",
              marginTop: "4px"
            }}
          >
            {t.clickTip} {loading && "⏳ Analyzing..."}
          </div>
        </div>
      </div>

      <div
        style={{
          height: "460px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          border: "2px solid #333"
        }}
      >
        <MapContainer
          center={nerCenter}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <LocationClickHandler onMapClick={handleMapClick} />

          {authorityNodes.map((data, index) => (
            <CircleMarker
              key={index}
              center={[data.lat, data.lon]}
              pathOptions={{
                color: "#0d47a1",
                fillColor: data.map_color,
                fillOpacity: 0.6
              }}
              radius={26}
            >
              <Popup>
                <strong
                  style={{
                    fontSize: "15px",
                    color: "#0d47a1"
                  }}
                >
                  [Authority Node] {data.name}
                </strong>

                <br />
                <hr style={{ margin: "5px 0" }} />

                <strong>{t.popupTitle}:</strong> {data.prediction}
                <br />
                <br />

                <strong>{t.weather}:</strong> {data.weather_desc}
                <br />

                <strong>{t.rain}:</strong> {data.live_rainfall_mm} mm
                <br />

                <strong>{t.temp}:</strong> {data.location_temp} °C
              </Popup>
            </CircleMarker>
          ))}

          {citizenNode && (
            <CircleMarker
              center={[citizenNode.lat, citizenNode.lon]}
              pathOptions={{
                color: "#d32f2f",
                fillColor: citizenNode.map_color,
                fillOpacity: 0.8
              }}
              radius={32}
            >
              <Popup>
                <strong
                  style={{
                    fontSize: "15px",
                    color: "#d32f2f"
                  }}
                >
                  [Citizen Check] {citizenNode.name}
                </strong>

                <br />
                <hr style={{ margin: "5px 0" }} />

                <strong>{t.popupTitle}:</strong> {citizenNode.prediction}
                <br />
                <br />

                <strong>{t.weather}:</strong> {citizenNode.weather_desc}
                <br />

                <strong>{t.rain}:</strong> {citizenNode.live_rainfall_mm} mm
                <br />

                <strong>{t.temp}:</strong> {citizenNode.location_temp} °C
              </Popup>
            </CircleMarker>
          )}

        </MapContainer>
      </div>
    </div>
  );
};

export default MapDashboard;