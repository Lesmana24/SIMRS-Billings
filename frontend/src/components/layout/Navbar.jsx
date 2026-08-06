import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../ui/Badge';
import { LogOut, Menu, Hospital, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar = ({ onToggleSidebar, onOpenProfile }) => {
  const { username, role, logout } = useAuth();
  const { theme, hasCustomPreference, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-color)] px-4 h-[57px] flex items-center shrink-0 transition-colors duration-200">
      <div className="flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/30">
              <Hospital size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-heading)] tracking-wide leading-tight">SIMRS Billing Engine</h1>
              <p className="text-[10px] text-[var(--text-secondary)] hidden sm:block">Sistem Informasi Keuangan & Kasir Medis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-emerald-500/50 shadow-sm"
            title={hasCustomPreference ? `Tema tersimpan: ${theme === 'dark' ? 'Gelap' : 'Terang'} (Klik untuk ganti)` : 'Tema otomatis mengikuti perangkat OS (Klik untuk ganti)'}
          >
            {theme === 'dark' ? (
              <Moon size={15} className="text-amber-400" />
            ) : (
              <Sun size={15} className="text-amber-500" />
            )}
            <span className="hidden md:inline capitalize text-[11px]">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            {!hasCustomPreference && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-normal">
                Auto
              </span>
            )}
          </motion.button>

          <div className="flex items-center gap-3 pl-3 border-l border-[var(--border-color)]">
            <button 
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors text-left group cursor-pointer"
              title="Pengaturan Profil Akun"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-[var(--text-heading)] group-hover:text-emerald-500 transition-colors">{username}</p>
                <Badge variant={role}>{role}</Badge>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/50 group-hover:border-emerald-400 transition-colors">
                {username ? username[0].toUpperCase() : 'U'}
              </div>
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
