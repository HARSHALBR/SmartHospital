import React, { useState } from 'react';
import { Database, FileText, Network, Share2, Info, AlertTriangle, ArrowRight, Cpu, HelpCircle, Layers } from 'lucide-react';
import { VerifiedBadge } from '../components/StatusBadges';

export default function HospitalData() {
  const [activeTab, setActiveTab] = useState('modalities');
  const [sampleText, setSampleText] = useState("Patient presents with elevated heart rate and respiratory distress.");

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16 text-[#172d3c]">

      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#e4ebee] pb-5 gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#167f78] block mb-1">
            Modality & Ingestion Pipeline
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#112c3b]">
            Data & Methodology
          </h1>
          <p className="text-[#647b87] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Understanding the dual data modalities: high-frequency IoT communication signals and clinical text representations, along with the Bio_ClinicalBERT semantic pipeline.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e4ebee] pb-1">
        <button
          onClick={() => setActiveTab('modalities')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'modalities'
              ? 'bg-[#167f78] text-white shadow-sm'
              : 'text-[#5d7380] hover:text-[#112c3b] hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Dual Modalities & Fusion</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'pipeline'
              ? 'bg-[#167f78] text-white shadow-sm'
              : 'text-[#5d7380] hover:text-[#112c3b] hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Semantic Vectorization Pipeline</span>
        </button>
      </div>

      {/* Tab 1: Dual Modalities & Flow */}
      {activeTab === 'modalities' && (
        <div className="space-y-7 animate-in fade-in duration-150">

          {/* Two Large Modality Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1: IoT / Network Modality */}
            <div className="bg-white p-6 rounded-2xl border border-[#e4ebee] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 bg-[#edf5f4] text-[#167f78] rounded-xl border border-[#d6e7e4]">
                    <Network className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#4c6573] px-2.5 py-1 rounded-full">
                    Modality 1
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#112c3b] mb-1.5 font-display">
                  IoT / Network Modality
                </h2>
                <p className="text-xs text-[#647b87] mb-5 leading-relaxed">
                  Provides high-frequency packet flow headers, connection metadata, and topological interaction structures across edge medical devices.
                </p>

                <div className="space-y-2.5 text-xs border-t border-slate-100 pt-4">
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Benchmark Source:</span>
                    <span className="font-bold text-[#112c3b]">Edge-IIoTset</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Research Purpose:</span>
                    <span className="font-semibold text-[#112c3b] text-right">Network anomaly detection benchmark</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Extracted Features:</span>
                    <span className="font-bold text-[#167f78]">31 Normalized flow features</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Structural Form:</span>
                    <span className="font-semibold text-[#1b3a4a]">10s Temporal communication graph</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Domain Note:</strong> Edge-IIoTset is an industrial IoT cybersecurity dataset used as the network development benchmark. It is not real hospital clinical telemetry.
                </div>
              </div>
            </div>

            {/* Card 2: Clinical Text Modality */}
            <div className="bg-white p-6 rounded-2xl border border-[#e4ebee] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <FileText className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#4c6573] px-2.5 py-1 rounded-full">
                    Modality 2
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#112c3b] mb-1.5 font-display">
                  Clinical Text Modality
                </h2>
                <p className="text-xs text-[#647b87] mb-5 leading-relaxed">
                  Provides unstructured diagnostic observations, vital telemetry context, and nursing notes that describe patient state.
                </p>

                <div className="space-y-2.5 text-xs border-t border-slate-100 pt-4">
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Benchmark Source:</span>
                    <span className="font-bold text-[#112c3b]">MTSamples</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Research Purpose:</span>
                    <span className="font-semibold text-[#112c3b] text-right">Clinical semantic vectorization development</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Encoder Model:</span>
                    <span className="font-bold text-[#167f78]">Bio_ClinicalBERT</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#647b87] font-medium">Output Embedding:</span>
                    <span className="font-semibold text-[#1b3a4a]">768-D Semantic representation</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Domain Note:</strong> MTSamples is used as a public clinical-text proxy. It is not MIMIC-IV and is not directly linked to individual IoT network flows.
                </div>
              </div>
            </div>

          </div>

          {/* Simple Multimodal Fusion Diagram */}
          <div className="bg-white p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
            <h3 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider text-center mb-6 font-display">
              Multimodal Data Flow & Fusion Diagram
            </h3>

            <div className="max-w-2xl mx-auto">
              {/* Dual Source Columns */}
              <div className="grid grid-cols-2 gap-6 text-center text-xs font-semibold">
                <div className="space-y-3">
                  <div className="p-3 bg-[#edf5f4] border border-[#cde2df] rounded-xl text-[#112c3b]">
                    IoT Network Data
                    <span className="block text-[10px] text-[#167f78] font-normal mt-0.5">Packet headers & flows</span>
                  </div>
                  <div className="text-slate-400 text-sm">↓</div>
                  <div className="p-3 bg-[#edf5f4] border border-[#cde2df] rounded-xl text-[#112c3b]">
                    Communication Graph
                    <span className="block text-[10px] text-[#167f78] font-normal mt-0.5">10-second temporal graph</span>
                  </div>
                  <div className="text-slate-400 text-sm">↓</div>
                  <div className="p-3 bg-[#e8f1f5] border border-[#c5dae3] rounded-xl text-[#112c3b]">
                    Graph Representation
                    <span className="block text-[10px] text-[#1f5970] font-normal mt-0.5">GraphSAGE 128-D embedding</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                    Clinical Notes
                    <span className="block text-[10px] text-emerald-700 font-normal mt-0.5">Synthetic / MTSamples text</span>
                  </div>
                  <div className="text-slate-400 text-sm">↓</div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                    Bio_ClinicalBERT
                    <span className="block text-[10px] text-emerald-700 font-normal mt-0.5">Transformer encoder</span>
                  </div>
                  <div className="text-slate-400 text-sm">↓</div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
                    Semantic Vector
                    <span className="block text-[10px] text-emerald-700 font-normal mt-0.5">768-D → 128-D vector</span>
                  </div>
                </div>
              </div>

              {/* Fusion Junction */}
              <div className="mt-6 flex flex-col items-center text-center">
                <div className="w-1/2 flex justify-between text-slate-400 text-sm">
                  <span>↘</span>
                  <span>↙</span>
                </div>
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-bold text-xs max-w-sm w-full shadow-xs">
                  Multimodal Fusion (Early Concat / Late Ensemble)
                </div>
                <div className="text-slate-400 text-sm my-2">↓</div>
                <div className="p-3 bg-[#112c3b] text-white rounded-xl font-bold text-xs max-w-sm w-full">
                  Federated Anomaly Detection Classifier
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Semantic Vectorization Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-7 animate-in fade-in duration-150">

          {/* Conceptual Pipeline Flow */}
          <div className="bg-white p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
            <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider text-center mb-6 font-display">
              The Semantic Vectorization Pipeline
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 text-center">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-44">
                <FileText className="w-5 h-5 text-slate-500 mx-auto mb-1.5" />
                <h3 className="font-bold text-xs text-[#112c3b]">Clinical Note</h3>
                <span className="text-[10px] text-[#647b87] mt-0.5 block">Natural language text</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block shrink-0" />

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-44">
                <Cpu className="w-5 h-5 text-[#167f78] mx-auto mb-1.5" />
                <h3 className="font-bold text-xs text-[#112c3b]">Tokenization</h3>
                <span className="text-[10px] text-[#647b87] mt-0.5 block">Subword tokens</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block shrink-0" />

              <div className="p-3.5 bg-[#edf5f4] border border-[#cde2df] rounded-xl w-full md:w-48">
                <Cpu className="w-5 h-5 text-[#167f78] mx-auto mb-1.5" />
                <h3 className="font-bold text-xs text-[#112c3b]">Bio_ClinicalBERT</h3>
                <span className="text-[10px] text-[#167f78] mt-0.5 block">Transformer encoder</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block shrink-0" />

              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl w-full md:w-48">
                <Database className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
                <h3 className="font-bold text-xs text-purple-950">768-D Vector</h3>
                <span className="text-[10px] text-purple-700 mt-0.5 block">Dense semantic tensor</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block shrink-0" />

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl w-full md:w-44">
                <Database className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <h3 className="font-bold text-xs text-emerald-950">Contextual Rep.</h3>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">Ready for fusion</span>
              </div>
            </div>
          </div>

          {/* Raw Text vs Semantic Representation Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left: Raw Text Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#e4ebee] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    Raw Text Exposure
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Plaintext</span>
                </div>

                <h3 className="text-sm font-bold text-[#112c3b] mb-2 font-display">
                  Synthetic Demonstration Note
                </h3>

                <textarea
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#167f78] focus:border-transparent font-sans"
                  placeholder="Enter synthetic note..."
                />
              </div>

              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-[#556b77] leading-relaxed">
                <strong>Readability:</strong> Directly readable text. In unprotected workflows, transmitting raw text exposes patient observations to the network.
              </div>
            </div>

            {/* Right: Semantic Representation Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#e4ebee] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#167f78] bg-[#edf5f4] px-2.5 py-1 rounded-full border border-[#cde2df]">
                    Semantic Representation
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">768-D Tensor</span>
                </div>

                <h3 className="text-sm font-bold text-[#112c3b] mb-2 font-display">
                  Abstract Embedding Vector
                </h3>

                {/* Visual Vector Mock */}
                <div className="bg-[#112c3b] text-[#8cd4c4] p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto min-h-[96px] flex items-center">
                  <div>
                    <span className="text-[#688592] block mb-1 text-[10px]">// Conceptual 768-D embedding snippet</span>
                    [ +0.2104, -0.1428, +0.7319, +0.0512, -0.6180, ... , -0.0841 ]
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#edf5f4] border border-[#cde2df] rounded-xl text-[11px] text-[#112c3b] leading-relaxed">
                <strong>Conceptual representation:</strong> Bio_ClinicalBERT maps linguistic clinical concepts into geometric vector space. Live embedding inference is intentionally not executed inside this static demonstration UI.
              </div>
            </div>

          </div>

          {/* Why Vectorize? Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e4ebee] shadow-sm">
            <h3 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider mb-4 flex items-center gap-2 font-display">
              <HelpCircle className="w-4 h-4 text-[#167f78]" />
              Why Vectorize Clinical Text?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-[#112c3b] mb-1">1. Avoid Raw Text Exposure</h4>
                <p className="text-[#647b87] leading-relaxed">
                  Raw clinical notes remain inside the local hospital client perimeter rather than being transmitted to the central federated coordinator.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-[#112c3b] mb-1">2. Preserve Semantic Context</h4>
                <p className="text-[#647b87] leading-relaxed">
                  Transformer attention mechanisms preserve clinical meaning (e.g. sepsis vs routine vitals) as continuous vectors.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-bold text-[#112c3b] mb-1">3. Enable Multimodal Fusion</h4>
                <p className="text-[#647b87] leading-relaxed">
                  Continuous numerical tensors can be mathematically fused with 128-D IoT network graph representations for joint anomaly classification.
                </p>
              </div>
            </div>

            {/* Boundary Warning */}
            <div className="mt-5 p-4 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Research Boundary:</strong> MTSamples is a public text dataset used for methodology development. In our experiments, clinical embeddings represent client-level context rather than packet-level causal links to network telemetry.
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
