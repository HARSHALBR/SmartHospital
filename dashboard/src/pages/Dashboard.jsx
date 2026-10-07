import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge, SimulationBadge } from '../components/StatusBadges';
import { 
  Network, FileText, Database, Shield, AlertTriangle, 
  CheckCircle2, ArrowRight, ArrowDown, Activity, Users, Info, Cpu, Layers
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error('Failed to load metrics:', err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  // Format KPIs cleanly as percentages without excessive decimals
  const edgeMlpKpi = data.baselines?.edge_mlp ? `${(data.baselines.edge_mlp * 100).toFixed(1)}%` : '—';
  const fedIotKpi = data.cent_vs_fed?.federated_iot ? `${(data.cent_vs_fed.federated_iot * 100).toFixed(1)}%` : '—';

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16 text-slate-900 font-sans">
      
      {/* 1. Project Title & Problem Statement */}
      <section className="text-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-4">
          <span>AI + Healthcare + Cybersecurity Research Platform</span>
          <span>•</span>
          <VerifiedBadge />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Semantic Vectorization + Federated Graph Learning for Multi-Modal IoT Anomaly Detection in Smart Hospitals
        </h1>
        
        <p className="mt-4 text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          A privacy-aware research platform combining IoT network communication signals and clinical text representations under federated learning across simulated hospital edge environments.
        </p>

        <div className="mt-6 max-w-3xl mx-auto bg-slate-100/70 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-700 text-left leading-relaxed">
          <strong>Problem Statement:</strong> Modern smart hospitals rely on a massive influx of IoT telemetry and clinical observations. Centralizing this heterogeneous data introduces severe bandwidth bottlenecks, violates patient data locality (e.g., HIPAA principles), and creates single points of failure vulnerable to adversarial poisoning and inference attacks. This platform demonstrates collaborative anomaly detection directly at the hospital edge.
        </div>
      </section>

      {/* 2. Four Key Project KPIs (Section F) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Global Baseline F1</span>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2 font-mono">
            {edgeMlpKpi}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Edge MLP Baseline</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Federated IoT F1</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">
            {fedIotKpi}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Matched FedAvg Parity</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">FL Edge Clients</span>
          <div className="text-3xl font-extrabold text-slate-800 mt-2 font-mono">
            3–5
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Simulated Wards</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Vector</span>
          <div className="text-3xl font-extrabold text-purple-600 mt-2 font-mono">
            768-D
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Bio_ClinicalBERT</span>
        </div>
      </section>

      {/* 3. Core Project Contribution Diagram (Section R) */}
      <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
            System Architecture
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Multi-Modal Federated Architecture
          </h2>
        </div>

        {/* Crisp Visual Architecture Box */}
        <div className="max-w-2xl mx-auto border-2 border-indigo-100 rounded-2xl p-6 bg-slate-50/60 shadow-xs space-y-6">
          <div className="text-center font-bold text-xs uppercase tracking-wider text-indigo-700 bg-white py-1 px-3 rounded-full border border-indigo-200 inline-block mx-auto">
            Multi-Modal Data Ingestion
          </div>

          <div className="grid grid-cols-2 gap-6 text-center text-xs">
            {/* IoT Stream */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-blue-900 block">IoT Network Data</span>
              <span className="text-[10px] text-slate-500 block">Flow records / headers</span>
              <div className="text-slate-400">↓</div>
              <div className="p-2 bg-blue-50 text-blue-950 rounded-lg font-semibold border border-blue-200">
                Graph Learning (GraphSAGE)
              </div>
              <span className="text-[10px] text-blue-700 font-mono block">128-D Representation</span>
            </div>

            {/* Clinical Stream */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="font-bold text-emerald-900 block">Clinical Text</span>
              <span className="text-[10px] text-slate-500 block">MTSamples proxy notes</span>
              <div className="text-slate-400">↓</div>
              <div className="p-2 bg-emerald-50 text-emerald-950 rounded-lg font-semibold border border-emerald-200">
                Semantic Vector (BioBERT)
              </div>
              <span className="text-[10px] text-emerald-700 font-mono block">768-D → 128-D Vector</span>
            </div>
          </div>

          {/* Fusion & Federation */}
          <div className="space-y-3 pt-2 text-center text-xs">
            <div className="text-slate-400">↓</div>
            <div className="p-3 bg-purple-50 border border-purple-200 text-purple-950 font-bold rounded-xl max-w-md mx-auto shadow-xs">
              Multi-Modal Fusion Layer (Early Concat / Late Ensemble)
            </div>
            <div className="text-slate-400">↓</div>
            <div className="p-3 bg-slate-900 text-white font-bold rounded-xl max-w-md mx-auto shadow-xs">
              Federated Learning (Hospital A, B, C Local Models → FedAvg / Median)
            </div>
            <div className="text-slate-400">↓</div>
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold rounded-xl max-w-md mx-auto shadow-xs">
              Hospital IoT Anomaly Detection
            </div>
          </div>
        </div>
      </section>

      {/* 4. Research Pipeline Stages */}
      <section className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Research Pipeline Progression
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Phase 1–2</span>
            <span className="font-bold text-slate-800 block mt-1">Data & Prep</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Phase 3</span>
            <span className="font-bold text-slate-800 block mt-1">Graph Build</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Phase 4</span>
            <span className="font-bold text-slate-800 block mt-1">Baselines</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Phase 5–6</span>
            <span className="font-bold text-slate-800 block mt-1">Multimodal</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Phase 7</span>
            <span className="font-bold text-slate-800 block mt-1">Federated</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 font-mono block">Phase 8–9</span>
            <span className="font-bold text-slate-800 block mt-1">Security & DP</span>
          </div>
        </div>
      </section>

      {/* 5. Key Research Findings Summary */}
      <section className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Core Empirical Findings
          </h2>
          <Link to="/results" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View All Results</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block mb-1">1. Strong Baseline Parity</span>
            <p className="text-slate-600 leading-relaxed">
              Edge MLP is the strongest centralized benchmark; federated FedAvg achieves matched detection performance without centralizing edge flows.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block mb-1">2. Multimodal Negative Finding</span>
            <p className="text-slate-600 leading-relaxed">
              Clinical text embeddings provide contextual patient state verification, but did not produce a packet-level F1 improvement over IoT network flows.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block mb-1">3. Non-IID Degradation</span>
            <p className="text-slate-600 leading-relaxed">
              Global model performance remains resilient across non-IID partitions, while worst-client performance degrades under severe client distribution skew.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="font-bold text-slate-900 block mb-1">4. Robust Byzantine Defense</span>
            <p className="text-slate-600 leading-relaxed">
              Coordinate-wise Median successfully mitigates minority sign-flip poisoning attacks (1 client), but degrades when attackers reach a 2/3 majority.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Important Limitations (Mandatory Scientific Guardrails) */}
      <section className="bg-amber-50/70 border border-amber-200 p-6 rounded-2xl">
        <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          Important Limitations & Research Boundaries
        </h2>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-amber-950 font-medium list-disc list-inside leading-relaxed">
          <li><strong>Edge-IIoTset:</strong> Industrial IoT cybersecurity benchmark traffic, not real hospital telemetry.</li>
          <li><strong>MTSamples:</strong> Public clinical-text proxy; not MIMIC-IV and not linked to individual IoT flows.</li>
          <li><strong>Linkage:</strong> No patient-to-network-flow causal evidence exists in the benchmark data.</li>
          <li><strong>Live Inference:</strong> Intentionally blocked because the Phase 7.3 model artifact is missing.</li>
          <li><strong>Scope:</strong> Research demonstration platform; not a deployed hospital production system.</li>
          <li><strong>Privacy:</strong> Formal ε-δ differential privacy guarantee was not established.</li>
        </ul>
      </section>

      {/* 7. Research Status Checklist */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Verification Status Checklist
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Federated Learning Evaluated
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Multi-Modal Fusion Evaluated
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Non-IID Partitions Tested
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Byzantine Defense Tested
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Privacy Bounds Documented
          </span>
        </div>
      </section>

    </div>
  );
}
