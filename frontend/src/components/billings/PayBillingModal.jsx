import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';

export const PayBillingModal = ({
  isOpen,
  onClose,
  billing,
  onConfirm,
}) => {
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashAmount, setCashAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);

  useEffect(() => {
    if (billing) {
      setPaymentMethod('CASH');
      setCashAmount(billing.patient_amount || 0);
      setTransferAmount(0);
    }
  }, [billing]);

  if (!billing) return null;

  const handleCashChange = (val) => {
    const cash = Number(val || 0);
    setCashAmount(cash);
    if (paymentMethod === 'SPLIT') {
      const remaining = Math.max(0, (billing.patient_amount || 0) - cash);
      setTransferAmount(remaining);
    }
  };

  const isSplitValid = paymentMethod !== 'SPLIT' || (cashAmount + transferAmount) === (billing.patient_amount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSplitValid) {
      alert('Kombinasi Nominal Split Payment harus tepat sama dengan Total Pelunasan Netto');
      return;
    }
    onConfirm({
      billing,
      paymentMethod,
      cashAmount,
      transferAmount,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Otorisasi Kasir Billing #${billing.ID || billing.id}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 text-xs">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Pasien:</span>
            <span className="font-semibold text-[var(--text-heading)]">{billing.patient_name}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-[var(--border-color)]">
            <span>Total Pelunasan Netto:</span>
            <span className="font-mono">Rp {(billing.patient_amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
            Metode Pembayaran (Kanal Kasir)
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              const method = e.target.value;
              setPaymentMethod(method);
              if (method === 'CASH') {
                setCashAmount(billing.patient_amount || 0);
                setTransferAmount(0);
              } else if (method === 'TRANSFER') {
                setCashAmount(0);
                setTransferAmount(billing.patient_amount || 0);
              } else if (method === 'SPLIT') {
                const half = Math.floor((billing.patient_amount || 0) / 2);
                setCashAmount(half);
                setTransferAmount((billing.patient_amount || 0) - half);
              }
            }}
            className="glass-input text-xs text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            <option value="CASH">CASH (Tunai Kasir)</option>
            <option value="TRANSFER">TRANSFER (Bank EDC / QRIS)</option>
            <option value="SPLIT">SPLIT PAYMENT (Kombinasi Tunai & Transfer)</option>
          </select>
        </div>

        {paymentMethod === 'SPLIT' ? (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Nominal Tunai (Cash)</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => handleCashChange(e.target.value)}
                className="glass-input text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Nominal Transfer / EDC</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value || 0))}
                className="glass-input text-xs font-mono"
              />
            </div>
            <div className="col-span-2 text-[11px] text-[var(--text-secondary)] flex justify-between">
              <span>Total Kombinasi:</span>
              <span className={`font-mono font-semibold ${isSplitValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                Rp {(cashAmount + transferAmount).toLocaleString('id-ID')} / Rp {(billing.patient_amount || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ) : paymentMethod === 'TRANSFER' ? (
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-1">
            <span className="text-cyan-600 dark:text-cyan-300 font-semibold block">Transfer Bank & QRIS Kasir</span>
            <p className="text-[11px] text-[var(--text-secondary)]">Nominal transfer penuh sejumlah Rp {(billing.patient_amount || 0).toLocaleString('id-ID')}.</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
            <span className="text-emerald-600 dark:text-emerald-300 font-semibold block">Pembayaran Tunai Kasir</span>
            <p className="text-[11px] text-[var(--text-secondary)]">Uang fisik tunai diterima langsung di meja kasir sejumlah Rp {(billing.patient_amount || 0).toLocaleString('id-ID')}.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm cursor-pointer">
            Batal
          </button>
          <button type="submit" disabled={!isSplitValid} className="btn btn-emerald btn-sm cursor-pointer">
            Lanjutkan Otorisasi 2FA
          </button>
        </div>
      </form>
    </Modal>
  );
};
