import React, { useState, useEffect } from 'react';
import { List, LayoutGrid, BarChart2, Download } from 'lucide-react';
import { client } from '../api/client';
import DataTable from '../components/DataTable';

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
  const [efficiency, setEfficiency] = useState([]);
  const [roi, setRoi] = useState([]);
  const [finance, setFinance] = useState({ fuel_logs: [], expenses: [] });
  const [activeView, setActiveView] = useState('graph');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [v, t, m, eff, roiData, fin] = await Promise.all([
        client.vehicles.getAll(),
        client.trips.getAll(),
        client.maintenance.getAll(),
        client.reports.getEfficiency(),
        client.reports.getRoi(),
        client.finance.getLogs()
      ]);
      setVehicles(v || []);
      setTrips(t || []);
      setMaintenance(m || []);
      setEfficiency(eff || []);
      setRoi(roiData || []);
      setFinance(fin || { fuel_logs: [], expenses: [] });
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('data-changed', loadData);
    return () => window.removeEventListener('data-changed', loadData);
  }, []);

  const handleExport = () => {
    const exportUrl = client.reports.getExportCsvUrl();
    window.open(exportUrl, '_blank');
  };

  // KPIs
  const fleetUtilPct = vehicles.length ? Math.round((vehicles.filter(v => v.status !== 'available').length / vehicles.length) * 100) : 0;
  
  const totalMaintCost = maintenance.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);
  const totalFuelCost = (finance.fuel_logs || []).reduce((sum, f) => sum + (parseFloat(f.cost) || 0), 0);
  const totalOtherCost = (finance.expenses || []).reduce((sum, e) => sum + (parseFloat(e.cost) || 0), 0);
  const totalOpsCost = totalMaintCost + totalFuelCost + totalOtherCost;

  const validEfficiencies = efficiency.filter(e => e.efficiency_km_l > 0);
  const avgEfficiency = validEfficiencies.length 
    ? (validEfficiencies.reduce((sum, e) => sum + e.efficiency_km_l, 0) / validEfficiencies.length).toFixed(2)
    : '8.5';

  const avgRoi = roi.length
    ? (roi.reduce((sum, r) => sum + r.roi_pct, 0) / roi.length).toFixed(1)
    : '0.0';

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

  const analyticsColumns = [
    { header: 'Vehicle ID', accessor: (row) => row.vehicle_id },
    { header: 'Registration', accessor: (row) => row.registration_number },
    { header: 'Model', accessor: (row) => row.model },
    { header: 'Fuel Efficiency', accessor: (row) => {
        const effItem = efficiency.find(e => e.vehicle_id === row.vehicle_id);
        return effItem && effItem.efficiency_km_l > 0 ? `${effItem.efficiency_km_l} km/L` : '—';
      }
    },
    { header: 'Estimated Revenue', accessor: (row) => {
        const roiItem = roi.find(r => r.vehicle_id === row.vehicle_id);
        return roiItem ? `$${roiItem.total_revenue.toLocaleString()}` : '$0';
      }
    },
    { header: 'Total Expenses', accessor: (row) => {
        const roiItem = roi.find(r => r.vehicle_id === row.vehicle_id);
        return roiItem ? `$${roiItem.total_expenses.toLocaleString()}` : '$0';
      }
    },
    { header: 'ROI %', accessor: (row) => {
        const roiItem = roi.find(r => r.vehicle_id === row.vehicle_id);
        if (!roiItem) return '0%';
        const isNeg = roiItem.roi_pct < 0;
        return <span className={`font-bold ${isNeg ? 'text-red-500' : 'text-green-500'}`}>{roiItem.roi_pct}%</span>;
      },
      sortable: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 m-0">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Fleet intelligence, fuel economy profiles and ROI tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200 rounded-[6px]">
            {[{ icon: <BarChart2 className="h-4 w-4" />, key: 'graph' }, { icon: <List className="h-4 w-4" />, key: 'list' }].map(btn => (
              <button 
                key={btn.key} 
                onClick={() => setActiveView(btn.key)} 
                className={`p-1.5 rounded-[4px] transition-all ${activeView === btn.key ? 'bg-white text-[#714B67] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {btn.icon}
              </button>
            ))}
          </div>
          <button 
            id="export-data-btn" 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-[#714B67] text-[#714B67] text-sm font-semibold hover:bg-purple-50 transition-colors shadow-sm bg-white"
          >
            <Download className="h-4 w-4" />Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard icon="⛽" label="Avg Fuel Efficiency" value={`${avgEfficiency} km/L`} badge="Live Economy" badgeColor="text-blue-600" />
        <KPICard icon="🚛" label="Fleet Utilization" value={`${fleetUtilPct}%`} badge="Operational" badgeColor="text-green-600" />
        <KPICard icon="💵" label="Total Operational Cost" value={`$${totalOpsCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}`} badge="Combined" badgeColor="text-purple-600" />
        <KPICard icon="📈" label="Avg Vehicle ROI" value={`${avgRoi}%`} badge="Aggregated" badgeColor={parseFloat(avgRoi) < 0 ? "text-red-500" : "text-green-600"} />
      </div>

      {activeView === 'graph' ? (
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
                    <div className="bg-[#714B67] w-1/2 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer animate-in slide-in-from-bottom duration-500" style={{ height: `${(d.trips / 100) * 180}px` }} />
                    <div className="bg-[#00A09D] w-1/2 rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer animate-in slide-in-from-bottom duration-700" style={{ height: `${(d.services / 100) * 180}px` }} />
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
                const barColors = ['bg-[#714B67]', 'bg-[#00A09D]', 'bg-amber-500', 'bg-red-400', 'bg-indigo-400'];
                return (
                  <div key={v.id} className="space-y-1.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-700 font-medium">{v.registration_number} {v.model}</span>
                      <span className="font-bold text-gray-800">{v.odometer.toLocaleString()} km</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`${barColors[idx]} h-full rounded-full hover:opacity-80 transition-all duration-500`} style={{ width: `${(v.odometer / maxOdo) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[6px] shadow-sm border border-[#E2E8F0] p-4">
          <h3 className="text-[15px] font-bold text-gray-800 mb-4 px-2">Operational ROI Matrix</h3>
          <DataTable 
            columns={analyticsColumns} 
            data={roi} 
            searchKey="registration_number" 
            searchPlaceholder="Search matrix by registration..." 
          />
        </div>
      )}
    </div>
  );
}
