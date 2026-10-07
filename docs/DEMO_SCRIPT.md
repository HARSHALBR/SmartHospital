# Smart Hospital Federated Learning: Demo Script

**Total Estimated Time:** 5-7 minutes

---

### 00:00–00:30 | Problem Statement
*(Screen: Dashboard Landing Page)*
"Welcome to the Research Demonstration Platform for our project on Multimodal IoT Anomaly Detection using Federated Learning. Modern smart hospitals generate massive amounts of data from IoT telemetry and clinical notes. Centralizing this data creates massive bandwidth bottlenecks, violates privacy principles, and creates single points of failure. Our goal was to investigate if we could push anomaly detection to the edge using federated learning without sacrificing performance."

### 00:30–01:00 | Dataset and Limitations
*(Screen: Dataset Analysis)*
"To evaluate this, we used the Edge-IIoTset dataset, an industrial IoT cybersecurity dataset, alongside MTSamples, a public clinical-text development proxy. It's important to note up front: these are proxy datasets. There is no real patient-to-device linkage, and no real hospital telemetry was used in this research."

### 01:00–01:45 | Graph Construction
*(Screen: Graph Construction)*
"Because IoT attacks are inherently relational, we first transformed raw pcap network flows into canonical graphs. As you can see in this conceptual visualization, we extract 10-second temporal windows and map flows into nodes connected by multi-edge features. We explicitly stripped out payload data and anonymized IP identifiers to preserve baseline data locality."

### 01:45–02:30 | Baseline Model Results
*(Screen: Centralized Baselines / Model Performance)*
"We tested multiple centralized baselines, including GraphSAGE and EdgeMLP, against this topology. As shown here by the verified backend results, EdgeMLP was the strongest baseline, achieving over 0.99 F1. GraphSAGE suffered from over-smoothing due to the dense structural nature of the temporal windows. This baseline serves as our oracle for the rest of the federated evaluation."

### 02:30–03:15 | Clinical Semantic Vectorization + Multimodal
*(Screen: Clinical Vectorization & Multimodal)*
"Next, we asked if clinical context could improve network anomaly detection. We used Bio_ClinicalBERT to generate 768-D semantic representations from our proxy clinical text. However, when we fused this with the IoT vectors, we discovered a key negative result: clinical semantic embeddings did not produce meaningful packet-level F1 improvement in our controlled evaluation."

### 03:15–04:00 | Federated Learning + Non-IID
*(Screen: Centralized vs Federated & Non-IID)*
"We then moved to a Federated Learning architecture to keep data at the hospital edge. Federated IoT performance matched the centralized oracle almost perfectly. However, when we simulated differing hospital data distributions—known as Non-IID heterogeneity—we saw that while Global F1 remained stable, the performance on the *worst-performing client* explicitly degraded as data skew became more severe."

### 04:00–04:45 | FedProx + Personalization
*(Screen: FedProx & Personalization)*
"To combat this degradation, we tested FedProx and Personalized FL. We found that FedProx successfully reduced structural model drift—especially at $\mu=0.01$—but provided only a marginal improvement in actual classification performance. Similarly, local personalization (fine-tuning the global model on local data) produced a small improvement, largely because the baseline model was already near saturation."

### 04:45–05:30 | Byzantine Robustness
*(Screen: Byzantine Robustness)*
"Federated networks are vulnerable to compromised clients. We ran a controlled sign-flip attack experiment. When a minority of clients sent malicious updates, simply switching the aggregation algorithm from FedAvg to a Coordinate-wise Median successfully mitigated the attack. However, when an adversarial majority occurred (e.g., 2 out of 3 clients), the Median defense mathematically failed."

### 05:30–06:15 | Privacy/Security + Attack Simulation
*(Screen: Privacy & Security & Attack Simulation)*
"We also evaluated privacy formally. While Federated Learning keeps raw text local—as demonstrated in our Attack Simulation—it is not a formal privacy guarantee. When we attempted to apply formal $\epsilon$-$\delta$ Differential Privacy, the accounting mathematically failed to bound due to our 3-client topology. Furthermore, our Secure Aggregation mechanism remains a lightweight research simulation, not production cryptography."

### 06:15–07:00 | Key Findings + Limitations
*(Screen: About / Dashboard Limitations)*
"In conclusion, we successfully demonstrated that Federated EdgeMLP can match centralized anomaly detection without moving raw data. However, our rigorous evaluation highlighted crucial limitations: clinical fusion was ineffective at the packet level, formal DP was unbounded, and advanced Byzantine attacks require more than simple Median aggregation. Thank you."
