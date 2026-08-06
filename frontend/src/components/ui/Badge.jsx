import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const getVariantClass = () => {
    const v = String(variant).toLowerCase();
    switch (v) {
      case 'paid':
        return 'badge-paid';
      case 'pending':
        return 'badge-pending';
      case 'waiting_verification':
      case 'verifikasi':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30';
      case 'rejected':
      case 'ditolak':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
      case 'admin':
        return 'badge-admin';
      case 'staff':
        return 'badge-staff';
      case 'pasien':
        return 'badge-pasien';
      case 'debit':
        return 'badge-paid';
      default:
        return 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-color)]';
    }
  };

  const getLabel = () => {
    if (typeof children === 'string') {
      if (children === 'WAITING_VERIFICATION') return 'Menunggu Verifikasi Kasir';
      if (children === 'REJECTED') return 'Bukti Ditolak';
    }
    return children;
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`}>
      {getLabel()}
    </span>
  );
};
