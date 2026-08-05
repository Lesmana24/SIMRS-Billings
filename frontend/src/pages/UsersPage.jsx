import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { Search, Edit3, Trash2, Filter, UserPlus } from 'lucide-react';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  // Form states for Create
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('staff');
  const [create2FA, setCreate2FA] = useState('123456');

  // Form states for Edit
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('pasien');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await userApi.getAll(params);
      setUsers(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat pengguna', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setCreateUsername('');
    setCreatePassword('');
    setCreateRole('staff');
    setCreate2FA('123456');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createUsername || !createPassword) {
      setToast({ message: 'Username dan Password wajib diisi', type: 'error' });
      return;
    }

    try {
      await userApi.create({
        username: createUsername,
        password: createPassword,
        role: createRole,
        '2fa_pin': create2FA || '123456',
      });

      setToast({ message: `Akun ${createRole.toUpperCase()} '${createUsername}' berhasil dibuat!`, type: 'success' });
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menambahkan pengguna baru', type: 'error' });
    }
  };

  const openEditModal = (u) => {
    setEditUser(u);
    setUsername(u.username);
    setRole(u.role);
    setPassword('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    const payload = { username, role };
    if (password) payload.password = password;

    try {
      await userApi.update(editUser.ID || editUser.id, payload);
      setToast({ message: 'Data pengguna berhasil diperbarui', type: 'success' });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setToast({ message: err.message || 'Gagal memperbarui pengguna', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      await userApi.delete(deleteUser.ID || deleteUser.id);
      setToast({ message: 'Pengguna berhasil dihapus', type: 'success' });
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus pengguna', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Manajemen Pengguna & Hak Akses
          </h2>
          <p className="text-xs text-slate-400">Pengelolaan akun administrator, staff kasir, dan pasien terdaftar SIMRS.</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-1.5">
          <UserPlus size={16} /> Buat Akun Pengguna Baru
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
            placeholder="Cari username pengguna (contoh: kasir_1, dr_subagyo)..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-40"
          >
            <option value="">Semua Peran</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="pasien">Pasien</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID Akun</th>
                <th>Username SIMRS</th>
                <th>Peran Hak Akses</th>
                <th>Tanggal Pendaftaran</th>
                <th className="text-right">Kelola Akun</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">Memuat pengguna...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-8">Tidak ada pengguna ditemukan.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.ID || u.id}>
                    <td className="font-mono text-xs text-slate-400">#USR-{u.ID || u.id}</td>
                    <td className="font-semibold text-white">{u.username}</td>
                    <td>
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>
                    <td className="text-xs text-slate-400 font-mono">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary btn-sm p-1.5"
                          title="Edit User"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="btn btn-danger btn-sm p-1.5"
                          title="Hapus User"
                        >
                          <Trash2 size={14} />
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

      {/* Modal Create User */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Akun Pengguna SIMRS Baru" maxWidth="max-w-md">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Username Pengguna</label>
            <input
              type="text"
              value={createUsername}
              onChange={(e) => setCreateUsername(e.target.value)}
              placeholder="Contoh: kasir_keuangan, dr_subagyo, pasien_budiman..."
              className="glass-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              placeholder="Masukkan password aman..."
              className="glass-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Peran Hak Akses (Role)</label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="staff">Staff Kasir / Medis</option>
              <option value="admin">Administrator SIMRS</option>
              <option value="pasien">Pasien Terdaftar</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">
              Security PIN 2FA (6 Digit)
            </label>
            <input
              type="text"
              maxLength={6}
              value={create2FA}
              onChange={(e) => setCreate2FA(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="glass-input text-xs font-mono text-center tracking-[0.3em] font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">Default PIN 2FA: <code className="text-cyan-300">123456</code></p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1">
              <UserPlus size={14} /> Buat Akun Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit User */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit Data Pengguna">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">Peran Hak Akses (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="glass-input text-xs"
            >
              <option value="admin">Administrator</option>
              <option value="staff">Staff Kasir / Medis</option>
              <option value="pasien">Pasien</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-300 mb-1">
              Reset Password (Opsional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah password..."
              className="glass-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setEditUser(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete User */}
      <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title="Konfirmasi Hapus Pengguna">
        <div className="space-y-3 text-xs">
          <p className="text-slate-300">
            Apakah Anda yakin ingin menghapus akun <strong className="text-white">{deleteUser?.username}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button type="button" onClick={() => setDeleteUser(null)} className="btn btn-secondary btn-sm">
              Batal
            </button>
            <button type="button" onClick={handleDelete} className="btn btn-danger btn-sm">
              Ya, Hapus Pengguna
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
