# Semantic Vectorization + Federated Graph Learning for Multi-Modal IoT Anomaly Detection in Smart Hospitals

**Status:** Research Demonstration Platform — COMPLETE

## 1. Project Title
Semantic Vectorization + Federated Graph Learning for Multi-Modal IoT Anomaly Detection in Smart Hospitals

## 2. Problem Statement
Modern smart hospitals rely on a massive influx of IoT telemetry and clinical data. Centralizing this heterogeneous data introduces severe bandwidth bottlenecks, violates patient data locality (e.g., HIPAA principles), and creates single points of failure vulnerable to adversarial poisoning and inference attacks.

## 3. Research Motivation
This project investigates whether anomaly detection can be effectively pushed to the hospital edge using Federated Learning, avoiding the raw-data transmission risks of centralized architectures. It also tests if combining network topological data with clinical semantic context improves predictive accuracy, and empirically stresses the network against Byzantine attacks and privacy restrictions.

## 4. Architecture
The architecture operates strictly at the hospital edge:
1. **IoT Data** → Graph Construction → IoT Representation (128-D)
2. **Clinical Text** → Bio_ClinicalBERT → Semantic Representation (128-D)
3. **Multimodal Fusion** → Concatenation (256-D) → Local Edge Prediction
4. **Federated Learning** → Model Parameter Exchanging (No raw data)
5. **Security Layer** → Aggregation Defenses (Coordinate-wise Median), DP constraints.

## 5. Dataset Description
- **Edge-IIoTset:** An industrial IoT cybersecurity dataset (not real hospital clinical telemetry).
- **MTSamples:** A public clinical-text development proxy.
*(Note: No real patient-to-device linkage exists in this research).*

## 6. Methodology
We preprocessed raw network flows into 10-second temporal graphs. Baseline centralized models (GraphSAGE, EdgeMLP) were evaluated. The best baseline (EdgeMLP) was pushed into a 3-client Federated Learning topology. We then sequentially applied Non-IID distributions, FedProx, Personalized FL, Byzantine attacks (Sign-Flip), Differential Privacy accounting, and Secure Aggregation masks.

## 7. Phase-wise Research Pipeline
- **Phase 1-2:** Dataset & Preprocessing
- **Phase 3:** Graph Construction
- **Phase 4:** Centralized Baselines
- **Phase 5-6:** Clinical + Multimodal
- **Phase 7:** Federated Learning
- **Phase 8:** Non-IID / FedProx / Personalization / Byzantine
- **Phase 9:** Privacy & Security
- **Phase 10:** Research Demonstration Platform

## 8. Experimental Results
*Verified Experimental Results:*
- Edge MLP was the strongest validated baseline.
- Federated IoT performance was comparable to centralized IoT.
- Increasing non-IID severity primarily degraded worst-client performance.
- FedProx reduced model drift but provided only marginal F1 improvement.
- Coordinate-wise Median mitigated the tested minority sign-flip attack but failed under the malicious majority.
- Clinical semantic embeddings did not produce meaningful packet-level F1 improvement.

## 9. Federated Learning Methodology
We simulated a 3-client hospital topology utilizing `FedAvg`. Model updates (not raw tensors) were transmitted to a central aggregator. This enforces baseline data locality but is not a formal cryptographic privacy guarantee.

## 10. Privacy/Security Evaluation
Formal $\epsilon$-$\delta$ differential privacy was not established due to the mathematical limits of the $N=3$ topology. Secure aggregation was implemented purely as a lightweight research simulation.

## 11. Limitations
- **Dataset:** Datasets are proxies; no real patient data is used.
- **Semantic:** Clinical embeddings capture context, not packet-level causality.
- **Inference:** Live inference is currently unavailable because the reproducible Phase 7.3 model-weight artifact is missing.
- **Privacy:** Formal DP guarantee was not established.

## 12. Dashboard Instructions
The dashboard is a React application that visualizes the frozen `.csv` and `.json` artifacts from Phases 1–9. It relies entirely on the FastAPI backend for its data layer.

## 13. Backend Startup
```bash
python backend/main.py
# or
uvicorn backend.main:app --reload
```

## 14. Frontend Startup
```bash
cd dashboard
npm install
npm run dev
```

## 15. Testing Commands
```bash
pytest tests/
cd dashboard
npm run build
```

## 16. Demo Walkthrough
See `docs/SIH_DEMO_FLOW.md` and `docs/DEMO_SCRIPT.md` for a guided presentation structure.

## 17. Reproducibility Notes
See `docs/REPRODUCIBILITY.md` for details on environments, models, and artifacts. All charts and metrics are guaranteed to source strictly from the frozen Phase 1-9 historical artifacts.
