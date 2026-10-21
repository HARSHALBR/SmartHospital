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
    <div className="space-y-7 max-w-5xl mx-auto pb-16 text-[#172d3c]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#e4ebee] pb-5 gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#167f78] block mb-1">
            Distributed Learning Architecture
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#112c3b]">
            Federated Graph Learning
          </h1>
          <p className="text-[#647b87] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Collaborative model training across distributed hospital edge environments while preserving local data perimeters.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Animation Controls & Step Tracker Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#e4ebee] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#167f78] hover:bg-[#0f625f] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Animation' : 'Resume Animation'}
          </button>

          <button
            onClick={() => { setStep(0); setIsPlaying(false); }}
            className="p-2 hover:bg-[#edf5f4] text-[#5b707b] hover:text-[#167f78] rounded-xl transition-colors border border-transparent hover:border-[#dcebe7]"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 5 Step Pills */}
        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold justify-center">
          {stepsInfo.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setStep(idx); setIsPlaying(false); }}
              className={clsx(
                "px-3 py-1 rounded-lg border transition-all text-xs",
                step === idx
                  ? "bg-[#167f78] text-white border-[#167f78] font-bold shadow-xs"
                  : "bg-slate-50 text-[#556b77] border-[#e4ebee] hover:bg-[#edf5f4] hover:text-[#167f78]"
              )}
            >
              {s.num}. {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Hospital Federation Architecture */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e4ebee] shadow-sm space-y-7">

        {/* Step Banner */}
        <div className="p-4 bg-[#edf5f4] border border-[#cde2df] rounded-xl text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#167f78] block mb-0.5">
            CURRENT FEDERATED ROUND STAGE ({step + 1} OF 5)
          </span>
          <h3 className="text-base font-bold text-[#112c3b] font-display">{stepsInfo[step].name}</h3>
          <p className="text-xs text-[#2c5350] mt-1 max-w-xl mx-auto leading-relaxed">{stepsInfo[step].desc}</p>
        </div>

        {/* Three Simulated Hospitals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: 'Hospital A (ICU Ward)', traffic: 'High critical telemetry', color: 'border-blue-200 bg-blue-50/40' },
            { name: 'Hospital B (Cardiology)', traffic: 'Continuous waveform flows', color: 'border-emerald-200 bg-emerald-50/40' },
            { name: 'Hospital C (Emergency)', traffic: 'High-burst irregular flows', color: 'border-amber-200 bg-amber-50/40' }
          ].map((h, i) => (
            <div key={i} className={clsx("p-5 rounded-xl border text-center relative shadow-xs", h.color)}>
              <span className="text-xs font-bold text-[#112c3b] font-display block mb-2">{h.name}</span>

              <div className="space-y-2 text-[11px] font-medium text-[#556b77]">
                <div className="p-2 bg-white rounded-lg border border-[#e4ebee] shadow-xs">
                  IoT Devices (Monitors, Pumps)
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#e4ebee] shadow-xs">
                  Network Traffic Flows
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#e4ebee] shadow-xs">
                  Communication Graph
                </div>
                <div className={clsx(
                  "p-2 rounded-lg border font-bold transition-colors",
                  step === 0
                    ? "bg-[#167f78] text-white border-[#167f78] animate-pulse"
                    : step === 4
                    ? "bg-[#58bc9b] text-white border-[#58bc9b]"
                    : "bg-[#edf5f4] border-[#cde2df] text-[#112c3b]"
                )}>
                  {step === 0 ? 'Local Model Training...' : 'Local Model (GraphSAGE)'}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-3 text-[10px] text-[#647b87] font-mono">
                {step === 1 && <span className="text-[#167f78] font-bold">↑ Sending Parameters...</span>}
                {step === 4 && <span className="text-[#58bc9b] font-bold">✓ Model Updated</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Aggregation Center Stage */}
        <div className="pt-2 flex flex-col items-center text-center space-y-4">
          <div className="text-xs text-[#8a989e] font-mono">
            {step === 1 ? '▲ Transmitting Model Updates ▲' : step === 3 ? '▼ Broadcasting Global Parameters ▼' : '—'}
          </div>

          <div className={clsx(
            "p-6 rounded-2xl border max-w-md w-full transition-all text-center",
            step === 2 || step === 3
              ? "bg-[#112c3b] text-white border-[#112c3b] shadow-md ring-2 ring-[#8cd4c4]"
              : "bg-slate-50 text-[#172d3c] border-[#e4ebee]"
          )}>
            <Server className={clsx("w-6 h-6 mx-auto mb-2", step === 2 || step === 3 ? "text-[#a8ded2]" : "text-[#71848e]")} />
            <h4 className="font-bold text-sm font-display">
              {step === 2 ? 'Federated Aggregator (Running FedAvg)' : 'Global Model Coordinator'}
            </h4>
            <p className={clsx("text-xs mt-1 leading-relaxed", step === 2 || step === 3 ? "text-[#a7b7c1]" : "text-[#647b87]")}>
              {step === 2
                ? 'Synthesizing client model updates into unified global parameters...'
                : 'Consolidated Global Parameters ready for edge distribution.'}
            </p>
          </div>
        </div>

        {/* Mandatory Transmission Notice */}
        <div className="p-4 bg-slate-50 border border-[#e4ebee] rounded-xl text-xs text-[#556b77] leading-relaxed text-center">
          <strong>Experimental Federated Protocol:</strong> Only model updates/parameters and sample counts are exchanged in this experimental federated workflow. Raw clinical text and raw IoT packets remain local to the respective edge hospital clients.
        </div>

      </div>

    </div>
  );
}
