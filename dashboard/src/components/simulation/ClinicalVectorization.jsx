import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, RefreshCw, Info, Sparkles 
} from 'lucide-react';
import clsx from 'clsx';

// Predefined Synthetic Clinical Notes (MTSamples proxy context)
const SYNTHETIC_NOTE_PRESETS = [
  {
    id: 'note-icu',
    title: 'ICU Septic Shock & Arterial Telemetry',
    ward: 'ICU Ward',
    category: 'Critical Care',
    text: 'Bedside ICU Telemetry: Patient admitted with refractory septic shock, MAP 54 mmHg despite fluid bolus. Infusing norepinephrine at 0.18 mcg/kg/min via smart pump. Mechanical ventilation synchronized in PRVC mode. Arterial line telemetry verified patent.'
  },
  {
    id: 'note-cardio',
    title: 'Cardiology Post-CABG Arrhythmia Monitor',
    ward: 'Cardiology',
    category: 'Cardiology',
    text: 'Cardiology Ward 3A: Post-coronary artery bypass graft recovery day 2. Telemetry indicates occasional multifocal premature ventricular contractions. Heparin infusion active at 12 units/kg/hr. SpO2 stable at 97% on 2L nasal cannula.'
  },
  {
    id: 'note-emerg',
    title: 'Emergency Bay Acute Polytrauma Resuscitation',
    ward: 'Emergency',
    category: 'Trauma Care',
    text: 'Trauma Bay 1 Resuscitation: Unidentified adult with severe blunt chest trauma. Rapid blood transfusion protocol initiated via Belmont high-speed infuser. Invasive arterial blood pressure monitoring active. Patient tachycardic at 134 bpm.'
  },
  {
    id: 'note-routine',
    title: 'General Inpatient Stable Vital Telemetry',
    ward: 'Routine Inpatient',
    category: 'General Ward',
    text: 'General Inpatient 4B: Routine morning clinical observation. Patient afebrile, pulse regular at 72 bpm, blood pressure 120/78 mmHg. Peripheral IV access patent. Bedside telemetry ping indicates steady-state physiological parameters.'
  }
];

// Deterministic hash to generate consistent pseudo-embeddings for illustrative demonstration
function generateDeterministicVector(text, dimension = 768) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  const vector = [];
  for (let i = 0; i < dimension; i++) {
    // Generate pseudo-random float between -1.0 and 1.0 based on text hash and index
    const seed = Math.sin(hash + i * 1.618) * 10000;
    const val = (seed - Math.floor(seed)) * 2 - 1;
    vector.push(Number(val.toFixed(4)));
  }
  return vector;
}

export default function ClinicalVectorization() {
  const [selectedPresetId, setSelectedPresetId] = useState('note-icu');
  const [clinicalText, setClinicalText] = useState(SYNTHETIC_NOTE_PRESETS[0].text);
  const [previewDim, setPreviewDim] = useState(32); // 16, 32, 64, 128, 768
  const [isGenerating, setIsGenerating] = useState(false);
  const [vectorData, setVectorData] = useState(() => 
    generateDeterministicVector(SYNTHETIC_NOTE_PRESETS[0].text, 768)
  );
  const [errorMessage, setErrorMessage] = useState(null);

  // Subword tokens display
  const tokens = useMemo(() => {
    const words = clinicalText.trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 18).map((word, idx) => ({
      id: idx,
      token: word.replace(/[^a-zA-Z0-9-]/g, '')
    }));
  }, [clinicalText]);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setClinicalText(preset.text);
    setErrorMessage(null);
  };

  const handleGenerateVector = () => {
    if (!clinicalText.trim()) {
      setErrorMessage('Clinical observation text cannot be empty.');
      return;
    }
    setErrorMessage(null);
    setIsGenerating(true);

    // Simulate encoder latency
    setTimeout(() => {
      const newVec = generateDeterministicVector(clinicalText, 768);
      setVectorData(newVec);
      setIsGenerating(false);
    }, 600);
  };

  const displayedSlice = vectorData.slice(0, previewDim);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Feature C • Clinical Semantic Vectorization
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                Bio_ClinicalBERT Context
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Clinical Semantic Vectorization Studio
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Encodes unstructured clinical observations into 768-dimensional contextual vectors to represent ward-level clinical context.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Vector Dimensions:</span>
            <div className="flex bg-white rounded-lg border border-slate-300 p-0.5 text-xs">
              {[16, 32, 64, 128, 768].map(d => (
                <button
                  key={d}
                  onClick={() => setPreviewDim(d)}
                  className={clsx(
                    "px-2.5 py-1 rounded font-medium transition-colors",
                    previewDim === d
                      ? "bg-indigo-600 text-white font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Explicit Illustrative Disclaimer Notice */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong>Illustrative Vector Notice:</strong> The displayed numerical vector is an <strong>illustrative vector — not generated by Bio_ClinicalBERT live in-browser</strong>. Offline research embeddings were produced using <em>emilyalsentzer/Bio_ClinicalBERT</em> over the MTSamples clinical-text proxy. In production and edge deployments, raw text is processed solely inside the local edge client to protect patient privacy; no PHI is transmitted across the network.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Presets Grid */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
            Select Sample Synthetic Clinical Note (MTSamples Proxy)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SYNTHETIC_NOTE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={clsx(
                  "text-left p-3.5 rounded-xl border text-xs transition-all flex flex-col justify-between",
                  selectedPresetId === preset.id
                    ? "bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400 shadow-xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-700">{preset.ward}</span>
                    <span className="text-[9px] text-slate-400 font-medium">{preset.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">{preset.title}</h4>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {preset.text}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Text Input & Action Button */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Editable Synthetic Clinical Observation Note
            </label>
            <span className="text-[11px] text-slate-400">
              {clinicalText.length} characters • {tokens.length} subword tokens
            </span>
          </div>

          <textarea
            value={clinicalText}
            onChange={(e) => {
              setClinicalText(e.target.value);
              setErrorMessage(null);
            }}
            rows={3}
            placeholder="Enter synthetic clinical note telemetry for embedding extraction..."
            className="w-full border border-slate-300 rounded-xl p-3 text-xs font-sans text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
          />

          {errorMessage && (
            <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div className="flex flex-wrap gap-1.5">
              {tokens.map((t) => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-[10px]"
                >
                  {t.token}
                </span>
              ))}
            </div>

            <button
              onClick={handleGenerateVector}
              disabled={isGenerating}
              className={clsx(
                "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0",
                isGenerating
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              )}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Encoding 768-D Vector...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Semantic Vector</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 768-D Vector Display & Value Heatmap */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Full Semantic Hidden State: 768 Dimensions
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Illustrative Data
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Displaying first {previewDim} of 768 dense float features. Color intensity corresponds to latent activation value.
              </p>
            </div>
            <span className="font-mono text-xs text-indigo-300 font-semibold">
              Dim: [ 1 × 768 ]
            </span>
          </div>

          {/* Color Heatmap Grid */}
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 mb-4 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800">
            {displayedSlice.map((val, idx) => {
              // Map -1.0..1.0 to color hue and lightness
              const isPositive = val >= 0;
              const opacity = Math.min(1.0, Math.max(0.2, Math.abs(val)));
              return (
                <div
                  key={idx}
                  title={`Dim ${idx}: ${val}`}
                  className="h-4 rounded-xs transition-transform hover:scale-125 cursor-pointer"
                  style={{
                    backgroundColor: isPositive
                      ? `rgba(99, 102, 241, ${opacity})`
                      : `rgba(239, 68, 68, ${opacity})`
                  }}
                />
              );
            })}
          </div>

          {/* Numerical Values Matrix */}
          <div className="max-h-36 overflow-y-auto font-mono text-[11px] text-slate-300 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 p-2 bg-slate-950/50 rounded-lg border border-slate-800/80">
            {displayedSlice.map((val, idx) => (
              <div key={idx} className="flex justify-between px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">d{idx}</span>
                <span className={clsx(val >= 0 ? "text-indigo-300" : "text-rose-400")}>
                  {val >= 0 ? `+${val}` : val}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between text-[11px] text-slate-400 gap-2">
            <span>Projection: 768-D Bio_ClinicalBERT embedding → 128-D Client Head</span>
            <span className="text-slate-400 italic">
              *Synthetic note data only. No patient identity or raw text centralized.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
