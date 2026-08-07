import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return {
          indicator: 'bg-emerald-500',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/30',
        };
      case 'amber':
        return {
          indicator: 'bg-amber-500',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/30',
        };
      case 'cyan':
        return {
          indicator: 'bg-cyan-500',
          text: 'text-cyan-600 dark:text-cyan-400',
          border: 'border-cyan-500/30',
        };
      case 'rose':
        return {
          indicator: 'bg-rose-500',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/30',
        };
      default:
        return {
          indicator: 'bg-stone-500',
          text: 'text-[var(--text-secondary)]',
          border: 'border-[var(--border-color)]',
        };
    }
  };

  const style = getColorStyles();

  return (
    <div className="glass-card p-5 flex flex-col justify-between space-y-4 border-l-2 relative overflow-hidden group transition-all" style={{ borderLeftColor: `var(--accent-${color === 'cyan' ? 'emerald' : color})` }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {title}
        </span>
        {Icon && (
          <div className="p-1 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <h4 className="text-2xl font-black text-[var(--text-heading)] font-mono tracking-tight">
          {value}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium font-sans">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
