import React, { useState } from 'react';
import { runInference } from '../services/api';
import { DemoBadge } from '../components/StatusBadges';
import { ShieldAlert, Play } from 'lucide-react';

export default function Inference() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 31 synthetic 0s just to ping the endpoint
      await runInference(Array(31).fill(0.0));
    } catch (err) {
      if (err.response && err.response.status === 503) {
        setError("Live inference currently unavailable because the reproducible Phase 7.3 model-weight artifact is missing.");
      } else {
        setError("An unexpected error occurred while attempting inference.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live IoT Inference</h1>
          <p className="text-slate-500 mt-2">Demonstration of EdgeMLP detection over synthetic flow vectors.</p>
        </div>
        <DemoBadge />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Synthetic Input Vector (n=31)</h3>
          <button 
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {loading ? "Transmitting..." : "Execute Inference"}
          </button>
        </div>
        
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          {error ? (
            <div className="flex flex-col items-center text-center max-w-md">
              <ShieldAlert className="w-12 h-12 text-slate-300 mb-4" />
              <h4 className="text-lg font-bold text-slate-700 mb-2">LIVE INFERENCE CURRENTLY UNAVAILABLE</h4>
              <p className="text-slate-500 mb-4">{error}</p>
              <p className="text-sm text-slate-400">Historical Phase 7.3 experimental results remain available in the dashboard.</p>
            </div>
          ) : (
            <div className="text-slate-400 italic">
              Awaiting transmission...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
