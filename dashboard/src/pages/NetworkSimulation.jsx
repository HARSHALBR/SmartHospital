// Compliant with package.json architecture
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldAlert, ShieldCheck, Lock, Unlock, Play, Square, 
  RotateCcw, Send, AlertTriangle, CheckCircle2, Server, 
  Building2, Radio, Info, Eye, Zap, RefreshCw, X, Search,
  ArrowRight, Activity, Terminal
} from 'lucide-react';
import { 
  HOSPITAL_NODES, 
  SERVER_NODE, 
  DEFAULT_DETECTOR_RULES, 
  classifyPacket, 
  encryptPayload, 
  decryptAndVerifyPayload,
  createPacket 
} from '../services/networkDetector';

// 6 Discrete Lifecycle Stages
const LIFECYCLE_STAGES = [
  { key: 'CREATED', label: '1. CREATED', desc: 'Telemetry Packaged' },
  { key: 'ENCRYPTED', label: '2. ENCRYPTED', desc: 'AES-GCM (96b Nonce)' },
  { key: 'IN_TRANSIT', label: '3. IN TRANSIT', desc: 'Conduit Traversal' },
  { key: 'RECEIVED', label: '4. RECEIVED', desc: 'Gateway Auth' },
  { key: 'INSPECTING', label: '5. INSPECTING', desc: 'Rule Engine DPI' },
  { key: 'CLASSIFIED', label: '6. VERDICT', desc: 'Decision Rendered' },
];

export default function NetworkSimulation() {
  // Selected hospital for normal traffic
  const [selectedHospitalId, setSelectedHospitalId] = useState('hosp-a');

  // Active in-transit packets
  const [activePackets, setActivePackets] = useState([]);

  // Active lifecycle pipeline stage ('IDLE', 'CREATED', 'ENCRYPTED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'CLASSIFIED')
  const [pipelineStage, setPipelineStage] = useState('IDLE');
  const [pipelineVerdict, setPipelineVerdict] = useState(null); // 'NORMAL' or 'ANOMALY'

  // Debounce lock to prevent rapid-click state corruption
  const [isDispatching, setIsDispatching] = useState(false);

  // Live simulation metrics
  const [metrics, setMetrics] = useState({
    totalSent: 0,
    normalVerified: 0,
    anomaliesDetected: 0,
  });

  // Active anomaly alert state
  const [activeAlert, setActiveAlert] = useState(null);

  // Recent security event log
  const [eventLogs, setEventLogs] = useState([]);

  // Auto-traffic generation status
  const [isAutoTrafficActive, setIsAutoTrafficActive] = useState(false);

  // Hospital node operational statuses (e.g. QUARANTINED when anomaly detected)
  const [hospitalStatuses, setHospitalStatuses] = useState({
    'hosp-a': 'ONLINE',
    'hosp-b': 'ONLINE',
    'hosp-c': 'ONLINE',
    'hosp-d': 'ONLINE',
  });

  // Recent connection glow colors per hospital ('idle', 'normal', 'anomaly')
  const [connectionStates, setConnectionStates] = useState({
    'hosp-a': 'idle',
    'hosp-b': 'idle',
    'hosp-c': 'idle',
    'hosp-d': 'idle',
  });

  // Server state ('LISTENING', 'INSPECTING', 'NORMAL_PULSE', 'ANOMALY_PULSE')
  const [serverState, setServerState] = useState('LISTENING');

  // Animation and timeout refs for clean cancellation on reset
  const animFrameRef = useRef(null);
  const autoTrafficTimerRef = useRef(null);
  const inspectionTimerRef = useRef(null);
  const activePacketsRef = useRef([]);

  // Keep ref synchronized with state for cancellation safety
  activePacketsRef.current = activePackets;

  // Node coordinate lookup map
  const nodeCoords = {
    ...HOSPITAL_NODES.reduce((acc, h) => {
      acc[h.id] = { x: h.x, y: h.y };
      return acc;
    }, {}),
    [SERVER_NODE.id]: { x: SERVER_NODE.x, y: SERVER_NODE.y }
  };

  /**
   * Unified Packet Dispatcher
   * Executes the exact visible sequence:
   * PACKET CREATED -> ENCRYPTED -> IN TRANSIT -> RECEIVED -> INSPECTING -> CLASSIFIED
   */
  const dispatchPacket = useCallback(async ({ sourceId, isAnomaly, customRate, customSize }) => {
    if (isDispatching) return; // Prevent concurrent re-entry collisions
    setIsDispatching(true);

    // STAGE 1: PACKET CREATED
    setPipelineStage('CREATED');
    setPipelineVerdict(null);
    const rawPacket = createPacket({ sourceId, isAnomaly, customRate, customSize });

    // Brief visual pause for stage 1
    await new Promise(r => setTimeout(r, 120));

    // STAGE 2: ENCRYPTED (AES-GCM with fresh unique 96-bit nonce)
    setPipelineStage('ENCRYPTED');
    const encryptionInfo = await encryptPayload(rawPacket.plaintext);

    await new Promise(r => setTimeout(r, 120));

    // STAGE 3: IN TRANSIT
    setPipelineStage('IN_TRANSIT');
    const packet = {
      ...rawPacket,
      encryption: encryptionInfo,
      startTime: performance.now(),
      duration: 1600, // 1.6s smooth transit time for optimal presentation visibility
      progress: 0.0,
      state: 'IN_TRANSIT',
    };

    // Highlight connecting line
    setConnectionStates(prev => ({
      ...prev,
      [sourceId]: isAnomaly ? 'anomaly' : 'normal'
    }));

    // Increment dispatched counter
    setMetrics(prev => ({
      ...prev,
      totalSent: prev.totalSent + 1
    }));

    // Enqueue packet
    setActivePackets([packet]);
  }, [isDispatching]);

  /**
   * Process arrival of packet at Central Server
   */
  const handlePacketArrival = useCallback(async (packet) => {
    // STAGE 4: RECEIVED AT GATEWAY (Authenticated Decryption)
    setPipelineStage('RECEIVED');
    setServerState('INSPECTING');

    const authResult = await decryptAndVerifyPayload(packet.encryption);

    // STAGE 5: INSPECTING (Deep Packet Inspection via Rule Engine)
    setPipelineStage('INSPECTING');

    // Allow 400ms inspection scanning animation at the server
    inspectionTimerRef.current = setTimeout(() => {
      // Step 6: CLASSIFIED
      const classification = classifyPacket(packet, DEFAULT_DETECTOR_RULES);
      setPipelineStage('CLASSIFIED');

      if (classification.isAnomaly) {
        setPipelineVerdict('ANOMALY');
        setServerState('ANOMALY_PULSE');

        // Increment anomaly metric
        setMetrics(prev => ({
          ...prev,
          anomaliesDetected: prev.anomaliesDetected + 1
        }));

        // Trigger prominent red alert banner
        setActiveAlert({
          eventId: classification.eventId,
          sourceName: packet.sourceName,
          sourceIp: packet.sourceIp,
          sourceId: packet.sourceId,
          destinationName: packet.destinationName,
          reason: classification.reason,
          severity: classification.severity,
          ruleTriggered: classification.ruleTriggered,
          actionTaken: classification.actionTaken,
          trafficRate: packet.trafficRate,
          payloadSize: packet.payloadSize,
          thresholdRate: DEFAULT_DETECTOR_RULES.maxRateThreshold,
          thresholdSize: DEFAULT_DETECTOR_RULES.maxPayloadSize,
          timestamp: classification.auditedAt,
          authStatus: authResult.authenticated ? 'Authenticated AES-GCM (Nonce Validated)' : 'Ciphertext Corrupted',
        });

        // Quarantine source hospital connection
        setHospitalStatuses(prev => ({
          ...prev,
          [packet.sourceId]: 'QUARANTINED'
        }));

        setConnectionStates(prev => ({
          ...prev,
          [packet.sourceId]: 'anomaly'
        }));
      } else {
        setPipelineVerdict('NORMAL');
        setServerState('NORMAL_PULSE');

        // Increment normal metric
        setMetrics(prev => ({
          ...prev,
          normalVerified: prev.normalVerified + 1
        }));

        // Reset connection conduit if not quarantined
        setTimeout(() => {
          setConnectionStates(prev => {
            if (hospitalStatuses[packet.sourceId] === 'QUARANTINED') return prev;
            return { ...prev, [packet.sourceId]: 'idle' };
          });
        }, 800);
      }

      // Append to security event log
      setEventLogs(prev => [
        {
          id: packet.id,
          eventId: classification.eventId,
          timestamp: classification.auditedAt,
          source: packet.sourceName,
          destination: packet.destinationName,
          trafficRate: `${packet.trafficRate.toFixed(1)} pkt/s`,
          payloadSize: `${packet.payloadSize} B`,
          encryption: `${packet.encryption.algorithm} (${packet.encryption.ivShort || '96b'})`,
          classification: classification.classification,
          severity: classification.severity,
          isAnomaly: classification.isAnomaly,
          ruleTriggered: classification.ruleTriggered,
          reason: classification.reason,
        },
        ...prev.slice(0, 19)
      ]);

      // Release dispatch lock
      setIsDispatching(false);

      // Return server to LISTENING after pulse
      setTimeout(() => {
        setServerState('LISTENING');
      }, 900);
    }, 450);
  }, [hospitalStatuses]);

  /**
   * Main requestAnimationFrame Animation Loop
   */
  useEffect(() => {
    let isCancelled = false;

    const animateLoop = (now) => {
      if (isCancelled) return;

      setActivePackets(prevPackets => {
        if (prevPackets.length === 0) return prevPackets;

        const stillInTransit = [];

        for (const pkt of prevPackets) {
          const elapsed = now - pkt.startTime;
          const currentProgress = Math.min(1.0, elapsed / pkt.duration);

          if (currentProgress >= 1.0) {
            handlePacketArrival(pkt);
          } else {
            stillInTransit.push({
              ...pkt,
              progress: currentProgress
            });
          }
        }

        return stillInTransit;
      });

      animFrameRef.current = requestAnimationFrame(animateLoop);
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [handlePacketArrival]);

  /**
   * Auto-Traffic Generator (Sends normal packets every 2.4s)
   */
  useEffect(() => {
    if (isAutoTrafficActive) {
      autoTrafficTimerRef.current = setInterval(() => {
        if (isDispatching) return;
        const candidates = HOSPITAL_NODES.filter(h => hospitalStatuses[h.id] !== 'QUARANTINED');
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          dispatchPacket({ sourceId: pick.id, isAnomaly: false });
        }
      }, 2600);
    } else {
      if (autoTrafficTimerRef.current) {
        clearInterval(autoTrafficTimerRef.current);
      }
    }

    return () => {
      if (autoTrafficTimerRef.current) {
        clearInterval(autoTrafficTimerRef.current);
      }
    };
  }, [isAutoTrafficActive, hospitalStatuses, isDispatching, dispatchPacket]);

  /**
   * Reset simulation state back to clean baseline
   * Cancels in-flight timers, frames, and restores all parameters.
   */
  const handleResetSimulation = () => {
    setIsAutoTrafficActive(false);
    setIsDispatching(false);

    if (autoTrafficTimerRef.current) {
      clearInterval(autoTrafficTimerRef.current);
      autoTrafficTimerRef.current = null;
    }
    if (inspectionTimerRef.current) {
      clearTimeout(inspectionTimerRef.current);
      inspectionTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    setActivePackets([]);
    setActiveAlert(null);
    setPipelineStage('IDLE');
    setPipelineVerdict(null);
    setServerState('LISTENING');

    setMetrics({
      totalSent: 0,
      normalVerified: 0,
      anomaliesDetected: 0,
    });

    setHospitalStatuses({
      'hosp-a': 'ONLINE',
      'hosp-b': 'ONLINE',
      'hosp-c': 'ONLINE',
      'hosp-d': 'ONLINE',
    });

    setConnectionStates({
      'hosp-a': 'idle',
      'hosp-b': 'idle',
      'hosp-c': 'idle',
      'hosp-d': 'idle',
    });

    setEventLogs([]);
  };

  return (
    <div className="space-y-5 pb-12 font-sans max-w-6xl mx-auto">
      {/* Top Header & Context Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Security Ops Simulation
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Rule-Based Inspection (DPI)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Web Crypto AES-GCM (256b)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-indigo-400 animate-pulse shrink-0" />
              Smart Hospital Network Telemetry & Anomaly Simulation
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time demonstration of distributed IoT/clinical telemetry flowing from 4 hospital edge nodes to the Central Aggregation Gateway. 
              Tests authenticated AES-GCM transport, deep rule inspection, anomaly detection, and automated uplink quarantine.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetSimulation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs"
              title="Reset all counters, alerts, and connections to clean baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
              Reset Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Metric Counters Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Packets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Packets Dispatched</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {metrics.totalSent}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total simulated telemetry transmissions
          </div>
        </div>

        {/* Normal Packets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Normal Packets</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {metrics.normalVerified}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80 font-medium">
            Within baseline thresholds (&lt; 5.0 pkt/s)
          </div>
        </div>

        {/* Anomalies Detected */}
        <div className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between transition-colors ${
          metrics.anomaliesDetected > 0 
            ? 'bg-rose-950/40 border-rose-600/60 text-rose-200' 
            : 'bg-slate-900/90 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={metrics.anomaliesDetected > 0 ? 'text-rose-300 font-bold' : 'text-slate-400'}>
              Anomalies Detected
            </span>
            <AlertTriangle className={`w-4 h-4 ${metrics.anomaliesDetected > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
          </div>
          <div className={`mt-2 text-2xl font-black font-mono ${metrics.anomaliesDetected > 0 ? 'text-rose-400' : 'text-white'}`}>
            {metrics.anomaliesDetected}
          </div>
          <div className={`mt-1 text-[11px] ${metrics.anomaliesDetected > 0 ? 'text-rose-300 font-bold' : 'text-slate-500'}`}>
            {metrics.anomaliesDetected > 0 ? 'Threat flagged by rule detector' : 'Zero violations active'}
          </div>
        </div>

        {/* Node Connectivity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Hospital Topology</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono flex items-center gap-2">
            <span>4 / 4</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              Object.values(hospitalStatuses).includes('QUARANTINED')
                ? 'bg-rose-500 animate-ping'
                : 'bg-emerald-500 animate-pulse'
            }`}></span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {Object.values(hospitalStatuses).includes('QUARANTINED')
              ? '1 Node In Quarantine'
              : 'All Uplinks Secure'}
          </div>
        </div>
      </div>

      {/* Prominent High-Visibility Anomaly Alert Banner */}
      {activeAlert && (
        <div className="bg-rose-950/95 border-2 border-rose-500 rounded-xl p-4 text-white shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-600/25 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-lg shadow-md shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base font-black tracking-wide text-white">
                    ⚠️ ANOMALY DETECTED — SECURITY POLICY VIOLATION
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-800 border border-rose-400 rounded text-rose-100">
                    {activeAlert.eventId}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-700 text-white rounded uppercase tracking-wider">
                    SEVERITY: {activeAlert.severity}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                    {activeAlert.authStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div className="bg-rose-900/50 border border-rose-700/60 rounded p-2">
                    <span className="text-rose-300 font-semibold block text-[10px] uppercase">Threat Source</span>
                    <span className="font-bold text-white">{activeAlert.sourceName}</span>
                    <span className="text-[10px] text-rose-300 block font-mono">{activeAlert.sourceIp} &rarr; 10.0.0.1</span>
                  </div>
                  <div className="bg-rose-900/50 border border-rose-700/60 rounded p-2">
                    <span className="text-rose-300 font-semibold block text-[10px] uppercase">Detection Reason</span>
                    <span className="font-bold text-white leading-snug">{activeAlert.reason}</span>
                  </div>
                  <div className="bg-rose-900/50 border border-rose-700/60 rounded p-2">
                    <span className="text-rose-300 font-semibold block text-[10px] uppercase">Observed vs Threshold</span>
                    <span className="font-bold text-white font-mono block">Rate: {activeAlert.trafficRate.toFixed(1)} / {activeAlert.thresholdRate.toFixed(1)} pkt/s</span>
                    <span className="font-mono text-[10px] text-rose-200">Buffer: {activeAlert.payloadSize} / {activeAlert.thresholdSize} B</span>
                  </div>
                  <div className="bg-rose-900/50 border border-rose-700/60 rounded p-2">
                    <span className="text-rose-300 font-semibold block text-[10px] uppercase">Remediation Action</span>
                    <span className="font-bold text-white text-[11px] block">{activeAlert.actionTaken}</span>
                    <span className="text-[10px] text-amber-300 font-medium">Uplink Isolated</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveAlert(null)}
              className="p-1 rounded bg-rose-800/80 hover:bg-rose-700 text-rose-200 hover:text-white transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Controls & Triggers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Controls: Source selection and packet triggers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Source Hospital Selector */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Source:
              </span>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                disabled={isDispatching}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer disabled:opacity-50"
              >
                {HOSPITAL_NODES.map((h) => (
                  <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                    {h.name} {h.id === 'hosp-c' ? '(Demo Target)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Send Normal Packet Button */}
            <button
              onClick={() => dispatchPacket({ sourceId: selectedHospitalId, isAnomaly: false })}
              disabled={isDispatching}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-emerald-950/40 border border-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              Send Normal Packet
            </button>

            {/* Inject Demo Anomaly Button (Targeted from Hospital C) */}
            <button
              onClick={() => dispatchPacket({ sourceId: 'hosp-c', isAnomaly: true })}
              disabled={isDispatching}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black rounded-lg transition-all shadow-md shadow-rose-950/40 border border-rose-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Inject Demo Anomaly (Hospital C)
            </button>
          </div>

          {/* Right Controls: Automatic traffic toggle and configured threshold indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoTrafficActive(!isAutoTrafficActive)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                isAutoTrafficActive
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {isAutoTrafficActive ? (
                <>
                  <Square className="w-3.5 h-3.5 text-amber-300" />
                  Stop Auto-Traffic
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  Auto-Traffic (2.6s)
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Rule Engine Threshold:</span>
              <span className="font-mono text-indigo-300">&gt; 5.0 pkt/s</span>
            </div>
          </div>
        </div>

        {/* Visible 6-Step Packet Lifecycle Pipeline Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Live Transmission & Inspection Pipeline</span>
            <span className="font-mono text-slate-500">
              Status: <span className="text-indigo-300 font-bold">{pipelineStage}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {LIFECYCLE_STAGES.map((stg) => {
              const isActive = pipelineStage === stg.key;
              const isPast = (
                (pipelineStage === 'ENCRYPTED' && stg.key === 'CREATED') ||
                (pipelineStage === 'IN_TRANSIT' && ['CREATED', 'ENCRYPTED'].includes(stg.key)) ||
                (pipelineStage === 'RECEIVED' && ['CREATED', 'ENCRYPTED', 'IN_TRANSIT'].includes(stg.key)) ||
                (pipelineStage === 'INSPECTING' && ['CREATED', 'ENCRYPTED', 'IN_TRANSIT', 'RECEIVED'].includes(stg.key)) ||
                (pipelineStage === 'CLASSIFIED' && stg.key !== 'CLASSIFIED')
              );

              let badgeStyle = 'bg-slate-950/70 border-slate-800 text-slate-500';

              if (isActive) {
                if (stg.key === 'CLASSIFIED') {
                  badgeStyle = pipelineVerdict === 'ANOMALY' 
                    ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse'
                    : 'bg-emerald-950 border-emerald-500 text-emerald-200 animate-pulse';
                } else if (stg.key === 'INSPECTING') {
                  badgeStyle = 'bg-amber-950/80 border-amber-500 text-amber-200 animate-pulse';
                } else {
                  badgeStyle = 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-md';
                }
              } else if (isPast) {
                badgeStyle = 'bg-slate-900 border-slate-700 text-slate-300';
              }

              return (
                <div
                  key={stg.key}
                  className={`border rounded-lg px-2.5 py-1.5 transition-all text-left flex flex-col justify-between ${badgeStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      {stg.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                    {stg.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Network Topology Visualization Canvas (SVG) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl relative overflow-hidden">
        {/* Cyber Grid Watermark */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>

        {/* Canvas Status Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 relative z-10 px-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Active Star Topology View
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-[11px] text-slate-400">Authenticated Transport Conduits</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Normal Packet</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Anomaly</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400 inline" />
              <span>AES-GCM (96b Nonce)</span>
            </div>
          </div>
        </div>

        {/* SVG Network Viewport */}
        <div className="w-full aspect-[800/490] max-h-[490px] relative">
          <svg
            viewBox="0 0 800 490"
            className="w-full h-full select-none"
          >
            <defs>
              {/* Radial Glows */}
              <radialGradient id="serverGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="serverGlowAnomaly" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="serverGlowInspecting" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hospitalGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hospitalGlowQuarantine" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </radialGradient>

              {/* Glowing Drop Shadows for In-Flight Packets */}
              <filter id="glowGreen" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Star Network Channels connecting Hospitals to Central Server */}
            {HOSPITAL_NODES.map((h) => {
              const state = connectionStates[h.id];
              const isQuarantined = hospitalStatuses[h.id] === 'QUARANTINED';
              let strokeColor = '#334155';
              let strokeWidth = '2';
              let strokeDash = '4 4';

              if (state === 'anomaly' || isQuarantined) {
                strokeColor = '#f43f5e';
                strokeWidth = '3.5';
                strokeDash = '6 3';
              } else if (state === 'normal') {
                strokeColor = '#10b981';
                strokeWidth = '3';
                strokeDash = 'none';
              }

              return (
                <g key={`edge-${h.id}`}>
                  {/* Subtle edge conduit backdrop */}
                  <line
                    x1={h.x}
                    y1={h.y}
                    x2={SERVER_NODE.x}
                    y2={SERVER_NODE.y}
                    stroke="#1e293b"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Active conduit line */}
                  <line
                    x1={h.x}
                    y1={h.y}
                    x2={SERVER_NODE.x}
                    y2={SERVER_NODE.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    className={state !== 'idle' ? 'animate-pulse' : ''}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Central Server Node */}
            <g transform={`translate(${SERVER_NODE.x}, ${SERVER_NODE.y})`}>
              {/* Pulsing server aura */}
              <circle
                r={serverState === 'ANOMALY_PULSE' ? 68 : serverState === 'INSPECTING' ? 62 : 54}
                fill={
                  serverState === 'ANOMALY_PULSE' 
                    ? 'url(#serverGlowAnomaly)' 
                    : serverState === 'INSPECTING'
                      ? 'url(#serverGlowInspecting)'
                      : 'url(#serverGlow)'
                }
                className={serverState !== 'LISTENING' ? 'animate-ping' : ''}
              />

              {/* Inspection Scanner Ring Animation */}
              {serverState === 'INSPECTING' && (
                <circle
                  r="45"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="12 6"
                  className="animate-spin origin-center"
                />
              )}

              {/* Main Gateway Core */}
              <circle
                r="36"
                fill="#0f172a"
                stroke={
                  serverState === 'ANOMALY_PULSE' 
                    ? '#f43f5e' 
                    : serverState === 'INSPECTING'
                      ? '#f59e0b'
                      : serverState === 'NORMAL_PULSE'
                        ? '#10b981'
                        : '#6366f1'
                }
                strokeWidth="3"
                className="drop-shadow-lg"
              />
              <circle
                r="30"
                fill="#1e1b4b"
                stroke="#4338ca"
                strokeWidth="1.5"
              />

              {/* Server glyph */}
              <Server 
                className={`w-7 h-7 ${
                  serverState === 'ANOMALY_PULSE'
                    ? 'text-rose-400'
                    : serverState === 'INSPECTING'
                      ? 'text-amber-300'
                      : 'text-indigo-300'
                }`} 
                x="-14" 
                y="-14" 
              />
              
              {/* Labels */}
              <text
                y="52"
                textAnchor="middle"
                className="fill-white font-bold text-xs"
              >
                Central Aggregation Gateway
              </text>
              <text
                y="66"
                textAnchor="middle"
                className="fill-slate-400 font-mono text-[10px]"
              >
                10.0.0.1 • DPI Rule Engine
              </text>

              {serverState === 'INSPECTING' && (
                <text
                  y="80"
                  textAnchor="middle"
                  className="fill-amber-300 font-mono text-[9px] font-bold animate-pulse"
                >
                  [INSPECTING BUFFER...]
                </text>
              )}
            </g>

            {/* 4 Hospital Nodes */}
            {HOSPITAL_NODES.map((h) => {
              const isSelected = selectedHospitalId === h.id;
              const isQuarantined = hospitalStatuses[h.id] === 'QUARANTINED';
              const state = connectionStates[h.id];

              return (
                <g 
                  key={h.id} 
                  transform={`translate(${h.x}, ${h.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedHospitalId(h.id)}
                >
                  {/* Aura */}
                  <circle
                    r={isSelected ? 48 : 40}
                    fill={isQuarantined ? 'url(#hospitalGlowQuarantine)' : 'url(#hospitalGlow)'}
                  />

                  {/* Node Outer Ring */}
                  <circle
                    r="28"
                    fill="#0f172a"
                    stroke={
                      isQuarantined 
                        ? '#f43f5e' 
                        : isSelected 
                          ? '#38bdf8' 
                          : state === 'normal' 
                            ? '#10b981' 
                            : '#334155'
                    }
                    strokeWidth={isSelected || isQuarantined ? '3.5' : '2'}
                  />

                  {/* Hospital Icon */}
                  <Building2 
                    className={`w-6 h-6 ${isQuarantined ? 'text-rose-400' : isSelected ? 'text-cyan-300' : 'text-slate-300'}`} 
                    x="-12" 
                    y="-12" 
                  />

                  {/* Status Indicator Dot */}
                  <circle
                    cx="18"
                    cy="-18"
                    r="5"
                    fill={isQuarantined ? '#f43f5e' : '#10b981'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />

                  {/* Labels */}
                  <text
                    y="42"
                    textAnchor="middle"
                    className="fill-slate-100 font-bold text-xs"
                  >
                    {h.name.split(' (')[0]}
                  </text>
                  <text
                    y="55"
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px]"
                  >
                    {h.name.split(' (')[1]?.replace(')', '') || ''}
                  </text>
                  <text
                    y="68"
                    textAnchor="middle"
                    className={`font-mono text-[9px] font-bold ${isQuarantined ? 'fill-rose-400' : 'fill-emerald-400'}`}
                  >
                    [{isQuarantined ? 'QUARANTINED' : 'ONLINE'}]
                  </text>
                </g>
              );
            })}

            {/* In-Flight Packets Traveling Along The Channels */}
            {activePackets.map((pkt) => {
              const start = nodeCoords[pkt.sourceId];
              const dest = nodeCoords[pkt.destinationId];
              if (!start || !dest) return null;

              // Current Interpolated Position
              const currentX = start.x + (dest.x - start.x) * pkt.progress;
              const currentY = start.y + (dest.y - start.y) * pkt.progress;

              const isAnomaly = pkt.isAnomaly;
              const packetColor = isAnomaly ? '#f43f5e' : '#10b981';
              const filterId = isAnomaly ? 'url(#glowRed)' : 'url(#glowGreen)';

              return (
                <g 
                  key={pkt.id} 
                  transform={`translate(${currentX}, ${currentY})`}
                >
                  {/* Outer Pulsing Glow */}
                  <circle
                    r="14"
                    fill={packetColor}
                    opacity="0.35"
                    className="animate-ping"
                  />

                  {/* Solid Packet Dot */}
                  <circle
                    r="7.5"
                    fill={packetColor}
                    stroke="#ffffff"
                    strokeWidth="2"
                    filter={filterId}
                  />

                  {/* Encrypted Packet Tag Visual Indicator */}
                  <g transform="translate(12, -20)">
                    <rect
                      x="0"
                      y="0"
                      width="126"
                      height="22"
                      rx="4"
                      fill="#020617"
                      stroke={packetColor}
                      strokeWidth="1.2"
                      opacity="0.95"
                    />
                    <Lock className="w-3 h-3 text-cyan-400" x="4" y="5" />
                    <text
                      x="18"
                      y="15"
                      fill="#e2e8f0"
                      className="font-mono text-[9px] font-bold"
                    >
                      AES-GCM [{pkt.encryption?.ivShort || '96b'}]
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Cryptographic Transport Transparency Notice */}
        <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>
              <strong>Encryption Visualization:</strong> In-flight packets use browser Web Crypto AES-GCM (256-bit) with unique 96-bit nonces. Synthetic telemetry demonstration — not production TLS.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-600">
            Detector Engine: Deterministic Rule-Based v1.1
          </span>
        </div>
      </div>

      {/* Security Event Log & Audit Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Real-Time Security Event Log
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {eventLogs.length} Events
            </span>
          </div>

          {eventLogs.length > 0 && (
            <button
              onClick={() => setEventLogs([])}
              className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>

        {eventLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            No packet events recorded yet. Click <strong>"Send Normal Packet"</strong> or <strong>"Inject Demo Anomaly"</strong> to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Event / Pkt ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Source Node</th>
                  <th className="py-2.5 px-3">Metrics</th>
                  <th className="py-2.5 px-3">Encryption</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Rule Result / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {eventLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      log.isAnomaly ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-200">
                      <div>{log.id}</div>
                      <div className="text-[9px] text-slate-500">{log.eventId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-sans">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-200 font-semibold">
                      {log.source.split(' (')[0]}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.trafficRate} • {log.payloadSize}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" />
                        {log.encryption}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {log.isAnomaly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600/20 text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          ANOMALY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">
                      <div className="font-semibold text-[11px] text-slate-200">{log.reason}</div>
                      <div className="text-[10px] text-slate-500 font-mono">[{log.ruleTriggered}]</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Faculty Presentation Instructions & Architecture Summary */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-white font-bold mb-1.5">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Faculty Demonstration Flow (2-Minute Walkthrough)</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-slate-300">
          <li><strong>Step 1: Baseline Verification:</strong> Click <span className="text-emerald-400 font-bold">"Send Normal Packet"</span>. Follow the 6-step pipeline (<span className="text-indigo-300">CREATED &rarr; ENCRYPTED &rarr; IN TRANSIT &rarr; RECEIVED &rarr; INSPECTING &rarr; VERDICT</span>), observe the green packet travel, and verify that the rule engine confirms it within normal limits (&lt; 5.0 pkt/s).</li>
          <li><strong>Step 2: Anomaly Injection & DPI Inspection:</strong> Click <span className="text-rose-400 font-bold">"Inject Demo Anomaly"</span>. Observe the high-rate burst travel from Hospital C, the amber inspection scanner pulse at the Gateway, and the prominent red <span className="text-rose-400 font-bold">"ANOMALY DETECTED"</span> alert trigger, turning the conduit red and quarantining the uplink.</li>
          <li><strong>Step 3: Reset & Clear:</strong> Click <span className="text-indigo-400 font-bold">"Reset Simulation"</span> to cancel active operations, restore clean topology, baseline counters, and clear quarantined states.</li>
        </ol>
      </div>
    </div>
  );
}
