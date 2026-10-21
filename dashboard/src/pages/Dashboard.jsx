import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMetricsAll } from '../services/api';
import { LoadingState, ErrorState } from '../components/FeedbackStates';
import { VerifiedBadge } from '../components/StatusBadges';
import {
  Network, FileText, Database, Shield, AlertTriangle,
  CheckCircle2, ArrowRight, Activity, Users, Info, Cpu, Layers,
  Radio, Share2
} from 'lucide-react';

export default function Dashboard() {
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

  // Format KPIs matching the Friend's exact values from verified API metrics
  const edgeMlpKpi = data.baselines?.edge_mlp ? `${(data.baselines.edge_mlp * 100).toFixed(2)}%` : '99.26%';
  const fedIotKpi = data.cent_vs_fed?.federated_iot ? `${(data.cent_vs_fed.federated_iot * 100).toFixed(2)}%` : '99.27%';

  return (
    <div className="space-y-6 max-w-[1180px] mx-auto pb-16 font-sans">

      {/* 1. Friend's UI Hero Banner */}
      <section className="relative overflow-hidden rounded-[17px] p-8 md:p-9 text-white shadow-[0_14px_34px_rgba(34,93,96,0.24)] bg-gradient-to-r from-[#153f50] via-[#176a69] to-[#428c83] min-h-[250px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Background Decorative Circles */}
        <div className="absolute -right-12 -top-24 w-80 h-80 rounded-full border border-white/10 pointer-events-none shadow-[0_0_0_26px_rgba(255,255,255,0.03),0_0_0_56px_rgba(255,255,255,0.02)]" />

        {/* Hero Left Copy */}
        <div className="lg:col-span-7 relative z-10 space-y-3">
          <span className="text-[9px] font-extrabold tracking-[1.25px] text-[#a9ded3] uppercase block">
            FEDERATED LEARNING · IOT SECURITY · RESEARCH
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-[1.15] tracking-tight text-white m-0">
            Learning together.<br />Keeping data at the edge.
          </h1>
          <p className="text-[#d1e6e4] text-xs sm:text-[13px] leading-relaxed max-w-xl pb-2">
            A research demonstration studying whether hospital edge clients can identify IoT anomalies collaboratively, while raw records remain local.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/results"
              className="inline-flex items-center gap-2 bg-[#a8ded2] text-[#164f53] hover:bg-[#bbf0e5] font-display font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-xs"
            >
              <span>Explore verified results</span>
              <span>↗</span>
            </Link>
            <Link
              to="/data"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-display font-semibold text-xs px-4 py-2.5 rounded-lg transition-all"
            >
              <span>Understand data & method</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Hero Right Art: 3 Edge Hospital Nodes */}
        <div className="lg:col-span-5 relative z-10 flex items-center justify-center min-h-[175px]">
          <div className="relative w-full max-w-[320px] h-[175px]">

            {/* SVG Connecting Dashed Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 175">
              <line x1="85" y1="42" x2="160" y2="125" stroke="#b6e4da" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
              <line x1="235" y1="92" x2="160" y2="125" stroke="#b6e4da" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
            </svg>

            {/* Node 1: Hospital Edge A */}
            <div className="absolute left-1 top-3 flex items-center gap-2.5 bg-[#f8fffd] text-[#244450] border border-[#d0e7e3] rounded-xl px-3 py-2 shadow-[0_12px_28px_rgba(16,46,56,0.22)]">
              <div className="w-7 h-7 rounded-lg bg-[#e4f3f0] text-[#247b74] flex items-center justify-center font-bold text-xs shrink-0">
                ⌁
              </div>
              <div>
                <span className="font-display font-bold text-[10px] text-[#244450] block">Hospital edge A</span>
                <span className="text-[8px] text-[#7b9097] block">Local model update</span>
              </div>
            </div>

            {/* Node 2: Hospital Edge B */}
            <div className="absolute right-1 top-16 flex items-center gap-2.5 bg-[#f8fffd] text-[#244450] border border-[#d0e7e3] rounded-xl px-3 py-2 shadow-[0_12px_28px_rgba(16,46,56,0.22)]">
              <div className="w-7 h-7 rounded-lg bg-[#e4f3f0] text-[#247b74] flex items-center justify-center font-bold text-xs shrink-0">
                ⌁
              </div>
              <div>
                <span className="font-display font-bold text-[10px] text-[#244450] block">Hospital edge B</span>
                <span className="text-[8px] text-[#7b9097] block">Local model update</span>
              </div>
            </div>

            {/* Node 3: Shared Model */}
            <div className="absolute left-12 bottom-1 flex items-center gap-2.5 bg-[#f8fffd] text-[#244450] border border-[#d0e7e3] rounded-xl px-3 py-2 shadow-[0_12px_28px_rgba(16,46,56,0.22)]">
              <div className="w-7 h-7 rounded-lg bg-[#e4f3f0] text-[#247b74] flex items-center justify-center font-bold text-xs shrink-0">
                ◎
              </div>
              <div>
                <span className="font-display font-bold text-[10px] text-[#244450] block">Shared model</span>
                <span className="text-[8px] text-[#7b9097] block">Parameters only</span>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 2. Friend's Exact 4 KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* KPI 1 */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71848e]">
              EDGE MLP BASELINE
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#edf5f4] text-[#167f78] flex items-center justify-center text-xs">
              ◉
            </div>
          </div>
          <div className="font-display font-extrabold text-[26px] leading-tight text-[#1b3a4a] mt-3">
            {edgeMlpKpi}
          </div>
          <span className="text-[9px] text-[#8a989e] mt-1 block">
            Centralized reference · F1
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71848e]">
              FEDERATED IOT
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#edf5f4] text-[#167f78] flex items-center justify-center text-xs">
              ◎
            </div>
          </div>
          <div className="font-display font-extrabold text-[26px] leading-tight text-[#1b3a4a] mt-3">
            {fedIotKpi}
          </div>
          <span className="text-[9px] text-[#8a989e] mt-1 block">
            FedAvg evaluation · F1
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71848e]">
              SIMULATED EDGE CLIENTS
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#edf5f4] text-[#167f78] flex items-center justify-center text-xs">
              ⌘
            </div>
          </div>
          <div className="font-display font-extrabold text-[26px] leading-tight text-[#1b3a4a] mt-3">
            3
          </div>
          <span className="text-[9px] text-[#8a989e] mt-1 block">
            Research topology
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-[#e4ebee] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71848e]">
              LIVE INFERENCE
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#edf5f4] text-[#167f78] flex items-center justify-center text-xs">
              ◌
            </div>
          </div>
          <div className="font-display font-extrabold text-[26px] leading-tight text-[#1b3a4a] mt-3">
            Blocked
          </div>
          <span className="text-[9px] text-[#8a989e] mt-1 block">
            Model artifact unavailable
          </span>
        </div>

      </section>

      {/* 3. Two-Column Grid: A Smarter Hospital Journey & What the Evidence Says */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* Left Card: A smarter hospital journey (7 cols) */}
        <section className="lg:col-span-7 bg-white border border-[#e4ebee] rounded-[14px] p-6 shadow-[0_2px_8px_rgba(27,69,81,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-4 mb-5">
              <div>
                <h2 className="font-display font-bold text-[14px] text-[#244150] m-0">
                  A smarter hospital journey
                </h2>
                <p className="text-[10px] text-[#87969d] mt-1 mb-0">
                  From network flows to a shared edge model
                </p>
              </div>
              <Link to="/data" className="text-[10px] font-bold text-[#167f78] hover:text-[#0f625f] whitespace-nowrap">
                View data & method →
              </Link>
            </div>

            {/* 5-Step Pipeline */}
            <div className="grid grid-cols-5 gap-2 pt-2 pb-4">
              <div className="text-center relative">
                <div className="w-8 h-8 rounded-full bg-[#e7f4f1] border border-[#cce7e1] text-[#367e75] font-display font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
                  01
                </div>
                <strong className="block font-display font-bold text-[10px] text-[#244150]">Prepare data</strong>
                <small className="block text-[8px] text-[#829199] mt-0.5">Proxy IoT flows + text</small>
              </div>

              <div className="text-center relative">
                <div className="w-8 h-8 rounded-full bg-[#e7f4f1] border border-[#cce7e1] text-[#367e75] font-display font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
                  02
                </div>
                <strong className="block font-display font-bold text-[10px] text-[#244150]">Build signals</strong>
                <small className="block text-[8px] text-[#829199] mt-0.5">Graphs + semantic vectors</small>
              </div>

              <div className="text-center relative">
                <div className="w-8 h-8 rounded-full bg-[#e7f4f1] border border-[#cce7e1] text-[#367e75] font-display font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
                  03
                </div>
                <strong className="block font-display font-bold text-[10px] text-[#244150]">Train locally</strong>
                <small className="block text-[8px] text-[#829199] mt-0.5">Three simulated edge clients</small>
              </div>

              <div className="text-center relative">
                <div className="w-8 h-8 rounded-full bg-[#e7f4f1] border border-[#cce7e1] text-[#367e75] font-display font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
                  04
                </div>
                <strong className="block font-display font-bold text-[10px] text-[#244150]">Aggregate</strong>
                <small className="block text-[8px] text-[#829199] mt-0.5">Model updates, no raw records</small>
              </div>

              <div className="text-center relative">
                <div className="w-8 h-8 rounded-full bg-[#e7f4f1] border border-[#cce7e1] text-[#367e75] font-display font-extrabold text-xs flex items-center justify-center mx-auto mb-2">
                  05
                </div>
                <strong className="block font-display font-bold text-[10px] text-[#244150]">Evaluate</strong>
                <small className="block text-[8px] text-[#829199] mt-0.5">Accuracy, robustness, limits</small>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-[#99a5aa] pt-3 border-t border-[#edf2f4]">
            Source: frozen experimental artifacts, Phases 1–9
          </div>
        </section>

        {/* Right Card: What the evidence says (5 cols) */}
        <section className="lg:col-span-5 bg-white border border-[#e4ebee] rounded-[14px] p-6 shadow-[0_2px_8px_rgba(27,69,81,0.04)] flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="font-display font-bold text-[14px] text-[#244150] m-0">
                What the evidence says
              </h2>
              <p className="text-[10px] text-[#87969d] mt-1 mb-0">
                Three findings that shape the project
              </p>
            </div>

            <div className="space-y-3.5">

              {/* Finding 1 */}
              <div className="flex items-start gap-2.5 pb-3 border-b border-[#eef2f3]">
                <div className="w-5 h-5 rounded-[6px] bg-[#edf5f3] text-[#167f78] font-display font-extrabold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                  01
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block font-display font-bold text-[11px] text-[#244150]">
                    Federated baseline matched centralized performance
                  </strong>
                  <p className="text-[9px] text-[#788a92] leading-relaxed mt-0.5 mb-0">
                    FedAvg IoT F1 is comparable to the centralized EdgeMLP baseline in this evaluation.
                  </p>
                </div>
                <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-[#eff7f4] text-[#5d887b] shrink-0">
                  SUPPORTED
                </span>
              </div>

              {/* Finding 2 */}
              <div className="flex items-start gap-2.5 pb-3 border-b border-[#eef2f3]">
                <div className="w-5 h-5 rounded-[6px] bg-[#edf5f3] text-[#167f78] font-display font-extrabold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                  02
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block font-display font-bold text-[11px] text-[#244150]">
                    Clinical fusion did not improve packet-level F1
                  </strong>
                  <p className="text-[9px] text-[#788a92] leading-relaxed mt-0.5 mb-0">
                    Context embeddings were evaluated; no meaningful detection lift was observed.
                  </p>
                </div>
                <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-[#fff0ec] text-[#a2544a] shrink-0">
                  NEGATIVE RESULT
                </span>
              </div>

              {/* Finding 3 */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-[6px] bg-[#edf5f3] text-[#167f78] font-display font-extrabold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                  03
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block font-display font-bold text-[11px] text-[#244150]">
                    Robustness has clear limits
                  </strong>
                  <p className="text-[9px] text-[#788a92] leading-relaxed mt-0.5 mb-0">
                    Median aggregation resisted the tested minority sign-flip attack, but failed under a malicious majority.
                  </p>
                </div>
                <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-[#fff6e6] text-[#956b2e] shrink-0">
                  QUALIFIED
                </span>
              </div>

            </div>
          </div>
        </section>

      </div>

      {/* 4. Research Boundaries & Safeguards Notice */}
      <section className="bg-white border border-[#e4ebee] rounded-[14px] p-6 shadow-[0_2px_8px_rgba(27,69,81,0.04)]">
        <h2 className="font-display font-bold text-[14px] text-[#244150] mb-3">
          Research boundaries
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] leading-relaxed">
          <div className="p-3 bg-[#fff8e9] border border-[#f1e2c4] rounded-[10px] text-[#745d36]">
            <strong className="text-[#805f28] block mb-1">Proxy datasets:</strong>
            Edge-IIoTset is industrial IoT traffic; MTSamples is public clinical text. There is no patient-to-device linkage or real hospital telemetry.
          </div>
          <div className="p-3 bg-[#f2f7f8] border border-[#e1eaed] rounded-[10px] text-[#657b84]">
            <strong className="text-[#172d3c] block mb-1">Not a clinical product:</strong>
            This platform presents frozen research results. It is not a live hospital monitoring, diagnostic, or HIPAA-certified system.
          </div>
        </div>
      </section>

    </div>
  );
}
