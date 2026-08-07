import React from 'react';
import { Activity, PieChart } from 'lucide-react';

export const RevenueTrendChart = ({ trends = [], maxTrendVal = 1, bpjs = {}, monthName = '', formatIDR }) => {
  return (
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
            <PieChart size={18} className="text-cyan-500" /> Distribusi Penjamin ({monthName})
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
            <span className="text-purple-600 dark:text-purple-300 font-semibold">Klaim Asuransi Swasta ({bpjs.private_ins_percentage?.toFixed(1) || 0}%)</span>
            <strong className="text-[var(--text-heading)] font-mono">{formatIDR(bpjs.total_private_ins)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
