import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { LogOut, Menu, Hospital } from 'lucide-react';

export const Navbar = ({ onToggleSidebar, onOpenProfile }) => {
  const { username, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 h-[57px] flex items-center shrink-0">
      <div className="flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Hospital size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight">SIMRS Billing Engine</h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">Sistem Informasi Keuangan & Kasir Medis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <button 
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-900 transition-colors text-left group cursor-pointer"
              title="Pengaturan Profil Akun"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">{username}</p>
                <Badge variant={role}>{role}</Badge>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-mono font-bold text-xs flex items-center justify-center border border-emerald-600/50 group-hover:border-emerald-400 transition-colors">
                {username ? username[0].toUpperCase() : 'U'}
              </div>
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Keluar / Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
