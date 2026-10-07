import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function NonIID() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('Severe');

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.non_iid))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const activeData = data.find(d => d.Severity === selectedSeverity) || data[0];

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Non-IID Heterogeneity Analysis</h1>
          <p className="text-slate-500 mt-2">Phase 8.1: Impact of diverging hospital client distributions.</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="flex space-x-2 mb-6 bg-white p-2 rounded-lg border border-slate-200 inline-flex">
        {['IID', 'Mild', 'Moderate', 'Severe'].map(sev => (
          <button
            key={sev}
            onClick={() => setSelectedSeverity(sev)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedSeverity === sev ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            {sev}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <MetricBox title="JSD" value={activeData.JSD?.toFixed(4)} />
        <MetricBox title="Global F1" value={activeData.Global_F1?.toFixed(4)} />
        <MetricBox title="Mean Client F1" value={activeData.Mean_Client_F1?.toFixed(4)} />
        <MetricBox title="Worst Client F1" value={activeData.Worst_Client_F1?.toFixed(4)} highlight={selectedSeverity === 'Severe'} />
        <MetricBox title="F1 Std Dev" value={activeData.Client_F1_Std?.toFixed(4)} />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="h-80 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Severity" axisLine={false} tickLine={false} />
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
              <Line type="monotone" dataKey="Global_F1" stroke="#4f46e5" strokeWidth={3} name="Global F1" />
              <Line type="monotone" dataKey="Worst_Client_F1" stroke="#e11d48" strokeWidth={3} name="Worst Client F1" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="p-4 bg-rose-50 rounded-lg text-rose-900 border border-rose-100 text-sm">
          <strong>Scientific Conclusion:</strong> Global performance remains relatively stable, but worst-client performance explicitly degrades as heterogeneity (JSD) increases. Standard FedAvg is susceptible to client-level utility drops under severe skew.
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, highlight }) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-white border-slate-200 text-slate-800'}`}>
      <span className={`block text-xs uppercase mb-1 ${highlight ? 'text-rose-700' : 'text-slate-500'}`}>{title}</span>
      <span className="block text-xl font-bold">{value}</span>
    </div>
  )
}
