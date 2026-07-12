import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { client } from '../api/client';
import { Role, DriverStatus } from '../api/contracts';
import { useToast } from '../components/Toast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function Drivers() {
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    category: 'Class A CDL',
    license_expiry: '',
    contact: '',
    safety_score: 5.0,
    status: DriverStatus.AVAILABLE
  });

  const fetchDrivers = async () => {
    try {
      const data = await client.drivers.getAll();
      setDrivers(data);
    } catch (err) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
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

  // Fleet Managers and Safety Officers can edit driver details
  const isEditable = userRole === Role.FLEET_MANAGER || userRole === Role.SAFETY_OFFICER;

  // Check if any active driver has an expired license or is suspended
  const todayStr = '2026-07-12'; // Frozen current time context
  const warningDrivers = drivers.filter(d => {
    const isExpired = new Date(d.license_expiry) < new Date(todayStr);
    const isSuspended = d.status === DriverStatus.SUSPENDED;
    return isExpired || isSuspended;
  });

  const handleOpenAdd = () => {
    if (!isEditable) {
      toast.error('Access Denied: Only Fleet Managers and Safety Officers can register drivers.');
      return;
    }
    setModalType('add');
    setFormData({
      name: '',
      license_number: '',
      category: 'Class A CDL',
      license_expiry: '',
      contact: '',
      safety_score: 5.0,
      status: DriverStatus.AVAILABLE
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver) => {
    if (!isEditable) {
      toast.error('Access Denied: Only Fleet Managers and Safety Officers can update driver profiles.');
      return;
    }
    setModalType('edit');
    setSelectedDriver(driver);
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      category: driver.category,
      license_expiry: driver.license_expiry,
      contact: driver.contact,
      safety_score: driver.safety_score,
      status: driver.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isEditable) {
      toast.error('Access Denied: Restricted operation.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this driver from the system?')) {
      try {
        await client.drivers.delete(id);
        toast.success('Driver profile removed successfully.');
        fetchDrivers();
        window.dispatchEvent(new Event('data-changed'));
      } catch (err) {
        toast.error('Failed to delete driver.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await client.drivers.create(formData);
        toast.success('Driver registered successfully.');
      } else {
        await client.drivers.update(selectedDriver.id, formData);
        toast.success('Driver profile updated successfully.');
      }
      setIsModalOpen(false);
      fetchDrivers();
      window.dispatchEvent(new Event('data-changed'));
    } catch (err) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  const columns = [
    { header: 'Driver', accessor: 'name', sortable: true },
    { header: 'License No.', accessor: 'license_number', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    { 
      header: 'Expiry Date', 
      accessor: (row) => {
        const isExpired = new Date(row.license_expiry) < new Date(todayStr);
        return (
          <span className={isExpired ? 'text-red-500 font-medium' : ''}>
            {row.license_expiry} {isExpired && '(Expired)'}
          </span>
        );
      },
      sortable: true 
    },
    { header: 'Contact', accessor: 'contact' },
    { 
      header: 'Safety Score', 
      accessor: (row) => {
        const pct = (row.safety_score / 5.0) * 100;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#00A09D] w-12">{row.safety_score.toFixed(1)} / 5.0</span>
            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
              <div className="bg-[#00A09D] h-full" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        );
      },
      sortable: true 
    },
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

  const isLicenseExpired = formData.license_expiry && new Date(formData.license_expiry) < new Date(todayStr);

  const driverStatuses = [
    { key: DriverStatus.AVAILABLE, label: 'Available' },
    { key: DriverStatus.ON_TRIP, label: 'On Trip' },
    { key: DriverStatus.OFF_DUTY, label: 'Off Duty' },
    { key: DriverStatus.SUSPENDED, label: 'Suspended' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Driver Management</h1>
          <p className="text-sm text-gray-500 mt-1">Register drivers, track safety logs, and monitor licensing compliance.</p>
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

      {/* RBAC Banner if not manager/safety */}
      {!isEditable && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-4 rounded-[6px] flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Read-Only Access:</span> Driver creation and credentials updates are locked. Access is restricted to Fleet Managers and Safety Officers.
          </div>
        </div>
      )}

      {/* Red inline warning banner for Expired License or Suspended status */}
      {warningDrivers.length > 0 && (
        <div className="bg-[#FEF2F2] border-l-4 border-red-500 rounded-r-[6px] p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#991B1B]">Licensing & Safety Compliance Alerts</h4>
              <p className="text-xs text-red-700/80 mt-0.5">The following drivers have expired licenses or are currently suspended. They are blocked from trip assignments.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {warningDrivers.map(d => {
              const isExpired = new Date(d.license_expiry) < new Date(todayStr);
              return (
                <div key={d.id} className="bg-white border border-[#E2E8F0] p-2.5 rounded-[6px] flex items-center justify-between text-xs shadow-sm">
                  <div>
                    <span className="font-semibold text-gray-800 block">{d.name}</span>
                    <span className="text-gray-500 font-mono text-[10px]">{d.license_number}</span>
                  </div>
                  <div className="text-right">
                    {isExpired && <span className="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100 mr-1.5">EXPIRED</span>}
                    {d.status === DriverStatus.SUSPENDED && <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">SUSPENDED</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drivers Data Table */}
      <DataTable
        columns={columns}
        data={drivers}
        searchKey="name"
        searchPlaceholder="Search drivers..."
        actions={isEditable ? (row) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#714B67] hover:bg-gray-100 transition-colors"
              title="Edit Driver Profile"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-gray-100 transition-colors"
              title="Remove Driver"
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
        title={modalType === 'add' ? 'Register New Driver' : 'Edit Driver Profile'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* License Expired Banner inside details */}
          {isLicenseExpired && (
            <div className="bg-[#FEF2F2] border-l-4 border-red-500 p-4 mb-4 rounded-r-[6px] flex items-center gap-3 animate-pulse">
              <span className="text-red-500 text-xl">⚠️</span>
              <span className="text-[#991B1B] text-sm font-medium">License expired — cannot be assigned to trips</span>
            </div>
          )}

          {/* Status Pills Row */}
          <div className="flex items-center gap-2 mb-6">
            {driverStatuses.map((s) => {
              const isActive = formData.status === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  disabled={!isEditable}
                  onClick={() => setFormData({ ...formData, status: s.key })}
                  className={`px-4 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                    isActive 
                      ? 'bg-[#714B67] border-[#714B67] text-white' 
                      : 'border-gray-300 text-gray-400 bg-white hover:bg-gray-50'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Driver Header Card */}
          <div className="flex items-center gap-4 py-2 border-b border-gray-100 pb-4">
            <div className="w-14 h-14 bg-gray-50 rounded-[8px] border border-gray-200 flex items-center justify-center shrink-0">
              <span className="text-2xl text-gray-400">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#714B67] m-0">
                {modalType === 'edit' ? formData.name : 'New Driver'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {modalType === 'edit' ? `DRV-${selectedDriver?.id || '042'}` : 'Register a new fleet driver'}
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Driver Name</label>
                <input
                  type="text"
                  value={formData.name}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  placeholder="TX-9920-8381"
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">License Expiry Date</label>
                <input
                  type="date"
                  value={formData.license_expiry}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  className={`border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full ${isLicenseExpired ? 'text-red-500 font-medium' : 'text-gray-800'}`}
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</label>
                <select
                  value={formData.category}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full appearance-none bg-white"
                >
                  <option value="Class A CDL">Class A CDL</option>
                  <option value="Class B CDL">Class B CDL</option>
                  <option value="Class C">Class C</option>
                  <option value="Class D">Class D</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Passenger">Passenger</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact Phone</label>
                <input
                  type="text"
                  value={formData.contact}
                  disabled={!isEditable}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full"
                  required
                />
              </div>

              {/* Safety Score progress display */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Safety Score (1.0 - 5.0)</label>
                <div className="flex items-center gap-4 py-2">
                  <input
                    type="number"
                    value={formData.safety_score}
                    disabled={!isEditable}
                    onChange={(e) => setFormData({ ...formData, safety_score: parseFloat(e.target.value) || 0 })}
                    className="border-0 border-b border-gray-200 rounded-none bg-transparent py-2 text-[15px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-16 text-center"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    required
                  />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00A09D]" style={{ width: `${(formData.safety_score / 5.0) * 100}%` }}></div>
                  </div>
                </div>
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
              Cancel
            </button>
            {isEditable && (
              <button
                type="submit"
                className="px-6 py-2 bg-[#714B67] text-white rounded-[6px] text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
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
