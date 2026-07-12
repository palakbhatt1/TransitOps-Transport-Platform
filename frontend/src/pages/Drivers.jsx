import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
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

  const getSafetyScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-400 font-semibold';
    if (score >= 3.5) return 'text-amber-400 font-semibold';
    return 'text-rose-400 font-semibold';
  };

  const columns = [
    { header: 'Name', accessor: 'name', sortable: true },
    { header: 'License No.', accessor: 'license_number', sortable: true },
    { header: 'Category', accessor: 'category', sortable: true },
    { 
      header: 'License Expiry', 
      accessor: (row) => {
        const isExpired = new Date(row.license_expiry) < new Date(todayStr);
        return (
          <span className={isExpired ? 'text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20' : ''}>
            {row.license_expiry} {isExpired && '(EXPIRED)'}
          </span>
        );
      },
      sortable: true 
    },
    { header: 'Contact', accessor: 'contact' },
    { 
      header: 'Safety Score', 
      accessor: (row) => <span className={getSafetyScoreColor(row.safety_score)}>{row.safety_score.toFixed(1)} / 5.0</span>,
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
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 m-0">Driver Management</h1>
          <p className="text-sm text-zinc-400 mt-1">Register drivers, track safety logs, and monitor licensing compliance.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-violet-500/20 transition-all ${
            !isEditable ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
          }`}
        >
          <Plus className="h-4 w-4" />
          Register Driver
        </button>
      </div>

      {/* RBAC Banner if not manager/safety */}
      {!isEditable && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold">Read-Only Access:</span> Driver creation and credentials updates are locked. Access is restricted to Fleet Managers and Safety Officers.
          </div>
        </div>
      )}

      {/* Red inline warning banner for Expired License or Suspended status */}
      {warningDrivers.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3 text-rose-400">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold">Licensing & Safety Compliance Alerts</h4>
              <p className="text-xs text-rose-400/80 mt-0.5">The following drivers have expired licenses or are currently suspended. They are blocked from trip assignments.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {warningDrivers.map(d => {
              const isExpired = new Date(d.license_expiry) < new Date(todayStr);
              return (
                <div key={d.id} className="bg-zinc-950/60 border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-zinc-200 block">{d.name}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">{d.license_number}</span>
                  </div>
                  <div className="text-right">
                    {isExpired && <span className="text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 mr-1.5">EXPIRED</span>}
                    {d.status === DriverStatus.SUSPENDED && <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">SUSPENDED</span>}
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
        searchPlaceholder="Search drivers by name..."
        actions={isEditable ? (row) => (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Edit Driver Profile"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Driver Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">License Number</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="DL-TX123456"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">License Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
              >
                <option value="Class A CDL">Class A CDL</option>
                <option value="Class B CDL">Class B CDL</option>
                <option value="Class C">Class C</option>
                <option value="Class D">Class D</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">License Expiry</label>
              <input
                type="date"
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Contact Phone</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+1-555-0100"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Safety Score (1.0 - 5.0)</label>
              <input
                type="number"
                value={formData.safety_score}
                onChange={(e) => setFormData({ ...formData, safety_score: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
                min="1.0"
                max="5.0"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-lg text-sm focus:outline-none focus:border-violet-500"
            >
              <option value={DriverStatus.AVAILABLE}>Available</option>
              <option value={DriverStatus.ON_TRIP}>On Trip</option>
              <option value={DriverStatus.OFF_DUTY}>Off Duty</option>
              <option value={DriverStatus.SUSPENDED}>Suspended</option>
            </select>
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
