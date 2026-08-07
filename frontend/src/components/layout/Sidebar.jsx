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
  ShieldCheck,
  BarChart3,
  X,
  User
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { isStaff, isAdmin, role } = useAuth();

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  const navItems = isStaff ? [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Laporan & Analytics', icon: BarChart3 },
    { id: 'billings', label: 'Medical Billings', icon: Receipt },
    { id: 'claims', label: 'Manajemen Klaim Penjamin', icon: ShieldCheck },
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
          className="fixed inset-x-0 top-[57px] bottom-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static top-[57px] md:top-0 bottom-0 left-0 z-40
        w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] p-4
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col justify-between shrink-0 overflow-y-auto transition-colors duration-200
      `}>
        <div>
          {/* Mobile Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-color)] md:hidden">
            <span className="font-mono font-bold text-[var(--text-heading)] text-xs uppercase tracking-wider">Navigasi SIMRS</span>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-heading)] p-1">
              <X size={18} />
            </button>
          </div>

          {/* Access Portal */}
          <div className="mb-6 px-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Portal Otorisasi</p>
            <div className="p-3 rounded-sm bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3">
              <div className="p-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-sm border border-emerald-500/30 shrink-0">
                <UserCheck size={16} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-mono font-bold text-[var(--text-heading)] truncate">{role?.toUpperCase()}</p>
                <p className="text-[10px] font-sans text-[var(--text-secondary)]">SIMRS Financial Ledger</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] px-1 mb-2">Menu Navigasi</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-xs font-semibold
                    transition-all duration-150 group cursor-pointer border-l-2
                    ${isActive
                      ? 'bg-[var(--bg-card)] text-emerald-600 dark:text-emerald-300 border-l-emerald-500 border-y border-r border-y-[var(--border-color)] border-r-[var(--border-color)] shadow-sm'
                      : 'text-[var(--text-secondary)] border-l-transparent hover:text-[var(--text-heading)] hover:bg-[var(--bg-card-hover)]'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-emerald-500' : 'text-[var(--text-muted)] group-hover:text-[var(--text-heading)]'} />
                    <span className="font-sans">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[var(--border-color)] mt-6 px-1">
          <p className="text-[10px] font-mono text-[var(--text-muted)]">SIMRS Billing Engine v1.0</p>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">Idempotent Medical Ledger</p>
        </div>
      </aside>
    </>
  );
};
