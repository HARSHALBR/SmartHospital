import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Activity, ShieldCheck, AlertTriangle, 
  Info, CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';

// Conceptual Hospital Network Nodes across 3 core hospital departments
const HOSPITAL_A_ICU = 'Hospital A — ICU';
const HOSPITAL_B_CARDIO = 'Hospital B — Cardiology';
const HOSPITAL_C_EMERGENCY = 'Hospital C — Emergency';

const NETWORK_NODES = [
  // Hospital A — ICU
  { 
    id: 'hosp-a-gw', 
    hospital: HOSPITAL_A_ICU, 
    label: 'ICU Hospital Gateway', 
    type: 'Gateway', 
    role: 'gateway',
    x: 160, 
    y: 130, 
    ip: '10.10.1.1',
    protocol: 'TLS 1.3 / HL7 FHIR',
    baseRate: 450,
    normalBandwidth: '380 KB/s',
    suspiciousBandwidth: '4.8 MB/s',
    desc: 'Departmental edge aggregation gateway routing bedside telemetry to federated edge server.'
  },
  { 
    id: 'hosp-a-vent', 
    hospital: HOSPITAL_A_ICU, 
    label: 'Mechanical Ventilator', 
    type: 'Ventilator', 
    role: 'device',
    x: 70, 
    y: 60, 
    ip: '10.10.1.12',
    protocol: 'Proprietary MedBus / TCP',
    baseRate: 140,
    normalBandwidth: '42 KB/s',
    suspiciousBandwidth: '180 KB/s',
    desc: 'Life-support respiratory ventilation monitor sending continuous airway pressure & volume telemetry.'
  },
  { 
    id: 'hosp-a-pump', 
    hospital: HOSPITAL_A_ICU, 
    label: 'Smart Infusion Pump', 
    type: 'Infusion Pump', 
    role: 'device',
    x: 60, 
    y: 170, 
    ip: '10.10.1.15',
    protocol: 'MQTT-SN / TLS',
    baseRate: 65,
    normalBandwidth: '18 KB/s',
    suspiciousBandwidth: '240 KB/s',
    desc: 'Micro-infusion delivery unit administering vasoactive medications with flow rate telemetry.'
  },
  { 
    id: 'hosp-a-monitor', 
    hospital: HOSPITAL_A_ICU, 
    label: 'ICU Patient Monitor', 
    type: 'Patient Monitor', 
    role: 'device',
    x: 130, 
    y: 220, 
    ip: '10.10.1.20',
    protocol: 'HL7 v2.5 / TCP',
    baseRate: 210,
    normalBandwidth: '68 KB/s',
    suspiciousBandwidth: '520 KB/s',
    desc: 'Continuous multi-parameter bedside monitor capturing ECG, invasive arterial pressure, and SpO2.'
  },
  { 
    id: 'hosp-a-env', 
    hospital: HOSPITAL_A_ICU, 
    label: 'Negative Pressure Sensor', 
    type: 'Environmental Sensor', 
    role: 'sensor',
    x: 230, 
    y: 60, 
    ip: '10.10.1.45',
    protocol: 'CoAP / UDP',
    baseRate: 25,
    normalBandwidth: '4 KB/s',
    suspiciousBandwidth: '32 KB/s',
    desc: 'Isolation room airflow, differential air pressure, and ambient humidity telemetry sensor.'
  },

  // Hospital B — Cardiology
  { 
    id: 'hosp-b-gw', 
    hospital: HOSPITAL_B_CARDIO, 
    label: 'Cardiology Telemetry Gateway', 
    type: 'Gateway', 
    role: 'gateway',
    x: 400, 
    y: 90, 
    ip: '10.20.1.1',
    protocol: 'TLS 1.3 / DICOM-RTV',
    baseRate: 380,
    normalBandwidth: '290 KB/s',
    suspiciousBandwidth: '3.6 MB/s',
    desc: 'Cardiology floor edge router managing wireless arrhythmia telemetry streams.'
  },
  { 
    id: 'hosp-b-monitor', 
    hospital: HOSPITAL_B_CARDIO, 
    label: 'Holter Telemetry Monitor', 
    type: 'Patient Monitor', 
    role: 'device',
    x: 350, 
    y: 20, 
    ip: '10.20.1.14',
    protocol: 'Bluetooth-LE over IP Gateway',
    baseRate: 180,
    normalBandwidth: '54 KB/s',
    suspiciousBandwidth: '410 KB/s',
    desc: 'Ambulatory cardiac telemetry unit transmitting 12-lead rhythm waveforms to central nursing station.'
  },
  { 
    id: 'hosp-b-pump', 
    hospital: HOSPITAL_B_CARDIO, 
    label: 'Heparin Infusion Unit', 
    type: 'Infusion Pump', 
    role: 'device',
    x: 480, 
    y: 40, 
    ip: '10.20.1.22',
    protocol: 'MQTT / TLS',
    baseRate: 50,
    normalBandwidth: '14 KB/s',
    suspiciousBandwidth: '190 KB/s',
    desc: 'Continuous intravenous anticoagulation pump with automated dose logging and occlusion sensors.'
  },
  { 
    id: 'hosp-b-env', 
    hospital: HOSPITAL_B_CARDIO, 
    label: 'Cardiac Ward Temp/Humidity', 
    type: 'Environmental Sensor', 
    role: 'sensor',
    x: 470, 
    y: 150, 
    ip: '10.20.1.50',
    protocol: 'CoAP / UDP',
    baseRate: 20,
    normalBandwidth: '3 KB/s',
    suspiciousBandwidth: '28 KB/s',
    desc: 'Sub-acute cardiac recovery unit environmental condition and medication refrigerator sensor.'
  },

  // Hospital C — Emergency
  { 
    id: 'hosp-c-gw', 
    hospital: HOSPITAL_C_EMERGENCY, 
    label: 'Emergency Bay Gateway', 
    type: 'Gateway', 
    role: 'gateway',
    x: 620, 
    y: 170, 
    ip: '10.30.1.1',
    protocol: 'TLS 1.3 / Fast HL7',
    baseRate: 520,
    normalBandwidth: '440 KB/s',
    suspiciousBandwidth: '6.1 MB/s',
    desc: 'High-throughput trauma bay gateway coordinating transient emergency vital telemetry.'
  },
  { 
    id: 'hosp-c-monitor', 
    hospital: HOSPITAL_C_EMERGENCY, 
    label: 'Triage Patient Monitor', 
    type: 'Patient Monitor', 
    role: 'device',
    x: 580, 
    y: 250, 
    ip: '10.30.1.11',
    protocol: 'HL7 v2.6 / TCP',
    baseRate: 230,
    normalBandwidth: '72 KB/s',
    suspiciousBandwidth: '490 KB/s',
    desc: 'Rapid triage vital sign monitor for incoming acute polytrauma and stroke assessment.'
  },
  { 
    id: 'hosp-c-pump', 
    hospital: HOSPITAL_C_EMERGENCY, 
    label: 'Rapid Infusion System', 
    type: 'Infusion Pump', 
    role: 'device',
    x: 690, 
    y: 240, 
    ip: '10.30.1.18',
    protocol: 'MQTT / TLS',
    baseRate: 85,
    normalBandwidth: '22 KB/s',
    suspiciousBandwidth: '260 KB/s',
    desc: 'Emergency blood transfusion and high-speed fluid resuscitation controller.'
  },
  { 
    id: 'hosp-c-env', 
    hospital: HOSPITAL_C_EMERGENCY, 
    label: 'Resus Bay Ambient Sensor', 
    type: 'Environmental Sensor', 
    role: 'sensor',
    x: 680, 
    y: 110, 
    ip: '10.30.1.42',
    protocol: 'CoAP / UDP',
    baseRate: 30,
    normalBandwidth: '5 KB/s',
    suspiciousBandwidth: '35 KB/s',
    desc: 'Emergency resuscitation bay air filtration, particulate count, and temp telemetry.'
  },

  // Central Federated Coordinator
  { 
    id: 'hosp-core', 
    hospital: 'Federated Coordinator', 
    label: 'Hospital Edge Coordinator', 
    type: 'Core Coordinator', 
    role: 'core',
    x: 380, 
    y: 240, 
    ip: '10.0.0.254',
    protocol: 'gRPC / TLS 1.3',
    baseRate: 850,
    normalBandwidth: '1.2 MB/s',
    suspiciousBandwidth: '12.4 MB/s',
    desc: 'Federated learning edge aggregation server synchronizing distributed ward GraphSAGE updates.'
  }
];

const NETWORK_LINKS = [
  // Hospital A Links
  { from: 'hosp-a-vent', to: 'hosp-a-gw' },
  { from: 'hosp-a-pump', to: 'hosp-a-gw' },
  { from: 'hosp-a-monitor', to: 'hosp-a-gw' },
  { from: 'hosp-a-env', to: 'hosp-a-gw' },
  { from: 'hosp-a-gw', to: 'hosp-core' },

  // Hospital B Links
  { from: 'hosp-b-monitor', to: 'hosp-b-gw' },
  { from: 'hosp-b-pump', to: 'hosp-b-gw' },
  { from: 'hosp-b-env', to: 'hosp-b-gw' },
  { from: 'hosp-b-gw', to: 'hosp-core' },

  // Hospital C Links
  { from: 'hosp-c-monitor', to: 'hosp-c-gw' },
  { from: 'hosp-c-pump', to: 'hosp-c-gw' },
  { from: 'hosp-c-env', to: 'hosp-c-gw' },
  { from: 'hosp-c-gw', to: 'hosp-core' }
];

export default function HospitalNetworkSim({ isSuspicious, onToggleScenario, onResetScenario }) {
  const [isRunning, setIsRunning] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState('hosp-a-pump');
  const [tick, setTick] = useState(0);

  // Deterministic simulation tick loop
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, [isRunning]);

  const selectedNode = NETWORK_NODES.find(n => n.id === selectedNodeId) || NETWORK_NODES[0];

  const handleReset = () => {
    setIsRunning(false);
    setTick(0);
    setSelectedNodeId('hosp-a-pump');
    if (onResetScenario) onResetScenario();
  };

  // Node traffic characteristics under current simulation scenario
  const getNodeTraffic = (node) => {
    const isTargetedByAttack = isSuspicious && (
      node.id === 'hosp-a-gw' || 
      node.id === 'hosp-a-pump' || 
      node.id === 'hosp-a-vent' ||
      node.id === 'hosp-core'
    );

    const jitter = ((tick * 17 + node.x) % 19) - 9;
    const packetRate = isTargetedByAttack 
      ? Math.round(node.baseRate * 7.5 + jitter * 8)
      : Math.max(12, Math.round(node.baseRate + jitter));
    
    const anomalyStatus = isTargetedByAttack ? 'Suspicious' : 'Normal';
    const bandwidth = isTargetedByAttack ? node.suspiciousBandwidth : node.normalBandwidth;
    
    return {
      packetRate,
      bandwidth,
      anomalyStatus,
      isTargetedByAttack
    };
  };

  const selectedTraffic = getNodeTraffic(selectedNode);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with Conceptual Disclaimer & Controls */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Feature A • Network Topology
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Conceptual Simulation
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Smart Hospital Distributed Medical IoT Network
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Interactive conceptual model illustrating hospital departments (ICU, Cardiology, Emergency), medical endpoints, environmental sensors, and departmental edge gateways.
            </p>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs",
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? 'Pause Sim' : (tick > 0 ? 'Resume Sim' : 'Start Simulation')}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset
            </button>

            <button
              onClick={onToggleScenario}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                isSuspicious
                  ? "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100"
                  : "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
              )}
            >
              {isSuspicious ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Scenario: Suspicious</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Scenario: Normal</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Clear Conceptual Disclaimer Banner */}
        <div className="mt-4 p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Conceptual Simulation Notice:</strong> This interactive visual model simulates medical IoT communication patterns and simulated volumetric disruptions. It is purely illustrative and is <strong>not connected to actual hospital infrastructure, live medical equipment, or real patients</strong>.
          </p>
        </div>
      </div>

      {/* Main Grid: SVG Canvas + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-slate-950">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Activity className={clsx("w-3.5 h-3.5", isRunning ? "text-emerald-400 animate-pulse" : "text-slate-500")} />
              {isRunning ? `Simulation Running • Tick ${tick}` : 'Simulation Paused'}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Click any node to inspect device profile and conceptual traffic
            </span>
          </div>

          <div className="w-full relative bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
            <svg 
              className="w-full h-auto max-h-[460px] select-none" 
              viewBox="0 0 760 320"
              role="img"
              aria-label="Smart Hospital Network Topology"
            >
              <defs>
                <linearGradient id="linkNorm" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="linkAttack" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Department Zone Overlays */}
              <rect x="30" y="15" width="230" height="250" rx="12" fill="#1e1b4b" fillOpacity="0.25" stroke="#3730a3" strokeDasharray="3 3" />
              <text x="45" y="38" fill="#a5b4fc" fontSize="11" fontWeight="bold">Hospital A — ICU</text>

              <rect x="310" y="10" width="200" height="170" rx="12" fill="#042f2e" fillOpacity="0.25" stroke="#134e4a" strokeDasharray="3 3" />
              <text x="325" y="32" fill="#5eead4" fontSize="11" fontWeight="bold">Hospital B — Cardiology</text>

              <rect x="540" y="90" width="190" height="195" rx="12" fill="#3f1412" fillOpacity="0.25" stroke="#7f1d1d" strokeDasharray="3 3" />
              <text x="555" y="112" fill="#fca5a5" fontSize="11" fontWeight="bold">Hospital C — Emergency</text>

              {/* Communication Links */}
              {NETWORK_LINKS.map((link, i) => {
                const fromNode = NETWORK_NODES.find(n => n.id === link.from);
                const toNode = NETWORK_NODES.find(n => n.id === link.to);
                if (!fromNode || !toNode) return null;

                const fromTraffic = getNodeTraffic(fromNode);
                const toTraffic = getNodeTraffic(toNode);
                const isLinkAnomalous = fromTraffic.isTargetedByAttack || toTraffic.isTargetedByAttack;

                return (
                  <g key={`link-${i}`}>
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={isLinkAnomalous ? "url(#linkAttack)" : "url(#linkNorm)"}
                      strokeWidth={isLinkAnomalous ? "2.5" : "1.5"}
                      strokeDasharray={isLinkAnomalous ? "5 3" : "none"}
                    />

                    {/* Animated Flow Packet Particle */}
                    {isRunning && (
                      <circle
                        r={isLinkAnomalous ? "3.5" : "2"}
                        fill={isLinkAnomalous ? "#ef4444" : "#38bdf8"}
                      >
                        <animateMotion
                          path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                          dur={isLinkAnomalous ? "0.9s" : "2.2s"}
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                );
              })}

              {/* Nodes Rendering */}
              {NETWORK_NODES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const traffic = getNodeTraffic(node);

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer"
                  >
                    {/* Selected Ring */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.role === 'gateway' ? "22" : node.role === 'core' ? "26" : "16"}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Node Glyphs */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.role === 'core' ? "18" : node.role === 'gateway' ? "15" : "10"}
                      fill={
                        node.role === 'core' ? '#4f46e5' : 
                        node.role === 'gateway' ? '#1e293b' : 
                        traffic.isTargetedByAttack ? '#7f1d1d' : '#0f172a'
                      }
                      stroke={
                        traffic.isTargetedByAttack ? '#ef4444' : 
                        node.role === 'gateway' ? '#38bdf8' : 
                        node.role === 'sensor' ? '#34d399' : '#94a3b8'
                      }
                      strokeWidth={traffic.isTargetedByAttack ? "2.5" : "1.5"}
                    />

                    {/* Node Label */}
                    <text
                      x={node.x}
                      y={node.y + (node.role === 'gateway' || node.role === 'core' ? 24 : 18)}
                      fill={isSelected ? "#ffffff" : "#cbd5e1"}
                      fontSize="9"
                      fontWeight={isSelected ? "bold" : "normal"}
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom In-Canvas Legend */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-sky-400 inline-block" />
                  Gateway
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-400 inline-block" />
                  Medical Device
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-emerald-400 inline-block" />
                  Sensor
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  Coordinator
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Normal Flow
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Suspicious Surge
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node Detail Panel */}
        <div className="p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                  {selectedNode.hospital}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Type: {selectedNode.type} • ID: {selectedNode.id}
                </p>
              </div>
              <span className={clsx(
                "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                selectedTraffic.anomalyStatus === 'Normal'
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800 animate-pulse"
              )}>
                {selectedTraffic.anomalyStatus}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4 pb-3 border-b border-slate-100">
              {selectedNode.desc}
            </p>

            {/* Traffic Characteristics Table */}
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Conceptual Traffic Characteristics
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Assigned IP:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedNode.ip}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Application Protocol:</span>
                <span className="font-mono text-slate-800">{selectedNode.protocol}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Conceptual Packet Rate:</span>
                <span className={clsx(
                  "font-mono font-bold",
                  selectedTraffic.isTargetedByAttack ? "text-rose-600" : "text-emerald-700"
                )}>
                  {selectedTraffic.packetRate} pkts/sec
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Simulated Bandwidth:</span>
                <span className="font-mono text-slate-800">{selectedTraffic.bandwidth}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Edge Link Degree:</span>
                <span className="font-mono text-slate-800">
                  {NETWORK_LINKS.filter(l => l.from === selectedNode.id || l.to === selectedNode.id).length} Connected Links
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Simulation Status: Active</span>
              </div>
              <p>
                Adjusting scenario toggles updates packet frequencies and edge anomalies deterministically across the 3 hospital wards.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
