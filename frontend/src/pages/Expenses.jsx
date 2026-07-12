import React, { useState } from 'react';
import { Plus, MoreHorizontal, Wallet, TrendingUp } from 'lucide-react';

// Static mock data for Fuel & Expenses (placeholder page - to be wired to API)
const MOCK_FUEL = [
  { id: 1, vehicle: 'VAN-05 (Ford Transit)', date: '2026-07-10 08:30', quantity: '45.5 L / Diesel', cost: 85.50, notes: 'Full tank refill at Shell' },
  { id: 2, vehicle: 'TRK-12 (Volvo FH)', date: '2026-07-10 10:15', quantity: '320.0 L / Diesel', cost: 640.00, notes: 'Express Highway Hub' },
  { id: 3, vehicle: 'VAN-08 (Mercedes Benz)', date: '2026-07-09 16:45', quantity: '52.2 L / Diesel', cost: 98.15, notes: 'Station #42 refueling' },
  { id: 4, vehicle: 'TRK-03 (Kenworth T680)', date: '2026-07-09 09:00', quantity: '410.5 L / Diesel', cost: 821.00, notes: 'Main Depot Internal Tank' }
];

const MOCK_EXPENSES = [
  { id: 1, vehicle: 'VAN-05 (Ford Transit)', date: '2026-07-11', category: 'Toll', cost: 24.50, notes: 'I-35 toll charges' },
  { id: 2, vehicle: 'TRK-12 (Volvo FH)', date: '2026-07-10', category: 'Parking', cost: 45.00, notes: 'Depot overnight fee' },
  { id: 3, vehicle: 'VAN-08 (Mercedes Benz)', date: '2026-07-09', category: 'Repair', cost: 320.00, notes: 'Tyre replacement' }
];

export default function Expenses() {
  const [activeTab, setActiveTab] = useState('fuel');
  const totalCost = [...MOCK_FUEL, ...MOCK_EXPENSES].reduce((sum, r) => sum + r.cost, 0);
  const data = activeTab === 'fuel' ? MOCK_FUEL : MOCK_EXPENSES;
  const fuelHeaders = ['Vehicle', 'Date', 'Quantity / Type', 'Cost', 'Notes', ''];
  const expHeaders = ['Vehicle', 'Date', 'Category', 'Cost', 'Notes', ''];
  const headers = activeTab === 'fuel' ? fuelHeaders : expHeaders;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Fuel & Expenses</h1>

      <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Notebook Tab Header */}
        <div className="flex items-center justify-between px-6 pt-4 border-b border-[#E2E8F0] bg-gray-50/50">
          <div className="flex gap-1">
            {['fuel', 'expenses'].map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium rounded-t-[6px] border-x border-t transition-all relative bottom-[-1px] ${
                  activeTab === tab
                    ? 'border-[#E2E8F0] border-b-white bg-white text-[#714B67] font-semibold'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                {tab === 'fuel' ? 'Fuel Logs' : 'Expenses'}
              </button>
            ))}
          </div>
          <button id="btn-new-log" className="mb-2 flex items-center gap-2 bg-[#714B67] text-white px-5 py-2 rounded-[6px] text-sm font-medium hover:bg-[#5D3E55] transition-colors shadow-sm">
            <Plus className="h-4 w-4" />New
          </button>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F8FAFC]">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-6 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {data.map(row => (
              <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                <td className="px-6 py-4 text-sm font-medium text-gray-700">{row.vehicle}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{row.date}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{activeTab === 'fuel' ? row.quantity : row.category}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-700">${row.cost.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-gray-400 italic">{row.notes}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-[#714B67] transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]/50 flex justify-between items-center">
          <span className="text-xs text-gray-400">Showing {data.length} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-[#E2E8F0] rounded-[6px] text-xs text-gray-500 bg-white hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 border border-[#E2E8F0] rounded-[6px] text-xs text-white bg-[#714B67]">1</button>
            <button className="px-3 py-1 border border-[#E2E8F0] rounded-[6px] text-xs text-gray-500 bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>

      {/* Total Cost Card */}
      <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] p-6 max-w-sm ml-auto relative group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Operational Cost</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-[#714B67]">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-[6px] flex items-center justify-center">
            <Wallet className="h-6 w-6 text-[#00A09D]" />
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 uppercase font-medium">Period: Jul 2026</span>
          <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />4.2%
          </span>
        </div>
      </div>
    </div>
  );
}
