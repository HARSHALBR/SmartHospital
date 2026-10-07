import React, { useState } from 'react';
import { FileText, Cpu, Database, ArrowRight, ShieldAlert, Lock, HelpCircle } from 'lucide-react';
import { VerifiedBadge } from '../components/StatusBadges';

export default function SemanticVectorization() {
  const [text, setText] = useState("Patient presents with elevated heart rate and respiratory distress.");

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Core Technology
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Semantic Vectorization</h1>
          <p className="text-slate-500 text-sm mt-1">
            Transforming unstructured clinical text into numerical vector representations using Bio_ClinicalBERT.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Conceptual Pipeline Flow */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide text-center mb-8">
          The Semantic Vectorization Pipeline
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-44">
            <FileText className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-slate-800">Clinical Note</h3>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Natural language text</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl w-full md:w-44">
            <Cpu className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-slate-800">Text Processing</h3>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Subword tokenization</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl w-full md:w-48">
            <Cpu className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-indigo-950">Bio_ClinicalBERT</h3>
            <span className="text-[10px] text-indigo-700 mt-0.5 block">Transformer encoder</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl w-full md:w-48">
            <Database className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-purple-950">768-D Vector</h3>
            <span className="text-[10px] text-purple-700 mt-0.5 block">Dense semantic tensor</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-300 hidden md:block" />

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl w-full md:w-44">
            <Database className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-emerald-950">Contextual Rep.</h3>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Ready for fusion</span>
          </div>
        </div>
      </div>

      {/* Raw Text vs Semantic Representation Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Raw Text Card */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Raw Text Exposure
              </span>
              <span className="text-[11px] font-mono text-slate-400">Plaintext</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">Synthetic Demonstration Note</h3>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
              placeholder="Enter synthetic note..."
            />
          </div>

          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
            <strong>Readability:</strong> Directly readable text. In unprotected workflows, transmitting raw text exposes patient observations to the network.
          </div>
        </div>

        {/* Right: Semantic Representation Card */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Semantic Representation
              </span>
              <span className="text-[11px] font-mono text-slate-400">768-D Tensor</span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">Abstract Embedding Vector</h3>

            {/* Visual Vector Mock */}
            <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto min-h-[96px] flex items-center">
              <div>
                <span className="text-slate-500 block mb-1 text-[10px]">// Conceptual 768-D embedding snippet</span>
                [ +0.2104, -0.1428, +0.7319, +0.0512, -0.6180, ... , -0.0841 ]
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed">
            <strong>Conceptual representation:</strong> Bio_ClinicalBERT maps linguistic clinical concepts into geometric vector space. Live embedding inference is intentionally not executed inside this static demonstration UI.
          </div>
        </div>

      </div>

      {/* Why Vectorize? Card */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Why Vectorize Clinical Text?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-1">1. Avoid Raw Text Exposure</h4>
            <p className="text-slate-600 leading-relaxed">
              Raw clinical notes remain inside the local hospital client perimeter rather than being transmitted to the central federated coordinator.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-1">2. Preserve Semantic Context</h4>
            <p className="text-slate-600 leading-relaxed">
              Transformer attention mechanisms preserve clinical meaning (e.g. sepsis vs routine vitals) as continuous vectors.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="font-bold text-slate-900 mb-1">3. Enable Multimodal Fusion</h4>
            <p className="text-slate-600 leading-relaxed">
              Continuous numerical tensors can be mathematically fused with 128-D IoT network graph representations for joint anomaly classification.
            </p>
          </div>
        </div>

        {/* Boundary Warning */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Important Scientific Guardrail:</strong> Semantic embeddings reduce direct raw-text exposure, but they do <em>not</em> provide a formal mathematical guarantee against reconstruction or membership inference attacks.
          </p>
        </div>
      </div>

    </div>
  );
}
