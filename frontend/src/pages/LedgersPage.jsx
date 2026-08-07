import React, { useState, useEffect, useCallback } from 'react';
import { ledgerApi } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { Search, BookOpen, Trash2, ArrowDownRight, ShieldCheck } from 'lucide-react';

export const LedgersPage = () => {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');

  const [deleteLedger, setDeleteLedger] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchLedgers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;

      const res = await ledgerApi.getAll(params);
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

  const handleDelete = async () => {
    if (!deleteLedger) return;

    try {
      await ledgerApi.delete(deleteLedger.ID || deleteLedger.id);
      setToast({ message: 'Mutasi jurnal berhasil dihapus', type: 'success' });
      setDeleteLedger(null);
      fetchLedgers();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus mutasi kas', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-heading)] tracking-wide">
            Jurnal Mutasi Kas SIMRS
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">Buku kas permanen pencatatan mutasi penerimaan pembayaran tagihan medis.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck size={15} /> Audit Trail Idempotency Active
        </div>
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari mutasi pembukuan (BILL-102, Cash)..."
            className="glass-input glass-input-icon"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Ref Ledger</th>
                <th>No. Tagihan</th>
                <th>Jenis Mutasi Kas</th>
                <th>Keterangan Pembukuan</th>
                <th>Jumlah Debet</th>
                <th>Waktu Otorisasi</th>
                <th className="text-right">Tindakan Audit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--text-secondary)] py-8">Memuat mutasi kas...</td>
                </tr>
              ) : ledgers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--text-secondary)] py-8">Tidak ada jurnal mutasi kas ditemukan.</td>
                </tr>
              ) : (
                ledgers.map((l) => (
                  <tr key={l.ID || l.id}>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">#LDG-{l.ID || l.id}</td>
                    <td className="font-mono text-xs font-semibold text-[var(--text-primary)]">#BILL-{l.billing_id || l.medical_billing_id || l.BillingID || l.id}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                        <ArrowDownRight size={13} /> {l.entry_type || l.type || 'DEBIT'}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-heading)]">{l.description}</td>
                    <td className="font-mono text-xs font-bold text-[var(--text-heading)]">
                      Rp {(l.amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)] font-mono">
                      {l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteLedger(l)}
                        className="btn btn-danger btn-sm p-1.5 cursor-pointer"
                        title="Hapus Mutasi Ledger"
                      >
                        <Trash2 size={14} />
                      </button>
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

      {/* Modal Delete Ledger */}
      <Modal isOpen={!!deleteLedger} onClose={() => setDeleteLedger(null)} title="Konfirmasi Hapus Mutasi Ledger">
        <div className="space-y-3 text-xs">
          <p className="text-[var(--text-primary)]">
            Apakah Anda yakin ingin menghapus mutasi pembukuan <strong className="text-[var(--text-heading)]">#LDG-{deleteLedger?.ID || deleteLedger?.id}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setDeleteLedger(null)} className="btn btn-secondary btn-sm cursor-pointer">
              Batal
            </button>
            <button type="button" onClick={handleDelete} className="btn btn-danger btn-sm cursor-pointer">
              Ya, Hapus Mutasi
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
