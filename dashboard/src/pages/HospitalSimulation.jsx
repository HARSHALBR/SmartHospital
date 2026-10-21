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
import MeetalSimulationConfig from '../components/simulation/MeetalSimulationConfig';
import { Sliders } from 'lucide-react';
import clsx from 'clsx';

const SECTIONS = [
  { id: 'all', label: 'All Sections (Full Center)', icon: LayoutGrid },
  { id: 'network', label: '1. Hospital Network', icon: Network },
  { id: 'graph', label: '2. IoT Communication Graph', icon: Layers },
  { id: 'clinical', label: '3. Clinical Semantic Vector', icon: FileText },
  { id: 'multimodal', label: '4. Multimodal Fusion', icon: Share2 },
  { id: 'federated', label: '5. FL Playground', icon: ShieldAlert },
  { id: 'results', label: '6. Research Results & Limitations', icon: Activity },
  { id: 'config-seam', label: '7. Experiment Seam (Meetal)', icon: Sliders },
];

export default function HospitalSimulation() {
  const [activeTab, setActiveTab] = useState('all');
  const [isSuspiciousScenario, setIsSuspiciousScenario] = useState(false);

  const toggleScenario = () => {
    setIsSuspiciousScenario(prev => !prev);
  };

  return (
    <div className="space-y-6 max-w-[1180px] mx-auto pb-16 font-sans">
      
      {/* Top Banner & Header matching Friend's UI Hero theme */}
      <div className="relative overflow-hidden rounded-[17px] p-7 md:p-8 text-white shadow-[0_14px_34px_rgba(34,93,96,0.24)] bg-gradient-to-r from-[#153f50] via-[#176a69] to-[#428c83] border border-[#a8ded2]/20">
        <div className="absolute -right-12 -top-24 w-80 h-80 rounded-full border border-white/10 pointer-events-none shadow-[0_0_0_26px_rgba(255,255,255,0.03),0_0_0_56px_rgba(255,255,255,0.02)]" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-[#a9ded3] text-[9px] font-extrabold uppercase tracking-[1.25px] mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Smart Hospital Simulation Center</span>
              <span className="text-white/40">•</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[9px] font-bold">
                Interactive Research Workspace
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-white leading-tight">
              Hospital Simulation & Federated Graph Security
            </h1>
            <p className="text-[#d1e6e4] text-xs sm:text-[13px] mt-1.5 font-medium max-w-3xl leading-relaxed">
              End-to-end interactive simulation studio synthesizing distributed medical IoT telemetry, clinical semantic vectorization, and multi-ward federated graph learning.
            </p>
          </div>

          {/* Master Global Scenario Toggle */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shrink-0">
            <span className="text-xs font-semibold text-white/90">Global Scenario:</span>
            <button
              onClick={toggleScenario}
              className={clsx(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all shadow-xs",
                isSuspiciousScenario
                  ? "bg-[#a74a4a] text-white animate-pulse"
                  : "bg-[#a8ded2] text-[#164f53] hover:bg-[#bbf0e5]"
              )}
            >
              {isSuspiciousScenario ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Suspicious / Surge</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Normal Baseline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Operational Constraints Disclaimer */}
        <div className="mt-5 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-[#d1e6e4]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#58bc9b]" />
            <span>3 Wards: ICU (A), Cardiology (B), Emergency (C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#a8ded2]" />
            <span>Modalities: 128-D GraphSAGE + 128-D BioBERT Context</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fca5a5]" />
            <span>Live Inference: Blocked (Missing Weight Checkpoint)</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs matching Friend's UI Theme */}
      <div className="flex bg-white p-1.5 rounded-[12px] border border-[#e4ebee] space-x-1 overflow-x-auto shadow-[0_2px_8px_rgba(27,69,81,0.04)] text-xs font-semibold">
        {SECTIONS.map(sec => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={clsx(
                "flex items-center px-3.5 py-2 rounded-[9px] transition-all whitespace-nowrap text-xs font-semibold",
                isActive 
                  ? "bg-[#1d5360] text-white shadow-[inset_3px_0_#8cd4c4] font-bold"
                  : "text-[#6c7e88] hover:text-[#172d3c] hover:bg-[#edf5f4]"
              )}
            >
              <Icon className="w-3.5 h-3.5 mr-2 opacity-80" />
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

        {/* Feature G: Meetal's Simulation Configuration & Backend Seam */}
        {(activeTab === 'all' || activeTab === 'config-seam') && (
          <section id="section-config-seam" aria-labelledby="section-config-seam-title">
            <MeetalSimulationConfig />
          </section>
        )}

      </div>

    </div>
  );
}
