import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { Toast } from '../components/ui/Toast';
import { User, Lock, ShieldCheck, Mail, Phone, MapPin, CreditCard, Save, RefreshCw, KeyRound } from 'lucide-react';

export const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

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
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw size={24} className="animate-spin text-emerald-400 mr-2" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-lg">
            {profile?.username ? profile.username.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white tracking-wide">
                {profile?.full_name || profile?.username}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                {profile?.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Username: <span className="text-emerald-300 font-bold">@{profile?.username}</span> • ID Akun: #USR-{profile?.ID || profile?.id}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informasi Data Diri */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="text-emerald-400" size={18} /> Data Diri & Informasi Kontak
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username (Read Only) */}
            <div>
              <label className="form-label">Username SIMRS (Dipakai Login)</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile?.username || ''}
                  disabled
                  className="glass-input bg-slate-950/80 text-slate-400 cursor-not-allowed font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">* Username bersifat permanen untuk login akun.</p>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="form-label">Nama Lengkap Sesuai KTP</label>
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
              <label className="form-label flex items-center gap-1.5">
                <Mail size={14} className="text-cyan-400" /> Alamat Email
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
              <label className="form-label flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-400" /> No. Telepon / WhatsApp
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
              <label className="form-label flex items-center gap-1.5">
                <CreditCard size={14} className="text-amber-400" /> NIK (Nomor Induk Kependudukan)
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
              <label className="form-label flex items-center gap-1.5">
                <MapPin size={14} className="text-purple-400" /> Alamat Lengkap
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
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="text-cyan-400" size={18} /> Pengaturan Kata Sandi (Password Baru)
          </h3>
          <p className="text-xs text-slate-400">
            Kosongkan kolom password jika Anda tidak ingin mengubah password akun Anda.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Atas: Password Baru */}
            <div>
              <label className="form-label">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                className="glass-input"
              />
            </div>

            {/* Kolom Bawah: Verifikasi Password Baru (Tulis Ulang) */}
            <div>
              <label className="form-label">Verifikasi Password Baru (Tulis Ulang)</label>
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
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="text-amber-400" size={18} /> Kode Otorisasi 2FA Security PIN
          </h3>
          <p className="text-xs text-slate-400">
            Kode PIN 6 digit digunakan untuk otorisasi transaksi kasir dan tindakan penting pada SIMRS Billing.
          </p>

          <div className="max-w-xs">
            <label className="form-label">Kode 2FA Security PIN (4-6 Digit)</label>
            <input
              type="text"
              maxLength={6}
              value={twoFactorPin}
              onChange={(e) => setTwoFactorPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Contoh: 123456"
              className="glass-input font-mono tracking-widest text-center text-lg font-bold text-emerald-400"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-emerald btn-lg px-8 flex items-center gap-2 font-bold shadow-lg shadow-emerald-900/30"
          >
            <Save size={18} />
            {saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
};
