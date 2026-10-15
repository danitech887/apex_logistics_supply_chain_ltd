import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Lock,
  Mail,
  Building2,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  HelpCircle,
  Phone,
  X,
  Check,
  Building,
  Sparkles,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loading, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('apex-hq');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Please enter your corporate email address.');
      return;
    }
    if (!password.trim()) {
      setAuthError('Please enter your password.');
      return;
    }
    await login(email, password, subdomain);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    // Simulate immediate backend password reset challenge dispatch
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Corporate Strip */}
      <div className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Apex Enterprise Core
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Enterprise Logistics & Supply Chain Operations
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1 rounded-full">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>PostgreSQL Multi-Tenant Isolation Active</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row items-center justify-center gap-12 my-auto py-8">
        
        {/* Left Column: Official Brand & Enterprise Security Assurance */}
        <div className="w-full lg:w-1/2 max-w-lg space-y-6">
          {/* Official High-Resolution Logo */}
          <div className="bg-white/95 rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/20 w-fit backdrop-blur-sm">
            <img
              src="/src/assets/logo.png"
              alt="Apex Logistics & Supply Chain Ltd"
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Enterprise Operations & Logistics Portal
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              Sign in with your authorized corporate credentials. Access is strictly governed
              by role-based security policies (RBAC) and scoped to your departmental workspace.
            </p>
          </div>

          {/* Enterprise Compliance Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Multi-Schema Security</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Departmental schema isolation with PostgreSQL row-level isolation.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-1">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>E-TIMS & KeNHA Ready</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Statutory payroll, weighbridge axle certificates & KRA tax invoices.
              </p>
            </div>
          </div>

          {/* System Status Footnote */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium">
              Nairobi Central Hub • Mombasa Port Branch • Eldoret ICD Online
            </span>
          </div>
        </div>

        {/* Right Column: Clean, Production Corporate Login Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Form Header */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  Sign In to Your Workspace
                </h2>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  {subdomain}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your company login credentials to continue
              </p>
            </div>

            {/* Error Alert */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Corporate Login Form */}
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
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-24 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
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
                    placeholder="name@apexlogistics.co.ke"
                    autoComplete="username"
                    required
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSubmitted(false);
                      setShowForgotPasswordModal(true);
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 absolute left-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>Remember organization session</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Enterprise Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
              <span>Apex Enterprise Single Sign-On • Authorized Personnel Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Reset Corporate Password
                  </h3>
                  <p className="text-xs text-slate-400">
                    Self-Service Identity Recovery Desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-2xl flex items-start space-x-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm">
                      Password Reset Challenge Dispatched
                    </p>
                    <p className="text-emerald-300/90 leading-relaxed">
                      If <span className="font-mono font-bold text-white">{forgotEmail}</span> is registered in Apex Logistics HR & Security, a secure password challenge token and reset link have been issued.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">IT Support & Security Contact:</span>
                  <div>Direct line: +254 20 690 1000 • ext. 402 (IT Identity Desk)</div>
                  <div>Email: it.support@apexlogistics.co.ke</div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="mt-4 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your registered corporate email address. A cryptographic verification token will be dispatched to verify your identity.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. j.omondi@apexlogistics.co.ke"
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Dispatch Reset Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
