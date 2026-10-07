import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VerifiedBadge } from '../components/StatusBadges';
import { FileText, Cpu, Database, ArrowRight } from 'lucide-react';

export default function Clinical() {
  const [text, setText] = useState("Patient exhibits normal vitals. Network telemetry indicates standard physiological monitor heartbeat.");

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinical Semantic Vectorization</h1>
          <p className="text-slate-500 mt-2">MTSamples natural language embeddings (Phase 5/6).</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-700 bg-indigo-50 p-3 rounded border border-indigo-100">
            MTSamples — public clinical-text development proxy. 
          </p>
          <p className="text-sm text-slate-600 mt-3 italic">
            This interactive visualization explains the verified experimental pipeline; live clinical embedding inference is not being performed in this dashboard.
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">Synthetic Demonstration Text</label>
          <textarea 
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows="3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter synthetic text..."
          />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
          <div className="text-center flex flex-col items-center w-32">
            <FileText className="w-8 h-8 text-slate-500 mb-2" />
            <span className="font-semibold text-sm">Synthetic Text</span>
            <span className="text-xs text-slate-400 mt-1 truncate w-full px-2">"{text.substring(0, 15)}..."</span>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-300 my-4 md:my-0" />
          <div className="text-center flex flex-col items-center w-32">
            <Cpu className="w-8 h-8 text-indigo-500 mb-2" />
            <span className="font-semibold text-sm">Bio_ClinicalBERT</span>
            <span className="text-xs text-indigo-400 mt-1">Transformer</span>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-300 my-4 md:my-0" />
          <div className="text-center flex flex-col items-center w-32">
            <Database className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="font-semibold text-sm">768-D Embedding</span>
            <span className="text-xs text-emerald-400 mt-1">Dense Tensor</span>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-300 my-4 md:my-0" />
          <div className="text-center flex flex-col items-center w-32">
            <Database className="w-8 h-8 text-purple-500 mb-2" />
            <span className="font-semibold text-sm">128-D Projection</span>
            <span className="text-xs text-purple-400 mt-1">Client Rep.</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="font-bold text-sm text-indigo-900">Interactive Clinical Vectorization Studio</h4>
            <p className="text-xs text-indigo-700 mt-0.5">Explore subword tokenization, attention heatmaps, and dimensional projection in real time.</p>
          </div>
          <Link to="/simulation" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
            Open Simulation Studio →
          </Link>
        </div>

      </div>
    </div>
  );
}
