import React, { useEffect, useState } from 'react';
import { Truck, Users, MapPin, Wrench, Clock, Activity, Percent } from 'lucide-react';
import { client } from '../api/client';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchKPIs = async () => {
    try {
      const data = await client.dashboard.getKPIs();
      setKpis(data);
    } catch (err) {
      toast.error('Failed to load dashboard KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
    // Listen for events that change data
    window.addEventListener('data-changed', fetchKPIs);
    return () => {
      window.removeEventListener('data-changed', fetchKPIs);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    { name: 'Active Vehicles', value: kpis.active_vehicles, icon: Truck, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { name: 'Available Vehicles', value: kpis.available_vehicles, icon: Truck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'In Maintenance', value: kpis.vehicles_in_maintenance, icon: Wrench, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { name: 'Active Trips', value: kpis.active_trips, icon: MapPin, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { name: 'Pending Trips (Draft)', value: kpis.pending_trips, icon: Clock, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    { name: 'Drivers on Duty', value: kpis.drivers_on_duty, icon: Users, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 m-0">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Real-time metrics and operations status overview.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-zinc-700 transition-all group">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.name}</p>
                <h3 className="text-3xl font-bold text-zinc-100 mt-2 group-hover:scale-105 transition-transform duration-200">{card.value}</h3>
              </div>
              <div className={`p-4 rounded-xl border ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Fleet Utilization Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg max-w-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">Fleet Utilization</h3>
            <p className="text-xs text-zinc-500">Percentage of active vehicles relative to total operational fleet.</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm font-semibold text-zinc-300">
            <span>Utilization Rate</span>
            <span>{kpis.fleet_utilization_pct}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="bg-gradient-to-r from-violet-600 to-fuchsia-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
              style={{ width: `${kpis.fleet_utilization_pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
