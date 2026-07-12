import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  CheckCircle, 
  Wrench, 
  Navigation, 
  Clock, 
  Users, 
  BarChart3, 
  Filter, 
  Layers, 
  Star, 
  X,
  ExternalLink
} from 'lucide-react';
import { client } from '../api/client';
import { useToast } from '../components/Toast';
import { VehicleStatus, DriverStatus, TripStatus } from '../api/contracts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState({
    kpis: null,
    trips: [],
    vehicles: [],
    drivers: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveTripsOnly, setShowActiveTripsOnly] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [kpisRes, tripsRes, vehiclesRes, driversRes] = await Promise.all([
        client.dashboard.getKPIs(),
        client.trips.getAll(),
        client.vehicles.getAll(),
        client.drivers.getAll()
      ]);
      setData({
        kpis: kpisRes,
        trips: tripsRes,
        vehicles: vehiclesRes,
        drivers: driversRes
      });
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('data-changed', fetchData);
    return () => {
      window.removeEventListener('data-changed', fetchData);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { kpis, trips, vehicles, drivers } = data;

  // Calculate fleet distribution dynamically
  const activeVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.ON_TRIP).length;
  const availableVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.AVAILABLE).length;
  const maintVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.IN_SHOP).length;
  const retiredVehiclesCount = vehicles.filter(v => v.status === VehicleStatus.RETIRED).length;
  const totalVehiclesCount = vehicles.length;

  const activePct = totalVehiclesCount > 0 ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100) : 0;
  const availablePct = totalVehiclesCount > 0 ? Math.round((availableVehiclesCount / totalVehiclesCount) * 100) : 0;
  const maintPct = totalVehiclesCount > 0 ? Math.round((maintVehiclesCount / totalVehiclesCount) * 105) : 0; // slight scale for visual emphasis
  
  // Normalize percentages to sum to 100
  let activePctNorm = activePct;
  let availablePctNorm = availablePct;
  let maintPctNorm = maintPct;
  let sum = activePctNorm + availablePctNorm + maintPctNorm;
  
  if (totalVehiclesCount > 0 && sum > 100) {
    const diff = sum - 100;
    if (maintPctNorm > diff) maintPctNorm -= diff;
    else if (availablePctNorm > diff) availablePctNorm -= diff;
    else activePctNorm = Math.max(0, activePctNorm - diff);
  }
  const retiredPctNorm = totalVehiclesCount > 0 ? Math.max(0, 100 - activePctNorm - availablePctNorm - maintPctNorm) : 0;

  // Calculate cargo capacity metrics
  const totalCapacityKg = vehicles
    .filter(v => v.status !== VehicleStatus.RETIRED)
    .reduce((sum, v) => sum + (v.max_load_kg || 0), 0);
  const activeTripsCargoKg = trips
    .filter(t => t.status === TripStatus.DISPATCHED)
    .reduce((sum, t) => sum + (t.cargo_weight_kg || 0), 0);

  const totalCapacityTons = (totalCapacityKg / 1000).toFixed(1);
  const activeTripsCargoTons = (activeTripsCargoKg / 1000).toFixed(1);
  const capacityUtilPct = totalCapacityKg > 0 ? Math.round((activeTripsCargoKg / totalCapacityKg) * 100) : 0;

  // Filter trips
  const filteredTrips = trips.filter(trip => {
    if (showActiveTripsOnly && trip.status !== TripStatus.DISPATCHED) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
      const driver = drivers.find(d => d.id === trip.driver_id);
      
      const matchesId = trip.id.toLowerCase().includes(term);
      const matchesOrigin = trip.origin.toLowerCase().includes(term);
      const matchesDest = trip.destination.toLowerCase().includes(term);
      const matchesVehicle = vehicle ? vehicle.model.toLowerCase().includes(term) : false;
      const matchesDriver = driver ? driver.name.toLowerCase().includes(term) : false;
      
      return matchesId || matchesOrigin || matchesDest || matchesVehicle || matchesDriver;
    }
    return true;
  });

  const cards = [
    { name: 'Active Vehicles', value: kpis.active_vehicles, icon: Truck, color: 'text-[#714B67]' },
    { name: 'Available', value: kpis.available_vehicles, icon: CheckCircle, color: 'text-[#00A09D]' },
    { name: 'In Maintenance', value: kpis.vehicles_in_maintenance, icon: Wrench, color: 'text-orange-500' },
    { name: 'Active Trips', value: kpis.active_trips, icon: Navigation, color: 'text-blue-500' },
    { name: 'Pending Trips', value: kpis.pending_trips, icon: Clock, color: 'text-gray-400' },
    { name: 'Drivers Duty', value: kpis.drivers_on_duty, icon: Users, color: 'text-[#714B67]' },
    { name: 'Fleet Util.', value: `${kpis.fleet_utilization_pct}%`, icon: BarChart3, color: 'text-[#00A09D]' },
  ];

  return (
    <div className="bg-[#F0F2F5] -m-6 md:-m-8 p-6 md:p-8 min-h-screen text-gray-800 space-y-6 font-sans antialiased">
      
      {/* Title & Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 m-0">TransitOps Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Real-time logistics fleet control panel & operational analytics.</p>
        </div>
        <div className="text-xs text-gray-400 font-medium italic">
          Odoo Enterprise Style View
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white p-4 rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col justify-between h-32 border border-[#E2E8F0] hover:shadow-md transition-shadow">
              <Icon className={`${card.color} h-6 w-6`} />
              <div>
                <div className="text-2xl font-bold text-gray-800 leading-none">{card.value}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2.5">
                  {card.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-[6px] p-3 flex flex-col lg:flex-row lg:items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <button className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2 border border-transparent hover:border-gray-200 transition-all cursor-pointer">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
          <button className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2 border border-transparent hover:border-gray-200 transition-all cursor-pointer">
            <Layers className="h-3.5 w-3.5" /> Group By
          </button>
          <button className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2 border border-transparent hover:border-gray-200 transition-all cursor-pointer">
            <Star className="h-3.5 w-3.5" /> Favorites
          </button>
        </div>
        
        <div className="flex items-center flex-1 min-w-0 lg:max-w-[640px] bg-gray-50 border border-gray-200 rounded-[6px] px-3 py-2 gap-2">
          {showActiveTripsOnly && (
            <div className="flex items-center gap-1 bg-[#714B67] text-white text-[11px] px-2.5 py-1 rounded-full shrink-0 font-medium leading-none">
              Active Trips
              <button 
                onClick={() => setShowActiveTripsOnly(false)} 
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          {!showActiveTripsOnly && (
            <button 
              onClick={() => setShowActiveTripsOnly(true)} 
              className="text-[11px] text-gray-500 hover:text-[#714B67] font-semibold border border-dashed border-gray-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer shrink-0"
            >
              + Filter Active
            </button>
          )}
          <div className="relative min-w-0 flex-1">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-[13px] outline-none w-full pr-6 text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none" 
              placeholder="Search ID, destination, vehicle, driver..."
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Operational View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Trips Table */}
        <div className="lg:col-span-8 bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-[#714B67] text-[15px]">Recent Trips</h3>
              <Link to="/trips" className="text-xs text-[#00A09D] hover:underline font-semibold flex items-center gap-1">
                View All Trips <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Trip ID</th>
                    <th className="px-6 py-3">Vehicle</th>
                    <th className="px-6 py-3">Driver</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px]">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium bg-white">
                        No matching trips found.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.slice(0, 5).map((trip) => {
                      const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
                      const driver = drivers.find(d => d.id === trip.driver_id);
                      
                      // Match status style
                      let dotColor = 'bg-blue-500';
                      let statusText = 'On Trip';
                      if (trip.status === TripStatus.COMPLETED) {
                        dotColor = 'bg-green-500';
                        statusText = 'Arrived';
                      } else if (trip.status === TripStatus.DRAFT) {
                        dotColor = 'bg-gray-400';
                        statusText = 'Draft / Pending';
                      } else if (trip.status === TripStatus.CANCELLED) {
                        dotColor = 'bg-red-500';
                        statusText = 'Cancelled';
                      }
                      
                      // Format ETA
                      let etaText = '-';
                      if (trip.status === TripStatus.COMPLETED) {
                        etaText = 'Arrived';
                      } else if (trip.status === TripStatus.DISPATCHED) {
                        // Generate mock dynamic ETA based on dispatch time or default
                        const dispatchHour = new Date(trip.dispatched_at || Date.now()).getHours();
                        const etaHour = (dispatchHour + 4) % 24;
                        etaText = `${etaHour === 0 ? 12 : etaHour > 12 ? etaHour - 12 : etaHour}:30 ${etaHour >= 12 ? 'PM' : 'AM'}`;
                      }

                      return (
                        <tr key={trip.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {trip.id.replace('trip_', 'TRP-').toUpperCase()}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {vehicle ? `${vehicle.registration_number} (${vehicle.model})` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 font-medium">
                            {driver ? driver.name : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                              <span>{statusText}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500 font-semibold">
                            {etaText}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {Math.min(filteredTrips.length, 5)} of {filteredTrips.length} entries</span>
            <span>Last sync: Just now</span>
          </div>
        </div>

        {/* Right Column: Fleet/Vehicle Status Distribution */}
        <div className="lg:col-span-4 bg-white rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#714B67] text-[15px] mb-6 border-b border-gray-100 pb-3">Vehicle Status</h3>
            
            {/* Progress segment bar */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                  <span>Fleet Distribution</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-8 flex rounded-[4px] overflow-hidden border border-gray-100 shadow-inner">
                  {activePctNorm > 0 && (
                    <div 
                      className="bg-[#714B67] transition-all duration-500 hover:opacity-90 cursor-help" 
                      style={{ width: `${activePctNorm}%` }} 
                      title={`On Trip: ${activeVehiclesCount} (${activePctNorm}%)`}
                    />
                  )}
                  {availablePctNorm > 0 && (
                    <div 
                      className="bg-[#00A09D] transition-all duration-500 hover:opacity-90 cursor-help" 
                      style={{ width: `${availablePctNorm}%` }} 
                      title={`Available: ${availableVehiclesCount} (${availablePctNorm}%)`}
                    />
                  )}
                  {maintPctNorm > 0 && (
                    <div 
                      className="bg-gray-200 transition-all duration-500 hover:opacity-90 cursor-help border-l border-r border-gray-300/40" 
                      style={{ width: `${maintPctNorm}%` }} 
                      title={`In Shop: ${maintVehiclesCount} (${maintPctNorm}%)`}
                    />
                  )}
                  {retiredPctNorm > 0 && (
                    <div 
                      className="bg-red-400 transition-all duration-500 hover:opacity-90 cursor-help" 
                      style={{ width: `${retiredPctNorm}%` }} 
                      title={`Retired: ${retiredVehiclesCount} (${retiredPctNorm}%)`}
                    />
                  )}
                </div>
              </div>
              
              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-3 h-3 rounded-sm bg-[#714B67] shrink-0" />
                  <span className="text-[13px] text-gray-600 font-medium">On Trip ({activePctNorm}%)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-3 h-3 rounded-sm bg-[#00A09D] shrink-0" />
                  <span className="text-[13px] text-gray-600 font-medium">Available ({availablePctNorm}%)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-3 h-3 rounded-sm bg-gray-200 shrink-0 border border-gray-300/40" />
                  <span className="text-[13px] text-gray-600 font-medium">In Shop ({maintPctNorm}%)</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-3 h-3 rounded-sm bg-red-400 shrink-0" />
                  <span className="text-[13px] text-gray-600 font-medium">Retired ({retiredPctNorm}%)</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Capacity Meter */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 font-medium">Active Cargo Load</span>
              <span className="text-sm font-bold text-[#714B67]">{activeTripsCargoTons} / {totalCapacityTons} Tons</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200 shadow-inner">
              <div 
                className="bg-[#00A09D] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(capacityUtilPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
              <span>Utilized capacity ({capacityUtilPct}%)</span>
              <span>Total capacity</span>
            </div>
          </div>
          
        </div>

      </div>

    </div>
  );
}
