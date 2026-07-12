import React, { useState, useEffect } from 'react';
import { Plus, Check, ShieldAlert } from 'lucide-react';
import { client } from '../api/client';
import { Role } from '../api/contracts';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

export default function Maintenance() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // Modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    cost: 0
  });

  const [closeCost, setCloseCost] = useState('');

  const loadData = async () => {
    try {
      const [lData, vData] = await Promise.all([
        client.maintenance.getAll(),
        client.vehicles.getAll()
      ]);
      setLogs(lData);
      setVehicles(vData);
    } catch (err) {
      toast.error('Failed to load maintenance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const user = client.auth.getCurrentUser();
    if (user) {
      setUserRole(user.role);
    }

    const handleAuthChange = () => {
      const u = client.auth.getCurrentUser();
      if (u) setUserRole(u.role);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const canSchedule = userRole === Role.FLEET_MANAGER || userRole === Role.SAFETY_OFFICER;
  const canClose = userRole === Role.FLEET_MANAGER;

  // Filter out retired vehicles for new service
  const activeVehicles = vehicles.filter(v => v.status !== 'retired');

  const handleOpenSchedule = () => {
    if (!canSchedule) {
      toast.error('Access Denied: Only Fleet Managers and Safety Officers can schedule maintenance.');
      return;
    }
    setFormData({
      vehicle_id: activeVehicles[0]?.id || '',
      service_type: '',
      cost: 150.00
    });
    setIsScheduleOpen(true);
  };

  const handleOpenClose = (log) => {
    if (!canClose) {
      toast.error('Access Denied: Only Fleet Managers can close maintenance logs.');
      return;
    }
    setSelectedLog(log);
    setCloseCost(log.cost.toString());
    setIsCloseOpen(true);
  };

  const handleSubmitSchedule = async (e) => {
    e.preventDefault();
    try {
      await client.maintenance.create(formData);
      toast.success('Service log opened. Vehicle status set to In Shop.');
      setIsScheduleOpen(false);
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error('Failed to schedule service.');
    }
  };

  const handleSubmitClose = async (e) => {
    e.preventDefault();
    try {
      const costVal = parseFloat(closeCost) || 0;
      await client.maintenance.closeLog(selectedLog.id, costVal);
      toast.success('Maintenance completed. Vehicle returned to Available pool.');
      setIsCloseOpen(false);
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error('Failed to close maintenance log.');
    }
  };

  const getVehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || id;

  const columns = [
    { header: 'Log ID', accessor: 'id', sortable: true },
    { header: 'Vehicle', accessor: (row) => getVehicleReg(row.vehicle_id) },
    { header: 'Service Type', accessor: 'service_type', sortable: true },
    { header: 'Cost ($)', accessor: (row) => `$${row.cost.toLocaleString()}`, sortable: true },
    { 
      header: 'Opened At', 
      accessor: (row) => new Date(row.opened_at).toLocaleString(),
      sortable: true 
    },
    { 
      header: 'Closed At', 
      accessor: (row) => row.closed_at ? (
        new Date(row.closed_at).toLocaleString()
      ) : (
        <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          OPEN
        </span>
      ),
      sortable: true 
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 m-0">Maintenance Log</h1>
          <p className="text-sm text-zinc-400 mt-1">Schedule and audit shop operations, maintenance costs, and garage stays.</p>
        </div>
        <button
          onClick={handleOpenSchedule}
          className={`flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-500/20 transition-all ${
            !canSchedule ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
          }`}
        >
          <Plus className="h-4 w-4" />
          Schedule Service
        </button>
      </div>

      {/* RBAC Banner */}
      {userRole === Role.SAFETY_OFFICER && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Safety Officer Access:</span> You can schedule new service logs, but closing entries and final cost audits require Fleet Manager credentials.
          </div>
        </div>
      )}
      {!canSchedule && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Read-Only View:</span> Scheduling repairs and finishing service entries require Fleet Manager or Safety Officer credentials.
          </div>
        </div>
      )}

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={logs}
        searchKey="service_type"
        searchPlaceholder="Search by service type..."
        actions={canClose ? (row) => (
          <div className="flex justify-end">
            {!row.closed_at ? (
              <button
                onClick={() => handleOpenClose(row)}
                className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Check className="h-3.5 w-3.5" /> Close Service
              </button>
            ) : (
              <span className="text-xs text-zinc-500 pr-2 italic">Completed</span>
            )}
          </div>
        ) : null}
      />

      {/* Schedule Service Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Vehicle Service"
      >
        <form onSubmit={handleSubmitSchedule} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Select Vehicle</label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              required
            >
              <option value="" disabled>-- Choose Vehicle --</option>
              {activeVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.model} ({v.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Service Type / Description</label>
            <input
              type="text"
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
              placeholder="e.g. Engine Overhaul, Brake Pad Replacement"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Estimated Cost ($)</label>
            <input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-sm font-semibold rounded-lg text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-500/10 transition-colors"
            >
              Dispatch to Shop
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Service Modal */}
      <Modal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Complete Vehicle Service"
      >
        <form onSubmit={handleSubmitClose} className="space-y-4">
          <p className="text-sm text-zinc-400">
            Provide the final invoice cost for resolving the service on{' '}
            <span className="font-semibold text-zinc-200">
              {selectedLog && getVehicleReg(selectedLog.vehicle_id)}
            </span>
            .
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Final Cost ($)</label>
            <input
              type="number"
              value={closeCost}
              onChange={(e) => setCloseCost(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCloseOpen(false)}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-sm font-semibold rounded-lg text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-500/10 transition-colors"
            >
              Finalize Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
