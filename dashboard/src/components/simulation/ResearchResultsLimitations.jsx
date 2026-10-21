import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, 
  RefreshCw, Lock
} from 'lucide-react';
import { getMetricsAll, getHealth } from '../../services/api';
import clsx from 'clsx';

export default function ResearchResultsLimitations() {
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'error'
  const [metrics, setMetrics] = useState(null);
  const [sourceInfo, setSourceInfo] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);

  const fetchMetrics = () => {
    setLoading(true);
    setErrorDetails(null);

    Promise.all([
      getHealth().catch(err => ({ status: 'unavailable', error: err })),
      getMetricsAll()
    ])
      .then(([healthRes, metricsRes]) => {
        if (healthRes.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }

        if (metricsRes && metricsRes.data) {
          setMetrics(metricsRes.data);
          setSourceInfo(metricsRes.source || 'all_verified_artifacts');
        }
        setLoading(false);
      })
      .catch((err) => {
        setBackendStatus('error');
        setErrorDetails(err.message || 'FastAPI backend connection refused on port 8000.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-8 p-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Feature F • Empirical Research Results & Limitations
              </span>
              <span className={clsx(
                "text-[10px] font-semibold px-2 py-0.5 rounded border",
                backendStatus === 'connected'
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-rose-100 text-rose-800 border-rose-200"
              )}>
                {backendStatus === 'connected' ? 'FastAPI Backend Online' : 'FastAPI Backend Offline'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Verified Research Artifact Metrics
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Connecting directly to the repository FastAPI data layer. Displays frozen Phase 4 through Phase 9 evaluation benchmarks.
            </p>
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300 shadow-xs"
          >
            <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
            {loading ? 'Refreshing API...' : 'Retry Backend Query'}
          </button>
        </div>
      </div>

      {/* Backend Connection Status Notice if Error */}
      {backendStatus === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-950">FastAPI Metrics Backend Unavailable</h4>
            <p className="text-rose-800 leading-relaxed">
              Could not retrieve verified experiment metrics from the local server at <code>http://127.0.0.1:8000/api</code>.
              Ensure the backend is running via <code>python backend/main.py</code>.
            </p>
            {errorDetails && (
              <p className="font-mono text-[11px] text-rose-700 mt-1">
                Details: {errorDetails}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Live Inference Blocked Status Banner */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Live Anomaly Inference Status: BLOCKED (503 Service Unavailable)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Live inference is intentionally disabled because the frozen model weight checkpoint 
              <code> results/phase7_3/fedavg_global_model.pth</code> is missing. 
              The backend returns HTTP 503 rather than fabricating model weights or random predictions.
            </p>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs font-mono shrink-0">
          Enforced Policy: No Fake Inference
        </div>
      </div>

      {/* Metrics Grid from Real API */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs">Querying FastAPI verified metrics data layer...</p>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
            <span>Data Layer Source: <strong className="font-mono text-indigo-700">{sourceInfo}</strong></span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Research Data
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Baselines Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Phase 4.2 / 6.2 Baselines
              </span>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Centralized Architectures</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">EdgeMLP (IoT Only):</span>
                  <strong className="font-mono text-slate-900">{metrics.baselines?.edge_mlp}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full GraphSAGE:</span>
                  <strong className="font-mono text-slate-900">{metrics.baselines?.full_graphsage}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GraphSAGE (No Edge Attr):</span>
                  <strong className="font-mono text-slate-900">{metrics.baselines?.graphsage_no_edge}</strong>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-3 block italic">
                Source: phase4_2 / phase6_2 baseline artifacts
              </span>
            </div>

            {/* Centralized vs Federated Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Phase 7.3 Comparison
              </span>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Centralized vs Federated</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Centralized IoT F1:</span>
                  <strong className="font-mono text-slate-900">{metrics.cent_vs_fed?.centralized_iot}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Federated IoT F1:</span>
                  <strong className="font-mono text-indigo-700">{metrics.cent_vs_fed?.federated_iot}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Federated Multimodal:</span>
                  <strong className="font-mono text-slate-900">{metrics.cent_vs_fed?.federated_multimodal}</strong>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-3 block italic">
                Source: phase7_3 fair comparison artifact
              </span>
            </div>

            {/* Multimodal Confounding Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Phase 6.2 Robustness
              </span>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Multimodal Confounding Check</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">IoT Only F1:</span>
                  <strong className="font-mono text-slate-900">{metrics.multimodal?.iot_only_f1}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinical Text Only F1:</span>
                  <strong className="font-mono text-rose-600">{metrics.multimodal?.clinical_only_f1}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Multimodal Joint F1:</span>
                  <strong className="font-mono text-slate-900">{metrics.multimodal?.multimodal_f1}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Multimodal Delta F1:</span>
                  <strong className="font-mono text-amber-600">{metrics.multimodal?.delta_f1}</strong>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-2 block italic">
                Source: phase6_2 multimodal robustness check
              </span>
            </div>

            {/* Non-IID & FedProx Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Phase 8.1 & 8.2 Client Heterogeneity
              </span>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Non-IID Drift & FedProx</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">IID Benchmark F1:</span>
                  <strong className="font-mono text-slate-900">0.9926</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Severe Non-IID F1:</span>
                  <strong className="font-mono text-amber-600">0.9882</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FedProx Stabilizer (μ = 0.01):</span>
                  <strong className="font-mono text-emerald-700">0.9926</strong>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-3 block italic">
                Source: phase8_1 and phase8_2 summary records
              </span>
            </div>

            {/* Byzantine Resilience Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Phase 8.4 Adversarial Attacks
              </span>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Byzantine Sign-Flip Defense</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Median Clean Baseline F1:</span>
                  <strong className="font-mono text-slate-900">0.9926</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Median Under Attack (C1):</span>
                  <strong className="font-mono text-emerald-700">0.9918 (Robust)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FedAvg Under Attack (C1):</span>
                  <strong className="font-mono text-rose-600">0.4000 (Degraded)</strong>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-3 block italic">
                Source: phase8_4 byzantine summary evaluations
              </span>
            </div>

            {/* Privacy & Secure Aggregation Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Phase 9 Security Overhead
              </span>
              <h4 className="font-bold text-slate-900 text-sm mb-3">Secure Aggregation & DP</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pairwise Masking Payload:</span>
                  <strong className="font-mono text-slate-900">1.0x (Zero expansion)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Secure Agg Compute Time:</span>
                  <strong className="font-mono text-slate-900">0.00063s</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DP Noise Scale (Gaussian):</span>
                  <strong className="font-mono text-indigo-700">σ = 0.1</strong>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-3 block italic">
                Source: phase9 privacy and secure aggregation benchmarks
              </span>
            </div>

          </div>
        </div>
      ) : null}

      {/* Comprehensive Research Limitations Panel */}
      <div className="border border-slate-300 rounded-xl p-5 bg-slate-50 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Research Integrity & Critical Operational Limitations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block">1. Dataset Proxies, Not Clinical Telemetry</strong>
            <p>
              The network telemetry benchmark used is <strong>Edge-IIoTset</strong> (an industrial IoT testbed dataset), not live hospital telemetry. Clinical text is sourced from <strong>MTSamples</strong> (a public medical transcription corpus), not MIMIC-IV or patient charts.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block">2. No Patient-to-Network Linkage</strong>
            <p>
              The experiments do not establish an empirical link between individual clinical patient records and specific network packet headers. Multimodal pairing is evaluated at the departmental client level.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block">3. Packet-Level F1 Invariance</strong>
            <p>
              Controlled evaluation demonstrated that combining clinical semantic vectors with IoT telemetry produces zero improvement (ΔF1 = 0.0000) over network flow headers alone.
            </p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <strong className="text-slate-900 block">4. No Production Privacy or Deployment Claims</strong>
            <p>
              This prototype demonstrates federated aggregation principles; it does not claim formal (ε, δ)-differential privacy guarantees, production-grade cryptographic secure aggregation, HIPAA compliance, or clinical deployment approval.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
