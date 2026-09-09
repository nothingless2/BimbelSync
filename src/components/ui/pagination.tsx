"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Menampilkan <span className="font-medium text-slate-900 dark:text-slate-200">{startItem}</span> hingga <span className="font-medium text-slate-900 dark:text-slate-200">{endItem}</span> dari <span className="font-medium text-slate-900 dark:text-slate-200">{totalItems}</span> entri
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
          {currentPage} / {totalPages}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman Selanjutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
