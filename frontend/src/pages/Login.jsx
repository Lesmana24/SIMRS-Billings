import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Toast } from '../components/ui/Toast';
import { AuthLayout } from '../components/layout/AuthLayout';
import { motion } from 'framer-motion';

export const Login = ({ onSwitchToRegister }) => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthLayout 
      title="SIMRS Billing Engine"
      subtitle="Masuk ke Sistem Informasi Billing & Pembayaran Pasien"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Username
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-200">
              <User size={18} />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username..."
              className="glass-input glass-input-icon focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-200">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password..."
              className="glass-input glass-input-icon pr-10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          type="submit"
          disabled={loading}
          className="btn btn-emerald btn-shimmer group w-full py-3 text-sm disabled:opacity-50 font-bold shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/90 transition-all duration-200 cursor-pointer"
        >
          <span>{loading ? 'Memproses Login...' : 'Masuk ke Sistem'}</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
        </motion.button>
      </form>

      <div className="text-center pt-4 border-t border-slate-800/80">
        <p className="text-xs text-slate-400">
          Belum punya akun pasien?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-400"
          >
            Daftar Akun Baru
          </button>
        </p>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
    </AuthLayout>
  );
};
