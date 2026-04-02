import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}) {
  const [inputValue, setInputValue] = useState('');

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const handleInputSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(inputValue, 10);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
    setInputValue('');
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
      {/* Info */}
      {totalItems !== undefined && (
        <p className="text-sm text-gray-500">
          {startItem}–{endItem} sur {totalItems} résultats
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>

        {pages[0] > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              1
            </button>
            {pages[0] > 2 && <span className="text-gray-400 px-1">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
              ${p === currentPage
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>

        {/* Go to page */}
        {totalPages > 5 && (
          <form onSubmit={handleInputSubmit} className="flex items-center gap-1 ml-2">
            <span className="text-sm text-gray-400">Aller à</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="n°"
            />
          </form>
        )}
      </div>
    </div>
  );
}
