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
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [trips, setTrips] = useState([]);
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
      const [vData, mData, tData] = await Promise.all([
        client.vehicles.getAll(),
        client.maintenance.getAll(),
        client.trips.getAll()
      ]);
      setVehicles(vData);
      setMaintenanceLogs(mData);
      setTrips(tData);
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
        <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statuses = [
    { key: VehicleStatus.AVAILABLE, label: 'Available' },
    { key: VehicleStatus.ON_TRIP, label: 'On Trip' },
    { key: VehicleStatus.IN_SHOP, label: 'In Shop' },
    { key: VehicleStatus.RETIRED, label: 'Retired' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Fleet Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track fleet vehicle specifications and maintenance states.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-2 px-6 py-2 bg-[#714B67] hover:bg-[#5D3E55] text-white font-medium rounded-[6px] text-sm shadow-sm transition-all ${
            !isEditable ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
          }`}
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {/* RBAC Banner if not Fleet Manager */}
      {!isEditable && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-[6px] flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Read-Only Access:</span> You are currently viewing TransitOps as a <span className="font-bold underline">{userRole.replace('_', ' ')}</span>. Registration and update rights are restricted to Fleet Managers.
          </div>
        </div>
      )}

      {/* Filters Controls */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] text-sm text-gray-700 rounded-[6px] p-2 focus:outline-none focus:border-[#714B67]"
          >
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] text-sm text-gray-700 rounded-[6px] p-2 focus:outline-none focus:border-[#714B67]"
          >
            <option value="">All Statuses</option>
            <option value={VehicleStatus.AVAILABLE}>Available</option>
            <option value={VehicleStatus.ON_TRIP}>On Trip</option>
            <option value={VehicleStatus.IN_SHOP}>In Shop / Maintenance</option>
            <option value={VehicleStatus.RETIRED}>Retired</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter by Region</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] text-sm text-gray-700 rounded-[6px] p-2 focus:outline-none focus:border-[#714B67]"
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
        searchPlaceholder="Search vehicles..."
        actions={isEditable ? (row) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#714B67] hover:bg-gray-100 transition-colors"
              title="Edit Vehicle"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-gray-100 transition-colors"
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
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Status Connector Bar & Stat Boxes Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center">
              {statuses.map((s, index) => {
                const isActive = formData.status === s.key;
                const isFirst = index === 0;
                const isLast = index === statuses.length - 1;
                
                let roundedClass = '';
                if (isFirst) roundedClass = 'rounded-l-full';
                if (isLast) roundedClass = 'rounded-r-full';

                return (
                  <React.Fragment key={s.key}>
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => setFormData({ ...formData, status: s.key })}
                      className={`px-4 py-1.5 text-[12px] font-medium transition-all ${roundedClass} ${
                        isActive 
                          ? 'bg-[#714B67] text-white border border-[#714B67]' 
                          : 'bg-white text-gray-500 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                    {!isLast && <div className="h-[2px] w-8 bg-gray-300" />}
                  </React.Fragment>
                );
              })}
            </div>

            {modalType === 'edit' && selectedVehicle && (
              <div className="flex gap-3">
                <div className="bg-white rounded-[6px] border border-[#E2E8F0] px-4 py-2 flex flex-col items-center gap-1 shadow-sm w-[130px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maintenance</span>
                  <span className="text-md font-bold text-gray-800">
                    {maintenanceLogs.filter(log => log.vehicle_id === selectedVehicle.id).length} Records
                  </span>
                </div>
                <div className="bg-white rounded-[6px] border border-[#E2E8F0] px-4 py-2 flex flex-col items-center gap-1 shadow-sm w-[130px]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip History</span>
                  <span className="text-md font-bold text-gray-800">
                    {trips.filter(t => t.vehicle_id === selectedVehicle.id).length} Trips
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Info Header Card */}
          <div className="flex items-center gap-4 py-2">
            <div className="w-14 h-14 bg-gray-50 rounded-[8px] border border-gray-200 flex items-center justify-center shrink-0">
              <span className="text-2xl text-gray-400">🚚</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#714B67] m-0">
                {modalType === 'edit' ? formData.registration_number : 'New Vehicle'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {modalType === 'edit' ? formData.model : 'Register a new fleet vehicle'}
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Registration Number</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="ABC-1234-XYZ"
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Name / Model</label>
                <input
                  type="text"
                  value={formData.model}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Mercedes-Benz Sprinter"
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Type</label>
                <select
                  value={formData.type}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full appearance-none"
                >
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Box Truck">Box Truck</option>
                  <option value="Cargo Van">Cargo Van</option>
                  <option value="Flatbed">Flatbed</option>
                  <option value="Electric Van">Electric Van</option>
                  <option value="Van">Van</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Max Load Capacity (kg)</label>
                <input
                  type="number"
                  value={formData.max_load_kg}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, max_load_kg: parseInt(e.target.value) || 0 })}
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  min="0"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Odometer (km)</label>
                <input
                  type="number"
                  value={formData.odometer}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  min="0"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Acquisition Cost ($)</label>
                <input
                  type="number"
                  value={formData.acquisition_cost}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, acquisition_cost: parseFloat(e.target.value) || 0 })}
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  min="0"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Region</label>
                <input
                  type="text"
                  value={formData.region}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Southwest"
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 bg-white border border-[#714B67] text-[#714B67] rounded-[6px] text-sm font-semibold hover:bg-purple-50 transition-colors"
            >
              Discard
            </button>
            {isEditable && (
              <button
                type="submit"
                className="px-6 py-2 bg-[#714B67] text-white rounded-[6px] text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
