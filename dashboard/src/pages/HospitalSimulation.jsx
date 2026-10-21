import React, { useState } from 'react';
import { 
  Cpu, Network, FileText, Share2, ShieldAlert, Activity,
  AlertTriangle, ShieldCheck, Layers, LayoutGrid
} from 'lucide-react';
import HospitalNetworkSim from '../components/simulation/HospitalNetworkSim';
import IoTGraphView from '../components/simulation/IoTGraphView';
import ClinicalVectorization from '../components/simulation/ClinicalVectorization';
import MultimodalRepresentation from '../components/simulation/MultimodalRepresentation';
import FederatedPlayground from '../components/simulation/FederatedPlayground';
import ResearchResultsLimitations from '../components/simulation/ResearchResultsLimitations';
import clsx from 'clsx';

const SECTIONS = [
  { id: 'all', label: 'All Sections (Full Center)', icon: LayoutGrid },
  { id: 'network', label: '1. Hospital Network', icon: Network },
  { id: 'graph', label: '2. IoT Communication Graph', icon: Layers },
  { id: 'clinical', label: '3. Clinical Semantic Vector', icon: FileText },
  { id: 'multimodal', label: '4. Multimodal Fusion', icon: Share2 },
  { id: 'federated', label: '5. FL Playground', icon: ShieldAlert },
  { id: 'results', label: '6. Research Results & Limitations', icon: Activity },
];

export default function HospitalSimulation() {
  const [activeTab, setActiveTab] = useState('all');
  const [isSuspiciousScenario, setIsSuspiciousScenario] = useState(false);

  const toggleScenario = () => {
    setIsSuspiciousScenario(prev => !prev);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-slate-900">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-2xl shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              <span>Smart Hospital Simulation Center</span>
              <span className="text-slate-500">•</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                Interactive Research Workspace
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Hospital Simulation & Federated Graph Security
            </h1>
            <p className="text-indigo-200/80 text-sm md:text-base mt-1 font-medium max-w-3xl">
              End-to-end interactive simulation studio synthesizing distributed medical IoT telemetry, clinical semantic vectorization, and multi-ward federated graph learning.
            </p>
          </div>

          {/* Master Global Scenario Toggle */}
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur p-2.5 rounded-xl border border-slate-700/80 shrink-0">
            <span className="text-xs font-semibold text-slate-300">Global Scenario:</span>
            <button
              onClick={toggleScenario}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border",
                isSuspiciousScenario
                  ? "bg-rose-600 text-white border-rose-500 shadow-md animate-pulse"
                  : "bg-emerald-600 text-white border-emerald-500 shadow-md"
              )}
            >
              {isSuspiciousScenario ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Suspicious / Volumetric Surge</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Normal Baseline Operation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Operational Constraints Disclaimer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>3 Wards: ICU (A), Cardiology (B), Emergency (C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Modalities: 128-D GraphSAGE + 128-D BioBERT Context</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Live Inference: Blocked (Missing Weight Checkpoint)</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto pb-1 text-xs font-semibold">
        {SECTIONS.map(sec => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={clsx(
                "flex items-center px-3.5 py-2.5 rounded-t-xl transition-all border-b-2 whitespace-nowrap",
                isActive 
                  ? "border-indigo-600 text-indigo-700 bg-white font-bold shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
              )}
            >
              <Icon className="w-3.5 h-3.5 mr-2" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* Render Workspace Sections */}
      <div className="space-y-10">
        
        {/* Feature A: Smart Hospital Network */}
        {(activeTab === 'all' || activeTab === 'network') && (
          <section id="section-network" aria-labelledby="section-network-title">
            <HospitalNetworkSim 
              isSuspicious={isSuspiciousScenario} 
              onToggleScenario={toggleScenario}
              onResetScenario={() => setIsSuspiciousScenario(false)}
            />
          </section>
        )}

        {/* Feature B: IoT Communication Graph */}
        {(activeTab === 'all' || activeTab === 'graph') && (
          <section id="section-graph" aria-labelledby="section-graph-title">
            <IoTGraphView 
              isSuspicious={isSuspiciousScenario} 
              onToggleScenario={toggleScenario}
              onResetScenario={() => setIsSuspiciousScenario(false)}
            />
          </section>
        )}

        {/* Feature C: Clinical Semantic Vectorization */}
        {(activeTab === 'all' || activeTab === 'clinical') && (
          <section id="section-clinical" aria-labelledby="section-clinical-title">
            <ClinicalVectorization />
          </section>
        )}

        {/* Feature D: Multimodal Representation */}
        {(activeTab === 'all' || activeTab === 'multimodal') && (
          <section id="section-multimodal" aria-labelledby="section-multimodal-title">
            <MultimodalRepresentation />
          </section>
        )}

        {/* Feature E: Interactive Federated Learning Playground */}
        {(activeTab === 'all' || activeTab === 'federated') && (
          <section id="section-federated" aria-labelledby="section-federated-title">
            <FederatedPlayground />
          </section>
        )}

        {/* Feature F: Research Results and Limitations */}
        {(activeTab === 'all' || activeTab === 'results') && (
          <section id="section-results" aria-labelledby="section-results-title">
            <ResearchResultsLimitations />
          </section>
        )}

      </div>

    </div>
  );
}
