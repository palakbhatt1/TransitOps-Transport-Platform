import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { client } from '../api/client';
import { Role, VehicleStatus } from '../api/contracts';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function Vehicles() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  // Filter states
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    registration_number: '',
    model: '',
    type: 'Box Truck',
    max_load_kg: 5000,
    odometer: 0,
    acquisition_cost: 30000,
    region: '',
    status: VehicleStatus.AVAILABLE
  });

  const fetchVehicles = async () => {
    try {
      const data = await client.vehicles.getAll();
      setVehicles(data);
    } catch (err) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const user = client.auth.getCurrentUser();
    if (user) {
      setUserRole(user.role);
    }

    // Refresh if auth/role switches
    const handleAuthChange = () => {
      const u = client.auth.getCurrentUser();
      if (u) setUserRole(u.role);
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const isEditable = userRole === Role.FLEET_MANAGER;

  // Unique lists for dropdown filters
  const types = [...new Set(vehicles.map(v => v.type))];
  const regions = [...new Set(vehicles.map(v => v.region))];

  // Filtering logic
  const filteredVehicles = vehicles.filter(v => {
    return (
      (filterType === '' || v.type === filterType) &&
      (filterStatus === '' || v.status === filterStatus) &&
      (filterRegion === '' || v.region === filterRegion)
    );
  });

  const handleOpenAdd = () => {
    if (!isEditable) {
      toast.error('Access Denied: Only Fleet Managers can register vehicles.');
      return;
    }
    setModalType('add');
    setFormData({
      registration_number: '',
      model: '',
      type: 'Box Truck',
      max_load_kg: 5000,
      odometer: 0,
      acquisition_cost: 30000,
      region: '',
      status: VehicleStatus.AVAILABLE
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vehicle) => {
    if (!isEditable) {
      toast.error('Access Denied: Only Fleet Managers can update vehicle records.');
      return;
    }
    setModalType('edit');
    setSelectedVehicle(vehicle);
    setFormData({
      registration_number: vehicle.registration_number,
      model: vehicle.model,
      type: vehicle.type,
      max_load_kg: vehicle.max_load_kg,
      odometer: vehicle.odometer,
      acquisition_cost: vehicle.acquisition_cost,
      region: vehicle.region,
      status: vehicle.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isEditable) {
      toast.error('Access Denied: Only Fleet Managers can retire or delete vehicles.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await client.vehicles.delete(id);
        toast.success('Vehicle successfully removed.');
        fetchVehicles();
        // Emit event to update dashboard KPIs
        window.dispatchEvent(new Event('data-changed'));
      } catch (err) {
        toast.error(err.message || 'Failed to delete vehicle.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await client.vehicles.create(formData);
        toast.success('New vehicle successfully registered.');
      } else {
        await client.vehicles.update(selectedVehicle.id, formData);
        toast.success('Vehicle details updated successfully.');
      }
      setIsModalOpen(false);
      fetchVehicles();
      // Emit event to update dashboard KPIs
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const columns = [
    { header: 'Reg No.', accessor: 'registration_number', sortable: true },
    { header: 'Model', accessor: 'model', sortable: true },
    { header: 'Type', accessor: 'type', sortable: true },
    { header: 'Max Load (kg)', accessor: (row) => row.max_load_kg.toLocaleString(), sortable: true },
    { header: 'Odometer (km)', accessor: (row) => row.odometer.toLocaleString(), sortable: true },
    { header: 'Acq. Cost ($)', accessor: (row) => `$${row.acquisition_cost.toLocaleString()}`, sortable: true },
    { header: 'Region', accessor: 'region', sortable: true },
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 m-0">Vehicle Registry</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and track fleet vehicle specifications and maintenance states.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-500/20 transition-all ${
            !isEditable ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
          }`}
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {/* RBAC Banner if not Fleet Manager */}
      {!isEditable && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Read-Only Access:</span> You are currently viewing TransitOps as a <span className="font-bold underline">{userRole.replace('_', ' ')}</span>. Registration and update rights are restricted to Fleet Managers.
          </div>
        </div>
      )}

      {/* Filters Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-lg p-2 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-lg p-2 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Statuses</option>
            <option value={VehicleStatus.AVAILABLE}>Available</option>
            <option value={VehicleStatus.ON_TRIP}>On Trip</option>
            <option value={VehicleStatus.IN_SHOP}>In Shop / Maintenance</option>
            <option value={VehicleStatus.RETIRED}>Retired</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Filter by Region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-sm text-zinc-300 rounded-lg p-2 focus:outline-none focus:border-violet-500"
          >
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Vehicles Grid Table */}
      <DataTable
        columns={columns}
        data={filteredVehicles}
        searchKey="registration_number"
        searchPlaceholder="Search by Reg No..."
        actions={isEditable ? (row) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Edit Vehicle"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              title="Delete Vehicle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'add' ? 'Register New Vehicle' : 'Edit Vehicle Details'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Reg. Number</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                placeholder="TX-123-AB"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Volvo FH16"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Box Truck">Box Truck</option>
                <option value="Cargo Van">Cargo Van</option>
                <option value="Flatbed">Flatbed</option>
                <option value="Electric Van">Electric Van</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Max Load (kg)</label>
              <input
                type="number"
                value={formData.max_load_kg}
                onChange={(e) => setFormData({ ...formData, max_load_kg: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Odometer (km)</label>
              <input
                type="number"
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                min="0"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Acquisition Cost ($)</label>
              <input
                type="number"
                value={formData.acquisition_cost}
                onChange={(e) => setFormData({ ...formData, acquisition_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Southwest"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              >
                <option value={VehicleStatus.AVAILABLE}>Available</option>
                <option value={VehicleStatus.ON_TRIP}>On Trip</option>
                <option value={VehicleStatus.IN_SHOP}>In Shop</option>
                <option value={VehicleStatus.RETIRED}>Retired</option>
              </select>
            </div>
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
              {modalType === 'add' ? 'Register' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
