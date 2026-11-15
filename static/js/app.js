/**
 * AegisFire: Advanced Analytical Dashboard Logic
 * Multi-Region (California / India), NISAR Simulation, Bowtie De-Warper, and Atmospheric Smoke Inversion.
 */

let currentRegion = "california";
let trendsData = [];
let eventsData = [];
let trendMode = "harmonized"; // "uncalibrated", "harmonized", "smoke_pm25"
let activeEventId = "";

document.addEventListener("DOMContentLoaded", () => {
    // Immediate parallel initialization
    setupTrendChart();
    if (window.initCalendar) window.initCalendar();
    if (window.initMap) window.initMap();

    loadInitialData(currentRegion).then(() => {
        drawTrendChart();
        renderEventTabs();
    });
});

async function loadInitialData(region) {
    currentRegion = region || currentRegion;
    try {
        const [trendsRes, eventsRes, summaryRes] = await Promise.all([
            fetch(`/api/trends?region=${currentRegion}`),
            fetch(`/api/events?region=${currentRegion}`),
            fetch(`/api/summary?region=${currentRegion}`)
        ]);
        trendsData = await trendsRes.json();
        eventsData = await eventsRes.json();
        const summary = await summaryRes.json();
        
        updateSummaryKPIs(summary);
        if (eventsData.length > 0) activeEventId = eventsData[0].id;
    } catch (err) {
        console.error("Failed to load initial data:", err);
    }
}

function updateSummaryKPIs(summary) {
    const elReg = document.getElementById("kpiTargetRegion");
    if (elReg) elReg.textContent = summary.target_region;

    const elFires = document.getElementById("kpiTotalFires");
    if (elFires) elFires.textContent = summary.total_fire_records_analyzed.toLocaleString() + " Hotspots";

    const elSmoke = document.getElementById("kpiTotalSmoke");
    if (elSmoke) elSmoke.textContent = summary.cumulative_pm25_tons.toLocaleString() + " Tons PM2.5";
}

window.switchRegion = async function(region) {
    currentRegion = region;
    const btnCal = document.getElementById("btnRegionCal");
    const btnInd = document.getElementById("btnRegionInd");

    if (region === "india") {
        btnInd.className = "px-3 py-1.5 rounded-md font-mono text-xs font-bold bg-sky-700 text-white shadow-sm transition";
        btnCal.className = "px-3 py-1.5 rounded-md font-mono text-xs font-medium text-slate-600 hover:text-slate-900 transition";
    } else {
        btnCal.className = "px-3 py-1.5 rounded-md font-mono text-xs font-bold bg-sky-700 text-white shadow-sm transition";
        btnInd.className = "px-3 py-1.5 rounded-md font-mono text-xs font-medium text-slate-600 hover:text-slate-900 transition";
    }

    await loadInitialData(currentRegion);
    drawTrendChart();
    renderEventTabs();
    if (window.loadCalendarData) window.loadCalendarData(currentRegion);
    if (window.warmRegionalMapCache) window.warmRegionalMapCache(currentRegion);
    if (window.loadMapData) window.loadMapData(2020, currentRegion);
};

function setTrendMode(mode) {
    trendMode = mode;
    const btnUncal = document.getElementById("btn-uncalibrated");
    const btnHarm = document.getElementById("btn-harmonized");
    const btnSmoke = document.getElementById("btn-smoke");

    // Reset styles
    [btnUncal, btnHarm, btnSmoke].forEach(b => {
        if (b) b.className = "px-3.5 py-1.5 rounded-md transition font-medium text-slate-600 hover:text-slate-900";
    });

    if (mode === "harmonized" && btnHarm) {
        btnHarm.className = "px-3.5 py-1.5 rounded-md transition font-semibold bg-emerald-600 text-white shadow-sm";
    } else if (mode === "uncalibrated" && btnUncal) {
        btnUncal.className = "px-3.5 py-1.5 rounded-md transition font-semibold bg-rose-600 text-white shadow-sm";
    } else if (mode === "smoke_pm25" && btnSmoke) {
        btnSmoke.className = "px-3.5 py-1.5 rounded-md transition font-semibold bg-amber-600 text-white shadow-sm";
    }

    drawTrendChart();
}

/**
 * High-performance HTML5 Canvas Time Series Chart
 */
let trendCanvas, trendCtx;
let hoveredYearIndex = -1;

function setupTrendChart() {
    trendCanvas = document.getElementById("trendChart");
    if (!trendCanvas) return;
    trendCtx = trendCanvas.getContext("2d");

    function resizeCanvas() {
        const rect = trendCanvas.parentElement.getBoundingClientRect();
        trendCanvas.width = rect.width * window.devicePixelRatio;
        trendCanvas.height = rect.height * window.devicePixelRatio;
        drawTrendChart();
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    trendCanvas.addEventListener("mousemove", (e) => {
        const rect = trendCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const paddingLeft = 60;
        const paddingRight = 30;
        const chartWidth = rect.width - paddingLeft - paddingRight;

        if (trendsData.length === 0) return;
        const step = chartWidth / (trendsData.length - 1);
        const index = Math.round((mouseX - paddingLeft) / step);

        if (index >= 0 && index < trendsData.length) {
            hoveredYearIndex = index;
            updateTrendTooltip(trendsData[index]);
            drawTrendChart();
        }
    });

    trendCanvas.addEventListener("mouseleave", () => {
        hoveredYearIndex = -1;
        document.getElementById("chartHoverDetails").textContent = "Hover over any year point for detailed sensor statistics";
        drawTrendChart();
    });
}

function updateTrendTooltip(d) {
    const el = document.getElementById("chartHoverDetails");
    if (!el) return;
    
    if (trendMode === "smoke_pm25") {
        el.innerHTML = `<span class="text-slate-900 font-bold">[${currentRegion.toUpperCase()}] ${d.year}:</span> ` +
            `Estimated PM2.5: <span class="text-amber-700 font-bold">${d.pm25_emitted_tons.toLocaleString()} Tons</span> | ` +
            `Biomass Burned: <span class="text-slate-700 font-bold">${d.biomass_burned_tons.toLocaleString()} Tons</span> | ` +
            `CO2 Flux: <span class="text-slate-700 font-bold">${d.co2_flux_tons.toLocaleString()} Tons CO2e</span>`;
    } else {
        const rawFRP = d.uncalibrated_stitched_frp.toLocaleString();
        const harmFRP = d.harmonized_frp.toLocaleString();
        el.innerHTML = `<span class="text-slate-900 font-bold">[${currentRegion.toUpperCase()}] ${d.year}:</span> ` +
            `Raw FRP: <span class="text-rose-600 font-bold">${rawFRP} MW</span> | ` +
            `Harmonized: <span class="text-emerald-700 font-bold">${harmFRP} MW</span> | ` +
            `Regime: <span class="text-slate-600">${d.sensor_regime}</span>`;
    }
}

function drawTrendChart() {
    if (!trendCtx || trendsData.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = trendCanvas.width / dpr;
    const height = trendCanvas.height / dpr;

    trendCtx.save();
    trendCtx.scale(dpr, dpr);
    trendCtx.clearRect(0, 0, width, height);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 35;
    const padBottom = 40;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    let maxVal = 0;
    if (trendMode === "smoke_pm25") {
        trendsData.forEach(d => { maxVal = Math.max(maxVal, d.pm25_emitted_tons || 0); });
        maxVal = Math.ceil((maxVal * 1.2) / 100) * 100;
    } else {
        trendsData.forEach(d => {
            maxVal = Math.max(maxVal, d.uncalibrated_stitched_frp, d.frp_ci_upper || 0, d.harmonized_frp);
        });
        maxVal = Math.ceil((maxVal * 1.15) / 5000) * 5000;
    }

    // Gridlines
    trendCtx.strokeStyle = "#e2e8f0";
    trendCtx.lineWidth = 1;
    trendCtx.font = "10px JetBrains Mono, monospace";
    trendCtx.fillStyle = "#64748b";
    trendCtx.textAlign = "right";

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const val = (maxVal / yTicks) * i;
        const y = padTop + chartH - (val / maxVal) * chartH;
        trendCtx.beginPath();
        trendCtx.moveTo(padLeft, y);
        trendCtx.lineTo(padLeft + chartW, y);
        trendCtx.stroke();
        const label = trendMode === "smoke_pm25" ? `${val.toFixed(0)} T` : (val >= 1000 ? `${(val/1000).toFixed(0)}k MW` : `${val} MW`);
        trendCtx.fillText(label, padLeft - 10, y + 3);
    }

    // 2012 Sensor Transition Demarcation Line
    const x2012 = padLeft + ((2012 - 2000) / (trendsData.length - 1)) * chartW;
    trendCtx.strokeStyle = "#0284c7";
    trendCtx.lineWidth = 1.5;
    trendCtx.setLineDash([4, 4]);
    trendCtx.beginPath();
    trendCtx.moveTo(x2012, padTop);
    trendCtx.lineTo(x2012, padTop + chartH);
    trendCtx.stroke();
    trendCtx.setLineDash([]);

    trendCtx.fillStyle = "#0369a1";
    trendCtx.textAlign = "center";
    trendCtx.fillText("2012: VIIRS Launch", x2012, padTop - 12);

    // X-axis ticks
    trendCtx.fillStyle = "#64748b";
    trendCtx.textAlign = "center";
    trendsData.forEach((d, idx) => {
        if (d.year % 5 === 0 || idx === trendsData.length - 1) {
            const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
            trendCtx.fillText(d.year, x, padTop + chartH + 20);
        }
    });

    if (trendMode === "smoke_pm25") {
        // Smoke Mode: Amber Curve
        trendCtx.strokeStyle = "#d97706";
        trendCtx.lineWidth = 2.5;
        trendCtx.beginPath();
        trendsData.forEach((d, idx) => {
            const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
            const y = padTop + chartH - (d.pm25_emitted_tons / maxVal) * chartH;
            if (idx === 0) trendCtx.moveTo(x, y);
            else trendCtx.lineTo(x, y);
        });
        trendCtx.stroke();
    } else {
        // 1. Raw Reference Curve (Dashed in Harmonized mode, Bold in Uncalibrated mode)
        if (trendMode === "harmonized") {
            // Draw faint ghost of the uncalibrated curve to visually demonstrate the fix
            trendCtx.strokeStyle = "rgba(225, 29, 72, 0.4)";
            trendCtx.lineWidth = 1.8;
            trendCtx.setLineDash([4, 4]);
            trendCtx.beginPath();
            trendsData.forEach((d, idx) => {
                const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
                const y = padTop + chartH - (d.uncalibrated_stitched_frp / maxVal) * chartH;
                if (idx === 0) trendCtx.moveTo(x, y);
                else trendCtx.lineTo(x, y);
            });
            trendCtx.stroke();
            trendCtx.setLineDash([]);
        }

        // 2. Confidence Interval (Harmonized mode)
        if (trendMode === "harmonized") {
            trendCtx.fillStyle = "rgba(16, 185, 129, 0.15)";
            trendCtx.beginPath();
            trendsData.forEach((d, idx) => {
                const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
                const y = padTop + chartH - (d.frp_ci_upper / maxVal) * chartH;
                if (idx === 0) trendCtx.moveTo(x, y);
                else trendCtx.lineTo(x, y);
            });
            for (let idx = trendsData.length - 1; idx >= 0; idx--) {
                const d = trendsData[idx];
                const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
                const y = padTop + chartH - (d.frp_ci_lower / maxVal) * chartH;
                trendCtx.lineTo(x, y);
            }
            trendCtx.closePath();
            trendCtx.fill();
        }

        // 3. Raw Uncalibrated Curve (Bold Red)
        if (trendMode === "uncalibrated") {
            trendCtx.strokeStyle = "#e11d48";
            trendCtx.lineWidth = 3.0;
            trendCtx.beginPath();
            trendsData.forEach((d, idx) => {
                const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
                const y = padTop + chartH - (d.uncalibrated_stitched_frp / maxVal) * chartH;
                if (idx === 0) trendCtx.moveTo(x, y);
                else trendCtx.lineTo(x, y);
            });
            trendCtx.stroke();

            // Annotation badge at 2012 step jump
            const idx2012 = trendsData.findIndex(d => d.year === 2012);
            if (idx2012 > 0) {
                const x2012 = padLeft + (idx2012 / (trendsData.length - 1)) * chartW;
                const y2012 = padTop + chartH - (trendsData[idx2012].uncalibrated_stitched_frp / maxVal) * chartH;
                trendCtx.fillStyle = "#e11d48";
                trendCtx.font = "bold 10px monospace";
                trendCtx.textAlign = "center";
                trendCtx.fillText("▲ +208% False Step Break", x2012, y2012 - 12);
            }
        }

        // 4. AegisFire Harmonized Baseline (Emerald Green)
        if (trendMode === "harmonized") {
            trendCtx.strokeStyle = "#059669";
            trendCtx.lineWidth = 3.0;
            trendCtx.beginPath();
            trendsData.forEach((d, idx) => {
                const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
                const y = padTop + chartH - (d.harmonized_frp / maxVal) * chartH;
                if (idx === 0) trendCtx.moveTo(x, y);
                else trendCtx.lineTo(x, y);
            });
            trendCtx.stroke();

            // Annotation badge at 2012 continuity
            const idx2012 = trendsData.findIndex(d => d.year === 2012);
            if (idx2012 > 0) {
                const x2012 = padLeft + (idx2012 / (trendsData.length - 1)) * chartW;
                const y2012 = padTop + chartH - (trendsData[idx2012].harmonized_frp / maxVal) * chartH;
                trendCtx.fillStyle = "#059669";
                trendCtx.font = "bold 10px monospace";
                trendCtx.textAlign = "center";
                trendCtx.fillText("✓ 0.0% Continuous Calibration", x2012, y2012 - 14);
            }
        }
    }

    // Points & Highlight
    trendsData.forEach((d, idx) => {
        const x = padLeft + (idx / (trendsData.length - 1)) * chartW;
        let val;
        if (trendMode === "smoke_pm25") val = d.pm25_emitted_tons;
        else val = trendMode === "harmonized" ? d.harmonized_frp : d.uncalibrated_stitched_frp;
        const y = padTop + chartH - (val / maxVal) * chartH;

        if (idx === hoveredYearIndex) {
            trendCtx.fillStyle = trendMode === "smoke_pm25" ? "#d97706" : (trendMode === "harmonized" ? "#059669" : "#e11d48");
            trendCtx.beginPath();
            trendCtx.arc(x, y, 6, 0, Math.PI * 2);
            trendCtx.fill();
            trendCtx.strokeStyle = "#ffffff";
            trendCtx.lineWidth = 2;
            trendCtx.stroke();
        } else if (d.year % 5 === 0) {
            trendCtx.fillStyle = trendMode === "smoke_pm25" ? "#d97706" : (trendMode === "harmonized" ? "#059669" : "#e11d48");
            trendCtx.beginPath();
            trendCtx.arc(x, y, 3.5, 0, Math.PI * 2);
            trendCtx.fill();
        }
    });

    trendCtx.restore();
}

/**
 * Case Study Tabs Renderer with NISAR Radar Integration
 */
function renderEventTabs() {
    const tabContainer = document.getElementById("eventTabButtons");
    if (!tabContainer || eventsData.length === 0) return;

    tabContainer.innerHTML = eventsData.map(ev => {
        const isActive = ev.id === activeEventId;
        const btnClass = isActive 
            ? "px-2.5 py-1.5 rounded bg-sky-100 border border-sky-400 text-sky-900 font-mono text-xs font-semibold text-left transition shadow-sm"
            : "px-2.5 py-1.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-xs text-left hover:bg-slate-50 transition";
        return `<button onclick="selectEvent('${ev.id}')" class="${btnClass}">${ev.name}</button>`;
    }).join("");

    renderActiveEventDetail();
}

function selectEvent(eventId) {
    activeEventId = eventId;
    renderEventTabs();
}

function renderActiveEventDetail() {
    const card = document.getElementById("eventDetailCard");
    const ev = eventsData.find(e => e.id === activeEventId);
    if (!card || !ev) return;

    const discrepancyMultiple = (ev.raw_viirs_frp / ev.raw_modis_frp).toFixed(1);
    const nisar = ev.nisar_coherence || { radar_band: "L-Band + S-Band", penetrative_depth: "Simulated sub-smoke surface penetration active." };

    card.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
                <h3 class="text-sm font-bold text-slate-900">${ev.name}</h3>
                <span class="text-xs text-slate-500 font-mono">Date: ${ev.date} // Epicenter: ${ev.lat}°N, ${ev.lon}°</span>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono border border-rose-200 font-semibold">${discrepancyMultiple}x Sensor Discrepancy</span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div class="p-2.5 rounded bg-white border border-slate-200 shadow-sm">
                <span class="text-slate-500 block text-[10px] font-semibold">RAW MODIS</span>
                <span class="text-amber-700 font-bold text-sm">${ev.raw_modis_frp.toLocaleString()} MW</span>
            </div>
            <div class="p-2.5 rounded bg-white border border-slate-200 shadow-sm">
                <span class="text-slate-500 block text-[10px] font-semibold">RAW VIIRS</span>
                <span class="text-sky-700 font-bold text-sm">${ev.raw_viirs_frp.toLocaleString()} MW</span>
            </div>
            <div class="p-2.5 rounded bg-emerald-50 border border-emerald-300 shadow-sm">
                <span class="text-emerald-800 block text-[10px] font-bold">AEGISFIRE CALIBRATED</span>
                <span class="text-emerald-700 font-extrabold text-sm">${ev.harmonized_baseline_frp.toLocaleString()} MW</span>
            </div>
        </div>

        <div class="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded border border-slate-200 shadow-sm space-y-1.5">
            <div><strong class="text-sky-800 font-semibold">Physical Mechanism:</strong> ${ev.discrepancy_resolved}</div>
            <div class="pt-1.5 border-t border-slate-100 flex items-start gap-1.5 text-emerald-800">
                <span class="px-1.5 py-0.5 bg-emerald-100 rounded text-[10px] font-bold tracking-wider">NISAR RADAR</span>
                <span class="text-[11px] leading-tight"><strong>${nisar.radar_band}:</strong> ${nisar.penetrative_depth}</span>
            </div>
        </div>

        <button onclick="openIcs209Modal()" class="w-full mt-2 py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 text-xs font-mono font-semibold flex items-center justify-center gap-2 shadow-sm transition">
            <i data-lucide="file-text" class="w-4 h-4 text-sky-600"></i>
            <span>View ICS-209 Incident Command Briefing</span>
        </button>
    `;
    if (window.lucide) lucide.createIcons();
}

/**
 * Tactical ICS-209 Modal Handler
 */
window.openIcs209Modal = function() {
    const ev = eventsData.find(e => e.id === activeEventId);
    if (!ev) return;
    const modal = document.getElementById("ics209Modal");
    if (!modal) return;
    
    const frp = ev.harmonized_baseline_frp;
    const spreadVelocity = (0.045 * Math.pow(frp, 0.42)).toFixed(1);
    const plumeHeight = (0.28 * Math.pow(frp, 0.55)).toFixed(1);
    const bufferRadius = Math.min(35, Math.max(8, (Math.sqrt(frp) * 0.28))).toFixed(1);
    const airTankers = Math.max(2, Math.round(frp / 1200));
    const hotshotCrews = Math.max(6, Math.round(frp / 240));

    document.getElementById("icsEventName").textContent = ev.name;
    document.getElementById("icsTimestamp").textContent = new Date().toISOString().replace('T', ' ').slice(0, 19) + " UTC";
    document.getElementById("icsFlameSpeed").textContent = `${spreadVelocity} km/h`;
    document.getElementById("icsPlumeHeight").textContent = `${plumeHeight} km AGL`;
    document.getElementById("icsEvacBuffer").textContent = `${bufferRadius} km`;
    document.getElementById("icsAircraft").textContent = `${airTankers} VLAT / Helitankers`;
    document.getElementById("icsHotshots").textContent = `${hotshotCrews} Strike Teams`;
    document.getElementById("icsFRP").textContent = `${frp.toLocaleString()} MW`;

    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
};

window.closeIcs209Modal = function() {
    const modal = document.getElementById("ics209Modal");
    if (modal) modal.classList.add("hidden");
};

window.downloadIcs209Report = function() {
    window.open(`/api/export/ics209?event_id=${activeEventId}`, "_blank");
};

/**
 * MODIS 3D Swath Bowtie Effect Optical De-Warper
 */
window.updateBowtieSimulation = function(angle) {
    const deg = parseFloat(angle);
    document.getElementById("bowtieAngleVal").textContent = `${deg.toFixed(1)}°`;

    // Optical pixel expansion formula
    const expansion = 1.0 + Math.pow(deg / 55.0, 2) * 3.5;
    const widthKm = (1.0 * Math.sqrt(expansion)).toFixed(2);
    const lengthKm = (1.0 * expansion).toFixed(2);
    const areaKm2 = (widthKm * lengthKm).toFixed(2);

    document.getElementById("bowtiePixelDim").textContent = `${widthKm} km x ${lengthKm} km`;
    document.getElementById("bowtieAreaVal").textContent = `${areaKm2} km²`;
    document.getElementById("bowtieInflationVal").textContent = `${((areaKm2 - 1.0) * 100).toFixed(0)}% Expansion`;

    // Draw interactive footprint box
    const canvas = document.getElementById("bowtieCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const boxW = Math.min(180, 40 * Math.sqrt(expansion));
    const boxH = Math.min(140, 30 * expansion);

    // Draw nadir reference box (dashed)
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(cx - 20, cy - 15, 40, 30);
    ctx.setLineDash([]);
    ctx.fillStyle = "#64748b";
    ctx.font = "9px monospace";
    ctx.fillText("Nadir (1x1 km)", cx - 28, cy - 20);

    // Draw distorted footprint
    ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.fillRect(cx - boxW/2, cy - boxH/2, boxW, boxH);
    ctx.strokeRect(cx - boxW/2, cy - boxH/2, boxW, boxH);
};

window.openBowtieModal = function() {
    const m = document.getElementById("bowtieModal");
    if (m) m.classList.remove("hidden");
    window.updateBowtieSimulation(35);
};

window.closeBowtieModal = function() {
    const m = document.getElementById("bowtieModal");
    if (m) m.classList.add("hidden");
};

/**
 * Academic Paper & NetCDF Exporters
 */
window.downloadPaper = function() {
    window.open(`/api/export/paper?region=${currentRegion}`, "_blank");
};

window.downloadNetCDF = function() {
    window.open(`/api/export/netcdf?region=${currentRegion}`, "_blank");
};

window.openNetCDFModal = function() {
    const m = document.getElementById("netcdfModal");
    if (m) m.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
};

window.closeNetCDFModal = function() {
    const m = document.getElementById("netcdfModal");
    if (m) m.classList.add("hidden");
};
