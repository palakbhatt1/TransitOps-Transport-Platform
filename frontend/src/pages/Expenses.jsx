import React, { useState, useEffect } from 'react';
import { Plus, Wallet, ShieldAlert, Sparkles } from 'lucide-react';
import { client } from '../api/client';
import { Role } from '../api/contracts';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';

export default function Expenses() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [logType, setLogType] = useState('fuel');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    liters: 0,
    cost: 0,
    odometer: 0,
    category: 'Toll',
    date: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  const loadData = async () => {
    try {
      const [finData, vData] = await Promise.all([
        client.finance.getLogs(),
        client.vehicles.getAll()
      ]);
      setFuelLogs(finData.fuel_logs || []);
      setExpenses(finData.expenses || []);
      setVehicles(vData || []);
    } catch (err) {
      toast.error('Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const user = client.auth.getCurrentUser();
    if (user) setUserRole(user.role);
    const handleAuthChange = () => {
      const u = client.auth.getCurrentUser();
      if (u) setUserRole(u.role);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const isFinanceManager = userRole === Role.FLEET_MANAGER || userRole === Role.FINANCIAL_ANALYST;

  const handleOpenAdd = () => {
    if (!isFinanceManager) {
      toast.error('Access Denied: Only Financial Analysts or Fleet Managers can log expenses.');
      return;
    }
    setFormData({
      vehicle_id: vehicles[0]?.id || '',
      liters: 45,
      cost: 85,
      odometer: vehicles[0]?.odometer || 1000,
      category: 'Toll',
      date: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.vehicle_id) {
        toast.error('Please select a vehicle.');
        return;
      }
      
      const payload = {
        vehicle_id: formData.vehicle_id,
        cost: parseFloat(formData.cost) || 0,
        date: new Date(formData.date).toISOString(),
        notes: formData.notes
      };

      if (logType === 'fuel') {
        await client.finance.recordFuel({
          ...payload,
          liters: parseFloat(formData.liters) || 0,
          odometer: parseInt(formData.odometer) || 0
        });
        toast.success('Fuel log recorded successfully.');
      } else {
        await client.finance.recordExpense({
          ...payload,
          category: formData.category
        });
        toast.success('Expense recorded successfully.');
      }

      setIsModalOpen(false);
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error(err.message || 'Failed to submit record.');
    }
  };

  const getVehicleReg = (id) => {
    const v = vehicles.find(veh => veh.id === id);
    return v ? `${v.registration_number} (${v.model})` : id;
  };

  const totalFuelCost = fuelLogs.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalExpenseCost = expenses.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalCost = totalFuelCost + totalExpenseCost;

  const fuelColumns = [
    { header: 'Vehicle', accessor: (row) => getVehicleReg(row.vehicle_id) },
    { header: 'Refill Date', accessor: (row) => new Date(row.date).toLocaleString(), sortable: true },
    { header: 'Liters Refueled', accessor: (row) => `${row.liters.toFixed(1)} L`, sortable: true },
    { header: 'Odometer (km)', accessor: (row) => row.odometer.toLocaleString(), sortable: true },
    { header: 'Cost', accessor: (row) => <span className="font-semibold text-gray-700">${row.cost.toFixed(2)}</span>, sortable: true },
    { header: 'Notes', accessor: (row) => <span className="text-gray-400 italic">{row.notes || '—'}</span> }
  ];

  const expenseColumns = [
    { header: 'Vehicle', accessor: (row) => getVehicleReg(row.vehicle_id) },
    { header: 'Expense Date', accessor: (row) => new Date(row.date).toLocaleDateString(), sortable: true },
    { header: 'Category', accessor: (row) => <span className="px-2 py-0.5 bg-purple-50 text-[#714B67] rounded text-xs font-semibold uppercase">{row.category}</span>, sortable: true },
    { header: 'Cost', accessor: (row) => <span className="font-semibold text-gray-700">${row.cost.toFixed(2)}</span>, sortable: true },
    { header: 'Notes', accessor: (row) => <span className="text-gray-400 italic">{row.notes || '—'}</span> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Fuel & Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor operational expense sheets and log refills.</p>
        </div>
        <button 
          onClick={handleOpenAdd} 
          id="btn-new-log" 
          className={`flex items-center gap-2 bg-[#714B67] text-white px-6 py-2.5 rounded-[6px] text-sm font-semibold hover:bg-[#5D3E55] transition-colors shadow-sm ${!isFinanceManager ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Plus className="h-4 w-4" />New Record
        </button>
      </div>

      {/* Role Warning Banner */}
      {!isFinanceManager && (
        <div className="bg-amber-50/50 border border-amber-100 text-amber-700 p-4 rounded-[6px] flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <span className="font-semibold">Read-Only View:</span> Expense logging, toll entry, and fuel ticket registration are locked to Financial Analysts and Fleet Managers.
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex gap-1 border-b border-[#E2E8F0] bg-gray-50/50 p-1 rounded-t-[8px]">
        {['fuel', 'expenses'].map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-sm font-semibold rounded-[6px] transition-all ${
              activeTab === tab
                ? 'bg-white text-[#714B67] shadow-sm border border-[#E2E8F0] font-bold'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            {tab === 'fuel' ? '⛽ Fuel Logs' : '💵 General Expenses'}
          </button>
        ))}
      </div>

      {/* Tables Container */}
      <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] p-4">
        {activeTab === 'fuel' ? (
          <DataTable 
            columns={fuelColumns} 
            data={fuelLogs} 
            searchKey="notes" 
            searchPlaceholder="Search fuel records..." 
          />
        ) : (
          <DataTable 
            columns={expenseColumns} 
            data={expenses} 
            searchKey="category" 
            searchPlaceholder="Search expenses by category..." 
          />
        )}
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] p-6 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fuel Expenses</span>
            <span className="text-2xl font-bold text-gray-800 mt-1">${totalFuelCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-[6px] flex items-center justify-center font-bold">⛽</div>
        </div>

        <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] p-6 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Other Expenses</span>
            <span className="text-2xl font-bold text-gray-800 mt-1">${totalExpenseCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="w-10 h-10 bg-purple-50 text-[#714B67] rounded-[6px] flex items-center justify-center font-bold">💵</div>
        </div>

        <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] p-6 flex items-start justify-between relative overflow-hidden bg-gradient-to-r from-purple-50/50 to-indigo-50/30">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#714B67] uppercase tracking-widest flex items-center gap-1"><Sparkles className="h-3 w-3" />Total Operational Cost</span>
            <span className="text-2xl font-bold text-[#714B67] mt-1">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="w-10 h-10 bg-white shadow-sm border border-purple-100 rounded-[6px] flex items-center justify-center font-bold text-[#00A09D]"><Wallet className="h-5 w-5" /></div>
        </div>
      </div>

      {/* Modal Dialog */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Expense Record">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 border-b border-gray-100 pb-4">
            <button
              type="button"
              onClick={() => setLogType('fuel')}
              className={`flex-1 py-2 text-center rounded-[6px] text-xs font-bold transition-all border ${logType === 'fuel' ? 'bg-[#714B67] text-white border-[#714B67]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              ⛽ Fuel Log
            </button>
            <button
              type="button"
              onClick={() => setLogType('expense')}
              className={`flex-1 py-2 text-center rounded-[6px] text-xs font-bold transition-all border ${logType === 'expense' ? 'bg-[#714B67] text-white border-[#714B67]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
              💵 General Expense
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Select Vehicle</label>
              <select 
                value={formData.vehicle_id} 
                onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} 
                className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                required
              >
                <option value="" disabled>-- Select Vehicle --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} — {v.model}</option>)}
              </select>
            </div>

            {logType === 'fuel' ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Liters Refueled</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.liters} 
                    onChange={e => setFormData({ ...formData, liters: parseFloat(e.target.value) || 0 })} 
                    className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Odometer Reading (km)</label>
                  <input 
                    type="number" 
                    value={formData.odometer} 
                    onChange={e => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })} 
                    className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" 
                    required 
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Expense Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })} 
                  className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                >
                  {['Toll', 'Parking', 'Repairs', 'Insurance', 'Taxes', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Cost ($)</label>
              <input 
                type="number" 
                step="0.01" 
                value={formData.cost} 
                onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} 
                className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" 
                required 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Log Date</label>
              <input 
                type="datetime-local" 
                value={formData.date} 
                onChange={e => setFormData({ ...formData, date: e.target.value })} 
                className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" 
                required 
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notes / Description</label>
              <input 
                type="text" 
                value={formData.notes} 
                onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                placeholder="Specify station name, receipt reference or details..."
                className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" 
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-100 justify-end">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white text-gray-500 border border-gray-300 px-6 py-2.5 rounded-[6px] font-semibold text-[14px] hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="bg-[#714B67] hover:bg-[#5D3E55] text-white px-8 py-2.5 rounded-[6px] font-semibold text-[14px] transition-colors">Save Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
