import React, { useEffect, useState } from 'react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CentVsFed() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data.cent_vs_fed))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const chartData = [
    { name: 'Centralized IoT', F1: data.centralized_iot },
    { name: 'Federated IoT', F1: data.federated_iot },
    { name: 'Centralized Multimodal', F1: data.centralized_multimodal },
    { name: 'Federated Multimodal', F1: data.federated_multimodal },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Federated Learning</h1>
          <p className="text-slate-500 mt-2">Matched Phase 7.3 fair evaluation preserving data locality.</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-800 mb-6 uppercase text-center tracking-wide">Federated learning process visualization</h2>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex justify-around w-full">
              {[1, 2, 3].map((client) => (
                <div key={client} className="flex flex-col items-center">
                  <div className={`p-3 rounded-lg border ${step === 0 ? 'bg-indigo-100 border-indigo-300' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-xs font-bold text-slate-700">Client {client}</span>
                  </div>
                  <div className={`text-xs mt-2 ${step === 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                    Local Training
                  </div>
                  <div className={`text-xs mt-2 ${step === 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                    ↓ Model Update
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`w-full max-w-sm p-4 rounded-xl border-2 text-center transition-colors ${step === 2 || step === 3 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
              <span className="font-bold text-slate-800">Server Aggregation</span>
              <p className="text-xs text-slate-500 mt-1">Global Model Generation</p>
            </div>
            
            <div className={`text-xs ${step === 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              ↑ Broadcast back to clients
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-8 text-center italic">Interactive visualizations use verified experimental results and conceptual process animations. They do not execute new model training.</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="h-64 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} interval={0} />
                <YAxis domain={[0.98, 1.0]} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="F1" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-sky-50 rounded-lg text-sky-900 border border-sky-100 text-sm">
            <strong>Scientific Conclusion:</strong> Federated learning achieved comparable performance to the centralized oracle while strictly preserving data locality. FedAvg provides data locality in this experimental simulation; it is not by itself a formal privacy guarantee.
          </div>
        </div>
      </div>
    </div>
  );
}
