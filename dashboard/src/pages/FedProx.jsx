import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FedProx() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [selectedMu, setSelectedMu] = useState(0.01);
  const [viewMode, setViewMode] = useState('performance');

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.fedprox))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const activeData = data.find(d => d.mu === selectedMu) || data[0];

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">FedProx Algorithm</h1>
          <p className="text-slate-500 mt-2">Evaluating proximal term variations (Phase 8.2).</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="bg-white p-2 rounded-lg border border-slate-200 inline-flex">
          {[0.0, 0.001, 0.01, 0.1].map(mu => (
            <button
              key={mu}
              onClick={() => setSelectedMu(mu)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedMu === mu ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              μ = {mu}
            </button>
          ))}
        </div>
        <div className="bg-white p-2 rounded-lg border border-slate-200 inline-flex">
          <button onClick={() => setViewMode('performance')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'performance' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Performance</button>
          <button onClick={() => setViewMode('drift')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'drift' ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Model Drift</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <MetricBox title="Global F1" value={activeData.Global_F1?.toFixed(4)} />
        <MetricBox title="Mean Client F1" value={activeData.Mean_Client_F1?.toFixed(4)} />
        <MetricBox title="Worst Client F1" value={activeData.Worst_Client_F1?.toFixed(4)} />
        <MetricBox title="F1 Std" value={activeData.Client_F1_Std?.toFixed(4)} />
        <MetricBox title="Model Drift (L2)" value={activeData.Mean_L2_Div?.toFixed(4)} highlight={selectedMu === 0.01} />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="h-80 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mu" axisLine={false} tickLine={false} label={{ value: 'Proximal Term (μ)', position: 'insideBottomRight', offset: 0 }} />
              {viewMode === 'performance' ? (
                <>
                  <YAxis domain={[0.95, 1.0]} axisLine={false} tickLine={false} />
                  <Line type="monotone" dataKey="Global_F1" stroke="#4f46e5" strokeWidth={3} name="Global F1" />
                  <Line type="monotone" dataKey="Worst_Client_F1" stroke="#e11d48" strokeWidth={3} name="Worst Client F1" />
                </>
              ) : (
                <>
                  <YAxis domain={[0, 3]} axisLine={false} tickLine={false} />
                  <Line type="monotone" dataKey="Mean_L2_Div" stroke="#64748b" strokeWidth={3} name="Model Drift (L2)" />
                </>
              )}
              <Tooltip cursor={{ fill: '#f8fafc' }} content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-slate-200 shadow-sm rounded text-sm">
                      <p className="font-bold text-slate-800 mb-2">μ = {label}</p>
                      {payload.map(p => (
                        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value.toFixed(4)}</p>
                      ))}
                      {label === 0.01 && <p className="mt-2 text-xs text-indigo-600 font-bold">Best tested configuration</p>}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 text-sm">
          <strong>Scientific Conclusion:</strong> FedProx substantially reduced model drift across the severe non-IID partition. 
          The configuration <code>μ = 0.01</code> was the best tested configuration. However, while structural drift collapsed, 
          the ultimate anomaly-detection performance improvement was marginal in this specific experiment. Higher μ lowers model drift, but does not necessarily yield better anomaly-detection performance.
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, highlight }) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-white border-slate-200 text-slate-800'}`}>
      <span className={`block text-xs uppercase mb-1 ${highlight ? 'text-indigo-700' : 'text-slate-500'}`}>{title}</span>
      <span className="block text-xl font-bold">{value}</span>
    </div>
  )
}
