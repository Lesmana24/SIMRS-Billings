import React, { useState, useEffect, useCallback } from 'react';
import { analyticsApi, ledgerApi } from '../services/api';
import { FinancialKpiCards } from '../components/analytics/FinancialKpiCards';
import { RevenueTrendChart } from '../components/analytics/RevenueTrendChart';
import { printFinancialReportPDF } from '../utils/pdfGenerator';
import { 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  FileSpreadsheet,
  Filter
} from 'lucide-react';

export const AnalyticsDashboard = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear()); // 2026

  const [data, setData] = useState(null);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const yearOptions = [2026, 2025, 2024, 2023];

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [resSummary, resLedgers] = await Promise.all([
        analyticsApi.getSummary({ month: selectedMonth, year: selectedYear }),
        ledgerApi.getAll({ page: 1, limit: 10 }),
      ]);
      setData(resSummary.data);
      setLedgers(resLedgers.data || []);
    } catch (err) {
      console.error('Failed to fetch analytics summary:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatIDR = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await analyticsApi.downloadCsv({ month: selectedMonth, year: selectedYear });
    } catch (err) {
      alert(err.message || 'Gagal mengunduh laporan CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await analyticsApi.downloadExcel({ month: selectedMonth, year: selectedYear });
    } catch (err) {
      alert(err.message || 'Gagal mengunduh laporan Excel (.xlsx)');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    printFinancialReportPDF(data, monthNames[selectedMonth - 1], selectedYear, ledgers, formatIDR);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-emerald-500 mx-auto" size={32} />
          <p className="text-xs font-mono text-[var(--text-secondary)]">Memuat Laporan & Analytics Keuangan SIMRS...</p>
        </div>
      </div>
    );
  }

  const periods = data?.periods || {};
  const bpjs = data?.bpjs_split || {};
  const trends = data?.daily_trends || [];
  const topActions = data?.top_actions || [];

  const maxTrendVal = Math.max(
    1,
    ...trends.map((t) => Number(t.total_amount) || 0)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Header Banner & Export Toolbar */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge badge-paid font-mono">Financial Ledger System</span>
            <span className="text-xs font-mono text-[var(--text-muted)]">• Periode: {monthNames[selectedMonth - 1]} {selectedYear}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-title font-bold text-[var(--text-heading)] tracking-tight">
            Analytics & Laporan Keuangan SIMRS
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl font-sans leading-relaxed">
            Laporan akuntansi penerimaan kas harian, mingguan, bulanan, grafik tren omzet, dan analisa rasio subsidi BPJS Kesehatan vs Swasta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button 
            onClick={handleExportExcel} 
            disabled={exporting}
            className="btn btn-emerald btn-pill cursor-pointer shadow-md hover:scale-[1.02] transition-all"
            title="Ekspor laporan format native Microsoft Excel (.xlsx)"
          >
            <Download size={15} />
            {exporting ? 'Mengolah Excel...' : 'Ekspor Excel (.xlsx)'}
          </button>

          <button 
            onClick={handleExportCsv} 
            disabled={exporting}
            className="btn btn-secondary btn-pill cursor-pointer"
            title="Ekspor laporan format CSV UTF-8"
          >
            <Download size={15} className="text-emerald-500" />
            {exporting ? 'Mengolah CSV...' : 'Ekspor CSV'}
          </button>

          <button 
            onClick={handlePrint} 
            className="btn btn-emerald btn-pill cursor-pointer shadow-md"
          >
            <Printer size={15} /> Cetak PDF (A4)
          </button>
        </div>
      </div>

      {/* Month & Year Filter Toolbar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-heading)] uppercase tracking-wider">
          <Filter size={15} className="text-emerald-500" />
          <span>Filter Periode Laporan Keuangan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-input)] px-3 py-1.5 rounded border border-[var(--border-color)]">
            <Calendar size={14} className="text-cyan-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-mono font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {monthNames.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                  Bulan {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-input)] px-3 py-1.5 rounded border border-[var(--border-color)]">
            <Clock size={14} className="text-emerald-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-mono font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {yearOptions.map((yVal) => (
                <option key={yVal} value={yVal} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                  Tahun {yVal}
                </option>
              ))}
            </select>
          </div>

          {/* Reset to current month button */}
          <button
            onClick={() => {
              const currentNow = new Date();
              setSelectedMonth(currentNow.getMonth() + 1);
              setSelectedYear(currentNow.getFullYear());
            }}
            className="btn btn-secondary btn-sm text-xs py-1.5 cursor-pointer font-mono"
            title="Reset ke Bulan Ini"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <FinancialKpiCards
        periods={periods}
        monthName={monthNames[selectedMonth - 1]}
        year={selectedYear}
        totalPaidCount={data?.total_paid_count}
        formatIDR={formatIDR}
      />

      {/* Revenue Trend & Insurance Distribution Charts */}
      <RevenueTrendChart
        trends={trends}
        maxTrendVal={maxTrendVal}
        bpjs={bpjs}
        monthName={monthNames[selectedMonth - 1]}
        formatIDR={formatIDR}
      />

      {/* Row 2: Top Medical Actions & Recent Kas Ledger Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Medical Actions Ranking */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-heading)] font-mono uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-amber-500" /> Peringkat 5 Tindakan Medis Terlaris ({monthNames[selectedMonth - 1]})
            </h3>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">Sort: Qty</span>
          </div>

          <div className="space-y-3">
            {topActions.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-6 font-mono">Belum ada data tindakan medis terpakai pada bulan ini.</p>
            ) : (
              topActions.map((act, idx) => {
                const maxQty = topActions[0]?.total_qty || 1;
                const widthPct = Math.max(15, Math.round((act.total_qty / maxQty) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-heading)] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] flex items-center justify-center font-mono font-bold">
                          {idx + 1}
                        </span>
                        {act.item_name}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatIDR(act.total_amount)}</span>
                    </div>

                    <div className="w-full bg-[var(--bg-subtle)] h-2 rounded overflow-hidden p-0.5 border border-[var(--border-color)]">
                      <div 
                        style={{ width: `${widthPct}%` }}
                        className="bg-emerald-500 h-full transition-all duration-700"
                      />
                    </div>

                    <div className="text-[10px] text-[var(--text-muted)] text-right font-mono">
                      {act.total_qty} kali digunakan dalam layanan
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Audit Log Receipt / Payment Ledger Transactions */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h3 className="text-sm font-bold text-[var(--text-heading)] font-mono uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Mutasi Jurnal Kas Masuk Terakhir
            </h3>
            <span className="text-[11px] font-mono text-emerald-500 font-semibold">Audit Ledger</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Mutasi</th>
                  <th>Keterangan Transaksi</th>
                  <th>Jenis</th>
                  <th className="text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-[var(--text-secondary)] py-6 font-mono text-xs">Belum ada catatan mutasi kas.</td>
                  </tr>
                ) : (
                  ledgers.slice(0, 5).map((l) => (
                    <tr key={l.ID || l.id}>
                      <td className="font-mono text-xs text-[var(--text-muted)]">#LEDGER-{l.ID || l.id}</td>
                      <td className="text-xs text-[var(--text-heading)] font-medium">{l.description}</td>
                      <td>
                        <span className="badge badge-paid">{l.entry_type}</span>
                      </td>
                      <td className="text-right number-font font-bold text-emerald-600 dark:text-emerald-400">
                        {formatIDR(l.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
