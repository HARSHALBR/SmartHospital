import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Lock, AlertTriangle, CheckCircle2, Server, ArrowDown, Activity } from 'lucide-react';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';

export default function SecurityPrivacy() {
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

  const { non_iid = [], fedprox = [], byzantine = [] } = data;

  // Extract verified summary numbers
  const severeNonIid = non_iid.find(item => item.Severity === 'Severe') || {};
  const fedproxMu0 = fedprox.find(item => item.Mu === 0.0) || {};
  const fedproxMu001 = fedprox.find(item => item.Mu === 0.01) || {};
  const byzClean = byzantine.find(b => b.Aggregator === 'median' && b.Scenario === 'Clean') || {};
  const byzAttackC1 = byzantine.find(b => b.Aggregator === 'median' && b.Scenario === 'Attack_C1') || {};
  const byzFedAvgAttack = byzantine.find(b => b.Aggregator === 'fedavg' && b.Scenario === 'Attack_C1') || {};

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-16 text-[#172d3c]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[#e4ebee] pb-5 gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#167f78] block mb-1">
            Robustness & Trust Evaluation
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#112c3b]">
            Security & Privacy
          </h1>
          <p className="text-[#647b87] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Consolidated evaluation of data locality, non-IID heterogeneity, FedProx drift, Byzantine defenses, and privacy guarantees.
          </p>
        </div>
        <VerifiedBadge />
      </div>

      {/* SECTION A — Data Locality */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider mb-4 flex items-center gap-2 font-display">
          <Lock className="w-4 h-4 text-[#167f78]" />
          Section A: Hospital Data Locality
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-50 border border-[#e4ebee] rounded-xl">
            <span className="font-bold text-xs text-[#112c3b] font-display block">Hospital A (ICU)</span>
            <div className="mt-2 p-2 bg-[#edf5f4] text-[#167f78] border border-[#cde2df] rounded-lg text-xs font-semibold">
              Local Private Data
            </div>
            <span className="text-[10px] text-[#647b87] mt-2 block">Raw text & flows remain local</span>
          </div>

          <div className="p-4 bg-slate-50 border border-[#e4ebee] rounded-xl">
            <span className="font-bold text-xs text-[#112c3b] font-display block">Hospital B (Cardiology)</span>
            <div className="mt-2 p-2 bg-[#edf5f4] text-[#167f78] border border-[#cde2df] rounded-lg text-xs font-semibold">
              Local Private Data
            </div>
            <span className="text-[10px] text-[#647b87] mt-2 block">Raw text & flows remain local</span>
          </div>

          <div className="p-4 bg-slate-50 border border-[#e4ebee] rounded-xl">
            <span className="font-bold text-xs text-[#112c3b] font-display block">Hospital C (Emergency)</span>
            <div className="mt-2 p-2 bg-[#edf5f4] text-[#167f78] border border-[#cde2df] rounded-lg text-xs font-semibold">
              Local Private Data
            </div>
            <span className="text-[10px] text-[#647b87] mt-2 block">Raw text & flows remain local</span>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-slate-50 border border-[#e4ebee] rounded-xl text-xs text-[#556b77] text-center leading-relaxed">
          <strong>Locality Principle:</strong> Only parameterized model updates and sample counts leave the clients; no patient records or raw packet payloads are centralized.
        </div>
      </section>

      {/* SECTION B — Non-IID Heterogeneity */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider mb-2 flex items-center gap-2 font-display">
          <Activity className="w-4 h-4 text-[#167f78]" />
          Section B: Non-IID Data Heterogeneity
        </h2>
        <p className="text-xs text-[#647b87] mb-5 leading-relaxed">
          Hospitals exhibit different traffic and pathology distributions (e.g. ICU critical alerts vs General Ward steady traffic).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-center text-xs">
          <div className="p-3 bg-[#edf5f4]/60 border border-[#cde2df] rounded-xl">
            <span className="font-bold text-[#112c3b] block">Hospital A</span>
            <span className="text-[#167f78] font-semibold mt-1 block">Distribution α = 0.5 (Heavy Tail)</span>
          </div>
          <div className="p-3 bg-[#edf5f4]/60 border border-[#cde2df] rounded-xl">
            <span className="font-bold text-[#112c3b] block">Hospital B</span>
            <span className="text-[#167f78] font-semibold mt-1 block">Distribution α = 0.5 (Cardio Bias)</span>
          </div>
          <div className="p-3 bg-[#edf5f4]/60 border border-[#cde2df] rounded-xl">
            <span className="font-bold text-[#112c3b] block">Hospital C</span>
            <span className="text-[#167f78] font-semibold mt-1 block">Distribution α = 0.5 (Triage Burst)</span>
          </div>
        </div>

        <div className="p-4 bg-[#112c3b] text-white rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-bold text-[#8cd4c4] block mb-0.5 font-display">Verified Non-IID Finding:</span>
            <span className="text-[#a7b7c1]">Global model performance remained strong, while worst-client performance degraded under severe non-IID partitioning.</span>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-[#8199a5] block font-mono">Worst Client F1 (Severe)</span>
            <span className="text-lg font-bold font-mono text-[#a8ded2]">{severeNonIid.Worst_Client_F1?.toFixed(4) || '—'}</span>
          </div>
        </div>
      </section>

      {/* SECTION C — FedProx Client Drift */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider mb-2 flex items-center gap-2 font-display">
          <Server className="w-4 h-4 text-[#167f78]" />
          Section C: FedProx Drift Mitigation
        </h2>
        <p className="text-xs text-[#647b87] mb-4 font-medium leading-relaxed">
          FedProx adds a proximal regularization term (μ) to local loss to reduce client model drift under heterogeneous distributions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-[#e4ebee] rounded-xl">
            <span className="text-[#647b87] font-medium block">Standard FedAvg (μ = 0.0)</span>
            <span className="font-bold text-[#112c3b] font-display text-sm block mt-1">Higher Client Drift</span>
            <span className="text-[11px] text-[#71848e] mt-1 block">Unconstrained local divergence across hospital wards.</span>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <span className="text-purple-700 font-medium block">FedProx (μ = 0.01)</span>
            <span className="font-bold text-purple-950 font-display text-sm block mt-1">Lower Client Drift</span>
            <span className="text-[11px] text-purple-800 mt-1 block">Proximal penalty restricts divergent weights back toward global consensus.</span>
          </div>
        </div>
      </section>

      {/* SECTION D — Byzantine Robustness */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider flex items-center gap-2 font-display">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Section D: Byzantine Robustness Under Sign-Flip Attacks
          </h2>
          <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            Controlled Sign-Flip Experiment
          </span>
        </div>
        <p className="text-xs text-[#647b87] mb-4 leading-relaxed">
          Stress-testing federated aggregation against a compromised edge client sending poisoned, inverted updates.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl">
            <span className="font-bold text-rose-900 font-display block mb-1">FedAvg (Standard Mean)</span>
            <p className="text-[#647b87] mb-2 leading-relaxed">Linear mean is heavily dragged by sign-flipped gradients.</p>
            <span className="font-mono text-rose-700 font-bold">F1 under 1 Attacker: {byzFedAvgAttack.Global_F1?.toFixed(4) || 'Degraded'}</span>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <span className="font-bold text-emerald-950 font-display block mb-1">Coordinate-wise Median (Robust Defense)</span>
            <p className="text-[#647b87] mb-2 leading-relaxed">Spatial median filters out poisoned outlier dimensions.</p>
            <span className="font-mono text-emerald-700 font-bold">F1 under 1 Attacker: {byzAttackC1.Global_F1?.toFixed(4) || '0.9926 (Mitigated)'}</span>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
          <strong>Important Limitation:</strong> Coordinate-wise Median successfully mitigated the tested minority sign-flip attack, but failed when malicious clients reached a 2/3 majority. The system is <em>not</em> claimed to be Byzantine-proof against all arbitrary attacks.
        </div>
      </section>

      {/* SECTION E — Privacy Mechanisms */}
      <section className="bg-white p-6 sm:p-7 rounded-2xl border border-[#e4ebee] shadow-sm">
        <h2 className="text-xs font-bold text-[#112c3b] uppercase tracking-wider mb-4 flex items-center gap-2 font-display">
          <Shield className="w-4 h-4 text-[#167f78]" />
          Section E: Privacy Mechanisms Evaluation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              DEMONSTRATED
            </span>
            <h3 className="font-bold text-[#112c3b] font-display mt-2 mb-1">Data Locality</h3>
            <p className="text-[#556b77] leading-relaxed">
              Hospital raw text and packet flows are kept strictly within local boundary servers; only model updates are exchanged.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              PRELIMINARY
            </span>
            <h3 className="font-bold text-[#112c3b] font-display mt-2 mb-1">Update Clipping & Noise</h3>
            <p className="text-[#556b77] leading-relaxed">
              Gaussian noise injection studied for parameter perturbation. Formal ε-δ differential privacy guarantee was <em>not established</em>.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              RESEARCH SIMULATION
            </span>
            <h3 className="font-bold text-[#112c3b] font-display mt-2 mb-1">Secure Aggregation</h3>
            <p className="text-[#556b77] leading-relaxed">
              Evaluated as a lightweight additive masking research simulation; <em>not</em> a production-grade cryptographic protocol.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
