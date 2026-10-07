import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Database, FileText, Network, 
  AlertTriangle, Shield, Activity, Info 
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Hospital Data', path: '/data', icon: Database },
  { name: 'Semantic Vectorization', path: '/semantic', icon: FileText },
  { name: 'Federated Graph Learning', path: '/federated-graph', icon: Network },
  { name: 'Anomaly Detection', path: '/anomaly-detection', icon: AlertTriangle },
  { name: 'Security & Privacy', path: '/security-privacy', icon: Shield },
  { name: 'Results', path: '/results', icon: Activity },
  { name: 'About', path: '/about', icon: Info },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 fixed left-0 top-14 bottom-0 flex flex-col z-40 border-r border-slate-800">
      <div className="px-5 py-4 border-b border-slate-800/80">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Platform Navigation
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              )
            }
          >
            <item.icon className="mr-3 flex-shrink-0 h-4 w-4" aria-hidden="true" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono text-center">
        Research Demo • v10.2
      </div>
    </aside>
  );
}
