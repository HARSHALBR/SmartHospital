import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { ShieldAlert, GitCommit, ArrowDown } from 'lucide-react';

export default function Byzantine() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [scenario, setScenario] = useState('Clean');
  const [aggregator, setAggregator] = useState('fedavg');

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.byzantine))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const scenarios = ['Clean', 'Attack_C1', 'Attack_C2', 'Attack_C3', 'Attack_C1_C2_Extreme'];
  const formatScenario = (s) => s.replace('Attack_', '').replace('_Extreme', ' (2/3)');
  
  const activeRecord = data.find(d => d.Scenario === scenario && d.Aggregator === aggregator) || {};

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Byzantine Robustness</h1>
          <p className="text-slate-500 mt-2">Controlled model-update poisoning resilience (Phase 8.4).</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 text-amber-900 text-sm font-medium flex items-center">
        <ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0" />
        <div>
          Controlled sign-flip model-update attack simulation using precomputed experimental results. 
          Results do not establish robustness against all Byzantine attacks.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">1. Select Threat Scenario</h3>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(s => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${scenario === s ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                {formatScenario(s)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">2. Select Aggregator</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setAggregator('fedavg')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${aggregator === 'fedavg' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              Standard FedAvg
            </button>
            <button
              onClick={() => setAggregator('median')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${aggregator === 'median' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              Coordinate-wise Median
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase w-full text-left">Update Flow Simulation</h3>
          <div className={`p-3 rounded-lg border w-full text-center ${scenario !== 'Clean' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {scenario === 'Clean' ? 'Normal Updates' : 'Malicious Sign-Flipped Update'}
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
          <div className="p-3 rounded-lg border w-full text-center bg-indigo-50 border-indigo-200 text-indigo-800 font-semibold flex items-center justify-center">
            <GitCommit className="w-4 h-4 mr-2" />
            Aggregation ({aggregator === 'fedavg' ? 'Mean' : 'Median'})
          </div>
          <ArrowDown className="w-5 h-5 text-slate-400 my-2" />
          <div className={`p-3 rounded-lg border w-full text-center font-bold ${activeRecord.Global_F1 < 0.5 ? 'bg-rose-100 border-rose-300 text-rose-900' : 'bg-emerald-100 border-emerald-300 text-emerald-900'}`}>
            F1 = {activeRecord.Global_F1?.toFixed(4)}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <span className="block text-xs uppercase text-slate-500 mb-1">Global F1</span>
              <span className={`block text-4xl font-bold ${activeRecord.Global_F1 < 0.5 ? 'text-rose-600' : 'text-slate-800'}`}>
                {activeRecord.Global_F1?.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="block text-xs uppercase text-slate-500 mb-1">Worst-Client F1</span>
              <span className={`block text-4xl font-bold ${activeRecord.Worst_Client_F1 < 0.5 ? 'text-rose-600' : 'text-slate-800'}`}>
                {activeRecord.Worst_Client_F1?.toFixed(4)}
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 text-sm">
            <strong>Scientific Conclusion:</strong> Coordinate-wise Median successfully mitigates the tested minority sign-flip poisoning attack (Client 1, 2, or 3 independently), recovering F1 back to baseline. However, explicitly shown by the `C1_C2 (2/3)` malicious case, an adversarial majority mathematically defeats the Median defense entirely.
          </div>
        </div>
      </div>
    </div>
  );
}
