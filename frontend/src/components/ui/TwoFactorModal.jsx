import React, { useState } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

export const TwoFactorModal = ({
  isOpen,
  onClose,
  onConfirm,
  onVerified,
  isProcessing,
  title,
  actionTitle,
}) => {
  const [pin, setPin] = useState('123456');
  const [error, setError] = useState('');

  const handleCallback = onConfirm || onVerified;
  const modalTitle = actionTitle || title || 'Otentikasi Keamanan 2FA (Two-Factor Auth)';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin || pin.length < 6) {
      setError('Masukkan 6 digit kode PIN 2FA Keamanan');
      return;
    }
    setError('');
    if (handleCallback) {
      handleCallback(pin);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-800/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h4 className="text-sm font-bold text-white">Verifikasi Otorisasi Kasir & Admin</h4>
          <p className="text-xs text-slate-400">
            Demi keamanan transaksi dan audit trail sistem, masukkan 6 digit Security PIN akun Anda untuk melanjutkan pelunasan tagihan.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" /> Kode 2FA Security PIN (6 Digit)
          </label>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="glass-input font-mono text-center text-lg tracking-[0.4em] font-bold py-2.5"
            required
            autoFocus
          />
          <p className="text-[11px] text-slate-400 mt-1 text-center font-mono">
            📌 Default Testing PIN Admin/Staff: <code className="text-emerald-300 font-bold">123456</code>
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium text-center">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={isProcessing}>
            Batal
          </button>
          <button type="submit" className="btn btn-emerald btn-sm flex items-center gap-1.5" disabled={isProcessing}>
            <CheckCircle2 size={16} /> {isProcessing ? 'Verifikasi...' : 'Konfirmasi & Lunaskan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
