import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Tag, 
  BookOpen, 
  Users, 
  UserCheck, 
  ShieldAlert,
  ChevronRight,
  BarChart3,
  X,
  User
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { isStaff, isPasien, isAdmin, role } = useAuth();

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const navItems = isStaff ? [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Laporan & Analytics', icon: BarChart3 },
    { id: 'billings', label: 'Medical Billings', icon: Receipt },
    { id: 'tarifs', label: 'Master Tarif Layanan', icon: Tag },
    { id: 'ledgers', label: 'Jurnal Mutasi Kas', icon: BookOpen },
    { id: 'audit-logs', label: 'Audit Trail System', icon: ShieldAlert },
    ...(isAdmin ? [{ id: 'users', label: 'Manajemen Pengguna', icon: Users }] : []),
    { id: 'profile', label: 'Pengaturan Profil', icon: User },
  ] : [
    { id: 'my-billings', label: 'Tagihan Layanan Saya', icon: Receipt },
    { id: 'profile', label: 'Pengaturan Profil', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-x-0 top-[57px] bottom-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static top-[57px] md:top-0 bottom-0 left-0 z-40
        w-64 bg-slate-950 border-r border-slate-800/80 p-3.5
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col justify-between shrink-0 overflow-y-auto
      `}>
        <div>
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 md:hidden">
            <span className="font-bold text-white text-xs uppercase tracking-wider">Navigasi SIMRS</span>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X size={18} />
            </button>
          </div>

          {/* Access Portal */}
          <div className="mb-5 px-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Portal Otorisasi</p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
              <div className="p-1.5 bg-emerald-950/80 text-emerald-400 rounded border border-emerald-500/30 shrink-0">
                <UserCheck size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-100 truncate">Hak Akses: {role?.toUpperCase()}</p>
                <p className="text-[10px] text-slate-400">SIMRS Financial Engine</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">Menu Navigasi</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold
                    transition-colors duration-150 group
                    ${isActive
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-emerald-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-3 border-t border-slate-800/80 text-center shrink-0 mt-6">
          <p className="text-[11px] text-slate-400 font-semibold">SIMRS Billing System v1.0</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Clinical Ledger • Idempotent Engine</p>
        </div>
      </aside>
    </>
  );
};
