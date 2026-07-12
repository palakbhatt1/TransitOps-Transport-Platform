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
    <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      {searchKey && (
        <div className="p-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8F9FA]/50">
          <div className="relative w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#E2E8F0] rounded-[6px] text-[13px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#714B67] transition-colors"
            />
          </div>
        </div>
      )}

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-gray-500">
              {columns.map((col) => (
                <th
                  key={col.header}
                  onClick={() => handleSort(col.accessor, col.sortable)}
                  className={`px-6 py-4 ${col.sortable ? 'cursor-pointer hover:text-[#714B67] select-none' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortConfig.key === col.accessor && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3 text-[#714B67]" /> : <ChevronDown className="h-3 w-3 text-[#714B67]" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-[13px] text-gray-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-[#F8F9FA] transition-colors cursor-pointer group">
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
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8F9FA] flex justify-between items-center text-[13px] text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-gray-700">
              {Math.min(currentPage * pageSize, processedData.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-700">{processedData.length}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-700 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
