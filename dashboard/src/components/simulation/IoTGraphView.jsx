import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldCheck, Layers, Info
} from 'lucide-react';
import clsx from 'clsx';

// Conceptual IoT Entities with topological positions
const GRAPH_NODES = [
  { id: 'gw-icu', label: 'ICU Edge GW', ward: 'ICU', category: 'Gateway', x: 180, y: 130 },
  { id: 'vent-01', label: 'Ventilator-01', ward: 'ICU', category: 'LifeSupport', x: 80, y: 70 },
  { id: 'inf-02', label: 'InfusionPump-02', ward: 'ICU', category: 'Infusion', x: 70, y: 190 },
  { id: 'ecg-03', label: 'BedsideECG-03', ward: 'ICU', category: 'Telemetry', x: 160, y: 240 },

  { id: 'gw-cardio', label: 'Cardio GW', ward: 'Cardiology', category: 'Gateway', x: 380, y: 90 },
  { id: 'holter-01', label: 'Holter-01', ward: 'Cardiology', category: 'Telemetry', x: 320, y: 30 },
  { id: 'heparin-02', label: 'HeparinPump-02', ward: 'Cardiology', category: 'Infusion', x: 460, y: 40 },

  { id: 'gw-emerg', label: 'Emergency GW', ward: 'Emergency', category: 'Gateway', x: 570, y: 160 },
  { id: 'triage-01', label: 'TriageMonitor-01', ward: 'Emergency', category: 'Telemetry', x: 520, y: 240 },
  { id: 'defib-02', label: 'Defibrillator-02', ward: 'Emergency', category: 'LifeSupport', x: 650, y: 230 },

  { id: 'core-switch', label: 'Core Hospital Switch', ward: 'Backbone', category: 'Core', x: 370, y: 210 }
];

const GRAPH_EDGES = [
  { id: 'e-vent-gw', source: 'vent-01', target: 'gw-icu', proto: 'TCP / MedBus', basePkts: 1420 },
  { id: 'e-inf-gw', source: 'inf-02', target: 'gw-icu', proto: 'MQTT / TLS', basePkts: 760 },
  { id: 'e-ecg-gw', source: 'ecg-03', target: 'gw-icu', proto: 'HL7 v2 / TCP', basePkts: 2150 },
  { id: 'e-gw-core-icu', source: 'gw-icu', target: 'core-switch', proto: 'IP-Trunk', basePkts: 4330 },

  { id: 'e-holter-gw', source: 'holter-01', target: 'gw-cardio', proto: 'BLE-Gateway', basePkts: 1890 },
  { id: 'e-heparin-gw', source: 'heparin-02', target: 'gw-cardio', proto: 'MQTT / TLS', basePkts: 620 },
  { id: 'e-gw-core-cardio', source: 'gw-cardio', target: 'core-switch', proto: 'IP-Trunk', basePkts: 2510 },

  { id: 'e-triage-gw', source: 'triage-01', target: 'gw-emerg', proto: 'HL7 v2 / TCP', basePkts: 2380 },
  { id: 'e-defib-gw', source: 'defib-02', target: 'gw-emerg', proto: 'TCP / Direct', basePkts: 890 },
  { id: 'e-gw-core-emerg', source: 'gw-emerg', target: 'core-switch', proto: 'IP-Trunk', basePkts: 3270 }
];

const TIME_WINDOWS = ['5s Snapshot', '10s Slicing', '30s Window', '60s Window'];

export default function IoTGraphView({ isSuspicious, onToggleScenario }) {
  const [selectedWindow, setSelectedWindow] = useState('10s Slicing');
  const [selectedEntity, setSelectedEntity] = useState({ type: 'node', id: 'gw-icu' });

  // Node & Edge selection helpers
  const selectedNode = selectedEntity.type === 'node'
    ? GRAPH_NODES.find(n => n.id === selectedEntity.id) || GRAPH_NODES[0]
    : null;

  const selectedEdge = selectedEntity.type === 'edge'
    ? GRAPH_EDGES.find(e => e.id === selectedEntity.id) || GRAPH_EDGES[0]
    : null;

  // Window scaling multiplier for illustrative statistics
  const windowMultiplier = selectedWindow === '5s Snapshot' ? 0.5 :
                           selectedWindow === '10s Slicing' ? 1.0 :
                           selectedWindow === '30s Window' ? 3.0 : 6.0;

  // Suspicious attack nodes and edges
  const suspiciousNodeIds = ['gw-icu', 'inf-02', 'vent-01', 'core-switch'];
  const suspiciousEdgeIds = ['e-inf-gw', 'e-vent-gw', 'e-gw-core-icu'];

  const isNodeSuspicious = (nodeId) => isSuspicious && suspiciousNodeIds.includes(nodeId);
  const isEdgeSuspicious = (edgeId) => isSuspicious && suspiciousEdgeIds.includes(edgeId);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Feature B • IoT Communication Graph
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Synthetic Topology
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Topological IoT Communication Graph
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Graph representation depicting medical communication entities, edge relationships, and GraphSAGE 2-hop aggregation neighborhoods.
            </p>
          </div>

          {/* Time Window Selector & Scenario Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white rounded-lg border border-slate-300 p-0.5 text-xs">
              {TIME_WINDOWS.map(win => (
                <button
                  key={win}
                  onClick={() => setSelectedWindow(win)}
                  className={clsx(
                    "px-2.5 py-1 rounded font-medium transition-colors",
                    selectedWindow === win
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {win}
                </button>
              ))}
            </div>

            <button
              onClick={onToggleScenario}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
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

        {/* Methodology & Benchmark Distinction Disclaimer */}
        <div className="mt-4 p-3 bg-slate-100 border border-slate-300/80 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Benchmark Distinction Notice:</strong> The empirical benchmark experiments in this research were evaluated on <strong>Edge-IIoTset</strong> (an industrial IoT cybersecurity dataset containing 14 attack classes) and <strong>MTSamples</strong> (clinical-text proxy). This graph represents a conceptual hospital topology. The scenario toggle demonstrates synthetic network dynamics and is <strong>not a live model prediction or confidence score</strong>.
          </p>
        </div>
      </div>

      {/* Main Grid: SVG Graph View + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* SVG Graph View */}
        <div className="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-slate-950">
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
            <span className="font-mono text-[11px] text-slate-400">
              Graph Window: {selectedWindow} • {GRAPH_NODES.length} Nodes, {GRAPH_EDGES.length} Edges
            </span>
            <span className="text-[11px] text-slate-500">
              Click nodes or edge lines to inspect attributes
            </span>
          </div>

          <div className="w-full relative bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
            <svg 
              className="w-full h-auto max-h-[460px] select-none" 
              viewBox="0 0 740 300"
              role="img"
              aria-label="IoT Communication Graph"
            >
              {/* Edges */}
              {GRAPH_EDGES.map(edge => {
                const src = GRAPH_NODES.find(n => n.id === edge.source);
                const tgt = GRAPH_NODES.find(n => n.id === edge.target);
                if (!src || !tgt) return null;

                const isEdgeSusp = isEdgeSuspicious(edge.id);
                const isSelected = selectedEntity.type === 'edge' && selectedEntity.id === edge.id;

                return (
                  <g 
                    key={edge.id}
                    onClick={() => setSelectedEntity({ type: 'edge', id: edge.id })}
                    className="cursor-pointer"
                  >
                    <line
                      x1={src.x}
                      y1={src.y}
                      x2={tgt.x}
                      y2={tgt.y}
                      stroke={isSelected ? "#ffffff" : isEdgeSusp ? "#ef4444" : "#475569"}
                      strokeWidth={isSelected ? "4" : isEdgeSusp ? "3" : "1.8"}
                      strokeDasharray={isEdgeSusp ? "5 3" : "none"}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {GRAPH_NODES.map(node => {
                const isSusp = isNodeSuspicious(node.id);
                const isSelected = selectedEntity.type === 'node' && selectedEntity.id === node.id;

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedEntity({ type: 'node', id: node.id })}
                    className="cursor-pointer"
                  >
                    {/* Selected halo */}
                    {isSelected && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.category === 'Core' ? "14" : node.category === 'Gateway' ? "12" : "9"}
                      fill={
                        node.category === 'Core' ? '#4f46e5' :
                        node.category === 'Gateway' ? '#1e293b' :
                        isSusp ? '#7f1d1d' : '#0f172a'
                      }
                      stroke={
                        isSusp ? '#ef4444' :
                        node.category === 'Gateway' ? '#38bdf8' :
                        node.category === 'Core' ? '#818cf8' : '#94a3b8'
                      }
                      strokeWidth={isSusp ? "2.5" : "1.5"}
                    />

                    {/* Node label */}
                    <text
                      x={node.x}
                      y={node.y + 20}
                      fill={isSelected ? "#ffffff" : "#cbd5e1"}
                      fontSize="8.5"
                      fontWeight={isSelected ? "bold" : "normal"}
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Bottom Legend */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-sky-400 inline-block" />
                  Gateway Hub
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-400 inline-block" />
                  Medical Endpoint
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  Core Switch
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-slate-300">
                  <span className="w-3 h-0.5 bg-slate-500 inline-block" />
                  Normal Link
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-3 h-0.5 bg-rose-500 inline-block" />
                  Suspicious Edge
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Entity (Node or Edge) Detail Panel */}
        <div className="p-6 bg-white flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
              {selectedEntity.type === 'node' ? 'Selected Graph Node' : 'Selected Communication Edge'}
            </span>

            {selectedNode && (
              <div className="mt-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedNode.label}</h3>
                    <p className="text-xs text-slate-400 font-mono">Ward: {selectedNode.ward} • Category: {selectedNode.category}</p>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                    isNodeSuspicious(selectedNode.id)
                      ? "bg-rose-100 text-rose-800 animate-pulse"
                      : "bg-emerald-100 text-emerald-800"
                  )}>
                    {isNodeSuspicious(selectedNode.id) ? 'Suspicious' : 'Normal'}
                  </span>
                </div>

                <div className="space-y-2 text-xs mt-4 border-t border-slate-100 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Graph Degree:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {GRAPH_EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length} Connected Edges
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">GraphSAGE Feature Dim:</span>
                    <span className="font-mono font-bold text-indigo-600">128-D Node Embedding</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Flow Feature Count:</span>
                    <span className="font-mono text-slate-800">31 Extracted Attributes</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Aggregation Window:</span>
                    <span className="font-mono text-slate-800">{selectedWindow}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="mt-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edge: {selectedEdge.source} → {selectedEdge.target}</h3>
                    <p className="text-xs text-slate-400 font-mono">Protocol: {selectedEdge.proto}</p>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                    isEdgeSuspicious(selectedEdge.id)
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-800"
                  )}>
                    {isEdgeSuspicious(selectedEdge.id) ? 'Suspicious' : 'Normal'}
                  </span>
                </div>

                <div className="space-y-2 text-xs mt-4 border-t border-slate-100 pt-3">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Window Packet Count:</span>
                    <span className={clsx(
                      "font-mono font-bold",
                      isEdgeSuspicious(selectedEdge.id) ? "text-rose-600" : "text-slate-800"
                    )}>
                      {Math.round(selectedEdge.basePkts * windowMultiplier * (isEdgeSuspicious(selectedEdge.id) ? 6.8 : 1.0))} pkts
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Edge Status:</span>
                    <span className="font-mono text-slate-800">{isEdgeSuspicious(selectedEdge.id) ? 'Volumetric Anomaly' : 'Baseline Traffic'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Message Direction:</span>
                    <span className="font-mono text-slate-800">Bi-directional Uplink</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">Topological Graph Insight</span>
              <p>
                In our federated setup, GraphSAGE performs 2-hop neighborhood message passing locally within each client ward, avoiding the centralization of raw packet payloads.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
