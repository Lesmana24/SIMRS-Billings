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
    <div className="glass-card p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{title}</p>
        <h4 className="text-2xl font-extrabold text-white number-font tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} border ${style.border}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};
