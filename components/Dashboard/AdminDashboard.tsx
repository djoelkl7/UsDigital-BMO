import React, { useState, useEffect } from 'react';
import { useBank } from '../../context/BankContext';
import { useToast } from '../Toast';
import {
  Shield,
  Users,
  Lock,
  Unlock,
  Check,
  X,
  AlertCircle,
  UserPlus,
  Search,
  Trash2,
  FileSearch,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { UserRole, UserStatus, User } from '../../types';
import { UserManagementModal, UserProfileDetailModal } from '../Modals';
import { NavSection } from '../Layout';
import { ProfileAvatar } from '../BrandLogo';

export const AdminDashboard: React.FC<{
  activeSection?: NavSection;
  onNavigate?: (section: NavSection) => void;
}> = ({ activeSection = 'DASHBOARD', onNavigate }) => {
  const { state, dispatch } = useBank();
  const { showToast, ToastContainer } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CLIENTS' | 'ACCOUNTS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'ALL' | 'READY' | 'LOCKED'>('ALL');
  const [clientRoleFilter, setClientRoleFilter] = useState<'ALL' | 'PERSONAL' | 'BUSINESS' | 'ADMIN'>('ALL');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUserDetail, setViewingUserDetail] = useState<User | null>(null);

  useEffect(() => {
    if (activeSection === 'CLIENTS') setActiveTab('CLIENTS');
    else if (activeSection === 'ACCOUNTS') setActiveTab('ACCOUNTS');
    else if (activeSection === 'DASHBOARD') setActiveTab('OVERVIEW');
  }, [activeSection]);

  const handleTabSelect = (tab: 'OVERVIEW' | 'CLIENTS' | 'ACCOUNTS') => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab === 'OVERVIEW' ? 'DASHBOARD' : tab);
    }
  };

  const totalFunds = state.allUsers.reduce((acc, u) => acc + u.balance, 0);
  const activeUsers = state.allUsers.filter(u => u.status === UserStatus.ACTIVE).length;
  const lockedUsers = state.allUsers.filter(u => u.status === UserStatus.LOCKED).length;
  const allLoans = state.allUsers.flatMap(u => u.loans.map(l => ({ ...l, userId: u.id, userName: u.name })));
  const pendingLoans = allLoans.filter(l => l.status === 'PENDING');

  const filteredUsers = state.allUsers.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.idNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const persistAdminUserPatch = async (patch: Record<string, unknown>) => {
    try {
      await fetch('/api/bank/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.session?.token || ''}`
        },
        body: JSON.stringify(patch)
      });
    } catch {
      // Keep local state synchronized
    }
  };

  const handleUpdateBalance = (userId: string) => {
    if (!state.enterpriseACCOUNTSMode) {
      showToast('Enable Administrative Override to modify balances', 'warning');
      return;
    }
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) return;
    dispatch({ type: 'ADMIN_UPDATE_BALANCE', payload: { userId, newBalance: amount } });
    void persistAdminUserPatch({ id: userId, balance: amount });
    showToast(`Balance updated for ${state.allUsers.find(u => u.id === userId)?.name}`, 'success');
    setSelectedUserId(null);
    setNewBalance('');
  };

  const handleCreateOrUpdateUser = (userData: User) => {
    if (state.allUsers.find(u => u.id === userData.id)) {
      dispatch({ type: 'UPDATE_USER', payload: userData });
      showToast(`Account ${userData.name} updated`, 'success');
    } else {
      dispatch({ type: 'CREATE_USER', payload: userData });
      showToast(`Account ${userData.name} enrolled`, 'success');
    }
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    dispatch({ type: 'DELETE_USER', payload: id });
    showToast('Account removed from registry', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {ToastContainer}

      <div className="bg-white border border-[#E2EAF1] p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#367EAF] text-white">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-[#263746]">
              UsDigital-<span className="text-[#E31B23]">BMU</span> Compliance Console
            </h2>
            <p className="text-slate-500 text-sm">
              Account Oversight & Hold Management (Credentials are never exposed in UI)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F3F7FB] p-1 rounded-xl border border-[#E2EAF1]">
            <button
              type="button"
              onClick={() => handleTabSelect('OVERVIEW')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'OVERVIEW' ? 'bg-[#367EAF] text-white' : 'text-slate-600 hover:text-[#263746]'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('CLIENTS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'CLIENTS' ? 'bg-[#367EAF] text-white' : 'text-slate-600 hover:text-[#263746]'
              }`}
            >
              Client Monitor
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('ACCOUNTS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'ACCOUNTS' ? 'bg-[#367EAF] text-white' : 'text-slate-600 hover:text-[#263746]'
              }`}
            >
              Registry
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-[#F3F7FB] border border-[#E2EAF1] px-3.5 py-2 rounded-xl">
            <span className="text-xs font-semibold text-slate-600">Balance Override</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'TOGGLE_ACCOUNTS_MODE' })}
              aria-label="Toggle administrative balance override"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                state.enterpriseACCOUNTSMode ? 'bg-[#16865B]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.enterpriseACCOUNTSMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'OVERVIEW' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E2EAF1] p-5 rounded-2xl">
              <p className="text-xs font-semibold text-slate-500 mb-1">Total Account Balances</p>
              <p className="text-2xl font-display font-bold text-[#263746] font-mono tabular-nums">
                ${totalFunds.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white border border-[#E2EAF1] p-5 rounded-2xl">
              <p className="text-xs font-semibold text-slate-500 mb-1">Enrolled Profiles</p>
              <p className="text-2xl font-display font-bold text-[#263746] font-mono tabular-nums">
                {state.allUsers.length}
              </p>
            </div>
            <div className="bg-white border border-[#E2EAF1] p-5 rounded-2xl">
              <p className="text-xs font-semibold text-slate-500 mb-1">Active Accounts</p>
              <p className="text-2xl font-display font-bold text-[#16865B] font-mono tabular-nums">
                {activeUsers}
              </p>
            </div>
            <div className="bg-white border border-[#E2EAF1] p-5 rounded-2xl">
              <p className="text-xs font-semibold text-slate-500 mb-1">Locked Accounts</p>
              <p className="text-2xl font-display font-bold text-[#E31B23] font-mono tabular-nums">
                {lockedUsers}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E2EAF1] p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E2EAF1]">
              <div>
                <h3 className="font-display font-bold text-base text-[#263746]">Enrolled Accounts Overview</h3>
                <p className="text-xs text-slate-500">
                  Manage account locks, inspect dossiers, and review compliance status
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTabSelect('CLIENTS')}
                className="text-xs text-[#28658F] font-semibold hover:underline flex items-center gap-1"
              >
                <span>Open Client Monitor</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {state.allUsers.map(u => {
                const isLocked = u.status === UserStatus.LOCKED;
                return (
                  <div
                    key={u.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between ${
                      isLocked ? 'border-red-200 bg-red-50/30' : 'border-[#E2EAF1] bg-[#F3F7FB]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <ProfileAvatar src={u.passportUrl} name={u.name} sizeClass="w-12 h-12" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-[#263746] truncate">{u.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
                            <span className="text-[#28658F]">{u.role}</span>
                            <span className="text-slate-300">·</span>
                            <span className={`inline-flex items-center gap-1 ${isLocked ? 'text-[#E31B23]' : 'text-[#16865B]'}`}>
                              {isLocked ? <Lock size={10} /> : <CheckCircle2 size={10} />}
                              {isLocked ? 'LOCKED' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3 px-0.5">
                        <span className="text-slate-500">Balance</span>
                        <span className="font-bold text-[#263746] font-mono tabular-nums">
                          ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {isLocked && u.lockReason && (
                        <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-900 leading-snug">
                          {u.lockReason}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2EAF1]">
                      <button
                        type="button"
                        onClick={() => setViewingUserDetail(u)}
                        className="p-2 bg-white border border-[#E2EAF1] hover:bg-slate-100 text-[#263746] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <FileSearch size={13} />
                        <span>Dossier</span>
                      </button>

                      {isLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'UNLOCK_USER', payload: u.id });
                            void persistAdminUserPatch({ id: u.id, status: UserStatus.ACTIVE });
                            showToast(`Account unlocked for ${u.name}`, 'success');
                          }}
                          className="p-2 bg-[#16865B] hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Unlock size={13} />
                          <span>Unlock</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (u.role === UserRole.ADMIN) {
                              showToast('Administrator account cannot be locked', 'warning');
                              return;
                            }
                            dispatch({ type: 'LOCK_USER', payload: u.id });
                            void persistAdminUserPatch({ id: u.id, status: UserStatus.LOCKED });
                            showToast(`Lock placed on ${u.name}`, 'error');
                          }}
                          className="p-2 bg-red-50 hover:bg-[#E31B23] text-[#E31B23] hover:text-white border border-red-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Lock size={13} />
                          <span>Lock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white border border-[#E2EAF1] p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-base text-[#263746] flex items-center gap-2">
                  <Users size={18} className="text-[#28658F]" />
                  <span>Account Registry Summary</span>
                </h3>
                <button
                  type="button"
                  onClick={() => handleTabSelect('ACCOUNTS')}
                  className="text-xs text-[#28658F] font-semibold hover:underline"
                >
                  Manage Registry
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase border-b border-[#E2EAF1]">
                      <th className="pb-3 font-semibold">Account Holder</th>
                      <th className="pb-3 font-semibold">Balance</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.allUsers.map(u => (
                      <tr
                        key={u.id}
                        className="group hover:bg-[#F3F7FB] transition-colors cursor-pointer"
                        onClick={() => setViewingUserDetail(u)}
                      >
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar src={u.passportUrl} name={u.name} sizeClass="w-9 h-9" />
                            <div>
                              <p className="font-semibold text-sm text-[#263746]">{u.name}</p>
                              <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono font-bold text-sm text-[#263746] tabular-nums">
                          ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`text-xs font-semibold ${
                              u.status === UserStatus.ACTIVE ? 'text-[#16865B]' : 'text-[#E31B23]'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button type="button" className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 group-hover:text-[#263746]">
                            <FileSearch size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white border border-[#E2EAF1] p-6 rounded-2xl">
              <h3 className="font-display font-bold text-base text-[#263746] mb-5 flex items-center gap-2">
                <AlertCircle size={18} className="text-[#D99A20]" />
                <span>Credit Inquiries</span>
              </h3>
              <div className="space-y-4">
                {pendingLoans.length > 0 ? (
                  pendingLoans.map(loan => (
                    <div key={loan.id} className="p-4 bg-[#F3F7FB] border border-[#E2EAF1] rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-slate-500 font-semibold">{loan.userName}</p>
                          <p className="text-xl font-display font-bold text-[#263746] font-mono tabular-nums">
                            ${loan.amount.toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[11px] text-[#D99A20] font-semibold">PENDING</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4">{loan.term} Months</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'APPROVE_LOAN', payload: { loanId: loan.id, userId: loan.userId } })}
                          className="flex-1 bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: 'REJECT_LOAN', payload: { loanId: loan.id, userId: loan.userId } })}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-[#E31B23] rounded-lg"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 text-sm">No pending credit inquiries</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'CLIENTS' ? (
        <div className="bg-white border border-[#E2EAF1] p-6 md:p-8 rounded-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E2EAF1]">
            <div>
              <h3 className="font-display font-bold text-lg text-[#263746]">
                Client Monitoring Console ({state.allUsers.length} Enrolled)
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Monitor account statuses, inspect dossiers, and manage holds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setIsManageModalOpen(true);
              }}
              className="bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shrink-0"
            >
              <UserPlus size={16} />
              <span>Enroll Account</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by name, @username, or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#F3F7FB] border border-[#E2EAF1] rounded-xl p-3 pl-10 text-xs focus:border-[#4A90C6] focus:bg-white outline-none"
              />
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-[#F3F7FB] p-1 rounded-xl border border-[#E2EAF1]">
                {(['ALL', 'READY', 'LOCKED'] as const).map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setClientStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      clientStatusFilter === status ? 'bg-[#367EAF] text-white' : 'text-slate-600'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status === 'READY' ? 'Active' : 'Locked'}
                  </button>
                ))}
              </div>

              <div className="flex bg-[#F3F7FB] p-1 rounded-xl border border-[#E2EAF1]">
                {(['ALL', 'PERSONAL', 'BUSINESS', 'ADMIN'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setClientRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      clientRoleFilter === role ? 'bg-[#367EAF] text-white' : 'text-slate-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {filteredUsers
              .filter(u => {
                if (clientStatusFilter === 'READY' && u.status !== UserStatus.ACTIVE) return false;
                if (clientStatusFilter === 'LOCKED' && u.status !== UserStatus.LOCKED) return false;
                if (clientRoleFilter !== 'ALL' && u.role !== clientRoleFilter) return false;
                return true;
              })
              .map(u => {
                const isLocked = u.status === UserStatus.LOCKED;
                return (
                  <div
                    key={u.id}
                    className={`p-5 rounded-xl border flex flex-col justify-between ${
                      isLocked ? 'border-red-200 bg-red-50/30' : 'border-[#E2EAF1] bg-[#F3F7FB]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <ProfileAvatar src={u.passportUrl} name={u.name} sizeClass="w-12 h-12" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-[#263746] truncate">{u.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                            <span className="text-[#28658F]">{u.role}</span>
                            <span className="text-slate-300">·</span>
                            <span className={isLocked ? 'text-[#E31B23]' : 'text-[#16865B]'}>
                              {isLocked ? 'LOCKED' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Balance</span>
                          <span className="font-bold text-[#263746] font-mono tabular-nums">
                            ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reference ID</span>
                          <span className="font-mono text-slate-700">{u.idNumber || 'PENDING'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E2EAF1]">
                      <button
                        type="button"
                        onClick={() => setViewingUserDetail(u)}
                        className="p-2 bg-white border border-[#E2EAF1] hover:bg-slate-100 text-[#263746] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <FileSearch size={13} />
                        <span>Dossier</span>
                      </button>

                      {isLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'UNLOCK_USER', payload: u.id });
                            void persistAdminUserPatch({ id: u.id, status: UserStatus.ACTIVE });
                            showToast(`Account unlocked for ${u.name}`, 'success');
                          }}
                          className="p-2 bg-[#16865B] hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Unlock size={13} />
                          <span>Unlock</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (u.role === UserRole.ADMIN) {
                              showToast('Admin identity cannot be locked', 'warning');
                              return;
                            }
                            dispatch({ type: 'LOCK_USER', payload: u.id });
                            void persistAdminUserPatch({ id: u.id, status: UserStatus.LOCKED });
                            showToast(`Security hold placed on ${u.name}`, 'error');
                          }}
                          className="p-2 bg-red-50 hover:bg-[#E31B23] text-[#E31B23] hover:text-white border border-red-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Lock size={13} />
                          <span>Lock</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E2EAF1] p-6 md:p-8 rounded-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h3 className="text-lg font-display font-bold text-[#263746]">Account Registry</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Enable Balance Override above to adjust account balances inline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setIsManageModalOpen(true);
              }}
              className="bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shrink-0"
            >
              <UserPlus size={16} />
              <span>Enroll Account</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-xs font-semibold uppercase border-b border-[#E2EAF1]">
                  <th className="pb-3">Account Holder</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Balance (USD)</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[#F3F7FB]">
                    <td className="py-3.5 cursor-pointer" onClick={() => setViewingUserDetail(u)}>
                      <div className="flex items-center gap-3">
                        <ProfileAvatar src={u.passportUrl} name={u.name} sizeClass="w-10 h-10" />
                        <div>
                          <p className="font-bold text-sm text-[#263746]">{u.name}</p>
                          <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-[#28658F]">{u.role}</td>
                    <td className="py-3.5 text-right">
                      {selectedUserId === u.id ? (
                        <input
                          type="number"
                          autoFocus
                          value={newBalance}
                          onChange={e => setNewBalance(e.target.value)}
                          onBlur={() => handleUpdateBalance(u.id)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateBalance(u.id)}
                          className="w-36 bg-white border border-[#4A90C6] p-1.5 text-right text-sm rounded-lg font-mono font-bold tabular-nums outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (state.enterpriseACCOUNTSMode) {
                              setSelectedUserId(u.id);
                              setNewBalance(u.balance.toString());
                            } else {
                              showToast('Enable Balance Override to edit balances inline', 'info');
                            }
                          }}
                          className="text-sm font-mono font-bold tabular-nums text-[#263746] hover:underline"
                        >
                          ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`text-xs font-semibold ${
                          u.status === UserStatus.ACTIVE ? 'text-[#16865B]' : 'text-[#E31B23]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingUserDetail(u)}
                          className="p-2 bg-[#F3F7FB] hover:bg-slate-200 rounded-lg text-slate-600"
                          title="Dossier"
                        >
                          <FileSearch size={15} />
                        </button>
                        {u.role !== UserRole.ADMIN && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-[#E31B23]"
                            title="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserManagementModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleCreateOrUpdateUser}
        initialUser={editingUser}
      />

      <UserProfileDetailModal
        isOpen={Boolean(viewingUserDetail)}
        onClose={() => setViewingUserDetail(null)}
        user={viewingUserDetail}
        onUpdateUser={updated => {
          dispatch({ type: 'UPDATE_USER', payload: updated });
          setViewingUserDetail(updated);
          showToast('Profile record updated', 'success');
        }}
      />
    </div>
  );
};
