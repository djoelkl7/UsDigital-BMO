import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Users,
  Plus,
  Trash2,
  ShieldCheck,
  KeyRound,
  Clock,
  Fingerprint,
  Bell,
  CheckCheck,
  HelpCircle,
  Phone,
  Mail,
  Building2,
  Lock,
  ShieldAlert,
  Send,
  CheckCircle2,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { User, UserStatus, Beneficiary, UserSettings, SessionInfo } from '../../types';
import { APP_DOMAIN, CATHERINE_LOCK_NOTICE } from '../../constants';
import { NavSection } from '../Layout';

export const StatementsView: React.FC<{
  user: User;
  onPrint: () => void;
}> = ({ user, onPrint }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2EAF1]">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#28658F] font-semibold">
              OFFICIAL ACCOUNT STATEMENT
            </p>
            <h2 className="text-xl font-display font-bold text-[#263746] mt-1">
              Account Statements
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Monthly statement summary for {user.name} ({user.currency || 'USD'})
            </p>
          </div>
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 bg-[#367EAF] hover:bg-[#28658F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Printer size={15} />
            <span>Print Statement</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1]">
            <p className="text-xs text-slate-500">Statement Period</p>
            <p className="text-sm font-bold text-[#263746] mt-1 font-mono">01/11/2026 – 30/11/2026</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1]">
            <p className="text-xs text-slate-500">Account Classification</p>
            <p className="text-sm font-bold text-[#263746] mt-1">{user.accountTypeLabel || 'Personal Banking'}</p>
          </div>
          <div className="p-4 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1]">
            <p className="text-xs text-slate-500">Closing Balance</p>
            <p className="text-sm font-bold text-[#263746] mt-1 font-mono tabular-nums">
              ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {user.currency || 'USD'}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2EAF1] text-xs uppercase text-slate-500">
                <th className="py-3 font-semibold">Date</th>
                <th className="py-3 font-semibold">Description</th>
                <th className="py-3 font-semibold">Reference</th>
                <th className="py-3 font-semibold">Status</th>
                <th className="py-3 font-semibold text-right">Amount ({user.currency || 'USD'})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {user.transactions.length > 0 ? (
                user.transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#F3F7FB]/60">
                    <td className="py-3.5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {tx.displayDate || tx.date}
                    </td>
                    <td className="py-3.5">
                      <p className="font-semibold text-[#263746]">{tx.description}</p>
                      {tx.sampleSenderLabel && (
                        <p className="text-xs text-slate-500">Sender: {tx.sampleSenderLabel}</p>
                      )}
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-500">{tx.reference || tx.id}</td>
                    <td className="py-3.5 text-xs font-semibold text-[#16865B]">{tx.status || 'Settled'}</td>
                    <td
                      className={`py-3.5 text-right font-mono font-bold tabular-nums whitespace-nowrap ${
                        tx.type === 'CREDIT' ? 'text-[#16865B]' : 'text-[#263746]'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? '+' : '-'}$
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No transactions available for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const PaymentsView: React.FC<{
  user: User;
  onOpenTransfer: () => void;
  onOpenRecurring: () => void;
  onRestrictedAttempt: (actionLabel: string) => void;
  onNavigate: (section: NavSection) => void;
}> = ({ user, onOpenTransfer, onOpenRecurring, onRestrictedAttempt, onNavigate }) => {
  const isLocked = user.status === UserStatus.LOCKED;
  const [billPayee, setBillPayee] = useState('Pacific Electric & Gas');
  const [billAmount, setBillAmount] = useState('245.00');

  const handlePayBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onRestrictedAttempt('Bill Payments');
      return;
    }
    onOpenTransfer();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E31B23] text-white flex items-center justify-center shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#E31B23]">
                Outgoing Payments & Withdrawals Disabled
              </p>
              <p className="text-sm text-[#263746] mt-1 leading-relaxed">{user.lockReason || CATHERINE_LOCK_NOTICE}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('SUPPORT')}
            className="bg-[#367EAF] hover:bg-[#28658F] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            Contact Support
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-[#263746]">Pay Bills</h2>
            <CreditCard size={18} className="text-[#28658F]" />
          </div>
          <p className="text-xs text-slate-500">
            Schedule or submit bill payments from your {user.accountTypeLabel || 'Personal Banking'} account.
          </p>

          <form onSubmit={handlePayBill} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Biller</label>
              <select
                value={billPayee}
                onChange={e => setBillPayee(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#263746] outline-none focus:border-[#4A90C6]"
              >
                <option>Pacific Electric & Gas</option>
                <option>Metropolitan Water District</option>
                <option>Beverly Municipal Tax</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={billAmount}
                onChange={e => setBillAmount(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono tabular-nums text-[#263746] outline-none focus:border-[#4A90C6]"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                isLocked
                  ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  : 'bg-[#367EAF] hover:bg-[#28658F] text-white'
              }`}
            >
              {isLocked && <Lock size={15} />}
              <span>{isLocked ? 'Bill Payments Disabled (Account Locked)' : 'Submit Bill Payment'}</span>
            </button>
          </form>
        </div>

        <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-[#263746]">Transfers & Withdrawals</h2>
            <p className="text-xs text-slate-500 mt-1">
              Initiate domestic wires, peer transfers, or standing payment instructions.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => (isLocked ? onRestrictedAttempt('Outgoing Transfers') : onOpenTransfer())}
                className="w-full p-4 rounded-xl border border-[#E2EAF1] hover:border-[#4A90C6] bg-[#F3F7FB] flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-[#263746]">Transfer Money</p>
                  <p className="text-xs text-slate-500">
                    {isLocked ? 'Disabled while account verification is pending' : 'Send USD to saved beneficiaries'}
                  </p>
                </div>
                {isLocked ? <Lock size={16} className="text-[#E31B23]" /> : <ArrowUpRight size={16} className="text-[#263746]" />}
              </button>

              <button
                type="button"
                onClick={() => (isLocked ? onRestrictedAttempt('Withdrawals') : onOpenTransfer())}
                className="w-full p-4 rounded-xl border border-[#E2EAF1] hover:border-[#4A90C6] bg-[#F3F7FB] flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-[#263746]">Cash & ACH Withdrawal</p>
                  <p className="text-xs text-slate-500">
                    {isLocked ? 'Disabled during temporary security lock' : 'Withdraw to linked external bank'}
                  </p>
                </div>
                {isLocked ? <Lock size={16} className="text-[#E31B23]" /> : <ArrowUpRight size={16} className="text-[#263746]" />}
              </button>

              <button
                type="button"
                onClick={() => (isLocked ? onRestrictedAttempt('Standing Orders') : onOpenRecurring())}
                className="w-full p-4 rounded-xl border border-[#E2EAF1] hover:border-[#4A90C6] bg-[#F3F7FB] flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-[#263746]">Recurring Mandates</p>
                  <p className="text-xs text-slate-500">
                    {isLocked ? 'Disabled while account is locked' : 'Manage scheduled outgoing payments'}
                  </p>
                </div>
                {isLocked ? <Lock size={16} className="text-[#E31B23]" /> : <ArrowUpRight size={16} className="text-[#263746]" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BeneficiariesView: React.FC<{
  user: User;
  onAddBeneficiary: (b: Beneficiary) => void;
  onRemoveBeneficiary: (id: string) => void;
  onAttemptTransfer: (name: string) => void;
}> = ({ user, onAddBeneficiary, onRemoveBeneficiary, onAttemptTransfer }) => {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountMask, setAccountMask] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  const list = user.beneficiaries || [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bankName.trim()) return;
    onAddBeneficiary({
      id: `ben-${Date.now()}`,
      name: name.trim(),
      bankName: bankName.trim(),
      accountMask: accountMask.trim() || '•••• 0000',
      routingNumber: routingNumber.trim() || '021000021',
      type: 'Domestic Wire',
      isDemo: false
    });
    setName('');
    setBankName('');
    setAccountMask('');
    setRoutingNumber('');
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-[#263746]">Saved Beneficiaries</h2>
            <p className="text-xs text-slate-500">Verified payees stored in your banking profile</p>
          </div>
          <Users size={18} className="text-[#28658F]" />
        </div>

        <div className="divide-y divide-slate-200">
          {list.length > 0 ? (
            list.map(b => (
              <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#263746]">{b.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.bankName} · <span className="font-mono">{b.accountMask}</span> · {b.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAttemptTransfer(b.name)}
                    className="px-3 py-1.5 rounded-lg bg-[#367EAF] hover:bg-[#28658F] text-white text-xs font-semibold"
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveBeneficiary(b.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-[#E31B23] hover:bg-red-50 transition-colors"
                    aria-label="Remove beneficiary"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No beneficiaries saved yet.</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-5 bg-white border border-[#E2EAF1] rounded-2xl p-6">
        <h3 className="text-base font-display font-bold text-[#263746] mb-1">Add Beneficiary</h3>
        <p className="text-xs text-slate-500 mb-4">Add a domestic wire or ACH payee to your profile.</p>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Recipient Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Harbor Consulting LLC"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#4A90C6]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Institution Name</label>
            <input
              type="text"
              required
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="e.g. First Commercial Bank"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#4A90C6]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Account Mask</label>
              <input
                type="text"
                value={accountMask}
                onChange={e => setAccountMask(e.target.value)}
                placeholder="•••• 1234"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono outline-none focus:border-[#4A90C6]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Routing Number</label>
              <input
                type="text"
                value={routingNumber}
                onChange={e => setRoutingNumber(e.target.value)}
                placeholder="021000021"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-mono outline-none focus:border-[#4A90C6]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            <span>Add Beneficiary</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export const SecurityCentreView: React.FC<{
  user: User;
  session: SessionInfo | null;
  onUpdateSettings: (settings: UserSettings) => void;
  onLogout: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}> = ({ user, session, onUpdateSettings, onLogout, onToast }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onToast('New password and confirmation do not match.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      onToast('Password must be at least 8 characters.', 'error');
      return;
    }

    setIsUpdatingPw(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token || ''}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || 'Could not update password.', 'error');
      } else {
        onToast('Password updated and hashed securely on server.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      onToast('Network error updating password.', 'error');
    } finally {
      setIsUpdatingPw(false);
    }
  };

  const sessionExpiryText = session
    ? new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Management */}
        <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <KeyRound size={18} className="text-[#E31B23]" />
            <h2 className="text-lg font-display font-bold text-[#263746]">Password Management</h2>
          </div>
          <p className="text-xs text-slate-500">
            Update your sign-in passcode. Passwords are verified and hashed using scrypt on the server.
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Current Passcode</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#4A90C6]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">New Passcode (min 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#4A90C6]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Confirm New Passcode</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#4A90C6]"
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingPw}
              className="w-full bg-[#367EAF] hover:bg-[#28658F] disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {isUpdatingPw ? 'Updating Passcode...' : 'Update Passcode'}
            </button>
          </form>
        </div>

        {/* Session & Biometric Settings */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-[#28658F]" />
              <h2 className="text-lg font-display font-bold text-[#263746]">Active Session Management</h2>
            </div>

            <div className="p-4 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Authentication Method</span>
                <span className="font-semibold text-[#263746]">{session?.authMethod || 'Password Authentication'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Expires</span>
                <span className="font-mono font-semibold text-[#263746]">{sessionExpiryText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token Storage</span>
                <span className="font-semibold text-[#16865B]">In-Memory Bearer Only</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full border border-[#E31B23] text-[#E31B23] hover:bg-red-50 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Terminate Active Session & Sign Out
            </button>
          </div>

          <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Fingerprint size={18} className="text-[#16865B]" />
                <div>
                  <h3 className="text-sm font-display font-bold text-[#263746]">Biometric Face ID</h3>
                  <p className="text-xs text-slate-500">Enable camera verification login option</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ ...user.settings, biometricLogin: !user.settings.biometricLogin });
                  onToast(
                    `Face ID sign-in ${!user.settings.biometricLogin ? 'enabled' : 'disabled'}`,
                    'info'
                  );
                }}
                aria-label="Toggle Face ID login"
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  user.settings.biometricLogin ? 'bg-[#16865B]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    user.settings.biometricLogin ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login History */}
      <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-display font-bold text-[#263746]">Login History</h3>
            <p className="text-xs text-slate-500">Recent authentication events for this account</p>
          </div>
          <ShieldCheck size={18} className="text-[#16865B]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2EAF1] text-slate-500 uppercase">
                <th className="py-2.5 font-semibold">Timestamp</th>
                <th className="py-2.5 font-semibold">Method</th>
                <th className="py-2.5 font-semibold">Device</th>
                <th className="py-2.5 font-semibold text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(user.loginHistory || []).map(entry => (
                <tr key={entry.id}>
                  <td className="py-3 font-mono text-slate-600">{entry.timestamp}</td>
                  <td className="py-3 font-medium text-[#263746]">{entry.method}</td>
                  <td className="py-3 text-slate-500">{entry.device}</td>
                  <td
                    className={`py-3 text-right font-semibold ${
                      entry.status === 'Authenticated' ? 'text-[#16865B]' : 'text-[#E31B23]'
                    }`}
                  >
                    {entry.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const NotificationsView: React.FC<{
  user: User;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (section: NavSection) => void;
}> = ({ user, onMarkRead, onMarkAllRead, onNavigate }) => {
  const notifications = user.notifications || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2EAF1]">
          <div className="flex items-center gap-2.5">
            <Bell size={19} className="text-[#E31B23]" />
            <div>
              <h2 className="text-lg font-display font-bold text-[#263746]">Security & Account Notifications</h2>
              <p className="text-xs text-slate-500">Alerts and status updates for your UsDigital-BMO profile</p>
            </div>
          </div>

          {notifications.some(n => !n.read) && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#28658F] hover:underline"
            >
              <CheckCheck size={14} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-200 mt-2">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                className={`py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  !n.read ? 'bg-[#F3F7FB]/70 -mx-3 px-3 rounded-xl' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      n.severity === 'ALERT'
                        ? 'bg-red-50 text-[#E31B23]'
                        : n.severity === 'WARNING'
                        ? 'bg-amber-50 text-[#D99A20]'
                        : 'bg-slate-100 text-[#263746]'
                    }`}
                  >
                    <ShieldAlert size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#263746]">{n.title}</p>
                      {!n.read && <span className="text-[11px] font-semibold text-[#E31B23]">Unread</span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-1.5">{n.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.severity === 'ALERT' && (
                    <button
                      type="button"
                      onClick={() => onNavigate('SUPPORT')}
                      className="px-3 py-1.5 rounded-lg bg-[#367EAF] text-white text-xs font-semibold"
                    >
                      Support
                    </button>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(n.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#E2EAF1] text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No notifications at this time.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const SupportView: React.FC<{
  user: User;
}> = ({ user }) => {
  const [subject, setSubject] = useState(
    user.status === UserStatus.LOCKED ? 'Account Verification Assistance (Temporary Lock)' : 'General Account Inquiry'
  );
  const [message, setMessage] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmittedRef(`CASE-${Date.now().toString().slice(-6)}`);
    setMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <HelpCircle size={20} className="text-[#E31B23]" />
          <div>
            <h2 className="text-lg font-display font-bold text-[#263746]">Help & Client Support Desk</h2>
            <p className="text-xs text-slate-500">UsDigital-BMO Account Verification & Assistance</p>
          </div>
        </div>

        {user.status === UserStatus.LOCKED && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
            <p className="font-bold text-[#E31B23] uppercase">Active Account Restriction</p>
            <p>{user.lockReason || CATHERINE_LOCK_NOTICE}</p>
          </div>
        )}

        {submittedRef ? (
          <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-center">
            <CheckCircle2 size={32} className="text-[#16865B] mx-auto" />
            <h3 className="text-base font-display font-bold text-[#263746]">Support Request Recorded</h3>
            <p className="text-xs text-slate-600">
              Reference <span className="font-mono font-bold">{submittedRef}</span> has been logged with our verification support team.
            </p>
            <button
              type="button"
              onClick={() => setSubmittedRef(null)}
              className="px-4 py-2 bg-[#367EAF] text-white text-xs font-semibold rounded-xl"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Inquiry Topic</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-[#263746] outline-none focus:border-[#4A90C6]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Message to Support Team</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your account verification or support question..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-[#263746] outline-none focus:border-[#4A90C6]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#367EAF] hover:bg-[#28658F] text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Send size={15} />
              <span>Send Support Inquiry</span>
            </button>
          </form>
        )}
      </div>

      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-display font-bold text-[#263746]">Direct Support Channels</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1] flex items-start gap-3">
              <Phone size={16} className="text-[#263746] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#263746]">Verification Desk Telephone</p>
                <p className="font-mono text-slate-600 mt-0.5">+1 (800) 555-0194</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1] flex items-start gap-3">
              <Mail size={16} className="text-[#263746] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#263746]">Client Support Email</p>
                <p className="font-mono text-slate-600 mt-0.5">{`support@${APP_DOMAIN}`}</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F3F7FB] border border-[#E2EAF1] flex items-start gap-3">
              <Building2 size={16} className="text-[#263746] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#263746]">Compliance Review Hours</p>
                <p className="text-slate-600 mt-0.5">Monday – Friday, 08:00 – 20:00 EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
