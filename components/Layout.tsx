import React, { useState, useRef, useEffect } from 'react';
import { useBank } from '../context/BankContext';
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  FileText,
  CreditCard,
  Users,
  ShieldCheck,
  Bell,
  HelpCircle,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Lock
} from 'lucide-react';
import { BrandLogo, ProfileAvatar } from './BrandLogo';
import { UserRole, UserStatus } from '../types';

export type NavSection =
  | 'DASHBOARD'
  | 'ACCOUNT_OVERVIEW'
  | 'TRANSACTIONS'
  | 'STATEMENTS'
  | 'PAYMENTS'
  | 'BENEFICIARIES'
  | 'SECURITY'
  | 'NOTIFICATIONS'
  | 'SUPPORT'
  | 'PROFILE'
  | 'CLIENTS'
  | 'ACCOUNTS';

const NAV_TITLES: Record<NavSection, string> = {
  DASHBOARD: 'Dashboard',
  ACCOUNT_OVERVIEW: 'Account Overview',
  TRANSACTIONS: 'Transactions',
  STATEMENTS: 'Statements',
  PAYMENTS: 'Payments & Transfers',
  BENEFICIARIES: 'Beneficiaries',
  SECURITY: 'Security Centre',
  NOTIFICATIONS: 'Notifications',
  SUPPORT: 'Help & Support',
  PROFILE: 'My Profile',
  CLIENTS: 'Client Oversight',
  ACCOUNTS: 'Account Registry'
};

export const Layout: React.FC<{
  children: React.ReactNode;
  activeNav: NavSection;
  onNavChange: (section: NavSection) => void;
  onLogout: () => void;
}> = ({ children, activeNav, onNavChange, onLogout }) => {
  const { state } = useBank();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!state.currentUser) return <>{children}</>;

  const user = state.currentUser;
  const unreadNotifications = (user.notifications || []).filter(n => !n.read).length;

  const handleSelectNav = (id: NavSection) => {
    onNavChange(id);
    setSidebarOpen(false);
    setAccountMenuOpen(false);
  };

  const clientNavItems: { id: NavSection; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'DASHBOARD', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { id: 'ACCOUNT_OVERVIEW', icon: <Landmark size={18} />, label: 'Account Overview' },
    { id: 'TRANSACTIONS', icon: <ArrowLeftRight size={18} />, label: 'Transactions' },
    { id: 'STATEMENTS', icon: <FileText size={18} />, label: 'Statements' },
    { id: 'PAYMENTS', icon: <CreditCard size={18} />, label: 'Payments' },
    { id: 'BENEFICIARIES', icon: <Users size={18} />, label: 'Beneficiaries' },
    { id: 'SECURITY', icon: <ShieldCheck size={18} />, label: 'Security Centre' },
    {
      id: 'NOTIFICATIONS',
      icon: <Bell size={18} />,
      label: 'Notifications',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    { id: 'SUPPORT', icon: <HelpCircle size={18} />, label: 'Help & Support' },
    { id: 'PROFILE', icon: <UserIcon size={18} />, label: 'My Profile' }
  ];

  const adminNavItems: { id: NavSection; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'DASHBOARD', icon: <LayoutDashboard size={18} />, label: 'Overview' },
    { id: 'CLIENTS', icon: <Users size={18} />, label: 'Client Monitor' },
    { id: 'ACCOUNTS', icon: <Landmark size={18} />, label: 'Account Registry' },
    { id: 'SECURITY', icon: <ShieldCheck size={18} />, label: 'Security Centre' },
    { id: 'PROFILE', icon: <UserIcon size={18} />, label: 'My Profile' }
  ];

  const menuItems = user.role === UserRole.ADMIN ? adminNavItems : clientNavItems;

  return (
    <div className="min-h-screen bg-[#F2F6FB] text-[#2A4158] flex overflow-x-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1C3D5A]/45 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Morning Blue Institutional Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-[#2B629B] text-white w-64 flex flex-col border-r border-[#235282] transition-transform duration-200 shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/15 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectNav('DASHBOARD')}
            className="text-left focus:outline-none"
          >
            <BrandLogo variant="dark" size="md" />
          </button>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-blue-100 hover:bg-white/15 min-h-[40px] min-w-[40px] flex items-center justify-center"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menuItems.map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap min-h-[42px] ${
                  isActive
                    ? 'bg-white text-[#1C3D5A] font-semibold shadow-xs'
                    : 'text-blue-50/90 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-[#E31B23]' : 'text-blue-100/80'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="text-[11px] font-mono font-bold bg-[#E31B23] text-white px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Profile Summary & Sign Out */}
        <div className="p-3.5 border-t border-white/15 space-y-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectNav('PROFILE')}
            className="w-full p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition-colors flex items-center gap-3 text-left"
          >
            <ProfileAvatar src={user.passportUrl} name={user.name} sizeClass="w-9 h-9" className="border-white/30" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-blue-100 truncate flex items-center gap-1">
                {user.status === UserStatus.LOCKED && <Lock size={10} className="text-white shrink-0" />}
                <span>{user.accountTypeLabel || 'Personal Banking'}</span>
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-[#E31B23] border border-white/20 transition-colors min-h-[40px]"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#1C3D5A] hover:bg-[#E9F1FA] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            <div className="lg:hidden">
              <BrandLogo variant="light" size="sm" />
            </div>

            <div className="hidden lg:flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400">Banking</span>
              <span className="text-slate-300">/</span>
              <h1 className="font-display font-bold text-[#1C3D5A] truncate">{NAV_TITLES[activeNav]}</h1>
              {user.isDemoProfile && (
                <span className="ml-2 text-[11px] font-mono font-semibold text-[#D99A20] border border-[#D99A20]/30 bg-amber-50/80 px-2 py-0.5 rounded">
                  DEMO ENVIRONMENT
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectNav('SUPPORT')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap ${
                activeNav === 'SUPPORT'
                  ? 'bg-[#2B629B] text-white'
                  : 'text-[#2A4158] hover:bg-[#E9F1FA]'
              }`}
            >
              <HelpCircle size={15} />
              <span>Help & Support</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav('NOTIFICATIONS')}
              className={`relative p-2.5 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                activeNav === 'NOTIFICATIONS'
                  ? 'bg-[#2B629B] text-white'
                  : 'text-[#2A4158] hover:bg-[#E9F1FA]'
              }`}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E31B23]" />
              )}
            </button>

            {/* Account Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setAccountMenuOpen(prev => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-[#F2F6FB] transition-colors min-h-[40px]"
              >
                <ProfileAvatar src={user.passportUrl} name={user.name} sizeClass="w-7 h-7" />
                <span className="hidden md:inline text-xs font-semibold text-[#1C3D5A] max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#1C3D5A] truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">@{user.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectNav('PROFILE')}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-[#2A4158] hover:bg-[#F2F6FB] flex items-center gap-2.5"
                  >
                    <UserIcon size={14} className="text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectNav(user.role === UserRole.ADMIN ? 'CLIENTS' : 'ACCOUNT_OVERVIEW')}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-[#2A4158] hover:bg-[#F2F6FB] flex items-center gap-2.5"
                  >
                    <Landmark size={14} className="text-slate-400" />
                    <span>{user.role === UserRole.ADMIN ? 'Client Monitor' : 'Account Overview'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectNav('SECURITY')}
                    className="w-full px-4 py-2.5 text-left text-xs font-medium text-[#2A4158] hover:bg-[#F2F6FB] flex items-center gap-2.5"
                  >
                    <ShieldCheck size={14} className="text-slate-400" />
                    <span>Security Centre</span>
                  </button>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#E31B23] hover:bg-red-50 flex items-center gap-2.5"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 h-16 grid grid-cols-4 items-center">
          {(user.role === UserRole.ADMIN
            ? [
                { id: 'DASHBOARD' as NavSection, icon: <LayoutDashboard size={18} />, label: 'Overview' },
                { id: 'CLIENTS' as NavSection, icon: <Users size={18} />, label: 'Clients' },
                { id: 'ACCOUNTS' as NavSection, icon: <Landmark size={18} />, label: 'Registry' },
                { id: 'SECURITY' as NavSection, icon: <ShieldCheck size={18} />, label: 'Security' }
              ]
            : [
                { id: 'DASHBOARD' as NavSection, icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
                { id: 'TRANSACTIONS' as NavSection, icon: <ArrowLeftRight size={18} />, label: 'Activity' },
                { id: 'PAYMENTS' as NavSection, icon: <CreditCard size={18} />, label: 'Payments' },
                { id: 'PROFILE' as NavSection, icon: <UserIcon size={18} />, label: 'Profile' }
              ]
          ).map(tab => {
            const isActive = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectNav(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl transition-colors ${
                  isActive ? 'text-[#2B629B] font-semibold' : 'text-slate-500 hover:text-[#1C3D5A]'
                }`}
              >
                {tab.icon}
                <span className="text-[11px] leading-none">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
