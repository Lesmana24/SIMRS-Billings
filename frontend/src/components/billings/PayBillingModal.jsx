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

  const netPatientAmount = Number(billing?.patient_amount || 0);

  useEffect(() => {
    if (billing) {
      const net = Number(billing.patient_amount || 0);
      setPaymentMethod('CASH');
      setCashAmount(net);
      setTransferAmount(0);
    }
  }, [billing]);

  if (!billing) return null;

  const handleCashChange = (val) => {
    const cash = Number(val || 0);
    setCashAmount(cash);
    if (paymentMethod === 'SPLIT') {
      const remaining = Math.max(0, netPatientAmount - cash);
      setTransferAmount(remaining);
    }
  };

  const handleTransferChange = (val) => {
    const transfer = Number(val || 0);
    setTransferAmount(transfer);
  };

  const currentTotal = Number(cashAmount || 0) + Number(transferAmount || 0);
  const isSplitValid = paymentMethod !== 'SPLIT' || Math.abs(currentTotal - netPatientAmount) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSplitValid) {
      alert(`Kombinasi Split Payment (Rp ${currentTotal.toLocaleString('id-ID')}) harus tepat sama dengan Total Pelunasan Netto (Rp ${netPatientAmount.toLocaleString('id-ID')})`);
      return;
    }
    onConfirm({
      billing,
      paymentMethod,
      cashAmount: Number(cashAmount),
      transferAmount: Number(transferAmount),
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
            <span className="font-bold text-[var(--text-heading)]">{billing.patient_name}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-[var(--border-color)]">
            <span>Total Pelunasan Netto:</span>
            <span className="font-mono text-sm">Rp {netPatientAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold uppercase text-[var(--text-secondary)] mb-1">
            Metode Pembayaran (Kanal Kasir)
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => {
              const method = e.target.value;
              setPaymentMethod(method);
              if (method === 'CASH') {
                setCashAmount(netPatientAmount);
                setTransferAmount(0);
              } else if (method === 'TRANSFER') {
                setCashAmount(0);
                setTransferAmount(netPatientAmount);
              } else if (method === 'SPLIT') {
                const half = Math.floor(netPatientAmount / 2);
                setCashAmount(half);
                setTransferAmount(netPatientAmount - half);
              }
            }}
            className="glass-input text-xs text-[var(--text-primary)] bg-[var(--bg-input)] font-mono"
          >
            <option value="CASH">CASH (Tunai Kasir)</option>
            <option value="TRANSFER">TRANSFER (Bank EDC / QRIS)</option>
            <option value="SPLIT">SPLIT PAYMENT (Kombinasi Tunai & Transfer)</option>
          </select>
        </div>

        {paymentMethod === 'SPLIT' ? (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] mb-1">Nominal Tunai (Cash)</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => handleCashChange(e.target.value)}
                className="glass-input text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] mb-1">Nominal Transfer / EDC</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => handleTransferChange(e.target.value)}
                className="glass-input text-xs font-mono font-bold"
              />
            </div>
            <div className="col-span-2 text-[11px] font-mono text-[var(--text-secondary)] flex justify-between pt-1 border-t border-emerald-500/20">
              <span>Total Kombinasi:</span>
              <span className={`font-mono font-bold ${isSplitValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                Rp {currentTotal.toLocaleString('id-ID')} / Rp {netPatientAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ) : paymentMethod === 'TRANSFER' ? (
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-1">
            <span className="text-cyan-600 dark:text-cyan-300 font-bold block font-mono">Transfer Bank & QRIS Kasir</span>
            <p className="text-[11px] text-[var(--text-secondary)]">Nominal transfer penuh sejumlah Rp {netPatientAmount.toLocaleString('id-ID')}.</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
            <span className="text-emerald-600 dark:text-emerald-300 font-bold block font-mono">Pembayaran Tunai Kasir</span>
            <p className="text-[11px] text-[var(--text-secondary)]">Uang fisik tunai diterima langsung di meja kasir sejumlah Rp {netPatientAmount.toLocaleString('id-ID')}.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm cursor-pointer font-mono">
            Batal
          </button>
          <button type="submit" disabled={!isSplitValid} className="btn btn-emerald btn-sm cursor-pointer font-mono">
            Lanjutkan Otorisasi 2FA
          </button>
        </div>
      </form>
    </Modal>
  );
};
