import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hospital, Lock, User, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16]">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo & Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 bg-emerald-950/60 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg mb-2">
            <Hospital size={36} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SIMRS Billing Engine</h1>
          <p className="text-sm text-slate-400">Masuk ke Sistem Informasi Billing & Pembayaran Pasien</p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
              className="btn btn-emerald w-full py-3 text-sm disabled:opacity-50"
            >
              {loading ? 'Memproses Login...' : 'Masuk ke Sistem'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              Belum punya akun pasien?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
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
