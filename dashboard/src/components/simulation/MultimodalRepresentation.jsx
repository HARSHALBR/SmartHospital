import React, { useState } from 'react';
import { 
  Network, FileText, Share2, Layers, AlertCircle 
} from 'lucide-react';
import clsx from 'clsx';

export default function MultimodalRepresentation() {
  const [fusionType, setFusionType] = useState('early'); // 'early' | 'late'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Feature D • Multimodal Architecture
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Controlled Evaluation
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Multimodal Representation & Fusion Evaluation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Side-by-side synthesis of topological IoT packet-flow telemetry with clinical contextual semantics.
            </p>
          </div>

          {/* Fusion Strategy Toggle */}
          <div className="flex bg-white rounded-lg border border-slate-300 p-0.5 text-xs">
            <button
              onClick={() => setFusionType('early')}
              className={clsx(
                "px-3 py-1.5 rounded font-semibold transition-colors",
                fusionType === 'early'
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Early Fusion (Concatenation)
            </button>
            <button
              onClick={() => setFusionType('late')}
              className={clsx(
                "px-3 py-1.5 rounded font-semibold transition-colors",
                fusionType === 'late'
                  ? "bg-indigo-600 text-white font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Late Fusion (Ensemble Head)
            </button>
          </div>
        </div>

        {/* Transparent Negative Result Disclosure Banner */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900">
              Key Research Finding — Controlled Evaluation Negative Result:
            </h4>
            <p className="leading-relaxed">
              In the controlled Phase 6.2 evaluation on Edge-IIoTset packet telemetry, adding clinical semantic embeddings achieved an F1 of <strong>0.9926</strong>, which was <strong>identical to the IoT-only EdgeMLP baseline (0.9926, ΔF1 = 0.0000)</strong>. Because network packet headers already contain high-fidelity statistical signatures of malicious flow patterns, clinical text does not enhance packet-level anomaly detection. Instead, its research value lies in <strong>clinical contextual correlation and authorization cross-verification without PHI centralization</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Side-by-Side Modality View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Modality A: IoT Network Representation */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Modality A
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">128-D Representation</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Network className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">IoT Network Telemetry</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Extracted from Edge-IIoTset network flow headers across medical devices and gateways.
              </p>

              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Input Raw Features:</span>
                  <span className="font-mono font-semibold text-slate-800">31 Flow Attributes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Feature Types:</span>
                  <span className="text-slate-700 font-medium">Pkts/s, Byte Volume, TCP Flags</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Topological Model:</span>
                  <span className="text-slate-700 font-medium">GraphSAGE (2-Hop Neighbors)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Output Shape:</span>
                  <span className="font-mono text-indigo-700 font-bold">[ Batch, 128 ]</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-blue-800 bg-blue-50/60 p-2.5 rounded-lg">
              High temporal resolution (per-packet flow duration 0.1s - 10s).
            </div>
          </div>

          {/* Modality B: Clinical Semantic Representation */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Modality B
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">128-D Representation</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Clinical Semantic Text</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Encoded from unstructured clinical observation notes using the Bio_ClinicalBERT transformer.
              </p>

              <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Input Data Proxy:</span>
                  <span className="font-mono font-semibold text-slate-800">MTSamples Clinical Text</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Embedding:</span>
                  <span className="font-mono text-slate-700">768-D Hidden States</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Projection Layer:</span>
                  <span className="text-slate-700 font-medium">Linear (768-D → 128-D)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Output Shape:</span>
                  <span className="font-mono text-emerald-700 font-bold">[ Batch, 128 ]</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-emerald-800 bg-emerald-50/60 p-2.5 rounded-lg">
              Low temporal resolution (ward-level shift every hour to 24h).
            </div>
          </div>

          {/* Modality C: Combined Multimodal Representation */}
          <div className="p-5 rounded-xl border border-purple-200 bg-purple-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                  Modality C
                </span>
                <span className="text-xs font-mono font-bold text-purple-900">
                  {fusionType === 'early' ? '256-D Joint Vector' : 'Decision Head'}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Combined Multimodal Head</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {fusionType === 'early'
                  ? 'Concatenates the 128-D IoT and 128-D Clinical vectors into a joint 256-D tensor fed into MLP classifier.'
                  : 'Separate classification heads produce independent logits combined via weighted ensemble averaging.'}
              </p>

              <div className="space-y-2 text-xs border-t border-purple-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Fusion Mechanism:</span>
                  <span className="font-semibold text-purple-900">
                    {fusionType === 'early' ? 'Early Concatenation' : 'Late Decision Ensemble'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Combined Input Dim:</span>
                  <span className="font-mono font-bold text-purple-900">
                    {fusionType === 'early' ? '[ Batch, 256 ]' : '2 × [ Batch, 2 ]'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Classification Head:</span>
                  <span className="text-slate-800 font-medium">EdgeMLP (Dropout 0.3)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Output Prediction:</span>
                  <span className="font-mono text-purple-900 font-bold">Binary Logit (Normal / Anomaly)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-200 text-[11px] text-purple-900 bg-purple-100/70 p-2.5 rounded-lg">
              Evaluated F1: <strong>0.9926</strong> (Identical to IoT-only baseline).
            </div>
          </div>

        </div>

        {/* Conceptual Fusion Architecture Diagram */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Conceptual Multimodal Fusion Dataflow Diagram
          </h4>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            {/* Stage 1 */}
            <div className="flex-1 p-3.5 bg-slate-800 rounded-lg border border-slate-700 w-full">
              <span className="text-[10px] font-bold text-blue-400 block mb-1">LOCAL IOT NIC CAPTURE</span>
              <p className="text-xs font-semibold text-slate-200">31 Normalized Flow Attributes</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">GraphSAGE → 128-D</span>
            </div>

            <div className="text-slate-500 font-bold">＋</div>

            {/* Stage 2 */}
            <div className="flex-1 p-3.5 bg-slate-800 rounded-lg border border-slate-700 w-full">
              <span className="text-[10px] font-bold text-emerald-400 block mb-1">LOCAL WARD EHR NOTE</span>
              <p className="text-xs font-semibold text-slate-200">MTSamples Clinical Text</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">BioBERT → 768-D → 128-D</span>
            </div>

            <div className="text-indigo-400 font-bold text-lg">➔</div>

            {/* Stage 3 */}
            <div className="flex-1 p-3.5 bg-indigo-950/80 rounded-lg border border-indigo-700 w-full">
              <span className="text-[10px] font-bold text-indigo-300 block mb-1">
                {fusionType === 'early' ? 'JOINT 256-D VECTOR' : 'DUAL ENSEMBLE HEADS'}
              </span>
              <p className="text-xs font-semibold text-white">EdgeMLP Classifier</p>
              <span className="text-[10px] text-indigo-200 font-mono mt-1 block">Binary Cross-Entropy</span>
            </div>

            <div className="text-indigo-400 font-bold text-lg">➔</div>

            {/* Output */}
            <div className="flex-1 p-3.5 bg-slate-800 rounded-lg border border-slate-700 w-full">
              <span className="text-[10px] font-bold text-amber-400 block mb-1">FINAL VERDICT</span>
              <p className="text-xs font-semibold text-slate-200">Normal vs Threat Flow</p>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">Sigmoid Threshold: 0.5</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>Privacy Boundary: All multimodal fusion and feature extraction are executed inside the local edge ward client.</span>
            <span className="text-indigo-300">Mathematical weight updates alone are transmitted during federated rounds.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
