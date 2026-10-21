import React, { useState } from 'react';
import {
  Sliders, RotateCcw, Play, AlertCircle, Info, X,
  CheckCircle2, Layers, Cpu, Network, ArrowRight, ShieldCheck,
  TrendingDown, TrendingUp, Terminal
} from 'lucide-react';
import { defaultConfig, DATASET_OPTIONS, AGGREGATION_OPTIONS } from '../../services/simulationService';
import clsx from 'clsx';

export default function MeetalSimulationConfig() {
  const [config, setConfig] = useState({ ...defaultConfig });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [simulationState, setSimulationState] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [simProgress, setSimProgress] = useState(0);
  const [mockOutput, setMockOutput] = useState(null);
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'output' | 'logs'

  const handleReset = () => {
    setConfig({ ...defaultConfig });
    setSimulationState('idle');
    setSimProgress(0);
    setMockOutput(null);
  };

  const handleSimulateContractPreview = () => {
    setSimulationState('running');
    setSimProgress(10);
    setActiveTab('output');

    // Step-by-step progress simulation matching the suggested response shape in SIMULATION-INTEGRATION.md
    let currentRound = 1;
    const interval = setInterval(() => {
      currentRound++;
      const pct = Math.min(100, Math.round((currentRound / config.rounds) * 100));
      setSimProgress(pct);

      if (currentRound >= config.rounds) {
        clearInterval(interval);
        setSimulationState('completed');
        setMockOutput({
          runId: `sim-run-${Date.now().toString().slice(-6)}`,
          status: 'completed',
          progress: { currentRound: config.rounds, totalRounds: config.rounds },
          metrics: {
            accuracy: config.aggregation === 'median' ? 0.942 : 0.958,
            precision: config.aggregation === 'median' ? 0.931 : 0.949,
            recall: config.aggregation === 'median' ? 0.948 : 0.962,
            f1: config.aggregation === 'median' ? 0.939 : 0.955,
            loss: 0.142
          },
          comparison: [
            { model: 'Centralized EdgeMLP', f1: 0.955 },
            { model: `Federated ${config.aggregation.toUpperCase()} (${config.clients} Clients)`, f1: config.aggregation === 'median' ? 0.939 : 0.955 }
          ],
          logs: [
            { timestamp: '14:20:01', level: 'INFO', message: `Initialized 3 edge hospital clients (${config.dataset})` },
            { timestamp: '14:20:02', level: 'INFO', message: `Local training epoch ${config.localEpochs} dispatched` },
            { timestamp: '14:20:04', level: 'INFO', message: `Weights received at coordinator. Aggregation: ${config.aggregation}` },
            { timestamp: '14:20:06', level: 'SUCCESS', message: `Simulation run completed. Convergence reached.` }
          ]
        });
      }
    }, 400);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8" aria-labelledby="meetal-sim-heading">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Federated Experiment Workspace
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Meetal's Frontend Integration</span>
          </div>
          <h2 id="meetal-sim-heading" className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Simulation Configuration & Backend Contract Seam
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Configure research parameters for the federated learning pipeline. Implements the documented contract schema from <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">frontend/SIMULATION-INTEGRATION.md</code>.
          </p>
        </div>

        {/* Backend Status Badge */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Backend Integration Seam
          </span>
          <button
            onClick={() => setShowDetailsModal(true)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-200"
          >
            View Contract Details ↗
          </button>
        </div>
      </div>

      {/* Scope Notice Strip */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900">Configuration Preview Only:</strong> These controls model the parameters for a future federated execution. The production API currently exposes frozen evaluation metrics and live inference endpoints. You can test the contract preview below or reset to defaults.
        </div>
      </div>

      {/* Main Grid: Form + Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Experiment Run Parameters</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                Phase 7.3 Topology
              </span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs">

              {/* Participating Clients (Readonly) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Participating Edge Clients
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={config.clients}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono text-xs cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-medium text-slate-500">
                    Fixed at 3
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Fixed to 3 to match the documented Phase 7.3 smart hospital topology (Wards A, B, C).
                </p>
              </div>

              {/* Rounds & Epochs Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cfg-rounds" className="block font-bold text-slate-800 mb-1">
                    Communication Rounds
                  </label>
                  <input
                    id="cfg-rounds"
                    type="number"
                    min="1"
                    max="100"
                    value={config.rounds}
                    onChange={(e) => setConfig({ ...config, rounds: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 10 rounds (1–100)</p>
                </div>

                <div>
                  <label htmlFor="cfg-epochs" className="block font-bold text-slate-800 mb-1">
                    Local Training Epochs
                  </label>
                  <input
                    id="cfg-epochs"
                    type="number"
                    min="1"
                    max="50"
                    value={config.localEpochs}
                    onChange={(e) => setConfig({ ...config, localEpochs: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: 1 epoch per round (1–50)</p>
                </div>
              </div>

              {/* Research Data Configuration */}
              <div>
                <label htmlFor="cfg-dataset" className="block font-bold text-slate-800 mb-1">
                  Research Data Configuration
                </label>
                <select
                  id="cfg-dataset"
                  value={config.dataset}
                  onChange={(e) => setConfig({ ...config, dataset: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {DATASET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Public proxy benchmarks only. No real patient records or hospital telemetry used.
                </p>
              </div>

              {/* Aggregation Method */}
              <div>
                <label htmlFor="cfg-aggregation" className="block font-bold text-slate-800 mb-1">
                  Aggregation Method
                </label>
                <select
                  id="cfg-aggregation"
                  value={config.aggregation}
                  onChange={(e) => setConfig({ ...config, aggregation: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {AGGREGATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Evaluated baseline (FedAvg) vs Byzantine-robust aggregator (Coordinate-wise Median).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulateContractPreview}
                  disabled={simulationState === 'running'}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs",
                    simulationState === 'running'
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {simulationState === 'running' ? 'Simulating Rounds...' : 'Preview Contract Execution'}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  Reset Defaults
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Right Column: Workflow Steps & Boundaries (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Intended Research Workflow Preview
            </h3>

            <ol className="space-y-3 text-xs">
              <li className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-slate-900 block">Hospital Edge Clients</strong>
                  <span className="text-[11px] text-slate-500">Three simulated ward clients retain raw telemetry locally.</span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-slate-900 block">Local Model Training</strong>
                  <span className="text-[11px] text-slate-500">Client-side training on configured proxy data ({config.dataset}).</span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-slate-900 block">Exchange Model Updates</strong>
                  <span className="text-[11px] text-slate-500">Only gradient / weight parameters transmit; no patient records.</span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong className="text-slate-900 block">Federated Aggregation</strong>
                  <span className="text-[11px] text-slate-500">{config.aggregation === 'fedavg' ? 'FedAvg weighted consensus' : 'Coordinate-wise Median defense'}.</span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</span>
                <div>
                  <strong className="text-slate-900 block">Global Model Evaluation</strong>
                  <span className="text-[11px] text-slate-500">Returns consensus metrics to participating hospitals.</span>
                </div>
              </li>
            </ol>

            {/* Research Boundary Note */}
            <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
              <strong>Research Boundary:</strong> Local data retention is an architectural property of this simulation, not a formal cryptographic privacy guarantee. Differential privacy was not established in the documented study.
            </div>
          </div>
        </div>

      </div>

      {/* Simulation Output Area */}
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Simulation Output & Diagnostics</h3>
            {simulationState === 'running' && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full animate-pulse">
                Running Round {Math.round((simProgress / 100) * config.rounds)} / {config.rounds}
              </span>
            )}
            {simulationState === 'completed' && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Completed ({mockOutput?.runId})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('config')}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors",
                activeTab === 'config' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Metrics
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors",
                activeTab === 'logs' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Event Logs
            </button>
          </div>
        </div>

        {/* Progress Bar (during running) */}
        {simulationState === 'running' && (
          <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300"
              style={{ width: `${simProgress}%` }}
            />
          </div>
        )}

        <div className="p-6">
          {activeTab === 'config' && (
            <div>
              {/* Output Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Model Performance
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-slate-900">
                    {mockOutput ? `${(mockOutput.metrics.f1 * 100).toFixed(1)}%` : '—'}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {mockOutput
                      ? `Acc: ${(mockOutput.metrics.accuracy * 100).toFixed(1)}% | Loss: ${mockOutput.metrics.loss}`
                      : 'F1 · accuracy · precision · recall'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Training Progress
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-slate-900">
                    {mockOutput ? `${mockOutput.progress.currentRound} / ${mockOutput.progress.totalRounds}` : '—'}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {mockOutput ? 'All rounds converged' : 'Current / total communication rounds'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Evaluation Comparison
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-emerald-600">
                    {mockOutput ? (config.aggregation === 'median' ? '93.9%' : '95.5%') : '—'}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {mockOutput ? `Versus 95.5% Centralized Baseline` : 'Local vs federated model metrics'}
                  </span>
                </div>

              </div>

              {!mockOutput && simulationState === 'idle' && (
                <div className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Awaiting Simulation Submission</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Click <strong>Preview Contract Execution</strong> to test the frontend simulation loop and inspect the mock telemetry metrics adhering to <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">SIMULATION-INTEGRATION.md</code>.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-1.5 max-h-64 overflow-y-auto">
              <div className="text-slate-500 text-[11px] pb-2 border-b border-slate-800 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Simulation Event Stream</span>
              </div>
              {mockOutput?.logs ? (
                mockOutput.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-600">[{log.timestamp}]</span>
                    <span className={clsx(
                      "font-bold text-[10px] px-1 rounded",
                      log.level === 'SUCCESS' ? "bg-emerald-900/50 text-emerald-300" : "bg-slate-800 text-slate-300"
                    )}>
                      {log.level}
                    </span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic py-4 text-center">
                  Simulation log is empty. No run has been submitted.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Contract Details */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">SIMULATION DETAILS</span>
                <h3 className="text-base font-bold text-slate-900">Backend Integration Contract</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The future run is intended to configure a research experiment across the documented three-client topology. The selected client dataset proxy and aggregation method will be passed to a backend once that contract is agreed.
            </p>

            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <li>Three clients are based on the documented Phase 7.3 study topology.</li>
              <li>Round and epoch values are frontend demo defaults only and require backend and experiment-owner agreement.</li>
              <li>No raw patient samples, unencrypted hospital records, or training requests leave edge boundaries.</li>
              <li>Results will remain empty until returned by a real backend execution.</li>
            </ul>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
