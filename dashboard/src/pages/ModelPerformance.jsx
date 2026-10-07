import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.baselines))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const chartData = [
    { name: 'Edge MLP', F1: data.edge_mlp },
    { name: 'GraphSAGE (No Edges)', F1: data.graphsage_no_edge },
    { name: 'Full GraphSAGE', F1: data.full_graphsage },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Centralized Model Performance</h1>
          <p className="text-slate-500 mt-2">Verified Phase 4.2 evaluation across canonical-flow topologies.</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis domain={[0.8, 1.0]} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="F1" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-8 p-4 bg-indigo-50 rounded-lg text-indigo-900 border border-indigo-100">
          <strong>Scientific Conclusion:</strong> Edge MLP achieved the strongest validated baseline performance in the canonical-flow evaluation. The deep packet inspection features contained significantly more diagnostic weight than purely topological routing relationships.
        </div>
      </div>
    </div>
  );
}
