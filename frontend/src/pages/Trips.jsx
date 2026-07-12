import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Check, XCircle, AlertTriangle, ShieldAlert, List, Kanban, Send, Truck } from 'lucide-react';
import { client } from '../api/client';
import { Role, TripStatus } from '../api/contracts';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

function KanbanCard({ trip, drivers, isDispatcher, onDispatch, onComplete, onCancel }) {
  const driver = drivers.find(d => d.id === trip.driver_id);
  const initials = driver ? driver.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '--';
  const borderMap = { draft: 'border-gray-400', dispatched: 'border-blue-500', completed: 'border-green-500', cancelled: 'border-red-500' };
  const etaMap = { draft: { color: 'text-gray-400', text: 'ETA: Pending' }, dispatched: { color: 'text-blue-600', text: 'In Transit' }, completed: { color: 'text-green-600', text: 'Finished' }, cancelled: { color: 'text-red-500', text: 'Voided' } };
  const eta = etaMap[trip.status] || { color: 'text-gray-400', text: '–' };
  const avatarBg = { draft: 'bg-gray-400', dispatched: 'bg-[#714B67]', completed: 'bg-gray-400', cancelled: 'bg-gray-300' };
  const cardClass = trip.status === 'completed' ? 'opacity-90' : trip.status === 'cancelled' ? 'grayscale-[0.5]' : '';

  return (
    <div className={`bg-white rounded-[6px] border-l-4 ${borderMap[trip.status]} p-4 shadow-sm group ${cardClass} hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-grab`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-bold text-[#714B67]">TRP-{trip.id}</span>
        <div className="flex items-center gap-1">
          {isDispatcher && trip.status === 'draft' && (
            <>
              <button onClick={() => onDispatch(trip.id)} className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 rounded transition-all">Dispatch</button>
              <button onClick={() => onCancel(trip.id)} className="text-red-400 hover:text-red-600 ml-1"><XCircle className="h-3.5 w-3.5" /></button>
            </>
          )}
          {isDispatcher && trip.status === 'dispatched' && (
            <>
              <button onClick={() => onComplete(trip.id)} className="px-2 py-0.5 text-[10px] font-bold bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 rounded transition-all">Complete</button>
              <button onClick={() => onCancel(trip.id)} className="text-red-400 hover:text-red-600 ml-1"><XCircle className="h-3.5 w-3.5" /></button>
            </>
          )}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-4">{trip.origin} → {trip.destination}</p>
      <div className="flex justify-between items-end">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"><Truck className="h-3 w-3 text-gray-500" /></div>
          <div className={`w-7 h-7 rounded-full ${avatarBg[trip.status]} text-white border-2 border-white flex items-center justify-center text-[10px] font-bold`}>{initials}</div>
        </div>
        <span className={`text-[11px] font-medium ${eta.color}`}>{eta.text}</span>
      </div>
    </div>
  );
}

export default function Trips() {
  const toast = useToast();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    origin: '',
    destination: '',
    cargo_weight_kg: 1000,
    planned_distance_km: 100
  });

  const loadData = async () => {
    try {
      const [tData, vData, dData] = await Promise.all([client.trips.getAll(), client.vehicles.getAll(), client.drivers.getAll()]);
      setTrips(tData); setVehicles(vData); setDrivers(dData);
    } catch (err) { toast.error('Failed to load data'); } finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const user = client.auth.getCurrentUser();
    if (user) setUserRole(user.role);
    const handleAuthChange = () => { const u = client.auth.getCurrentUser(); if (u) setUserRole(u.role); };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const isDispatcher = userRole === Role.FLEET_MANAGER;
  const availableVehicles = vehicles.filter(v => v.status === 'available');
  const availableDrivers = drivers.filter(d => d.status === 'available');
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
  const cargoExceeds = selectedVehicle && formData.cargo_weight_kg > selectedVehicle.max_load_kg;

  const handleOpenAdd = () => {
    if (!isDispatcher) { toast.error('Access Denied: Only Fleet Managers can dispatch trips.'); return; }
    setErrorBanner('');
    setFormData({
      vehicle_id: availableVehicles[0]?.id || '',
      driver_id: availableDrivers[0]?.id || '',
      origin: '',
      destination: '',
      cargo_weight_kg: 1000,
      planned_distance_km: 100
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrorBanner('');
    if (cargoExceeds) { setErrorBanner(`Cargo weight exceeds vehicle capacity by ${formData.cargo_weight_kg - selectedVehicle.max_load_kg} kg.`); return; }
    try {
      if (!formData.vehicle_id || !formData.driver_id || !formData.origin || !formData.destination) throw new Error('All fields are required.');
      await client.trips.create(formData);
      toast.success('Trip created in DRAFT status.'); setIsModalOpen(false); loadData(); window.dispatchEvent(new Event('data-changed'));
    } catch (err) { setErrorBanner(err.message); }
  };

  const handleDispatch = async (id) => { try { await client.trips.dispatch(id); toast.success('Trip DISPATCHED.'); loadData(); window.dispatchEvent(new Event('data-changed')); } catch (err) { toast.error(err.message); } };
  const handleComplete = async (id) => { try { await client.trips.complete(id); toast.success('Trip COMPLETED.'); loadData(); window.dispatchEvent(new Event('data-changed')); } catch (err) { toast.error('Failed.'); } };
  const handleCancel = async (id) => { try { await client.trips.cancel(id); toast.success('Trip CANCELLED.'); loadData(); window.dispatchEvent(new Event('data-changed')); } catch (err) { toast.error('Failed.'); } };

  const getVehicleReg = (id) => vehicles.find(v => v.id === id)?.registration_number || id;
  const getDriverName = (id) => drivers.find(d => d.id === id)?.name || id;

  const kanbanCols = [
    { key: TripStatus.DRAFT, label: 'Draft', dot: 'bg-gray-400' },
    { key: TripStatus.DISPATCHED, label: 'Dispatched', dot: 'bg-blue-500' },
    { key: TripStatus.COMPLETED, label: 'Completed', dot: 'bg-green-500' },
    { key: TripStatus.CANCELLED, label: 'Cancelled', dot: 'bg-red-500' }
  ];

  const columns = [
    { header: 'Trip ID', accessor: (row) => `TRP-${row.id}`, sortable: true },
    { header: 'Vehicle', accessor: (row) => getVehicleReg(row.vehicle_id) },
    { header: 'Driver', accessor: (row) => getDriverName(row.driver_id), sortable: true },
    { header: 'Route', accessor: (row) => <span className="flex items-center gap-1.5 text-gray-700">{row.origin} <ArrowRight className="h-3 w-3 text-gray-400" /> {row.destination}</span> },
    { header: 'Cargo (kg)', accessor: (row) => row.cargo_weight_kg.toLocaleString(), sortable: true },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div></div>;

  const tripStatusesOrder = [TripStatus.DRAFT, TripStatus.DISPATCHED, TripStatus.COMPLETED, TripStatus.CANCELLED];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Trip Dispatcher</h1>
          <p className="text-sm text-gray-500 mt-1">Plan, dispatch, and track active route lifecycles.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-[6px] p-1 shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-[#714B67]' : 'text-gray-400 hover:bg-gray-50'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-gray-100 text-[#714B67]' : 'text-gray-400 hover:bg-gray-50'}`}><Kanban className="h-4 w-4" /></button>
          </div>
          <button onClick={handleOpenAdd} id="create-trip-btn" className={`flex items-center gap-2 px-6 py-2 bg-[#714B67] hover:bg-[#5D3E55] text-white font-medium rounded-[6px] text-sm shadow-sm transition-all ${!isDispatcher ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <Plus className="h-4 w-4" />New
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
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
=======
      {!isDispatcher && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-[6px] flex items-center gap-3 text-sm">
>>>>>>> Stashed changes
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div><span className="font-semibold">Read-Only View:</span> Route creation and status dispatches are locked to Fleet Managers.</div>
        </div>
      )}

<<<<<<< Updated upstream
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
=======
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanCols.map(col => {
            const colTrips = trips.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="bg-[#F1F5F9] rounded-[8px] p-3 flex flex-col gap-3 min-h-[300px]">
                <div className="flex items-center justify-between px-1 mb-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${col.dot}`} />{col.label}</h3>
                  <span className="text-xs text-gray-400 font-medium">{colTrips.length}</span>
                </div>
                {colTrips.length === 0
                  ? <div className="flex items-center justify-center flex-1 text-gray-300 text-xs italic py-6">No trips</div>
                  : colTrips.map(trip => (
                    <KanbanCard key={trip.id} trip={trip} drivers={drivers} isDispatcher={isDispatcher} onDispatch={handleDispatch} onComplete={handleComplete} onCancel={handleCancel} />
                  ))}
>>>>>>> Stashed changes
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <DataTable
          columns={columns} data={trips} searchKey="destination" searchPlaceholder="Search trips..."
          actions={isDispatcher ? (row) => (
            <div className="flex justify-end gap-2">
              {row.status === TripStatus.DRAFT && (<><button onClick={() => handleDispatch(row.id)} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-500 border border-blue-200 text-blue-600 hover:text-white rounded text-xs font-semibold flex items-center gap-1 transition-all"><Send className="h-3 w-3" /> Dispatch</button><button onClick={() => handleCancel(row.id)} className="p-1 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded"><XCircle className="h-4 w-4" /></button></>)}
              {row.status === TripStatus.DISPATCHED && (<><button onClick={() => handleComplete(row.id)} className="px-2.5 py-1 bg-green-50 hover:bg-green-500 border border-green-200 text-green-600 hover:text-white rounded text-xs font-semibold flex items-center gap-1 transition-all"><Check className="h-3 w-3" /> Complete</button><button onClick={() => handleCancel(row.id)} className="p-1 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded"><XCircle className="h-4 w-4" /></button></>)}
              {(row.status === TripStatus.COMPLETED || row.status === TripStatus.CANCELLED) && <span className="text-xs text-gray-400 pr-2 italic">–</span>}
            </div>
          ) : null}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Trip Dispatch">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-100">Draft Mode</span>
            <div className="flex w-64 items-center">
              {tripStatusesOrder.map((s, idx) => {
                const label = s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <div key={s} className={`flex-1 text-center py-1 text-[11px] font-semibold border border-r-0 last:border-r transition-all ${idx === 0 ? 'rounded-l-full' : ''} ${idx === tripStatusesOrder.length - 1 ? 'rounded-r-full border-r' : ''} ${s === TripStatus.DRAFT ? 'bg-[#714B67] text-white border-[#714B67]' : 'text-gray-400 border-gray-200 bg-white'}`}>{label}</div>
                );
              })}
            </div>
          </div>

          {(errorBanner || cargoExceeds) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r-md">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div><p className="text-red-800 text-sm font-semibold">Validation Error</p><p className="text-red-600 text-[13px]">{errorBanner || `Cargo weight exceeds vehicle capacity by ${formData.cargo_weight_kg - (selectedVehicle?.max_load_kg || 0)} kg.`}</p></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {[
              { label: 'Source Location', key: 'origin', placeholder: 'Enter pick-up terminal or address' },
              { label: 'Destination', key: 'destination', placeholder: 'Enter drop-off destination' }
            ].map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{f.label}</label>
                <input type="text" value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" required />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</label>
              <select value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full appearance-none" required>
                <option value="" disabled>-- Choose Available Vehicle --</option>
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} – {v.model} (Cap: {v.max_load_kg.toLocaleString()} kg)</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Assigned Driver</label>
              <select value={formData.driver_id} onChange={e => setFormData({ ...formData, driver_id: e.target.value })} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full appearance-none" required>
                <option value="" disabled>-- Choose Available Driver --</option>
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} (Available)</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cargo Weight (kg)</label>
              <input type="number" value={formData.cargo_weight_kg} onChange={e => setFormData({ ...formData, cargo_weight_kg: parseInt(e.target.value) || 0 })} className={`border-0 border-b bg-transparent py-2 text-[14px] focus:outline-none focus:border-b-2 transition-all w-full ${cargoExceeds ? 'border-red-400 text-red-600' : 'border-gray-200 text-gray-800 focus:border-[#714B67]'}`} min="0" required />
              {selectedVehicle && <span className="text-[11px] text-gray-400">Max capacity: {selectedVehicle.max_load_kg.toLocaleString()} kg</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Planned Distance (km)</label>
              <input type="number" value={formData.planned_distance_km} onChange={e => setFormData({ ...formData, planned_distance_km: parseInt(e.target.value) || 0 })} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" min="1" required />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
            <button type="submit" disabled={cargoExceeds} className={`flex items-center gap-2 px-8 py-2.5 rounded-[6px] font-semibold text-[14px] transition-colors ${cargoExceeds ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#714B67] hover:bg-[#5D3E55] text-white'}`}>
              <Send className="h-4 w-4" />Save Draft
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white text-gray-500 border border-gray-300 px-8 py-2.5 rounded-[6px] font-semibold text-[14px] hover:bg-gray-50 transition-colors">Cancel</button>
            <span className="ml-auto text-gray-400 text-[12px] italic">Changes saved automatically as draft</span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
