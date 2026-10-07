import React, { useState, useEffect } from 'react';
import { Network, Server, Play, Pause, RotateCcw, ArrowRight, ArrowDown, Shield, CheckCircle2 } from 'lucide-react';
import { VerifiedBadge } from '../components/StatusBadges';
import clsx from 'clsx';

export default function FederatedGraphLearning() {
  const [step, setStep] = useState(0); // 0: Local Training, 1: Model Update, 2: Aggregation, 3: Global Model, 4: Distribution
  const [isPlaying, setIsPlaying] = useState(true);

  const stepsInfo = [
    { num: 1, name: 'Local Graph Training', desc: 'Each hospital trains its local GraphSAGE model on private edge IoT communication graphs.' },
    { num: 2, name: 'Model Parameter Update', desc: 'Hospitals compute weight updates/parameters (delta weights) and local sample counts.' },
    { num: 3, name: 'Federated Aggregation', desc: 'Central coordinator aggregates client parameters using FedAvg / robust spatial median.' },
    { num: 4, name: 'Global Model Update', desc: 'Consolidated global parameters synthesize multi-hospital threat patterns.' },
    { num: 5, name: 'Distribution to Hospitals', desc: 'Updated global model parameters are broadcast back to edge clients for local inference.' }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setStep(prev => (prev + 1) % 5);
    }, 2400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Distributed Learning
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Federated Graph Learning</h1>
          <p className="text-slate-500 text-sm mt-1">
            Collaborative model training across distributed hospital edge environments while preserving data locality.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Animation Controls & Step Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Animation' : 'Resume Animation'}
          </button>
          
          <button
            onClick={() => { setStep(0); setIsPlaying(false); }}
            className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Step Pills */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
          {stepsInfo.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setStep(idx); setIsPlaying(false); }}
              className={clsx(
                "px-2.5 py-1 rounded-lg border transition-all",
                step === idx
                  ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {s.num}. {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Hospital Federation Architecture */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        
        {/* Step Banner */}
        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
            CURRENT FEDERATED ROUND STAGE ({step + 1} OF 5)
          </span>
          <h3 className="text-base font-bold text-indigo-950">{stepsInfo[step].name}</h3>
          <p className="text-xs text-indigo-800 mt-1 max-w-xl mx-auto">{stepsInfo[step].desc}</p>
        </div>

        {/* Three Simulated Hospitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Hospital A (ICU Ward)', traffic: 'High critical telemetry', color: 'border-blue-200 bg-blue-50/30' },
            { name: 'Hospital B (Cardiology)', traffic: 'Continuous waveform flows', color: 'border-emerald-200 bg-emerald-50/30' },
            { name: 'Hospital C (Emergency)', traffic: 'High-burst irregular flows', color: 'border-amber-200 bg-amber-50/30' }
          ].map((h, i) => (
            <div key={i} className={clsx("p-5 rounded-xl border text-center relative", h.color)}>
              <span className="text-xs font-bold text-slate-800 block mb-2">{h.name}</span>
              
              <div className="space-y-2 text-[11px] font-medium text-slate-600">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  IoT Devices (Monitors, Pumps)
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  Network Traffic Flows
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                  Communication Graph
                </div>
                <div className={clsx(
                  "p-2 rounded-lg border font-bold transition-colors",
                  step === 0 
                    ? "bg-indigo-600 text-white border-indigo-600 animate-pulse" 
                    : step === 4
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-indigo-50 border-indigo-200 text-indigo-900"
                )}>
                  {step === 0 ? 'Local Model Training...' : 'Local Model (GraphSAGE)'}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-3 text-[10px] text-slate-500 font-mono">
                {step === 1 && <span className="text-indigo-600 font-bold">↑ Sending Parameters...</span>}
                {step === 4 && <span className="text-emerald-600 font-bold">✓ Model Updated</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Aggregation Center Stage */}
        <div className="pt-4 flex flex-col items-center text-center space-y-4">
          <div className="text-xs text-slate-400 font-mono">
            {step === 1 ? '▲ Transmitting Model Updates ▲' : step === 3 ? '▼ Broadcasting Global Parameters ▼' : '—'}
          </div>

          <div className={clsx(
            "p-6 rounded-2xl border max-w-md w-full transition-all text-center",
            step === 2 || step === 3
              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-indigo-500"
              : "bg-slate-50 text-slate-700 border-slate-200"
          )}>
            <Server className={clsx("w-6 h-6 mx-auto mb-2", step === 2 || step === 3 ? "text-indigo-400" : "text-slate-500")} />
            <h4 className="font-bold text-sm">
              {step === 2 ? 'Federated Aggregator (Running FedAvg)' : 'Global Model Coordinator'}
            </h4>
            <p className={clsx("text-xs mt-1", step === 2 || step === 3 ? "text-slate-300" : "text-slate-500")}>
              {step === 2 
                ? 'Synthesizing client model updates into unified global parameters...'
                : 'Consolidated Global Parameters ready for edge distribution.'}
            </p>
          </div>
        </div>

        {/* Mandatory Transmission Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed text-center">
          <strong>Experimental Federated Protocol:</strong> Only model updates/parameters and sample counts are exchanged in this experimental federated workflow. Raw clinical text and raw IoT packets remain local to the respective edge hospital clients.
        </div>

      </div>

    </div>
  );
}
