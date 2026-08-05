import React, { useState, useEffect, useCallback } from 'react';
import { billingApi, tarifApi, userApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { TwoFactorModal } from '../components/ui/TwoFactorModal';
import { 
  Receipt, 
  Plus, 
  Search, 
  CreditCard, 
  Printer, 
  Trash2, 
  CheckCircle2,
  ShieldCheck,
  User,
  Filter,
  Eye,
  Check,
  X,
  Image as ImageIcon,
  ExternalLink,
  Minus,
  DollarSign,
  Building,
  AlertCircle
} from 'lucide-react';

export const BillingsPage = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [payBilling, setPayBilling] = useState(null);
  const [verifyBilling, setVerifyBilling] = useState(null);
  const [receiptBilling, setReceiptBilling] = useState(null);
  const [deleteBilling, setDeleteBilling] = useState(null);
  const [is2FAOpen, setIs2FAOpen] = useState(false);
  const [pendingActionType, setPendingActionType] = useState(null); // 'DIRECT' or 'VERIFY'

  // Data helpers for creation
  const [pasiensList, setPasiensList] = useState([]);
  const [tarifsList, setTarifsList] = useState([]);

  // Create Form State: selectedActions is { [actionId]: quantity }
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [bpjsClaim, setBpjsClaim] = useState(0);
  const [insuranceProvider, setInsuranceProvider] = useState('BPJS Kesehatan');
  const [selectedActions, setSelectedActions] = useState({});
  const [modalTarifSearch, setModalTarifSearch] = useState('');

  // Payment Breakdown State
  const [payMethod, setPayMethod] = useState('CASH');
  const [splitCashAmt, setSplitCashAmt] = useState(0);
  const [splitTransferAmt, setSplitTransferAmt] = useState(0);

  // Payment Idempotency & Verification State
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const isNoInsurance = insuranceProvider.includes('Tanpa Asuransi');

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
      setToast({ message: err.message || 'Gagal memuat tagihan medis', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const openCreateModal = async () => {
    setIsCreateOpen(true);
    setSelectedPatientId('');
    setBpjsClaim(0);
    setInsuranceProvider('BPJS Kesehatan');
    setSelectedActions({});
    setModalTarifSearch('');

    try {
      const [uRes, tRes] = await Promise.all([
        userApi.getAll({ role: 'pasien', limit: 100 }),
        tarifApi.getAll({ limit: 100 }),
      ]);
      setPasiensList(uRes.data || []);
      setTarifsList(tRes.data || []);
    } catch (err) {
      setToast({ message: 'Gagal memuat data master pasien/tarif', type: 'error' });
    }
  };

  const handleInsuranceProviderChange = (providerVal) => {
    setInsuranceProvider(providerVal);
    if (providerVal.includes('Tanpa Asuransi')) {
      setBpjsClaim(0);
    }
  };

  const handleActionToggle = (id) => {
    setSelectedActions((prev) => {
      const copy = { ...prev };
      if (copy[id]) {
        delete copy[id];
      } else {
        copy[id] = 1;
      }
      return copy;
    });
  };

  const handleQuantityChange = (id, qty) => {
    const val = Math.max(1, Math.min(99, Number(qty) || 1));
    setSelectedActions((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setToast({ message: 'Pilih pasien terlebih dahulu', type: 'error' });
      return;
    }

    const items = Object.entries(selectedActions).map(([actionId, qty]) => ({
      action_id: Number(actionId),
      quantity: Number(qty) || 1,
    }));

    if (items.length === 0) {
      setToast({ message: 'Pilih minimal satu tindakan medis/tarif', type: 'error' });
      return;
    }

    const actualClaim = isNoInsurance ? 0 : (Number(bpjsClaim) || 0);

    try {
      await billingApi.create({
        patient_user_id: Number(selectedPatientId),
        insurance_provider: insuranceProvider,
        insurance_claim: actualClaim,
        bpjs_claim: actualClaim,
        items: items,
        action_ids: items.map(i => i.action_id),
      });

      setToast({ message: 'Tagihan medis pasien berhasil dibuat', type: 'success' });
      setIsCreateOpen(false);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal membuat tagihan', type: 'error' });
    }
  };

  const openPayModal = (billing) => {
    setPayBilling(billing);
    setPayMethod('CASH');
    const netAmt = Number(billing.patient_amount || 0);
    const half = Math.floor(netAmt / 2);
    setSplitCashAmt(half);
    setSplitTransferAmt(netAmt - half);
    setIdempotencyKey(`PAY-BILL-${billing.ID || billing.id}-${Date.now()}`);
  };

  const openVerifyModal = (billing) => {
    setVerifyBilling(billing);
    setPayMethod('TRANSFER');
    const netAmt = Number(billing.patient_amount || 0);
    const half = Math.floor(netAmt / 2);
    setSplitCashAmt(half);
    setSplitTransferAmt(netAmt - half);
    setIdempotencyKey(`VERIFY-BILL-${billing.ID || billing.id}-${Date.now()}`);
  };

  const handleSplitCashChange = (val, targetNetAmt) => {
    const cash = Number(val) || 0;
    setSplitCashAmt(val);
    if (targetNetAmt != null) {
      setSplitTransferAmt(Math.max(0, targetNetAmt - cash));
    }
  };

  const handleSplitTransferChange = (val, targetNetAmt) => {
    const transfer = Number(val) || 0;
    setSplitTransferAmt(val);
    if (targetNetAmt != null) {
      setSplitCashAmt(Math.max(0, targetNetAmt - transfer));
    }
  };

  const trigger2FAPayment = (actionType) => {
    const targetBilling = actionType === 'VERIFY' ? verifyBilling : payBilling;
    if (!targetBilling) return;

    const netAmt = Number(targetBilling.patient_amount || 0);
    if (payMethod === 'SPLIT') {
      const sum = Number(splitCashAmt || 0) + Number(splitTransferAmt || 0);
      if (sum !== netAmt) {
        setToast({ 
          message: `Total pembayaran split (Rp ${sum.toLocaleString('id-ID')}) harus SAMA PERSIS dengan total tagihan bersih (Rp ${netAmt.toLocaleString('id-ID')})`, 
          type: 'error' 
        });
        return;
      }
    }

    setPendingActionType(actionType);
    setIs2FAOpen(true);
  };

  const executeConfirmedPayment = async (twoFactorPIN) => {
    setIsProcessing(true);
    setIs2FAOpen(false);

    try {
      if (pendingActionType === 'VERIFY') {
        if (!verifyBilling) return;
        const netAmt = Number(verifyBilling.patient_amount || 0);
        const res = await billingApi.pay(verifyBilling.ID || verifyBilling.id, idempotencyKey, {
          payment_method: payMethod,
          cash_amount: payMethod === 'SPLIT' ? Number(splitCashAmt) : (payMethod === 'CASH' ? netAmt : 0),
          transfer_amount: payMethod === 'SPLIT' ? Number(splitTransferAmt) : (payMethod === 'CASH' ? 0 : netAmt),
          two_factor_pin: twoFactorPIN,
        });

        setToast({ message: res.message || 'Pembayaran berhasil disetujui & dilunaskan!', type: 'success' });
        const updatedData = res.data || verifyBilling;
        setVerifyBilling(null);
        setReceiptBilling(updatedData);
        fetchBillings();
      } else if (pendingActionType === 'DIRECT') {
        if (!payBilling) return;
        const netAmt = Number(payBilling.patient_amount || 0);
        const res = await billingApi.pay(payBilling.ID || payBilling.id, idempotencyKey, {
          payment_method: payMethod,
          cash_amount: payMethod === 'SPLIT' ? Number(splitCashAmt) : (payMethod === 'CASH' ? netAmt : 0),
          transfer_amount: payMethod === 'SPLIT' ? Number(splitTransferAmt) : (payMethod === 'CASH' ? 0 : netAmt),
          two_factor_pin: twoFactorPIN,
        });

        setToast({ message: res.message || 'Pembayaran kasir berhasil diproses!', type: 'success' });
        const updatedData = res.data || payBilling;
        setPayBilling(null);
        setReceiptBilling(updatedData);
        fetchBillings();
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memproses pembayaran 2FA', type: 'error' });
    } finally {
      setIsProcessing(false);
      setPendingActionType(null);
    }
  };

  const handleRejectVerification = async () => {
    if (!verifyBilling) return;
    setIsProcessing(true);

    try {
      await billingApi.reject(verifyBilling.ID || verifyBilling.id);
      setToast({ message: 'Bukti pembayaran berhasil ditolak', type: 'success' });
      setVerifyBilling(null);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menolak bukti pembayaran', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBilling = async () => {
    if (!deleteBilling) return;

    try {
      await billingApi.delete(deleteBilling.ID || deleteBilling.id);
      setToast({ message: 'Tagihan berhasil dihapus', type: 'success' });
      setDeleteBilling(null);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus tagihan', type: 'error' });
    }
  };

  const formatIDR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const selectedActionsCount = Object.keys(selectedActions).length;

  const selectedTarifsSum = Object.entries(selectedActions).reduce((sum, [id, qty]) => {
    const found = tarifsList.find((t) => String(t.ID || t.id) === String(id));
    return sum + (found ? Number(found.amount) * Number(qty) : 0);
  }, 0);

  const actualClaim = isNoInsurance ? 0 : Number(bpjsClaim || 0);
  const netPatientAmountPreview = Math.max(0, selectedTarifsSum - actualClaim);

  const filteredModalTarifs = tarifsList.filter((t) =>
    (t.action_name || '').toLowerCase().includes(modalTarifSearch.toLowerCase())
  );

  const activeTargetBilling = pendingActionType === 'VERIFY' ? verifyBilling : payBilling;
  const currentPayNetAmt = activeTargetBilling ? Number(activeTargetBilling.patient_amount || 0) : (payBilling ? Number(payBilling.patient_amount || 0) : 0);
  const currentSplitSum = Number(splitCashAmt || 0) + Number(splitTransferAmt || 0);
  const isSplitValid = payMethod !== 'SPLIT' || currentSplitSum === currentPayNetAmt;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Receipt className="text-indigo-400" size={22} /> Transaksi Medical Billing
          </h2>
          <p className="text-xs text-gray-400">Pengelolaan tagihan tindakan medis, verifikasi transfer bank pasien, dan pelunasan idempoten.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary btn-sm">
          <Plus size={16} /> Buat Tagihan Pasien Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama pasien atau ID tagihan..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-48"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending (Belum Lunas)</option>
            <option value="WAITING_VERIFICATION">Menunggu Verifikasi Kasir</option>
            <option value="PAID">PAID (Sudah Lunas)</option>
            <option value="REJECTED">Bukti Ditolak</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-5">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Tagihan</th>
                <th>Nama Pasien</th>
                <th>Total Tindakan</th>
                <th>Asuransi / BPJS</th>
                <th>Bersih Pasien</th>
                <th>Metode</th>
                <th>Status</th>
                <th className="text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-8">Memuat tagihan medis...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-8">Tidak ada data tagihan medis.</td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.ID || b.id}>
                    <td className="font-mono text-xs text-gray-400">#BILL-{b.ID || b.id}</td>
                    <td className="font-semibold text-white">{b.patient_name}</td>
                    <td className="number-font">{formatIDR(b.total_amount)}</td>
                    <td className="number-font text-cyan-400">
                      <div>{formatIDR(b.insurance_claim || b.bpjs_amount)}</div>
                      <span className="text-[10px] text-gray-400 block font-sans">
                        {b.insurance_provider || 'BPJS Kesehatan'}
                      </span>
                    </td>
                    <td className="number-font font-bold text-emerald-400">{formatIDR(b.patient_amount)}</td>
                    <td>
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                        {b.payment_method || 'CASH'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'WAITING_VERIFICATION' ? (
                          <button
                            onClick={() => openVerifyModal(b)}
                            className="btn btn-primary btn-sm bg-cyan-600 hover:bg-cyan-500 border-cyan-400"
                            title="Verifikasi Bukti Pembayaran Pasien"
                          >
                            <Eye size={14} /> Verifikasi Kasir
                          </button>
                        ) : b.status === 'Pending' || b.status === 'REJECTED' ? (
                          <button
                            onClick={() => openPayModal(b)}
                            className="btn btn-emerald btn-sm"
                            title="Proses Pembayaran Tunai / EDC / Split Kasir"
                          >
                            <CreditCard size={14} /> Bayar Kasir
                          </button>
                        ) : (
                          <button
                            onClick={() => setReceiptBilling(b)}
                            className="btn btn-secondary btn-sm text-emerald-400"
                            title="Lihat / Cetak Struk"
                          >
                            <Printer size={14} /> Struk
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteBilling(b)}
                          className="btn btn-danger btn-sm p-2"
                          title="Hapus Tagihan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Modal Create Medical Billing */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Tagihan Medical Billing Baru" maxWidth="max-w-xl">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1 flex items-center gap-1">
              <User size={14} className="text-indigo-400" /> Pilih Pasien SIMRS
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="glass-input"
              required
            >
              <option value="">-- Pilih Pasien Terdaftar --</option>
              {pasiensList.map((p) => (
                <option key={p.ID || p.id} value={p.ID || p.id}>
                  {p.username} (ID: {p.ID || p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 mb-1 flex items-center gap-1">
                <Building size={14} className="text-cyan-400" /> Penyedia Asuransi (Swasta / BPJS)
              </label>
              <select
                value={insuranceProvider}
                onChange={(e) => handleInsuranceProviderChange(e.target.value)}
                className="glass-input text-xs"
              >
                <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                <option value="Prudential">Prudential Insurance</option>
                <option value="Manulife">Manulife Indonesia</option>
                <option value="Allianz">Allianz Life</option>
                <option value="Sinarmas MSIG">Sinarmas MSIG</option>
                <option value="AXA Mandiri">AXA Mandiri</option>
                <option value="Cigna Insurance">Cigna Insurance</option>
                <option value="Sequis Life">Sequis Life</option>
                <option value="Mandiri (Tanpa Asuransi)">Tanpa Asuransi (Mandiri)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-300 mb-1 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-400" /> Nominal Klaim Asuransi (IDR)
              </label>
              <input
                type="number"
                value={isNoInsurance ? 0 : bpjsClaim}
                disabled={isNoInsurance}
                onChange={(e) => setBpjsClaim(e.target.value)}
                placeholder="0"
                className={`glass-input text-xs font-mono ${
                  isNoInsurance ? 'opacity-40 cursor-not-allowed bg-black/40 text-gray-500' : ''
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-gray-300">
                Pilih Rincian & Kuantitas Layanan Medis
              </label>
              {selectedActionsCount > 0 && (
                <span className="text-[11px] font-semibold text-indigo-400 font-mono">
                  {selectedActionsCount} item dipilih
                </span>
              )}
            </div>

            {/* Quick Search for Tarifs */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={modalTarifSearch}
                onChange={(e) => setModalTarifSearch(e.target.value)}
                placeholder="Cari tindakan medis (misal: EKG, USG, Darah, Rawat)..."
                className="glass-input glass-input-icon text-xs py-2"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-xl bg-white/5 border border-white/10">
              {filteredModalTarifs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {tarifsList.length === 0 ? 'Belum ada master tarif layanan.' : 'Tidak ada tindakan medis yang cocok.'}
                </p>
              ) : (
                filteredModalTarifs.map((t) => {
                  const tId = t.ID || t.id;
                  const isChecked = Boolean(selectedActions[tId]);
                  const currentQty = selectedActions[tId] || 1;
                  const subTotalItem = Number(t.amount || 0) * currentQty;

                  return (
                    <div
                      key={tId}
                      className={`p-2.5 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isChecked ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-transparent border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleActionToggle(tId)}
                          className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <span className="text-xs font-semibold text-white block truncate">{t.action_name}</span>
                          <span className="text-[11px] font-mono text-gray-400">
                            {formatIDR(t.amount)} / Satuan
                          </span>
                        </div>
                      </label>

                      {/* Interactive Quantity Spinner */}
                      {isChecked && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-indigo-500/40 rounded-lg overflow-hidden bg-black/40">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tId, currentQty - 1)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Kurangi Kuantitas"
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={currentQty}
                              onChange={(e) => handleQuantityChange(tId, e.target.value)}
                              className="w-10 text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tId, currentQty + 1)}
                              className="p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                              title="Tambah Kuantitas / Hari"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <span className="text-xs font-mono font-bold text-emerald-400 min-w-[80px] text-right">
                            {formatIDR(subTotalItem)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Preview Calculation */}
          <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-xs space-y-1">
            <div className="flex justify-between text-gray-300">
              <span>Total Tindakan:</span>
              <span className="font-mono font-semibold text-white">{formatIDR(selectedTarifsSum)}</span>
            </div>
            {!isNoInsurance && (
              <div className="flex justify-between text-cyan-400">
                <span>Klaim Subsidi {insuranceProvider}:</span>
                <span className="font-mono">- {formatIDR(actualClaim)}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-400 font-bold border-t border-white/10 pt-1 text-sm">
              <span>Bersih Tagihan Pasien:</span>
              <span className="font-mono text-base">{formatIDR(netPatientAmountPreview)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Buat Tagihan Pasien
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Verification for Staff / Admin */}
      <Modal 
        isOpen={!!verifyBilling} 
        onClose={() => setVerifyBilling(null)} 
        title={`Verifikasi Bukti Transfer Tagihan #BILL-${verifyBilling?.ID || verifyBilling?.id}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-2">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Pasien SIMRS:</span>
              <strong className="text-white">{verifyBilling?.patient_name}</strong>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Penyedia Asuransi:</span>
              <strong className="text-cyan-300">{verifyBilling?.insurance_provider || 'BPJS Kesehatan'}</strong>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Total Nominal yang Harus Ditransfer:</span>
              <strong className="font-mono text-emerald-400 text-base">{formatIDR(verifyBilling?.patient_amount)}</strong>
            </div>
          </div>

          {/* Bukti Transfer ImageKit Cloud */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase text-gray-300 flex items-center gap-1.5">
                <ImageIcon size={14} className="text-indigo-400" /> Foto Bukti Transfer (ImageKit Cloud)
              </label>
              {verifyBilling?.proof_of_payment && (
                <a 
                  href={verifyBilling.proof_of_payment} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Buka Gambar Penuh <ExternalLink size={12} />
                </a>
              )}
            </div>

            {verifyBilling?.proof_of_payment ? (
              <div className="rounded-xl overflow-hidden border border-white/20 bg-black/40 p-2 max-h-64 flex items-center justify-center">
                <img 
                  src={verifyBilling.proof_of_payment} 
                  alt="Bukti Transfer ImageKit" 
                  className="max-h-60 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400 rounded-xl bg-white/5 border border-white/10">
                Pasien belum mengunggah foto bukti transfer.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
              Idempotency Header Key (<code className="text-indigo-300">X-Idempotency-Key</code>)
            </label>
            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="glass-input font-mono text-xs"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleRejectVerification}
              disabled={isProcessing}
              className="btn btn-danger btn-sm flex items-center gap-1"
            >
              <X size={14} /> Tolak Bukti Transfer
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={() => setVerifyBilling(null)} className="btn btn-secondary btn-sm">
                Batal
              </button>
              <button
                type="button"
                onClick={() => trigger2FAPayment('VERIFY')}
                disabled={isProcessing}
                className="btn btn-emerald btn-sm flex items-center gap-1"
              >
                <Check size={14} /> {isProcessing ? 'Memproses...' : 'Setujui & Lunaskan'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Pay Billing (Direct Cashier Payment & Split Payment) */}
      <Modal isOpen={!!payBilling} onClose={() => setPayBilling(null)} title="Proses Pembayaran Kasir (Direct & Split Payment)" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Pasien:</span>
              <strong className="text-white">{payBilling?.patient_name}</strong>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Penyedia Asuransi:</span>
              <strong className="text-cyan-300">{payBilling?.insurance_provider || 'BPJS Kesehatan'}</strong>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Total Tagihan Bersih Pasien:</span>
              <strong className="font-mono text-emerald-400 text-base">{formatIDR(payBilling?.patient_amount)}</strong>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Pilih Metode Pembayaran Kasir
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPayMethod('CASH')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  payMethod === 'CASH'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <DollarSign size={16} /> Tunai Kasir
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('TRANSFER')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  payMethod === 'TRANSFER'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard size={16} /> Transfer Bank
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('EDC')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  payMethod === 'EDC'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <CreditCard size={16} /> Kartu Debit/EDC
              </button>
              <button
                type="button"
                onClick={() => {
                  setPayMethod('SPLIT');
                  const net = Number(payBilling?.patient_amount || 0);
                  const half = Math.floor(net / 2);
                  setSplitCashAmt(half);
                  setSplitTransferAmt(net - half);
                }}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  payMethod === 'SPLIT'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Plus size={16} /> Split Payment
              </button>
            </div>
          </div>

          {/* Split Payment Breakdown Inputs */}
          {payMethod === 'SPLIT' && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>Rincian Pembayaran Kombinasi (Split)</span>
                <span className="font-mono font-normal text-gray-300">
                  Target: {formatIDR(currentPayNetAmt)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Porsi Tunai Kasir (IDR)</label>
                  <input
                    type="number"
                    value={splitCashAmt}
                    onChange={(e) => handleSplitCashChange(e.target.value, currentPayNetAmt)}
                    className="glass-input font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Porsi Transfer / EDC (IDR)</label>
                  <input
                    type="number"
                    value={splitTransferAmt}
                    onChange={(e) => handleSplitTransferChange(e.target.value, currentPayNetAmt)}
                    className="glass-input font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-mono pt-1.5 border-t border-white/10">
                <span className="text-gray-400 flex items-center gap-1">
                  Total Kombinasi:
                  {!isSplitValid && (
                    <AlertCircle size={14} className="text-rose-400" title="Jumlah split tidak sama persis" />
                  )}
                </span>
                <span className={`font-bold ${isSplitValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatIDR(currentSplitSum)} {isSplitValid ? '✅ (Sesuai Tagihan)' : `⚠️ (Selisih: ${formatIDR(currentSplitSum - currentPayNetAmt)})`}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1">
              Idempotency Header Key (<code className="text-indigo-300">X-Idempotency-Key</code>)
            </label>
            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="glass-input font-mono text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setPayBilling(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button
              type="button"
              onClick={() => trigger2FAPayment('DIRECT')}
              disabled={isProcessing || !isSplitValid}
              className={`btn btn-emerald btn-sm ${!isSplitValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran Lunas'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal 2FA Security PIN */}
      <TwoFactorModal
        isOpen={is2FAOpen}
        onClose={() => { setIs2FAOpen(false); setPendingActionType(null); }}
        onConfirm={executeConfirmedPayment}
        isProcessing={isProcessing}
      />

      {/* Modal Delete Billing */}
      <Modal isOpen={!!deleteBilling} onClose={() => setDeleteBilling(null)} title="Konfirmasi Hapus Tagihan">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Apakah Anda yakin ingin menghapus tagihan <strong className="text-white">#BILL-{deleteBilling?.ID || deleteBilling?.id}</strong> milik <strong className="text-white">{deleteBilling?.patient_name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setDeleteBilling(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="button" onClick={handleDeleteBilling} className="btn btn-danger btn-sm">
              Ya, Hapus Tagihan
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptBilling}
        onClose={() => setReceiptBilling(null)}
        billing={receiptBilling}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
