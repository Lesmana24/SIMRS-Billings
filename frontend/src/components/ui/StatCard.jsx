import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/15',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/30',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/15',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/30',
        };
      case 'cyan':
        return {
          bg: 'bg-teal-500/15',
          text: 'text-teal-600 dark:text-teal-400',
          border: 'border-teal-500/30',
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/15',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-[var(--bg-subtle)]',
          text: 'text-[var(--text-secondary)]',
          border: 'border-[var(--border-color)]',
        };
    }
  };

  const style = getColorStyles();

  return (
    <div className="glass-card p-4 flex flex-col justify-between space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          {title}
        </p>
        {Icon && (
          <div className={`p-1.5 rounded-md ${style.bg} ${style.text} border ${style.border} shrink-0`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xl font-bold text-[var(--text-heading)] number-font tracking-tight">
          {value}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
