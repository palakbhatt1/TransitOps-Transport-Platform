import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Play, Check, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { client } from '../api/client';
import { Role, TripStatus } from '../api/contracts';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function Trips() {
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    origin: '',
    destination: '',
    cargo_weight_kg: 0
  });

  const loadData = async () => {
    try {
      const [tData, vData, dData] = await Promise.all([
        client.trips.getAll(),
        client.vehicles.getAll(),
        client.drivers.getAll()
      ]);
      setTrips(tData);
      setVehicles(vData);
      setDrivers(dData);
    } catch (err) {
      toast.error('Failed to load operations data');
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

  const isDispatcher = userRole === Role.FLEET_MANAGER;

  // Filter available drivers & vehicles for new dispatch creation
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');

  const handleOpenAdd = () => {
    if (!isDispatcher) {
      toast.error('Access Denied: Only Fleet Managers can dispatch trips.');
      return;
    }
    setErrorBanner('');
    setFormData({
      vehicle_id: availableVehicles[0]?.id || '',
      driver_id: availableDrivers[0]?.id || '',
      origin: '',
      destination: '',
      cargo_weight_kg: 1000
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    try {
      // Validate inputs
      if (!formData.vehicle_id || !formData.driver_id || !formData.origin || !formData.destination) {
        throw new Error('TRIP_VALIDATION_ERROR: All fields are required.');
      }

      await client.trips.create(formData);
      toast.success('Trip created in DRAFT status.');
      setIsModalOpen(false);
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      setErrorBanner(err.message);
      toast.error('Dispatch creation failed.');
    }
  };

  const handleDispatch = async (tripId) => {
    try {
      await client.trips.dispatch(tripId);
      toast.success('Trip successfully DISPATCHED to driver.');
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch trip.');
    }
  };

  const handleComplete = async (tripId) => {
    try {
      await client.trips.complete(tripId);
      toast.success('Trip marked as COMPLETED.');
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error('Failed to complete trip.');
    }
  };

  const handleCancel = async (tripId) => {
    try {
      await client.trips.cancel(tripId);
      toast.success('Trip CANCELLED.');
      loadData();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error('Failed to cancel trip.');
    }
  };

  const getVehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || id;
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || id;

  const columns = [
    { header: 'Trip ID', accessor: 'id', sortable: true },
    { header: 'Vehicle', accessor: (row) => getVehicleReg(row.vehicle_id) },
    { header: 'Driver', accessor: (row) => getDriverName(row.driver_id), sortable: true },
    { 
      header: 'Route', 
      accessor: (row) => (
        <span className="flex items-center gap-1.5 font-medium">
          {row.origin} <ArrowRight className="h-3 w-3 text-zinc-500" /> {row.destination}
        </span>
      ) 
    },
    { header: 'Cargo (kg)', accessor: (row) => row.cargo_weight_kg.toLocaleString(), sortable: true },
    { 
      header: 'Status', 
      accessor: (row) => <StatusBadge status={row.status} /> 
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 m-0">Trip Dispatcher</h1>
          <p className="text-sm text-zinc-400 mt-1">Plan, dispatch, and track active route lifecycles and cargo weights.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-500/20 transition-all ${
            !isDispatcher ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
          }`}
        >
          <Plus className="h-4 w-4" />
          New Trip Draft
        </button>
      </div>

      {/* RBAC Warning banner */}
      {userRole === Role.DRIVER && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Driver Access:</span> You can view assignments and update dispatched trip statuses (Complete/Cancel). Draft trip creation is locked.
          </div>
        </div>
      )}
      {!isDispatcher && userRole !== Role.DRIVER && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Read-Only View:</span> Route creation and status dispatches are locked. Only Fleet Managers have operational control buttons.
          </div>
        </div>
      )}

      {/* Trips Table */}
      <DataTable
        columns={columns}
        data={trips}
        searchKey="destination"
        searchPlaceholder="Search trips by destination..."
        actions={(isDispatcher || userRole === Role.DRIVER) ? (row) => (
          <div className="flex justify-end gap-2">
            {row.status === TripStatus.DRAFT && isDispatcher && (
              <>
                <button
                  onClick={() => handleDispatch(row.id)}
                  className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  title="Dispatch Trip"
                >
                  <Play className="h-3 w-3" /> Dispatch
                </button>
                <button
                  onClick={() => handleCancel(row.id)}
                  className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Cancel Trip"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {row.status === TripStatus.DRAFT && !isDispatcher && (
              <span className="text-xs text-zinc-500 pr-2 italic">Draft (Locked)</span>
            )}
            {row.status === TripStatus.DISPATCHED && (
              <>
                <button
                  onClick={() => handleComplete(row.id)}
                  className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  title="Mark Completed"
                >
                  <Check className="h-3 w-3" /> Complete
                </button>
                <button
                  onClick={() => handleCancel(row.id)}
                  className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Cancel Trip"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
            {(row.status === TripStatus.COMPLETED || row.status === TripStatus.CANCELLED) && (
              <span className="text-xs text-zinc-500 pr-2 italic">No actions</span>
            )}
          </div>
        ) : null}
      />

      {/* Dispatch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Trip Dispatch"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Validation Banner inside modal */}
          {errorBanner && (
            <div className="bg-rose-500/15 border border-rose-500/25 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Failed</span>
                <p className="mt-1 font-mono">{errorBanner}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Select Vehicle</label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              >
                <option value="" disabled>-- Choose Vehicle --</option>
                {availableVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} - {v.model} (Max: {v.max_load_kg}kg)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Select Driver</label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              >
                <option value="" disabled>-- Choose Driver --</option>
                {availableDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} (CDL: {d.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Origin</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="City, State"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Destination</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="City, State"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Cargo Weight (kg)</label>
            <input
              type="number"
              value={formData.cargo_weight_kg}
              onChange={(e) => setFormData({ ...formData, cargo_weight_kg: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              min="0"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-sm font-semibold rounded-lg text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-violet-500/10 transition-colors"
            >
              Save Draft
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
