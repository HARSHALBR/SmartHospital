import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Personalization() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState('after');

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.personalization))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const globalFedAvg = data.reduce((acc, curr) => acc + curr.FedAvg_F1, 0) / data.length;
  const globalPers = data.reduce((acc, curr) => acc + curr.Personalized_F1, 0) / data.length;

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Personalized Federated Learning</h1>
          <p className="text-slate-500 mt-2">Local fine-tuning under severe non-IID conditions (Phase 8.3).</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-lg border border-slate-200 inline-flex">
        <button onClick={() => setMode('before')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'before' ? 'bg-slate-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Before (FedAvg)</button>
        <button onClick={() => setMode('after')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'after' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>After (Personalized FL)</button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-6">
          <div className="text-center md:text-left">
            <span className="text-xs text-slate-500 uppercase block">Global Mean Client F1</span>
            <span className="text-2xl font-bold text-slate-800">{mode === 'before' ? globalFedAvg.toFixed(4) : globalPers.toFixed(4)}</span>
          </div>
          <div className="text-center md:text-right mt-4 md:mt-0">
            <span className="text-xs text-emerald-600 uppercase block font-bold">Measured Improvement</span>
            <span className="text-lg font-bold text-emerald-700">+{(globalPers - globalFedAvg).toFixed(4)} ΔF1</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Client" axisLine={false} tickLine={false} />
              <YAxis domain={[0.95, 1.0]} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-slate-200 shadow-sm rounded text-sm">
                      <p className="font-bold text-slate-800 mb-2">{label}</p>
                      {payload.map(p => (
                        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value.toFixed(4)}</p>
                      ))}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
              {mode === 'before' ? (
                <Bar dataKey="FedAvg_F1" fill="#cbd5e1" name="Base FedAvg F1" radius={[4, 4, 0, 0]} barSize={40} />
              ) : (
                <Bar dataKey="Personalized_F1" fill="#10b981" name="Personalized F1" radius={[4, 4, 0, 0]} barSize={40} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8 p-4 bg-emerald-50 rounded-lg text-emerald-900 border border-emerald-100 text-sm">
          <strong>Scientific Conclusion:</strong> Personalization produced a marginal improvement under the tested severe non-IID configuration. 
          While local models slightly overfitted to their specific subsets, the baseline FedAvg model was already saturated near `0.99`.
        </div>
      </div>
    </div>
  );
}
