import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const PAGE_TITLES = {
  '/': 'Overview',
  '/network-simulation': 'Live Network Simulation',
  '/simulation': 'Research Playground',
  '/data': 'Data & Methodology',
  '/semantic': 'Data & Methodology',
  '/federated-graph': 'Federated Learning',
  '/anomaly-detection': 'Anomaly Detection',
  '/security-privacy': 'Security & Privacy',
  '/results': 'Experimental Results',
  '/about': 'Study & Documentation',
};

export default function Layout() {
  const location = useLocation();
  const currentTitle = PAGE_TITLES[location.pathname] || 'Research Platform';

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#f5f8fa] text-[#172d3c] flex">
      {/* 252px Fixed Theme Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="ml-[252px] flex-1 flex flex-col min-h-screen">

        {/* Topbar matching Friend's UI */}
        <header className="h-[66px] bg-white/95 border-b border-[#e4ebee] sticky top-0 z-30 backdrop-blur-md px-8 flex items-center justify-between">

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2.5 text-[11px] text-[#6c7e88]">
            <span className="hover:text-[#172d3c] transition-colors cursor-pointer">SmartHospital</span>
            <span className="text-[#b6c1c6]">/</span>
            <strong className="text-[#172d3c] font-bold font-display">{currentTitle}</strong>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 bg-[#f2f7f6] text-[#55766f] border border-[#dcebe7] rounded-full px-3 py-1 text-[8px] font-extrabold tracking-[0.8px] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#58bc9b]"></span>
              RESEARCH DEMO
            </span>

            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5b707b] hover:bg-[#edf3f4] hover:text-[#167f78] transition-colors text-base"
              title="Refresh verified research data"
              aria-label="Refresh data"
            >
              ↻
            </button>

            <div className="w-[30px] h-[30px] rounded-full bg-[#dcefeb] text-[#26726d] font-extrabold text-[9px] flex items-center justify-center tracking-tight shadow-xs select-none">
              SH
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 w-full max-w-[1220px] mx-auto px-8 py-7">
          <Outlet />
        </main>

        {/* Footer matching Friend's UI */}
        <footer className="px-9 py-4 border-t border-[#e4ebee] bg-white/50 text-[10px] text-[#87969d] flex flex-col sm:flex-row justify-between items-center gap-2 mt-auto">
          <span>SmartHospital Research Demonstration</span>
          <span>Frozen experimental artifacts · Phases 1–9</span>
        </footer>

      </div>
    </div>
  );
}
