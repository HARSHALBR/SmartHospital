import React from 'react';
import { Database, FileText, Network, Share2, Info, AlertTriangle } from 'lucide-react';
import { VerifiedBadge } from '../components/StatusBadges';

export default function HospitalData() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-900">
      
      {/* Title */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Modality Overview
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Hospital Data</h1>
          <p className="text-slate-500 text-sm mt-1">
            Understanding the dual data modalities: IoT network communication signals and clinical text representations.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Two Large Modality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: IoT / Network Modality */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Network className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                Modality 1
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">IoT / Network Modality</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Provides high-frequency packet flow headers, connection metadata, and topological interaction structures.
            </p>

            <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Benchmark Source:</span>
                <span className="font-bold text-slate-800">Edge-IIoTset</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Research Purpose:</span>
                <span className="font-semibold text-slate-800 text-right">Network anomaly detection benchmark</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Extracted Features:</span>
                <span className="font-bold text-slate-800">31 Normalized flow features</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Structural Form:</span>
                <span className="font-semibold text-indigo-700">10s Temporal communication graph</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Domain Note:</strong> Edge-IIoTset is an industrial IoT cybersecurity dataset used as the network development benchmark. It is not real hospital data.
            </div>
          </div>
        </div>

        {/* Card 2: Clinical Text Modality */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                Modality 2
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Clinical Text Modality</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Provides unstructured diagnostic observations, vital telemetry context, and nursing notes.
            </p>

            <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Benchmark Source:</span>
                <span className="font-bold text-slate-800">MTSamples</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Research Purpose:</span>
                <span className="font-semibold text-slate-800 text-right">Clinical semantic vectorization development</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Encoder Model:</span>
                <span className="font-bold text-slate-800">Bio_ClinicalBERT</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Output Embedding:</span>
                <span className="font-semibold text-emerald-700">768-D Semantic representation</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Domain Note:</strong> MTSamples is used as a public clinical-text proxy. It is not MIMIC-IV and is not directly linked to individual IoT network flows.
            </div>
          </div>
        </div>

      </div>

      {/* Simple Multimodal Fusion Diagram */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide text-center mb-8">
          Multimodal Data Flow & Fusion Diagram
        </h3>

        <div className="max-w-2xl mx-auto">
          {/* Dual Source Columns */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs font-semibold">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                IoT Network Data
                <span className="block text-[10px] text-blue-600 font-normal mt-0.5">Packet headers & flows</span>
              </div>
              <div className="text-slate-400 text-sm">↓</div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                Communication Graph
                <span className="block text-[10px] text-blue-600 font-normal mt-0.5">10-second temporal graph</span>
              </div>
              <div className="text-slate-400 text-sm">↓</div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900">
                Graph Representation
                <span className="block text-[10px] text-indigo-600 font-normal mt-0.5">GraphSAGE 128-D embedding</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                Clinical Notes
                <span className="block text-[10px] text-emerald-600 font-normal mt-0.5">Synthetic / MTSamples text</span>
              </div>
              <div className="text-slate-400 text-sm">↓</div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                Bio_ClinicalBERT
                <span className="block text-[10px] text-emerald-600 font-normal mt-0.5">Transformer encoder</span>
              </div>
              <div className="text-slate-400 text-sm">↓</div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                Semantic Vector
                <span className="block text-[10px] text-emerald-600 font-normal mt-0.5">768-D → 128-D vector</span>
              </div>
            </div>
          </div>

          {/* Fusion Junction */}
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="w-1/2 flex justify-between text-slate-400 text-sm">
              <span>↘</span>
              <span>↙</span>
            </div>
            <div className="mt-2 p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-bold text-xs max-w-sm w-full shadow-xs">
              Multimodal Fusion (Early Concat / Late Ensemble)
            </div>
            <div className="text-slate-400 text-sm my-2">↓</div>
            <div className="p-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs max-w-sm w-full">
              Federated Anomaly Detection Classifier
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
