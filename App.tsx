import React, { useState, useEffect, useCallback } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { UserRole, UserStatus, Transaction, Loan, SessionInfo, User } from './types';
import { Layout, NavSection } from './components/Layout';
import { PersonalDashboard } from './components/Dashboard/PersonalDashboard';
import { BusinessDashboard } from './components/Dashboard/BusinessDashboard';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { SecurityCentreView, NotificationsView, SupportView } from './components/Dashboard/BankingPages';
import {
  TransferModal,
  LoanModal,
  TransactionDetailModal,
  PremiumUpgradeModal,
  RecurringPaymentModal,
  SettingsModal,
  UserProfileDetailModal,
  Modal
} from './components/Modals';
import { BrandLogo } from './components/BrandLogo';
import { FaceIdModal } from './components/FaceIdModal';
import { useToast } from './components/Toast';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  HelpCircle,
  Building2,
  Landmark,
  CheckCircle2,
  ScanFace,
  KeyRound,
  AlertCircle
} from 'lucide-react';

type LoginInfoTab = 'PERSONAL' | 'BUSINESS' | 'SECURITY' | 'SUPPORT';

const HASH_TO_NAV: Record<string, NavSection> = {
  '#dashboard': 'DASHBOARD',
  '#account-overview': 'ACCOUNT_OVERVIEW',
  '#transactions': 'TRANSACTIONS',
  '#statements': 'STATEMENTS',
  '#payments': 'PAYMENTS',
  '#beneficiaries': 'BENEFICIARIES',
  '#security': 'SECURITY',
  '#notifications': 'NOTIFICATIONS',
  '#support': 'SUPPORT',
  '#profile': 'PROFILE',
  '#clients': 'CLIENTS',
  '#accounts': 'ACCOUNTS'
};

const NAV_TO_HASH: Record<NavSection, string> = {
  DASHBOARD: '#dashboard',
  ACCOUNT_OVERVIEW: '#account-overview',
  TRANSACTIONS: '#transactions',
  STATEMENTS: '#statements',
  PAYMENTS: '#payments',
  BENEFICIARIES: '#beneficiaries',
  SECURITY: '#security',
  NOTIFICATIONS: '#notifications',
  SUPPORT: '#support',
  PROFILE: '#profile',
  CLIENTS: '#clients',
  ACCOUNTS: '#accounts'
};

const LOGIN_SHOWCASE_TABS: Record<
  LoginInfoTab,
  {
    heading: string;
    description: string;
    points: string[];
  }
> = {
  PERSONAL: {
    heading: 'Everyday personal banking built for clarity and control',
    description:
      'Review balances, inspect itemized statements, manage beneficiaries, and monitor account security alerts in one structured workspace.',
    points: [
      'Real-time account status visibility and transaction inspection',
      'Downloadable statement summaries and search-enabled activity logs',
      'Instant lock protections and dedicated verification support desk'
    ]
  },
  BUSINESS: {
    heading: 'Commercial treasury and cash management',
    description:
      'Oversee operating, reserve, and payroll sub-accounts with clear liquidity visibility and controlled authorization rules.',
    points: [
      'Dedicated operating, payroll reserve, and tax savings sub-accounts',
      'Weekly cash-movement analytics and payroll allocation tracking',
      'Role-scoped administrative oversight and audit-ready summaries'
    ]
  },
  SECURITY: {
    heading: 'Layered authentication and session protection',
    description:
      'Access is protected by server-verified credentials, hashed passcodes, time-limited sessions, and strict account lock enforcement.',
    points: [
      'Server-side scrypt password hashing and in-memory Bearer sessions',
      'Automatic session expiration and explicit device sign-out controls',
      'Optional camera-based Face ID simulation with local-only processing'
    ]
  },
  SUPPORT: {
    heading: 'Dedicated client assistance and verification desk',
    description:
      'Need help recovering account access, reviewing a temporary security hold, or updating profile records?',
    points: [
      'Account verification guidance for high-value deposit reviews',
      'Non-enumerating password recovery support channel',
      'Structured support ticket intake inside your signed-in workspace'
    ]
  }
};

const LoginPage: React.FC = () => {
  const { dispatch } = useBank();
  const [username, setUsername] = useState(() => localStorage.getItem('usd_bmu_remembered_user') || '');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(() => Boolean(localStorage.getItem('usd_bmu_remembered_user')));
  const [showPassword, setShowPassword] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<LoginInfoTab>('PERSONAL');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // First-run security setup state (used only when server env passcodes are unset)
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);
  const [setupPasscode, setSetupPasscode] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Forgot password & Face ID modals
  const [isForgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotResult, setForgotResult] = useState<string | null>(null);
  const [isFaceIdOpen, setFaceIdOpen] = useState(false);

  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (window.location.hash !== '#login') {
      window.location.hash = '#login';
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/bootstrap-status')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        setIsInitialized(Boolean(data.initialized));
        setBootstrapChecked(true);
      })
      .catch(() => {
        if (!mounted) return;
        setBootstrapChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const completeSignIn = useCallback(
    (payload: { user: User; session: SessionInfo; directory?: User[] }) => {
      if (rememberId) {
        localStorage.setItem('usd_bmu_remembered_user', payload.user.username);
      } else {
        localStorage.removeItem('usd_bmu_remembered_user');
      }
      dispatch({ type: 'LOGIN', payload });
      window.location.hash = '#dashboard';
      showToast(`Signed in as ${payload.user.name}`, 'success');
    },
    [dispatch, rememberId, showToast]
  );

  const handleBootstrapSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (setupPasscode.length < 8) {
      setAuthError('Please choose a passcode of at least 8 characters.');
      return;
    }
    if (setupPasscode !== setupConfirm) {
      setAuthError('Passcode and confirmation do not match.');
      return;
    }

    setSetupLoading(true);
    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: setupPasscode })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Could not initialize credentials.');
      } else {
        setIsInitialized(true);
        setSetupPasscode('');
        setSetupConfirm('');
        showToast('Security credentials initialized. You may now sign in.', 'success');
      }
    } catch {
      setAuthError('Unable to reach authentication server.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          rememberMe: rememberId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Invalid credentials. Please verify your username and password.';
        setAuthError(msg);
        showToast(msg, 'error');
      } else {
        completeSignIn({ user: data.user, session: data.session, directory: data.directory });
      }
    } catch {
      setAuthError('Unable to connect to authentication service.');
      showToast('Authentication service unavailable.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier })
      });
      const data = await res.json();
      setForgotResult(
        data.message ||
          'If an enrolled UsDigital-BMU profile matches your entry, recovery instructions have been queued.'
      );
    } catch {
      setForgotResult('Unable to process request at this time.');
    }
  };

  const activeShowcase = LOGIN_SHOWCASE_TABS[activeInfoTab];

  return (
    <div className="min-h-screen bg-[#F2F6FB] text-[#2A4158] flex flex-col">
      {ToastContainer}

      {/* Top Navigation Bar (3-zone institutional contract) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <BrandLogo variant="light" size="md" />

          <nav className="hidden md:flex items-center gap-6">
            {(['PERSONAL', 'BUSINESS', 'SECURITY', 'SUPPORT'] as LoginInfoTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveInfoTab(tab)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                  activeInfoTab === tab
                    ? 'text-[#1C3D5A] border-[#E31B23] font-semibold'
                    : 'text-slate-600 border-transparent hover:text-[#1C3D5A]'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setActiveInfoTab('SUPPORT')}
            className="bg-[#2B629B] hover:bg-[#235282] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            Client Support
          </button>
        </div>
      </header>

      {/* Main Split Sign-In Layout */}
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Secure Sign-In Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#E31B23] uppercase tracking-wider">Online Banking</p>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#1C3D5A] mt-1">
                  Sign in to UsDigital-<span className="text-[#E31B23]">BMU</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1.5">
                  Access your personal or commercial banking workspace securely.
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                  <AlertCircle size={15} className="text-[#E31B23] shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {bootstrapChecked && !isInitialized ? (
                <form onSubmit={handleBootstrapSetup} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#F2F6FB] border border-slate-200 text-xs text-[#2A4158] space-y-1">
                    <p className="font-bold text-[#1C3D5A] flex items-center gap-1.5">
                      <KeyRound size={14} className="text-[#E31B23]" />
                      <span>First-Run Credential Setup</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Environment passcodes are not configured yet. Choose a passcode (min 8 characters) to initialize server-side hashed credentials for this preview session.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="setup-passcode" className="text-xs font-semibold text-[#2A4158] block mb-1">
                      Choose Initial Passcode
                    </label>
                    <input
                      id="setup-passcode"
                      type="password"
                      required
                      minLength={8}
                      value={setupPasscode}
                      onChange={e => setSetupPasscode(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#1C3D5A] focus:border-[#2B629B] outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="setup-confirm" className="text-xs font-semibold text-[#2A4158] block mb-1">
                      Confirm Passcode
                    </label>
                    <input
                      id="setup-confirm"
                      type="password"
                      required
                      minLength={8}
                      value={setupConfirm}
                      onChange={e => setSetupConfirm(e.target.value)}
                      placeholder="Re-enter passcode"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#1C3D5A] focus:border-[#2B629B] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={setupLoading}
                    className="w-full bg-[#2B629B] hover:bg-[#235282] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
                  >
                    {setupLoading ? 'Initializing...' : 'Initialize Secure Access'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="login-userid" className="text-xs font-semibold text-[#2A4158] block">
                      Username or Email
                    </label>
                    <input
                      id="login-userid"
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#1C3D5A] focus:border-[#2B629B] focus:ring-2 focus:ring-[#2B629B]/15 outline-none transition-all"
                      placeholder="Enter username or email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="text-xs font-semibold text-[#2A4158] block">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 pr-11 text-sm text-[#1C3D5A] focus:border-[#2B629B] focus:ring-2 focus:ring-[#2B629B]/15 outline-none transition-all"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1C3D5A] p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberId}
                        onChange={e => setRememberId(e.target.checked)}
                        className="rounded border-slate-300 text-[#1C3D5A] focus:ring-[#2B629B]"
                      />
                      <span>Remember username</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setForgotResult(null);
                        setForgotIdentifier(username);
                        setForgotOpen(true);
                      }}
                      className="text-xs font-semibold text-[#2B629B] hover:text-[#E31B23] hover:underline flex items-center gap-1"
                    >
                      <HelpCircle size={13} />
                      <span>Forgot password?</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2B629B] hover:bg-[#235282] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                    {!loading && <ArrowRight size={17} />}
                  </button>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px] uppercase">
                      <span className="bg-white px-2.5 text-slate-400 font-semibold">Biometric Option</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFaceIdOpen(true)}
                    className="w-full bg-white hover:bg-[#F2F6FB] border border-slate-300 text-[#1C3D5A] font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    <ScanFace size={17} className="text-[#E31B23]" />
                    <span>Login with Face ID (Prototype)</span>
                  </button>
                </form>
              )}

              <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="text-[#16865B]" />
                  <span>Protected Session Access</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">DEMO ENVIRONMENT</span>
              </div>
            </div>
          </div>

          {/* Right: Institutional Digital Banking Showcase */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-wrap gap-2 mb-5 md:hidden">
                {(['PERSONAL', 'BUSINESS', 'SECURITY', 'SUPPORT'] as LoginInfoTab[]).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveInfoTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      activeInfoTab === tab ? 'bg-[#2B629B] text-white' : 'bg-[#F2F6FB] text-slate-600'
                    }`}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 space-y-4">
                  <p className="text-xs font-semibold text-[#E31B23] uppercase tracking-wider">
                    UsDigital-BMU Retail Platform
                  </p>
                  <h2 className="text-2xl font-display font-bold text-[#1C3D5A] leading-snug">
                    {activeShowcase.heading}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{activeShowcase.description}</p>

                  <ul className="space-y-2.5 pt-1">
                    {activeShowcase.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#2A4158]">
                        <CheckCircle2 size={16} className="text-[#16865B] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Institutional Banking Preview Card */}
                <div className="md:col-span-5">
                  <div className="bank-card-navy rounded-2xl p-5 text-white space-y-5">
                    <div className="flex items-center justify-between">
                      <BrandLogo variant="dark" size="sm" />
                      <Landmark size={18} className="text-blue-100" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-blue-100 uppercase tracking-wider">Account Security</p>
                      <p className="text-base font-display font-bold">Zero-Trust Isolation</p>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 text-[#1C3D5A] flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">Session</span>
                      <span className="text-xs font-bold text-[#16865B] flex items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>Server-Verified</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <Landmark size={16} className="text-[#1C3D5A] mb-2" />
                <p className="font-semibold text-[#1C3D5A]">Personal Banking</p>
                <p className="text-slate-500 mt-0.5">Checking balances, statements & support</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <Building2 size={16} className="text-[#1C3D5A] mb-2" />
                <p className="font-semibold text-[#1C3D5A]">Commercial Treasury</p>
                <p className="text-slate-500 mt-0.5">Operating & reserve sub-accounts</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <ShieldCheck size={16} className="text-[#E31B23] mb-2" />
                <p className="font-semibold text-[#1C3D5A]">Security Centre</p>
                <p className="text-slate-500 mt-0.5">Hold protection & biometric simulation</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>UsDigital-BMU · Retail & Commercial Digital Banking Prototype</p>
          <p>Demonstration interface — sample records are clearly marked DEMO</p>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <Modal title="Password Recovery" isOpen={isForgotOpen} onClose={() => setForgotOpen(false)}>
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your enrolled username or email address. If a matching profile exists, recovery instructions will be queued through your support channel.
          </p>
          <div>
            <label className="text-xs font-semibold text-[#2A4158] block mb-1">Username or Email</label>
            <input
              type="text"
              required
              value={forgotIdentifier}
              onChange={e => setForgotIdentifier(e.target.value)}
              placeholder="Enter username or email"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#2B629B]"
            />
          </div>
          {forgotResult && (
            <div className="p-3 rounded-xl bg-[#F2F6FB] border border-slate-200 text-xs text-[#1C3D5A]">
              {forgotResult}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-[#2B629B] hover:bg-[#235282] text-white font-semibold py-2.5 rounded-xl text-sm"
          >
            Request Recovery Assistance
          </button>
        </form>
      </Modal>

      {/* Camera Biometric Face ID Simulation Modal */}
      <FaceIdModal
        isOpen={isFaceIdOpen}
        onClose={() => setFaceIdOpen(false)}
        defaultUsername={username}
        onAuthenticated={payload => completeSignIn(payload)}
      />
    </div>
  );
};

const MainApp: React.FC = () => {
  const { state, dispatch } = useBank();
  const { showToast, ToastContainer } = useToast();
  const [activeNav, setActiveNav] = useState<NavSection>('DASHBOARD');
  const [transferRecipient, setTransferRecipient] = useState<{ name: string; avatar?: string } | null>(null);
  const [isTransferOpen, setTransferOpen] = useState(false);
  const [isLoanOpen, setLoanOpen] = useState(false);
  const [isUpgradeOpen, setUpgradeOpen] = useState(false);
  const [isRecurringOpen, setRecurringOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const navigateTo = useCallback(
    (section: NavSection) => {
      if (!state.currentUser || !state.session) {
        window.location.hash = '#login';
        return;
      }
      if (
        (section === 'CLIENTS' || section === 'ACCOUNTS') &&
        state.currentUser.role !== UserRole.ADMIN
      ) {
        setActiveNav('DASHBOARD');
        window.location.hash = '#dashboard';
        return;
      }
      setActiveNav(section);
      window.location.hash = NAV_TO_HASH[section] || '#dashboard';
    },
    [state.currentUser, state.session]
  );

  // Sync URL hash with authenticated route state and enforce route protection
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash || '#login';
      if (!state.currentUser || !state.session) {
        if (hash !== '#login') {
          window.location.hash = '#login';
        }
        return;
      }

      const mapped = HASH_TO_NAV[hash];
      if (!mapped) {
        setActiveNav('DASHBOARD');
        window.location.hash = '#dashboard';
        return;
      }
      if ((mapped === 'CLIENTS' || mapped === 'ACCOUNTS') && state.currentUser.role !== UserRole.ADMIN) {
        setActiveNav('DASHBOARD');
        window.location.hash = '#dashboard';
        return;
      }
      setActiveNav(mapped);
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [state.currentUser, state.session]);

  const handleLogout = useCallback(async () => {
    const token = state.session?.token;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // Proceed with local session teardown
      }
    }
    dispatch({ type: 'LOGOUT' });
    window.location.hash = '#login';
  }, [dispatch, state.session?.token]);

  if (!state.currentUser || !state.session) {
    return <LoginPage />;
  }

  const handleOpenTransfer = (recipient?: { name: string; avatar?: string }) => {
    if (state.currentUser!.status === UserStatus.LOCKED) {
      showToast(state.currentUser!.lockReason || 'Account is temporarily locked.', 'error');
      return;
    }
    setTransferRecipient(recipient || null);
    setTransferOpen(true);
  };

  const handleTransfer = async (data: { to: string; amount: number; description: string }) => {
    try {
      const res = await fetch('/api/bank/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.session?.token || ''}`
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.status === 401) {
        dispatch({ type: 'LOGOUT' });
        showToast('Session expired. Please sign in again.', 'error');
        return;
      }
      if (!res.ok) {
        showToast(result.error || 'Transfer could not be processed.', 'error');
        return;
      }

      dispatch({ type: 'UPDATE_USER', payload: result.user });
      showToast(`$${data.amount.toLocaleString()} transfer recorded to ${data.to}`, 'success');
      setTimeout(() => setUpgradeOpen(true), 400);
    } catch {
      showToast('Network error submitting transfer.', 'error');
    }
  };

  const handleLoan = (data: { amount: number; term: number }) => {
    const newLoan: Loan = {
      id: `LOAN-${Math.floor(Math.random() * 90000) + 10000}`,
      userId: state.currentUser!.id,
      userName: state.currentUser!.name,
      amount: data.amount,
      term: data.term,
      status: 'PENDING',
      date: new Date().toISOString().split('T')[0]
    };

    const updatedUser = {
      ...state.currentUser!,
      loans: [...state.currentUser!.loans, newLoan]
    };

    dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    showToast('Credit facility inquiry recorded for review', 'info');
  };

  const handleAddRecurring = (data: any) => {
    if (state.currentUser!.status === UserStatus.LOCKED) {
      showToast('Account is temporarily locked. Standing instructions are disabled.', 'error');
      return;
    }
    const nextDate = new Date();
    if (data.frequency === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
    else if (data.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
    else if (data.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);

    const recurring: any = {
      ...data,
      id: `rec-${Date.now()}`,
      occurences: 0,
      nextDate: nextDate.toISOString().split('T')[0],
      status: 'ACTIVE'
    };

    dispatch({ type: 'ADD_RECURRING', payload: recurring });
    showToast('Standing payment instruction scheduled', 'success');
  };

  return (
    <Layout activeNav={activeNav} onNavChange={navigateTo} onLogout={handleLogout}>
      {ToastContainer}
      <div>
        {state.currentUser.role === UserRole.PERSONAL && (
          <PersonalDashboard
            activeSection={activeNav}
            onNavigate={navigateTo}
            onTransferClick={handleOpenTransfer}
            onLoanClick={() => setLoanOpen(true)}
            onRecurringClick={() => setRecurringOpen(true)}
            onTransactionClick={tx => setSelectedTransaction(tx)}
            onProfileClick={() => setProfileOpen(true)}
            onSettingsClick={() => setSettingsOpen(true)}
            onLogout={handleLogout}
          />
        )}
        {state.currentUser.role === UserRole.BUSINESS &&
          (activeNav === 'DASHBOARD' ? (
            <BusinessDashboard activeSection={activeNav} onTransferClick={() => handleOpenTransfer()} />
          ) : (
            <PersonalDashboard
              activeSection={activeNav}
              onNavigate={navigateTo}
              onTransferClick={handleOpenTransfer}
              onLoanClick={() => setLoanOpen(true)}
              onRecurringClick={() => setRecurringOpen(true)}
              onTransactionClick={tx => setSelectedTransaction(tx)}
              onProfileClick={() => setProfileOpen(true)}
              onSettingsClick={() => setSettingsOpen(true)}
              onLogout={handleLogout}
            />
          ))}
        {state.currentUser.role === UserRole.ADMIN &&
          (activeNav === 'SECURITY' ? (
            <SecurityCentreView
              user={state.currentUser}
              session={state.session}
              onUpdateSettings={settings => dispatch({ type: 'UPDATE_SETTINGS', payload: settings })}
              onLogout={handleLogout}
              onToast={showToast}
            />
          ) : activeNav === 'NOTIFICATIONS' ? (
            <NotificationsView
              user={state.currentUser}
              onMarkRead={id => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })}
              onMarkAllRead={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}
              onNavigate={navigateTo}
            />
          ) : activeNav === 'SUPPORT' ? (
            <SupportView user={state.currentUser} />
          ) : activeNav === 'PROFILE' ? (
            <PersonalDashboard
              activeSection="PROFILE"
              onNavigate={navigateTo}
              onTransferClick={handleOpenTransfer}
              onLoanClick={() => setLoanOpen(true)}
              onRecurringClick={() => setRecurringOpen(true)}
              onTransactionClick={tx => setSelectedTransaction(tx)}
              onProfileClick={() => setProfileOpen(true)}
              onSettingsClick={() => setSettingsOpen(true)}
              onLogout={handleLogout}
            />
          ) : (
            <AdminDashboard activeSection={activeNav} onNavigate={navigateTo} />
          ))}
      </div>

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => {
          setTransferOpen(false);
          setTransferRecipient(null);
        }}
        onTransfer={handleTransfer}
        initialRecipient={transferRecipient}
      />
      <LoanModal isOpen={isLoanOpen} onClose={() => setLoanOpen(false)} onSubmit={handleLoan} />
      <RecurringPaymentModal
        isOpen={isRecurringOpen}
        onClose={() => setRecurringOpen(false)}
        onSubmit={handleAddRecurring}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={state.currentUser.settings}
        onUpdate={async settings => {
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
          try {
            await fetch('/api/bank/user', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${state.session?.token || ''}`
              },
              body: JSON.stringify({ id: state.currentUser!.id, settings })
            });
          } catch {
            // Keep local state synchronized
          }
          showToast('Security preferences saved', 'success');
        }}
      />
      <TransactionDetailModal
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
      <PremiumUpgradeModal isOpen={isUpgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <UserProfileDetailModal
        isOpen={isProfileOpen}
        onClose={() => setProfileOpen(false)}
        user={state.currentUser}
        onUpdateUser={async updated => {
          dispatch({ type: 'UPDATE_USER', payload: updated });
          try {
            await fetch('/api/bank/user', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${state.session?.token || ''}`
              },
              body: JSON.stringify({ id: updated.id, passportUrl: updated.passportUrl })
            });
          } catch {
            // Keep local state synchronized
          }
        }}
      />
    </Layout>
  );
};

export default function App() {
  return (
    <BankProvider>
      <MainApp />
    </BankProvider>
  );
}
