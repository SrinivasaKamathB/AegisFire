#!/usr/bin/env bash
# AegisFire Startup Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "   AEGISFIRE: NASA SENSOR HARMONIZATION ENGINE"
echo "   NASA Space Apps Challenge 2026 // The Next Frontier"
echo "=========================================================="
echo ""

# Ensure data is generated and model is trained
if [ ! -f "data/processed/harmonized_calendar.json" ]; then
    echo "[*] Initializing NASA FIRMS data and training ML model..."
    PYTHONPATH=. python3 engine/data_generator.py
    PYTHONPATH=. python3 engine/harmonizer_ml.py
fi

echo "[*] Launching FastAPI Analytical Mission Control on http://127.0.0.1:8000 ..."
PYTHONPATH=. python3 -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
