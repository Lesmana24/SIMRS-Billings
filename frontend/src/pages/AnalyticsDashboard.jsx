import React, { useState, useEffect, useCallback } from 'react';
import { analyticsApi, ledgerApi } from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { 
  TrendingUp, 
  Download, 
  Printer, 
  Calendar, 
  ShieldCheck, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Activity, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  FileSpreadsheet,
  Hospital,
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

  const handlePrintPDF = () => {
    if (!data) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const topActionsRows = (data.top_actions || []).map((act, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px 8px; font-family: monospace;">${idx + 1}</td>
        <td style="font-weight: 600; border: 1px solid #cbd5e1; padding: 6px 8px;">${act.item_name}</td>
        <td style="text-align: center; font-family: monospace; border: 1px solid #cbd5e1; padding: 6px 8px;">${act.total_qty} kali</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px;">${formatIDR(act.total_amount)}</td>
      </tr>
    `).join('');

    const ledgerRows = ledgers.slice(0, 10).map((l, idx) => `
      <tr>
        <td style="font-family: monospace; font-size: 10px; border: 1px solid #cbd5e1; padding: 6px 8px;">#LEDGER-${l.ID || l.id}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px;">${l.description}</td>
        <td style="text-align: center; font-size: 10px; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px; color: #16a34a;">${l.entry_type}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 700; border: 1px solid #cbd5e1; padding: 6px 8px;">${formatIDR(l.amount)}</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Keuangan SIMRS - ${monthNames[selectedMonth - 1]} ${selectedYear}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; background: #ffffff; padding: 10px; font-size: 11px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 8px; border-bottom: 2px solid #0f172a; margin-bottom: 12px; }
            .title { font-size: 17px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
            .sub { font-size: 10px; color: #475569; }
            .doc-title { text-align: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; margin-bottom: 12px; }
            .meta-item { text-align: center; }
            .meta-label { font-size: 9.5px; color: #64748b; display: block; text-transform: uppercase; font-weight: 600; }
            .meta-val { font-size: 12px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
            th { background-color: #f1f5f9; color: #0f172a; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 6px 8px; border: 1px solid #94a3b8; text-align: left; }
            td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #0f172a; }
            .section-title { font-size: 11px; font-weight: 700; uppercase; color: #0f172a; margin-bottom: 6px; margin-top: 10px; }
            .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center; margin-top: 30px; margin-bottom: 10px; }
            .signature-name { font-size: 10px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #64748b; display: inline-block; padding: 0 16px 2px 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">RUMAH SAKIT UTAMA SIMRS</div>
              <div class="sub">Laporan Akuntansi Keuangan & Audit Penerimaan Kas Medis</div>
              <div class="sub">Jl. Kesehatan No. 45, Jakarta Pusat 10110 • Telp: (021) 555-0199</div>
            </div>
            <div style="text-align: right;">
              <div style="font-family: monospace; font-size: 11px; font-weight: 700;">PERIODE LAPORAN</div>
              <div style="font-family: monospace; font-size: 10px; color: #16a34a; font-weight: 700;">${monthNames[selectedMonth - 1]} ${selectedYear}</div>
            </div>
          </div>

          <div class="doc-title">RINGKASAN EXECUTIVE LAPORAN PENDAPATAN & KLAIM BPJS</div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Kas Hari Ini</span>
              <span class="meta-val">${formatIDR(data.periods?.daily_revenue)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">7 Hari Terakhir</span>
              <span class="meta-val">${formatIDR(data.periods?.weekly_revenue)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Kas Bulan Ini</span>
              <span class="meta-val">${formatIDR(data.periods?.monthly_revenue)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Kas Lunas</span>
              <span class="meta-val">${formatIDR(data.periods?.total_revenue)}</span>
            </div>
          </div>

          <div class="section-title">Peringkat 5 Tindakan Medis Terlaris</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Nama Tindakan / Layanan Medis</th>
                <th style="text-align: center;">Total Kuantitas</th>
                <th style="text-align: right;">Total Omzet (IDR)</th>
              </tr>
            </thead>
            <tbody>
              ${topActionsRows}
            </tbody>
          </table>

          <div class="section-title">Mutasi Jurnal Kas Masuk Terakhir</div>
          <table>
            <thead>
              <tr>
                <th>ID Mutasi</th>
                <th>Deskripsi Transaksi</th>
                <th style="text-align: center;">Jenis</th>
                <th style="text-align: right;">Nominal (IDR)</th>
              </tr>
            </thead>
            <tbody>
              ${ledgerRows}
            </tbody>
          </table>

          <div class="signature-grid">
            <div>
              <div style="font-size: 10px; color: #475569; margin-bottom: 30px;">Staf Akuntansi & Finance</div>
              <div class="signature-name">( Petugas Keuangan RS )</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #475569; margin-bottom: 30px;">Kepala Divisi Keuangan SIMRS</div>
              <div class="signature-name">( Ka. Divisi Akuntansi )</div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[var(--text-secondary)]">
        <RefreshCw size={24} className="animate-spin text-emerald-500 mr-2" />
        Memuat data laporan keuangan & analytics...
      </div>
    );
  }

  const periods = data?.periods || {};
  const bpjs = data?.bpjs_split || {};
  const trends = data?.daily_trends || [];
  const topActions = data?.top_actions || [];

  const maxTrendVal = Math.max(...trends.map(t => Number(t.total_amount) || 0), 1);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-heading)] tracking-wide flex items-center gap-2">
            <BarChart3 className="text-emerald-500" /> Analytics & Laporan Keuangan SIMRS
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Laporan akuntansi penerimaan kas harian, mingguan, bulanan, grafik tren, dan analisa subsidi BPJS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCsv} 
            disabled={exporting}
            className="btn btn-secondary btn-sm cursor-pointer"
          >
            <Download size={16} className="text-emerald-500" />
            {exporting ? 'Mengunduh...' : 'Ekspor Laporan Kas (CSV/Excel)'}
          </button>

          <button 
            onClick={handlePrintPDF} 
            className="btn btn-emerald btn-sm cursor-pointer shadow-md"
          >
            <Printer size={16} /> Cetak Laporan Keuangan (PDF / A4)
          </button>
        </div>
      </div>

      {/* Month & Year Filter Toolbar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-heading)]">
          <Filter size={16} className="text-emerald-500" />
          <span>Filter Periode Laporan Keuangan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-input)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
            <Calendar size={14} className="text-cyan-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {monthNames.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                  Bulan {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-input)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
            <Clock size={14} className="text-emerald-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-[var(--text-primary)] focus:outline-none cursor-pointer font-mono"
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
            className="btn btn-secondary btn-sm text-xs py-1.5 cursor-pointer"
            title="Reset ke Bulan Ini"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* Period Metric Cards (Daily, Weekly, Monthly, Total) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Kas Hari Ini"
          value={formatIDR(periods.daily_revenue)}
          subtitle="Penerimaan lunas hari ini"
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Kas 7 Hari Terakhir"
          value={formatIDR(periods.weekly_revenue)}
          subtitle="Penerimaan lunas 1 minggu"
          icon={TrendingUp}
          color="cyan"
        />
        <StatCard
          title={`Kas ${monthNames[selectedMonth - 1]} ${selectedYear}`}
          value={formatIDR(periods.monthly_revenue)}
          subtitle={`Penerimaan lunas bulan ${monthNames[selectedMonth - 1]}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Kas Lunas (All Time)"
          value={formatIDR(periods.total_revenue)}
          subtitle={`${data?.total_paid_count || 0} tagihan telah lunas`}
          icon={ShieldCheck}
          color="amber"
        />
      </div>

      {/* Charts Grid (Row 1: Trend Bar Chart & BPJS Donut Share) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Daily Revenue Trend Bar Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-5 space-y-4 relative z-20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" /> Grafik Tren Pendapatan Harian (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Visualisasi penerimaan kas bersih pasien vs klaim BPJS Kesehatan vs Asuransi Swasta</p>
            </div>
            <span className="badge badge-paid">Real-Time Data</span>
          </div>

          {/* SVG/Bar Visualization */}
          <div className="pt-4 pb-2">
            <div className="h-56 flex items-end gap-3 sm:gap-6 px-2 border-b border-[var(--border-color)]">
              {trends.map((t, idx) => {
                const totalVal = Number(t.total_amount) || 0;
                const patVal = Number(t.patient_amount) || 0;
                const bpjsVal = Number(t.bpjs_amount) || 0;
                const insVal = Number(t.insurance_amount) || 0;

                const heightPct = Math.max(10, Math.round((totalVal / maxTrendVal) * 100));

                const patPct = totalVal > 0 ? (patVal / totalVal) * 100 : 0;
                const bpjsPct = totalVal > 0 ? (bpjsVal / totalVal) * 100 : 0;
                const insPct = totalVal > 0 ? (insVal / totalVal) * 100 : 0;

                const isRightAligned = idx >= trends.length - 2;
                const isLeftAligned = idx <= 1;
                const tooltipPosClass = isRightAligned 
                  ? 'right-0 left-auto' 
                  : (isLeftAligned ? 'left-0 right-auto' : 'left-1/2 -translate-x-1/2');

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative hover:z-30">
                    {/* Tooltip on Hover */}
                    <div className={`absolute -top-20 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-card)] text-[var(--text-primary)] text-[10px] p-2.5 rounded-xl border border-[var(--border-color)] shadow-2xl pointer-events-none z-50 font-mono whitespace-nowrap backdrop-blur-md ${tooltipPosClass}`}>
                      <div className="font-bold text-emerald-500 mb-0.5 flex items-center justify-between gap-2 border-b border-[var(--border-color)] pb-1">
                        <span>📅 {t.date}</span>
                        <span className="text-[9px] text-[var(--text-secondary)]">({t.count} transaksi)</span>
                      </div>
                      <div className="flex justify-between gap-3 text-[var(--text-primary)] mt-1">
                        <span>Total Omzet:</span>
                        <strong className="text-[var(--text-heading)] font-bold">{formatIDR(t.total_amount)}</strong>
                      </div>
                      <div className="flex justify-between gap-3 text-emerald-500">
                        <span>Mandiri Pasien:</span>
                        <strong>{formatIDR(t.patient_amount)}</strong>
                      </div>
                      <div className="flex justify-between gap-3 text-cyan-500">
                        <span>BPJS Kesehatan:</span>
                        <strong>{formatIDR(t.bpjs_amount)}</strong>
                      </div>
                      {Number(t.insurance_amount || 0) > 0 && (
                        <div className="flex justify-between gap-3 text-purple-500">
                          <span>Asuransi Swasta:</span>
                          <strong>{formatIDR(t.insurance_amount)}</strong>
                        </div>
                      )}
                    </div>

                    {/* Animated Stacked Bar with Discrete Color Blocks */}
                    <div className="w-full max-w-[48px] bg-[var(--bg-input)] rounded-t-lg overflow-hidden flex flex-col justify-end h-full p-1 border border-[var(--border-color)] group-hover:border-emerald-500/50 transition-colors">
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full flex flex-col justify-end gap-[1px] rounded-t overflow-hidden transition-all duration-500"
                      >
                        {/* Segment 3 (Top): Asuransi Swasta (Purple) */}
                        {insPct > 0 && (
                          <div 
                            style={{ height: `${insPct}%` }}
                            className="w-full bg-purple-600 hover:bg-purple-500 transition-colors"
                            title={`Asuransi Swasta: ${formatIDR(insVal)}`}
                          />
                        )}
                        {/* Segment 2 (Middle): BPJS Kesehatan (Cyan) */}
                        {bpjsPct > 0 && (
                          <div 
                            style={{ height: `${bpjsPct}%` }}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 transition-colors"
                            title={`BPJS Kesehatan: ${formatIDR(bpjsVal)}`}
                          />
                        )}
                        {/* Segment 1 (Bottom): Mandiri Pasien (Emerald) */}
                        {patPct > 0 && (
                          <div 
                            style={{ height: `${patPct}%` }}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 transition-colors"
                            title={`Mandiri Pasien: ${formatIDR(patVal)}`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Date Label */}
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] font-medium">{t.date}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-[var(--text-primary)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Penerimaan Mandiri Pasien</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span>Subsidi BPJS Kesehatan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>Klaim Asuransi Swasta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: BPJS vs Patient vs Private Ins Share Donut */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2">
              <PieChart size={18} className="text-cyan-500" /> Distribusi Penjamin ({monthNames[selectedMonth - 1]})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Persentase kontribusi bayar mandiri vs BPJS vs Asuransi Swasta</p>
          </div>

          {/* SVG Donut Visualizer */}
          <div className="flex items-center justify-center py-4 relative">
            <svg viewBox="0 0 100 100" className="w-40 h-40 transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="var(--border-color)"
                strokeWidth="12"
                fill="transparent"
              />
              {/* BPJS Segment (Cyan) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#06b6d4"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${((bpjs.bpjs_percentage || 0) / 100) * 251.2} 251.2`}
                strokeDashoffset="0"
                className="transition-all duration-1000"
              />
              {/* Patient Segment (Emerald) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10b981"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${((bpjs.patient_percentage || 0) / 100) * 251.2} 251.2`}
                strokeDashoffset={`-${((bpjs.bpjs_percentage || 0) / 100) * 251.2}`}
                className="transition-all duration-1000"
              />
              {/* Private Insurance Segment (Purple) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#a855f7"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={`${((bpjs.private_ins_percentage || 0) / 100) * 251.2} 251.2`}
                strokeDashoffset={`-${(((bpjs.bpjs_percentage || 0) + (bpjs.patient_percentage || 0)) / 100) * 251.2}`}
                className="transition-all duration-1000"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase text-[var(--text-secondary)] font-semibold tracking-wider">Total Billing</span>
              <span className="text-sm font-bold text-[var(--text-heading)] font-mono">{formatIDR(bpjs.total_gross)}</span>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
              <span className="text-emerald-600 dark:text-emerald-300 font-semibold">Mandiri Pasien ({bpjs.patient_percentage?.toFixed(1) || 0}%)</span>
              <strong className="text-[var(--text-heading)] font-mono">{formatIDR(bpjs.total_patient)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex justify-between items-center">
              <span className="text-cyan-600 dark:text-cyan-300 font-semibold">Subsidi BPJS Kesehatan ({bpjs.bpjs_percentage?.toFixed(1) || 0}%)</span>
              <strong className="text-[var(--text-heading)] font-mono">{formatIDR(bpjs.total_bpjs)}</strong>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex justify-between items-center">
              <span className="text-purple-600 dark:text-purple-300 font-semibold">Asuransi Swasta ({bpjs.private_ins_percentage?.toFixed(1) || 0}%)</span>
              <strong className="text-[var(--text-heading)] font-mono">{formatIDR(bpjs.total_private_ins)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Top Medical Actions & Recent Kas Ledger Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Medical Actions Ranking */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-amber-500" /> Peringkat 5 Tindakan Medis Terlaris ({monthNames[selectedMonth - 1]})
            </h3>
            <span className="text-xs text-[var(--text-secondary)]">Berdasarkan Total Kuantitas</span>
          </div>

          <div className="space-y-3">
            {topActions.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-6">Belum ada data tindakan medis terpakai pada bulan ini.</p>
            ) : (
              topActions.map((act, idx) => {
                const maxQty = topActions[0]?.total_qty || 1;
                const widthPct = Math.max(15, Math.round((act.total_qty / maxQty) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--text-heading)] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] flex items-center justify-center font-mono font-bold">
                          {idx + 1}
                        </span>
                        {act.item_name}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatIDR(act.total_amount)}</span>
                    </div>

                    <div className="w-full bg-[var(--bg-subtle)] h-2.5 rounded-full overflow-hidden p-0.5 border border-[var(--border-color)]">
                      <div 
                        style={{ width: `${widthPct}%` }}
                        className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                      />
                    </div>

                    <div className="text-[10px] text-[var(--text-secondary)] text-right font-mono">
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-heading)] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" /> Mutasi Jurnal Kas Masuk Terakhir
            </h3>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Audit Finance</span>
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
                    <td colSpan={4} className="text-center text-[var(--text-secondary)] py-6">Belum ada catatan mutasi kas.</td>
                  </tr>
                ) : (
                  ledgers.slice(0, 5).map((l) => (
                    <tr key={l.ID || l.id}>
                      <td className="font-mono text-xs text-[var(--text-secondary)]">#LEDGER-{l.ID || l.id}</td>
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
