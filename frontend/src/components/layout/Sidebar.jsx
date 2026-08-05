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
  X
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
    { id: 'ledgers', label: 'Payment Ledgers (Jurnal Kas)', icon: BookOpen },
    ...(isAdmin ? [{ id: 'users', label: 'Manajemen Pengguna', icon: Users }] : []),
  ] : [
    { id: 'my-billings', label: 'Tagihan Layanan Saya', icon: Receipt },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-950/90 border-r border-white/10 p-4
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col justify-between
      `}>
        <div>
          {/* Header Mobile */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 md:hidden">
            <span className="font-bold text-white text-sm">Navigasi SIMRS</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="mb-6 px-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Portal Akses</p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <UserCheck size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">Peran: {role?.toUpperCase()}</p>
                <p className="text-[10px] text-gray-400">SIMRS Billing Engine</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-2 mb-2">Menu Utama</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 group
                    ${isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} className="text-indigo-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-500">SIMRS Billing System v1.0</p>
          <p className="text-[10px] text-gray-600 font-mono mt-0.5">Decimal Math • Idempotent Payments</p>
        </div>
      </aside>
    </>
  );
};
