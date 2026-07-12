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
import logo from '../assets/logo.svg';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [dbType, setDbType] = useState('sqlite');
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
    window.addEventListener('auth-change', syncUser);
    
    const fetchDbStatus = async () => {
      try {
        const res = await client.dashboard.getDbStatus();
        setDbType(res.database_type || 'sqlite');
      } catch (err) {
        console.error('Failed to retrieve db status', err);
      }
    };
    fetchDbStatus();

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
    { name: 'Fuel & Expenses', path: '/expenses', icon: Coins },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 bg-[#714B67] text-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="TransitOps Logo" className="w-9 h-9 object-contain" />
          <span className="font-bold text-xl tracking-tight text-white">
            TransitOps
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8 relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search vehicles, drivers, logs..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 text-white placeholder-white/50 border border-white/15 rounded-xl text-sm focus:outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 transition-all"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {/* Database Dialect Badge */}
          <div
            id="db-engine-badge"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold shadow-sm border ${
              dbType === 'postgresql'
                ? 'bg-[#00A09D]/15 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/25'
            }`}
          >
            <Database className="h-3.5 w-3.5 shrink-0" />
            <span>{dbType === 'postgresql' ? '🐘 PostgreSQL DB' : '🗄️ SQLite DB'}</span>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/80 font-medium hidden sm:inline">Active View:</span>
            <select
              value={currentUser.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-[#5d3853] border border-white/20 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/40 cursor-pointer"
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
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <User className="h-4 w-4 text-white" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-gray-800">
                  <div className="px-4 py-2 border-b border-[#E2E8F0]">
                    <p className="text-xs text-gray-400">Logged in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.name}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-gray-500" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1 flex-row h-[calc(100vh-4rem)] overflow-hidden">
        {/* Left Side Navbar */}
        <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0">
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.disabled ? '#' : item.path}
                  onClick={(e) => item.disabled && e.preventDefault()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${
                    item.disabled
                      ? 'text-gray-300 cursor-not-allowed opacity-50'
                      : isActive
                      ? 'bg-[#714B67]/10 text-[#714B67] border-l-4 border-[#714B67] pl-2.5 font-semibold'
                      : 'text-gray-600 hover:text-[#714B67] hover:bg-gray-50 border-l-4 border-transparent pl-2.5'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#714B67]' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto bg-[#F0F2F5] text-gray-800">
          {children}
        </main>
      </div>
    </div>
  );
}
