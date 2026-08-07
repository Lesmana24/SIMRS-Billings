import React, { useState, useEffect, useCallback } from 'react';
import { billingApi, tarifApi, userApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { TwoFactorModal } from '../components/ui/TwoFactorModal';
import { CreateBillingModal } from '../components/billings/CreateBillingModal';
import { PayBillingModal } from '../components/billings/PayBillingModal';
import { Search, Plus, Printer, CheckCircle, Filter, Trash2 } from 'lucide-react';

export const BillingsPage = () => {
  const [billings, setBillings] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null); // Receipt Modal
  const [deleteBilling, setDeleteBilling] = useState(null); // Delete Modal
  const [payModalBilling, setPayModalBilling] = useState(null); // Pay Modal
  const [twoFactorBilling, setTwoFactorBilling] = useState(null); // 2FA Verification

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchBillings = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await billingApi.getAll(params);
      setBillings(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalRows(res.meta.total_rows || 0);
      }
    } catch (err) {
      setToast({ message: err.message || 'Gagal memuat daftar tagihan', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchTarifsAndPatients = async () => {
    try {
      const [tarifRes, userRes] = await Promise.all([
        tarifApi.getAll({ limit: 100 }),
        userApi.getAll({ limit: 100 }),
      ]);
      setTarifs(tarifRes.data || []);
      const allUsers = userRes.data || [];
      const patientUsers = allUsers.filter((u) => (u.role || '').toLowerCase() === 'pasien');
      setPatients(patientUsers);
    } catch (err) {
      console.error('Gagal memuat master data:', err);
    }
  };

  useEffect(() => {
    fetchBillings();
    fetchTarifsAndPatients();
  }, [fetchBillings]);

  const handleCreateSubmit = async (payload, resetForm) => {
    try {
      await billingApi.create(payload);

      setToast({ message: 'Billing tagihan pasien berhasil diterbitkan!', type: 'success' });
      setIsCreateOpen(false);
      resetForm();
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menerbitkan tagihan', type: 'error' });
    }
  };

  const handleConfirmPayModal = (payData) => {
    setTwoFactorBilling(payData);
    setPayModalBilling(null);
  };

  const handle2FAVerified = async (pinCode) => {
    if (!twoFactorBilling) return;
    const { billing, paymentMethod, cashAmount, transferAmount } = twoFactorBilling;

    try {
      await billingApi.pay(billing.ID || billing.id, {
        payment_method: paymentMethod,
        cash_amount: Number(cashAmount),
        transfer_amount: Number(transferAmount),
      }, pinCode);

      setToast({ message: `Otorisasi pembayaran #${billing.ID || billing.id} berhasil!`, type: 'success' });
      setTwoFactorBilling(null);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal memproses otorisasi kasir', type: 'error' });
    }
  };

  const handleDeleteBilling = async () => {
    if (!deleteBilling) return;
    try {
      await billingApi.delete(deleteBilling.ID || deleteBilling.id);
      setToast({ message: 'Dokumen tagihan berhasil dihapus', type: 'success' });
      setDeleteBilling(null);
      fetchBillings();
    } catch (err) {
      setToast({ message: err.message || 'Gagal menghapus tagihan', type: 'error' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Page Header Banner */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-paid font-mono">Simrs Financial Ledger</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">• Total: {totalRows} Record Tagihan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-[var(--text-heading)] tracking-tight">
            Transaksi Medical Billing Pasien
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl font-sans leading-relaxed">
            Pengelolaan tagihan rincian tindakan medis, verifikasi klaim subsidi penjamin, dan otorisasi kasir terlindungi 2FA.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-emerald btn-pill flex items-center gap-2 cursor-pointer shadow-md self-start md:self-auto"
        >
          <Plus size={16} /> Terbitkan Tagihan Baru
        </button>
      </div>

      {/* Control Filter Panel - Asymmetrical Layout */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama pasien atau No. Ref Tagihan (#BILL-102)..."
            className="glass-input glass-input-icon font-sans text-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-[var(--text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="glass-input sm:w-48 text-[var(--text-primary)] bg-[var(--bg-input)] font-mono text-xs"
          >
            <option value="">Semua Status Otorisasi</option>
            <option value="PENDING">PENDING (Belum Lunas)</option>
            <option value="PAID">PAID (Lunas Verifikasi)</option>
          </select>
        </div>
      </div>

      {/* Primary SIMRS Table Panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Ref Billing</th>
                <th>Pasien SIMRS</th>
                <th>Total Bruto (IDR)</th>
                <th>Skema Penjamin</th>
                <th>Beban Netto Pasien</th>
                <th>Kanal Bayar</th>
                <th>Status Otorisasi</th>
                <th className="text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8 font-mono text-xs">Memuat data transaksi billing...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-[var(--text-secondary)] py-8 font-mono text-xs">Tidak ada catatan tagihan ditemukan.</td>
                </tr>
              ) : (
                billings.map((b) => {
                  const isPaid = b.status === 'PAID';
                  return (
                    <tr key={b.ID || b.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)] font-semibold">#BILL-{b.ID || b.id}</td>
                      <td className="font-bold text-[var(--text-heading)]">{b.patient_name}</td>
                      <td className="font-mono text-xs text-[var(--text-primary)]">
                        Rp {(b.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-medium text-[var(--text-primary)]">{b.insurance_type || b.insurance_provider || 'Mandiri'}</span>
                          {(b.insurance_claim_amount > 0 || b.insurance_claim > 0) && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                              Klaim: Rp {(b.insurance_claim_amount || b.insurance_claim || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {(b.patient_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span className="font-mono text-[11px] text-[var(--text-secondary)] uppercase">
                          {b.payment_method || '-'}
                        </span>
                      </td>
                      <td>
                        <Badge variant={isPaid ? 'paid' : 'pending'}>{b.status}</Badge>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBilling(b)}
                            className="btn btn-secondary btn-sm cursor-pointer"
                            title="Cetak Struk SIMRS"
                          >
                            <Printer size={14} /> Struk
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => setPayModalBilling(b)}
                              className="btn btn-emerald btn-sm flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle size={14} /> Otorisasi Bayar
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteBilling(b)}
                            className="btn btn-danger btn-sm p-1.5 cursor-pointer"
                            title="Hapus Billing"
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

      {/* Modal Terbitkan Tagihan Baru */}
      <CreateBillingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        patients={patients}
        tarifs={tarifs}
        onSubmit={handleCreateSubmit}
      />

      {/* Modal Otorisasi Pembayaran (Kasir) */}
      <PayBillingModal
        isOpen={!!payModalBilling}
        onClose={() => setPayModalBilling(null)}
        billing={payModalBilling}
        onConfirm={handleConfirmPayModal}
      />

      {/* Modal 2FA Verification */}
      {twoFactorBilling && (
        <TwoFactorModal
          isOpen={true}
          onClose={() => setTwoFactorBilling(null)}
          onVerified={handle2FAVerified}
          title="Otorisasi Kasir 2FA PIN"
          description={`Masukkan 4-6 digit Security PIN akun Anda untuk menyelesaikan otorisasi pembayaran #${twoFactorBilling.billing.ID || twoFactorBilling.billing.id}.`}
        />
      )}

      {/* Modal Delete Billing */}
      <Modal isOpen={!!deleteBilling} onClose={() => setDeleteBilling(null)} title="Konfirmasi Hapus Tagihan">
        <div className="space-y-3 text-xs">
          <p className="text-[var(--text-primary)]">
            Apakah Anda yakin ingin menghapus tagihan <strong className="text-[var(--text-heading)]">#BILL-{deleteBilling?.ID || deleteBilling?.id}</strong> milik pasien <strong className="text-[var(--text-heading)]">{deleteBilling?.patient_name}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button type="button" onClick={() => setDeleteBilling(null)} className="btn btn-secondary btn-sm cursor-pointer">
              Batal
            </button>
            <button type="button" onClick={handleDeleteBilling} className="btn btn-danger btn-sm cursor-pointer">
              Ya, Hapus Tagihan
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {selectedBilling && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedBilling(null)}
          billing={selectedBilling}
        />
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  );
};
