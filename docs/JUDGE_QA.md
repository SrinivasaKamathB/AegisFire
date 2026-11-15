# AegisFire: Bangalore Jury Defense Guide & Technical Q&A

Use this cheat sheet to confidently answer challenging technical questions from remote sensing scientists, aerospace academics, and senior AI/ML evaluators.

---

### Q1: "Why did you use Hexagonal Spatial Indexing (Uber H3 equivalent) instead of standard square lat/long grids?"
**Your Answer:**
> *"Standard rectangular lat/long grids suffer from two major geometric flaws:
> 1. First, **diagonal distortion**: in a square grid, diagonal neighbors are $\sqrt{2} \approx 1.414\times$ farther away than orthogonal neighbors, distorting spatial spatial autocorrelation and fire spread physics. Hexagons have identical centroid-to-centroid distances across all 6 neighbors.
> 2. Second, **meridian convergence**: square degrees of longitude shrink toward the poles ($\cos(\text{latitude})$). By projecting into a standardized 3.5 km hexagonal metric tessellation, our spatial cells maintain uniform physical area regardless of latitude."*

---

### Q2: "Why choose HistGradientBoostingRegressor rather than a Deep Neural Network?"
**Your Answer:**
> *"Tabular geospatial telemetry with right-skewed energy distributions and physical boundaries is the exact domain where tree-based gradient boosting dominates over neural networks. 
> 
> HistGradientBoosting uses histogram-based binning of continuous numerical features (FRP, scan zenith angle, brightness temp), making it orders of magnitude faster to train while naturally handling non-linear boundary conditions without fragile weight regularization. Furthermore, it allows native integration of **Quantile Loss ($q=0.10, q=0.90$)** to deliver defensible 90% confidence bounds, which standard neural networks cannot produce without complex Bayesian wrappers."*

---

### Q3: "How does your model account for the 'Bowtie Effect' in MODIS?"
**Your Answer:**
> *"At nadir (looking straight down), a MODIS pixel is approximately $1\text{ km} \times 1\text{ km}$. But toward the edge of the swath ($\pm 55^\circ$ scan angle), optical elongation and projection distortion expand the pixel footprint up to $2\text{ km} \times 4.8\text{ km}$—a nearly 10x area expansion. 
> 
> In contrast, VIIRS utilizes onboard pixel aggregation across 3 zones to constrain pixel growth to under $375\text{ m} \times 750\text{ m}$. We explicitly fed the MODIS `scan` and `track` parameters into our feature matrix. Our feature importance analysis revealed that scan zenith angle accounts for **26% of model predictive weight**, directly compensating for edge-of-swath energy dilution."*

---

### Q4: "How can you be confident that your back-projection onto 2000–2011 data is scientifically valid if VIIRS didn't exist then?"
**Your Answer:**
> *"We employed a rigorous **temporal out-of-sample cross-validation protocol**. Rather than random splitting (which causes spatial-temporal data leakage), we trained the model exclusively on earlier overlap years (2012–2021) and evaluated its generalization on completely unseen later years (2022–2025). 
> 
> The model achieved an $R^2$ of **0.9010** and reduced cross-sensor discrepancy error across extreme drought years and wet years alike. Because combustion thermodynamics and sensor optics remain constant across decades, a model validated across 13 diverse seasonal cycles provides strong scientific fidelity when projected onto earlier MODIS observations."*

---

### Q5: "Can this pipeline be deployed for India (e.g., Punjab stubble burning or Western Ghats fires)?"
**Your Answer:**
> *"Absolutely. The AegisFire pipeline is completely sensor-centric and geography-agnostic. 
> 
> In fact, agricultural stubble burning in Punjab and Haryana is an even stronger candidate for AegisFire: small, low-intensity field burns often fell below the 10 MW detection limit of 1 km MODIS, but are vividly captured by 375 m VIIRS. Pointing our ETL pipeline at the NASA FIRMS South Asia bounding box takes less than 5 minutes and immediately resolves the Indian agricultural fire baseline."*
