import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const getVariantClass = () => {
    switch (variant.toLowerCase()) {
      case 'paid':
        return 'badge-paid';
      case 'pending':
        return 'badge-pending';
      case 'admin':
        return 'badge-admin';
      case 'staff':
        return 'badge-staff';
      case 'pasien':
        return 'badge-pasien';
      case 'debit':
        return 'badge-paid';
      default:
        return 'bg-gray-800 text-gray-300 border border-gray-700';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`}>
      {children}
    </span>
  );
};
