import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-950/60',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
        };
      case 'amber':
        return {
          bg: 'bg-amber-950/60',
          text: 'text-amber-400',
          border: 'border-amber-500/30',
        };
      case 'cyan':
        return {
          bg: 'bg-teal-950/60',
          text: 'text-teal-400',
          border: 'border-teal-500/30',
        };
      case 'rose':
        return {
          bg: 'bg-rose-950/60',
          text: 'text-rose-400',
          border: 'border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-slate-900',
          text: 'text-slate-300',
          border: 'border-slate-800',
        };
    }
  };

  const style = getColorStyles();

  return (
    <div className="glass-card p-4 flex flex-col justify-between space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={`p-1.5 rounded-md ${style.bg} ${style.text} border ${style.border} shrink-0`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xl font-bold text-slate-100 number-font tracking-tight">
          {value}
        </h4>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
