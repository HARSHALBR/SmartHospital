import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, ArrowDown, Server, Activity, Lock, Cpu } from 'lucide-react';
import { VerifiedBadge, SimulationBadge, DemoBadge } from '../components/StatusBadges';
import clsx from 'clsx';

export default function AnomalyDetection() {
  const [trafficMode, setTrafficMode] = useState('attack'); // 'normal' | 'attack'

  const conceptualDevices = [
    { icon: '🩺', name: 'Patient Monitor', type: 'Bedside Vitals', desc: 'Heart rate, SpO2 telemetry streams' },
    { icon: '💉', name: 'Infusion Pump', type: 'Drug Delivery', desc: 'Continuous basal rate & dosage packets' },
    { icon: '🫁', name: 'Ventilator', type: 'Life Support', desc: 'Inspiratory pressure & respiratory rate' },
    { icon: '🌡️', name: 'Environmental Sensor', type: 'Ward Ambient', desc: 'Operating theatre temperature & humidity' },
    { icon: '🖥️', name: 'Hospital Gateway', type: 'Edge Switch', desc: 'Ward aggregation and traffic routing' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-900 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Application Context
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Hospital IoT Anomaly Detection</h1>
          <p className="text-slate-500 text-sm mt-1">
            Conceptual smart-hospital application scenario illustrating network edge telemetry flows and anomaly response.
          </p>
        </div>
        <SimulationBadge />
      </div>

      {/* Conceptual Hospital Devices Grid */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Conceptual Smart-Hospital Devices
          </h2>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Conceptual Scenario Only
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {conceptualDevices.map((d, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col items-center">
              <span className="text-2xl mb-2">{d.icon}</span>
              <h3 className="font-bold text-xs text-slate-800">{d.name}</h3>
              <span className="text-[10px] text-slate-500 mt-0.5">{d.type}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 mt-4 italic leading-relaxed border-t border-slate-100 pt-3">
          *Important Domain Distinction: These are conceptual hospital devices. Edge-IIoTset is an industrial IoT cybersecurity dataset used as the experimental research benchmark; it does not contain real clinical equipment telemetry.
        </p>
      </div>

      {/* Clean Edge Traffic Architecture Flow (Section Q) */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide text-center mb-6">
          Edge Network Traffic & Detection Architecture
        </h2>

        <div className="max-w-xl mx-auto space-y-3 text-xs font-medium text-center">
          {/* Devices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🩺 Patient Monitor</div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">💉 Infusion Pump</div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🫁 Ventilator</div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">🌡️ Env. Sensor</div>
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 font-bold max-w-sm mx-auto shadow-xs">
            🖥️ Hospital Gateway / Ingress Switch
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 font-bold max-w-sm mx-auto shadow-xs">
            10-Second Communication Graph
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-bold max-w-sm mx-auto shadow-xs">
            Local AI Model (GraphSAGE / EdgeMLP)
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-slate-900 text-white font-bold rounded-xl max-w-sm mx-auto shadow-xs">
            Federated Aggregation (Global Parameters)
          </div>
        </div>
      </div>

      {/* Interactive Normal vs Anomalous Traffic Toggle */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Simulate Flow Telemetry Condition</h3>
            <p className="text-xs text-slate-500">Compare normal baseline telemetry against anomalous attack flows.</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTrafficMode('normal')}
              className={clsx(
                "px-4 py-2 rounded-lg transition-all",
                trafficMode === 'normal' 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Normal Flow
            </button>
            <button
              onClick={() => setTrafficMode('attack')}
              className={clsx(
                "px-4 py-2 rounded-lg transition-all",
                trafficMode === 'attack' 
                  ? "bg-rose-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Attack / Anomalous Flow
            </button>
          </div>
        </div>

        {/* Visual Flow Representation */}
        <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
          {trafficMode === 'normal' ? (
            <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
              <div className="p-4 bg-white rounded-xl border border-slate-200 w-44 shadow-xs">
                <span className="text-2xl block mb-1">🩺</span>
                <span className="font-bold text-xs text-slate-800 block">Device</span>
                <span className="text-[10px] text-slate-500">Regular telemetry ping</span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500 hidden md:block" />
              <div className="p-4 bg-white rounded-xl border border-slate-200 w-44 shadow-xs">
                <span className="text-2xl block mb-1">🖥️</span>
                <span className="font-bold text-xs text-slate-800 block">Gateway</span>
                <span className="text-[10px] text-slate-500">Normal packet rate</span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-500 hidden md:block" />
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl w-48 shadow-xs text-emerald-950">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="font-bold text-xs block">Normal Traffic</span>
                <span className="text-[10px] text-emerald-700">Verified legitimate flow</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
              <div className="p-4 bg-white rounded-xl border border-rose-200 w-44 shadow-xs">
                <span className="text-2xl block mb-1">💉</span>
                <span className="font-bold text-xs text-slate-800 block">Device</span>
                <span className="text-[10px] text-rose-600">Tampered connection</span>
              </div>
              <ArrowRight className="w-5 h-5 text-rose-500 hidden md:block" />
              <div className="p-4 bg-white rounded-xl border border-rose-200 w-44 shadow-xs">
                <span className="text-2xl block mb-1">🖥️</span>
                <span className="font-bold text-xs text-slate-800 block">Gateway</span>
                <span className="text-[10px] text-rose-600">SYN flood / scan burst</span>
              </div>
              <ArrowRight className="w-5 h-5 text-rose-500 hidden md:block" />
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl w-48 shadow-xs text-rose-950">
                <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
                <span className="font-bold text-xs block">ANOMALY DETECTED</span>
                <span className="text-[10px] text-rose-700">Suspicious network pattern</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Unavailable State Card for Live Inference (Section I) */}
      <div className="bg-slate-100/80 p-8 rounded-2xl border border-slate-300 text-center max-w-2xl mx-auto shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-300 inline-block mb-3">
          Live Inference Status
        </span>
        <h3 className="text-base font-bold text-slate-800">
          Live Inference Currently Unavailable
        </h3>
        <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          The verified Phase 7.3 model-weight artifact is currently missing from the output directory. In accordance with strict scientific integrity rules, live prediction is intentionally blocked (HTTP 503) rather than fabricated.
        </p>
        <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
          Endpoint: POST /api/inference • Status: 503 BLOCKED
        </div>
      </div>

    </div>
  );
}
