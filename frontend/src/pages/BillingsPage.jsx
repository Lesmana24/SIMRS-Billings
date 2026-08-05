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

  // Derived calculation for Create Modal - support both action_name/amount and nama/harga
  const selectedTarifsList = tarifs.filter((t) => selectedTarifIds.includes(t.ID || t.id));
  const calculatedTotalAmount = selectedTarifsList.reduce((sum, t) => {
    const price = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
    return sum + price;
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setToast({ message: 'Nama pasien wajib diisi atau dipilih', type: 'error' });
      return;
    }
    if (selectedTarifIds.length === 0) {
      setToast({ message: 'Pilih minimal satu layanan medis', type: 'error' });
      return;
    }

    try {
      const finalInsuranceType = insuranceType === 'Lainnya' ? customInsuranceName : insuranceType;
      const patientUserId = selectedPatientUserId ? Number(selectedPatientUserId) : 0;

      await billingApi.create({
        patient_user_id: patientUserId,
        patient_name: patientName,
        insurance_type: finalInsuranceType,
        insurance_provider: finalInsuranceType,
        insurance_claim: Number(effectiveClaimAmount),
        insurance_claim_amount: Number(effectiveClaimAmount),
        bpjs_claim: Number(effectiveClaimAmount),
        tarif_ids: selectedTarifIds,
        action_ids: selectedTarifIds,
      });

      setToast({ message: 'Tagihan medis berhasil diterbitkan', type: 'success' });
      setIsCreateOpen(false);
      resetCreateForm();
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menerbitkan tagihan', type: 'error' });
    }
  };

  const resetCreateForm = () => {
    setSelectedPatientUserId('');
    setPatientName('');
    setInsuranceType('BPJS Kesehatan');
    setCustomInsuranceName('');
    setInsuranceClaimAmount(0);
    setSelectedTarifIds([]);
  };

  const handleTarifToggle = (id) => {
    setSelectedTarifIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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
    if (payModalBilling && paymentMethod === 'SPLIT') {
      const remaining = Math.max(0, (payModalBilling.patient_amount || 0) - cash);
      setTransferAmount(remaining);
    }
  };

  const isSplitValid = paymentMethod !== 'SPLIT' || (cashAmount + transferAmount === (payModalBilling?.patient_amount || 0));

  const handleConfirmPayModal = (e) => {
    e.preventDefault();
    if (!payModalBilling) return;
    if (!isSplitValid) {
      setToast({ message: `Total kombinasi (Rp ${(cashAmount + transferAmount).toLocaleString()}) harus tepat sama dengan beban pasien (Rp ${(payModalBilling.patient_amount || 0).toLocaleString()})`, type: 'error' });
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
          <h2 className="text-xl font-bold text-white tracking-wide">
            Transaksi Medical Billing SIMRS
          </h2>
          <p className="text-xs text-slate-400">Pengelolaan tagihan tindakan medis, verifikasi klaim penjamin, dan otorisasi kasir.</p>
        </div>
        <button
          onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}
          className="btn btn-emerald flex items-center gap-1.5"
        >
          <Plus size={16} /> Terbitkan Tagihan Baru
        </button>
      </div>

      {/* Control Filter Panel */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari pasien (contoh: Budi, BILL-102)..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-44"
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
                  <td colSpan={8} className="text-center text-slate-400 py-8">Memuat data transaksi billing...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-400 py-8">Tidak ada catatan tagihan ditemukan.</td>
                </tr>
              ) : (
                billings.map((b) => {
                  const isPaid = b.status === 'PAID';
                  return (
                    <tr key={b.ID || b.id}>
                      <td className="font-mono text-xs text-slate-400">#BILL-{b.ID || b.id}</td>
                      <td className="font-semibold text-white">{b.patient_name}</td>
                      <td className="font-mono text-xs text-slate-200">
                        Rp {(b.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-medium text-slate-200">{b.insurance_type || b.insurance_provider || 'Mandiri'}</span>
                          {(b.insurance_claim_amount > 0 || b.insurance_claim > 0) && (
                            <div className="text-[10px] text-emerald-400 font-mono">
                              Klaim: Rp {(b.insurance_claim_amount || b.insurance_claim || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-400">
                        Rp {(b.patient_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span className="font-mono text-[11px] text-slate-300 uppercase">
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
                            className="btn btn-secondary btn-sm"
                            title="Cetak Struk SIMRS"
                          >
                            <Printer size={14} /> Struk
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => openPayModal(b)}
                              className="btn btn-emerald btn-sm flex items-center gap-1"
                            >
                              <CheckCircle size={14} /> Otorisasi Bayar
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteBilling(b)}
                            className="btn btn-danger btn-sm p-1.5"
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
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
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
              className="glass-input text-xs mb-2"
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

            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Penyedia Penjamin / Asuransi
              </label>
              <select
                value={insuranceType}
                onChange={handleInsuranceTypeChange}
                className="glass-input text-xs"
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

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Nominal Klaim Penjamin (IDR)
              </label>
              <input
                type="number"
                disabled={isNoInsurance}
                value={insuranceClaimAmount}
                onChange={(e) => setInsuranceClaimAmount(e.target.value)}
                placeholder="0"
                className={`glass-input text-xs font-mono ${isNoInsurance ? 'opacity-40 cursor-not-allowed bg-slate-900/50' : ''}`}
              />
            </div>
          </div>

          {insuranceType === 'Lainnya' && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Nama Asuransi Swasta Tambahan
              </label>
              <input
                type="text"
                value={customInsuranceName}
                onChange={(e) => setCustomInsuranceName(e.target.value)}
                placeholder="Masukkan nama perusahaan penjamin..."
                className="glass-input text-xs"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
              Pilih Layanan / Tindakan Medis SIMRS
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {tarifs.map((t) => {
                const isSelected = selectedTarifIds.includes(t.ID || t.id);
                const name = t.action_name || t.nama || 'Tindakan Medis';
                const price = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
                const code = t.kode || t.ID || t.id;

                return (
                  <div
                    key={t.ID || t.id}
                    onClick={() => handleTarifToggle(t.ID || t.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-white font-semibold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-100">{name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Ref Kode: #{code}</span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-400">
                      Rp {price.toLocaleString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Total Bruto Tindakan:</span>
              <span className="font-mono text-slate-200">Rp {calculatedTotalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Klaim Penjamin ({insuranceType}):</span>
              <span className="font-mono text-emerald-400">- Rp {effectiveClaimAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
              <span>Beban Netto Pasien:</span>
              <span className="font-mono text-emerald-400">Rp {calculatedPatientAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-emerald btn-sm">
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
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Pasien:</span>
              <span className="font-semibold text-white">{payModalBilling?.patient_name}</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-800">
              <span>Total Pelunasan Netto:</span>
              <span className="font-mono">Rp {(payModalBilling?.patient_amount || 0).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
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
              className="glass-input text-xs"
            >
              <option value="CASH">CASH (Tunai Kasir)</option>
              <option value="TRANSFER">TRANSFER (Bank EDC / QRIS)</option>
              <option value="SPLIT">SPLIT PAYMENT (Kombinasi Tunai & Transfer)</option>
            </select>
          </div>

          {paymentMethod === 'SPLIT' ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nominal Tunai (Cash)</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => handleCashChange(e.target.value)}
                  className="glass-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nominal Transfer / EDC</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value || 0))}
                  className="glass-input text-xs font-mono"
                />
              </div>
              <div className="col-span-2 text-[11px] text-slate-400 flex justify-between">
                <span>Total Kombinasi:</span>
                <span className={`font-mono font-semibold ${isSplitValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Rp {(cashAmount + transferAmount).toLocaleString('id-ID')} / Rp {(payModalBilling?.patient_amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setPayModalBilling(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" disabled={!isSplitValid} className="btn btn-emerald btn-sm">
              Lanjutkan Otorisasi 2FA
            </button>
          </div>
        </form>
      </Modal>

      {/* 2FA PIN Modal */}
      {twoFactorBilling && (
        <TwoFactorModal
          isOpen={true}
          onClose={() => setTwoFactorBilling(null)}
          onVerified={handle2FAVerified}
          actionTitle={`Otorisasi Pelunasan #${twoFactorBilling.billing.ID || twoFactorBilling.billing.id}`}
        />
      )}

      {/* Receipt Modal */}
      {selectedBilling && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedBilling(null)}
          billing={selectedBilling}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteBilling} onClose={() => setDeleteBilling(null)} title="Hapus Dokumen Billing">
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Apakah Anda yakin ingin menghapus dokumen tagihan pasien <strong className="text-white">{deleteBilling?.patient_name}</strong> (#BILL-{deleteBilling?.ID || deleteBilling?.id})?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setDeleteBilling(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="button" onClick={handleDeleteBilling} className="btn btn-danger btn-sm">
              Ya, Hapus Billing
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
