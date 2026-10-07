import React from 'react';
import { VerifiedBadge } from '../components/StatusBadges';

export default function Dataset() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dataset Analysis</h1>
          <p className="text-slate-500 mt-2">Information regarding the core experimental data sources.</p>
        </div>
        <VerifiedBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Edge-IIoTset (Network Flows)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Edge-IIoTset is an industrial IoT cybersecurity dataset. It serves as the primary evaluation benchmark for the network anomaly detection task.
          </p>
          <ul className="space-y-2 text-sm text-slate-700 font-medium">
            <li className="flex justify-between border-b pb-1"><span>Total Rows</span> <span>~20.1M (Subsampled to 10%)</span></li>
            <li className="flex justify-between border-b pb-1"><span>Total Features</span> <span>61 Raw (Reduced to 31 Edge Features)</span></li>
            <li className="flex justify-between border-b pb-1"><span>Attack/Normal</span> <span>Imbalanced Partitioning</span></li>
            <li className="flex justify-between border-b pb-1"><span>Preprocessing</span> <span>Canonical Flow Identification + MinMax Scaling</span></li>
            <li className="flex justify-between border-b pb-1"><span>Data Splits</span> <span>Train (70%), Val (15%), Test (15%)</span></li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4">MTSamples (Clinical Text)</h2>
          <p className="text-sm text-slate-600 mb-4 font-semibold text-indigo-700 bg-indigo-50 p-3 rounded">
            MTSamples is used as a public clinical-text development proxy. 
          </p>
          <p className="text-sm text-slate-600 mb-4">
            It provides representative medical vocabulary and structural syntax for semantic embedding development without exposing sensitive PHI.
          </p>
          <ul className="space-y-2 text-sm text-slate-700 font-medium">
            <li className="flex justify-between border-b pb-1"><span>Total Notes</span> <span>~4.9k</span></li>
            <li className="flex justify-between border-b pb-1"><span>Model Target</span> <span>Bio_ClinicalBERT</span></li>
            <li className="flex justify-between border-b pb-1"><span>Embedding Dim</span> <span>768-D Space</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
