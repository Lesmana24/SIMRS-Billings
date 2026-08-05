import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hospital, Lock, User, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Toast } from '../components/ui/Toast';

export const Login = ({ onSwitchToRegister }) => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'error' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setToast({ message: 'Harap isi username dan password', type: 'error' });
      return;
    }

    try {
      await login({ username, password });
    } catch (err) {
      setToast({ message: err.message || 'Login gagal, periksa kredensial Anda', type: 'error' });
    }
  };

  const handleQuickFill = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19]">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo & Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-lg mb-2">
            <Hospital size={36} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SIMRS Billing Engine</h1>
          <p className="text-sm text-gray-400">Masuk ke Sistem Informasi Billing & Pembayaran Pasien</p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="glass-input glass-input-icon"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="glass-input glass-input-icon"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Memproses Login...' : 'Masuk ke Sistem'} <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <p className="text-xs font-semibold text-gray-400 text-center flex items-center justify-center gap-1">
              <KeyRound size={14} className="text-amber-400" /> Kredensial Demo Awal:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'password123')}
                className="px-2 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors font-medium text-center truncate"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff', 'password123')}
                className="px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-colors font-medium text-center truncate"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('pasien1', 'password123')}
                className="px-2 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500/20 transition-colors font-medium text-center truncate"
              >
                Pasien 1
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-400">
              Belum punya akun pasien?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-indigo-400 hover:underline font-semibold"
              >
                Daftar Akun Baru
              </button>
            </p>
          </div>
        </div>

        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
      </div>
    </div>
  );
};
