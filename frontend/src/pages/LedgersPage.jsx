import React, { useState, useEffect, useCallback } from 'react';
import { ledgerApi } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { BookOpen, Search, ShieldCheck, ArrowDownRight } from 'lucide-react';

export const LedgersPage = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'error' });

  const fetchLedgers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ledgerApi.getAll({ page, limit: 10, search });
      setLedgers(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat jurnal kas', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

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
            <BookOpen className="text-indigo-400" size={22} /> Payment Ledgers (Jurnal Mutasi Kas)
          </h2>
          <p className="text-xs text-gray-400">Buku kas permanen (immutable) pencatatan mutasi penerimaan pembayaran tagihan medis.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <ShieldCheck size={16} /> Audit Trail Idempotency Active
        </div>
      </div>

      {/* Controls: Search */}
      <div className="glass-panel p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari deskripsi mutasi atau referensi tagihan..."
            className="glass-input glass-input-icon"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-5">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Ledger</th>
                <th>Ref ID Tagihan</th>
                <th>Tipe Mutasi</th>
                <th>Keterangan Transaksi</th>
                <th>Jumlah Mutasi Kas</th>
                <th>Waktu Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">Memuat data jurnal kas...</td>
                </tr>
              ) : ledgers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">Belum ada mutasi kas masuk tercatat.</td>
                </tr>
              ) : (
                ledgers.map((l) => (
                  <tr key={l.ID || l.id}>
                    <td className="font-mono text-xs text-gray-400">#LDG-{l.ID || l.id}</td>
                    <td className="font-mono text-xs text-indigo-400 font-bold">#BILL-{l.billing_id}</td>
                    <td>
                      <span className="badge badge-paid flex items-center gap-1 w-fit">
                        <ArrowDownRight size={12} /> {l.entry_type}
                      </span>
                    </td>
                    <td className="font-medium text-white">{l.description}</td>
                    <td className="number-font text-emerald-400 font-bold">{formatIDR(l.amount)}</td>
                    <td className="text-xs text-gray-400 font-mono">
                      {l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-'}
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

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
    </div>
  );
};
