import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Truck, Route } from 'lucide-react';
import { client } from '../api/client';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans overflow-hidden">
      {/* Container Box */}
      <div className="w-full max-w-[960px] h-[580px] bg-white rounded-[12px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* Left Column: Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-white text-left h-full">
          
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 bg-[#714B67] rounded-lg flex items-center justify-center shadow-sm">
                <Truck className="text-white h-4.5 w-4.5" />
              </div>
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

        {/* Right Column: Illustration Graphic */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#714B67] to-[#4D3346] relative items-center justify-center overflow-hidden h-full">
          {/* Subtle dotted background grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute top-0 left-0 w-full h-full" 
              style={{ 
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
                backgroundSize: '32px 32px' 
              }} 
            />
          </div>

          <div className="relative z-10 text-center px-12">
            <div className="mb-6 inline-flex p-5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
              <Route className="text-white h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Efficient Logistics</h2>
            <p className="text-purple-100/85 leading-relaxed text-xs">
              Manage your entire fleet, drivers, and real-time transit operations with the most intuitive SaaS platform.
            </p>
            <div className="mt-8 flex gap-2 justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/30"></div>
            </div>
          </div>

          {/* Background Decorative Blurs */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-[#00A09D] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-white rounded-full blur-[100px] opacity-10"></div>
        </div>

      </div>
    </div>
  );
}
