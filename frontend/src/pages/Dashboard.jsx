import React, { useState, useEffect } from 'react';
import { billingApi, ledgerApi } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  ArrowUpRight, 
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

export const Dashboard = ({ onNavigate }) => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await billingApi.getAll({ page: 1, limit: 10 });
        setBillings(res.data || []);
      } catch (err) {
        console.error('Failed to load dashboard billings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatIDR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Derived Metrics
  const totalBillingsCount = billings.length;
  const paidBillings = billings.filter((b) => b.status === 'PAID');
  const pendingBillings = billings.filter((b) => b.status === 'Pending');

  const totalRevenue = paidBillings.reduce((sum, b) => sum + (Number(b.patient_amount) || 0), 0);
  const totalPendingAmount = pendingBillings.reduce((sum, b) => sum + (Number(b.patient_amount) || 0), 0);
  const totalBPJSClaims = billings.reduce((sum, b) => sum + (Number(b.bpjs_amount) || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Ringkasan Operational Billing</h2>
          <p className="text-xs text-gray-400">Pantau performa pembayaran kasir, BPJS, dan status tagihan medis secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('billings')} className="btn btn-primary btn-sm">
            <Plus size={16} /> Buat Tagihan Pasien
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mutasi Kas (Lunas)"
          value={formatIDR(totalRevenue)}
          subtitle={`${paidBillings.length} tagihan telah dibayar`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Tagihan Belum Dibayar"
          value={formatIDR(totalPendingAmount)}
          subtitle={`${pendingBillings.length} tagihan berstatus Pending`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Subsidi BPJS Kesehatan"
          value={formatIDR(totalBPJSClaims)}
          subtitle="Klaim yang telah ditanggung"
          icon={ShieldCheck}
          color="cyan"
        />
        <StatCard
          title="Total Registrasi Tagihan"
          value={totalBillingsCount}
          subtitle="Keseluruhan transaksi medis"
          icon={Receipt}
          color="indigo"
        />
      </div>

      {/* Quick Action Banner */}
      <div className="glass-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">Aksi Cepat Manajemen</h3>
          <p className="text-xs text-gray-400">Kelola tarif layanan rumah sakit atau periksa rincian mutasi kas masuk.</p>
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3 justify-start md:justify-end">
          <button onClick={() => onNavigate('tarifs')} className="btn btn-secondary btn-sm">
            Master Tarif Layanan <ArrowUpRight size={14} />
          </button>
          <button onClick={() => onNavigate('ledgers')} className="btn btn-secondary btn-sm">
            Jurnal Kas & Mutasi <FileSpreadsheet size={14} />
          </button>
          <button onClick={() => onNavigate('billings')} className="btn btn-emerald btn-sm">
            Proses Pembayaran <Receipt size={14} />
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Transaksi Tagihan Terakhir</h3>
          <button onClick={() => onNavigate('billings')} className="text-xs text-indigo-400 hover:underline font-semibold">
            Lihat Semua Tagihan →
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Pasien</th>
                <th>Total Tindakan</th>
                <th>Subsidi BPJS</th>
                <th>Bersih Pasien</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Memuat data dashboard...</td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Belum ada transaksi tagihan.</td>
                </tr>
              ) : (
                billings.slice(0, 5).map((b) => (
                  <tr key={b.ID || b.id}>
                    <td className="font-mono text-xs text-gray-400">#BILL-{b.ID || b.id}</td>
                    <td className="font-semibold text-white">{b.patient_name}</td>
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
                        Lihat Struk
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal
        isOpen={!!selectedBilling}
        onClose={() => setSelectedBilling(null)}
        billing={selectedBilling}
      />
    </div>
  );
};
