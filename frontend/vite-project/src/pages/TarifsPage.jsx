import React, { useState, useEffect, useCallback } from 'react';
import { tarifApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Toast } from '../components/ui/Toast';
import { Tag, Plus, Search, Edit3, Trash2, CheckCircle2 } from 'lucide-react';

export const TarifsPage = () => {
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarif, setEditTarif] = useState(null);
  const [deleteTarif, setDeleteTarif] = useState(null);

  // Form states
  const [actionName, setActionName] = useState('');
  const [amount, setAmount] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchTarifs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tarifApi.getAll({ page, limit: 10, search });
      setTarifs(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat tarif layanan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTarifs();
  }, [fetchTarifs]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!actionName || !amount) {
      setToast({ message: 'Harap isi nama tindakan dan tarif harga', type: 'error' });
      return;
    }

    try {
      await tarifApi.create({ action_name: actionName, amount: Number(amount) });
      setToast({ message: 'Tarif layanan baru berhasil ditambahkan', type: 'success' });
      setIsCreateOpen(false);
      setActionName('');
      setAmount('');
      fetchTarifs();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menambah tarif', type: 'error' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarif) return;

    try {
      await tarifApi.update(editTarif.ID || editTarif.id, {
        action_name: actionName,
        amount: Number(amount),
      });
      setToast({ message: 'Tarif layanan berhasil diperbarui', type: 'success' });
      setEditTarif(null);
      fetchTarifs();
    } catch (err) {
      setToast({ message: err.message || 'Gagal memperbarui tarif', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarif) return;

    try {
      await tarifApi.delete(deleteTarif.ID || deleteTarif.id);
      setToast({ message: 'Tarif layanan berhasil dihapus', type: 'success' });
      setDeleteTarif(null);
      fetchTarifs();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus tarif', type: 'error' });
    }
  };

  const openEditModal = (t) => {
    setEditTarif(t);
    setActionName(t.action_name);
    setAmount(t.amount);
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
            <Tag className="text-indigo-400" size={22} /> Master Data Tarif Layanan
          </h2>
          <p className="text-xs text-gray-400">Katalog standar biaya tindakan medis dan pemeriksaan SIMRS.</p>
        </div>
        <button onClick={() => { setActionName(''); setAmount(''); setIsCreateOpen(true); }} className="btn btn-primary btn-sm">
          <Plus size={16} /> Tambah Tarif Layanan
        </button>
      </div>

      {/* Controls: Search */}
      <div className="glass-panel p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Cari tindakan medis (contoh: Dokter, USG, Darah)..."
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
                <th>ID Tarif</th>
                <th>Nama Layanan / Tindakan Medis</th>
                <th>Tarif Standard (IDR)</th>
                <th>Tanggal Dibuat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">Memuat data tarif...</td>
                </tr>
              ) : tarifs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">Tidak ada data tarif ditemukan.</td>
                </tr>
              ) : (
                tarifs.map((t) => (
                  <tr key={t.ID || t.id}>
                    <td className="font-mono text-xs text-gray-400">#TRF-{t.ID || t.id}</td>
                    <td className="font-semibold text-white">{t.action_name}</td>
                    <td className="number-font text-emerald-400 font-bold">{formatIDR(t.amount)}</td>
                    <td className="text-xs text-gray-400 font-mono">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          className="btn btn-secondary btn-sm p-2 text-indigo-400 hover:text-indigo-300"
                          title="Edit Tarif"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarif(t)}
                          className="btn btn-danger btn-sm p-2"
                          title="Hapus Tarif"
                        >
                          <Trash2 size={15} />
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

      {/* Modal Add Tarif */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Tambah Tarif Layanan Baru">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Nama Tindakan Medis</label>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              placeholder="Contoh: Pemeriksaan USG Abdomen"
              className="glass-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Tarif Biaya (IDR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 250000"
              className="glass-input"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Tarif
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Tarif */}
      <Modal isOpen={!!editTarif} onClose={() => setEditTarif(null)} title="Edit Data Tarif Layanan">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Nama Tindakan Medis</label>
            <input
              type="text"
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="glass-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-300 mb-1">Tarif Biaya (IDR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setEditTarif(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Perbarui Tarif
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete Tarif */}
      <Modal isOpen={!!deleteTarif} onClose={() => setDeleteTarif(null)} title="Konfirmasi Hapus Tarif">
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Apakah Anda yakin ingin menghapus tarif <strong className="text-white">{deleteTarif?.action_name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setDeleteTarif(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="button" onClick={handleDelete} className="btn btn-danger btn-sm">
              Ya, Hapus Tarif
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
