# Phase 5: Dataset Selection Analysis
**Clinical Text Semantic Vectorization**

## 1. Objective & Requirements
Due to the restricted nature of MIMIC-IV-Note (requiring PhysioNet credentialing and a formal Data Use Agreement), we require a publicly accessible dataset to develop the "Semantic Vectorization" and "Federated Client Partition" pipeline for Phase 5. The dataset must contain biomedically relevant text to evaluate BioBERT representations while ensuring no privacy/licensing breaches occur.

---

## 2. Candidate Datasets

### Candidate 1: Medical Transcription Samples (MTSamples)
- **Official Source**: mtsamples.com (often hosted on Kaggle or HuggingFace)
- **Description**: A collection of transcribed medical notes and reports covering various medical specialties (e.g., Surgery, Consults, Discharge Summaries).
- **Approximate Size**: ~5,000 documents.
- **Text Type**: Real-world clinical notes (de-identified / scrubbed).
- **Labels**: Medical Specialty / Note Type.
- **Access Requirements**: Completely public.
- **License/Usage Restrictions**: Open for research/educational use.
- **BioBERT Suitability**: Excellent. The language mirrors MIMIC-IV-Note exactly (e.g., SOAP notes, clinical shorthand, anatomical references).
- **Advantages**: Structurally identical to the downstream target (MIMIC). No synthetic fabrication required. Open access.
- **Limitations**: Relatively small size compared to MIMIC's millions of notes. No inherent anomaly labels.
- **Relevance**: Extremely high for prototyping clinical semantic embeddings.

### Candidate 2: PubMed 200k RCT
- **Official Source**: National Institutes of Health (NIH) / GitHub (dernoncourt/pubmed-rct)
- **Description**: Abstracts of randomized controlled trials from PubMed.
- **Approximate Size**: ~200,000 abstracts.
- **Text Type**: Biomedical literature (scientific prose).
- **Labels**: Sentence role (Background, Objective, Method, Result, Conclusion).
- **Access Requirements**: Completely public.
- **License/Usage Restrictions**: Open access.
- **BioBERT Suitability**: Perfect fit for BioBERT (which was heavily pre-trained on PubMed).
- **Advantages**: Very large, cleanly labeled, highly standardized.
- **Limitations**: It is scientific literature, not clinical notes. Lacks the unstructured, messy shorthand of EHR systems.
- **Relevance**: Moderate. Great for NLP pipelines, but fails to simulate the "Hospital Note" environment.

### Candidate 3: PMC-Patients
- **Official Source**: HuggingFace (`zhengyun21/PMC-Patients`)
- **Description**: A dataset of patient case reports extracted from PubMed Central open-access articles.
- **Approximate Size**: ~167,000 patient summaries.
- **Text Type**: Clinical case reports.
- **Labels**: Patient demographics, outcomes, disease types.
- **Access Requirements**: Completely public.
- **BioBERT Suitability**: Very high.
- **Advantages**: Focuses specifically on patient summaries, maintaining clinical relevance.
- **Limitations**: Still slightly more polished than raw EHR notes, as they are published case reports.
- **Relevance**: High. Excellent for patient-level representation learning.

---

## 3. Dataset Selection
**Recommendation: MTSamples (Medical Transcription Samples)**

**Rationale**: While PubMed RCT and PMC-Patients are larger, **MTSamples** is the only dataset that accurately simulates the raw, unstructured format of Electronic Health Records (EHRs) found in MIMIC-IV-Note. MTSamples contains actual discharge summaries, operative notes, and history/physical exams. This ensures that the tokenization, truncation, and BioBERT pooling strategies developed here will transfer seamlessly to MIMIC-IV-Note once credentialed access is established. 

*Note: The project explicitly distinguishes that MTSamples is the **ACTUAL DEVELOPMENT DATASET**, acting as a public proxy for the **ORIGINAL PLAN** (MIMIC-IV-Note).*

---

## 4. Federated Client Partition Simulation Strategy

Because there is no natural patient-to-device mapping between MTSamples (or MIMIC) and the Edge-IIoTset, creating fake 1:1 patient-to-sensor mappings is scientifically invalid. 

Instead, we will simulate **Hospital Clients** at the institutional level, treating each client as a distinct data silo that possesses a partition of both modalities.

**Simulation Strategy:**
1. Define $K$ hospital clients (e.g., $K=5$).
2. **Clinical Partitioning**: The MTSamples dataset will be split into $K$ partitions. To simulate non-IID (heterogeneous) hospital distributions, we can partition the clinical text by **Medical Specialty** (e.g., Client 1 primarily handles Surgery notes, Client 2 handles Psychiatry notes).
3. **IoT Partitioning**: The Phase 4.2 Edge-IIoT Canonical Flow graph will be partitioned into $K$ subgraphs. To simulate non-IID distributions, we can partition by **Attack Type** or **Subnet** (e.g., Client 1 experiences mostly DDoS attacks, Client 2 experiences Port Scanning).
4. **Federated Learning Objective**: Each hospital trains local feature extractors (GraphSAGE for IoT, BioBERT for Text). The central server aggregates these modalities at the *model-weight* level via Federated Averaging (FedAvg), bypassing the need for explicit sample-to-sample alignment.

This strategy accurately simulates a private, multi-modal healthcare consortium without fabricating false patient-device links.
