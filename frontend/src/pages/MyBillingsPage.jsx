import React, { useState, useEffect, useCallback } from 'react';
import { pasienApi, billingApi } from '../services/api';
import { imagekitService } from '../services/imagekit';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { 
  Receipt, 
  Search, 
  Printer, 
  Filter, 
  ShieldCheck, 
  HeartPulse, 
  CreditCard, 
  Upload, 
  Copy, 
  Check, 
  Image as ImageIcon,
  Building2
} from 'lucide-react';

export const MyBillingsPage = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Payment State
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [payBillingModal, setPayBillingModal] = useState(null);

  // Transfer Proof Upload State
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedBank, setCopiedBank] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchMyBillings = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await pasienApi.getMyBillings(params);
      setBillings(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat tagihan Anda', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMyBillings();
  }, [fetchMyBillings]);

  const openPayModal = (billing) => {
    setPayBillingModal(billing);
    setProofFile(null);
    setProofPreview(null);
    setCopiedBank('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCopyAccount = (accNo, bankName) => {
    navigator.clipboard.writeText(accNo);
    setCopiedBank(bankName);
    setTimeout(() => setCopiedBank(''), 2000);
  };

  const handleConfirmPatientPayment = async (e) => {
    e.preventDefault();
    if (!payBillingModal) return;
    if (!proofFile) {
      setToast({ message: 'Harap unggah foto bukti transfer pembayaran', type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to ImageKit Cloud Storage
      const uploadRes = await imagekitService.uploadFile(
        proofFile,
        `bukti-bayar-BILL-${payBillingModal.ID || payBillingModal.id}`
      );

      // 2. Process payment with idempotency key
      const idempotencyKey = `PATIENT-PAY-${payBillingModal.ID || payBillingModal.id}-${Date.now()}`;
      const res = await billingApi.pay(payBillingModal.ID || payBillingModal.id, idempotencyKey);

      setToast({ 
        message: 'Pembayaran & bukti transfer ImageKit berhasil dikonfirmasi!', 
        type: 'success' 
      });

      const updatedBilling = res.data || payBillingModal;
      setPayBillingModal(null);
      setSelectedBilling(updatedBilling); // Show updated receipt!
      fetchMyBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal mengirim pembayaran', type: 'error' });
    } finally {
      setIsUploading(false);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <HeartPulse className="text-pink-400" size={22} /> Portal Tagihan Pasien Saya
          </h2>
          <p className="text-xs text-gray-400">Daftar rincian biaya tindakan medis, transfer pembayaran, dan klaim BPJS Kesehatan Anda.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari tindakan medis (contoh: Dokter, USG)..."
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
                <th>No. Tagihan</th>
                <th>Tanggal Transaksi</th>
                <th>Total Tindakan</th>
                <th>Subsidi BPJS</th>
                <th>Tagihan Bersih Pasien</th>
                <th>Status</th>
                <th className="text-right">Aksi Pembayaran</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Memuat data tagihan medis Anda...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Belum ada catatan tagihan medis.</td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.ID || b.id}>
                    <td className="font-mono text-xs text-indigo-400 font-bold">#BILL-{b.ID || b.id}</td>
                    <td className="text-xs text-gray-400 font-mono">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="number-font">{formatIDR(b.total_amount)}</td>
                    <td className="number-font text-cyan-400">{formatIDR(b.bpjs_amount)}</td>
                    <td className="number-font font-bold text-emerald-400">{formatIDR(b.patient_amount)}</td>
                    <td>
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => openPayModal(b)}
                              className="btn btn-emerald btn-sm"
                            >
                              <CreditCard size={14} /> Bayar Tagihan
                            </button>
                            <button
                              onClick={() => setSelectedBilling(b)}
                              className="btn btn-secondary btn-sm"
                            >
                              Rincian
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedBilling(b)}
                            className="btn btn-secondary btn-sm text-emerald-400"
                          >
                            <Printer size={14} /> Lihat Struk
                          </button>
                        )}
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

      {/* Modal Patient Bank Transfer Payment & ImageKit Upload */}
      <Modal 
        isOpen={!!payBillingModal} 
        onClose={() => setPayBillingModal(null)} 
        title={`Pembayaran Transfer Bank Tagihan #BILL-${payBillingModal?.ID || payBillingModal?.id}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConfirmPatientPayment} className="space-y-5">
          {/* Amount to transfer banner */}
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-300 block">Total Tagihan Bersih yang Harus Ditransfer:</span>
              <span className="text-xl font-extrabold text-emerald-400 number-font">
                {formatIDR(payBillingModal?.patient_amount)}
              </span>
            </div>
            <Badge variant="Pending">Menunggu Transfer</Badge>
          </div>

          {/* Destination Bank Account Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-400" /> Rekening Tujuan Transfer Bank RS
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* BCA Account */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400">BANK BCA</span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount('1234567890', 'bca')}
                    className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedBank === 'bca' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedBank === 'bca' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <p className="text-sm font-bold font-mono text-white tracking-wider">123-456-7890</p>
                <p className="text-[11px] text-gray-400">a.n. RS UTAMA SIMRS</p>
              </div>

              {/* Mandiri Account */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">BANK MANDIRI</span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount('9876543210', 'mandiri')}
                    className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedBank === 'mandiri' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedBank === 'mandiri' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <p className="text-sm font-bold font-mono text-white tracking-wider">987-654-3210</p>
                <p className="text-[11px] text-gray-400">a.n. RS UTAMA SIMRS</p>
              </div>
            </div>
          </div>

          {/* ImageKit Cloud Proof Upload Field */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-gray-300 flex items-center gap-1.5">
              <Upload size={14} className="text-indigo-400" /> Unggah Foto Bukti Transfer (ImageKit Cloud)
            </label>

            {!proofPreview ? (
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-white/15 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors text-center">
                <ImageIcon size={32} className="text-indigo-400 mb-2 opacity-80" />
                <span className="text-xs font-semibold text-white">Klik untuk memilih foto bukti transfer</span>
                <span className="text-[11px] text-gray-400 mt-1">Format: JPG, PNG, WEBP (Maksimal 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-white/20 bg-black/40 p-2">
                <img
                  src={proofPreview}
                  alt="Preview Bukti Transfer"
                  className="w-full h-44 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => { setProofFile(null); setProofPreview(null); }}
                  className="absolute top-3 right-3 btn btn-danger btn-sm text-xs py-1 px-2"
                >
                  Ubah Foto
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setPayBillingModal(null)}
              className="btn btn-secondary btn-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="btn btn-emerald btn-sm disabled:opacity-50"
            >
              {isUploading ? 'Mengunggah ke ImageKit Cloud...' : 'Upload & Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedBilling}
        onClose={() => setSelectedBilling(null)}
        billing={selectedBilling}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
