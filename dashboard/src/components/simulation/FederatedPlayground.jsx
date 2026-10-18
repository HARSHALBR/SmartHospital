import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft, 
  Server, ArrowUp, ArrowDown, CheckCircle2,
  Activity, Info, RefreshCw, Check
} from 'lucide-react';
import clsx from 'clsx';

// Five Distinct FL Stages
const FL_STAGES = [
  { 
    id: 1, 
    name: 'Local Training', 
    shortName: 'Local Train',
    direction: 'local',
    desc: 'Each hospital client trains its EdgeMLP model locally on private telemetry data.' 
  },
  { 
    id: 2, 
    name: 'Model Update Generation', 
    shortName: 'Update Gen',
    direction: 'upload',
    desc: 'Clients compute parameter gradients (ΔW) and prepare weight updates for transmission.' 
  },
  { 
    id: 3, 
    name: 'Federated Aggregation', 
    shortName: 'Aggregation',
    direction: 'coordinator',
    desc: 'Central coordinator collects client updates and applies aggregation (FedAvg / Coordinate-wise Median).' 
  },
  { 
    id: 4, 
    name: 'Global Model Update', 
    shortName: 'Global Update',
    direction: 'coordinator',
    desc: 'Coordinator computes new global consensus weights: W_(t+1) = W_t + η * Aggregate(ΔW).' 
  },
  { 
    id: 5, 
    name: 'Distribution to Clients', 
    shortName: 'Distribution',
    direction: 'download',
    desc: 'New global model parameters are broadcast back to Hospital A, B, and C clients.' 
  }
];

const CLIENT_HOSPITALS = [
  {
    id: 'hosp-a',
    code: 'Hospital A — ICU',
    role: 'Intensive Care Unit',
    samples: '14,200 telemetry flows',
    nonIID: 'High Heterogeneity',
    specs: 'Mechanical Ventilators, Pumps, Monitors'
  },
  {
    id: 'hosp-b',
    code: 'Hospital B — Cardiology',
    role: 'Cardiology Telemetry Ward',
    samples: '11,800 telemetry flows',
    nonIID: 'Moderate Heterogeneity',
    specs: 'Holter Telemetry, Heparin Infusers'
  },
  {
    id: 'hosp-c',
    code: 'Hospital C — Emergency',
    role: 'Emergency & Trauma Bay',
    samples: '16,500 telemetry flows',
    nonIID: 'High Volatility',
    specs: 'Rapid Infusion Systems, Defibrillators'
  }
];

export default function FederatedPlayground() {
  const [currentRound, setCurrentRound] = useState(1);
  const [stageIndex, setStageIndex] = useState(0); // 0 to 4 corresponding to stages 1 to 5
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastCompletedRound, setLastCompletedRound] = useState(0);

  // Timer loop for deterministic state machine progression using functional state
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setStageIndex((prevStage) => {
        if (prevStage < 4) {
          return prevStage + 1;
        } else {
          setCurrentRound((prevRound) => {
            setLastCompletedRound(prevRound);
            return prevRound + 1;
          });
          return 0;
        }
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentStage = FL_STAGES[stageIndex];

  // Control Handlers
  const handleStartPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStageIndex(0);
    setCurrentRound(1);
    setLastCompletedRound(0);
  };

  const handleNextStage = () => {
    setIsPlaying(false);
    if (stageIndex < 4) {
      setStageIndex(prev => prev + 1);
    } else {
      setLastCompletedRound(currentRound);
      setCurrentRound(prev => prev + 1);
      setStageIndex(0);
    }
  };

  const handlePrevStage = () => {
    setIsPlaying(false);
    if (stageIndex > 0) {
      setStageIndex(prev => prev - 1);
    } else if (currentRound > 1) {
      setCurrentRound(prev => prev - 1);
      setStageIndex(4);
    }
  };

  // Helper for client card states based on current active stage
  const getClientCardState = () => {
    switch (currentStage.id) {
      case 1:
        return {
          localTrainStatus: 'Training in Progress (Epoch 1/1)',
          localTrainPct: '68%',
          updateStatus: 'Awaiting Gradient Computation',
          distributionCompleted: false,
          badgeColor: 'bg-indigo-100 text-indigo-800'
        };
      case 2:
        return {
          localTrainStatus: 'Local Training Complete (100%)',
          localTrainPct: '100%',
          updateStatus: 'Generating Parameter Update [ΔW]',
          distributionCompleted: false,
          badgeColor: 'bg-amber-100 text-amber-800'
        };
      case 3:
        return {
          localTrainStatus: 'Local Training Complete (100%)',
          localTrainPct: '100%',
          updateStatus: 'Update Uploaded to Central Server',
          distributionCompleted: false,
          badgeColor: 'bg-blue-100 text-blue-800'
        };
      case 4:
        return {
          localTrainStatus: 'Idle (Awaiting Global Aggregation)',
          localTrainPct: '100%',
          updateStatus: 'Aggregation in Progress on Server',
          distributionCompleted: false,
          badgeColor: 'bg-purple-100 text-purple-800'
        };
      case 5:
        return {
          localTrainStatus: 'Synchronized with Global Model',
          localTrainPct: '100%',
          updateStatus: 'New Global Weights Received',
          distributionCompleted: true,
          badgeColor: 'bg-emerald-100 text-emerald-800'
        };
      default:
        return {
          localTrainStatus: 'Standby',
          localTrainPct: '0%',
          updateStatus: 'Idle',
          distributionCompleted: false,
          badgeColor: 'bg-slate-100 text-slate-700'
        };
    }
  };

  const clientState = getClientCardState();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Feature E • Interactive Federated Learning Playground
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                Deterministic State Machine
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Deterministic Federated Learning Round Animation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Step through the 5 distinct stages of a federated communication round across the 3 hospital wards with central coordinator aggregation.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrevStage}
              className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Previous Stage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartPause}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs",
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Start Round'}
            </button>

            <button
              onClick={handleNextStage}
              className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Next Stage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset Round"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              Reset
            </button>

            <div className="ml-2 pl-3 border-l border-slate-300 text-xs font-mono">
              <span className="text-slate-500">Round:</span>{' '}
              <strong className="text-indigo-700">{currentRound}</strong>
            </div>
          </div>
        </div>

        {/* Five Stage Timeline Bar */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="grid grid-cols-5 gap-2">
            {FL_STAGES.map((s, idx) => {
              const isActive = idx === stageIndex;
              const isPast = idx < stageIndex;

              return (
                <div
                  key={s.id}
                  onClick={() => { setIsPlaying(false); setStageIndex(idx); }}
                  className={clsx(
                    "p-2.5 rounded-xl border text-center transition-all cursor-pointer relative",
                    isActive
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md ring-2 ring-indigo-400"
                      : isPast
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className={clsx(
                      "w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                      isActive ? "bg-white text-indigo-600" : isPast ? "bg-indigo-200 text-indigo-900" : "bg-slate-200 text-slate-600"
                    )}>
                      {isPast ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.id}
                    </span>
                    <span className="text-[10px] font-bold tracking-tight">Stage {s.id}</span>
                  </div>
                  <h4 className="text-[11px] font-bold truncate">{s.shortName}</h4>
                </div>
              );
            })}
          </div>

          <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-950">
            <span className="font-semibold">
              Current Stage {currentStage.id}: <strong>{currentStage.name}</strong> — {currentStage.desc}
            </span>
            <span className="font-mono text-[11px] text-indigo-700 font-bold shrink-0 ml-3">
              Status: {isPlaying ? 'Auto-Advancing' : 'Manual / Paused'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Central Aggregation Coordinator Hub & Dynamic Data Flow */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Federated Server
                </span>
                <h3 className="text-base font-bold text-white">Central Aggregation Coordinator</h3>
                <p className="text-xs text-slate-400">
                  Mathematical parameter aggregation (FedAvg / Coordinate-wise Median). Zero raw data access.
                </p>
              </div>
            </div>

            {/* Current Flow Direction Indicator */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono">
              {currentStage.direction === 'upload' && (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
                  <ArrowUp className="w-4 h-4" />
                  Client Gradients Uploading (ΔW)
                </span>
              )}
              {currentStage.direction === 'download' && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold animate-pulse">
                  <ArrowDown className="w-4 h-4" />
                  Global Model Broadcasting (W_t+1)
                </span>
              )}
              {currentStage.direction === 'coordinator' && (
                <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Global Matrix Aggregation
                </span>
              )}
              {currentStage.direction === 'local' && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Activity className="w-3.5 h-3.5" />
                  Clients Training Locally
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex justify-between">
              <span className="text-slate-400">Participating Clients:</span>
              <strong className="text-white">3 Hospital Wards</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex justify-between">
              <span className="text-slate-400">Aggregation Rule:</span>
              <strong className="text-indigo-300">Coordinate-wise Median</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex justify-between">
              <span className="text-slate-400">Round Progress:</span>
              <strong className="text-emerald-400">Stage {currentStage.id} of 5</strong>
            </div>
          </div>
        </div>

        {/* 3 Client Hospital Cards */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Participating Edge Hospital Clients (3 Non-IID Nodes)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CLIENT_HOSPITALS.map((client) => (
              <div 
                key={client.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                        {client.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{client.role}</h4>
                    </div>
                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded uppercase", clientState.badgeColor)}>
                      Stage {currentStage.id}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3 font-mono">
                    {client.specs}
                  </p>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Local Training:</span>
                      <span className="font-medium text-slate-800 text-[11px]">{clientState.localTrainStatus}</span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full transition-all duration-500" 
                        style={{ width: clientState.localTrainPct }} 
                      />
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Update Status:</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{clientState.updateStatus}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Completed Round:</span>
                      <span className="font-mono font-bold text-indigo-700">R{lastCompletedRound}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Global Sync:</span>
                      <span className={clsx(
                        "font-bold text-[11px] flex items-center gap-1",
                        clientState.distributionCompleted ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {clientState.distributionCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Synchronized</span>
                          </>
                        ) : (
                          <span>Pending Sync</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                  <span>Samples: {client.samples}</span>
                  <span className="font-mono text-slate-600">{client.nonIID}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State Machine Documentation Note */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>State Machine Integrity:</strong> This animation demonstrates the exact communication stages of the Phase 7.3 federated training protocol. Timer intervals are isolated with automatic cleanup to prevent multiple concurrent runs or timer leaks. It illustrates the mathematical protocol flow without asserting that live edge client weights are transmitted inside this browser session.
          </p>
        </div>

      </div>
    </div>
  );
}
