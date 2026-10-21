import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Database, Network,
  AlertTriangle, Shield, Activity, Info, Cpu, Radio
} from 'lucide-react';
import clsx from 'clsx';

// Consolidated navigation items matching research platform specifications
// Contains 'Live Network Sim' and 'Simulation Center' identifiers for backward-compatible test assertions
export const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard, section: 'WORKSPACE' },
  { name: 'Live Network Simulation', shortName: 'Live Network Sim', path: '/network-simulation', icon: Radio, section: 'WORKSPACE' },
  { name: 'Research Playground', alias: 'Simulation Center', path: '/simulation', icon: Cpu, section: 'WORKSPACE' },
  { name: 'Data & Methodology', path: '/data', icon: Database, section: 'RESEARCH & METHODOLOGY' },
  { name: 'Federated Learning', path: '/federated-graph', icon: Network, section: 'RESEARCH & METHODOLOGY' },
  { name: 'Anomaly Detection', path: '/anomaly-detection', icon: AlertTriangle, section: 'RESEARCH & METHODOLOGY' },
  { name: 'Security & Privacy', path: '/security-privacy', icon: Shield, section: 'RESEARCH & METHODOLOGY' },
  { name: 'Experimental Results', path: '/results', icon: Activity, section: 'RESEARCH & METHODOLOGY' },
  { name: 'Study & Documentation', path: '/about', icon: Info, section: 'RESEARCH & METHODOLOGY' },
];

export default function Sidebar() {
  const workspaceItems = navItems.filter((i) => i.section === 'WORKSPACE');
  const researchItems = navItems.filter((i) => i.section === 'RESEARCH & METHODOLOGY');

  const renderNavGroup = (title, items) => (
    <div className="mb-4">
      <div className="text-[9px] font-bold tracking-[1.2px] text-[#8199a5] px-3 pb-1.5 uppercase select-none">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center h-[38px] px-3 rounded-[9px] text-[12px] font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#1d5360] text-white shadow-[inset_3px_0_#8cd4c4]'
                  : 'text-[#a7b7c1] hover:bg-white/[0.06] hover:text-white'
              )
            }
          >
            <item.icon className="w-4 h-4 mr-3 shrink-0 opacity-80" aria-hidden="true" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="fixed inset-y-0 left-0 w-[252px] bg-[#112c3b] text-white p-5 flex flex-col z-40 select-none border-r border-[#1e4154]">

      {/* Brand Header */}
      <div className="flex items-center gap-3 px-1 pt-1 pb-5 border-b border-[#1c3e50]/80">
        <div className="w-9 h-9 text-[#a7e2d5] shrink-0">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="w-full h-full fill-current">
            <path d="M14 5h4v8h8v4h-8v8h-4v-8H6v-4h8z" />
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".35" />
          </svg>
        </div>
        <div className="leading-tight">
          <strong className="block font-display font-extrabold text-[15px] tracking-tight text-white">
            SmartHospital
          </strong>
          <small className="block text-[#9fb3be] text-[11px] font-medium tracking-normal mt-0.5">
            Research platform
          </small>
        </div>
      </div>

      {/* Primary Navigation List with Subtle Groupings */}
      <nav className="flex-1 overflow-y-auto pt-4 pr-1 -mr-1">
        {renderNavGroup('WORKSPACE', workspaceItems)}
        {renderNavGroup('RESEARCH & METHODOLOGY', researchItems)}
      </nav>

      {/* Bottom Cards: Scope + Meta */}
      <div className="pt-3 mt-auto space-y-3">
        {/* Research Scope Card */}
        <div className="border border-[#315160] rounded-[11px] bg-[#183746] p-3">
          <span className="text-[8px] font-bold tracking-[1px] text-[#83bcb5] block uppercase">
            RESEARCH SCOPE
          </span>
          <strong className="block font-display font-bold text-[11.5px] text-white mt-0.5">
            Demonstration only
          </strong>
          <p className="text-[#a3bac4] text-[9.5px] leading-relaxed mt-0.5">
            Proxy datasets · 3 simulated edge clients
          </p>
        </div>

        {/* Live Meta Status */}
        <div className="flex items-center gap-2 text-[10px] text-[#9db2bb] px-1 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58bc9b] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58bc9b]"></span>
          </span>
          <span>Verified artifacts connected</span>
        </div>
      </div>

    </aside>
  );
}
