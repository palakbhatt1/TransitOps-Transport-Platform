import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  Wrench, 
  Coins, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut,
  Search,
  User,
  Database,
  Cpu
} from 'lucide-react';
import { client } from '../api/client';
import { Role } from '../api/contracts';
import { useToast } from '../components/Toast';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [isMock, setIsMock] = useState(client.isMock());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const syncUser = () => {
    const user = client.auth.getCurrentUser();
    if (!user) {
      navigate('/login');
    } else {
      setCurrentUser(user);
    }
  };

  useEffect(() => {
    syncUser();
    // Listen for auth/role changes from sibling pages
    window.addEventListener('auth-change', syncUser);
    return () => {
      window.removeEventListener('auth-change', syncUser);
    };
  }, [navigate]);

  const handleRoleChange = (newRole) => {
    client.auth.setCurrentRole(newRole);
    const updated = client.auth.getCurrentUser();
    setCurrentUser(updated);
    toast.info(`Switched active view to: ${newRole.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`);
    window.dispatchEvent(new Event('auth-change'));
  };

  const handleToggleMock = () => {
    const newVal = !isMock;
    client.setMock(newVal);
    setIsMock(newVal);
    toast.success(newVal ? "Switched to Local Mock mode" : "Switched to Live Backend API mode");
    // Small timeout to allow toast to render before reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleLogout = () => {
    client.auth.logout();
    toast.success("Successfully logged out");
    navigate('/login');
  };

  if (!currentUser) return null;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Fleet', path: '/vehicles', icon: Truck },
    { name: 'Drivers', path: '/drivers', icon: Users },
    { name: 'Trips', path: '/trips', icon: MapPin },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', path: '/expenses', icon: Coins, disabled: true },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, disabled: true },
    { name: 'Settings', path: '/settings', icon: SettingsIcon, disabled: true },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/20">
            TO
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            TransitOps
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8 relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search vehicles, drivers, logs..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Mock/Live Toggle */}
          <button
            onClick={handleToggleMock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isMock 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/30'
            }`}
          >
            {isMock ? <Database className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5" />}
            {isMock ? 'Mock Data' : 'Live API'}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium hidden sm:inline">Active View:</span>
            <select
              value={currentUser.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value={Role.FLEET_MANAGER}>Fleet Manager</option>
              <option value={Role.SAFETY_OFFICER}>Safety Officer</option>
              <option value={Role.DRIVER}>Driver</option>
              <option value={Role.FINANCIAL_ANALYST}>Financial Analyst</option>
            </select>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-zinc-500 transition-colors"
            >
              <User className="h-4 w-4 text-zinc-300" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500">Logged in as</p>
                    <p className="text-sm font-semibold text-zinc-200 truncate">{currentUser.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Horizontal Nav Bar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/60 px-6 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.disabled ? '#' : item.path}
              onClick={(e) => item.disabled && e.preventDefault()}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all ${
                item.disabled
                  ? 'text-zinc-600 cursor-not-allowed opacity-40'
                  : isActive
                  ? 'border-violet-500 text-white bg-zinc-900/30'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
