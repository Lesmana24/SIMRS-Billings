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
  Eye,
  RefreshCw,
  Building2
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
  
  // Provider Tab: 'bpjs', 'swasta', 'all'
  const [activeProviderTab, setActiveProviderTab] = useState('bpjs');

  // Update Status Modal
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Receipt Modal
  const [selectedBillingReceipt, setSelectedBillingReceipt] = useState(null);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchSummary = useCallback(async () => {
    try {
      const res = await claimsApi.getSummary({ provider_type: activeProviderTab });
      setSummary(res.data);
    } catch (err) {
      console.error('Gagal memuat ringkasan klaim:', err);
    }
  }, [activeProviderTab]);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10, provider_type: activeProviderTab };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await claimsApi.getAll(params);
      setClaims(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat data klaim', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, activeProviderTab]);

  useEffect(() => {
    fetchClaims();
    fetchSummary();
  }, [fetchClaims, fetchSummary]);

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
    switch (status) {
      case 'UNCLAIMED':
        return <span className="badge badge-pending font-mono">UNCLAIMED</span>;
      case 'SUBMITTED':
        return <span className="badge font-mono bg-amber-500/10 text-amber-500 border border-amber-500/30">SUBMITTED</span>;
      case 'VERIFIED':
        return <span className="badge font-mono bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">VERIFIED</span>;
      case 'PAID':
        return <span className="badge badge-paid font-mono">PAID (CAIR)</span>;
      case 'DISPUTED':
        return <span className="badge badge-pasien font-mono">DISPUTED</span>;
      default:
        return <span className="badge font-mono bg-stone-500/10 text-stone-400 border border-stone-500/30">{status || 'UNCLAIMED'}</span>;
    }
  };

  const getProviderBadge = (providerName) => {
    const name = providerName || 'BPJS Kesehatan';
    const isBPJS = name.toLowerCase().includes('bpjs');
    return (
      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-sm border flex items-center gap-1 w-fit ${
        isBPJS 
          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' 
          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      }`}>
        {isBPJS ? <ShieldCheck size={11} /> : <Building2 size={11} />}
        {name}
      </span>
    );
  };

  const getTabTitle = () => {
    if (activeProviderTab === 'bpjs') return 'Klaim BPJS Kesehatan (V-Claim)';
    if (activeProviderTab === 'swasta') return 'Klaim Asuransi Swasta';
    return 'Semua Klaim Penjamin Medis';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Header Banner */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-paid font-mono">Claims Ledger Engine</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">• Total: {totalRows} Pengajuan Klaim</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-[var(--text-heading)] tracking-tight">
            Manajemen Klaim Penjamin
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl font-sans leading-relaxed">
            Manajemen dan verifikasi piutang subsidi klaim BPJS Kesehatan (V-Claim) & Asuransi Swasta secara terpisah.
          </p>
        </div>

        <button
          onClick={() => { fetchClaims(); fetchSummary(); }}
          className="btn btn-secondary btn-pill flex items-center gap-2 cursor-pointer self-start md:self-auto font-mono text-xs"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Provider Category Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 overflow-x-auto">
        <button
          onClick={() => { setActiveProviderTab('bpjs'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-bold transition-all cursor-pointer border ${
            activeProviderTab === 'bpjs'
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/50'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-strong)]'
          }`}
        >
          <ShieldCheck size={15} /> Klaim BPJS Kesehatan
        </button>

        <button
          onClick={() => { setActiveProviderTab('swasta'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-bold transition-all cursor-pointer border ${
            activeProviderTab === 'swasta'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/50'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-strong)]'
          }`}
        >
          <Building2 size={15} /> Klaim Asuransi Swasta
        </button>

        <button
          onClick={() => { setActiveProviderTab('all'); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-bold transition-all cursor-pointer border ${
            activeProviderTab === 'all'
              ? 'bg-stone-500/15 text-[var(--text-heading)] border-stone-500/50'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-strong)]'
          }`}
        >
          <Filter size={14} /> Semua Penjamin
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Piutang / Subsidi */}
        <div className="glass-card p-4 space-y-2 border-l-2 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">
              {activeProviderTab === 'bpjs' ? 'Total Subsidi BPJS' : activeProviderTab === 'swasta' ? 'Total Klaim Swasta' : 'Total Subsidi Penjamin'}
            </span>
            <DollarSign size={16} className="text-cyan-500" />
          </div>
          <p className="text-xl font-black text-[var(--text-heading)] font-mono">
            {formatIDR(summary?.total_bpjs_amount)}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] font-sans">Total nominal klaim diajukan</p>
        </div>

        {/* Belum Diajukan (UNCLAIMED) */}
        <div className="glass-card p-4 space-y-2 border-l-2 border-l-stone-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">Belum Diajukan</span>
            <Clock size={16} className="text-stone-400" />
          </div>
          <p className="text-xl font-black text-[var(--text-heading)] font-mono">
            {formatIDR(summary?.total_unclaimed)}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] font-sans">{summary?.count_unclaimed || 0} berkas pending</p>
        </div>

        {/* Terverifikasi (VERIFIED) */}
        <div className="glass-card p-4 space-y-2 border-l-2 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">Terverifikasi</span>
            <FileText size={16} className="text-cyan-500" />
          </div>
          <p className="text-xl font-black text-[var(--text-heading)] font-mono">
            {formatIDR(summary?.total_verified)}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] font-sans">{summary?.count_verified || 0} berkas disetujui</p>
        </div>

        {/* Cair / Lunas (PAID) */}
        <div className="glass-card p-4 space-y-2 border-l-2 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-[var(--text-muted)]">Cair (PAID)</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatIDR(summary?.total_paid)}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] font-sans">{summary?.count_paid || 0} klaim telah ditransfer</p>
        </div>
      </div>

      {/* Control Filter Panel */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari pasien atau No. Ref Billing (#BILL-102)..."
            className="glass-input glass-input-icon text-xs font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-[var(--text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-48 text-[var(--text-primary)] bg-[var(--bg-input)] font-mono text-xs"
          >
            <option value="">Semua Status Klaim</option>
            <option value="UNCLAIMED font-mono">UNCLAIMED (Belum Klaim)</option>
            <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
            <option value="VERIFIED">VERIFIED (Disetujui)</option>
            <option value="PAID">PAID (Cair)</option>
            <option value="DISPUTED">DISPUTED (Sengketa)</option>
          </select>
        </div>
      </div>

      {/* Primary Table Panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase tracking-wider font-mono">
            {getTabTitle()}
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">Data Idempoten RS</span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ref Billing</th>
                <th>Pasien SIMRS</th>
                <th>Penjamin / Asuransi</th>
                <th>Nominal Klaim</th>
                <th>Total Bruto</th>
                <th>Beban Pasien</th>
                <th>Status Klaim</th>
                <th className="text-right">Aksi Klaim</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8 font-mono text-xs">Memuat data klaim penjamin...</td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8 font-mono text-xs">Tidak ada data klaim penjamin ditemukan.</td>
                </tr>
              ) : (
                claims.map((c) => {
                  const claimAmt = Number(c.insurance_claim || c.bpjs_amount || 0);
                  const totalAmt = Number(c.total_amount || 0);
                  const patientAmt = Number(c.patient_amount || 0);

                  return (
                    <tr key={c.ID || c.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)] font-semibold">#BILL-{c.ID || c.id}</td>
                      <td className="font-bold text-[var(--text-heading)]">{c.patient_name}</td>
                      <td>
                        {getProviderBadge(c.insurance_provider)}
                      </td>
                      <td className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        {formatIDR(claimAmt)}
                      </td>
                      <td className="font-mono text-xs text-[var(--text-secondary)]">
                        {formatIDR(totalAmt)}
                      </td>
                      <td className="font-mono text-xs text-[var(--text-secondary)]">
                        {formatIDR(patientAmt)}
                      </td>
                      <td>
                        {getClaimStatusBadge(c.bpjs_claim_status || 'UNCLAIMED')}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBillingReceipt(c)}
                            className="btn btn-secondary btn-sm cursor-pointer"
                            title="Lihat Struk Rincian Billing"
                          >
                            <Eye size={14} /> Detail
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

      {/* Update Claim Status Modal */}
      {selectedClaim && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedClaim(null)}
          title={`Update Status Klaim #${selectedClaim.ID || selectedClaim.id}`}
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="p-3 rounded bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Pasien:</span>
                <span className="font-bold text-[var(--text-heading)]">{selectedClaim.patient_name}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Penjamin:</span>
                <span className="font-bold text-[var(--text-heading)]">{selectedClaim.insurance_provider || 'BPJS Kesehatan'}</span>
              </div>
              <div className="flex justify-between text-cyan-600 dark:text-cyan-400 font-bold pt-1 border-t border-[var(--border-color)]">
                <span>Nominal Subsidi Klaim:</span>
                <span>{formatIDR(selectedClaim.insurance_claim || selectedClaim.bpjs_amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[var(--text-secondary)] mb-1">
                Pilih Status Klaim Baru
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="glass-input text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-input)]"
              >
                <option value="UNCLAIMED">UNCLAIMED (Belum Diajukan)</option>
                <option value="SUBMITTED">SUBMITTED (Telah Diajukan)</option>
                <option value="VERIFIED">VERIFIED (Disetujui Penjamin)</option>
                <option value="PAID">PAID (Cair & Masuk Kas RS)</option>
                <option value="DISPUTED">DISPUTED (Sengketa / Ditolak)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="btn btn-secondary btn-sm cursor-pointer font-mono"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-emerald btn-sm cursor-pointer font-mono"
              >
                {isSubmitting ? 'Memproses...' : 'Simpan Status Klaim'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Receipt Modal */}
      {selectedBillingReceipt && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedBillingReceipt(null)}
          billing={selectedBillingReceipt}
        />
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
