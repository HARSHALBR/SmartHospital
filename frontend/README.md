# SmartHospital Frontend

Standalone responsive HTML, CSS, and JavaScript interface for the SmartHospital research demonstration. It reads frozen experiment metrics from the repository's existing FastAPI backend and does not alter backend/API behavior.

## Run

1. Start the existing backend from the repository root: `python backend/main.py`
2. Serve this directory on port `5173` (allowed by the existing backend CORS settings), for example `python -m http.server 5173` from `frontend/`.
3. Open `http://localhost:5173`.

The frontend requests `http://127.0.0.1:8000/api/metrics/all`. To use a different host, define `window.SMART_HOSPITAL_API` before `app.js` loads. If the API is unavailable, the interface preserves its layout and reports that verified artifact data could not be loaded.

The Simulation section is a UI preview only. Its configuration, pending state, and future API response contract are documented in [SIMULATION-INTEGRATION.md](./SIMULATION-INTEGRATION.md); it currently makes no simulation requests.

## Scope

This is a research-results interface, not a hospital operations or patient-care application. The Edge-IIoTset and MTSamples datasets are proxies, the three edge clients are simulated, no patient-to-device linkage exists, formal differential privacy was not established, and live inference is blocked by a missing model artifact.
