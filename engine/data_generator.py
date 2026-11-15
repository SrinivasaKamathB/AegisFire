"""
AegisFire: Multi-Region NASA FIRMS Data Engine
Supports both California (Western US Megafires) and India/South Asia
(Punjab/Haryana Agricultural Stubble Burning & Western Ghats Forest Fires).
"""

import os
import math
import random
import numpy as np
import pandas as pd
from typing import Tuple

HISTORICAL_CALIFORNIA_EPISODES = [
    {"name": "2003 Cedar Fire", "year": 2003, "month": 10, "lat": 32.95, "lon": -116.85, "scale": 1.8},
    {"name": "2007 SoCal Siege (Witch Creek)", "year": 2007, "month": 10, "lat": 33.12, "lon": -116.92, "scale": 2.2},
    {"name": "2008 NorCal Lightning Siege", "year": 2008, "month": 6, "lat": 40.05, "lon": -121.45, "scale": 2.5},
    {"name": "2013 Rim Fire", "year": 2013, "month": 8, "lat": 37.86, "lon": -119.98, "scale": 2.1},
    {"name": "2017 Tubbs & Wine Country Fires", "year": 2017, "month": 10, "lat": 38.45, "lon": -122.75, "scale": 2.4},
    {"name": "2018 Camp Fire (Paradise)", "year": 2018, "month": 11, "lat": 39.81, "lon": -121.44, "scale": 3.0},
    {"name": "2020 August Complex Gigafire", "year": 2020, "month": 8, "lat": 39.85, "lon": -122.95, "scale": 4.5},
    {"name": "2021 Dixie Fire", "year": 2021, "month": 7, "lat": 40.03, "lon": -121.38, "scale": 3.8},
    {"name": "2022 McKinney Fire", "year": 2022, "month": 7, "lat": 41.85, "lon": -122.88, "scale": 1.9},
    {"name": "2024 Park Fire", "year": 2024, "month": 7, "lat": 39.88, "lon": -121.85, "scale": 3.2},
]

HISTORICAL_INDIA_EPISODES = [
    {"name": "2016 Punjab Post-Harvest Stubble Peak", "year": 2016, "month": 10, "lat": 30.90, "lon": 75.85, "scale": 3.2},
    {"name": "2018 Bandipur Tiger Reserve Forest Fire", "year": 2018, "month": 2, "lat": 11.66, "lon": 76.63, "scale": 2.1},
    {"name": "2019 Wayanad & Western Ghats Fire Episode", "year": 2019, "month": 2, "lat": 11.68, "lon": 76.13, "scale": 1.9},
    {"name": "2020 Indo-Gangetic Stubble Burning Spike", "year": 2020, "month": 11, "lat": 30.34, "lon": 76.38, "scale": 3.5},
    {"name": "2021 Similipal National Park Fires", "year": 2021, "month": 3, "lat": 21.88, "lon": 86.33, "scale": 2.4},
    {"name": "2023 Punjab-Haryana Stubble Fires", "year": 2023, "month": 10, "lat": 31.14, "lon": 75.34, "scale": 2.8},
]

def generate_region_datasets(region_id: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    modis_file = os.path.join(output_dir, f"modis_{region_id}_2000_2025.csv")
    viirs_file = os.path.join(output_dir, f"viirs_{region_id}_2012_2025.csv")

    random.seed(42 if region_id == "california" else 108)
    np.random.seed(42 if region_id == "california" else 108)

    if region_id == "india":
        clusters = [
            {"name": "Punjab/Haryana Stubble Belt", "center_lat": 30.8, "center_lon": 75.8, "radius": 1.4, "peak_month": 10.5, "intensity_mult": 4.5},
            {"name": "Indo-Gangetic Plain", "center_lat": 27.2, "center_lon": 80.5, "radius": 2.0, "peak_month": 11.0, "intensity_mult": 2.8},
            {"name": "Western Ghats / Karnataka", "center_lat": 13.5, "center_lon": 75.5, "radius": 1.5, "peak_month": 2.5, "intensity_mult": 2.0},
            {"name": "Central India / Madhya Pradesh", "center_lat": 22.8, "center_lon": 78.9, "radius": 1.8, "peak_month": 3.5, "intensity_mult": 2.2},
            {"name": "Eastern Ghats / Odisha", "center_lat": 19.5, "center_lon": 84.0, "radius": 1.6, "peak_month": 3.0, "intensity_mult": 2.4},
        ]
        episodes = HISTORICAL_INDIA_EPISODES
    else:
        clusters = [
            {"name": "Northern Sierra", "center_lat": 39.5, "center_lon": -121.2, "radius": 1.8, "peak_month": 8.5, "intensity_mult": 5.0},
            {"name": "Central Sierra", "center_lat": 37.5, "center_lon": -119.6, "radius": 1.5, "peak_month": 8.5, "intensity_mult": 4.5},
            {"name": "Southern Chaparral", "center_lat": 34.2, "center_lon": -118.4, "radius": 1.2, "peak_month": 9.5, "intensity_mult": 4.0},
            {"name": "Klamath / Shasta", "center_lat": 40.5, "center_lon": -123.0, "radius": 1.6, "peak_month": 8.0, "intensity_mult": 4.2},
        ]
        episodes = HISTORICAL_CALIFORNIA_EPISODES

    modis_records, viirs_records = [], []

    for year in range(2000, 2026):
        climate_factor = 1.0 + (year - 2000) * (0.022 if region_id == "california" else 0.028)
        year_episodes = [ep for ep in episodes if ep["year"] == year]

        for month in range(1, 13):
            # Sum seasonal multipliers across regional clusters
            for cluster in clusters:
                season_mult = math.exp(-0.5 * ((month - cluster["peak_month"]) / 1.5)**2) * cluster["intensity_mult"] + 0.08
                n_events = int(np.random.poisson(8 * season_mult * climate_factor))

                if year_episodes and any(ep["month"] == month for ep in year_episodes):
                    n_events += int(20 * sum(ep["scale"] for ep in year_episodes if ep["month"] == month))

                days_in_month = 28 if month == 2 else (30 if month in [4, 6, 9, 11] else 31)

                for _ in range(n_events):
                    day = random.randint(1, days_in_month)
                    date_str = f"{year}-{month:02d}-{day:02d}"
                    acq_time = f"{random.randint(5, 10):02d}{random.randint(0, 59):02d}"

                    base_lat = cluster["center_lat"] + np.random.normal(0, cluster["radius"] * 0.35)
                    base_lon = cluster["center_lon"] + np.random.normal(0, cluster["radius"] * 0.35)
                    
                    # Stubble burning has smaller area but intense short bursts
                    if region_id == "india" and "Stubble" in cluster["name"]:
                        true_fire_area_ha = float(np.random.lognormal(mean=1.5, sigma=0.8))
                        true_frp_mw = float(true_fire_area_ha * np.random.uniform(2.5, 6.0))
                    else:
                        true_fire_area_ha = float(np.random.lognormal(mean=2.8, sigma=1.1))
                        true_frp_mw = float(true_fire_area_ha * np.random.uniform(1.2, 4.5))

                    # 1. MODIS (1km)
                    modis_detect_prob = 1.0 / (1.0 + math.exp(-(true_frp_mw - 10.0) / 5.5))
                    if random.random() < modis_detect_prob:
                        scan_angle = min(55.0, max(0.0, abs(np.random.normal(24.0, 14.0))))
                        pixel_expansion = 1.0 + (scan_angle / 55.0)**2 * 3.5
                        measured_frp = true_frp_mw * np.random.uniform(0.75, 1.15)
                        brightness = 300.0 + min(180.0, true_frp_mw * 0.8)

                        modis_records.append({
                            "latitude": round(base_lat, 5),
                            "longitude": round(base_lon, 5),
                            "brightness": round(brightness, 1),
                            "scan": round(1.0 * math.sqrt(pixel_expansion), 2),
                            "track": round(1.0 * pixel_expansion, 2),
                            "acq_date": date_str,
                            "acq_time": acq_time,
                            "satellite": "Terra" if random.random() > 0.5 else "Aqua",
                            "instrument": "MODIS",
                            "confidence": min(100, int(50 + true_frp_mw * 0.4 + random.randint(-10, 15))),
                            "frp": round(measured_frp, 2)
                        })

                    # 2. VIIRS (375m)
                    if year >= 2012:
                        viirs_detect_prob = 1.0 / (1.0 + math.exp(-(true_frp_mw - 2.0) / 1.5))
                        if random.random() < viirs_detect_prob:
                            n_sub = max(1, int(round(true_fire_area_ha / 12.0) + random.randint(1, 3)))
                            n_sub = min(10, n_sub)

                            for _ in range(n_sub):
                                sub_lat = base_lat + np.random.normal(0, 0.003)
                                sub_lon = base_lon + np.random.normal(0, 0.003)
                                sub_frp = (true_frp_mw / n_sub) * np.random.uniform(0.85, 1.25)
                                sub_bright = 310.0 + min(200.0, sub_frp * 1.5)

                                viirs_records.append({
                                    "latitude": round(sub_lat, 5),
                                    "longitude": round(sub_lon, 5),
                                    "bright_ti4": round(sub_bright, 1),
                                    "scan": 0.38,
                                    "track": 0.38,
                                    "acq_date": date_str,
                                    "acq_time": acq_time,
                                    "satellite": "Suomi-NPP" if year < 2018 else "NOAA-20",
                                    "instrument": "VIIRS",
                                    "confidence": "nominal" if sub_frp < 15 else "high",
                                    "frp": round(sub_frp, 2)
                                })

    pd.DataFrame(modis_records).to_csv(modis_file, index=False)
    pd.DataFrame(viirs_records).to_csv(viirs_file, index=False)
    print(f"[{region_id.upper()}] Generated {len(modis_records)} MODIS & {len(viirs_records)} VIIRS records.")
    return modis_file, viirs_file

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(base_dir, "data", "raw")
    generate_region_datasets("california", out)
    generate_region_datasets("india", out)
