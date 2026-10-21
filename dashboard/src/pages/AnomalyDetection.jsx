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
    <div className="space-y-7 max-w-5xl mx-auto pb-16 text-[#172d3c]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#e4ebee] pb-5 gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#167f78] block mb-1">
            Application Context & Methodology
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#112c3b]">
            Hospital IoT Anomaly Detection
          </h1>
          <p className="text-[#647b87] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Conceptual smart-hospital application scenario illustrating network edge telemetry flows, baseline behavior, and anomaly response.
          </p>
        </div>
        <SimulationBadge />
      </div>

      {/* Conceptual Hospital Devices Grid */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider font-display">
            Conceptual Smart-Hospital Devices
          </h2>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            Conceptual Scenario Only
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {conceptualDevices.map((d, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-[#e4ebee] rounded-xl text-center flex flex-col items-center hover:bg-[#edf5f4] transition-colors">
              <span className="text-2xl mb-2">{d.icon}</span>
              <h3 className="font-bold text-xs text-[#112c3b] font-display">{d.name}</h3>
              <span className="text-[10px] text-[#647b87] mt-0.5">{d.type}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#71848e] mt-4 italic leading-relaxed border-t border-[#f0f4f6] pt-3">
          *Important Domain Distinction: These are conceptual hospital devices. Edge-IIoTset is an industrial IoT cybersecurity dataset used as the experimental research benchmark; it does not contain real clinical equipment telemetry.
        </p>
      </div>

      {/* Clean Edge Traffic Architecture Flow */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider text-center mb-6 font-display">
          Edge Network Traffic & Detection Architecture
        </h2>

        <div className="max-w-xl mx-auto space-y-3 text-xs font-medium text-center">
          {/* Devices Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-[#e4ebee] text-[#112c3b]">🩺 Patient Monitor</div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-[#e4ebee] text-[#112c3b]">💉 Infusion Pump</div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-[#e4ebee] text-[#112c3b]">🫁 Ventilator</div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-[#e4ebee] text-[#112c3b]">🌡️ Env. Sensor</div>
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-[#edf5f4] border border-[#cde2df] rounded-xl text-[#112c3b] font-bold max-w-sm mx-auto shadow-xs">
            🖥️ Hospital Gateway / Ingress Switch
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-[#e8f1f5] border border-[#c5dae3] rounded-xl text-[#112c3b] font-bold max-w-sm mx-auto shadow-xs">
            10-Second Communication Graph
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 font-bold max-w-sm mx-auto shadow-xs">
            Local AI Model (GraphSAGE / EdgeMLP)
          </div>

          <div className="text-slate-400">↓</div>

          <div className="p-3 bg-[#112c3b] text-white font-bold rounded-xl max-w-sm mx-auto shadow-xs font-display">
            Federated Aggregation (Global Parameters)
          </div>
        </div>
      </div>

      {/* Interactive Normal vs Anomalous Traffic Toggle */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#112c3b] font-display">Simulate Flow Telemetry Condition</h3>
            <p className="text-xs text-[#647b87] mt-0.5">Compare normal baseline telemetry against anomalous attack flows.</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-[#e4ebee] text-xs font-bold">
            <button
              onClick={() => setTrafficMode('normal')}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg transition-all",
                trafficMode === 'normal'
                  ? "bg-[#167f78] text-white shadow-xs"
                  : "text-[#647b87] hover:text-[#112c3b]"
              )}
            >
              Normal Flow
            </button>
            <button
              onClick={() => setTrafficMode('attack')}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg transition-all",
                trafficMode === 'attack'
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-[#647b87] hover:text-[#112c3b]"
              )}
            >
              Attack / Anomalous Flow
            </button>
          </div>
        </div>

        {/* Visual Flow Representation */}
        <div className="p-5 sm:p-6 rounded-xl border border-[#e4ebee] bg-slate-50">
          {trafficMode === 'normal' ? (
            <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
              <div className="p-4 bg-white rounded-xl border border-[#e4ebee] w-44 shadow-xs">
                <span className="text-2xl block mb-1">🩺</span>
                <span className="font-bold text-xs text-[#112c3b] block">Device</span>
                <span className="text-[10px] text-[#647b87]">Regular telemetry ping</span>
              </div>
              <ArrowRight className="w-5 h-5 text-[#167f78] hidden md:block" />
              <div className="p-4 bg-white rounded-xl border border-[#e4ebee] w-44 shadow-xs">
                <span className="text-2xl block mb-1">🖥️</span>
                <span className="font-bold text-xs text-[#112c3b] block">Gateway</span>
                <span className="text-[10px] text-[#647b87]">Normal packet rate</span>
              </div>
              <ArrowRight className="w-5 h-5 text-[#167f78] hidden md:block" />
              <div className="p-4 bg-[#edf5f4] border border-[#cde2df] rounded-xl w-48 shadow-xs text-[#112c3b]">
                <CheckCircle2 className="w-6 h-6 text-[#167f78] mx-auto mb-1" />
                <span className="font-bold text-xs block font-display">Normal Traffic</span>
                <span className="text-[10px] text-[#2c5350]">Verified legitimate flow</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-around gap-4 text-center">
              <div className="p-4 bg-white rounded-xl border border-rose-200 w-44 shadow-xs">
                <span className="text-2xl block mb-1">💉</span>
                <span className="font-bold text-xs text-[#112c3b] block">Device</span>
                <span className="text-[10px] text-rose-600">Tampered connection</span>
              </div>
              <ArrowRight className="w-5 h-5 text-rose-500 hidden md:block" />
              <div className="p-4 bg-white rounded-xl border border-rose-200 w-44 shadow-xs">
                <span className="text-2xl block mb-1">🖥️</span>
                <span className="font-bold text-xs text-[#112c3b] block">Gateway</span>
                <span className="text-[10px] text-rose-600">SYN flood / scan burst</span>
              </div>
              <ArrowRight className="w-5 h-5 text-rose-500 hidden md:block" />
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl w-48 shadow-xs text-rose-950">
                <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-1" />
                <span className="font-bold text-xs block font-display">ANOMALY DETECTED</span>
                <span className="text-[10px] text-rose-700">Suspicious network pattern</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Unavailable State Card for Live Inference */}
      <div className="bg-[#edf5f4]/50 p-6 sm:p-7 rounded-2xl border border-[#cde2df] text-center max-w-2xl mx-auto shadow-xs">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#167f78] bg-white px-3 py-1 rounded-full border border-[#cde2df] inline-block mb-3">
          Live Inference Status
        </span>
        <h3 className="text-base font-bold text-[#112c3b] font-display">
          Live Inference Currently Unavailable
        </h3>
        <p className="text-xs text-[#556b77] mt-2 max-w-md mx-auto leading-relaxed">
          The verified Phase 7.3 model-weight artifact is currently missing from the output directory. In accordance with strict scientific integrity rules, live prediction is intentionally blocked (HTTP 503) rather than fabricated.
        </p>
        <div className="mt-4 pt-3 border-t border-[#dcebe7] text-[11px] text-[#647b87] font-mono">
          Endpoint: POST /api/inference • Status: 503 BLOCKED
        </div>
      </div>

    </div>
  );
}
