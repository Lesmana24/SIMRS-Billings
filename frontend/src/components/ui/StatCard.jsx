import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo' }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
        };
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/20',
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
        };
      default:
        return {
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          border: 'border-indigo-500/20',
        };
    }
  };

  const style = getColorStyles();

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col justify-between space-y-3 min-w-0">
      {/* Top Row: Title & Icon vertically centered */}
      <div className="flex items-center justify-between gap-2 min-h-[32px]">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 leading-tight">
          {title}
        </p>
        {Icon && (
          <div className={`p-2 rounded-xl ${style.bg} ${style.text} border ${style.border} shrink-0 flex items-center justify-center`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      {/* Value & Subtitle Row: Full Width, No Truncate, High Detail */}
      <div>
        <h4 className="text-xl sm:text-2xl font-extrabold text-white number-font tracking-tight leading-tight break-words">
          {value}
        </h4>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1 font-medium leading-normal">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
