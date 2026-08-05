import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { LogOut, User, Menu, ShieldCheck, Hospital } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { username, role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/10 px-4 h-[57px] flex items-center shrink-0">
      <div className="flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Hospital size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide leading-tight">SIMRS Billing</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">Sistem Informasi Billing Rumah Sakit</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{username}</p>
              <Badge variant={role}>{role}</Badge>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {username ? username[0].toUpperCase() : 'U'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Keluar / Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
