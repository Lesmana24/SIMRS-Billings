import React, { useState, useEffect, useCallback } from 'react';
import { billingApi, tarifApi, userApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
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
  Filter
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
  const [receiptBilling, setReceiptBilling] = useState(null);
  const [deleteBilling, setDeleteBilling] = useState(null);

  // Data helpers for creation
  const [pasiensList, setPasiensList] = useState([]);
  const [tarifsList, setTarifsList] = useState([]);

  // Create Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [bpjsClaim, setBpjsClaim] = useState(0);
  const [selectedActionIds, setSelectedActionIds] = useState([]);
  const [modalTarifSearch, setModalTarifSearch] = useState('');

  // Payment Idempotency State
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isPaying, setIsPaying] = useState(false);
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
    setSelectedActionIds([]);
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

  const handleActionToggle = (id) => {
    setSelectedActionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setToast({ message: 'Pilih pasien terlebih dahulu', type: 'error' });
      return;
    }
    if (selectedActionIds.length === 0) {
      setToast({ message: 'Pilih minimal satu tindakan medis/tarif', type: 'error' });
      return;
    }

    try {
      await billingApi.create({
        patient_user_id: Number(selectedPatientId),
        bpjs_claim: Number(bpjsClaim) || 0,
        action_ids: selectedActionIds.map(Number),
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
    setIdempotencyKey(`PAY-BILL-${billing.ID || billing.id}-${Date.now()}`);
  };

  const handleProcessPayment = async () => {
    if (!payBilling) return;
    setIsPaying(true);

    try {
      const res = await billingApi.pay(payBilling.ID || payBilling.id, idempotencyKey);
      setToast({ message: res.message || 'Pembayaran berhasil diproses!', type: 'success' });
      
      const updatedData = res.data || payBilling;
      setPayBilling(null);
      setReceiptBilling(updatedData);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal memproses pembayaran', type: 'error' });
    } finally {
      setIsPaying(false);
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

  const selectedTarifsSum = selectedActionIds.reduce((sum, id) => {
    const found = tarifsList.find((t) => (t.ID || t.id) === id);
    return sum + (found ? Number(found.amount) : 0);
  }, 0);
  const netPatientAmountPreview = Math.max(0, selectedTarifsSum - Number(bpjsClaim || 0));

  const filteredModalTarifs = tarifsList.filter((t) =>
    (t.action_name || '').toLowerCase().includes(modalTarifSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Receipt className="text-indigo-400" size={22} /> Transaksi Medical Billing
          </h2>
          <p className="text-xs text-gray-400">Pengelolaan tagihan tindakan medis pasien, klaim BPJS, dan pembayaran idempoten.</p>
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
            className="glass-input sm:w-40"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending (Belum Lunas)</option>
            <option value="PAID">PAID (Sudah Lunas)</option>
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
                <th>Klaim BPJS</th>
                <th>Bersih Pasien</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th className="text-right">Aksi</th>
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
                    <td className="number-font text-cyan-400">{formatIDR(b.bpjs_amount)}</td>
                    <td className="number-font font-bold text-emerald-400">{formatIDR(b.patient_amount)}</td>
                    <td>
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="text-xs text-gray-400 font-mono">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'Pending' ? (
                          <button
                            onClick={() => openPayModal(b)}
                            className="btn btn-emerald btn-sm"
                            title="Proses Pembayaran"
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

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1 flex items-center gap-1">
              <ShieldCheck size={14} className="text-cyan-400" /> Potongan / Subsidi Klaim BPJS (IDR)
            </label>
            <input
              type="number"
              value={bpjsClaim}
              onChange={(e) => setBpjsClaim(e.target.value)}
              placeholder="0"
              className="glass-input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-gray-300">
                Pilih Rincian Tindakan Layanan Medis
              </label>
              {selectedActionIds.length > 0 && (
                <span className="text-[11px] font-semibold text-indigo-400 font-mono">
                  {selectedActionIds.length} tindakan dipilih
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
                  const isChecked = selectedActionIds.includes(tId);
                  return (
                    <label
                      key={tId}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-transparent border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleActionToggle(tId)}
                          className="rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-semibold text-white">{t.action_name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">{formatIDR(t.amount)}</span>
                    </label>
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
            <div className="flex justify-between text-cyan-400">
              <span>Subsidi BPJS:</span>
              <span className="font-mono">- {formatIDR(bpjsClaim)}</span>
            </div>
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

      {/* Modal Pay Billing (Idempotent Payment) */}
      <Modal isOpen={!!payBilling} onClose={() => setPayBilling(null)} title="Proses Pembayaran Kasir (Idempotent)">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Pasien:</span>
              <strong className="text-white">{payBilling?.patient_name}</strong>
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>Total Tagihan Bersih:</span>
              <strong className="font-mono text-emerald-400 text-base">{formatIDR(payBilling?.patient_amount)}</strong>
            </div>
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
            <p className="text-[11px] text-gray-400 mt-1">
              Kunci idempoten mencegah pendebitan kas ganda (*double charge*) jika request terkirim lebih dari satu kali.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setPayBilling(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={isPaying}
              className="btn btn-emerald btn-sm"
            >
              {isPaying ? 'Memproses Cash/Debit...' : 'Konfirmasi Pembayaran Lunas'}
            </button>
          </div>
        </div>
      </Modal>

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
