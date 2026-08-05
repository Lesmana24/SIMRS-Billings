import React, { useState, useEffect, useCallback } from 'react';
import { ledgerApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { BookOpen, Search, ShieldCheck, ArrowDownRight, Trash2, Lock } from 'lucide-react';

export const LedgersPage = () => {
  const { isAdmin, role } = useAuth();
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  
  // Admin Delete Modal State
  const [deleteLedger, setDeleteLedger] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

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

  const handleDeleteLedger = async () => {
    if (!deleteLedger) return;
    setIsDeleting(true);

    try {
      await ledgerApi.delete(deleteLedger.ID || deleteLedger.id);
      setToast({ message: 'Catatan mutasi kas berhasil dihapus oleh Admin', type: 'success' });
      setDeleteLedger(null);
      fetchLedgers();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus mutasi kas', type: 'error' });
    } finally {
      setIsDeleting(false);
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
            <BookOpen className="text-indigo-400" size={22} /> Payment Ledgers (Jurnal Mutasi Kas)
          </h2>
          <p className="text-xs text-gray-400">Buku kas permanen pencatatan mutasi penerimaan pembayaran tagihan medis.</p>
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
                <th className="text-right">Aksi RBAC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Memuat data jurnal kas...</td>
                </tr>
              ) : ledgers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Belum ada mutasi kas masuk tercatat.</td>
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
                    <td className="text-right">
                      {isAdmin ? (
                        <button
                          onClick={() => setDeleteLedger(l)}
                          className="btn btn-danger btn-sm px-2.5 py-1 text-xs"
                          title="Hapus Catatan Jurnal (Admin Only)"
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-gray-500 flex items-center justify-end gap-1">
                          <Lock size={12} /> Read Only
                        </span>
                      )}
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

      {/* Modal Confirm Delete Ledger (Admin Only) */}
      <Modal isOpen={!!deleteLedger} onClose={() => setDeleteLedger(null)} title="Konfirmasi Hapus Mutasi Kas (Admin Only)">
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-gray-300 space-y-1">
            <p><strong>ID Ledger:</strong> #LDG-{deleteLedger?.ID || deleteLedger?.id}</p>
            <p><strong>Keterangan:</strong> {deleteLedger?.description}</p>
            <p><strong>Nominal Mutasi:</strong> <span className="font-mono text-emerald-400 font-bold">{formatIDR(deleteLedger?.amount)}</span></p>
          </div>
          <p className="text-sm text-gray-300">
            Apakah Anda yakin ingin menghapus catatan mutasi jurnal kas ini? Aksi ini hanya dimiliki oleh peran <strong className="text-white">ADMIN</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setDeleteLedger(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteLedger}
              disabled={isDeleting}
              className="btn btn-danger btn-sm"
            >
              {isDeleting ? 'Hapus...' : 'Ya, Hapus Mutasi Kas'}
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
