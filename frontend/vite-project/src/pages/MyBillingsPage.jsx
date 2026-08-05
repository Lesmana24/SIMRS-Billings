import React, { useState, useEffect, useCallback } from 'react';
import { pasienApi } from '../services/api';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { Receipt, Search, Printer, Filter, ShieldCheck, HeartPulse } from 'lucide-react';

export const MyBillingsPage = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedBilling, setSelectedBilling] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'error' });

  const fetchMyBillings = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await pasienApi.getMyBillings(params);
      setBillings(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat tagihan Anda', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchMyBillings();
  }, [fetchMyBillings]);

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
            <HeartPulse className="text-pink-400" size={22} /> Portal Tagihan Pasien Saya
          </h2>
          <p className="text-xs text-gray-400">Daftar rincian biaya tindakan medis, pemeriksaan, dan klaim BPJS Kesehatan Anda.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari tindakan medis (contoh: Dokter, USG)..."
            className="glass-input glass-input-icon"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-40"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending (Belum Lunas)</option>
            <option value="PAID">PAID (Sudah Lunas)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-5">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Tagihan</th>
                <th>Tanggal Transaksi</th>
                <th>Total Tindakan</th>
                <th>Subsidi BPJS</th>
                <th>Tagihan Bersih Pasien</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Memuat data tagihan medis Anda...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Belum ada catatan tagihan medis.</td>
                </tr>
              ) : (
                billings.map((b) => (
                  <tr key={b.ID || b.id}>
                    <td className="font-mono text-xs text-indigo-400 font-bold">#BILL-{b.ID || b.id}</td>
                    <td className="text-xs text-gray-400 font-mono">
                      {b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="number-font">{formatIDR(b.total_amount)}</td>
                    <td className="number-font text-cyan-400">{formatIDR(b.bpjs_amount)}</td>
                    <td className="number-font font-bold text-emerald-400">{formatIDR(b.patient_amount)}</td>
                    <td>
                      <Badge variant={b.status}>{b.status}</Badge>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedBilling(b)}
                        className="btn btn-secondary btn-sm"
                      >
                        <Printer size={14} /> Lihat Rincian & Struk
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

      <ReceiptModal
        isOpen={!!selectedBilling}
        onClose={() => setSelectedBilling(null)}
        billing={selectedBilling}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
    </div>
  );
};
