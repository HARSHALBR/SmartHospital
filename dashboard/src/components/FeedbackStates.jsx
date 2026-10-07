import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export const LoadingState = ({ message = "Loading verified research metrics..." }) => (
  <div className="space-y-6 max-w-5xl mx-auto py-8">
    <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mr-3" />
      <span className="text-xs text-slate-600 font-semibold">{message}</span>
    </div>

    {/* Skeleton Cards maintaining structure */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 bg-slate-200/60 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200/50 rounded-2xl animate-pulse" />
  </div>
);

export const ErrorState = ({ message = "Unable to load verified research metrics." }) => (
  <div className="max-w-2xl mx-auto my-12 p-8 bg-rose-50/70 border border-rose-200 rounded-2xl text-center shadow-xs">
    <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-3" />
    <h3 className="text-base font-bold text-rose-950 mb-1">{message}</h3>
    <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto">
      Please check that the local FastAPI backend server is running (<code className="font-mono bg-rose-100 px-1 py-0.5 rounded text-[11px]">uvicorn backend.main:app</code> on port 8000).
    </p>
  </div>
);

export const UnavailableState = ({ title = "Feature Unavailable", message }) => (
  <div className="p-8 bg-slate-100/70 border border-slate-300 rounded-2xl text-center max-w-lg mx-auto shadow-xs">
    <AlertCircle className="w-7 h-7 text-slate-500 mx-auto mb-2" />
    <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
    <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
  </div>
);
