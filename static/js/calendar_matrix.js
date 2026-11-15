/**
 * AegisFire: 52-Week x 26-Year Burning Activity Calendar Matrix (Multi-Region)
 */

let calendarData = [];
let currentCalendarRegion = "california";
let audioCtx = null;
let isSonificationActive = false;

window.toggleAudioSonification = function() {
    isSonificationActive = !isSonificationActive;
    if (isSonificationActive && !audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    const btn = document.getElementById("btnAudioSonification");
    const icon = document.getElementById("audioIcon");
    const text = document.getElementById("audioText");
    if (btn) {
        if (isSonificationActive) {
            btn.className = "px-2.5 py-1.5 rounded-md border border-amber-500 bg-amber-50 text-amber-900 font-mono text-xs flex items-center gap-1.5 shadow-sm transition font-semibold";
            if (text) text.textContent = "Flame Sonification: ACTIVE";
            if (icon) {
                icon.className = "w-3.5 h-3.5 text-amber-600";
                icon.setAttribute("data-lucide", "volume-2");
            }
        } else {
            btn.className = "px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs flex items-center gap-1.5 shadow-sm transition";
            if (text) text.textContent = "Flame Sonification: OFF";
            if (icon) {
                icon.className = "w-3.5 h-3.5 text-slate-400";
                icon.setAttribute("data-lucide", "volume-x");
            }
        }
        if (window.lucide) lucide.createIcons();
    }
};

function playFireTone(frp, zscore) {
    if (!isSonificationActive || !audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const subOsc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        filter.type = "lowpass";
        
        if (frp <= 10) {
            // Dormant baseline: subtle 110 Hz soft sine
            osc.type = "sine";
            osc.frequency.setValueAtTime(110, now);
            filter.frequency.setValueAtTime(250, now);
            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        } else if (frp < 1500) {
            // Elevated fire: triangle wave with sweeping filter
            osc.type = "triangle";
            const baseFreq = 160 + Math.min(240, Math.log10(frp) * 60);
            osc.frequency.setValueAtTime(baseFreq, now);
            filter.frequency.setValueAtTime(600 + frp * 0.4, now);
            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.exponentialRampToValueAtTime(0.07, now + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        } else {
            // Megafire chord: Sub bass + Sawtooth harmonic roar
            osc.type = "sawtooth";
            const baseFreq = 220 + Math.min(300, Math.log10(frp) * 80);
            osc.frequency.setValueAtTime(baseFreq, now);

            subOsc.type = "sawtooth";
            subOsc.frequency.setValueAtTime(baseFreq / 2, now); // Sub-octave

            filter.frequency.setValueAtTime(1800 + Math.min(2500, frp * 0.5), now);
            filter.Q.setValueAtTime(3.0, now);

            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            subOsc.connect(filter);
            subOsc.start(now);
            subOsc.stop(now + 0.25);
        }

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + (frp > 1500 ? 0.25 : 0.18));
    } catch (e) {
        console.warn("Audio sonification glitch:", e);
    }
}

window.initCalendar = async function() {
    await window.loadCalendarData("california");
};

window.loadCalendarData = async function(region) {
    currentCalendarRegion = region || currentCalendarRegion;
    try {
        const res = await fetch(`/api/calendar?region=${currentCalendarRegion}`);
        calendarData = await res.json();
        window.renderCalendarMatrix();
    } catch (err) {
        console.error("Failed to load calendar data:", err);
    }
};

window.renderCalendarMatrix = function() {
    const container = document.getElementById("calendarMatrix");
    if (!container || calendarData.length === 0) return;

    const metricSelect = document.getElementById("calendarMetricSelect");
    const metric = metricSelect ? metricSelect.value : "harmonized_frp";

    const years = [];
    for (let yr = 2000; yr <= 2025; yr++) years.push(yr);

    let html = `<div class="flex items-center text-[10px] font-mono text-slate-500 mb-1">
        <span class="w-12 text-right pr-2">Year</span>
        <div class="flex-1 flex justify-between pr-1">`;
    
    for (let wk = 1; wk <= 52; wk += 4) {
        html += `<span>W${wk}</span>`;
    }
    html += `<span>W52</span></div></div>`;

    years.forEach(yr => {
        html += `<div class="flex items-center mb-1.5 group">
            <span class="w-12 text-right pr-2 font-mono text-xs text-slate-400 group-hover:text-sky-700 font-medium">${yr}</span>
            <div class="flex-1 flex gap-[3px]">`;

        for (let wk = 1; wk <= 52; wk++) {
            const record = calendarData.find(d => d.year === yr && d.week === wk);
            const val = record ? record[metric] : 0;
            const bg = getCellColor(metric, val);

            html += `<div class="matrix-cell flex-1 h-4 md:h-5 rounded-[2px] cursor-pointer" 
                          style="background-color: ${bg};"
                          data-year="${yr}" data-week="${wk}"
                          onmouseenter="onCellHover(${yr}, ${wk})"></div>`;
        }
        html += `</div></div>`;
    });

    container.innerHTML = html;
};

function getCellColor(metric, val) {
    if (metric === "anomaly_zscore") {
        if (val <= 0) return "#f1f5f9";
        if (val < 1.0) return "#93c5fd";
        if (val < 2.0) return "#f59e0b";
        if (val < 3.0) return "#ea580c";
        return "#dc2626";
    } else if (metric === "harmonized_frp") {
        if (val <= 5) return "#f1f5f9";
        if (val < 100) return "#93c5fd";
        if (val < 500) return "#fbbf24";
        if (val < 1500) return "#f97316";
        if (val < 4000) return "#ea580c";
        return "#b91c1c";
    } else { // fire_count
        if (val <= 0) return "#f1f5f9";
        if (val < 15) return "#93c5fd";
        if (val < 50) return "#fbbf24";
        if (val < 150) return "#f97316";
        return "#dc2626";
    }
}

window.onCellHover = function(year, week) {
    const record = calendarData.find(d => d.year === year && d.week === week);
    const tooltip = document.getElementById("calendarTooltip");
    
    // Web Audio Tone Synthesis
    playFireTone(record ? record.harmonized_frp : 0, record ? record.anomaly_zscore : 0);

    if (!tooltip) return;

    if (!record || record.harmonized_frp === 0) {
        tooltip.innerHTML = `<span class="text-slate-900 font-bold">${year} // Week ${week}:</span> <span class="text-slate-500">Minimal / Dormant fire activity</span>`;
        return;
    }

    const frp = record.harmonized_frp.toLocaleString();
    const z = record.anomaly_zscore > 0 ? `+${record.anomaly_zscore}` : `${record.anomaly_zscore}`;
    let severityLabel = "Nominal";
    if (record.anomaly_zscore > 2.5) severityLabel = "Extreme Megafire Episode";
    else if (record.anomaly_zscore > 1.5) severityLabel = "Severe Burning Season";
    else if (record.anomaly_zscore > 0.5) severityLabel = "Elevated Fire Weather";

    tooltip.innerHTML = `<span class="text-slate-900 font-bold">[${currentCalendarRegion.toUpperCase()}] ${year} // Week ${week}:</span> ` +
        `Harmonized FRP: <span class="text-amber-700 font-bold">${frp} MW</span> | ` +
        `Hotspots: <span class="text-sky-700 font-bold">${record.fire_count}</span> | ` +
        `Climate Z-Score: <span class="${record.anomaly_zscore > 1.5 ? 'text-rose-600' : 'text-emerald-700'} font-bold">${z}σ</span> ` +
        `<span class="text-xs px-2 py-0.5 ml-2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-semibold">(${severityLabel})</span>`;
};
