import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Shield, ShieldAlert, Cpu, Network, Database, 
  Activity, FileText, Share2, Layers, AlertTriangle, CheckCircle, 
  Server, Zap, Lock, RefreshCw, Eye, Info, ChevronRight, BarChart3,
  Sliders, Radio, HeartPulse, Stethoscope
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getMetricsAll } from '../services/api';
import { VerifiedBadge, SimulationBadge } from '../components/StatusBadges';
import clsx from 'clsx';

// Predefined Smart Hospital Wards & Medical IoT Device Nodes
const HOSPITAL_NODES = [
  { id: 'icu-gw', ward: 'ICU', label: 'ICU Gateway Switch', type: 'Gateway', x: 200, y: 150, role: 'hub', ip: '10.24.1.1' },
  { id: 'icu-vent-01', ward: 'ICU', label: 'Mechanical Ventilator', type: 'Ventilator', x: 120, y: 70, role: 'device', ip: '10.24.1.12' },
  { id: 'icu-inf-02', ward: 'ICU', label: 'Smart Infusion Pump', type: 'Pump', x: 80, y: 170, role: 'device', ip: '10.24.1.15' },
  { id: 'icu-ecg-03', ward: 'ICU', label: 'Bedside ECG Monitor', type: 'Monitor', x: 150, y: 250, role: 'device', ip: '10.24.1.18' },

  { id: 'cardio-gw', ward: 'Cardiology', label: 'Cardio Telemetry Hub', type: 'Gateway', x: 420, y: 100, role: 'hub', ip: '10.24.2.1' },
  { id: 'cardio-mon-01', ward: 'Cardiology', label: 'Holter Telemetry Node', type: 'Monitor', x: 380, y: 30, role: 'device', ip: '10.24.2.10' },
  { id: 'cardio-pmp-02', ward: 'Cardiology', label: 'Heparin Infusion Unit', type: 'Pump', x: 490, y: 60, role: 'device', ip: '10.24.2.14' },

  { id: 'emerg-gw', ward: 'Emergency', label: 'Emergency Room Gateway', type: 'Gateway', x: 620, y: 180, role: 'hub', ip: '10.24.3.1' },
  { id: 'emerg-tri-01', ward: 'Emergency', label: 'Triage Vitals Station', type: 'Monitor', x: 570, y: 260, role: 'device', ip: '10.24.3.11' },
  { id: 'emerg-def-02', ward: 'Emergency', label: 'Connected Defibrillator', type: 'LifeSupport', x: 690, y: 250, role: 'device', ip: '10.24.3.16' },

  { id: 'surg-gw', ward: 'Surgery', label: 'Surgical OR Switch', type: 'Gateway', x: 340, y: 330, role: 'hub', ip: '10.24.4.1' },
  { id: 'surg-ane-01', ward: 'Surgery', label: 'Anesthesia Workstation', type: 'LifeSupport', x: 260, y: 400, role: 'device', ip: '10.24.4.12' },
  { id: 'surg-rob-02', ward: 'Surgery', label: 'Surgical Tele-Robot', type: 'Robot', x: 410, y: 410, role: 'device', ip: '10.24.4.20' },

  { id: 'rad-pacs', ward: 'Radiology', label: 'PACS Imaging Workstation', type: 'Workstation', x: 580, y: 390, role: 'device', ip: '10.24.5.10' },
  { id: 'hosp-core', ward: 'Core Infrastructure', label: 'Federated Edge Core Server', type: 'CoreServer', x: 380, y: 220, role: 'core', ip: '10.24.0.254' }
];

const HOSPITAL_EDGES = [
  { from: 'icu-vent-01', to: 'icu-gw' },
  { from: 'icu-inf-02', to: 'icu-gw' },
  { from: 'icu-ecg-03', to: 'icu-gw' },
  { from: 'icu-gw', to: 'hosp-core' },

  { from: 'cardio-mon-01', to: 'cardio-gw' },
  { from: 'cardio-pmp-02', to: 'cardio-gw' },
  { from: 'cardio-gw', to: 'hosp-core' },

  { from: 'emerg-tri-01', to: 'emerg-gw' },
  { from: 'emerg-def-02', to: 'emerg-gw' },
  { from: 'emerg-gw', to: 'hosp-core' },

  { from: 'surg-ane-01', to: 'surg-gw' },
  { from: 'surg-rob-02', to: 'surg-gw' },
  { from: 'surg-gw', to: 'hosp-core' },

  { from: 'rad-pacs', to: 'surg-gw' },
  { from: 'icu-gw', to: 'surg-gw' }
];

// Attack Presets
const ATTACK_SCENARIOS = {
  normal: {
    id: 'normal',
    name: 'Normal Operation',
    targetWard: 'All',
    targetNodes: [],
    desc: 'Legitimate medical IoT telemetry, patient vital heartbeats, scheduled infusion pumps, normal bandwidth.',
    rateMultiplier: 1.0,
    flowAnomaly: 0.02,
    severity: 'clean',
    attackType: 'None (Baseline)'
  },
  ddos: {
    id: 'ddos',
    name: 'DDoS Telemetry Flood',
    targetWard: 'ICU',
    targetNodes: ['icu-gw', 'icu-vent-01', 'icu-inf-02'],
    desc: 'High-volume SYN/UDP telemetry flood targeting ICU gateway. High packet frequency and TCP flag anomaly.',
    rateMultiplier: 8.5,
    flowAnomaly: 0.96,
    severity: 'critical',
    attackType: 'Distributed Denial of Service'
  },
  mitm_pump: {
    id: 'mitm_pump',
    name: 'Infusion Pump MITM & Dosage Tamper',
    targetWard: 'ICU',
    targetNodes: ['icu-inf-02', 'icu-gw'],
    desc: 'Adversary executes ARP poisoning to intercept and manipulate insulin/heparin infusion dosage telemetry flow.',
    rateMultiplier: 2.2,
    flowAnomaly: 0.89,
    severity: 'high',
    attackType: 'Man-in-the-Middle Flow Injection'
  },
  ransomware: {
    id: 'ransomware',
    name: 'Lateral Ransomware Worm Propagation',
    targetWard: 'Radiology',
    targetNodes: ['rad-pacs', 'surg-gw', 'surg-ane-01'],
    desc: 'Lateral port scan (SMB/445, RDP/3389) spreading from Radiology PACS workstation toward Surgical network.',
    rateMultiplier: 4.8,
    flowAnomaly: 0.94,
    severity: 'critical',
    attackType: 'Port Scan / Lateral Movement'
  },
  ventilator_spoof: {
    id: 'ventilator_spoof',
    name: 'Ventilator Telemetry Spoofing',
    targetWard: 'ICU',
    targetNodes: ['icu-vent-01'],
    desc: 'False sensor telemetry injection masking respiratory distress while sending forged steady-state waveforms.',
    rateMultiplier: 1.6,
    flowAnomaly: 0.84,
    severity: 'elevated',
    attackType: 'Sensor Telemetry Masquerade'
  }
};

// Clinical Note Presets
const CLINICAL_PRESETS = [
  {
    id: 'c1',
    title: 'ICU Sepsis Shock Alert',
    text: 'ICU Bed 3: Patient with refractory septic shock, on norepinephrine 0.2 mcg/kg/min, lactate 4.1 mmol/L. Arterial line telemetry connected. Blood cultures pending.',
    category: 'Critical Care / Sepsis',
    clusterX: 75,
    clusterY: 28,
    riskContext: 'High'
  },
  {
    id: 'c2',
    title: 'Post-Op Cardiology Telemetry',
    text: 'Telemetry Unit 4: Post-CABG recovery day 2. Occasional PVCs noted on telemetry. Patient resting comfortably, vitals stable, SpO2 97% on room air.',
    category: 'Cardiology Telemetry',
    clusterX: 42,
    clusterY: 65,
    riskContext: 'Moderate'
  },
  {
    id: 'c3',
    title: 'Routine General Ward Checkup',
    text: 'General Ward 2B: Morning assessment completed. Patient afebrile, pulse regular 72 bpm, blood pressure 118/76. IV saline lock patent, telemetry ping verified normal.',
    category: 'Routine Inpatient',
    clusterX: 20,
    clusterY: 80,
    riskContext: 'Low'
  },
  {
    id: 'c4',
    title: 'Emergency Trauma Resuscitation',
    text: 'Trauma Bay 1: Severe blunt polytrauma with acute hemorrhagic shock. Rapid transfusion protocol initiated via Belmont infuser. Arterial pressure unstable.',
    category: 'Emergency Trauma',
    clusterX: 85,
    clusterY: 20,
    riskContext: 'Critical'
  }
];

export default function HospitalSimulation() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'graph' | 'semantic' | 'fusion' | 'federated'
  const [scenarioKey, setScenarioKey] = useState('normal');
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedNode, setSelectedNode] = useState(HOSPITAL_NODES[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simTick, setSimTick] = useState(0);

  // Semantic Vectorization States
  const [selectedPresetId, setSelectedPresetId] = useState('c1');
  const [customText, setCustomText] = useState(CLINICAL_PRESETS[0].text);
  const [vectorDim, setVectorDim] = useState('128'); // '768' or '128'

  // Multi-Modal Fusion States
  const [fusionMode, setFusionMode] = useState('early'); // 'early' | 'late'

  // Federated Learning States
  const [fedRound, setFedRound] = useState(12);
  const [aggregator, setAggregator] = useState('median'); // 'fedavg' | 'fedprox' | 'median' | 'dp'
  const [byzantineAttackers, setByzantineAttackers] = useState(1); // 0, 1, 2

  // Metrics from Backend
  const [metricsData, setMetricsData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Fetch verified backend metrics on mount
  useEffect(() => {
    getMetricsAll()
      .then(res => setMetricsData(res.data))
      .catch(err => console.warn('Backend metrics fetch unavailable in simulation', err));
  }, []);

  const activeScenario = ATTACK_SCENARIOS[scenarioKey];

  // Simulation Clock Tick Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSimTick(t => t + 1);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Generate real-time telemetry log based on scenario
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    let newAlert = null;

    if (scenarioKey === 'normal') {
      newAlert = {
        id: Date.now(),
        time: timestamp,
        level: 'INFO',
        device: 'icu-ecg-03',
        msg: 'Periodic heartbeat packet validated. Multi-modal risk index: 0.02 (Normal).',
        ward: 'ICU'
      };
    } else if (scenarioKey === 'ddos') {
      newAlert = {
        id: Date.now(),
        time: timestamp,
        level: 'CRITICAL',
        device: 'icu-gw',
        msg: 'Volumetric telemetry flood detected on ICU Gateway! Flow rate 14,200 pkts/s. GraphSAGE anomaly probability: 0.98.',
        ward: 'ICU'
      };
    } else if (scenarioKey === 'mitm_pump') {
      newAlert = {
        id: Date.now(),
        time: timestamp,
        level: 'WARNING',
        device: 'icu-inf-02',
        msg: 'Anomalous TCP flag pattern and packet length jitter on Infusion Pump flow. MITM flag raised.',
        ward: 'ICU'
      };
    } else if (scenarioKey === 'ransomware') {
      newAlert = {
        id: Date.now(),
        time: timestamp,
        level: 'CRITICAL',
        device: 'rad-pacs',
        msg: 'Rapid port sweep (445/3389) detected originating from PACS workstation toward Surgical network.',
        ward: 'Radiology'
      };
    } else if (scenarioKey === 'ventilator_spoof') {
      newAlert = {
        id: Date.now(),
        time: timestamp,
        level: 'ELEVATED',
        device: 'icu-vent-01',
        msg: 'Sensor payload discordance: Network flow mimics steady-state, but semantic clinical vector indicates acute distress.',
        ward: 'ICU'
      };
    }

    if (newAlert) {
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }
  }, [simTick, scenarioKey]);

  // Calculate live node metrics
  const getNodeStatus = (node) => {
    const isTarget = activeScenario.targetNodes.includes(node.id);
    if (!isTarget) {
      return {
        anomalyScore: 0.02 + ((simTick * 3 + node.x) % 5) * 0.005,
        flowRate: 120 + ((simTick * 7 + node.y) % 30),
        status: 'normal',
        color: '#10b981' // emerald
      };
    }
    return {
      anomalyScore: activeScenario.flowAnomaly,
      flowRate: Math.round(120 * activeScenario.rateMultiplier),
      status: activeScenario.severity,
      color: activeScenario.severity === 'critical' ? '#ef4444' : '#f59e0b'
    };
  };

  // Pseudo-tokens for Semantic Vectorization Visualizer
  const tokens = useMemo(() => {
    const words = customText.split(/\s+/).filter(Boolean);
    return words.slice(0, 16).map((word, i) => ({
      id: i + 1,
      text: word.replace(/[^a-zA-Z0-9]/g, ''),
      tokenDim: Math.floor(Math.random() * 30000)
    }));
  }, [customText]);

  // Synthetic Federated Round Convergence Curve
  const fedConvergenceData = useMemo(() => {
    const rounds = [];
    for (let r = 1; r <= 20; r++) {
      let f1 = 0.82 + (0.16 * (1 - Math.exp(-r / 4)));
      if (byzantineAttackers > 0) {
        if (aggregator === 'fedavg') {
          // Severely degraded under sign flip
          f1 = Math.max(0.42, f1 - (byzantineAttackers === 1 ? 0.38 : 0.54));
        } else if (aggregator === 'fedprox') {
          // Marginally mitigated but still drops under attack
          f1 = Math.max(0.48, f1 - (byzantineAttackers === 1 ? 0.32 : 0.48));
        } else if (aggregator === 'median') {
          // Robust against 1 attacker (20%), somewhat degraded under 2 attackers (40%)
          if (byzantineAttackers === 1) {
            f1 = Math.max(0.92, f1 - 0.015);
          } else {
            f1 = Math.max(0.68, f1 - 0.28);
          }
        } else if (aggregator === 'dp') {
          // DP noise has utility penalty
          f1 = Math.max(0.85, f1 - 0.07);
        }
      }
      rounds.push({
        round: `R${r}`,
        Global_F1: Number(f1.toFixed(4)),
        Target_F1: 0.99
      });
    }
    return rounds;
  }, [aggregator, byzantineAttackers]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-slate-900">
      
      {/* Top Banner & Topic Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-2xl shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>Full End-to-End Simulation Studio</span>
              <span className="text-slate-500">•</span>
              <SimulationBadge />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Semantic Vectorization + Federated Graph Learning
            </h1>
            <p className="text-indigo-200/80 text-sm md:text-base mt-1 font-medium">
              Multi-Modal IoT Anomaly Detection for Distributed Smart Hospital Networks
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur p-2 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={clsx(
                "flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all",
                isPlaying 
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
              )}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
              {isPlaying ? 'Pause Sim' : 'Resume Sim'}
            </button>

            <button
              onClick={() => { setSimTick(t => t + 1); }}
              className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Step Single Simulation Tick"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => { setScenarioKey('normal'); setSimTick(0); }}
              className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Reset Simulation to Baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Control Bar: Attack Scenario & Ward Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">ACTIVE ATTACK SCENARIO</label>
            <select
              value={scenarioKey}
              onChange={(e) => setScenarioKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
            >
              {Object.entries(ATTACK_SCENARIOS).map(([key, s]) => (
                <option key={key} value={key}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">FILTER HOSPITAL WARD</label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
            >
              <option value="All">All Hospital Departments</option>
              <option value="ICU">Intensive Care Unit (ICU)</option>
              <option value="Cardiology">Cardiology & Telemetry</option>
              <option value="Emergency">Emergency & Trauma</option>
              <option value="Surgery">Surgical Operating Room</option>
              <option value="Radiology">Radiology & PACS</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">FL AGGREGATION STRATEGY</label>
            <select
              value={aggregator}
              onChange={(e) => setAggregator(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
            >
              <option value="fedavg">FedAvg (Standard Weighted)</option>
              <option value="fedprox">FedProx (Proximal μ = 0.01)</option>
              <option value="median">Coordinate-wise Median (Byzantine-Resilient)</option>
              <option value="dp">DP-FedAvg (Gaussian Noise σ = 0.1)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">BYZANTINE ADVERSARY NODES</label>
            <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-1 text-slate-300">
              {[0, 1, 2].map(count => (
                <button
                  key={count}
                  onClick={() => setByzantineAttackers(count)}
                  className={clsx(
                    "flex-1 py-1.5 rounded text-xs font-bold transition-colors",
                    byzantineAttackers === count
                      ? (count === 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")
                      : "hover:bg-slate-700"
                  )}
                >
                  {count === 0 ? 'Clean (0)' : `${count} Bad (${count * 20}%)`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for In-Depth Pillars */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto pb-1 text-sm font-semibold">
        {[
          { id: 'overview', label: '1. Integrated Simulation Studio', icon: Activity },
          { id: 'graph', label: '2. Federated IoT Topology & GraphSAGE', icon: Network },
          { id: 'semantic', label: '3. Clinical Semantic Vectorization', icon: FileText },
          { id: 'fusion', label: '4. Multi-Modal Anomaly Detection', icon: Share2 },
          { id: 'federated', label: '5. FL Rounds & Byzantine Defense', icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center px-4 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
                isActive 
                  ? "border-indigo-600 text-indigo-600 bg-white font-bold shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
              )}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTEGRATED SIMULATION STUDIO OVERVIEW                               */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Visual Dual Panel: Hospital Graph & Live Threat Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Hospital IoT Network Topology Graph (SVG Interactive) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-600" />
                    Distributed Hospital IoT Topology Graph
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time network packet flow & edge communication topology. Click any device to inspect flow features.
                  </p>
                </div>
                <span className={clsx(
                  "text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide",
                  activeScenario.severity === 'clean' ? 'bg-emerald-100 text-emerald-800' :
                  activeScenario.severity === 'critical' ? 'bg-rose-100 text-rose-800 animate-pulse' :
                  'bg-amber-100 text-amber-800'
                )}>
                  {activeScenario.name}
                </span>
              </div>

              {/* SVG Topology Canvas */}
              <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex-grow min-h-[420px] flex items-center justify-center p-4">
                {/* SVG Grid Overlay */}
                <svg className="w-full h-full max-h-[460px] select-none" viewBox="0 0 760 480">
                  <defs>
                    <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="edgeNormal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id="edgeAttack" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>

                  {/* Department Zones */}
                  <rect x="50" y="20" width="220" height="260" rx="12" fill="#1e1b4b" fillOpacity="0.2" stroke="#312e81" strokeDasharray="4 4" />
                  <text x="65" y="42" fill="#818cf8" fontSize="11" fontWeight="bold">ICU Ward</text>

                  <rect x="350" y="15" width="180" height="150" rx="12" fill="#042f2e" fillOpacity="0.2" stroke="#115e59" strokeDasharray="4 4" />
                  <text x="365" y="35" fill="#2dd4bf" fontSize="11" fontWeight="bold">Cardiology</text>

                  <rect x="540" y="140" width="190" height="160" rx="12" fill="#3f1412" fillOpacity="0.2" stroke="#7f1d1d" strokeDasharray="4 4" />
                  <text x="555" y="160" fill="#f87171" fontSize="11" fontWeight="bold">Emergency Bay</text>

                  <rect x="230" y="300" width="220" height="150" rx="12" fill="#1e293b" fillOpacity="0.3" stroke="#475569" strokeDasharray="4 4" />
                  <text x="245" y="322" fill="#94a3b8" fontSize="11" fontWeight="bold">Surgical Ward</text>

                  {/* Edges */}
                  {HOSPITAL_EDGES.map((edge, i) => {
                    const fromNode = HOSPITAL_NODES.find(n => n.id === edge.from);
                    const toNode = HOSPITAL_NODES.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const isAttackEdge = activeScenario.targetNodes.includes(fromNode.id) || 
                                         activeScenario.targetNodes.includes(toNode.id);

                    return (
                      <g key={i}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke={isAttackEdge ? "url(#edgeAttack)" : "url(#edgeNormal)"}
                          strokeWidth={isAttackEdge ? "3" : "1.5"}
                          strokeDasharray={isAttackEdge ? "6 3" : "none"}
                        />
                        {/* Animated Flow Particle */}
                        {isPlaying && (
                          <circle
                            r={isAttackEdge ? "4" : "2.5"}
                            fill={isAttackEdge ? "#ef4444" : "#38bdf8"}
                          >
                            <animateMotion
                              path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                              dur={isAttackEdge ? "0.8s" : "2.2s"}
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                      </g>
                    );
                  })}

                  {/* Node Glyphs */}
                  {HOSPITAL_NODES.map((node) => {
                    const isSelected = selectedNode.id === node.id;
                    const status = getNodeStatus(node);
                    const isFiltered = selectedWard !== 'All' && node.ward !== selectedWard && node.role !== 'core';

                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer transition-transform duration-200"
                        style={{ opacity: isFiltered ? 0.25 : 1 }}
                      >
                        {/* Selection Outer Ring */}
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={node.role === 'hub' ? "24" : node.role === 'core' ? "28" : "18"}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2.5"
                            strokeDasharray="4 2"
                            className="animate-spin"
                          />
                        )}

                        {/* Node Body */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.role === 'hub' ? "18" : node.role === 'core' ? "22" : "12"}
                          fill={node.role === 'core' ? '#4f46e5' : node.role === 'hub' ? '#1e293b' : '#0f172a'}
                          stroke={status.color}
                          strokeWidth={status.status === 'normal' ? "2" : "3"}
                        />

                        {/* Node Label Text */}
                        <text
                          x={node.x}
                          y={node.y + (node.role === 'hub' ? 30 : 24)}
                          fill={isSelected ? "#ffffff" : "#cbd5e1"}
                          fontSize="9.5"
                          fontWeight={isSelected ? "bold" : "medium"}
                          textAnchor="middle"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Live Floating Status Legend */}
                <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-3">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />Normal Flow</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />Attack Traffic</span>
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5" />Core Server</span>
                </div>
              </div>
            </div>

            {/* Right Column: Node Inspector & Threat Assessment Gauge */}
            <div className="space-y-6">
              
              {/* Selected Node Inspector Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {selectedNode.ward} Ward
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{selectedNode.label}</h4>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedNode.id} • IP: {selectedNode.ip}</p>
                  </div>
                  <div className={clsx(
                    "w-3 h-3 rounded-full mt-1",
                    getNodeStatus(selectedNode).status === 'normal' ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
                  )} />
                </div>

                <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Flow Anomaly Score:</span>
                    <span className={clsx(
                      "font-mono font-bold",
                      getNodeStatus(selectedNode).anomalyScore > 0.5 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {(getNodeStatus(selectedNode).anomalyScore * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Flow Packet Rate:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {getNodeStatus(selectedNode).flowRate} pkts/sec
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Edge Attributes Extracted:</span>
                    <span className="font-mono text-slate-700 font-bold">31 Normalized Features</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">GraphSAGE 2-Hop Degree:</span>
                    <span className="font-mono text-slate-700">
                      {HOSPITAL_EDGES.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).length} Connected Links
                    </span>
                  </div>
                </div>

                {/* Quick Action Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (activeScenario.targetNodes.includes(selectedNode.id)) {
                        setScenarioKey('normal');
                      } else {
                        setScenarioKey('ddos');
                      }
                    }}
                    className={clsx(
                      "w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5",
                      activeScenario.targetNodes.includes(selectedNode.id)
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                    )}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {activeScenario.targetNodes.includes(selectedNode.id) ? 'Clear Threat from Node' : 'Simulate Threat Against This Node'}
                  </button>
                </div>
              </div>

              {/* Multi-Modal Threat Gauge Card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multi-Modal Risk Index</span>
                  <Shield className={clsx("w-4 h-4", activeScenario.severity === 'clean' ? 'text-emerald-400' : 'text-rose-400')} />
                </div>

                <div className="text-center py-2">
                  <div className={clsx(
                    "text-4xl font-extrabold tracking-tight font-mono",
                    activeScenario.severity === 'clean' ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {(activeScenario.flowAnomaly * 100).toFixed(1)}%
                  </div>
                  <span className="text-xs text-slate-400 uppercase font-semibold mt-1 inline-block">
                    Classification: {activeScenario.severity === 'clean' ? 'NORMAL OPERATION' : activeScenario.attackType}
                  </span>
                </div>

                {/* Modality Attribution Split */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>IoT Graph Flow (GraphSAGE)</span>
                    <span className="font-mono text-indigo-300 font-bold">92% Weight</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                    <div className="bg-indigo-500 h-full" style={{ width: '92%' }} />
                    <div className="bg-emerald-400 h-full" style={{ width: '8%' }} />
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Clinical Semantics (BioBERT)</span>
                    <span className="font-mono text-emerald-400 font-bold">8% Contextual</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-4 leading-relaxed border-t border-slate-800 pt-3 italic">
                  *Grounded on Phase 6.2 finding: High-speed IoT network flow attributes dominate anomaly verdict; clinical semantics provide contextual correlation without PHI transmission.
                </p>
              </div>

            </div>
          </div>

          {/* Live Hospital Telemetry & Alert Stream */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Live Security Operations Center (SOC) Alert Stream
              </h3>
              <span className="text-xs text-slate-400 font-mono">Ticking: {simTick} cycles</span>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="text-slate-400 italic py-4 text-center">Monitoring hospital IoT telemetry stream...</div>
              ) : (
                alerts.map(alert => (
                  <div 
                    key={alert.id}
                    className={clsx(
                      "p-2.5 rounded-lg border flex items-center justify-between transition-colors",
                      alert.level === 'CRITICAL' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                      alert.level === 'WARNING' || alert.level === 'ELEVATED' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                      'bg-slate-50 border-slate-200 text-slate-800'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        alert.level === 'CRITICAL' ? 'bg-rose-600 text-white' :
                        alert.level === 'WARNING' || alert.level === 'ELEVATED' ? 'bg-amber-500 text-slate-900' :
                        'bg-slate-300 text-slate-700'
                      )}>
                        {alert.level}
                      </span>
                      <span className="text-slate-400 text-[11px]">{alert.time}</span>
                      <span className="font-semibold">{alert.ward} • {alert.device}:</span>
                      <span className="text-slate-700">{alert.msg}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FEDERATED IOT TOPOLOGY & GRAPHSAGE DEEP DIVE                        */}
      {/* ========================================================================= */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">GraphSAGE IoT Topological Representation</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Medical IoT communications within each hospital ward form a dynamic graph. GraphSAGE aggregates features 
              from 1-hop and 2-hop topological neighbors without centralizing private network packet payloads.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { stage: 'Stage 1', name: 'Raw Packet Capture', desc: 'Edge-IIoTset network flow headers extracted from device NICs.' },
                { stage: 'Stage 2', name: 'Temporal Slicing', desc: 'Flows grouped into 10-second discrete aggregation windows.' },
                { stage: 'Stage 3', name: '31 Flow Features', desc: 'Normalized attributes: Pkts/s, byte volume, TCP flags, inter-arrival time.' },
                { stage: 'Stage 4', name: 'GraphSAGE Embedding', desc: '2-hop neighborhood message passing producing 128-D node representation.' }
              ].map((s, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">{s.stage}</span>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{s.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Interactive 31 Features Radar Breakdown */}
            <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Selected Device Feature Snapshot: {selectedNode.label} ({selectedNode.id})
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                {[
                  { name: 'Flow Duration', val: '0.412s', norm: '0.04' },
                  { name: 'Tot Fwd Pkts', val: '128', norm: '0.12' },
                  { name: 'Tot Bwd Pkts', val: '94', norm: '0.09' },
                  { name: 'Pkt Len Mean', val: '542 B', norm: '0.36' },
                  { name: 'TCP SYN Flag', val: activeScenario.severity === 'critical' ? '1 (High)' : '0 (Low)', norm: activeScenario.severity === 'critical' ? '1.0' : '0.0' },
                  { name: 'Flow Bytes/s', val: activeScenario.severity === 'critical' ? '920 KB/s' : '45 KB/s', norm: activeScenario.severity === 'critical' ? '0.94' : '0.05' }
                ].map((f, i) => (
                  <div key={i} className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">{f.name}</span>
                    <span className="font-bold text-white block mt-0.5 font-mono">{f.val}</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Norm: {f.norm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLINICAL SEMANTIC VECTORIZATION PIPELINE                            */}
      {/* ========================================================================= */}
      {activeTab === 'semantic' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Clinical Semantic Vectorization Studio</h3>
                <p className="text-slate-500 text-sm mt-1">
                  MTSamples clinical-text proxy encoded via Bio_ClinicalBERT to yield 768-D contextual embeddings, projected down to 128-D client vectors.
                </p>
              </div>
              <VerifiedBadge />
            </div>

            {/* Presets Selection */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">SELECT SAMPLE CLINICAL OBSERVATION NOTE</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CLINICAL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPresetId(p.id); setCustomText(p.text); }}
                    className={clsx(
                      "text-left p-3.5 rounded-xl border text-xs transition-all",
                      selectedPresetId === p.id 
                        ? "bg-indigo-50 border-indigo-400 text-indigo-950 shadow-sm ring-1 ring-indigo-400"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <span className="font-bold block mb-1 text-slate-900">{p.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-2">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Text Area */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">CUSTOM SYNTHETIC CLINICAL TEXT INPUT</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 font-sans"
                placeholder="Type synthetic clinical telemetry note..."
              />
              <p className="text-[11px] text-slate-400 mt-1 italic">
                *Privacy Guarantee: In accordance with our data locality principles, raw text is processed solely inside the local hospital edge client. Only numerical representations or gradient updates are shared.
              </p>
            </div>

            {/* Pipeline Stage Visualizer */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Transformer Vectorization Pipeline</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Subword Tokenizer */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-indigo-600 block mb-2">STEP 1: SUBWORD TOKENIZATION</span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {tokens.map(t => (
                      <span key={t.id} className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-mono">
                        {t.text}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-3 block">Extracted {tokens.length} subword tokens with vocabulary IDs.</span>
                </div>

                {/* 2. Bio_ClinicalBERT 768-D Vector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-600 block mb-2">STEP 2: BIO_CLINICALBERT ENCODER</span>
                  <div className="grid grid-cols-8 gap-1 p-2 bg-slate-900 rounded-lg">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="h-3 rounded-xs"
                        style={{ backgroundColor: `hsl(${210 + (i * 7) % 80}, 80%, ${30 + (i * 11) % 50}%)` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 mt-2 block">768-D Dense Hidden State Tensor</span>
                  <span className="text-[10px] text-slate-400 block">Extracts semantic clinical context across 12 attention heads.</span>
                </div>

                {/* 3. 128-D Projection Layer */}
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-purple-600 block mb-2">STEP 3: LINEAR PROJECTION</span>
                  <div className="h-10 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-center font-mono text-xs font-bold text-purple-900">
                    [ 768-D → 128-D Client Rep ]
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 mt-2 block">Ready for Multi-Modal Fusion</span>
                  <span className="text-[10px] text-slate-400 block">Reduces communication footprint for federated transmission.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MULTI-MODAL ANOMALY DETECTION & FUSION ARCHITECTURE                 */}
      {/* ========================================================================= */}
      {activeTab === 'fusion' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Modal Fusion Architecture</h3>
            <p className="text-slate-500 text-sm mb-6">
              Synthesizing GraphSAGE topological network flow representations with Bio_ClinicalBERT contextual semantics.
            </p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setFusionMode('early')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                  fusionMode === 'early' ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Early Fusion (Concatenation + MLP)
              </button>
              <button
                onClick={() => setFusionMode('late')}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                  fusionMode === 'late' ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Late Fusion (Decision Ensemble)
              </button>
            </div>

            {/* Architecture Diagram */}
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-around gap-6 text-center">
              <div className="p-4 bg-white rounded-xl border border-slate-200 w-48 shadow-xs">
                <Network className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <span className="font-bold text-xs block text-slate-800">Modality A: IoT Graph</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">GraphSAGE (128-D)</span>
              </div>

              <div className="text-slate-400 font-bold text-lg">+</div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 w-48 shadow-xs">
                <FileText className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span className="font-bold text-xs block text-slate-800">Modality B: Clinical Text</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">BioBERT (128-D)</span>
              </div>

              <div className="text-slate-400 font-bold text-lg">→</div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 w-56 shadow-xs">
                <Share2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <span className="font-bold text-xs block text-purple-950">
                  {fusionMode === 'early' ? 'Joint 256-D Concatenation' : 'Weighted Ensemble Head'}
                </span>
                <span className="text-[10px] font-mono text-purple-700 mt-1 block">MLP Classifier</span>
              </div>
            </div>

            {/* Scientific Rigor Explanation */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              <strong>Phase 6.2 Evaluation Result:</strong> In controlled empirical tests on Edge-IIoTset packet telemetry, 
              adding clinical semantic embeddings achieved an F1 of <strong>0.9926</strong>, matching the EdgeMLP baseline. 
              Because network flow headers already contain high-fidelity distinguishing indicators, clinical text provides 
              critical clinical context and authorization cross-verification without inflating packet-level detection statistics.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FEDERATED LEARNING ROUNDS & BYZANTINE DEFENSE                       */}
      {/* ========================================================================= */}
      {activeTab === 'federated' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Federated Aggregation & Byzantine Stress-Testing</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Evaluating distributed convergence across 5 hospital edge wards under non-IID client drift and adversarial sign-flip attacks.
                </p>
              </div>
              <VerifiedBadge />
            </div>

            {/* 5 Hospital Clients Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                { id: 'C1', ward: 'ICU Ward', status: 'Clean Client', nonIID: 'High', samples: '14,200' },
                { id: 'C2', ward: 'Cardiology', status: 'Clean Client', nonIID: 'Moderate', samples: '11,800' },
                { id: 'C3', ward: 'Emergency', status: byzantineAttackers >= 1 ? 'Adversary (Sign-Flip)' : 'Clean Client', nonIID: 'High', samples: '16,500' },
                { id: 'C4', ward: 'Surgery', status: byzantineAttackers >= 2 ? 'Adversary (Sign-Flip)' : 'Clean Client', nonIID: 'Low', samples: '8,400' },
                { id: 'C5', ward: 'Radiology', status: 'Clean Client', nonIID: 'Moderate', samples: '9,900' }
              ].map((c) => {
                const isByzantine = c.status.includes('Adversary');
                return (
                  <div 
                    key={c.id} 
                    className={clsx(
                      "p-3.5 rounded-xl border text-xs transition-colors",
                      isByzantine ? "bg-rose-50 border-rose-300 text-rose-950" : "bg-slate-50 border-slate-200 text-slate-800"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-bold text-indigo-700">{c.id}</span>
                      <span className={clsx(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        isByzantine ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                      )}>
                        {isByzantine ? 'Byzantine' : 'Legitimate'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-800 block">{c.ward}</span>
                    <span className="text-[11px] text-slate-500 block mt-1">Samples: {c.samples}</span>
                    <span className="text-[11px] text-slate-500 block">Non-IID: {c.nonIID}</span>
                  </div>
                );
              })}
            </div>

            {/* Convergence Chart Comparison */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-white">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Global F1 Convergence Across 20 Federated Communication Rounds
                </h4>
                <span className="text-xs font-mono text-indigo-300">
                  Aggregator: {aggregator.toUpperCase()} • Adversaries: {byzantineAttackers}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fedConvergenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[0.3, 1.0]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Global_F1" stroke="#818cf8" strokeWidth={2.5} name="Simulated Global F1" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Target_F1" stroke="#34d399" strokeDasharray="5 5" name="Clean Target Benchmark" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                <span>
                  {aggregator === 'median' && byzantineAttackers === 1 && "Coordinate-wise Median successfully rejects the minority sign-flip outlier, preserving global convergence."}
                  {aggregator === 'median' && byzantineAttackers === 2 && "Coordinate-wise Median suffers degradation when Byzantine adversaries approach a 40% near-majority."}
                  {aggregator === 'fedavg' && byzantineAttackers > 0 && "Standard FedAvg is heavily vulnerable to poisoned gradients, causing severe global model degradation."}
                  {byzantineAttackers === 0 && "Clean federated rounds converge smoothly toward the verified 0.9926 benchmark."}
                </span>
                <span className="font-mono text-indigo-400 font-bold shrink-0 ml-4">
                  Final F1: {fedConvergenceData[fedConvergenceData.length - 1]?.Global_F1}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
