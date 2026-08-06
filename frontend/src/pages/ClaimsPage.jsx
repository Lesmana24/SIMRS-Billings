import React, { useState, useEffect, useCallback } from 'react';
import { claimsApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  Eye,
  RefreshCw
} from 'lucide-react';

export const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Update Status Modal
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Receipt Modal
  const [selectedBillingReceipt, setSelectedBillingReceipt] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchSummary = async () => {
    try {
      const res = await claimsApi.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Gagal memuat ringkasan klaim BPJS:', err);
    }
  };

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await claimsApi.getAll(params);
      setClaims(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat data klaim BPJS', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchClaims();
    fetchSummary();
  }, [fetchClaims]);

  const handleOpenUpdateModal = (claim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.bpjs_claim_status || 'UNCLAIMED');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedClaim || !newStatus) return;

    setIsSubmitting(true);
    try {
      await claimsApi.updateStatus(selectedClaim.ID || selectedClaim.id, newStatus);
      setToast({ 
        message: `Status klaim #BILL-${selectedClaim.ID || selectedClaim.id} berhasil diperbarui menjadi ${newStatus}`, 
        type: 'success' 
      });
      setSelectedClaim(null);
      fetchClaims();
      fetchSummary();
    } catch (err) {
      setToast({ message: err.message || 'Gagal mengupdate status klaim', type: 'error' });
    } finally {
      setIsSubmitting(false);
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

  const getClaimStatusBadge = (status) => {
    const st = String(status || 'UNCLAIMED').toUpperCase();
    switch (st) {
      case 'PAID':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit"><CheckCircle2 size={13} /> Cair (PAID)</span>;
      case 'VERIFIED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1 w-fit"><ShieldCheck size={13} /> Terverifikasi</span>;
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit"><Clock size={13} /> Diajukan</span>;
      case 'DISPUTED':
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit"><AlertTriangle size={13} /> Sengketa / Ditolak</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-color)] flex items-center gap-1 w-fit">Belum Diajukan</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-heading)] tracking-wide flex items-center gap-2">
            <ShieldCheck className="text-cyan-500" size={24} /> Pelacakan Klaim Asuransi & BPJS (V-Claim)
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">Manajemen dan verifikasi piutang subsidi klaim BPJS Kesehatan secara terpusat.</p>
        </div>
        <button
          onClick={() => { fetchClaims(); fetchSummary(); }}
          className="btn btn-secondary btn-sm cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Piutang BPJS */}
        <div className="glass-card p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Subsidi BPJS</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[var(--text-heading)] number-font">
            {formatIDR(summary?.total_bpjs_amount)}
          </p>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
            <span>Akumulasi porsi klaim asuransi</span>
          </div>
        </div>

        {/* Belum Diajukan */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Belum Diajukan (Draft)</span>
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">
              <FileText size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-[var(--text-heading)] number-font">
            {formatIDR(summary?.total_unclaimed)}
          </p>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span>{summary?.count_unclaimed || 0} berkas klaim</span>
            <span className="font-semibold text-amber-500">Perlu Pengajuan</span>
          </div>
        </div>

        {/* Dalam Proses Verification */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Proses / Terverifikasi</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 number-font">
            {formatIDR(Number(summary?.total_submitted || 0) + Number(summary?.total_verified || 0))}
          </p>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span>{(summary?.count_submitted || 0) + (summary?.count_verified || 0)} berkas di BPJS</span>
            <span className="font-semibold text-cyan-500">Menunggu Cair</span>
          </div>
        </div>

        {/* Sudah Cair (Paid) */}
        <div className="glass-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Klaim Cair (Kas Masuk)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 number-font">
            {formatIDR(summary?.total_paid)}
          </p>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span>{summary?.count_paid || 0} klaim disetujui</span>
            <span className="font-semibold text-emerald-500">Lunas BPJS</span>
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari klaim berdasarkan Nama Pasien..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-[var(--text-secondary)]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-48 text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            <option value="">Semua Status Klaim</option>
            <option value="UNCLAIMED">Belum Diajukan (Draft)</option>
            <option value="SUBMITTED">Sudah Diajukan ke BPJS</option>
            <option value="VERIFIED">Terverifikasi Layak</option>
            <option value="PAID">Klaim Cair / Paid</option>
            <option value="DISPUTED">Sengketa / Disputed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-5">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Billing</th>
                <th>Tanggal Transaksi</th>
                <th>Nama Pasien</th>
                <th>Total Billing</th>
                <th>Porsi BPJS (Subsidi)</th>
                <th>Beban Pasien</th>
                <th>Status Klaim BPJS</th>
                <th className="text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8">Memuat data piutang BPJS...</td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8">Tidak ada berkas klaim BPJS yang sesuai filter.</td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr key={c.ID || c.id}>
                    <td className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">#BILL-{c.ID || c.id}</td>
                    <td className="text-xs text-[var(--text-secondary)] font-mono">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="font-semibold text-[var(--text-heading)]">{c.patient_name}</td>
                    <td className="number-font text-[var(--text-primary)]">{formatIDR(c.total_amount)}</td>
                    <td className="number-font font-bold text-cyan-600 dark:text-cyan-400">{formatIDR(c.bpjs_amount)}</td>
                    <td className="number-font text-[var(--text-secondary)]">{formatIDR(c.patient_amount)}</td>
                    <td>{getClaimStatusBadge(c.bpjs_claim_status)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedBillingReceipt(c)}
                          className="btn btn-secondary btn-sm cursor-pointer"
                          title="Lihat Rincian Billing"
                        >
                          <Eye size={14} /> Rincian
                        </button>
                        <button
                          onClick={() => handleOpenUpdateModal(c)}
                          className="btn btn-emerald btn-sm cursor-pointer"
                        >
                          Update Status
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

      {/* Modal Update Status Klaim */}
      <Modal
        isOpen={!!selectedClaim}
        onClose={() => setSelectedClaim(null)}
        title={`Update Status Klaim BPJS #BILL-${selectedClaim?.ID || selectedClaim?.id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-1">
            <span className="text-[var(--text-secondary)] block">Pasien: <strong className="text-[var(--text-heading)]">{selectedClaim?.patient_name}</strong></span>
            <span className="text-[var(--text-secondary)] block">Nominal Subsidi BPJS: <strong className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">{formatIDR(selectedClaim?.bpjs_amount)}</strong></span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">Pilih Status Klaim BPJS Baru</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="glass-input bg-[var(--bg-input)] text-[var(--text-heading)] font-semibold"
            >
              <option value="UNCLAIMED">UNCLAIMED — Belum Diajukan (Draft)</option>
              <option value="SUBMITTED">SUBMITTED — Berkas Diajukan ke BPJS V-Claim</option>
              <option value="VERIFIED">VERIFIED — Terverifikasi Layak oleh Verifikator BPJS</option>
              <option value="PAID">PAID — Dana Subsidi BPJS Sudah Cair ke RS</option>
              <option value="DISPUTED">DISPUTED — Sengketa / Berkas Perlu Konfirmasi</option>
            </select>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] italic">
            * Mengubah status menjadi <strong>SUBMITTED</strong> atau <strong>PAID</strong> akan secara otomatis mencatat timestamps verifikasi klaim di sistem.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setSelectedClaim(null)}
              className="btn btn-secondary btn-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-emerald btn-sm disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Status Klaim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedBillingReceipt}
        onClose={() => setSelectedBillingReceipt(null)}
        billing={selectedBillingReceipt}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
