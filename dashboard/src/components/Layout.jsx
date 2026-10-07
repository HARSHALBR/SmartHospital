import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 px-6 flex justify-between items-center z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
            SH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">
                Smart Hospital AI
              </span>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                • Semantic Vectorization + Federated Graph Learning
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden md:block">
              Federated Multi-Modal Anomaly Detection in Smart Hospitals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-slate-600 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>API Connected</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-full font-bold text-[11px]">
            <span>Research Demonstration</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex pt-14">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-[calc(100vh-3.5rem)]">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
