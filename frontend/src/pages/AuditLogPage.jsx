import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { Search, Filter, ShieldCheck, Activity } from 'lucide-react';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;

      const res = await auditApi.getAll(params);
      setLogs(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat log audit', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeColor = (act) => {
    if (act.includes('CREATE') || act.includes('APPROVE')) return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (act.includes('DELETE') || act.includes('REJECT')) return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    if (act.includes('UPDATE')) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border-[var(--border-color)]';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-heading)] tracking-wide">
            System Activity Audit Trail Log
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">Pencatatan rekam jejak aktivitas staf kasir, perubahan tarif, dan otorisasi transaksi SIMRS.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
          <ShieldCheck size={15} /> Real-Time Security Monitoring
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari aktivitas, username, atau detail audit..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-[var(--text-secondary)]" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-44 text-[var(--text-primary)] bg-[var(--bg-input)]"
          >
            <option value="">Semua Tindakan Audit</option>
            <option value="APPROVE_PAYMENT">Otorisasi Pembayaran</option>
            <option value="CREATE_BILLING">Terbitkan Billing</option>
            <option value="CREATE_TARIF">Tambah Tarif</option>
            <option value="UPDATE_TARIF">Ubah Tarif</option>
            <option value="DELETE_BILLING">Hapus Billing</option>
            <option value="CREATE_USER">Buat User</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu Otorisasi</th>
                <th>Petugas / Staf SIMRS</th>
                <th>Wewenang</th>
                <th>Tindakan Audit</th>
                <th>Objek Target</th>
                <th>IP Client</th>
                <th>Detail Ringkasan Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--text-secondary)] py-8">Memuat audit trail log...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--text-secondary)] py-8">Tidak ada rekam log audit ditemukan.</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.ID || l.id}>
                    <td className="text-xs text-[var(--text-secondary)] font-mono">
                      {l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="font-semibold text-[var(--text-heading)]">{l.username || 'System'}</td>
                    <td>
                      <Badge variant={l.role}>{l.role}</Badge>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${getActionBadgeColor(l.action)}`}>
                        <Activity size={12} /> {l.action}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-primary)]">{l.resource}</td>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">{l.ip_address || '127.0.0.1'}</td>
                    <td className="text-xs text-[var(--text-primary)] max-w-md truncate">{l.details}</td>
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

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
