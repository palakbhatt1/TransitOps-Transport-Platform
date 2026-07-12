import React, { useState, useEffect } from 'react';
import { List, LayoutGrid, BarChart2, Download } from 'lucide-react';
import { client } from '../api/client';

const MONTHLY_DATA = [
  { month: 'Jan', trips: 40, services: 25 },
  { month: 'Feb', trips: 55, services: 30 },
  { month: 'Mar', trips: 70, services: 45 },
  { month: 'Apr', trips: 65, services: 40 },
  { month: 'May', trips: 85, services: 50 },
  { month: 'Jun', trips: 95, services: 60 },
  { month: 'Jul', trips: 90, services: 55 },
  { month: 'Aug', trips: 75, services: 45 }
];

export default function Analytics() {
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [activeView, setActiveView] = useState('graph');

  useEffect(() => {
    Promise.all([client.vehicles.getAll(), client.trips.getAll(), client.maintenance.getAll()])
      .then(([v, t, m]) => { setVehicles(v); setTrips(t); setMaintenance(m); })
      .catch(() => {});
  }, []);

  const fleetUtilPct = vehicles.length ? Math.round((vehicles.filter(v => v.status !== 'available').length / vehicles.length) * 100) : 0;
  const totalMaintCost = maintenance.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const roiPct = vehicles.length ? ((completedTrips / Math.max(vehicles.length, 1)) * 2.8).toFixed(1) : '0.0';

  const KPICard = ({ icon, label, value, badge, badgeColor }) => (
    <div className="bg-white p-5 rounded-[6px] border border-[#E2E8F0] shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#714B67] text-xl">{icon}</span>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}>{badge}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-[13px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );

  const topVehicles = [...vehicles].sort((a, b) => b.odometer - a.odometer).slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {[{ icon: <List className="h-4 w-4" />, key: 'list' }, { icon: <LayoutGrid className="h-4 w-4" />, key: 'pivot' }, { icon: <BarChart2 className="h-4 w-4" />, key: 'graph' }].map(btn => (
              <button key={btn.key} onClick={() => setActiveView(btn.key)} className={`p-1.5 rounded border border-[#E2E8F0] transition-all ${activeView === btn.key ? 'bg-gray-100 border-gray-300' : 'bg-white hover:bg-gray-50'} text-gray-600`}>
                {btn.icon}
              </button>
            ))}
          </div>
          <button id="export-data-btn" className="flex items-center gap-2 px-4 py-1.5 rounded border border-[#714B67] text-[#714B67] text-sm font-medium hover:bg-purple-50 transition-colors">
            <Download className="h-4 w-4" />Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon="⛽" label="Fuel Efficiency" value="88.4%" badge="+2.4%" badgeColor="text-green-600" />
        <KPICard icon="🚛" label="Fleet Utilization" value={`${fleetUtilPct}%`} badge="Optimal" badgeColor="text-green-600" />
        <KPICard icon="💵" label="Operational Cost" value={`$${totalMaintCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}`} badge="+12%" badgeColor="text-red-600" />
        <KPICard icon="📈" label="Vehicle ROI" value={`${roiPct}%`} badge="High" badgeColor="text-green-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[6px] border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[15px] font-bold text-gray-800">Monthly Revenue</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#714B67] inline-block" /><span className="text-xs text-gray-500">Trips</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#00A09D] inline-block" /><span className="text-xs text-gray-500">Services</span></div>
            </div>
          </div>
          <div className="relative h-48 flex items-end justify-between gap-2 pb-2 border-b border-gray-100">
            {MONTHLY_DATA.map(d => (
              <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex gap-0.5 items-end w-full">
                  <div className="bg-[#714B67] w-1/2 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer" style={{ height: `${(d.trips / 100) * 180}px` }} />
                  <div className="bg-[#00A09D] w-1/2 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer" style={{ height: `${(d.services / 100) * 180}px` }} />
                </div>
                <span className="text-[10px] text-gray-400">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Costliest Vehicles */}
        <div className="bg-white p-6 rounded-[6px] border border-[#E2E8F0] shadow-sm">
          <h3 className="text-[15px] font-bold text-gray-800 mb-6">Top Vehicles by Odometer</h3>
          <div className="space-y-5">
            {topVehicles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data</p>
            ) : topVehicles.map((v, idx) => {
              const maxOdo = topVehicles[0]?.odometer || 1;
              const barColors = ['bg-[#714B67]', 'bg-[#00A09D]', 'bg-amber-500', 'bg-gray-400', 'bg-[#714B67]'];
              return (
                <div key={v.id} className="space-y-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-700">{v.registration_number} {v.model}</span>
                    <span className="font-bold text-gray-800">{v.odometer.toLocaleString()} km</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`${barColors[idx]} h-full rounded-full hover:opacity-80 transition-opacity`} style={{ width: `${(v.odometer / maxOdo) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
