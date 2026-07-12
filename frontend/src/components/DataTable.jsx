import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({
  columns,
  data,
  searchPlaceholder = 'Search...',
  searchKey,
  actions,
  pageSize = 5
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting handler
  const handleSort = (key, sortable) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Process data (Search -> Sort -> Paginate)
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter/Search
    if (searchQuery && searchKey) {
      result = result.filter(item => {
        const val = item[searchKey];
        return val && val.toString().toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle nested accessors or special formats if needed
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchKey, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  // Reset page on search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
      {/* Table Header Controls */}
      {searchKey && (
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {columns.map((col) => (
                <th
                  key={col.header}
                  onClick={() => handleSort(col.accessor, col.sortable)}
                  className={`px-6 py-4 ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig.key === col.accessor && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-zinc-500">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-zinc-800/35 transition-colors">
                  {columns.map((col) => {
                    const cellValue = typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor];
                    return (
                      <td key={col.header} className="px-6 py-4 whitespace-nowrap">
                        {cellValue}
                      </td>
                    );
                  })}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/30 flex justify-between items-center text-xs text-zinc-400">
          <div>
            Showing <span className="font-semibold text-zinc-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-zinc-200">
              {Math.min(currentPage * pageSize, processedData.length)}
            </span>{' '}
            of <span className="font-semibold text-zinc-200">{processedData.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-zinc-300 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
