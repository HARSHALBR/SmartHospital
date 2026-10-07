import React from 'react';
import { VerifiedBadge } from '../components/StatusBadges';
import { Info, AlertTriangle, ShieldCheck, FileText, Network, CheckCircle2 } from 'lucide-react';

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Project Overview
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">About the Project</h1>
          <p className="text-slate-500 text-sm mt-1">
            Research demonstration platform for privacy-aware multi-modal anomaly detection in smart hospital environments.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Core Project Definition */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          "Semantic Vectorization + Federated Graph Learning for Multi-Modal IoT Anomaly Detection in Smart Hospitals"
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
          This research develops a federated learning architecture using GraphSAGE and EdgeMLP to detect cybersecurity anomalies directly at the hospital edge. We synthesize topological communication graph metadata with contextual semantic vectorization (Bio_ClinicalBERT) without moving raw clinical notes or packet payloads, subsequently stress-testing the global model against non-IID heterogeneity, Byzantine sign-flip attacks, and differential privacy constraints.
        </p>
      </div>

      {/* Terminology Clarification */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
          Core Research Concepts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-indigo-700 block mb-1">SEMANTIC VECTORIZATION</span>
            <p className="text-slate-600">
              Unstructured clinical notes are encoded into 768-D dense vectors via Bio_ClinicalBERT and projected to 128-D client representations, preserving semantic meaning without centralizing raw text.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-indigo-700 block mb-1">FEDERATED GRAPH LEARNING</span>
            <p className="text-slate-600">
              Distributed hospital clients train local GraphSAGE models on private device communication graphs, exchanging only model parameters and sample counts through federated aggregation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-indigo-700 block mb-1">MULTI-MODAL FUSION</span>
            <p className="text-slate-600">
              Combines 128-D IoT network graph representations with 128-D clinical semantic vectors through early concatenation or late decision ensembles.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-indigo-700 block mb-1">SMART HOSPITAL CONTEXT</span>
            <p className="text-slate-600">
              The application scenario modeled in this research. The underlying benchmarks are Edge-IIoTset (cybersecurity) and MTSamples (clinical text proxy), evaluated within a simulated smart hospital architecture.
            </p>
          </div>
        </div>
      </div>

      {/* Project Limitations & Boundaries */}
      <div className="bg-amber-50/70 p-7 rounded-2xl border border-amber-200">
        <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Project Limitations & Scientific Scope
        </h3>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-950 font-medium list-disc list-inside">
          <li>Edge-IIoTset is an industrial IoT cybersecurity dataset, not real hospital clinical telemetry.</li>
          <li>MTSamples is used purely as a public clinical-text development proxy, not actual patient records.</li>
          <li>No patient-to-network-flow causal linkage exists in the benchmark data.</li>
          <li>Clinical embeddings represent client-level contextual information, not packet-level causal evidence.</li>
          <li>Live Phase 7.3 inference is currently unavailable because the reproducible model-weight artifact is missing.</li>
          <li>Secure aggregation is an additive masking research simulation, not production-grade cryptography.</li>
          <li>Formal (ε, δ) Differential Privacy guarantee was not established under the evaluated setup.</li>
          <li>Byzantine evaluation covers the tested sign-flip scenario only; not claimed to be Byzantine-proof.</li>
        </ul>
      </div>

    </div>
  );
}
