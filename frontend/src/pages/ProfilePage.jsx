import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { Toast } from '../components/ui/Toast';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Mail, Phone, MapPin, CreditCard, Save, RefreshCw, KeyRound, Sun, Moon, Monitor } from 'lucide-react';

export const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const { theme, hasCustomPreference, setThemeExplicitly } = useTheme();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nik, setNik] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2FA Security PIN
  const [twoFactorPin, setTwoFactorPin] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileApi.getProfile();
      const u = res.data || {};
      setProfile(u);
      setFullName(u.full_name || '');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setAddress(u.address || '');
      setNik(u.nik || '');
      setTwoFactorPin(u.two_factor_pin || '123456');
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat profil pengguna', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (newPassword && newPassword !== confirmPassword) {
      setToast({ message: 'Verifikasi password baru tidak cocok! Silakan tulis ulang password dengan benar.', type: 'error' });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setToast({ message: 'Password baru minimal harus 6 karakter.', type: 'error' });
      return;
    }

    if (twoFactorPin && (twoFactorPin.length < 4 || twoFactorPin.length > 6)) {
      setToast({ message: 'Kode 2FA Security PIN harus 4-6 digit angka.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        full_name: fullName,
        email: email,
        phone: phone,
        address: address,
        nik: nik,
        two_factor_pin: twoFactorPin,
      };

      if (newPassword) {
        payload.new_password = newPassword;
        payload.confirm_password = confirmPassword;
      }

      await profileApi.updateProfile(payload);
      setToast({ message: 'Profil & Keamanan akun berhasil diperbarui!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      fetchProfile();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menyimpan perubahan profil', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-secondary)]">
        <RefreshCw size={24} className="animate-spin text-emerald-500 mr-2" />
        Memuat profil pengguna...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 border border-emerald-500/20 bg-gradient-to-r from-[var(--bg-card)] via-[var(--bg-card)] to-emerald-900/10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-extrabold text-2xl shadow-md">
            {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-[var(--text-heading)] tracking-wide">
                {profile?.full_name || profile?.username}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                {profile?.role}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">
              Username: <span className="text-emerald-600 dark:text-emerald-300 font-bold">@{profile?.username}</span> • ID Akun: #USR-{profile?.ID || profile?.id}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Data Diri */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <User className="text-emerald-500" size={18} /> Data Diri & Informasi Kontak
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username (Read Only) */}
            <div>
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 block">Username SIMRS (Dipakai Login)</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="glass-input bg-[var(--bg-subtle)] text-[var(--text-secondary)] cursor-not-allowed font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">* Username bersifat permanen untuk login akun.</p>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 block">Nama Lengkap Sesuai KTP</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap..."
                className="glass-input"
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 flex items-center gap-1.5">
                <Mail size={14} className="text-cyan-500" /> Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: pasien@gmail.com"
                className="glass-input"
              />
            </div>

            {/* No. HP / WhatsApp */}
            <div>
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-500" /> No. Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="contoh: 081234567890"
                className="glass-input font-mono"
              />
            </div>

            {/* NIK KTP */}
            <div className="md:col-span-2">
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 flex items-center gap-1.5">
                <CreditCard size={14} className="text-amber-500" /> NIK (Nomor Induk Kependudukan)
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Masukkan 16 digit NIK KTP..."
                className="glass-input font-mono"
              />
            </div>

            {/* Alamat Tempat Tinggal */}
            <div className="md:col-span-2">
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-purple-500" /> Alamat Lengkap
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Masukkan alamat lengkap rumah / domisili..."
                className="glass-input py-2"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Keamanan & Ganti Password */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Lock className="text-cyan-500" size={18} /> Pengaturan Kata Sandi (Password Baru)
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Kosongkan kolom password jika Anda tidak ingin mengubah password akun Anda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 block">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                className="glass-input"
              />
            </div>

            <div>
              <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 block">Verifikasi Password Baru (Tulis Ulang)</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru..."
                className="glass-input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kode Otorisasi 2FA PIN */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <KeyRound className="text-amber-500" size={18} /> Kode Otorisasi 2FA Security PIN
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Kode PIN 6 digit digunakan untuk otorisasi transaksi kasir dan tindakan penting pada SIMRS Billing.
          </p>

          <div className="max-w-xs">
            <label className="form-label text-[var(--text-secondary)] text-xs font-semibold uppercase mb-1 block">Kode 2FA Security PIN (4-6 Digit)</label>
            <input
              type="text"
              maxLength={6}
              value={twoFactorPin}
              onChange={(e) => setTwoFactorPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 123456"
              className="glass-input font-mono tracking-widest text-center text-lg font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Section 4: Pengaturan Tema Tampilan */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2 border-b border-[var(--border-color)] pb-3">
            <Sun className="text-amber-500" size={18} /> Tema Tampilan Aplikasi (Light / Dark)
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Aplikasi otomatis mengadopsi tema sistem perangkat pada awal akses. Pilihan baru disimpan secara lokal di browser.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setThemeExplicitly('dark')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                theme === 'dark' && hasCustomPreference
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500 shadow-md'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Moon size={16} className="text-amber-400" /> Tema Gelap (Dark Mode)
            </button>

            <button
              type="button"
              onClick={() => setThemeExplicitly('light')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                theme === 'light' && hasCustomPreference
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-md'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Sun size={16} className="text-amber-500" /> Tema Terang (Light Mode)
            </button>

            <button
              type="button"
              onClick={() => setThemeExplicitly('system')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                !hasCustomPreference
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500 shadow-md'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Monitor size={16} className="text-cyan-500" /> Ikuti Sistem Perangkat (Auto OS)
            </button>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-emerald btn-lg px-8 flex items-center gap-2 font-bold shadow-lg cursor-pointer"
          >
            <Save size={18} />
            {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
};
