# AegisFire: Presentation Pitch & Video Scripts

---

## Part 1: The 30-Second Screen Recording Demo Video Script
*(Use this for the official 30-second video link required on the NASA submission portal. Record your screen while clicking through http://localhost:8000).*

- **[00:00 - 00:08] (Open on the Discontinuity Chart with "Raw Discontinuous View" active)**
  > *"When you look at 25 years of NASA active fire data, global fires appear to triple overnight in 2012. But that is an optical illusion caused by upgrading from 1-kilometer MODIS to 375-meter VIIRS."*
- **[00:08 - 00:18] (Click the "AegisFire Harmonized Baseline" toggle)**
  > *"Meet AegisFire. Using 13 years of concurrent satellite overlap and gradient-boosted machine learning, we harmonize the historical record. Watch the false 2012 jump vanish into a smooth, continuous 26-year baseline."*
- **[00:18 - 00:30] (Hover over the Burning Activity Calendar and click play on the California Hexagon Map)**
  > *"Our interactive Burning Activity Calendar maps 26 years of weekly climate anomalies, helping land managers track shifting fire seasons. AegisFire turns broken satellite data into continuous climate intelligence."*

---

## Part 2: The 3-Minute Live Presentation Script (For Bangalore Jury)

### Slide 1: Title & The Hook (0:00 - 0:35)
> *"Respected judges and fellow innovators. Over the last 25 years, NASA has deployed billions of dollars worth of Earth observation satellites to monitor planetary wildfires. But if you open NASA’s active fire database right now and plot global fire energy over time, you will encounter a catastrophic data anomaly: in the year 2012, fire counts artificially jump by nearly 300%."*
>
> *"Did our planet suddenly catch fire in 2012? No. NASA simply upgraded its sensors from the 1-kilometer MODIS instrument to the sharp 375-meter VIIRS sensor. This hardware upgrade fractured the historical record, leaving climate scientists without an honest, continuous 25-year baseline. My project, **AegisFire**, is the mathematical bridge that fixes this fracture."*

### Slide 2: The Architecture & Innovation (0:35 - 1:25)
> *"Harmonization does not mean plotting colored dots on a map. It requires solving three major physics bottlenecks:
> 1. First, **spatial misalignment**: MODIS and VIIRS pixels rarely land on the exact same latitude and longitude. I solved this by implementing **Uber H3-equivalent discrete hexagonal spatial tessellation** at 3.5 km resolution, ensuring uniform neighbor distances without diagonal grid distortion.
> 2. Second, **sensor physics**: MODIS suffers from sub-pixel attenuation and swath-edge pixel ballooning up to 5 kilometers, while VIIRS catches 1-megawatt smoldering burns.
> 3. Third, **machine learning transfer**: Because both sensors flew together from 2012 to 2025, I harvested over 5,500 co-located burning cells to train an ensemble **HistGradientBoosting Regressor**. The model maps MODIS Fire Radiative Power, scan zenith angles, and brightness temperatures to true VIIRS 375m equivalents with an **$R^2$ of 0.9010** and dual quantile confidence bounds."*

### Slide 3: The Live Demonstration (1:25 - 2:20)
> *(Demonstrate the dashboard)*
> *"Here is the live AegisFire dashboard. 
> Notice this toggle: in the raw uncalibrated view, you clearly see the false 2012 sensor break. When I switch to the **AegisFire Harmonized Baseline**, historical 2000–2011 fires are calibrated backwards, eliminating the step-jump and revealing true climate-driven aridity trends.
> 
> Below that is our **Burning Activity Calendar**—a 52-week by 26-year matrix. By calculating historical $Z$-score anomalies, land managers can instantly spot that California’s fire season has expanded by nearly 4 weeks over the last two decades.
> 
> Finally, our **2.5D Hexagonal Spatial Map** allows users to scrub across 26 years of historical fire seasons, tracking clusters like the 2018 Camp Fire and 2020 August Complex with verified sensor reconciliation."*

### Slide 4: Impact & Summary (2:20 - 3:00)
> *"AegisFire is built entirely with a high-performance Python FastAPI engine, Scikit-learn ML pipelines, and a responsive web command center. It requires zero proprietary external database infrastructure.
> 
> In Bangalore, the heart of Indian aerospace and data science, we understand the vital importance of continuous remote sensing data as ISRO and NASA prepare to launch missions like NISAR. AegisFire ensures that 25 years of NASA investment into planetary fire monitoring can finally be studied as one unified, continuous climate record. Thank you."*
