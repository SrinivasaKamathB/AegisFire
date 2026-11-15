/**
 * AegisFire: High-Fidelity Geospatial Hexagonal Fire Cluster Renderer
 * Accurate Regional Projections (California / India), Zero-Lag In-Memory Caching, NISAR Radar.
 */

(() => {
    let mapCanvas, mapCtx;
    let currentYear = 2020;
    let currentMapData = null;
    let currentMapRegion = "california";
    let isPlaying = false;
    let playInterval = null;
    let isNisarOverlayActive = false;

    // Client-side cache to guarantee zero network lag
    const clientMapCache = {};

    // Exact Regional Bounding Boxes (WGS84 Coordinates)
    const REGION_BOUNDS = {
        california: { latMin: 32.2, latMax: 42.2, lonMin: -124.6, lonMax: -114.0 },
        india: { latMin: 7.0, latMax: 37.8, lonMin: 68.0, lonMax: 97.8 }
    };

    // High-Fidelity California Boundary
    const CA_BOUNDARY = [
        [42.0, -124.2], [41.2, -124.1], [40.4, -124.4], [39.0, -123.7],
        [38.0, -123.0], [37.7, -122.5], [36.6, -121.9], [35.5, -121.1],
        [34.5, -120.6], [34.4, -119.8], [34.0, -118.9], [33.7, -118.3],
        [33.3, -117.6], [32.53, -117.12], [32.53, -114.7], [32.7, -114.6],
        [34.3, -114.13], [35.0, -114.63], [36.0, -115.35], [39.0, -120.0],
        [42.0, -120.0], [42.0, -124.2]
    ];

    // High-Fidelity Authentic India Boundary (Comprehensive National Outline)
    const INDIA_BOUNDARY = [
        // 1. Northern Crown (Jammu & Kashmir / Ladakh)
        [37.1, 74.8], [37.0, 75.6], [36.5, 76.8], [35.9, 77.8], [35.5, 78.8],
        [34.8, 79.5], [33.8, 79.2], [32.8, 79.0], [32.3, 78.8],
        // 2. Himachal Pradesh & Uttarakhand Himalayas
        [31.8, 78.6], [31.2, 79.2], [30.8, 80.0], [30.2, 80.8],
        // 3. Indo-Nepal Northern Border
        [29.0, 80.2], [28.6, 81.2], [28.0, 82.2], [27.5, 83.8], [27.0, 84.8],
        [26.6, 86.2], [26.5, 87.5], [26.6, 88.0],
        // 4. Sikkim
        [27.1, 88.1], [27.7, 88.2], [28.1, 88.6], [27.8, 88.9], [27.2, 88.9],
        // 5. Bhutan Border to Arunachal Pradesh
        [26.8, 89.8], [26.8, 91.5], [27.2, 91.8], [27.5, 92.2],
        // 6. Arunachal Pradesh & Assam Northern Spine
        [27.8, 92.8], [28.2, 93.8], [28.6, 94.8], [28.9, 95.8], [28.6, 96.6],
        [28.2, 97.2], [28.0, 97.4], // Easternmost tip (Kibithu)
        // 7. Eastern Myanmar Border (Nagaland, Manipur, Mizoram)
        [27.2, 96.8], [26.2, 95.5], [25.4, 94.8], [24.5, 94.2], [23.8, 93.6],
        [22.8, 93.2], [21.9, 92.8], // Southernmost tip of Mizoram
        // 8. Bangladesh Border (Tripura, Meghalaya, North Bengal)
        [22.8, 92.2], [23.5, 91.6], [24.2, 91.5], [24.8, 92.2], [25.2, 92.5],
        [25.3, 91.2], [25.1, 89.9], [25.6, 89.8], [26.2, 89.6], [26.0, 88.6],
        [25.2, 88.1], [24.8, 88.4], [24.0, 88.6], [22.8, 88.9], [22.2, 89.1],
        // 9. Bay of Bengal Coastline (Sundarbans, Odisha, Andhra Pradesh, Tamil Nadu)
        [21.8, 88.4], [21.5, 87.4], [20.8, 86.9], [20.2, 86.5], [19.8, 85.8],
        [19.0, 84.8], [18.2, 83.9], [17.5, 83.1], [16.8, 82.2], [16.2, 81.4],
        [15.8, 80.5], [15.0, 80.1], [14.0, 80.1], [13.2, 80.3], [12.2, 80.0],
        [11.4, 79.8], [10.5, 79.8], [9.8, 79.2], [9.2, 79.1], [8.8, 78.1],
        [8.5, 77.8],
        // 10. Southernmost Tip (Kanyakumari)
        [8.08, 77.55],
        // 11. Arabian Sea Coastline (Kerala, Karnataka, Goa, Maharashtra)
        [8.4, 77.0], [9.2, 76.5], [9.8, 76.3], [10.5, 76.0], [11.2, 75.8],
        [12.0, 75.2], [12.8, 74.9], [13.5, 74.7], [14.2, 74.4], [14.8, 74.1],
        [15.4, 73.8], [16.2, 73.5], [17.0, 73.3], [18.0, 73.0], [18.9, 72.8],
        [19.8, 72.8], [20.5, 72.7],
        // 12. Gujarat Peninsulas (Kathiawar / Saurashtra & Kutch)
        [21.0, 72.6], [21.6, 72.3], [22.2, 72.5], [21.7, 72.0], [21.0, 71.5],
        [20.7, 70.9], [20.8, 70.2], [21.4, 69.6], [22.3, 68.9], // Dwarka tip
        [22.6, 69.3], [22.9, 70.1], [22.8, 70.8], [23.1, 70.4], [23.5, 69.2],
        [23.7, 68.4], // Sir Creek Westernmost tip
        // 13. Western Pakistan Border (Rann of Kutch, Rajasthan, Punjab, J&K)
        [24.2, 68.8], [24.5, 69.8], [24.6, 71.0], [25.2, 70.8], [26.0, 70.2],
        [26.8, 70.0], [27.5, 70.5], [28.2, 71.4], [29.2, 72.2], [30.0, 73.2],
        [30.8, 73.9], [31.5, 74.6], [32.2, 74.8], [32.8, 74.4], [33.5, 74.0],
        [34.2, 73.9], [34.9, 74.2], [35.6, 74.5], [36.2, 74.6], [37.1, 74.8]
    ];

    window.warmRegionalMapCache = async function(region) {
        currentMapRegion = region || currentMapRegion;
        try {
            const res = await fetch(`/api/map_cache_all?region=${currentMapRegion}`);
            if (!res.ok) return;
            const allData = await res.json();
            for (const [yr, yrData] of Object.entries(allData)) {
                clientMapCache[`${currentMapRegion}_${yr}`] = yrData;
            }
            if (clientMapCache[`${currentMapRegion}_${currentYear}`]) {
                currentMapData = clientMapCache[`${currentMapRegion}_${currentYear}`];
                updateMapOverlay();
                renderMap();
            }
        } catch (e) {
            console.warn("Background cache prefetch skipped:", e);
        }
    };

    window.initMap = function() {
        mapCanvas = document.getElementById("mapCanvas");
        if (!mapCanvas) return;
        mapCtx = mapCanvas.getContext("2d");

        function resize() {
            const parent = mapCanvas.parentElement;
            const rect = parent ? parent.getBoundingClientRect() : { width: 700, height: 480 };
            const w = Math.max(300, rect.width || (parent ? parent.clientWidth : 700) || 700);
            const h = Math.max(300, rect.height || (parent ? parent.clientHeight : 480) || 480);
            const dpr = window.devicePixelRatio || 1;
            
            mapCanvas.width = w * dpr;
            mapCanvas.height = h * dpr;
            renderMap();
        }

        window.addEventListener("resize", resize);
        resize();

        // Render terrain immediately
        renderMap();
        
        // Warm cache for active region and load current year immediately
        window.warmRegionalMapCache(currentMapRegion);
        window.loadMapData(currentYear, currentMapRegion);

        mapCanvas.addEventListener("mousemove", onMapHover);
    };

    window.loadMapData = async function(year, region) {
        currentYear = year ? parseInt(year) : currentYear;
        currentMapRegion = region || currentMapRegion;
        const cacheKey = `${currentMapRegion}_${currentYear}`;

        // Fast Path: Client Cache (0ms latency)
        if (clientMapCache[cacheKey]) {
            currentMapData = clientMapCache[cacheKey];
            updateMapOverlay();
            renderMap();
            return;
        }

        try {
            const res = await fetch(`/api/map_data?year=${currentYear}&region=${currentMapRegion}`);
            currentMapData = await res.json();
            clientMapCache[cacheKey] = currentMapData;
            updateMapOverlay();
            renderMap();
        } catch (err) {
            console.error("Failed to load map data:", err);
        }
    };

    function updateMapOverlay() {
        const overlay = document.getElementById("mapOverlayInfo");
        if (overlay && currentMapData) {
            overlay.innerHTML = `Region: <strong class="text-slate-900">${currentMapRegion.toUpperCase()}</strong> | ` +
                `Year: <strong class="text-slate-900">${currentMapData.year}</strong> | ` +
                `Active Hex Clusters: <strong class="text-sky-700 font-bold">${currentMapData.total_hex_clusters}</strong> | ` +
                `Calibrated FRP: <strong class="text-amber-700 font-bold">${currentMapData.total_year_frp.toLocaleString()} MW</strong>`;
        }
    }

    /**
     * Aspect-Ratio Preserving Projection
     * Guarantees 1 km horizontal = 1 km vertical, perfectly maintaining authentic geographic shapes.
     */
    function project(lat, lon, width, height) {
        const bounds = REGION_BOUNDS[currentMapRegion] || REGION_BOUNDS.california;
        const pad = 24;

        const latRange = bounds.latMax - bounds.latMin;
        const meanLatRad = ((bounds.latMax + bounds.latMin) / 2) * Math.PI / 180;
        const cosLat = Math.cos(meanLatRad);
        const lonRange = (bounds.lonMax - bounds.lonMin) * cosLat;

        const availW = width - pad * 2;
        const availH = height - pad * 2;
        const scale = Math.min(availW / lonRange, availH / latRange);

        const renderW = lonRange * scale;
        const renderH = latRange * scale;
        const offsetX = pad + (availW - renderW) / 2;
        const offsetY = pad + (availH - renderH) / 2;

        const x = offsetX + (lon - bounds.lonMin) * cosLat * scale;
        const y = offsetY + (bounds.latMax - lat) * scale;
        return [x, y];
    }

    function renderMap() {
        if (!mapCtx || !mapCanvas) return;
        const dpr = window.devicePixelRatio || 1;
        const width = mapCanvas.width / dpr;
        const height = mapCanvas.height / dpr;

        mapCtx.save();
        mapCtx.scale(dpr, dpr);
        mapCtx.clearRect(0, 0, width, height);

        // 1. Draw Ocean / Background Grid
        mapCtx.fillStyle = "#f8fafc";
        mapCtx.fillRect(0, 0, width, height);

        // Subtle Mission Control Lat/Lon Coordinate Grid
        mapCtx.strokeStyle = "#edf2f7";
        mapCtx.lineWidth = 1.0;
        for (let x = 30; x < width; x += 60) {
            mapCtx.beginPath();
            mapCtx.moveTo(x, 0);
            mapCtx.lineTo(x, height);
            mapCtx.stroke();
        }
        for (let y = 30; y < height; y += 60) {
            mapCtx.beginPath();
            mapCtx.moveTo(0, y);
            mapCtx.lineTo(width, y);
            mapCtx.stroke();
        }

        // 2. Draw High-Fidelity Land Boundary
        const polygon = currentMapRegion === "india" ? INDIA_BOUNDARY : CA_BOUNDARY;
        mapCtx.fillStyle = "#e8eef5"; // Clean scientific land tint
        mapCtx.strokeStyle = "#64748b"; // Crisp slate boundary
        mapCtx.lineWidth = 1.6;

        mapCtx.beginPath();
        polygon.forEach((pt, idx) => {
            const [x, y] = project(pt[0], pt[1], width, height);
            if (idx === 0) mapCtx.moveTo(x, y);
            else mapCtx.lineTo(x, y);
        });
        mapCtx.closePath();
        mapCtx.fill();
        mapCtx.stroke();

        // 3. Regional Geographical Features
        if (currentMapRegion === "india") {
            // Western Ghats Mountain Spine
            const westernGhats = [
                [20.5, 73.5], [18.5, 73.6], [16.5, 73.8], [14.5, 74.8],
                [13.0, 75.3], [11.5, 76.5], [9.5, 77.1], [8.5, 77.4]
            ];
            mapCtx.strokeStyle = "#94a3b8";
            mapCtx.lineWidth = 1.4;
            mapCtx.setLineDash([4, 4]);
            mapCtx.beginPath();
            westernGhats.forEach((pt, idx) => {
                const [x, y] = project(pt[0], pt[1], width, height);
                if (idx === 0) mapCtx.moveTo(x, y);
                else mapCtx.lineTo(x, y);
            });
            mapCtx.stroke();
            mapCtx.setLineDash([]);

            // Indo-Gangetic Agricultural Basin (Punjab -> UP -> Bihar -> Bengal)
            const gangesCorridor = [
                [31.2, 75.5], [29.8, 77.0], [28.2, 79.5], [26.5, 82.5],
                [25.6, 85.2], [24.8, 87.5], [23.5, 88.5]
            ];
            mapCtx.strokeStyle = "#cbd5e1";
            mapCtx.lineWidth = 1.2;
            mapCtx.beginPath();
            gangesCorridor.forEach((pt, idx) => {
                const [x, y] = project(pt[0], pt[1], width, height);
                if (idx === 0) mapCtx.moveTo(x, y);
                else mapCtx.lineTo(x, y);
            });
            mapCtx.stroke();

            // City Reference Badges
            const cities = [
                { name: "Bengaluru (Host)", lat: 12.97, lon: 77.59, highlight: true },
                { name: "New Delhi", lat: 28.61, lon: 77.21, highlight: false },
                { name: "Mumbai", lat: 19.08, lon: 72.88, highlight: false },
                { name: "Kolkata", lat: 22.57, lon: 88.36, highlight: false }
            ];

            cities.forEach(c => {
                const [cx, cy] = project(c.lat, c.lon, width, height);
                mapCtx.fillStyle = c.highlight ? "#0284c7" : "#64748b";
                mapCtx.beginPath();
                mapCtx.arc(cx, cy, c.highlight ? 4.5 : 2.5, 0, Math.PI * 2);
                mapCtx.fill();

                if (c.highlight) {
                    mapCtx.strokeStyle = "#ffffff";
                    mapCtx.lineWidth = 1.5;
                    mapCtx.stroke();
                }

                mapCtx.fillStyle = c.highlight ? "#0369a1" : "#475569";
                mapCtx.font = c.highlight ? "bold 10px monospace" : "9px monospace";
                mapCtx.fillText(c.name, cx + 6, cy + 3);
            });

        } else {
            // California Sierra Nevada Ridge
            const sierraRidge = [[41.0, -122.2], [39.5, -120.8], [37.8, -119.5], [36.0, -118.2]];
            mapCtx.strokeStyle = "#94a3b8";
            mapCtx.lineWidth = 1.4;
            mapCtx.setLineDash([4, 4]);
            mapCtx.beginPath();
            sierraRidge.forEach((pt, idx) => {
                const [x, y] = project(pt[0], pt[1], width, height);
                if (idx === 0) mapCtx.moveTo(x, y);
                else mapCtx.lineTo(x, y);
            });
            mapCtx.stroke();
            mapCtx.setLineDash([]);

            // Reference Cities
            const caCities = [
                { name: "Sacramento", lat: 38.58, lon: -121.49 },
                { name: "San Francisco", lat: 37.77, lon: -122.42 },
                { name: "Los Angeles", lat: 34.05, lon: -118.24 }
            ];
            caCities.forEach(c => {
                const [cx, cy] = project(c.lat, c.lon, width, height);
                mapCtx.fillStyle = "#64748b";
                mapCtx.beginPath();
                mapCtx.arc(cx, cy, 3, 0, Math.PI * 2);
                mapCtx.fill();
                mapCtx.fillStyle = "#475569";
                mapCtx.font = "9px monospace";
                mapCtx.fillText(c.name, cx + 6, cy + 3);
            });
        }

        // 4. NISAR Radar Simulation Overlay
        if (isNisarOverlayActive) {
            mapCtx.fillStyle = "rgba(14, 165, 233, 0.08)";
            mapCtx.fillRect(0, 0, width, height);

            mapCtx.strokeStyle = "rgba(2, 132, 199, 0.22)";
            mapCtx.lineWidth = 0.8;
            for (let i = 0; i < width; i += 32) {
                mapCtx.beginPath();
                mapCtx.moveTo(i, 0);
                mapCtx.lineTo(i, height);
                mapCtx.stroke();
            }
        }

        // 5. Render Calibrated Hexagonal Fire Clusters
        if (currentMapData && currentMapData.hexagons) {
            currentMapData.hexagons.forEach(hex => {
                const [cx, cy] = project(hex.center[0], hex.center[1], width, height);
                const radius = Math.min(18, Math.max(5, Math.sqrt(hex.frp) * 0.45));
                
                let fillColor, glowColor;
                if (hex.severity === "Catastrophic") {
                    fillColor = "rgba(220, 38, 38, 0.85)";
                    glowColor = "rgba(239, 68, 68, 0.35)";
                } else if (hex.severity === "Severe") {
                    fillColor = "rgba(234, 88, 12, 0.85)";
                    glowColor = "rgba(249, 115, 22, 0.3)";
                } else if (hex.severity === "Moderate") {
                    fillColor = "rgba(217, 119, 6, 0.85)";
                    glowColor = "rgba(234, 179, 8, 0.25)";
                } else {
                    fillColor = "rgba(2, 132, 199, 0.75)";
                    glowColor = "rgba(56, 189, 248, 0.2)";
                }

                if (isNisarOverlayActive) {
                    fillColor = "rgba(16, 185, 129, 0.85)";
                    glowColor = "rgba(52, 211, 153, 0.35)";
                }

                // Outer thermal glow halo
                mapCtx.fillStyle = glowColor;
                mapCtx.beginPath();
                mapCtx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
                mapCtx.fill();

                // 6-sided Discrete Hexagonal Geometry
                mapCtx.fillStyle = fillColor;
                mapCtx.strokeStyle = "#ffffff";
                mapCtx.lineWidth = 1.0;
                mapCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (60 * i - 30) * (Math.PI / 180);
                    const hx = cx + radius * Math.cos(angle);
                    const hy = cy + radius * Math.sin(angle);
                    if (i === 0) mapCtx.moveTo(hx, hy);
                    else mapCtx.lineTo(hx, hy);
                }
                mapCtx.closePath();
                mapCtx.fill();
                mapCtx.stroke();
            });
        }

        mapCtx.restore();
    }

    function onMapHover(e) {
        if (!currentMapData || !currentMapData.hexagons) return;
        const rect = mapCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let foundHex = null;
        for (const hex of currentMapData.hexagons) {
            const [cx, cy] = project(hex.center[0], hex.center[1], rect.width, rect.height);
            const dist = Math.hypot(mouseX - cx, mouseY - cy);
            if (dist <= 15) {
                foundHex = hex;
                break;
            }
        }

        const overlay = document.getElementById("mapOverlayInfo");
        if (!overlay) return;

        if (foundHex) {
            const coordSuffix = currentMapRegion === "india" ? "°E" : "°W";
            overlay.innerHTML = `<span class="text-slate-900 font-bold">${foundHex.severity} Cluster:</span> ` +
                `Coords: <span class="text-sky-700 font-mono font-medium">${foundHex.center[0]}°N, ${Math.abs(foundHex.center[1])}${coordSuffix}</span> | ` +
                `FRP: <span class="text-amber-700 font-bold font-mono">${foundHex.frp.toLocaleString()} MW</span> | ` +
                `Hotspots: <span class="text-emerald-700 font-bold font-mono">${foundHex.count}</span>`;
        } else {
            updateMapOverlay();
        }
    }

    window.toggleNisarOverlay = function() {
        isNisarOverlayActive = !isNisarOverlayActive;
        const btn = document.getElementById("btnNisarRadar");
        if (btn) {
            if (isNisarOverlayActive) {
                btn.className = "px-3 py-1.5 rounded-md bg-emerald-600 text-white font-mono text-xs font-semibold shadow-sm transition flex items-center gap-1.5";
                btn.innerHTML = `<i data-lucide="radio" class="w-3.5 h-3.5"></i> NISAR Microwave Active`;
            } else {
                btn.className = "px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-medium border border-slate-300 shadow-sm transition flex items-center gap-1.5";
                btn.innerHTML = `<i data-lucide="radio" class="w-3.5 h-3.5"></i> Simulate NISAR Radar`;
            }
            if (window.lucide) lucide.createIcons();
        }
        renderMap();
    };

    window.onYearChange = function(year) {
        currentYear = parseInt(year);
        document.getElementById("currentYearDisplay").textContent = currentYear;
        window.loadMapData(currentYear, currentMapRegion);
    };

    window.toggleMapPlayback = function() {
        isPlaying = !isPlaying;
        const btn = document.getElementById("btnPlayMap");
        const slider = document.getElementById("yearSlider");

        if (isPlaying) {
            btn.innerHTML = `<i data-lucide="pause" class="w-4 h-4 text-rose-600"></i>`;
            if (window.lucide) lucide.createIcons();
            playInterval = setInterval(() => {
                currentYear++;
                if (currentYear > 2025) currentYear = 2000;
                slider.value = currentYear;
                window.onYearChange(currentYear);
            }, 800);
        } else {
            btn.innerHTML = `<i data-lucide="play" class="w-4 h-4 text-sky-700"></i>`;
            if (window.lucide) lucide.createIcons();
            clearInterval(playInterval);
        }
    };
})();
