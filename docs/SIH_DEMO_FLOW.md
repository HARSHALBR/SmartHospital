# SIH / Faculty Demo Flow

This guide outlines exactly which screens to open during a live demonstration to logically tell the story of the project.

### Recommended Screen Order

1. **Dashboard (`/`)**
   - Goal: Introduce the project, the architecture pipeline, and the verified results map.
2. **Dataset (`/dataset`)**
   - Goal: Show the Edge-IIoTset class imbalance and raw packet statistics. Explain the proxy nature of the data.
3. **Graph Construction (`/graph`)**
   - Goal: Click through the interactive conceptual stages (Raw Packets → Canonical Identity → Temporal Window → Graph Representation).
4. **Model Performance (`/performance`)**
   - Goal: Point out that EdgeMLP outperformed GraphSAGE.
5. **Multimodal Architecture (`/multimodal`)**
   - Goal: Toggle the architecture switches (IoT vs Clinical vs Fusion) to explicitly show the negative result (no significant F1 improvement).
6. **Federated Learning (`/cent-vs-fed`)**
   - Goal: Show the animated loop of Client → Server. Point out that FedAvg matches Centralized performance.
7. **Non-IID Analysis (`/non-iid`)**
   - Goal: Use the Severity Selector to show the drop in *Worst Client F1* as heterogeneity increases to "Severe".
8. **FedProx (`/fedprox`)**
   - Goal: Toggle the View Mode to "Model Drift" and click the $\mu$ selectors to show structural collapse without major F1 gain.
9. **Byzantine Robustness (`/byzantine`)**
   - Goal: Select "Attack_C2" with "FedAvg" (F1 drops), then switch to "Median" (F1 recovers). Then select "Attack_C1_C2 (2/3)" to show the Median defense failing under an adversarial majority.
10. **Privacy & Security (`/privacy`)**
    - Goal: Click through Data Locality, DP (showing the mathematical failure bound), and Secure Aggregation simulation.
11. **Attack Simulation (`/attack`)**
    - Goal: Enter synthetic text, toggle between Raw Text Exposure and Vector Exposure, and review the Threat Category explanations to demonstrate understanding of inversion risks.
12. **Limitations (`/about` or Dashboard footer)**
    - Goal: Conclude by honestly presenting the project's limitations.

### Fallback Instructions

If the FastAPI backend is unavailable during the live presentation (e.g., port conflicts, python environment issues):
1. The frontend will dynamically render a graceful **ErrorState** ("Failed to load data") instead of crashing.
2. Rely on the `DEMO_SCRIPT.md` and the static architecture diagrams within `/graph`, `/attack`, and `/clinical`, which do not require backend data to render the conceptual flows.
3. Restart the backend via `python backend/main.py` if possible.
