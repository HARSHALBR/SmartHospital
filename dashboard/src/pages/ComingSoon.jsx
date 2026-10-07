import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function ComingSoon({ title, phase }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <ShieldAlert className="w-16 h-16 text-indigo-200 mb-6" />
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 font-medium bg-slate-100 px-4 py-1.5 rounded-full">
        Phase {phase} — Coming Next
      </p>
    </div>
  );
}
