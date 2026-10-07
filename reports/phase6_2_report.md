# Phase 6.2: Client Assignment Robustness / Confounding Check

## 1. Controlled Non-IID Partition Structure
Unlike Phase 6.1, attacks were pseudo-randomly partitioned non-IID across clients to destroy any 1:1 correlation between clinical specialty and attack type, while keeping the client distributions strictly non-identical.

### Test Set Attack Distributions:
**Client_1**:
- DDoS_HTTP: 3788
- DDoS_ICMP: 12246
- DDoS_TCP: 5287
- DDoS_UDP: 1203
- Fingerprinting: 20
- MITM: 1
- Normal: 12724
- Vulnerability_scanner: 215
- XSS: 61

**Client_2**:
- Backdoor: 175
- DDoS_HTTP: 1860
- DDoS_ICMP: 2607
- DDoS_TCP: 1103
- DDoS_UDP: 255
- Fingerprinting: 27
- MIXED_ATTACK: 2
- Normal: 12980
- Password: 3284
- Port_Scanning: 3076
- Ransomware: 89
- Uploading: 1170
- Vulnerability_scanner: 238

**Client_3**:
- Backdoor: 209
- DDoS_ICMP: 2611
- DDoS_TCP: 1119
- DDoS_UDP: 8299
- MIXED_ATTACK: 23
- Normal: 56
- Password: 3331
- Ransomware: 136
- SQL_injection: 1332
- Uploading: 1139
- XSS: 424

## 2. Global Results (Phase 6.2 Test Set)

| Metric | IoT-Only | Clinical-Only | Multimodal |
|---|---|---|---|
| **F1** | 0.9774 | 0.5033 | 0.9764 |
| **Recall** | 0.9680 | 0.3366 | 0.9680 |
| **Precision** | 0.9870 | 0.9970 | 0.9849 |
| **PR-AUC** | 0.9921 | 0.7989 | 0.9943 |
| **ROC-AUC** | 0.9880 | 0.5294 | 0.9912 |

## 3. Client-Specific Performance (Phase 6.2)

| Client | Edges | IoT Attack % | IoT-Only F1 | Multimodal F1 | ΔF1 |
|---|---|---|---|---|---|
| Client_1 | 35545 | 64.2% | 0.9723 | 0.9719 | -0.0003 |
| Client_2 | 26866 | 51.7% | 0.9663 | 0.9626 | -0.0037 |
| Client_3 | 18679 | 99.7% | 0.9920 | 0.9923 | +0.0002 |

## 4. Phase 6.1 vs Phase 6.2 Comparison & Confounding Analysis

- **Phase 6.1 Multimodal ΔF1 (Confounded)**: +0.0155
- **Phase 6.2 Multimodal ΔF1 (Deconfounded)**: -0.0010

The Phase 6.1 improvement was sensitive to the client assignment structure and should be interpreted as a simulation artifact rather than generalized clinical predictive information. By removing the deterministic specialty-to-attack shortcut, the multimodal F1 gain disappeared (or decreased substantially), demonstrating that the neural network was previously exploiting the artificial confounding correlation.
