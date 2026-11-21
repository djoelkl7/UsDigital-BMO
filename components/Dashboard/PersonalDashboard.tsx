import React, { useState, useMemo } from 'react';
import { useBank } from '../../context/BankContext';
import { useToast } from '../Toast';
import {
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Send,
  TrendingUp,
  Info,
  Filter,
  X,
  ShieldAlert,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Lock,
  Landmark,
  Users,
  Receipt,
  HelpCircle,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';
import { FinancialGrowthChart, YearlyStatsBarChart } from '../Charts';
import { UserStatus, Transaction } from '../../types';
import { NavSection } from '../Layout';
import { ProfileAvatar } from '../BrandLogo';
import { CATHERINE_LOCK_NOTICE } from '../../constants';
import {
  StatementsView,
  PaymentsView,
  BeneficiariesView,
  SecurityCentreView,
  NotificationsView,
  SupportView
} from './BankingPages';
import { Modal } from '../Modals';

export const PersonalDashboard: React.FC<{
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onTransferClick: (recipient?: { name: string; avatar?: string }) => void;
  onLoanClick: () => void;
  onRecurringClick: () => void;
  onTransactionClick: (transaction: Transaction) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
}> = ({
  activeSection,
  onNavigate,
  onTransferClick,
  onRecurringClick,
  onTransactionClick,
  onProfileClick,
  onSettingsClick,
  onLogout
}) => {
  const { state, dispatch } = useBank();
  const { showToast, ToastContainer } = useToast();
  const user = state.currentUser!;
  const firstName = user.name.split(' ')[0];
  const isLocked = user.status === UserStatus.LOCKED;

  // Restricted action explanation modal state
  const [restrictedModalAction, setRestrictedModalAction] = useState<string | null>(null);

  // Transaction filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | 'Credit' | 'Debit'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const filteredTransactions = useMemo(() => {
    return user.transactions.filter(t => {
      const matchesDate = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
      const matchesType =
        selectedType === 'All' ||
        (selectedType === 'Credit' && t.type === 'CREDIT') ||
        (selectedType === 'Debit' && t.type === 'DEBIT');
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.sampleSenderLabel && t.sampleSenderLabel.toLowerCase().includes(q)) ||
        (t.from && t.from.toLowerCase().includes(q)) ||
        (t.reference && t.reference.toLowerCase().includes(q));
      return matchesDate && matchesType && matchesSearch;
    });
  }, [user.transactions, startDate, endDate, selectedType, searchQuery]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('All');
    setSearchQuery('');
  };

  const handleRestrictedOrOpenTransfer = (actionLabel = 'Outgoing Transfers', recipient?: { name: string }) => {
    if (isLocked) {
      setRestrictedModalAction(actionLabel);
      return;
    }
    onTransferClick(recipient);
  };

  const formattedBalance = user.settings.hideBalance
    ? '••••••••'
    : `$${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalCredits = user.transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const growthData = [
    { name: 'Jul', value: 0 },
    { name: 'Aug', value: 0 },
    { name: 'Sep', value: 0 },
    { name: 'Oct', value: 0 },
    { name: 'Nov', value: user.balance }
  ];

  const monthlyStatsData = [
    { name: 'Jul', value: 0 },
    { name: 'Aug', value: 0 },
    { name: 'Sep', value: 0 },
    { name: 'Oct', value: 0 },
    { name: 'Nov', value: totalCredits || user.balance, active: true }
  ];

  const renderLockAlert = () => {
    if (!isLocked) return null;
    return (
      <div
        className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        role="alert"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#E31B23] text-white flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#E31B23] uppercase tracking-wider">
              Account Status: TEMPORARILY LOCKED
            </p>
            <p className="text-sm text-[#1C3D5A] mt-1 leading-relaxed">
              {user.lockReason || CATHERINE_LOCK_NOTICE}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('SUPPORT')}
          className="bg-[#2B629B] hover:bg-[#235282] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          Contact Support
        </button>
      </div>
    );
  };

  const renderRestrictedModal = () => (
    <Modal
      title="Action Temporarily Restricted"
      isOpen={Boolean(restrictedModalAction)}
      onClose={() => setRestrictedModalAction(null)}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <Lock size={18} className="text-[#E31B23] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1C3D5A] leading-relaxed space-y-1">
            <p className="font-bold text-[#E31B23]">{restrictedModalAction} Disabled</p>
            <p>{user.lockReason || CATHERINE_LOCK_NOTICE}</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          You may continue viewing your account information, demonstration balance, and transaction history while outgoing transfers, withdrawals, and bill payments remain disabled.
        </p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRestrictedModalAction(null);
              onNavigate('SUPPORT');
            }}
            className="flex-1 bg-[#2B629B] hover:bg-[#235282] text-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            Contact Support
          </button>
          <button
            type="button"
            onClick={() => setRestrictedModalAction(null)}
            className="px-4 py-2.5 border border-slate-300 text-[#2A4158] font-semibold rounded-xl text-xs hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );

  const renderTransactionsLedger = (compact = false) => {
    const rows = compact ? filteredTransactions.slice(0, 5) : filteredTransactions;
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base md:text-lg font-display font-bold text-[#1C3D5A]">
              {compact ? 'Recent Transactions' : 'Transaction History'}
            </h3>
            <p className="text-xs text-slate-500">
              Demonstration statement entries · Click any transaction to view full details
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!compact && (
              <button
                type="button"
                onClick={() => setIsFilterVisible(prev => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors min-h-[40px] ${
                  isFilterVisible
                    ? 'bg-[#2B629B] text-white border-[#2B629B]'
                    : 'bg-[#F2F6FB] border-slate-200 text-[#2A4158] hover:bg-slate-200/70'
                }`}
              >
                <Filter size={14} />
                <span>Filter</span>
              </button>
            )}
            {compact && (
              <button
                type="button"
                onClick={() => onNavigate('TRANSACTIONS')}
                className="text-xs font-semibold text-[#2B629B] hover:text-[#E31B23] hover:underline px-2 py-1 whitespace-nowrap"
              >
                Full history
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        {!compact && (
          <div className="space-y-3 mb-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, sender, category, or demo reference..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F2F6FB] border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1C3D5A] focus:bg-white focus:border-[#2B629B] outline-none"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#F2F6FB] rounded-xl border border-slate-200 shrink-0">
                {(['All', 'Credit', 'Debit'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedType === type ? 'bg-[#2B629B] text-white' : 'text-slate-600 hover:text-[#1C3D5A]'
                    }`}
                  >
                    {type === 'All' ? 'All' : type === 'Credit' ? 'Deposits' : 'Withdrawals'}
                  </button>
                ))}
              </div>
            </div>

            {isFilterVisible && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F2F6FB] rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-[#2B629B]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-[#2B629B]"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-[#2A4158] rounded-lg p-2 text-xs font-semibold"
                  >
                    <X size={14} />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Banking Statement Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 font-semibold">Transaction</th>
                <th className="py-3 font-semibold">Category</th>
                <th className="py-3 font-semibold">Date</th>
                <th className="py-3 font-semibold">Status</th>
                <th className="py-3 font-semibold">Reference</th>
                <th className="py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length > 0 ? (
                rows.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => onTransactionClick(tx)}
                    className="hover:bg-[#F2F6FB] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === 'CREDIT'
                              ? 'bg-emerald-50 text-[#16865B] border border-emerald-200'
                              : 'bg-slate-100 text-[#1C3D5A] border border-slate-200'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1C3D5A] group-hover:text-[#E31B23] transition-colors">
                            {tx.description}
                          </p>
                          {tx.sampleSenderLabel && (
                            <p className="text-xs text-slate-500">
                              Sample sender: {tx.sampleSenderLabel} (Unverified)
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {tx.transactionTypeLabel || tx.category}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {tx.displayDate || tx.date}
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-[#D99A20] whitespace-nowrap">
                      {tx.status || 'DEMO — Unverified'}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                      {tx.reference || tx.id}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          tx.type === 'CREDIT' ? 'text-[#16865B]' : 'text-[#1C3D5A]'
                        }`}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}$
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {tx.currency || 'USD'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">
                    No matching transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Transaction List */}
        <div className="md:hidden divide-y divide-slate-100">
          {rows.length > 0 ? (
            rows.map(tx => (
              <button
                key={tx.id}
                type="button"
                onClick={() => onTransactionClick(tx)}
                className="w-full py-3.5 flex items-start justify-between gap-3 text-left hover:bg-[#F2F6FB] rounded-xl px-1"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      tx.type === 'CREDIT'
                        ? 'bg-emerald-50 text-[#16865B] border border-emerald-200'
                        : 'bg-slate-100 text-[#1C3D5A] border border-slate-200'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1C3D5A] truncate">{tx.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tx.category} · <span className="font-mono tabular-nums">{tx.displayDate || tx.date}</span>
                    </p>
                    <p className="text-[11px] font-semibold text-[#D99A20] mt-0.5">
                      {tx.status || 'DEMO — Unverified'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-mono font-bold tabular-nums ${
                      tx.type === 'CREDIT' ? 'text-[#16865B]' : 'text-[#1C3D5A]'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">{tx.currency || 'USD'}</p>
                </div>
              </button>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No matching transactions found.</p>
          )}
        </div>
      </div>
    );
  };

  // Sub-page Routing inside Authenticated Banking Workspace
  if (activeSection === 'TRANSACTIONS') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {ToastContainer}
        {renderRestrictedModal()}
        {renderLockAlert()}
        {renderTransactionsLedger(false)}
      </div>
    );
  }

  if (activeSection === 'STATEMENTS') {
    return (
      <>
        {ToastContainer}
        <StatementsView
          user={user}
          onPrint={() => {
            window.print();
          }}
        />
      </>
    );
  }

  if (activeSection === 'PAYMENTS') {
    return (
      <>
        {ToastContainer}
        {renderRestrictedModal()}
        <PaymentsView
          user={user}
          onOpenTransfer={() => handleRestrictedOrOpenTransfer('Outgoing Transfers')}
          onOpenRecurring={() =>
            isLocked ? setRestrictedModalAction('Standing Orders') : onRecurringClick()
          }
          onRestrictedAttempt={label => setRestrictedModalAction(label)}
          onNavigate={onNavigate}
        />
      </>
    );
  }

  if (activeSection === 'BENEFICIARIES') {
    return (
      <>
        {ToastContainer}
        {renderRestrictedModal()}
        <BeneficiariesView
          user={user}
          onAddBeneficiary={b => {
            dispatch({ type: 'ADD_BENEFICIARY', payload: b });
            showToast('Demonstration beneficiary added', 'success');
          }}
          onRemoveBeneficiary={id => {
            dispatch({ type: 'REMOVE_BENEFICIARY', payload: id });
            showToast('Beneficiary removed', 'info');
          }}
          onAttemptTransfer={name => handleRestrictedOrOpenTransfer('Beneficiary Transfers', { name })}
        />
      </>
    );
  }

  if (activeSection === 'SECURITY') {
    return (
      <>
        {ToastContainer}
        <SecurityCentreView
          user={user}
          session={state.session}
          onUpdateSettings={settings => dispatch({ type: 'UPDATE_SETTINGS', payload: settings })}
          onLogout={onLogout}
          onToast={showToast}
        />
      </>
    );
  }

  if (activeSection === 'NOTIFICATIONS') {
    return (
      <>
        {ToastContainer}
        <NotificationsView
          user={user}
          onMarkRead={id => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })}
          onMarkAllRead={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}
          onNavigate={onNavigate}
        />
      </>
    );
  }

  if (activeSection === 'SUPPORT') {
    return (
      <>
        {ToastContainer}
        <SupportView user={user} />
      </>
    );
  }

  if (activeSection === 'ACCOUNT_OVERVIEW') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {ToastContainer}
        {renderRestrictedModal()}
        {renderLockAlert()}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-mono text-[#D99A20] font-semibold">DEMO ACCOUNT DETAILS</p>
                <h2 className="text-xl font-display font-bold text-[#1C3D5A] mt-0.5">Account Overview</h2>
              </div>
              <Landmark size={20} className="text-[#2B629B]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F2F6FB] border border-slate-200">
                <p className="text-slate-500">Account Holder</p>
                <p className="text-sm font-bold text-[#1C3D5A] mt-1">{user.name}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F6FB] border border-slate-200">
                <p className="text-slate-500">Account Type</p>
                <p className="text-sm font-bold text-[#1C3D5A] mt-1">{user.accountTypeLabel || 'Personal Banking'}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F6FB] border border-slate-200">
                <p className="text-slate-500">Currency & Number</p>
                <p className="text-sm font-mono font-bold text-[#1C3D5A] mt-1">
                  {user.currency || 'USD'} · {user.accountNumberMasked || '•••• •••• 8379'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#F2F6FB] border border-slate-200">
                <p className="text-slate-500">Account Status</p>
                <p className={`text-sm font-bold mt-1 ${isLocked ? 'text-[#E31B23]' : 'text-[#16865B]'}`}>
                  {isLocked ? 'TEMPORARILY LOCKED' : 'ACTIVE'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bank-card-navy text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-300">Available Demonstration Balance ({user.currency || 'USD'})</p>
                <p className="text-3xl font-display font-bold font-mono tabular-nums mt-1">{formattedBalance}</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('STATEMENTS')}
                className="bg-white text-[#1C3D5A] hover:bg-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                View Statements
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-[#1C3D5A] flex items-center gap-2">
                <TrendingUp size={17} className="text-[#2B629B]" />
                <span>Balance Activity (Demo)</span>
              </h3>
              <span className="text-xs text-slate-500">2026</span>
            </div>
            <FinancialGrowthChart data={growthData} />
          </div>
        </div>

        {renderTransactionsLedger(true)}
      </div>
    );
  }

  if (activeSection === 'PROFILE') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {ToastContainer}
        {renderLockAlert()}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-200">
            <ProfileAvatar
              src={user.passportUrl}
              name={user.name}
              sizeClass="w-24 h-24"
              className="border-2 border-slate-200 shadow-xs"
            />
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-display font-bold text-[#1C3D5A]">{user.name}</h2>
                {user.isDemoProfile && (
                  <span className="text-[11px] font-mono font-semibold text-[#D99A20] border border-[#D99A20]/30 bg-amber-50 px-2 py-0.5 rounded">
                    DEMO PROFILE
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-1">
                @{user.username} · {user.idNumber || 'USB-DEMO-774920-P'}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600">
                <span className="font-semibold text-[#1C3D5A]">{user.accountTypeLabel || 'Personal Banking'}</span>
                <span aria-hidden="true">·</span>
                <span>{user.currency || 'USD'}</span>
                <span aria-hidden="true">·</span>
                <span className={`font-semibold ${isLocked ? 'text-[#E31B23]' : 'text-[#16865B]'}`}>
                  {isLocked ? 'TEMPORARILY LOCKED' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onProfileClick}
              className="p-4 rounded-xl bg-[#2B629B] hover:bg-[#235282] text-white text-left flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <UserIcon size={17} />
                <span>Identity Dossier & Photo</span>
              </span>
              <span className="text-xs text-slate-300">Open</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('SECURITY')}
              className="p-4 rounded-xl bg-[#F2F6FB] hover:bg-slate-200/70 border border-slate-200 text-[#1C3D5A] text-left flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <ShieldCheck size={17} />
                <span>Security Centre</span>
              </span>
              <span className="text-xs text-slate-500">Manage</span>
            </button>

            <button
              type="button"
              onClick={onSettingsClick}
              className="p-4 rounded-xl bg-[#F2F6FB] hover:bg-slate-200/70 border border-slate-200 text-[#1C3D5A] text-left flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <Info size={17} />
                <span>Privacy Preferences</span>
              </span>
              <span className="text-xs text-slate-500">Edit</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#E31B23] text-left flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <LogOut size={17} />
                <span>Sign Out</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT MAIN DASHBOARD (/#dashboard)
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {ToastContainer}
      {renderRestrictedModal()}

      {/* Prominent Locked Account Security Notification */}
      {renderLockAlert()}

      {/* Account Overview Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bank-card-navy text-white rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <ProfileAvatar
                src={user.passportUrl}
                name={user.name}
                sizeClass="w-16 h-16"
                className="border-2 border-white/25"
              />
              <div className="min-w-0">
                <p className="text-xs text-slate-300 font-medium">
                  {user.accountTypeLabel || 'Personal Banking'} · {user.currency || 'USD'}
                </p>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white truncate">
                  Welcome back, {firstName}.
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isLocked ? 'text-[#E31B23] bg-white px-2.5 py-0.5 rounded' : 'text-emerald-300'
                    }`}
                  >
                    {isLocked && <Lock size={11} />}
                    <span>{isLocked ? 'TEMPORARILY LOCKED' : 'Active'}</span>
                  </span>
                  {user.isDemoProfile && (
                    <span className="text-[11px] font-mono text-amber-300">
                      DEMO DATA · Prototype Only
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  payload: { ...user.settings, hideBalance: !user.settings.hideBalance }
                })
              }
              className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl transition-colors"
            >
              {user.settings.hideBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{user.settings.hideBalance ? 'Show Balance' : 'Hide Balance'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#1C3D5A]">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Available Balance ({user.currency || 'USD'} · DEMO)
              </p>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Account {user.accountNumberMasked || '•••• •••• 8379'}
              </p>
            </div>
            <p className="text-3xl sm:text-4xl font-display font-bold font-mono tabular-nums tracking-tight text-[#1C3D5A]">
              {formattedBalance}
            </p>
          </div>
        </div>

        {/* Deposit Summary & Yearly Activity Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-xs font-semibold text-slate-500">Demonstration Activity (2026)</p>
              <h3 className="text-lg font-display font-bold text-[#1C3D5A]">
                +${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })} {user.currency || 'USD'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('STATEMENTS')}
              className="text-xs font-semibold text-[#2B629B] hover:text-[#E31B23] hover:underline whitespace-nowrap"
            >
              Statements
            </button>
          </div>

          <YearlyStatsBarChart data={monthlyStatsData} activeIndex={4} />
        </div>
      </div>

      {/* Quick Actions Grid (6 Professional Banking Action Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-[#1C3D5A]">Quick Actions</h3>
          {isLocked && (
            <span className="text-xs text-[#E31B23] font-semibold flex items-center gap-1">
              <Lock size={12} />
              <span>Outgoing transfers & payments disabled</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: 'Transfer Money',
              icon: <Send size={18} />,
              restricted: isLocked,
              onClick: () => handleRestrictedOrOpenTransfer('Transfer Money')
            },
            {
              label: 'Pay Bills',
              icon: <Receipt size={18} />,
              restricted: isLocked,
              onClick: () => handleRestrictedOrOpenTransfer('Pay Bills')
            },
            {
              label: 'Beneficiaries',
              icon: <Users size={18} />,
              restricted: false,
              onClick: () => onNavigate('BENEFICIARIES')
            },
            {
              label: 'Statements',
              icon: <FileText size={18} />,
              restricted: false,
              onClick: () => onNavigate('STATEMENTS')
            },
            {
              label: 'Account Details',
              icon: <Landmark size={18} />,
              restricted: false,
              onClick: () => onNavigate('ACCOUNT_OVERVIEW')
            },
            {
              label: 'Contact Support',
              icon: <HelpCircle size={18} />,
              restricted: false,
              onClick: () => onNavigate('SUPPORT')
            }
          ].map(action => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={`bg-white border rounded-xl p-4 flex flex-col items-start justify-between gap-3 text-left transition-colors min-h-[96px] ${
                action.restricted
                  ? 'border-slate-200 opacity-85 hover:border-red-300'
                  : 'border-slate-200 hover:border-[#2B629B]'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    action.restricted ? 'bg-slate-100 text-slate-500' : 'bg-[#F2F6FB] text-[#1C3D5A]'
                  }`}
                >
                  {action.icon}
                </div>
                {action.restricted && <Lock size={14} className="text-[#E31B23]" />}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-[#1C3D5A] leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions Ledger */}
      {renderTransactionsLedger(true)}
    </div>
  );
};
