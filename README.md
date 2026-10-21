# Semantic Vectorization + Federated Graph Learning for Multi-Modal IoT Anomaly Detection in Smart Hospitals

**Status:** Research Demonstration Platform & Live Simulation Center — COMPLETE
**Primary Deployment Routes:**
- `/` — Research Platform Overview & Empirical Metrics
- `/network-simulation` — Live Star Topology Network Simulation & DPI Threat Detector
- `/simulation` — Interactive Smart Hospital Simulation Center (GraphSAGE, Bio_ClinicalBERT, Federated Playground)

---

## 1. Project Overview & Motivation

Modern smart hospitals rely on a massive influx of Internet of Medical Things (IoMT) telemetry and electronic health record (EHR) text. Centralizing raw patient vitals and network flow logs creates:
1. **Severe Bandwidth & Latency Bottlenecks:** Centralized aggregation across thousands of medical devices causes congestive packet loss and delays critical alarms.
2. **Data Locality & Privacy Violations:** Regulatory frameworks (e.g., HIPAA, GDPR) restrict transmitting raw clinical records or unencrypted telemetry across perimeter boundaries.
3. **Single Point of Vulnerability:** Central aggregators are prime targets for adversarial poisoning, distributed denial-of-service (DDoS) bursts, and model inversion attacks.

This project investigates whether edge anomaly detection can be effectively achieved via **Federated Graph Learning**, combining topological IoT network structure with clinical semantic context, while establishing empirical defenses against Byzantine poisoning and privacy leaks.

---

## 2. Research Architecture

The system operates strictly at the hospital edge across five synchronized tiers:

```
[ Medical IoT Devices ] ──> Temporal Flow Graph (10s window) ──> GraphSAGE (128-D) ──┐
                                                                                     ├──> Multimodal Fusion (256-D) ──> Edge Anomaly Prediction
[ Clinical Notes / EHR ] ──> Tokenization ──> Bio_ClinicalBERT ──> Semantic (128-D) ──┘
                                                                                     │
[ Federated Learning ] <─── Local Gradient/Weight Updates (FedAvg / FedProx) <───────┘
                                   │
                                   ▼
              [ Central Aggregator / Security Gateway ]
              • Coordinate-wise Median Defense (Byzantine Robust)
              • Differential Privacy Accounting (Gaussian Mechanism)
              • Deterministic DPI Policy Engine (Rate & Buffer Limits)
```

1. **IoT Graph Construction:** Edge-IIoTset network traffic flows are grouped into 10-second temporal graphs. GraphSAGE extracts localized 1-hop and 2-hop structural node embeddings (128-D).
2. **Clinical Semantic Representation:** Clinical development text is tokenized and projected through Bio_ClinicalBERT to extract semantic context embeddings (128-D).
3. **Multimodal Edge Fusion:** The 128-D topological graph vector and 128-D clinical semantic vector are concatenated into a unified 256-D multimodal representation for edge inference.
4. **Federated Model Aggregation:** A 3-client hospital topology computes local edge updates. Parameter deltas (not raw data) are exchanged with the central aggregator using `FedAvg` and `FedProx`.
5. **Security & Privacy Layer:** Incorporates Byzantine-resilient aggregation (Coordinate-wise Median), Differential Privacy accounting ($\sigma = 0.1$), and authenticated in-flight transport encryption.

---

## 3. Live Network Simulation Center (`/network-simulation`)

The `/network-simulation` route provides a live, interactive cybersecurity operations center (SOC) demonstration of hospital-to-server network telemetry and deep packet inspection (DPI):

### Key Capabilities:
- **Interactive Star Topology:** Displays 4 Hospital Edge Nodes connected to the Central Aggregation Gateway:
  - *Hospital A (Metro General)* — Regional Trauma Center
  - *Hospital B (St. Jude Center)* — Pediatric Specialty
  - *Hospital C (Memorial Clinic)* — Outpatient Clinic (Designated Anomaly Source)
  - *Hospital D (University Health)* — Academic Research Center
- **6-Stage Observable Lifecycle Pipeline:** Every transmission executes an observable, deterministic pipeline:
  $$\text{1. CREATED} \longrightarrow \text{2. ENCRYPTED} \longrightarrow \text{3. IN TRANSIT} \longrightarrow \text{4. RECEIVED} \longrightarrow \text{5. INSPECTING} \longrightarrow \text{6. VERDICT}$$
- **Authenticated Transport Encryption (Web Crypto AES-GCM):**
  - Generates a cryptographically random, unique **12-byte (96-bit) IV nonce** per transmission via `window.crypto.getRandomValues`.
  - Performs authenticated decryption at the gateway (`decryptAndVerifyPayload`). Tampered ciphertext or altered authentication tags are rejected.
  - Secret keys remain encapsulated in memory and are never exposed in UI text or logs.
- **Deterministic Gateway Rule Classifier:**
  - Evaluates traffic rate against configurable threshold ($\text{Rate} > 5.0\text{ pkt/s}$).
  - Evaluates payload buffer against standard MTU limits ($\text{Buffer} > 1500\text{ B}$).
  - Inspects command payloads for unauthorized signatures (`BUFFER_OVERFLOW`, `EXFILTRATION`, `PORT_SCAN`).
- **Real-Time Incident Response & Quarantine:**
  - When an anomaly is injected from Hospital C, the gateway enters an active scanning state (`INSPECTING`), flags the violation, pulses crimson red, marks Hospital C as `[QUARANTINED]`, and illuminates the conduit in red.
  - Generates a prominent `ANOMALY DETECTED` alert with Event ID, Threat Source, Observed Metrics vs. Thresholds, and Severity (`CRITICAL`).
- **Real-Time Event Log & Zero-Leak Reset:**
  - Detailed audit table tracking Packet ID, Timestamp, Source Node, Metrics, Encryption Tag, Classification, and Remediation.
  - The **Reset Simulation** button halts pending `requestAnimationFrame` cycles, cancels timers, clears alerts, restores nodes to `[ONLINE]`, and resets counters to baseline.

---

## 4. Interactive Research Simulation Center (`/simulation`)

The `/simulation` route hosts a multi-tab simulation platform for exploring model architecture and empirical findings:

1. **Hospital Network Topology:** Interactive client distribution with live scenario switching (`Normal Telemetry` vs. `Suspicious Influx`).
2. **IoT Communication Graph:** Interactive SVG node-link graph with mathematical Breadth-First Search (BFS) neighborhood derivation (`graphUtils.js`), displaying 1-hop direct adjacency and 2-hop GraphSAGE receptive fields with visual halos.
3. **Clinical Semantic Vectorization:** Tokenizer inspection, Bio_ClinicalBERT layer projections, and 128-D vector slicing.
4. **Multimodal Representation:** Interactive 256-D concatenation inspector with temporal scaling.
5. **Federated Learning Playground:** 5-stage interactive round stepper (Local Training $\rightarrow$ Differential Privacy Injection $\rightarrow$ Client Transmission $\rightarrow$ Byzantine Defense $\rightarrow$ Global Model Broadcast).
6. **Research Results & Empirical Limitations:** Live verification against FastAPI backend endpoints, displaying Phase 8 non-IID benchmarks, Byzantine sign-flip resilience, secure aggregation overheads, and the Phase 7.3 missing weight guardrail (HTTP 503).

---

## 5. Dataset Description & Provenance

- **Edge-IIoTset:** A comprehensive cybersecurity dataset for industrial and medical IoT consisting of normal telemetry and 14 attack categories.
- **MTSamples:** A public repository of clinical transcription notes used as a development proxy for EHR semantic modeling.
- *Notice:* Datasets are public research proxies; no real patient records or PHI are utilized in this research.

---

## 6. Key Experimental Findings

| Dimension | Baseline / Setup | Tested Scenario | Result & Empirical Finding |
| :--- | :--- | :--- | :--- |
| **Model Architecture** | Centralized EdgeMLP | GraphSAGE GNN | EdgeMLP was the strongest validated IoT baseline ($F1 = 0.9926$); GraphSAGE showed comparable topological representation. |
| **Federated Convergence** | Centralized IoT | 3-Client FedAvg | Federated IoT performance was comparable to centralized baseline under IID conditions. |
| **Data Heterogeneity** | IID Distribution | Severe Non-IID ($\alpha = 0.1$) | Increasing non-IID severity degraded worst-client performance from $0.9926$ to $0.9882$. |
| **Drift Mitigation** | FedAvg under Non-IID | FedProx ($\mu = 0.01$) | FedProx reduced gradient divergence and stabilized worst-client convergence, providing marginal F1 stabilization. |
| **Byzantine Poisoning** | Malicious Majority | Minority Sign-Flip | Coordinate-wise Median successfully mitigated minority sign-flip attacks ($F1 = 0.9918$ vs. FedAvg $0.4000$), but failed when Byzantine clients held a majority. |
| **Multimodal Confounding** | IoT Flow Only | IoT + Clinical BERT | **Empirical Negative Finding:** Clinical text embeddings did not produce packet-level $F1$ gains ($\Delta F1 = 0.0000$), demonstrating that high-level EHR semantics do not correlate with microsecond network flow anomalies. |

---

## 7. System Limitations & Scientific Honesty

1. **Proxy Data:** Edge-IIoTset and MTSamples are research proxies. No synthetic patient-to-device coupling claims real clinical correlation.
2. **Semantic Confounding:** High-level clinical text captures administrative diagnostic context, not microsecond network flow causality.
3. **Unreleased Checkpoint Guardrail:** Live inference on missing Phase 7.3 global weights is safely blocked with an informative HTTP 503 response.
4. **Differential Privacy Guarantee:** Formal $(\epsilon, \delta)$-DP privacy guarantees were mathematically limited due to the small $N=3$ client topology.
5. **Demonstration Encryption:** In-transit encryption on `/network-simulation` uses client-side Web Crypto AES-GCM for illustrative demonstration rather than full operating system TLS infrastructure.

---

## 8. Installation & Quickstart

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ and npm

### A. FastAPI Backend Startup
```bash
# From repository root
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation is accessible at `http://127.0.0.1:8000/docs`.

### B. Frontend Dashboard Startup
```bash
cd dashboard
npm install
npm run dev
```
Dashboard will be available at `http://localhost:5173`.

---

## 9. Testing & Build Verification

Execute all verification checks from the project root:

```bash
# 1. Run full test suite (Network Simulation, Simulation Audit, Frontend Rules)
pytest tests/test_network_simulation.py tests/test_simulation_audit.py tests/test_phase10_frontend.py

# 2. Check git formatting and whitespace cleanliness
git diff --check

# 3. Compile frontend production bundle
cd dashboard && npm run build
```

---

## 10. Faculty Demonstration Flow (3-Minute Script)

1. **Network Simulation (`/network-simulation`):**
   - **Step 1 — Baseline Verification:** Click **"Send Normal Packet"**. Follow the 6-step pipeline indicator advancing through `CREATED` $\rightarrow$ `ENCRYPTED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `RECEIVED` $\rightarrow$ `INSPECTING` $\rightarrow$ `VERDICT`. Note the green encrypted packet traveling along the conduit and normal counter increment.
   - **Step 2 — Anomaly Injection:** Click **"Inject Demo Anomaly (Hospital C)"**. Observe the high-rate burst travel to the gateway, the amber inspection radar sweep, and the prominent red **ANOMALY DETECTED** alert ($15.8\text{ pkt/s} > 5.0\text{ pkt/s}$ limit). Note the conduit turning red and Hospital C marked as `[QUARANTINED]`.
   - **Step 3 — Clean Reset:** Click **"Reset Simulation"** to demonstrate instantaneous state clearance and return to baseline.
2. **Research Simulation Center (`/simulation`):**
   - Walk through the GraphSAGE 1-hop and 2-hop neighborhood derivation halos on the IoT Communication Graph.
   - Show the 5-stage Federated Round stepper and the empirical limitation cards in Research Results.
