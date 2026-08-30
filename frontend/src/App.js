import React, { useState } from 'react';
import MapDashboard from './MapDashboard';

function App() {
  const [language, setLanguage] = useState('en');

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>
          {language === 'en' ? "NER Landslide Early Warning System" : "NER ভূমিধস পূর্ব সতর্কতা সিস্টেম"}
        </h2>
        <button 
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          style={{ padding: "10px", cursor: "pointer", backgroundColor: "#007BFF", color: "white", border: "none", borderRadius: "5px" }}
        >
          {language === 'en' ? "Translate to Bengali" : "Translate to English"}
        </button>
      </div>

      <hr />

      <MapDashboard language={language} />

      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
        <h3>{language === 'en' ? "Live System Logs" : "লাইভ সিস্টেম লগ"}</h3>
        <p>📡 Connected to backend API</p>
        <p>🧠 AI Model: Random Forest</p>
        <p>✅ Map Layer: OpenStreetMap</p>
      </div>
    </div>
  );
}

export default App;
