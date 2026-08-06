import React, { useState, useEffect, useCallback } from 'react';
import { billingApi, tarifApi, userApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { TwoFactorModal } from '../components/ui/TwoFactorModal';
import { Search, Plus, Printer, CheckCircle, Filter, Trash2 } from 'lucide-react';

export const BillingsPage = () => {
  const [billings, setBillings] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null); // Receipt Modal
  const [deleteBilling, setDeleteBilling] = useState(null); // Delete Modal
  const [twoFactorBilling, setTwoFactorBilling] = useState(null); // 2FA Verification

  // Create Form State
  const [selectedPatientUserId, setSelectedPatientUserId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [insuranceType, setInsuranceType] = useState('BPJS Kesehatan');
  const [customInsuranceName, setCustomInsuranceName] = useState('');
  const [insuranceClaimAmount, setInsuranceClaimAmount] = useState(0);
  const [selectedTarifIds, setSelectedTarifIds] = useState([]);
  const [tarifQuantities, setTarifQuantities] = useState({});

  // Payment Breakdown State (For Pay Modal)
  const [payModalBilling, setPayModalBilling] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashAmount, setCashAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await billingApi.getAll(params);
      setBillings(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat daftar tagihan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchTarifsAndPatients = async () => {
    try {
      const [tarifRes, userRes] = await Promise.all([
        tarifApi.getAll({ limit: 100 }),
        userApi.getAll({ limit: 100 }),
      ]);
      setTarifs(tarifRes.data || []);
      const allUsers = userRes.data || [];
      const patientUsers = allUsers.filter((u) => (u.role || '').toLowerCase() === 'pasien');
      setPatients(patientUsers);
    } catch (err) {
      console.error('Gagal memuat master data:', err);
    }
  };

  useEffect(() => {
    fetchBillings();
    fetchTarifsAndPatients();
  }, [fetchBillings]);

  // Derived calculation for Create Modal - support quantity per item
  const selectedTarifsList = tarifs.filter((t) => selectedTarifIds.includes(t.ID || t.id));
  const calculatedTotalAmount = selectedTarifsList.reduce((sum, t) => {
    const price = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
    const qty = tarifQuantities[t.ID || t.id] || 1;
    return sum + (price * qty);
  }, 0);

  const isNoInsurance = insuranceType === 'Tanpa Asuransi (Mandiri)';
  const effectiveClaimAmount = isNoInsurance ? 0 : Number(insuranceClaimAmount || 0);
  const calculatedPatientAmount = Math.max(0, calculatedTotalAmount - effectiveClaimAmount);

  const handleInsuranceTypeChange = (e) => {
    const val = e.target.value;
    setInsuranceType(val);
    if (val === 'Tanpa Asuransi (Mandiri)') {
      setInsuranceClaimAmount(0);
    }
  };

  const handleTarifToggle = (id) => {
    if (selectedTarifIds.includes(id)) {
      setSelectedTarifIds(selectedTarifIds.filter((tId) => tId !== id));
      const nextQty = { ...tarifQuantities };
      delete nextQty[id];
      setTarifQuantities(nextQty);
    } else {
      setSelectedTarifIds([...selectedTarifIds, id]);
      setTarifQuantities({ ...tarifQuantities, [id]: 1 });
    }
  };

  const handleQuantityChange = (id, delta, e) => {
    if (e) e.stopPropagation();
    const current = tarifQuantities[id] || 1;
    const nextVal = Math.max(1, current + delta);
    setTarifQuantities({ ...tarifQuantities, [id]: nextVal });
  };

  const resetCreateForm = () => {
    setSelectedPatientUserId('');
    setPatientName('');
    setInsuranceType('BPJS Kesehatan');
    setCustomInsuranceName('');
    setInsuranceClaimAmount(0);
    setSelectedTarifIds([]);
    setTarifQuantities({});
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || selectedTarifIds.length === 0) {
      setToast({ message: 'Harap isi nama pasien dan pilih minimal 1 tindakan medis', type: 'error' });
      return;
    }

    const itemsPayload = selectedTarifIds.map((tId) => {
      const found = tarifs.find((t) => (t.ID || t.id) === tId);
      const price = typeof found?.amount === 'number' ? found.amount : (found?.amount ? parseFloat(found.amount) : (found?.harga || 0));
      return {
        tarif_id: Number(tId),
        item_name: found?.action_name || found?.nama || 'Tindakan Medis',
        quantity: Number(tarifQuantities[tId] || 1),
        unit_price: price,
      };
    });

    const finalInsuranceProvider = insuranceType === 'Lainnya' ? (customInsuranceName || 'Asuransi Swasta') : insuranceType;

    try {
      await billingApi.create({
        user_id: selectedPatientUserId ? Number(selectedPatientUserId) : 0,
        patient_name: patientName,
        insurance_type: finalInsuranceProvider,
        insurance_provider: finalInsuranceProvider,
        insurance_claim: effectiveClaimAmount,
        insurance_claim_amount: effectiveClaimAmount,
        items: itemsPayload,
      });

      setToast({ message: 'Billing tagihan pasien berhasil diterbitkan!', type: 'success' });
      setIsCreateOpen(false);
      resetCreateForm();
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menerbitkan tagihan', type: 'error' });
    }
  };

  const openPayModal = (b) => {
    setPayModalBilling(b);
    setPaymentMethod('CASH');
    setCashAmount(b.patient_amount || 0);
    setTransferAmount(0);
  };

  const handleCashChange = (val) => {
    const cash = Number(val || 0);
    setCashAmount(cash);
    if (paymentMethod === 'SPLIT' && payModalBilling) {
      const remaining = Math.max(0, (payModalBilling.patient_amount || 0) - cash);
      setTransferAmount(remaining);
    }
  };

  const isSplitValid = paymentMethod !== 'SPLIT' || (cashAmount + transferAmount) === (payModalBilling?.patient_amount || 0);

  const handleConfirmPayModal = (e) => {
    e.preventDefault();
    if (!payModalBilling) return;
    if (!isSplitValid) {
      setToast({ message: 'Kombinasi Nominal Split Payment harus tepat sama dengan Total Pelunasan Netto', type: 'error' });
      return;
    }
    // Open 2FA PIN Modal
    setTwoFactorBilling({
      billing: payModalBilling,
      paymentMethod,
      cashAmount,
      transferAmount,
    });
    setPayModalBilling(null);
  };

  const handle2FAVerified = async (pinCode) => {
    if (!twoFactorBilling) return;
    const { billing, paymentMethod, cashAmount, transferAmount } = twoFactorBilling;

    try {
      await billingApi.pay(billing.ID || billing.id, {
        payment_method: paymentMethod,
        cash_amount: Number(cashAmount),
        transfer_amount: Number(transferAmount),
      }, pinCode);

      setToast({ message: `Otorisasi pembayaran #${billing.ID || billing.id} berhasil!`, type: 'success' });
      setTwoFactorBilling(null);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal memproses otorisasi kasir', type: 'error' });
    }
  };

  const handleDeleteBilling = async () => {
    if (!deleteBilling) return;
    try {
      await billingApi.delete(deleteBilling.ID || deleteBilling.id);
      setToast({ message: 'Dokumen tagihan berhasil dihapus', type: 'success' });
      setDeleteBilling(null);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus tagihan', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-heading)] tracking-wide">
            Transaksi Medical Billing SIMRS
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">Pengelolaan tagihan tindakan medis, verifikasi klaim penjamin, dan otorisasi kasir.</p>
        </div>
        <button
          onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
          className="btn btn-emerald flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Plus size={16} /> Terbitkan Tagihan Baru
        </button>
      </div>

      {/* Control Filter Panel */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari pasien (contoh: Budi, BILL-102)..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-[var(--text-secondary)]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-44 text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            <option value="">Semua Status Otorisasi</option>
            <option value="PENDING">PENDING (Belum Lunas)</option>
            <option value="PAID">PAID (Lunas Verifikasi)</option>
          </select>
        </div>
      </div>

      {/* Primary SIMRS Table */}
      <div className="glass-panel p-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Ref Billing</th>
                <th>Pasien SIMRS</th>
                <th>Total Bruto (IDR)</th>
                <th>Skema Penjamin</th>
                <th>Beban Netto Pasien</th>
                <th>Kanal Bayar</th>
                <th>Status Otorisasi</th>
                <th className="text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8">Memuat data transaksi billing...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8">Tidak ada catatan tagihan ditemukan.</td>
                </tr>
              ) : (
                billings.map((b) => {
                  const isPaid = b.status === 'PAID';
                  return (
                    <tr key={b.ID || b.id}>
                      <td className="font-mono text-xs text-[var(--text-secondary)]">#BILL-{b.ID || b.id}</td>
                      <td className="font-semibold text-[var(--text-heading)]">{b.patient_name}</td>
                      <td className="font-mono text-xs text-[var(--text-primary)]">
                        Rp {(b.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-medium text-[var(--text-primary)]">{b.insurance_type || b.insurance_provider || 'Mandiri'}</span>
                          {(b.insurance_claim_amount > 0 || b.insurance_claim > 0) && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                              Klaim: Rp {(b.insurance_claim_amount || b.insurance_claim || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {(b.patient_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)] uppercase">
                          {b.payment_method || '-'}
                        </span>
                      </td>
                      <td>
                        <Badge variant={isPaid ? 'paid' : 'pending'}>{b.status}</Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBilling(b)}
                            className="btn btn-secondary btn-sm cursor-pointer"
                            title="Cetak Struk SIMRS"
                          >
                            <Printer size={14} /> Struk
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => openPayModal(b)}
                              className="btn btn-emerald btn-sm flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle size={14} /> Otorisasi Bayar
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteBilling(b)}
                            className="btn btn-danger btn-sm p-1.5 cursor-pointer"
                            title="Hapus Billing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalRows={totalRows}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Modal Terbitkan Tagihan Baru */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Terbitkan Tagihan Medis SIMRS Baru"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Pilih Akun Pasien Terdaftar (Relasi Data)
            </label>
            <select
              value={selectedPatientUserId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedPatientUserId(id);
                const found = patients.find((p) => String(p.ID || p.id) === String(id));
                if (found) {
                  setPatientName(found.username);
                }
              }}
              className="glass-input text-xs mb-2 text-[var(--text-primary)] bg-[var(--bg-input)]"
            >
              <option value="">-- (Opsional) Pilih Akun Pasien Terdaftar --</option>
              {patients
                .filter((p) => (p.role || '').toLowerCase() === 'pasien')
                .map((p) => (
                  <option key={p.ID || p.id} value={p.ID || p.id}>
                    {p.username} (Pasien SIMRS • ID #{p.ID || p.id})
                  </option>
                ))}
            </select>

            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
              Nama Pasien SIMRS
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="glass-input text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
                Penyedia Penjamin / Asuransi
              </label>
              <select
                value={insuranceType}
                onChange={handleInsuranceTypeChange}
                className="glass-input text-xs text-[var(--text-primary)] bg-[var(--bg-input)]"
              >
                <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                <option value="Prudential">Prudential</option>
                <option value="Manulife">Manulife</option>
                <option value="Allianz">Allianz</option>
                <option value="FWD Insurance">FWD Insurance</option>
                <option value="AXA Mandiri">AXA Mandiri</option>
                <option value="Tanpa Asuransi (Mandiri)">Tanpa Asuransi (Mandiri)</option>
                <option value="Lainnya">Lainnya...</option>
              </select>
            </div>

            {!isNoInsurance && (
              <div>
                <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">
                  Nominal Subsidi / Klaim (IDR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={insuranceClaimAmount}
                  onChange={(e) => setInsuranceClaimAmount(Number(e.target.value))}
                  placeholder="0"
                  className="glass-input text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5">
              Pilih Items / Layanan Medis Ditindak
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {tarifs.map((t) => {
                const targetId = t.ID || t.id;
                const isSelected = selectedTarifIds.includes(targetId);
                const code = t.kode || targetId;
                const name = t.action_name || t.nama;
                const unitPrice = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
                const qty = tarifQuantities[targetId] || 1;
                const itemSubtotal = unitPrice * qty;

                return (
                  <div
                    key={targetId}
                    onClick={() => handleTarifToggle(targetId)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-[var(--text-heading)] font-semibold'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[var(--text-heading)]">{name}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] block font-mono">
                        Ref Kode: #{code} • @ Rp {unitPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isSelected && (
                        <div
                          className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-emerald-500/40 rounded-lg p-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => handleQuantityChange(targetId, -1, e)}
                            className="w-5 h-5 rounded bg-[var(--bg-subtle)] hover:bg-emerald-500/30 text-[var(--text-heading)] font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Kurangi Qty"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {qty}x
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQuantityChange(targetId, 1, e)}
                            className="w-5 h-5 rounded bg-[var(--bg-subtle)] hover:bg-emerald-500/30 text-[var(--text-heading)] font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Tambah Qty"
                          >
                            +
                          </button>
                        </div>
                      )}
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        Rp {itemSubtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 text-xs">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Total Bruto Tindakan:</span>
              <span className="font-mono text-[var(--text-primary)]">Rp {calculatedTotalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Klaim Penjamin ({insuranceType}):</span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400">- Rp {effectiveClaimAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--text-heading)] pt-1 border-t border-[var(--border-color)]">
              <span>Beban Netto Pasien:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Rp {calculatedPatientAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm cursor-pointer">
              Batal
            </button>
            <button type="submit" className="btn btn-emerald btn-sm cursor-pointer">
              Terbitkan Tagihan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Otorisasi Pembayaran (Kasir) */}
      <Modal
        isOpen={!!payModalBilling}
        onClose={() => setPayModalBilling(null)}
        title={`Otorisasi Kasir Billing #${payModalBilling?.ID || payModalBilling?.id}`}
      >
        <form onSubmit={handleConfirmPayModal} className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 text-xs">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Pasien:</span>
              <span className="font-semibold text-[var(--text-heading)]">{payModalBilling?.patient_name}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-[var(--border-color)]">
              <span>Total Pelunasan Netto:</span>
              <span className="font-mono">Rp {(payModalBilling?.patient_amount || 0).toLocaleString('id-ID')}</span>
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
                  setCashAmount(payModalBilling?.patient_amount || 0);
                  setTransferAmount(0);
                } else if (method === 'TRANSFER') {
                  setCashAmount(0);
                  setTransferAmount(payModalBilling?.patient_amount || 0);
                } else if (method === 'SPLIT') {
                  const half = Math.floor((payModalBilling?.patient_amount || 0) / 2);
                  setCashAmount(half);
                  setTransferAmount((payModalBilling?.patient_amount || 0) - half);
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
                  Rp {(cashAmount + transferAmount).toLocaleString('id-ID')} / Rp {(payModalBilling?.patient_amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : paymentMethod === 'TRANSFER' ? (
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-1">
              <span className="text-cyan-600 dark:text-cyan-300 font-semibold block">Transfer Bank & QRIS Kasir</span>
              <p className="text-[11px] text-[var(--text-secondary)]">Nominal transfer penuh sejumlah Rp {(payModalBilling?.patient_amount || 0).toLocaleString('id-ID')}.</p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <span className="text-emerald-600 dark:text-emerald-300 font-semibold block">Pembayaran Tunai Kasir</span>
              <p className="text-[11px] text-[var(--text-secondary)]">Uang fisik tunai diterima langsung di meja kasir sejumlah Rp {(payModalBilling?.patient_amount || 0).toLocaleString('id-ID')}.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setPayModalBilling(null)} className="btn btn-secondary btn-sm cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={!isSplitValid} className="btn btn-emerald btn-sm cursor-pointer">
              Lanjutkan Otorisasi 2FA
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2FA Verification */}
      {twoFactorBilling && (
        <TwoFactorModal
          isOpen={true}
          onClose={() => setTwoFactorBilling(null)}
          onVerified={handle2FAVerified}
          title="Otorisasi Kasir 2FA PIN"
          description={`Masukkan 6-digit Security PIN akun Anda untuk menyelesaikan otorisasi pembayaran #${twoFactorBilling.billing.ID || twoFactorBilling.billing.id}.`}
        />
      )}

      {/* Modal Delete Billing */}
      <Modal isOpen={!!deleteBilling} onClose={() => setDeleteBilling(null)} title="Konfirmasi Hapus Tagihan">
        <div className="space-y-3 text-xs">
          <p className="text-[var(--text-primary)]">
            Apakah Anda yakin ingin menghapus tagihan <strong className="text-[var(--text-heading)]">#BILL-{deleteBilling?.ID || deleteBilling?.id}</strong> milik pasien <strong className="text-[var(--text-heading)]">{deleteBilling?.patient_name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setDeleteBilling(null)} className="btn btn-secondary btn-sm cursor-pointer">
              Batal
            </button>
            <button type="button" onClick={handleDeleteBilling} className="btn btn-danger btn-sm cursor-pointer">
              Ya, Hapus Tagihan
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {selectedBilling && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedBilling(null)}
          billing={selectedBilling}
        />
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
