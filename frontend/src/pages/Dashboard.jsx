import React, { useState, useEffect } from 'react';
import { analyticsApi, billingApi } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { DollarSign, Clock, ShieldCheck, FileSpreadsheet, ArrowUpRight, Plus, Activity } from 'lucide-react';

export const Dashboard = ({ onNavigate }) => {
  const [summary, setSummary] = useState(null);
  const [recentBillings, setRecentBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, billingsRes] = await Promise.all([
          analyticsApi.getSummary(),
          billingApi.getAll({ limit: 5 }),
        ]);

        setSummary(summaryRes.data);
        setRecentBillings(billingsRes.data || []);
      } catch (err) {
        console.error('Gagal mengambil data dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dailyRev = summary?.periods?.daily_revenue ? parseFloat(summary.periods.daily_revenue) : 0;
  const pendingCount = summary?.total_pending_count || 0;
  const totalInsurance = summary?.bpjs_split 
    ? (parseFloat(summary.bpjs_split.total_bpjs || 0) + parseFloat(summary.bpjs_split.total_private_ins || 0))
    : 0;
  const totalRev = summary?.periods?.total_revenue ? parseFloat(summary.periods.total_revenue) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-[var(--text-heading)] tracking-tight">
            Dashboard Overview Keuangan
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl font-sans leading-relaxed">
            Ringkasan akuntansi penerimaan kas medis harian, pelacakan subsidi BPJS & asuransi swasta, dan otorisasi pembayaran kasir.
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('billings')}
          className="btn btn-emerald btn-pill flex items-center gap-2 cursor-pointer shadow-md self-start md:self-auto"
        >
          <Plus size={16} /> Terbitkan Billing Pasien
        </button>
      </div>

      {/* Bento Grid: Spotlight Card + Side Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Revenue Spotlight */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between space-y-6 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Penerimaan Kas Lunas Hari Ini
              </span>
              <h3 className="text-3xl sm:text-4xl font-bold font-mono text-[var(--text-heading)] tracking-tight mt-1">
                Rp {dailyRev.toLocaleString('id-ID')}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
            <div>
              <span className="text-xs text-[var(--text-muted)] block font-medium">Tagihan Lunas</span>
              <strong className="text-lg font-bold text-[var(--text-heading)]">{summary?.total_paid_count || 0} Transaksi</strong>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] block font-medium">Total Penerimaan Kas</span>
              <strong className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {totalRev.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        </div>

        {/* Side Stacked Metric Cards */}
        <div className="space-y-4">
          <StatCard
            title="Tagihan Pending"
            value={`${pendingCount} Tagihan`}
            subtitle="Menunggu otorisasi pembayaran kasir"
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Klaim Penjamin Medis"
            value={`Rp ${totalInsurance.toLocaleString('id-ID')}`}
            subtitle="Subsidi BPJS Kesehatan & Asuransi Swasta"
            icon={ShieldCheck}
            color="cyan"
          />
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Pintasan Navigasi & Aksi Modul
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate && onNavigate('analytics')}
            className="p-5 glass-card hover:border-emerald-500/50 text-left transition-all group flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text-heading)] group-hover:text-emerald-500 transition-colors">Laporan Keuangan & Grafik</p>
              <p className="text-xs text-[var(--text-secondary)]">Grafik tren pendapatan harian & rasio klaim penjamin.</p>
            </div>
            <ArrowUpRight size={18} className="text-[var(--text-muted)] group-hover:text-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('tarifs')}
            className="p-5 glass-card hover:border-emerald-500/50 text-left transition-all group flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text-heading)] group-hover:text-emerald-500 transition-colors">Master Tarif Layanan</p>
              <p className="text-xs text-[var(--text-secondary)]">Daftar harga tindakan medis, obat, dan perawatan RS.</p>
            </div>
            <ArrowUpRight size={18} className="text-[var(--text-muted)] group-hover:text-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('ledgers')}
            className="p-5 glass-card hover:border-emerald-500/50 text-left transition-all group flex items-start justify-between cursor-pointer"
          >
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text-heading)] group-hover:text-emerald-500 transition-colors">Jurnal Mutasi Kas</p>
              <p className="text-xs text-[var(--text-secondary)]">Audit trail mutasi pembayaran kasir.</p>
            </div>
            <ArrowUpRight size={18} className="text-[var(--text-muted)] group-hover:text-emerald-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* Recent Transactions Table Panel */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Transaksi Tagihan Medis Terakhir
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">5 catatan transaksi billing terbaru di SIMRS</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('billings')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Ref Billing</th>
                <th>Pasien SIMRS</th>
                <th>Total Bruto (IDR)</th>
                <th>Penjamin</th>
                <th>Beban Pasien</th>
                <th>Status</th>
                <th className="text-right">Struk</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--text-secondary)] py-8 font-mono text-xs">Memuat data transaksi billing...</td>
                </tr>
              ) : recentBillings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--text-secondary)] py-8 font-mono text-xs">Tidak ada catatan tagihan ditemukan.</td>
                </tr>
              ) : (
                recentBillings.map((b) => (
                  <tr key={b.ID || b.id}>
                    <td className="font-mono text-xs font-semibold text-[var(--text-muted)]">#BILL-{b.ID || b.id}</td>
                    <td className="font-bold text-[var(--text-heading)]">{b.patient_name}</td>
                    <td className="font-mono text-xs text-[var(--text-primary)]">
                      Rp {(b.total_amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="text-xs">
                      <span className="font-medium text-[var(--text-secondary)]">{b.insurance_type || b.insurance_provider || 'Mandiri'}</span>
                    </td>
                    <td className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {(b.patient_amount || 0).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <Badge variant={b.status === 'PAID' ? 'paid' : 'pending'}>{b.status}</Badge>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedBilling(b)}
                        className="btn btn-secondary btn-sm cursor-pointer"
                      >
                        Print Struk
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedBilling && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedBilling(null)}
          billing={selectedBilling}
        />
      )}
    </div>
  );
};
