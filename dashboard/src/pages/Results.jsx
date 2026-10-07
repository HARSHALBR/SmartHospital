import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, TrendingUp, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';

export default function Results() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMetricsAll()
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error('Failed to load metrics:', err);
        setError(true);
      });
  }, []);

  if (error) return <ErrorState />;
  if (!data) return <LoadingState />;

  const { baselines = {}, multimodal = {}, cent_vs_fed = {}, non_iid = [], byzantine = [] } = data;
  const severeNonIid = non_iid.find(item => item.Severity === 'Severe') || {};
  const medClean = byzantine.find(b => b.Aggregator === 'median' && b.Scenario === 'Clean') || {};
  const medC1 = byzantine.find(b => b.Aggregator === 'median' && b.Scenario === 'Attack_C1') || {};

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-slate-900 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
            Empirical Findings
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">Key Research Results</h1>
          <p className="text-slate-500 text-sm mt-1">
            Empirical research findings across Phases 1–9 verified evaluations loaded dynamically from backend artifacts.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* Primary Comparison Table: Centralized vs Federated (Section L) */}
      <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Centralized vs Federated Parity Evaluation
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Phase 7.3 Fair Comparison</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Architecture Setup</th>
                <th className="py-2.5 px-3">Centralized IoT</th>
                <th className="py-2.5 px-3">Federated IoT (FedAvg)</th>
                <th className="py-2.5 px-3">Observed Gap</th>
                <th className="py-2.5 px-3">Data Locality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3 px-3 font-bold text-slate-800">Edge MLP Benchmark</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  {cent_vs_fed.centralized_iot ? `${(cent_vs_fed.centralized_iot * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                  {cent_vs_fed.federated_iot ? `${(cent_vs_fed.federated_iot * 100).toFixed(2)}%` : '—'}
                </td>
                <td className="py-3 px-3 font-mono text-slate-600">
                  {cent_vs_fed.gap !== undefined ? `${(cent_vs_fed.gap * 100).toFixed(2)}%` : '0.00%'}
                </td>
                <td className="py-3 px-3 text-emerald-700 font-semibold">100% Preserved</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
          <strong>Key Interpretation:</strong> Federated performance was comparable to centralized training under the matched experimental setup, demonstrating that hospital edge data locality can be preserved without degradation in detection accuracy.
        </div>
      </div>

      {/* 4 Core Research Findings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Centralized Baseline */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Finding 1 • Baseline
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">Phase 4.2</span>
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-2">Centralized Baseline Performance</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Edge MLP was the strongest validated baseline. GraphSAGE without edge features underperformed, while full GraphSAGE matched Edge MLP.
            </p>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Edge MLP F1:</span>
                <span className="font-bold text-indigo-600">{baselines.edge_mlp?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">GraphSAGE (No Edge) F1:</span>
                <span className="font-bold text-slate-700">{baselines.graphsage_no_edge?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Full GraphSAGE F1:</span>
                <span className="font-bold text-slate-700">{baselines.full_graphsage?.toFixed(4) || '—'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>Key takeaway:</strong> Graph topology models relational device interactions, but does not outperform Edge MLP on raw packet-level classification.
          </div>
        </div>

        {/* Card 2: Multimodal Fusion */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Finding 2 • Multimodal
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">Phase 6.2</span>
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-2">Multimodal Fusion Evaluation</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Clinical semantic representations did <strong>not</strong> produce a meaningful packet-level F1 improvement in the controlled evaluation.
            </p>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">IoT Edge MLP F1:</span>
                <span className="font-bold text-slate-700">{multimodal.edge_mlp?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Early Fusion F1:</span>
                <span className="font-bold text-purple-700">{multimodal.early_fusion?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Late Fusion F1:</span>
                <span className="font-bold text-purple-700">{multimodal.late_fusion?.toFixed(4) || '—'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <strong>Critical Negative Finding:</strong> Network flow signatures dominate anomaly detection; clinical text provides contextual cross-verification rather than packet-level classification gains.
          </div>
        </div>

        {/* Card 3: Federated Learning */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Finding 3 • Federation
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">Phase 7.3</span>
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-2">Federated Learning Convergence</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Federated training across distributed clients converges rapidly to the centralized benchmark while maintaining strict client data locality.
            </p>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Centralized F1:</span>
                <span className="font-bold text-slate-700">{cent_vs_fed.centralized_iot?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Federated F1:</span>
                <span className="font-bold text-emerald-600">{cent_vs_fed.federated_iot?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Parity Delta:</span>
                <span className="font-bold text-slate-900">{cent_vs_fed.gap !== undefined ? cent_vs_fed.gap?.toFixed(4) : '0.0000'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>Key takeaway:</strong> Local edge training eliminates the need to transmit sensitive medical network flows to a central cloud server.
          </div>
        </div>

        {/* Card 4: Non-IID & Robustness */}
        <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                Finding 4 • Robustness
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">Phase 8</span>
            </div>

            <h2 className="text-base font-bold text-slate-900 mb-2">Non-IID & Byzantine Robustness</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Non-IID primarily degraded worst-client performance. FedProx reduced drift with marginal gain. Coordinate-wise Median mitigated minority sign-flip attacks.
            </p>

            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Worst Client F1 (Severe Non-IID):</span>
                <span className="font-bold text-amber-600">{severeNonIid.Worst_Client_F1?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Median Aggregator (Clean):</span>
                <span className="font-bold text-emerald-600">{medClean.Global_F1?.toFixed(4) || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Median Aggregator (1 Attacker):</span>
                <span className="font-bold text-emerald-600">{medC1.Global_F1?.toFixed(4) || '—'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>Key takeaway:</strong> Coordinate-wise Median successfully mitigated minority sign-flip poisoning, but failed under majority adversarial attacks.
          </div>
        </div>

      </div>

    </div>
  );
}
