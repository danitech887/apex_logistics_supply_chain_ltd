import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PORTAL_CONFIG } from '../../config/portals';
import {
  Lock,
  Mail,
  Building2,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Users,
  Landmark,
  Smartphone,
  Shield,
  Sparkles,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loginAsDemoUser, demoUsers, loading, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('ApexSecure2026!');
  const [subdomain, setSubdomain] = useState('apex-hq');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Please enter your corporate email address.');
      return;
    }
    await login(email, password, subdomain);
  };

  const getDepartmentIcon = (portalId) => {
    switch (portalId) {
      case 'fleet':
        return Truck;
      case 'hr':
        return Users;
      case 'finance':
        return Landmark;
      case 'ess':
        return Smartphone;
      default:
        return ShieldCheck;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Corporate Strip */}
      <div className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Apex Enterprise Core v1.0
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Enterprise Logistics & Supply Chain Operations
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-full">
          <Shield className="w-3.5 h-3.5" />
          <span>Department Data Protection Active</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-10 my-auto">
        
        {/* Left Column: Official Logo, Company Intro & Security Integrity Statement */}
        <div className="w-full lg:w-1/2 max-w-xl space-y-6">
          {/* Official High-Resolution Logo */}
          <div className="bg-white/95 rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 w-fit backdrop-blur-sm">
            <img
              src="/src/assets/logo.png"
              alt="Apex Logistics & Supply Chain Ltd"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Dedicated Departmental Portal Access
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2.5 leading-relaxed">
              Secure enterprise operations platform for freight forwarding, supply chain dispatch,
              statutory payroll, and multi-currency general ledger accounting.
            </p>
          </div>

          {/* Strict Isolation Notice Card */}
          <div className="rounded-2xl bg-indigo-950/40 border border-indigo-800/50 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 shrink-0 border border-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Strict Role-Based Department Segregation
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  To safeguard statutory payroll calculations, driver transit manifests, and general ledger
                  records, each user is strictly restricted to their authorized department workspace.
                  Cross-department access is restricted to authorized personnel.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-900/60 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Department Isolation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidential Data Privacy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tamper-Proof Audit Trail</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Corporate Login Form & Instant Department Passes */}
        <div className="w-full lg:w-1/2 max-w-xl space-y-6">
          {/* Login Form Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                Sign In to Your Workspace
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials or select an authorized department pass below
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tenant Subdomain */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tenant Organization
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 absolute left-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="apex-hq"
                    required
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2.5 text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <span className="absolute right-3.5 text-xs text-slate-500 font-mono">
                    .apexlogistics
                  </span>
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. driver@apexlogistics.co.ke"
                    autoComplete="username"
                    required
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Secure Password
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-3.5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Authenticate & Access Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Department Role Access Section */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Quick-Access Department Profiles
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Click any profile to enter dedicated portal
              </span>
            </div>

            <div className="space-y-2.5">
              {demoUsers.map((staff) => {
                const IconComponent = getDepartmentIcon(staff.targetPortal);
                return (
                  <button
                    key={staff.id}
                    onClick={() => {
                      setEmail(staff.email);
                      loginAsDemoUser(staff.id);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition text-left group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold text-xs shrink-0 transition">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-bold text-white truncate">{staff.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {staff.staffNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {staff.department} • <span className="text-indigo-400 font-medium">{staff.portalTitle}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                        Open Portal
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Corporate Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
        <p>© 2026 Apex Logistics & Supply Chain Ltd. All rights reserved.</p>
        <p className="font-mono text-slate-400 mt-1 sm:mt-0">
          Nairobi HQ • Mombasa Port Branch • Eldoret ICD Hub
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
