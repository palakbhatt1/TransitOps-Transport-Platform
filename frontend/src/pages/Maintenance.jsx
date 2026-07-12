import React, { useState, useEffect } from 'react';
import { Plus, Check, ShieldAlert, Filter, List, LayoutGrid, Info } from 'lucide-react';
import { client } from '../api/client';
import { Role } from '../api/contracts';
import { useToast } from '../components/Toast';

export default function Maintenance() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState('active'); // 'active' | 'completed'
  const [selectedLog, setSelectedLog] = useState(null);
  const [closeCost, setCloseCost] = useState('');
  const [formData, setFormData] = useState({ vehicle_id: '', service_type: '', cost: '', scheduled_date: '', notes: '' });

  const loadData = async () => {
    try {
      const [lData, vData] = await Promise.all([client.maintenance.getAll(), client.vehicles.getAll()]);
      setLogs(lData); setVehicles(vData);
    } catch (err) { toast.error('Failed to load maintenance records'); } finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const user = client.auth.getCurrentUser();
    if (user) setUserRole(user.role);
    const handleAuthChange = () => { const u = client.auth.getCurrentUser(); if (u) setUserRole(u.role); };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const canSchedule = userRole === Role.FLEET_MANAGER || userRole === Role.SAFETY_OFFICER;
  const canClose = userRole === Role.FLEET_MANAGER;
  const activeVehicles = vehicles.filter(v => v.status !== 'retired');

  const handleOpenForm = () => {
    if (!canSchedule) { toast.error('Access Denied: Only Fleet Managers and Safety Officers can schedule maintenance.'); return; }
    setFormData({ vehicle_id: activeVehicles[0]?.id || '', service_type: '', cost: '', scheduled_date: '', notes: '' });
    setFormStatus('active');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await client.maintenance.create({ vehicle_id: formData.vehicle_id, service_type: formData.service_type, cost: parseFloat(formData.cost) || 0 });
      toast.success('Maintenance record created. Vehicle status set to In Shop.');
      setShowForm(false); loadData(); window.dispatchEvent(new Event('data-changed'));
    } catch (err) { toast.error(err.message || 'Failed to create record.'); }
  };

  const handleClose = async (log) => {
    if (!canClose) { toast.error('Access Denied: Only Fleet Managers can close maintenance logs.'); return; }
    try {
      await client.maintenance.closeLog(log.id, parseFloat(closeCost) || log.cost);
      toast.success('Maintenance record closed.'); setSelectedLog(null); loadData(); window.dispatchEvent(new Event('data-changed'));
    } catch (err) { toast.error('Failed to close record.'); }
  };

  const getVehicleLabel = (id) => { const v = vehicles.find(v => v.id === id); return v ? `${v.registration_number} (${v.model})` : id; };
  const getLogStatus = (log) => log.closed_at ? 'completed' : 'active';

  const statusDot = (status) => {
    const map = { active: 'bg-orange-400', completed: 'bg-green-500', overdue: 'bg-red-500' };
    return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-gray-300'} mr-2`} />;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Maintenance Logs</h1>
          <div className="flex border border-[#E2E8F0] rounded overflow-hidden bg-white shadow-sm">
            <button className="px-3 py-1.5 bg-gray-100 border-r border-[#E2E8F0]"><List className="h-4 w-4 text-gray-600" /></button>
            <button className="px-3 py-1.5 hover:bg-gray-50"><LayoutGrid className="h-4 w-4 text-gray-400" /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#E2E8F0] bg-white rounded px-3 py-1.5 gap-2 text-sm text-gray-600 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-gray-400" /><span>Filters</span>
          </div>
          <button id="maintenance-new-btn" onClick={handleOpenForm} className={`flex items-center gap-2 px-5 py-2 bg-[#714B67] hover:bg-[#5D3E55] text-white rounded-[6px] text-sm font-medium shadow-sm transition-all ${!canSchedule ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <Plus className="h-4 w-4" />New
          </button>
        </div>
      </div>

      {/* RBAC Banners */}
      {userRole === Role.SAFETY_OFFICER && (
        <div className="bg-indigo-50/50 border border-indigo-100 text-indigo-700 p-4 rounded-[6px] flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-indigo-500" />
          <div>
            <span className="font-semibold">Safety Officer Access:</span> You can schedule new service logs, but closing entries and final cost audits require Fleet Manager credentials.
          </div>
        </div>
      )}
      {!canSchedule && (
        <div className="bg-amber-50/50 border border-amber-100 text-amber-700 p-4 rounded-[6px] flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <span className="font-semibold">Read-Only Access:</span> Scheduling repairs requires Fleet Manager or Safety Officer credentials, and closing entries requires Fleet Manager credentials.
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] overflow-hidden">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-gray-500 uppercase text-[11px] tracking-wider">
              {['Vehicle', 'Service Type', 'Cost', 'Date', 'Status', ...(canClose ? [''] : [])].map(h => (
                <th key={h} className={`px-6 py-3 font-bold ${h === 'Cost' ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10 text-gray-400 text-sm">No maintenance records found.</td></tr>
            ) : logs.map(log => {
              const status = getLogStatus(log);
              return (
              <tr key={log.id} className="hover:bg-[#F8F9FA] transition-colors cursor-pointer" onClick={() => { if (canClose && status === 'active') { setSelectedLog(log); setCloseCost(log.cost); } }}>
                <td className="px-6 py-4 font-medium text-[#714B67]">{getVehicleLabel(log.vehicle_id)}</td>
                <td className="px-6 py-4 text-gray-600">{log.service_type}</td>
                <td className="px-6 py-4 text-right font-medium">${parseFloat(log.cost).toFixed(2)}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{new Date(log.opened_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {statusDot(status)}
                    <span className="text-xs capitalize">{status}</span>
                  </div>
                </td>
                {canClose && (
                  <td className="px-6 py-4 text-right">
                    {status === 'active' && (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedLog(log); setCloseCost(log.cost); }} className="px-3 py-1 text-xs font-semibold text-[#00A09D] border border-[#00A09D] rounded hover:bg-teal-50 transition-colors flex items-center gap-1">
                        <Check className="h-3 w-3" /> Close
                      </button>
                    )}
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inline New Record Form */}
      {showForm && (
        <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-[#E2E8F0] flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">New Maintenance Record</h3>
            <div className="flex gap-1">
              {['active', 'completed'].map(s => (
                <button key={s} onClick={() => setFormStatus(s)} className={`px-3 py-1 text-[11px] font-bold uppercase rounded-full border transition-all ${formStatus === s ? 'bg-[#714B67] text-white border-[#714B67]' : 'text-gray-500 border-gray-300 bg-transparent hover:bg-gray-50'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-b border-blue-100 p-3 flex items-center gap-3 text-[13px] text-blue-800">
            <Info className="h-4 w-4 text-blue-500" />
            <p>Creating an active record sets vehicle status to <strong>In Shop</strong></p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</label>
                <select value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full appearance-none" required>
                  <option value="" disabled>Select vehicle...</option>
                  {activeVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} ({v.model})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Service Type</label>
                <input type="text" value={formData.service_type} onChange={e => setFormData({ ...formData, service_type: e.target.value })} placeholder="e.g. Engine Repair" className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estimated Cost</label>
                <input type="number" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} placeholder="$ 0.00" className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" min="0" step="0.01" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Scheduled Date</label>
                <input type="date" value={formData.scheduled_date} onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Detailed Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Describe service details..." rows="3" className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full resize-none" />
              </div>
            </div>
            <div className="px-8 py-4 bg-gray-50 flex gap-2 justify-end border-t border-[#E2E8F0]">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 bg-white text-[#714B67] border border-[#714B67] rounded-[6px] text-sm font-medium hover:bg-purple-50 transition-colors">Discard</button>
              <button type="submit" className="px-5 py-2 bg-[#714B67] text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity">Save Record</button>
            </div>
          </form>
        </div>
      )}

      {/* Close Record Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-lg font-bold text-[#714B67] mb-2">Close Maintenance Record</h3>
            <p className="text-sm text-gray-500 mb-6">{getVehicleLabel(selectedLog.vehicle_id)} – {selectedLog.service_type}</p>
            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Final Cost ($)</label>
              <input type="number" value={closeCost} onChange={e => setCloseCost(e.target.value)} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" min="0" step="0.01" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedLog(null)} className="px-6 py-2 bg-white border border-gray-300 text-gray-600 rounded-[6px] text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleClose(selectedLog)} className="px-6 py-2 bg-[#00A09D] text-white rounded-[6px] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"><Check className="h-4 w-4" />Close Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
