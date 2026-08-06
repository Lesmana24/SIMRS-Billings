import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Toast } from '../components/ui/Toast';
import { AuthLayout } from '../components/layout/AuthLayout';
import { motion } from 'framer-motion';

export const Register = ({ onSwitchToLogin }) => {
  const { register, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setToast({ message: 'Harap isi username dan password', type: 'error' });
      return;
    }

    try {
      await register({ username, password, role: 'pasien' });
      setToast({ message: 'Registrasi berhasil! Silakan login dengan akun Anda', type: 'success' });

      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (err) {
      setToast({ message: err.message || 'Registrasi gagal', type: 'error' });
    }
  };

  return (
    <AuthLayout
      title="Registrasi Akun Pasien"
      subtitle="Buat akun baru untuk mengakses layanan & tagihan SIMRS Billing"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Username Akun
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-200">
              <User size={18} />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pilih username unik..."
              className="glass-input glass-input-icon focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Password Akun
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-400 transition-colors duration-200">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password rahasia..."
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
          <span>{loading ? 'Daftar...' : 'Daftar Pengguna Baru'}</span>
          <UserPlus size={18} className="group-hover:scale-110 transition-transform duration-200" />
        </motion.button>
      </form>

      <div className="text-center pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" /> Kembali ke Halaman Login
        </button>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </AuthLayout>
  );
};
