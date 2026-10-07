import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VerifiedBadge } from '../components/StatusBadges';
import { Network, Database, Layers, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Graph() {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      icon: Database,
      title: "Raw Packets",
      desc: "Pcap/Flow records extracted from Edge-IIoTset.",
      details: "Raw network traffic is captured. Sensitive payload data is discarded, keeping only structural headers."
    },
    {
      icon: Layers,
      title: "Canonical Flow",
      desc: "Grouped by (src, dst, proto, port) identity.",
      details: "Packets are grouped into bidirectional flows. IP addresses are anonymized and hashed into canonical identifiers."
    },
    {
      icon: Network,
      title: "10s Temporal Window",
      desc: "Time-sliced aggregation mapping.",
      details: "Flows are bucketed into discrete 10-second temporal windows to capture transient behavioral anomalies."
    },
    {
      icon: CheckCircle,
      title: "Graph Representation",
      desc: "Nodes linked by multi-edge features.",
      details: "Nodes represent entities, edges represent the 31 extracted flow features. Output is ready for GraphSAGE ingestion."
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMO</div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Graph Construction</h1>
          <p className="text-slate-500 mt-2">Conceptual graph-construction visualization.</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-500 text-center mb-8 italic">Click on a stage to view details. Interactive visualizations use verified experimental results and conceptual process animations. They do not execute new model training.</p>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {stages.map((stage, idx) => (
            <React.Fragment key={idx}>
              <div 
                onClick={() => setActiveStage(idx)}
                className={clsx(
                  "cursor-pointer flex flex-col items-center p-6 border rounded-lg w-full md:w-48 text-center transition-all",
                  activeStage === idx ? "bg-indigo-50 border-indigo-500 shadow-md transform scale-105" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                )}
              >
                <stage.icon className={clsx("w-10 h-10 mb-3", activeStage === idx ? "text-indigo-600" : "text-slate-400")} />
                <h3 className={clsx("font-semibold text-sm", activeStage === idx ? "text-indigo-900" : "text-slate-700")}>{stage.title}</h3>
                <p className="text-xs text-slate-500 mt-2">{stage.desc}</p>
              </div>
              {idx < stages.length - 1 && (
                <div className={clsx("hidden md:block w-8 h-1", activeStage >= idx ? "bg-indigo-300" : "bg-slate-200")} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-lg min-h-[120px]">
          <h4 className="font-bold text-indigo-900">{stages[activeStage].title} Details</h4>
          <p className="text-indigo-800 text-sm mt-2">{stages[activeStage].details}</p>
        </div>
        
        <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm">
          <strong>Note on Identifiers:</strong> In accordance with the Phase 10 security constraints, raw IP addresses 
          are fully abstracted. The graph representation utilizes anonymized node IDs mapping strictly to normalized structural relationships.
        </div>

        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="font-bold text-sm text-indigo-900">Interactive Hospital IoT Graph Studio</h4>
            <p className="text-xs text-indigo-700 mt-0.5">Test real-time animated packet flows, device node inspection, and GraphSAGE neighborhood aggregation.</p>
          </div>
          <Link to="/simulation" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
            Launch Graph Simulation →
          </Link>
        </div>
      </div>
    </div>
  );
}
