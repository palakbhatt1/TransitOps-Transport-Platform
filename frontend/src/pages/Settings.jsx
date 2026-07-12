import React, { useState } from 'react';
import { User, CreditCard, Bell, ShieldCheck, Users, Blocks, Key, FileText, Zap } from 'lucide-react';

const SIDEBAR = [
  { group: 'General', items: [{ key: 'account', label: 'Account', icon: User }, { key: 'billing', label: 'Billing', icon: CreditCard }, { key: 'notifications', label: 'Notifications', icon: Bell }, { key: 'security', label: 'Security', icon: ShieldCheck }] },
  { group: 'Workspace', items: [{ key: 'team', label: 'Team', icon: Users }, { key: 'integrations', label: 'Integrations', icon: Blocks }, { key: 'api', label: 'API Keys', icon: Key }, { key: 'logs', label: 'Logs', icon: FileText }] }
];

const OdooInput = ({ label, ...props }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
    <input {...props} className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full" />
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-[#714B67] transition-colors relative">
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </div>
  </label>
);

export default function Settings() {
  const [activeSection, setActiveSection] = useState('account');
  const [prefs, setPrefs] = useState({ backup: true, twoFactor: false, highVis: true });

  return (
    <div className="flex h-full -m-6 md:-m-8 overflow-hidden" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Settings Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] overflow-y-auto shrink-0">
        <div className="py-4">
          {SIDEBAR.map(group => (
            <div key={group.group}>
              <div className="px-6 py-2 mb-1 mt-4 first:mt-2">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{group.group}</h3>
              </div>
              <nav className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  return (
                    <button
                      key={item.key}
                      id={`side-${item.key}-link`}
                      onClick={() => setActiveSection(item.key)}
                      className={`flex items-center gap-3 w-full text-left px-6 py-2.5 text-[14px] transition-colors ${isActive ? 'bg-[#F1F5F9] text-[#714B67] font-semibold border-l-[3px] border-[#714B67] pl-[21px]' : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent pl-[21px]'}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>

      {/* Settings Content */}
      <section className="flex-1 overflow-y-auto bg-[#F8F9FA] p-10">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Plan Banner */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#714B67]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Enterprise Plan</h3>
                <p className="text-sm text-gray-500">Next renewal: Dec 12, 2025 (Annual Billing)</p>
              </div>
            </div>
            <button id="upgrade-plan-btn" className="bg-[#714B67] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#5D3E55] transition-colors shadow-sm">Upgrade Plan</button>
          </div>

          {/* Account Details Form */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#714B67]">Account Details</h2>
              <div className="flex gap-3">
                <button id="save-account-btn" className="bg-[#714B67] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">Save</button>
                <button id="cancel-account-btn" className="bg-white border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
                <OdooInput label="Company Name" type="text" defaultValue="TransitOps Global Logistics" />
                <OdooInput label="Email Address" type="email" defaultValue="admin@transitops.com" />
                <OdooInput label="Phone Number" type="text" defaultValue="+1 (555) 012-3456" />
                <OdooInput label="Street Address" type="text" defaultValue="404 Fleet Avenue, Suite 100" />
                <OdooInput label="City" type="text" defaultValue="Austin" />
                <OdooInput label="State / Province" type="text" defaultValue="TX" />
                <OdooInput label="Zip Code" type="text" defaultValue="78701" />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Country</label>
                  <select className="border-0 border-b border-gray-200 bg-transparent py-2 text-[14px] text-gray-800 focus:outline-none focus:border-[#714B67] focus:border-b-2 transition-all w-full appearance-none">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                  </select>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="pt-8 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-6">Account Preferences</h4>
                <div className="space-y-6">
                  {[
                    { key: 'backup', title: 'Automatic Data Backup', desc: 'Sync data to cloud storage every 24 hours' },
                    { key: 'twoFactor', title: 'Two-Factor Authentication', desc: 'Require security code on every login' },
                    { key: 'highVis', title: 'High-Visibility Maps', desc: 'Use high-contrast satellite view by default' }
                  ].map(pref => (
                    <div key={pref.key} className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-medium text-gray-800">{pref.title}</div>
                        <div className="text-[12px] text-gray-500">{pref.desc}</div>
                      </div>
                      <Toggle checked={prefs[pref.key]} onChange={() => setPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
