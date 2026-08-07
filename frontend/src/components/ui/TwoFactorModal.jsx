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
  description,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleCallback = onConfirm || onVerified;
  const modalTitle = actionTitle || title || 'Otentikasi Keamanan 2FA (Two-Factor Auth)';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin || pin.length < 4 || pin.length > 6) {
      setError('Masukkan 4 - 6 digit kode PIN 2FA Keamanan');
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
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h4 className="text-sm font-bold text-[var(--text-heading)]">Verifikasi Otorisasi Kasir & Admin</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            {description || 'Demi keamanan transaksi dan audit trail sistem, masukkan 4-6 digit Security PIN akun Anda untuk melanjutkan otorisasi.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> Kode 2FA Security PIN (4 - 6 Digit)
          </label>
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="Masukkan PIN (4-6 digit)..."
            className="glass-input font-mono text-center text-lg tracking-[0.3em] font-bold py-2.5"
            required
            autoFocus
          />
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 text-center font-mono">
            📌 Default Testing PIN Admin: <code className="text-emerald-600 dark:text-emerald-300 font-bold">1234</code> | Testing PIN Staff: <code className="text-emerald-600 dark:text-emerald-300 font-bold">123456</code>
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-medium text-center">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm cursor-pointer font-mono" disabled={isProcessing}>
            Batal
          </button>
          <button type="submit" className="btn btn-emerald btn-sm flex items-center gap-1.5 cursor-pointer shadow-md font-mono" disabled={isProcessing}>
            <CheckCircle2 size={16} /> {isProcessing ? 'Verifikasi...' : 'Konfirmasi & Lunaskan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
