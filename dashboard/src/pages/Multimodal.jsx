import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { Database, FileText, ArrowDown, GitMerge } from 'lucide-react';
import clsx from 'clsx';

export default function Multimodal() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [activeModel, setActiveModel] = useState('multimodal');

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.multimodal))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const getMetric = () => {
    if (activeModel === 'iot') return { name: 'IoT Only', val: data.iot_only_f1 };
    if (activeModel === 'clinical') return { name: 'Clinical Only', val: data.clinical_only_f1 };
    return { name: 'Multimodal', val: data.multimodal_f1 };
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Multimodal Architecture</h1>
          <p className="text-slate-500 mt-2">IoT + Clinical fusion evaluation (Phase 6.2).</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-lg border border-slate-200 inline-flex">
        <button onClick={() => setActiveModel('iot')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeModel === 'iot' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>IoT-Only</button>
        <button onClick={() => setActiveModel('clinical')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeModel === 'clinical' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Clinical-Only</button>
        <button onClick={() => setActiveModel('multimodal')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeModel === 'multimodal' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Multimodal Fusion</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
          <h3 className="font-bold text-slate-700 mb-6 uppercase text-sm">Architecture Flow</h3>
          
          <div className="flex w-full justify-around mb-4">
            <div className={clsx("flex flex-col items-center transition-opacity", activeModel === 'clinical' ? 'opacity-20' : 'opacity-100')}>
              <Database className="w-8 h-8 text-blue-500 mb-2" />
              <span className="font-semibold text-sm">IoT Representation</span>
              <ArrowDown className="w-4 h-4 my-2 text-slate-300" />
              <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded border border-blue-200 text-xs">128-D</div>
            </div>
            
            <div className={clsx("flex flex-col items-center transition-opacity", activeModel === 'iot' ? 'opacity-20' : 'opacity-100')}>
              <FileText className="w-8 h-8 text-emerald-500 mb-2" />
              <span className="font-semibold text-sm">Clinical Semantic</span>
              <ArrowDown className="w-4 h-4 my-2 text-slate-300" />
              <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs">128-D</div>
            </div>
          </div>
          
          <ArrowDown className="w-5 h-5 my-2 text-slate-400" />
          <div className={clsx("flex items-center px-6 py-2 rounded-lg font-bold border transition-colors", activeModel === 'multimodal' ? 'bg-purple-100 border-purple-300 text-purple-900' : 'bg-slate-100 border-slate-300 text-slate-500')}>
            <GitMerge className="w-5 h-5 mr-2" /> CONCATENATE / MLP
          </div>
          <ArrowDown className="w-5 h-5 my-2 text-slate-400" />
          <div className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm tracking-wide shadow-sm">
            PREDICTION
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
          <h3 className="font-bold text-slate-500 mb-2 uppercase text-xs">{getMetric().name} F1 Score</h3>
          <div className="text-6xl font-bold text-slate-800 mb-8">{getMetric().val?.toFixed(4)}</div>
          
          {activeModel === 'multimodal' && (
            <div className="font-mono bg-violet-50 text-violet-800 inline-block px-4 py-2 rounded-lg border border-violet-200 font-bold mb-4">
              Measured ΔF1: {data.delta_f1?.toFixed(4)}
            </div>
          )}
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 mt-auto">
            <strong>Scientific Conclusion:</strong> Multimodal fusion did not produce a meaningful packet-level F1 improvement over IoT-only in the controlled evaluation.
          </div>
        </div>
      </div>

      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="font-bold text-sm text-indigo-900">Multi-Modal Anomaly Detection Studio</h4>
          <p className="text-xs text-indigo-700 mt-0.5">Simulate live early and late fusion, joint decision ensembles, and threat attribution meters.</p>
        </div>
        <Link to="/simulation" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
          Open Fusion Simulation →
        </Link>
      </div>
    </div>
  );
}
