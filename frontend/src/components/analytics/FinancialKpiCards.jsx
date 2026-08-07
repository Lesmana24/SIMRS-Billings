import React from 'react';
import { StatCard } from '../ui/StatCard';
import { Calendar, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';

export const FinancialKpiCards = ({ periods, monthName, year, totalPaidCount, formatIDR }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Kas Hari Ini"
        value={formatIDR(periods?.daily_revenue)}
        subtitle="Penerimaan lunas hari ini"
        icon={Calendar}
        color="emerald"
      />
      <StatCard
        title="Kas 7 Hari Terakhir"
        value={formatIDR(periods?.weekly_revenue)}
        subtitle="Penerimaan lunas 1 minggu"
        icon={TrendingUp}
        color="cyan"
      />
      <StatCard
        title={`Kas ${monthName} ${year}`}
        value={formatIDR(periods?.monthly_revenue)}
        subtitle={`Penerimaan lunas bulan ${monthName}`}
        icon={DollarSign}
        color="emerald"
      />
      <StatCard
        title="Total Kas Lunas (All Time)"
        value={formatIDR(periods?.total_revenue)}
        subtitle={`${totalPaidCount || 0} tagihan telah lunas`}
        icon={ShieldCheck}
        color="amber"
      />
    </div>
  );
};
