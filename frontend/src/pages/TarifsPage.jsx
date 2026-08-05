import React, { useState, useEffect, useCallback } from 'react';
import { tarifApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Toast } from '../components/ui/Toast';
import { Search, Plus, Edit3, Trash2, Filter } from 'lucide-react';

export const TarifsPage = () => {
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarif, setEditTarif] = useState(null);
  const [deleteTarif, setDeleteTarif] = useState(null);

  // Form State
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState(0);

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchTarifs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;

      const res = await tarifApi.getAll(params);
      setTarifs(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat master tarif', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchTarifs();
  }, [fetchTarifs]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim() || harga <= 0) {
      setToast({ message: 'Nama layanan dan tarif valid wajib diisi', type: 'error' });
      return;
    }

    try {
      await tarifApi.create({
        action_name: nama,
        amount: Number(harga),
      });

      setToast({ message: 'Tarif layanan baru berhasil ditambahkan', type: 'success' });
      setIsCreateOpen(false);
      resetForm();
      fetchTarifs();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menambah tarif', type: 'error' });
    }
  };

  const openEditModal = (t) => {
    setEditTarif(t);
    setNama(t.action_name || t.nama || '');
    const price = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
    setHarga(price);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarif) return;

    try {
      await tarifApi.update(editTarif.ID || editTarif.id, {
        action_name: nama,
        amount: Number(harga),
      });

      setToast({ message: 'Master tarif berhasil diperbarui', type: 'success' });
      setEditTarif(null);
      resetForm();
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

  const resetForm = () => {
    setNama('');
    setHarga(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Master Tarif Layanan SIMRS
          </h2>
          <p className="text-xs text-slate-400">Pengaturan standar tarif tindakan medis, konsultasi dokter, laboratorium, dan rawat inap.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="btn btn-emerald flex items-center gap-1.5"
        >
          <Plus size={16} /> Tambah Tarif Layanan
        </button>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari tindakan medis (contoh: UGD, EKG, Rawat Inap)..."
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
                <th>Kode Tarif</th>
                <th>Nama Layanan / Tindakan Medis</th>
                <th>Kategori Tarif</th>
                <th>Besaran Tarif Satuan (IDR)</th>
                <th className="text-right">Kelola Tarif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">Memuat master tarif...</td>
                </tr>
              ) : tarifs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">Tidak ada master tarif ditemukan.</td>
                </tr>
              ) : (
                tarifs.map((t) => {
                  const name = t.action_name || t.nama || 'Tindakan Medis';
                  const price = typeof t.amount === 'number' ? t.amount : (t.amount ? parseFloat(t.amount) : (t.harga || 0));
                  const category = t.kategori || 'TINDAKAN_MEDIS';

                  return (
                    <tr key={t.ID || t.id}>
                      <td className="font-mono text-xs text-slate-400">#{t.kode || t.ID || t.id}</td>
                      <td className="font-semibold text-white">{name}</td>
                      <td>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {category}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-400">
                        Rp {price.toLocaleString('id-ID')}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="btn btn-secondary btn-sm p-1.5"
                            title="Edit Tarif"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarif(t)}
                            className="btn btn-danger btn-sm p-1.5"
                            title="Hapus Tarif"
                          >
                            <Trash2 size={14} />
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

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Tambah Master Tarif SIMRS Baru">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Nama Tindakan / Layanan Medis</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Konsultasi Spesialis Dahlan, EKG Jantung, Rawat Inap VIP..."
              className="glass-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Besaran Tarif Satuan (IDR)</label>
            <input
              type="number"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              placeholder="150000"
              className="glass-input text-xs font-mono"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-emerald btn-sm">
              Simpan Tarif
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarif} onClose={() => setEditTarif(null)} title="Perbarui Master Tarif">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Nama Layanan Medis</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="glass-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Besaran Tarif Satuan (IDR)</label>
            <input
              type="number"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              className="glass-input text-xs font-mono"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button type="button" onClick={() => setEditTarif(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-emerald btn-sm">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarif} onClose={() => setDeleteTarif(null)} title="Hapus Master Tarif">
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Apakah Anda yakin ingin menghapus tarif <strong className="text-white">{deleteTarif?.action_name || deleteTarif?.nama}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
