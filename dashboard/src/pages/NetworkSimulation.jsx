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
    <div className="space-y-6 pb-14 font-sans max-w-[1180px] mx-auto">
      {/* Top Header & Context Bar matching Friend's UI Hero */}
      <div className="relative overflow-hidden rounded-[17px] p-7 md:p-8 text-white shadow-[0_14px_34px_rgba(34,93,96,0.24)] bg-gradient-to-r from-[#153f50] via-[#176a69] to-[#428c83] border border-[#a8ded2]/20">
        <div className="absolute -right-12 -top-24 w-80 h-80 rounded-full border border-white/10 pointer-events-none shadow-[0_0_0_26px_rgba(255,255,255,0.03),0_0_0_56px_rgba(255,255,255,0.02)]"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-[1.25px] bg-white/10 text-[#a9ded3] border border-white/20">
                Security Ops Simulation
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 text-white/90 border border-white/15">
                Rule-Based Inspection (DPI)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-white/10 text-white/90 border border-white/15">
                Web Crypto AES-GCM (256b)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-[#a8ded2] animate-pulse shrink-0" />
              Smart Hospital Network Telemetry & Anomaly Simulation
            </h1>
            <p className="text-xs sm:text-[13px] text-[#d1e6e4] mt-1.5 max-w-3xl leading-relaxed">
              Real-time demonstration of distributed IoT/clinical telemetry flowing from 4 hospital edge nodes to the Central Aggregation Gateway.
              Tests authenticated AES-GCM transport, deep rule inspection, anomaly detection, and automated uplink quarantine.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetSimulation}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#a8ded2] hover:bg-[#bbf0e5] active:scale-95 text-[#164f53] font-display font-bold rounded-lg text-xs transition-all shadow-xs"
              title="Reset all counters, alerts, and connections to clean baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#164f53]" />
              Reset Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Metric Counters Bar matching Friend's KPI Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Packets */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#71848e] text-[10px] font-bold uppercase tracking-wider">
            <span>Packets Dispatched</span>
            <div className="w-6 h-6 rounded-lg bg-[#edf5f4] text-[#167f78] flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-display font-extrabold text-[#1b3a4a] font-mono leading-tight">
            {metrics.totalSent}
          </div>
          <div className="mt-1 text-[9px] text-[#8a989e]">
            Total simulated telemetry transmissions
          </div>
        </div>

        {/* Normal Packets */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#71848e] text-[10px] font-bold uppercase tracking-wider">
            <span>Normal Packets</span>
            <div className="w-6 h-6 rounded-lg bg-[#eff7f4] text-[#58bc9b] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-display font-extrabold text-[#58bc9b] font-mono leading-tight">
            {metrics.normalVerified}
          </div>
          <div className="mt-1 text-[9px] text-[#8a989e] font-medium">
            Within baseline thresholds (&lt; 5.0 pkt/s)
          </div>
        </div>

        {/* Anomalies Detected */}
        <div className={`rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)] flex flex-col justify-between transition-colors border ${
          metrics.anomaliesDetected > 0
            ? 'bg-[#fff0ec] border-[#f0d6cf] text-[#a2544a]'
            : 'bg-white border-[#e4ebee] text-[#172d3c]'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
            <span className={metrics.anomaliesDetected > 0 ? 'text-[#a2544a]' : 'text-[#71848e]'}>
              Anomalies Detected
            </span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              metrics.anomaliesDetected > 0 ? 'bg-[#fff0ec] text-[#a2544a]' : 'bg-[#edf5f4] text-[#167f78]'
            }`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${metrics.anomaliesDetected > 0 ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          <div className={`mt-2 text-[26px] font-display font-extrabold font-mono leading-tight ${
            metrics.anomaliesDetected > 0 ? 'text-[#a2544a]' : 'text-[#1b3a4a]'
          }`}>
            {metrics.anomaliesDetected}
          </div>
          <div className={`mt-1 text-[9px] ${metrics.anomaliesDetected > 0 ? 'text-[#a2544a] font-bold' : 'text-[#8a989e]'}`}>
            {metrics.anomaliesDetected > 0 ? 'Threat flagged by rule detector' : 'Zero violations active'}
          </div>
        </div>

        {/* Node Connectivity */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#71848e] text-[10px] font-bold uppercase tracking-wider">
            <span>Hospital Topology</span>
            <div className="w-6 h-6 rounded-lg bg-[#edf5f4] text-[#167f78] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-[26px] font-display font-extrabold text-[#1b3a4a] font-mono leading-tight flex items-center gap-2">
            <span>4 / 4</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              Object.values(hospitalStatuses).includes('QUARANTINED')
                ? 'bg-[#a74a4a] animate-ping'
                : 'bg-[#58bc9b] animate-pulse'
            }`}></span>
          </div>
          <div className="mt-1 text-[9px] text-[#8a989e]">
            {Object.values(hospitalStatuses).includes('QUARANTINED')
              ? '1 Node In Quarantine'
              : 'All Uplinks Secure'}
          </div>
        </div>
      </div>

      {/* Prominent High-Visibility Anomaly Alert Banner */}
      {activeAlert && (
        <div className="bg-[#fff1ee] border-2 border-[#f0d6cf] rounded-[14px] p-4 text-[#8b5148] shadow-lg animate-fade-in relative overflow-hidden">
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-[#a74a4a] text-white rounded-lg shadow-md shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base font-display font-extrabold tracking-wide text-[#a2544a]">
                    ⚠️ ANOMALY DETECTED — SECURITY POLICY VIOLATION
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#fff0ec] border border-[#f0d6cf] rounded text-[#a2544a]">
                    {activeAlert.eventId}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#a74a4a] text-white rounded uppercase tracking-wider">
                    SEVERITY: {activeAlert.severity}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#eff7f4] text-[#347864] border border-[#cce7e1] rounded">
                    {activeAlert.authStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white border border-[#f0d6cf] rounded-lg p-2.5">
                    <span className="text-[#a2544a] font-bold block text-[10px] uppercase">Threat Source</span>
                    <span className="font-bold text-[#172d3c]">{activeAlert.sourceName}</span>
                    <span className="text-[10px] text-[#8b5148] block font-mono">{activeAlert.sourceIp} &rarr; 10.0.0.1</span>
                  </div>
                  <div className="bg-white border border-[#f0d6cf] rounded-lg p-2.5">
                    <span className="text-[#a2544a] font-bold block text-[10px] uppercase">Detection Reason</span>
                    <span className="font-bold text-[#172d3c] leading-snug">{activeAlert.reason}</span>
                  </div>
                  <div className="bg-white border border-[#f0d6cf] rounded-lg p-2.5">
                    <span className="text-[#a2544a] font-bold block text-[10px] uppercase">Observed vs Threshold</span>
                    <span className="font-bold text-[#172d3c] font-mono block">Rate: {activeAlert.trafficRate.toFixed(1)} / {activeAlert.thresholdRate.toFixed(1)} pkt/s</span>
                    <span className="font-mono text-[10px] text-[#8b5148]">Buffer: {activeAlert.payloadSize} / {activeAlert.thresholdSize} B</span>
                  </div>
                  <div className="bg-white border border-[#f0d6cf] rounded-lg p-2.5">
                    <span className="text-[#a2544a] font-bold block text-[10px] uppercase">Remediation Action</span>
                    <span className="font-bold text-[#172d3c] text-[11px] block">{activeAlert.actionTaken}</span>
                    <span className="text-[10px] text-[#a36b21] font-semibold">Uplink Isolated</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveAlert(null)}
              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#a2544a] transition-colors border border-[#f0d6cf]"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Controls & Triggers */}
      <div className="bg-white border border-[#e4ebee] rounded-[14px] p-5 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Controls: Source selection and packet triggers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Source Hospital Selector */}
            <div className="flex items-center gap-2 bg-[#f5f8fa] border border-[#e4ebee] rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-bold text-[#71848e] uppercase tracking-wide">
                Source:
              </span>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                disabled={isDispatching}
                className="bg-transparent text-xs font-bold text-[#172d3c] outline-hidden cursor-pointer disabled:opacity-50"
              >
                {HOSPITAL_NODES.map((h) => (
                  <option key={h.id} value={h.id} className="bg-white text-[#172d3c]">
                    {h.name} {h.id === 'hosp-c' ? '(Demo Target)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Send Normal Packet Button */}
            <button
              onClick={() => dispatchPacket({ sourceId: selectedHospitalId, isAnomaly: false })}
              disabled={isDispatching}
              className="flex items-center gap-2 px-4 py-2 bg-[#167f78] hover:bg-[#0f625f] active:scale-95 text-white text-xs font-display font-bold rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              Send Normal Packet
            </button>

            {/* Inject Demo Anomaly Button (Targeted from Hospital C) */}
            <button
              onClick={() => dispatchPacket({ sourceId: 'hosp-c', isAnomaly: true })}
              disabled={isDispatching}
              className="flex items-center gap-2 px-4 py-2 bg-[#a74a4a] hover:bg-[#8b3d3d] active:scale-95 text-white text-xs font-display font-bold rounded-lg transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 text-[#fff3df]" />
              Inject Demo Anomaly (Hospital C)
            </button>
          </div>

          {/* Right Controls: Automatic traffic toggle and configured threshold indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoTrafficActive(!isAutoTrafficActive)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display font-bold transition-all border ${
                isAutoTrafficActive
                  ? 'bg-[#1d5360] text-white border-[#1d5360] shadow-xs'
                  : 'bg-white text-[#355665] border-[#dce6e8] hover:border-[#9fcfc5] hover:bg-[#f3faf8]'
              }`}
            >
              {isAutoTrafficActive ? (
                <>
                  <Square className="w-3.5 h-3.5 text-amber-300" />
                  Stop Auto-Traffic
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#167f78]" />
                  Auto-Traffic (2.6s)
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f5f8fa] border border-[#e4ebee] rounded-lg text-[11px] text-[#71848e]">
              <span className="font-semibold text-[#172d3c]">Rule Engine Threshold:</span>
              <span className="font-mono text-[#167f78] font-bold">&gt; 5.0 pkt/s</span>
            </div>
          </div>
        </div>

        {/* Visible 6-Step Packet Lifecycle Pipeline Bar */}
        <div className="mt-4 pt-3.5 border-t border-[#edf2f4]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#71848e] mb-2 flex items-center justify-between">
            <span>Live Transmission & Inspection Pipeline</span>
            <span className="font-mono text-[#8a989e]">
              Status: <span className="text-[#167f78] font-bold">{pipelineStage}</span>
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

              let badgeStyle = 'bg-[#f8fafb] border-[#e4ebee] text-[#8a989e]';

              if (isActive) {
                if (stg.key === 'CLASSIFIED') {
                  badgeStyle = pipelineVerdict === 'ANOMALY'
                    ? 'bg-[#fff0ec] border-[#f0d6cf] text-[#a2544a] font-bold animate-pulse'
                    : 'bg-[#eff7f4] border-[#cce7e1] text-[#347864] font-bold animate-pulse';
                } else if (stg.key === 'INSPECTING') {
                  badgeStyle = 'bg-[#fff8e9] border-[#f1e2c4] text-[#9b6b29] font-bold animate-pulse';
                } else {
                  badgeStyle = 'bg-[#1d5360] border-[#1d5360] text-white shadow-[inset_3px_0_#8cd4c4]';
                }
              } else if (isPast) {
                badgeStyle = 'bg-[#f0f4f5] border-[#dce6e8] text-[#526873] font-semibold';
              }

              return (
                <div
                  key={stg.key}
                  className={`border rounded-lg px-2.5 py-1.5 transition-all text-left flex flex-col justify-between ${badgeStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {stg.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[9px] opacity-80 font-mono mt-0.5 truncate">
                    {stg.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Network Topology Visualization Canvas (SVG) */}
      <div className="bg-white border border-[#e4ebee] rounded-[14px] p-5 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
        {/* Canvas Status Header */}
        <div className="flex items-center justify-between text-xs text-[#71848e] mb-3 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#58bc9b] animate-ping"></span>
            <span className="font-display font-bold text-[#244150] uppercase tracking-wider text-[11px]">
              Active Star Topology View
            </span>
            <span className="text-[#b6c1c6]">|</span>
            <span className="text-[11px] text-[#87969d]">Authenticated Transport Conduits</span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58bc9b] inline-block"></span>
              <span className="text-[#526873] font-medium">Normal Packet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a74a4a] inline-block"></span>
              <span className="text-[#526873] font-medium">Anomaly</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#edf4f8] px-2 py-0.5 rounded border border-[#dbe7ee] text-[#527793] text-[10px] font-bold">
              <Lock className="w-3 h-3 text-[#167f78]" />
              <span>AES-GCM (96b Nonce)</span>
            </div>
          </div>
        </div>

        {/* SVG Network Viewport inside navy container matching Friend's palette */}
        <div className="w-full aspect-[800/490] max-h-[490px] relative bg-[#112c3b] rounded-xl border border-[#1e4154] overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#1e4154_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
          <svg
            viewBox="0 0 800 490"
            className="w-full h-full select-none relative z-10"
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
        <div className="mt-3 pt-3 border-t border-[#edf2f4] flex items-center justify-between text-[11px] text-[#87969d] flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#167f78] shrink-0" />
            <span>
              <strong className="text-[#244150]">Encryption Visualization:</strong> In-flight packets use browser Web Crypto AES-GCM (256-bit) with unique 96-bit nonces. Synthetic telemetry demonstration — not production TLS.
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#71848e]">
            Detector Engine: Deterministic Rule-Based v1.1
          </span>
        </div>
      </div>

      {/* Security Event Log & Audit Stream */}
      <div className="bg-white border border-[#e4ebee] rounded-[14px] p-6 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#167f78]" />
            <h2 className="text-[14px] font-display font-bold text-[#244150]">
              Real-Time Security Event Log
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#edf5f4] text-[#167f78] font-mono border border-[#cce7e1]">
              {eventLogs.length} Events
            </span>
          </div>

          {eventLogs.length > 0 && (
            <button
              onClick={() => setEventLogs([])}
              className="text-[11px] font-semibold text-[#87969d] hover:text-[#172d3c] transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>

        {eventLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#87969d] border border-dashed border-[#e4ebee] rounded-xl bg-[#f8fafb]">
            No packet events recorded yet. Click <strong>"Send Normal Packet"</strong> or <strong>"Inject Demo Anomaly"</strong> to begin.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#e4ebee] rounded-xl">
            <table className="w-full text-left text-xs text-[#526873]">
              <thead className="text-[9px] uppercase font-bold text-[#81919a] bg-[#f7f9fa] border-b border-[#e4ebee]">
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
              <tbody className="divide-y divide-[#eef2f3] font-mono text-[11px]">
                {eventLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-[#f8fafb] transition-colors ${
                      log.isAnomaly ? 'bg-[#fff0ec]/50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-[#2d4857]">
                      <div>{log.id}</div>
                      <div className="text-[9px] text-[#87969d] font-normal">{log.eventId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#71848e] font-sans">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#2d4857] font-semibold">
                      {log.source.split(' (')[0]}
                    </td>
                    <td className="py-2.5 px-3 text-[#526873]">
                      {log.trafficRate} • {log.payloadSize}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#527793] bg-[#edf4f8] border border-[#dbe7ee] px-2 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5 text-[#167f78]" />
                        {log.encryption}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {log.isAnomaly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#fff0ec] text-[#a2544a] border border-[#f0d6cf]">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          ANOMALY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#eff7f4] text-[#347864] border border-[#cce7e1]">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[#526873]">
                      <div className="font-semibold text-[11px] text-[#244150]">{log.reason}</div>
                      <div className="text-[10px] text-[#87969d] font-mono">[{log.ruleTriggered}]</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
