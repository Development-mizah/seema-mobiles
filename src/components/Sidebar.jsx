import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, ClipboardList,
  Wrench, CreditCard, Tag, Puzzle, ChevronRight, Smartphone, Menu, X
} from 'lucide-react';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'stocks',       label: 'Stocks',        icon: Package },
  { id: 'sales',        label: 'Sales',         icon: ShoppingCart },
  { id: 'requirements', label: 'Requirements',  icon: ClipboardList },
  { id: 'services',     label: 'Services',      icon: Wrench },
  { id: 'credits',      label: 'Credits',       icon: CreditCard },
  { id: 'brands',       label: 'Brands',        icon: Tag },
  { id: 'accessories',  label: 'Accessories',   icon: Puzzle },
];

export default function Sidebar({ active, onNav }) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (id) => { onNav(id); setMobileOpen(false); };

  const Content = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/[0.06] ${!expanded ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center flex-shrink-0"
          style={{ boxShadow: '0 0 20px rgba(234,88,12,0.4)' }}>
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        {expanded && (
          <div>
            <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Seema Mobiles</p>
            <p className="text-orange-500 text-[10px] font-medium tracking-wide">INVENTORY</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => nav(id)}
              title={!expanded ? label : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-600/20'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'}
                ${!expanded ? 'justify-center' : ''}`}>
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-orange-400' : ''}`} />
              {expanded && <span className="flex-1 text-left">{label}</span>}
              {expanded && isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </button>
          );
        })}
      </nav>

      {/* Toggle */}
      {expanded && (
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-700 font-medium">v2.0 · Local Database</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 bg-[#0f0f1a] border border-white/10 rounded-xl flex items-center justify-center text-gray-400">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-[#0c0c17] border-r border-white/[0.06] w-60
        transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <Content />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-[#0c0c17] border-r border-white/[0.06] h-screen sticky top-0
        transition-all duration-300 ${expanded ? 'w-56' : 'w-[60px]'} flex-shrink-0`}>
        <Content />
        {/* Collapse toggle */}
        <button onClick={() => setExpanded(e => !e)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-orange-600 border-2 border-[#0c0c17] flex items-center justify-center hover:bg-orange-700 transition-colors">
          <ChevronRight className={`w-3 h-3 text-white transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
}
