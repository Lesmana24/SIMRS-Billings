import React, { useState, useEffect } from 'react';
import { analyticsApi, billingApi } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { ReceiptModal } from '../components/ui/ReceiptModal';
import { DollarSign, Clock, ShieldCheck, FileSpreadsheet, ArrowUpRight, Plus } from 'lucide-react';

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
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-wide">
            Dashboard Overview SIMRS
          </h2>
          <p className="text-xs text-slate-400">Ringkasan penerimaan kas harian, klaim penjamin, dan otorisasi billing medis.</p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('billings')}
          className="btn btn-emerald flex items-center gap-1.5"
        >
          <Plus size={16} /> Terbitkan Billing Pasien
        </button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kas Hari Ini"
          value={`Rp ${dailyRev.toLocaleString('id-ID')}`}
          subtitle={`${summary?.total_paid_count || 0} tagihan lunas`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Tagihan Pending"
          value={`${pendingCount} Tagihan`}
          subtitle="Belum melunasi billing"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Klaim Penjamin Medis"
          value={`Rp ${totalInsurance.toLocaleString('id-ID')}`}
          subtitle="Total BPJS & Swasta"
          icon={ShieldCheck}
          color="cyan"
        />
        <StatCard
          title="Akumulasi Kas Lunas"
          value={`Rp ${totalRev.toLocaleString('id-ID')}`}
          subtitle="Keseluruhan penerimaan"
          icon={FileSpreadsheet}
          color="slate"
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="glass-panel p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Aksi Cepat Manajemen SIMRS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate && onNavigate('analytics')}
            className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">Laporan & Analytics Keuangan</p>
              <p className="text-[11px] text-slate-400">Grafik pendapatan & klaim BPJS vs Mandiri</p>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 group-hover:text-emerald-400" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('tarifs')}
            className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">Master Tarif Layanan</p>
              <p className="text-[11px] text-slate-400">Kelola tarif standar konsultasi & medis</p>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 group-hover:text-emerald-400" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('ledgers')}
            className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors group flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">Jurnal Mutasi Kas</p>
              <p className="text-[11px] text-slate-400">Periksa rincian mutasi penerimaan kas</p>
            </div>
            <ArrowUpRight size={15} className="text-slate-500 group-hover:text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Transaksi Tagihan Medis Terakhir
          </h3>
          <button
            onClick={() => onNavigate && onNavigate('billings')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            Lihat Semua Tagihan <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>No. Ref Billing</th>
                <th>Pasien SIMRS</th>
                <th>Total Bruto (IDR)</th>
                <th>Skema Penjamin</th>
                <th>Beban Netto Pasien</th>
                <th>Status Otorisasi</th>
                <th className="text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-6">Memuat transaksi terbaru...</td>
                </tr>
              ) : recentBillings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-400 py-6">Belum ada transaksi tagihan.</td>
                </tr>
              ) : (
                recentBillings.map((b) => {
                  const isPaid = b.status === 'PAID';
                  return (
                    <tr key={b.ID || b.id}>
                      <td className="font-mono text-xs text-slate-400">#BILL-{b.ID || b.id}</td>
                      <td className="font-semibold text-white">{b.patient_name}</td>
                      <td className="font-mono text-xs text-slate-200">
                        Rp {(b.total_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span className="text-xs text-slate-300">{b.insurance_type || 'Mandiri'}</span>
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-400">
                        Rp {(b.patient_amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <Badge variant={isPaid ? 'paid' : 'pending'}>{b.status}</Badge>
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
                  );
                })
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
