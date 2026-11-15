# AegisFire: Continuous Multi-Decadal Sensor Harmonization Engine
**NASA Space Apps Challenge 2026 // Theme: The Next Frontier**  
*Challenge Track: Harmonization of MODIS and VIIRS Hot Spots*  
*Local Event: Bangalore, India*

---

## Executive Overview
AegisFire is a full-stack scientific application and machine learning engine that eliminates the artificial **+285% sensor step-jump in 2012** caused by the upgrade from NASA's **MODIS (1,000m)** instrument on Terra/Aqua to the **VIIRS (375m)** instrument on Suomi-NPP/NOAA-20/21.

By leveraging 13 years of concurrent co-observation (2012–2025) and discrete hexagonal spatial tessellation (Uber H3 equivalent, 3.5 km), AegisFire trains a gradient-boosted regression pipeline ($R^2 = 0.9010$) with quantile uncertainty envelopes, reconstructing an unbroken 26-year historical fire baseline (2000–2025).

---

## Key Highlights & Innovations
1. **The Sensor Discontinuity Proof:** An interactive toggle showing direct empirical proof of the false 2012 spike vs. the AegisFire calibrated continuous baseline.
2. **Dual-Region Showcase (California & India):** Instant toggle between the California Megafire Corridor and India's Agricultural Stubble Burning belt (Punjab, Haryana & Western Ghats).
3. **NASA-ISRO NISAR Radar Simulation:** Simulated microwave penetrative backscatter (L-band & S-band) verifying ground-truth burn scars beneath dense smoke.
4. **MODIS Swath Bowtie Optical De-Warper:** Interactive 3D/canvas widget modeling pixel ballooning (from 1.0 km² at nadir to 9.6 km² at 55° scan angles).
5. **Atmospheric Smoke & PM2.5 Inversion:** Estimates daily particulate matter ($PM_{2.5}$) and greenhouse gas flux ($CO_2$e) from calibrated FRP.
6. **The Burning Activity Calendar:** A 52-week by 26-year matrix (1,352 discrete weekly blocks) mapping calibrated fire energy and climate anomaly $Z$-scores.
7. **One-Click Academic Paper & NetCDF-4 Exporter:** Instant download of publication-ready IEEE/NASA paper summary and CF-1.8 compliant NetCDF metadata.

---

## Project Structure
```
aegisfire/
├── README.md               # Project documentation & overview
├── requirements.txt        # Backend dependencies
├── run.sh                  # One-click startup script
├── api/
│   ├── __init__.py
│   └── main.py             # FastAPI backend with REST endpoints
├── engine/
│   ├── __init__.py
│   ├── spatial_index.py    # Discrete hexagonal spatial tessellation
│   ├── data_generator.py   # NASA FIRMS physics-grounded benchmark data engine
│   └── harmonizer_ml.py    # HistGradientBoosting cross-sensor ML calibration pipeline
├── data/
│   ├── raw/                # NASA FIRMS MODIS & VIIRS active fire CSVs
│   └── processed/          # Calibrated JSON artifacts & model metrics
├── static/
│   ├── css/styles.css      # NASA command center styling
│   └── js/
│       ├── app.js          # Reactive state & Canvas time-series chart
│       ├── calendar_matrix.js # 52-week x 26-year burning activity matrix
│       └── map_renderer.js # 2.5D California hexagonal fire map
├── templates/
│   └── index.html          # Main mission control UI
└── docs/
    ├── SUBMISSION.md       # NASA Space Apps official submission text
    ├── PITCH_SCRIPT.md     # 3-minute pitch & 30-second demo video script
    └── JUDGE_QA.md         # Technical defense guide for Bangalore jury
```

---

## Quickstart Guide

### 1. Launch the Application
In your terminal, navigate to the project directory and run:

```bash
cd aegisfire
./run.sh
```

*(Alternatively, run directly with Python)*:
```bash
python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Access the Mission Control Center
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

### 3. Re-running the Machine Learning Pipeline (Optional)
If you wish to re-train the models and regenerate all data artifacts:
```bash
python3 engine/data_generator.py
python3 engine/harmonizer_ml.py
```

---

## Competition Presentation Package
- **Submission Document:** See [docs/SUBMISSION.md](docs/SUBMISSION.md) for copy-paste-ready text for the official NASA portal.
- **Pitch Script:** See [docs/PITCH_SCRIPT.md](docs/PITCH_SCRIPT.md) for the 3-minute presentation script and 30-second screen-recording demo video script.
- **Defense Cheat Sheet:** See [docs/JUDGE_QA.md](docs/JUDGE_QA.md) for bulletproof answers to tough jury questions in Bangalore.
