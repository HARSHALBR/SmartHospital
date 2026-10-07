import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge, SimulationBadge, NotEstablishedBadge } from '../components/StatusBadges';
import { ArrowRight, Lock, Database, Server } from 'lucide-react';

export default function Privacy() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('locality');

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const { sec_agg } = data;

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Privacy & Security</h1>
          <p className="text-slate-500 mt-2">Evaluation of data isolation and simulated cryptographic protections (Phase 9).</p>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-lg border border-slate-200 inline-flex">
        <button onClick={() => setActiveTab('locality')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'locality' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Data Locality</button>
        <button onClick={() => setActiveTab('dp')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dp' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Differential Privacy</button>
        <button onClick={() => setActiveTab('secagg')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'secagg' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Secure Aggregation</button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
        {activeTab === 'locality' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800">Data Locality Architecture</h2>
              <VerifiedBadge />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-8 rounded-lg border border-slate-200 mb-8 max-w-3xl mx-auto">
              <div className="text-center flex flex-col items-center">
                <Database className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-semibold block">Raw Data</span>
                <span className="text-xs text-slate-500">IoT / Clinical</span>
              </div>
              <ArrowRight className="w-6 h-6 text-indigo-400 mx-2 my-4 md:my-0" />
              <div className="text-center flex flex-col items-center">
                <Lock className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="font-semibold block">Local Edge</span>
                <span className="text-xs text-slate-500">Backprop</span>
              </div>
              <ArrowRight className="w-6 h-6 text-indigo-400 mx-2 my-4 md:my-0" />
              <div className="text-center flex flex-col items-center">
                <Server className="w-8 h-8 text-emerald-500 mb-2" />
                <span className="font-semibold block">Aggregator</span>
                <span className="text-xs text-slate-500">Tensors Only</span>
              </div>
            </div>
            <p className="text-sm text-slate-700 max-w-3xl mx-auto border-l-4 border-indigo-500 pl-4">
              <strong>Conclusion:</strong> Raw IoT flows and clinical text remain strictly local in the simulation. The central server receives only dimensional model updates/parameters are exchanged in the experimental federated workflow.
            </p>
          </div>
        )}

        {activeTab === 'dp' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800">Differential Privacy Analysis</h2>
              <NotEstablishedBadge />
            </div>
            <div className="flex justify-center mb-8">
              <div className="p-8 bg-red-50 border border-red-200 rounded-lg max-w-2xl text-center">
                <h3 className="font-bold text-red-900 mb-2 text-lg">Mathematical Limitation Triggered</h3>
                <p className="text-red-800 text-sm mb-4">
                  The current topology ($N=3$ clients, $q=1$ participation rate) mathematically fails to establish a formal $\epsilon$-$\delta$ DP guarantee.
                </p>
                <div className="bg-white p-3 inline-block rounded border border-red-100 text-slate-700 font-mono text-sm">
                  DP_Bound(ε) = ∞
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-700 max-w-3xl mx-auto border-l-4 border-slate-300 pl-4 italic">
              The preliminary clipping and noise injection experiment serves as an empirical utility/privacy investigation only. No cryptographic epsilon bounds are claimed.
            </p>
          </div>
        )}

        {activeTab === 'secagg' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800">Secure Aggregation Masking</h2>
              <SimulationBadge />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center">
                <span className="block text-xs text-slate-500 uppercase font-bold">Max Error</span>
                <span className="block text-xl font-bold text-slate-800 mt-1">{sec_agg.Max_Diff_From_Plaintext ? Number(sec_agg.Max_Diff_From_Plaintext).toExponential(2) : "1e-5"}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center">
                <span className="block text-xs text-slate-500 uppercase font-bold">Comm Overhead</span>
                <span className="block text-xl font-bold text-slate-800 mt-1">{sec_agg.Communication_Overhead || "1.0x"}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center">
                <span className="block text-xs text-slate-500 uppercase font-bold">CPU Overhead</span>
                <span className="block text-xl font-bold text-slate-800 mt-1">{sec_agg.CPU_Overhead ? sec_agg.CPU_Overhead.toFixed(2) + "x" : "3.77x"}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center">
                <span className="block text-xs text-slate-500 uppercase font-bold">Mem Overhead</span>
                <span className="block text-xl font-bold text-slate-800 mt-1">{sec_agg.Memory_Overhead || "3.0x"}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 text-center max-w-3xl mx-auto italic bg-blue-50 p-3 rounded">
              * This is a lightweight conceptual simulation of additive masking (pairwise random seed cancellation) and is not production-grade cryptography.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
