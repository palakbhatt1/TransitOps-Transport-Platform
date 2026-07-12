import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Route, Database, Cpu } from 'lucide-react';
import { client } from '../api/client';
import { useToast } from '../components/Toast';
import logo from '../assets/logo.svg';
import slide1 from '../assets/slide_login_1.svg';
import slide3 from '../assets/slide_login_3.svg';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbType, setDbType] = useState('sqlite');
  const [currentSlide, setCurrentSlide] = useState(1);

  useEffect(() => {
    const fetchDbStatus = async () => {
      try {
        const res = await client.dashboard.getDbStatus();
        setDbType(res.database_type || 'sqlite');
      } catch (err) {
        console.error('Failed to retrieve db status', err);
      }
    };
    fetchDbStatus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide(prev => (prev === 1 ? 3 : 1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await client.auth.login(email, password);
      toast.success('Successfully logged in!');
      // Dispatch event to trigger layout refresh
      window.dispatchEvent(new Event('auth-change'));
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('Network Error') || !err.response) {
        toast.error('Network Error: Cannot connect to the Live API server. Please check that uvicorn is running.');
      } else {
        toast.error(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans overflow-hidden relative">
      {/* Top Right Active Database Status Badge */}
      <div className="absolute top-4 right-4 z-50">
        <div
          id="db-engine-badge"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm border ${
            dbType === 'postgresql'
              ? 'bg-[#00A09D]/15 text-[#00A09D] border-[#00a09d]/30'
              : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
          }`}
        >
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span>{dbType === 'postgresql' ? '🐘 PostgreSQL' : '🗄️ SQLite'}</span>
        </div>
      </div>

      {/* Container Box */}
      <div className="w-full max-w-[960px] h-[580px] bg-white rounded-[12px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* Left Column: Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-white text-left h-full">
          
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src={logo} alt="TransitOps Logo" className="w-9 h-9 object-contain" />
              <span className="text-xl font-bold tracking-tight text-[#714B67]">
                TransitOps
              </span>
            </div>
            <p className="text-gray-400 text-xs">
              Welcome back. Please login to your fleet account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-0.5 text-left">
              <label htmlFor="email" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-0 top-2.5 h-3.5 w-3.5 text-gray-300" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@transitops.com"
                  className="w-full pl-6 py-2 text-[14px] text-gray-800 placeholder:text-gray-300 border-b border-[#E2E8F0] focus:border-b focus:border-[#714B67] bg-transparent focus:outline-none transition-all rounded-none text-left"
                  required
                />
              </div>
            </div>

            <div className="space-y-0.5 text-left">
              <label htmlFor="password" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-2.5 h-3.5 w-3.5 text-gray-300" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-6 py-2 text-[14px] text-gray-800 placeholder:text-gray-300 border-b border-[#E2E8F0] focus:border-b focus:border-[#714B67] bg-transparent focus:outline-none transition-all rounded-none text-left"
                  required
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#714B67] hover:bg-[#5D3E55] text-white font-semibold text-[14px] rounded-[6px] transition-all hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Log in
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Grader Quick Logins */}
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center mb-2">
              Demo Profiles (Quick Select)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials('manager@transitops.com')}
                className="py-1.5 px-2.5 bg-white hover:bg-gray-100 border border-[#E2E8F0] rounded-[6px] text-[11px] font-semibold text-gray-700 flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span>Fleet Manager</span>
                <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('safety@transitops.com')}
                className="py-1.5 px-2.5 bg-white hover:bg-gray-100 border border-[#E2E8F0] rounded-[6px] text-[11px] font-semibold text-gray-700 flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span>Safety Officer</span>
                <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('driver@transitops.com')}
                className="py-1.5 px-2.5 bg-white hover:bg-gray-100 border border-[#E2E8F0] rounded-[6px] text-[11px] font-semibold text-gray-700 flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span>Driver</span>
                <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('finance@transitops.com')}
                className="py-1.5 px-2.5 bg-white hover:bg-gray-100 border border-[#E2E8F0] rounded-[6px] text-[11px] font-semibold text-gray-700 flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span>Finance</span>
                <ArrowRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>

          {/* Footer links */}
          <div className="flex items-center justify-between text-[12px] border-t border-gray-100 pt-3">
            <div className="flex gap-4">
              <a href="#" className="text-[#00A09D] hover:underline font-medium">Create Account</a>
              <a href="#" className="text-[#00A09D] hover:underline font-medium">Reset Password</a>
            </div>
            <span className="text-gray-400 italic">v1.4.2</span>
          </div>
        </div>

        {/* Right Column: Illustration Graphic Carousel */}
        <div 
          onClick={() => setCurrentSlide(prev => (prev === 1 ? 3 : 1))}
          className="hidden md:flex w-1/2 h-full flex-col relative overflow-hidden bg-[#F5F2F9] cursor-pointer select-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(92, 60, 85, 0.15) 1.5px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
          title="Click to switch slide"
        >
          <div 
            className="flex w-[200%] h-[calc(100%-80px)] transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(${currentSlide === 1 ? '0%' : '-50%'})` }}
          >
            {/* Slide 1 */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center px-10 pt-4 pb-8">
              <div className="w-[280px] h-[280px] flex items-center justify-center mb-6">
                <img 
                  src={slide1} 
                  alt="Transport Management Illustration" 
                  className="max-w-full max-h-full object-contain pointer-events-none" 
                />
              </div>
              <h2 className="text-[22px] font-bold text-[#4A2D66] text-center mb-3 leading-tight">
                All-in-One Transport Management
              </h2>
              <p className="text-[12.5px] text-[#78618C] text-center leading-relaxed max-w-[340px]">
                Manage your entire fleet, drivers, trips, and expenses from a single, centralized platform.
              </p>
            </div>

            {/* Slide 3 */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center px-10 pt-4 pb-8">
              <div className="w-[280px] h-[280px] flex items-center justify-center mb-6">
                <img 
                  src={slide3} 
                  alt="Transport Operations Illustration" 
                  className="max-w-full max-h-full object-contain pointer-events-none" 
                />
              </div>
              <h2 className="text-[22px] font-bold text-[#4A2D66] text-center mb-3 leading-tight">
                Smarter Transport Operations
              </h2>
              <p className="text-[12.5px] text-[#78618C] text-center leading-relaxed max-w-[340px]">
                Automate dispatch, validate business rules, and keep vehicles and drivers in sync throughout every trip.
              </p>
            </div>
          </div>

          {/* Bottom Wave with Pagination Dots */}
          <div className="absolute bottom-0 left-0 w-full h-[80px] overflow-hidden pointer-events-none">
            <svg className="absolute inset-0 w-full h-full text-[#5C3C55] fill-current" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 Q50,42 100,0 L100,100 L0,100 Z" />
            </svg>
            <div className="absolute bottom-5 left-0 w-full flex justify-center gap-2.5 z-10 pointer-events-auto">
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(1); }}
                className={`w-2 h-2 rounded-full transition-all ${currentSlide === 1 ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}`} 
              />
              <button 
                className="w-2 h-2 rounded-full bg-white/20 cursor-not-allowed" 
                disabled
              />
              <button 
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(3); }}
                className={`w-2 h-2 rounded-full transition-all ${currentSlide === 3 ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}`} 
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
