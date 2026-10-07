# Reproducibility Report

This document records the exact configuration, datasets, and frozen artifacts required to reproduce or verify the Phase 1–9 experiments powering the Research Demonstration Platform.

## Environment

### Python Backend / ML
- **Python Version:** 3.10+
- **Key Libraries:** `torch`, `torch-geometric`, `transformers` (Bio_ClinicalBERT), `fastapi`, `pandas`, `scikit-learn`
- **Execution:** Experiments were executed in sequence via the scripts in `src/`.

### Frontend Dashboard
- **Stack:** React 18+, Vite, Tailwind CSS, Recharts
- **Node Version:** 18+

## Datasets
- **IoT Data:** Edge-IIoTset (Industrial IoT cybersecurity dataset).
- **Clinical Data:** MTSamples (Public clinical-text proxy).
- *Note:* No real hospital network data or real patient PHI was used.

## Model Architectures
- **EdgeMLP:** Standard 3-layer Multilayer Perceptron.
- **GraphSAGE:** 2-layer GraphSAGE with neighbor sampling.
- **Text Embedding:** `emilyalsentzer/Bio_ClinicalBERT` (768-D contextual vectors).

## Frozen Experiment Artifacts

All experimental results were locked into `.csv` and `.json` artifacts located in the `results/` directory. The Phase 10 API explicitly reads from these frozen files to ensure absolute scientific integrity without retraining models in the UI.

- `results/phase4_2/` - Centralized Baselines
- `results/phase6_2/` - Multimodal Fusion
- `results/phase7_1/` & `7_2/` - Baseline Federated IID Data
- `results/phase7_3/` - FedAvg Evaluation
- `results/phase8_1/` - Non-IID Evaluation
- `results/phase8_2/` - FedProx Evaluation
- `results/phase8_3/` - Personalization Evaluation
- `results/phase8_4/` - Byzantine Evaluation
- `results/phase8_5/` - Final Consolidation
- `results/phase9/` - DP and Secure Aggregation Accounting

### Known Missing Artifacts
**IMPORTANT:** The physical model weights generated during Phase 7.3 (`results/phase7_3/fedavg_global_model.pth`) were not saved as a reproducible artifact. 

As a result, live inference is currently unavailable. The dashboard is hardcoded to return an HTTP 503 error for inference requests to preserve scientific honesty rather than substituting a fabricated replacement file.

## Testing Commands

To verify the integrity of the data boundaries and UI constraints:

```bash
# Run Backend and API integration tests
pytest tests/test_phase10_backend.py
pytest tests/test_integration.py

# Run Frontend hygiene tests
pytest tests/test_phase10_frontend.py

# Build React dashboard
cd dashboard
npm run build
```
