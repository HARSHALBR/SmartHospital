import React, { useState } from 'react';
import { ShieldAlert, FileText, Database, Shield, Server, ArrowRight, Activity } from 'lucide-react';
import { VerifiedBadge, SimulationBadge, NotEstablishedBadge } from '../components/StatusBadges';

export default function AttackSimulation() {
  const [text, setText] = useState("Patient reports persistent cough and elevated temperature for three days.");
  const [scenario, setScenario] = useState('raw');
  const [attackCategory, setAttackCategory] = useState('raw-text');

  return (
    <div className="space-y-6 relative max-w-6xl mx-auto">
      <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">RESEARCH DEMONSTRATION — SYNTHETIC DATA ONLY</div>
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Controlled Medical-Data Attack Simulation</h1>
          <p className="text-slate-500 mt-2">Synthetic demonstration of raw-text exposure vs semantic-vector exposure.</p>
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 text-amber-900 text-sm font-medium space-y-2">
        <div className="flex items-center"><ShieldAlert className="w-5 h-5 mr-3 flex-shrink-0" /> <strong>IMPORTANT SCIENTIFIC DISCLAIMERS</strong></div>
        <ul className="list-disc list-inside pl-8 space-y-1 mt-2">
          <li>This demonstration uses synthetic clinical text.</li>
          <li>This visualization does not perform real clinical-text reconstruction.</li>
          <li>No measured reconstruction accuracy is claimed.</li>
          <li>Semantic embeddings may still leak information through inference or reconstruction attacks.</li>
          <li>Federated learning alone is not a formal privacy guarantee.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Synthetic Clinical Note</h3>
          <textarea 
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter synthetic demonstration text..."
            spellCheck="false"
          />
          <p className="text-xs text-slate-400 mt-2 italic">Frontend-only component. Text is never logged or transmitted.</p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex space-x-2 mb-6 bg-slate-50 p-2 rounded-lg border border-slate-200 inline-flex self-start">
            <button onClick={() => setScenario('raw')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${scenario === 'raw' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Scenario A: Raw Text Exposure</button>
            <button onClick={() => setScenario('vector')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${scenario === 'vector' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Scenario B: Semantic Vector Exposure</button>
          </div>

          <div className="flex-grow flex flex-col justify-center">
            {scenario === 'raw' ? (
              <div className="flex flex-col md:flex-row items-center justify-between bg-rose-50 p-6 rounded-lg border border-rose-200">
                <div className="text-center w-40"><FileText className="w-8 h-8 text-slate-500 mb-2 mx-auto" /><span className="font-semibold block text-sm">Synthetic Note</span></div>
                <ArrowRight className="w-6 h-6 text-rose-300 my-2" />
                <div className="text-center w-40"><Server className="w-8 h-8 text-rose-500 mb-2 mx-auto" /><span className="font-semibold block text-sm">Direct Exposure</span></div>
                <ArrowRight className="w-6 h-6 text-rose-300 my-2" />
                <div className="text-center w-40"><ShieldAlert className="w-8 h-8 text-rose-600 mb-2 mx-auto" /><span className="font-semibold block text-sm">Attacker View</span><span className="text-xs text-rose-700 mt-1 block">Readable Text</span></div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="text-center w-32"><FileText className="w-8 h-8 text-slate-500 mb-2 mx-auto" /><span className="font-semibold block text-sm">Synthetic Note</span></div>
                <ArrowRight className="w-6 h-6 text-indigo-300 my-2" />
                <div className="text-center w-32"><Database className="w-8 h-8 text-indigo-500 mb-2 mx-auto" /><span className="font-semibold block text-sm">Bio_ClinicalBERT</span><span className="text-xs text-indigo-600 block">768-D representation</span></div>
                <ArrowRight className="w-6 h-6 text-indigo-300 my-2" />
                <div className="text-center w-32"><Activity className="w-8 h-8 text-indigo-600 mb-2 mx-auto" /><span className="font-semibold block text-sm">Attacker View</span><span className="text-xs text-indigo-700 mt-1 block">Abstract Vector</span></div>
              </div>
            )}
          </div>

          {scenario === 'raw' ? (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 text-sm">
              <span className="font-bold text-rose-600 block mb-1">DIRECT TEXT VISIBILITY: HIGH</span>
              An attacker observing an unprotected raw-text channel can directly read the supplied synthetic note.
            </div>
          ) : (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 text-sm">
              <span className="font-bold text-slate-500 block mb-2">[ • • • • • • • • • • ... ]</span>
              <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 mb-2 inline-block">LIVE EMBEDDING GENERATION NOT ENABLED</span>
              <p>768-D semantic representation. Semantic vectorization reduces direct exposure of readable text, but does not provide a guarantee against inference or reconstruction.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Security Comparison</h3>
          
          <div className="space-y-6">
            <div className="border border-rose-200 rounded-lg overflow-hidden">
              <div className="bg-rose-50 px-4 py-2 border-b border-rose-200 font-bold text-rose-900 text-sm">RAW TEXT EXPOSURE</div>
              <div className="p-4 bg-white text-sm space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Direct readability:</span> <span className="font-bold text-rose-600">HIGH</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Direct semantic exposure:</span> <span className="font-bold text-rose-600">HIGH</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Reconstruction required:</span> <span className="font-bold text-slate-800">NO</span></div>
              </div>
            </div>

            <div className="border border-indigo-200 rounded-lg overflow-hidden">
              <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-200 font-bold text-indigo-900 text-sm">VECTOR EXPOSURE</div>
              <div className="p-4 bg-white text-sm space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">Direct readability:</span> <span className="font-bold text-emerald-600">LOW</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Semantic inference risk:</span> <span className="font-bold text-amber-600">POSSIBLE</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Reconstruction/inference:</span> <span className="font-bold text-slate-800">REQUIRES ADDITIONAL ATTACK</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Privacy guarantee:</span> <span className="font-bold text-slate-800">NONE</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Federated Architecture Flow</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center flex-grow justify-center space-y-4 relative">
            <div className="absolute top-2 left-2 text-xs font-bold text-slate-400">CONCEPTUAL ATTACK SURFACE</div>
            
            <div className="border-2 border-indigo-200 rounded p-4 w-full text-center bg-white relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs font-bold text-indigo-400">CLIENT</span>
              <div className="text-sm text-slate-600">Synthetic clinical data</div>
              <ArrowDown className="w-4 h-4 mx-auto my-1 text-slate-300" />
              <div className="text-sm font-bold text-slate-700">Local processing</div>
              <ArrowDown className="w-4 h-4 mx-auto my-1 text-slate-300" />
              <div className="text-sm text-indigo-600 font-semibold">Local model update</div>
            </div>
            
            <ArrowDown className="w-6 h-6 text-slate-400" />
            
            <div className="border-2 border-emerald-200 rounded p-4 w-full text-center bg-white">
              <div className="text-sm font-bold text-emerald-700">SERVER</div>
            </div>
            
            <p className="text-xs text-slate-500 mt-4 text-center">
              Raw clinical text remains local in the simulated federated workflow. Model updates/parameters are exchanged in the experimental federated workflow.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Attack Types</h3>
          <div className="flex flex-col space-y-2">
            {['raw-text', 'embedding', 'model-update', 'reconstruction'].map(cat => (
              <button
                key={cat}
                onClick={() => setAttackCategory(cat)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${attackCategory === cat ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                {cat === 'raw-text' && '1. Raw-text exposure'}
                {cat === 'embedding' && '2. Embedding exposure'}
                {cat === 'model-update' && '3. Model-update exposure'}
                {cat === 'reconstruction' && '4. Reconstruction/inference risk'}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Attack Surface Details</h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[150px] flex items-center">
            {attackCategory === 'raw-text' && <p className="text-sm text-slate-700">If raw medical text is transmitted without encryption or semantic abstraction, an adversary can intercept the data directly. The exposure is high, and no inference algorithms are needed to read the data.</p>}
            {attackCategory === 'embedding' && <p className="text-sm text-slate-700">If raw 768-D embeddings are transmitted, the adversary cannot immediately read the text. However, embeddings preserve semantic distance, potentially exposing patient conditions through clustering or nearest-neighbor attacks.</p>}
            {attackCategory === 'model-update' && <p className="text-sm text-slate-700">In federated learning, only model gradients/weights are shared. However, if these gradients are unprotected, adversaries might reconstruct training data through gradient inversion attacks.</p>}
            {attackCategory === 'reconstruction' && <p className="text-sm text-slate-700">A reconstruction attack utilizes inverse models to map abstract representations (embeddings or gradients) back to the original input space. Semantic vectorization mitigates casual reading, but a determined adversary with an auxiliary dataset could potentially reconstruct sensitive tokens.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Verified Phase 9 Security Findings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <span className="block text-xs uppercase text-slate-500 mb-2">Data Locality</span>
            <VerifiedBadge />
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <span className="block text-xs uppercase text-slate-500 mb-2">Differential Privacy</span>
            <NotEstablishedBadge />
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <span className="block text-xs uppercase text-slate-500 mb-2">Secure Aggregation</span>
            <SimulationBadge />
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <span className="block text-xs uppercase text-slate-500 mb-2">Byzantine Robustness</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              CONTROLLED SIGN-FLIP ATTACK EXPERIMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowDown({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
}
