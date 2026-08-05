import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  UserCheck, 
  Clock, 
  Globe, 
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Key
} from 'lucide-react';

export const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchAuditLogs = useCallback(async () => {
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
      setToast({ message: err.message || 'Gagal memuat log aktivitas pengguna', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'APPROVE_PAYMENT':
        return <Badge variant="PAID"><CheckCircle2 size={12} className="inline mr-1" /> APPROVE PAYMENT</Badge>;
      case 'REJECT_PAYMENT':
        return <Badge variant="REJECTED"><AlertTriangle size={12} className="inline mr-1" /> REJECT PAYMENT</Badge>;
      case 'CREATE_BILLING':
        return <Badge variant="Pending"><FileText size={12} className="inline mr-1" /> CREATE BILLING</Badge>;
      case 'CREATE_TARIF':
      case 'UPDATE_TARIF':
        return <Badge variant="WAITING_VERIFICATION"><Activity size={12} className="inline mr-1" /> {action}</Badge>;
      case 'DELETE_TARIF':
      case 'DELETE_BILLING':
      case 'DELETE_LEDGER':
        return <Badge variant="REJECTED"><ShieldAlert size={12} className="inline mr-1" /> {action}</Badge>;
      default:
        return <Badge variant="WAITING_VERIFICATION">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldAlert className="text-indigo-400" size={22} /> Audit Trail Log Aktivitas Staf
          </h2>
          <p className="text-xs text-gray-400">Pencatatan real-time riwayat tindakan staf, transaksi kasir, perubahan tarif, dan alamat IP sistem.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-paid flex items-center gap-1 font-mono">
            <Key size={12} /> 2FA PIN Enabled
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama staf, ID tagihan, atau detail aktivitas..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-56"
          >
            <option value="">Semua Aksi Audit</option>
            <option value="APPROVE_PAYMENT">Pelunasan Tagihan (Approve)</option>
            <option value="REJECT_PAYMENT">Penolakan Bukti (Reject)</option>
            <option value="CREATE_BILLING">Pembuatan Tagihan Medis</option>
            <option value="CREATE_TARIF">Tambah Master Tarif</option>
            <option value="UPDATE_TARIF">Ubah Master Tarif</option>
            <option value="DELETE_TARIF">Hapus Master Tarif</option>
            <option value="DELETE_BILLING">Hapus Tagihan Medis</option>
          </select>
        </div>
      </div>

      {/* Table Log */}
      <div className="glass-panel p-5">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu & Date</th>
                <th>Pengguna / Staf</th>
                <th>Role Wewenang</th>
                <th>Jenis Aksi</th>
                <th>Target Resource</th>
                <th>IP Address</th>
                <th>Rincian Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Memuat log audit sistem...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Belum ada riwayat aktivitas staf tercatat.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.ID || log.id}>
                    <td className="font-mono text-xs text-gray-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-indigo-400" />
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="font-semibold text-white whitespace-nowrap flex items-center gap-1.5 mt-2">
                      <UserCheck size={14} className="text-cyan-400" />
                      {log.username || 'Petugas System'}
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        log.role === 'admin' 
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td className="font-mono text-xs font-semibold text-cyan-300 whitespace-nowrap">
                      {log.resource}
                    </td>
                    <td className="font-mono text-xs text-gray-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> {log.ip_address || '127.0.0.1'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-300 max-w-xs truncate" title={log.details}>
                      {log.details}
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

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
