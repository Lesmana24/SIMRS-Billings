import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ page = 1, totalPages = 1, totalRows = 0, onPageChange }) => {
  if (totalPages <= 1 && totalRows === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-gray-400">
      <div>
        Menampilkan data <span className="font-semibold text-white">{totalRows > 0 ? totalRows : 0}</span> baris
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} /> Prev
        </button>

        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-xs">
          Halaman {page} dari {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Halaman Selanjutnya"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
