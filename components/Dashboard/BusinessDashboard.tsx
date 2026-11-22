import React from 'react';
import { useBank } from '../../context/BankContext';
import { useToast } from '../Toast';
import {
  LayoutGrid,
  Users,
  BarChart3,
  Download,
  Plus,
  Zap,
  ShieldAlert,
  Send
} from 'lucide-react';
import { CashFlowChart } from '../Charts';
import { UserStatus } from '../../types';
import { NavSection } from '../Layout';

export const BusinessDashboard: React.FC<{
  activeSection?: NavSection;
  onTransferClick?: () => void;
}> = ({ activeSection = 'DASHBOARD', onTransferClick }) => {
  const { state } = useBank();
  const { showToast, ToastContainer } = useToast();
  const user = state.currentUser!;

  const cashFlowData = [
    { name: 'Mon', income: 45000, expense: 32000 },
    { name: 'Tue', income: 52000, expense: 38000 },
    { name: 'Wed', income: 48000, expense: 42000 },
    { name: 'Thu', income: 61000, expense: 35000 },
    { name: 'Fri', income: 55000, expense: 44000 }
  ];

  const handleBulkPayment = () => {
    if (user.status === UserStatus.LOCKED) {
      showToast(user.lockReason || 'Commercial account is temporarily locked.', 'error');
      return;
    }
    showToast('Demonstration bulk payout workflow triggered', 'info');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {ToastContainer}

      {user.status === UserStatus.LOCKED && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E31B23] text-white flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#E31B23] uppercase tracking-wider">
              Commercial Account Temporarily Locked
            </p>
            <p className="text-sm text-[#263746] mt-0.5">
              {user.lockReason || 'Account temporarily locked. Please contact UsDigital-BMU support.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-[#E2EAF1] rounded-2xl p-6 space-y-6">
          <div className="bank-card-navy rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-[#DCEAF5] font-semibold uppercase tracking-wider">
                  Commercial Treasury Liquidity (DEMO)
                </p>
                <p className="font-mono text-xs text-[#DCEAF5] mt-1">
                  Account {user.accountNumberMasked || '•••• •••• 4410'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onTransferClick && (
                  <button
                    type="button"
                    onClick={onTransferClick}
                    className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send size={14} />
                    <span>Wire Transfer</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBulkPayment}
                  className="bg-[#E31B23] hover:bg-[#C8161D] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Zap size={14} />
                  <span>Batch Pay</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl px-5 py-4 flex items-center justify-between text-[#263746]">
              <span className="text-xs font-semibold text-[#68798A]">Available Liquidity (USD)</span>
              <p className="text-2xl md:text-3xl font-display font-bold font-mono tabular-nums">
                {user.settings.hideBalance
                  ? '••••••••'
                  : `$${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {user.subAccounts?.map(sub => (
              <div
                key={sub.id}
                className="bg-[#F3F7FB] border border-[#E2EAF1] p-4 rounded-xl hover:border-[#4A90C6] transition-colors"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-semibold text-[#28658F] uppercase tracking-wider">
                    {sub.type}
                  </span>
                  <LayoutGrid size={14} className="text-[#4A90C6]" />
                </div>
                <h4 className="font-semibold text-sm text-[#263746]">{sub.name}</h4>
                <p className="text-lg font-display font-bold text-[#263746] font-mono tabular-nums mt-1">
                  ${sub.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#E2EAF1] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-[#263746] flex items-center gap-2">
              <BarChart3 size={18} className="text-[#4A90C6]" />
              <span>Cash Flow (Demo)</span>
            </h3>
            <p className="text-xs text-[#68798A] mt-0.5">Sample month-to-date movement</p>

            <div className="space-y-4 my-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#68798A]">Inflows</span>
                <span className="text-[#16865B] font-mono font-bold tabular-nums">+$240,500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#68798A]">Disbursements</span>
                <span className="text-[#D93025] font-mono font-bold tabular-nums">-$128,400</span>
              </div>
              <div className="h-2.5 bg-[#DCEAF5] rounded-full overflow-hidden">
                <div className="h-full bg-[#4A90C6] w-[65%] rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => showToast('Sub-account inquiry logged in demonstration view', 'info')}
              className="w-full flex items-center justify-center gap-2 bg-[#367EAF] hover:bg-[#28658F] text-white py-3 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus size={15} />
              <span>Request Sub-Account</span>
            </button>
            <button
              type="button"
              onClick={() => showToast('Demonstration treasury report exported', 'success')}
              className="w-full flex items-center justify-center gap-2 border border-[#E2EAF1] hover:bg-[#F3F7FB] text-[#263746] py-3 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download size={15} />
              <span>Export Summary</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${
          activeSection === 'ACCOUNT_OVERVIEW' ? 'ring-2 ring-[#4A90C6]/25 rounded-2xl' : ''
        }`}
      >
        <div className="lg:col-span-2 bg-white border border-[#E2EAF1] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-base text-[#263746]">Cash Movement (Sample)</h3>
            <span className="text-xs text-[#68798A]">Weekly inflow vs. outflow</span>
          </div>
          <CashFlowChart data={cashFlowData} />
        </div>

        <div className="bg-white border border-[#E2EAF1] p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-base text-[#263746]">Payroll Allocation</h3>
            <Users size={18} className="text-[#4A90C6]" />
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#367EAF] text-white rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#DCEAF5] font-semibold uppercase">Scheduled Run</p>
                <p className="font-semibold text-sm mt-0.5">Sample Cycle</p>
              </div>
              <p className="text-lg font-display font-bold font-mono tabular-nums">$12,450.00</p>
            </div>

            <div className="p-4 bg-[#F3F7FB] rounded-xl border border-[#E2EAF1] space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#68798A]">Operations</span>
                <span className="font-semibold text-[#263746] font-mono tabular-nums">$45,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68798A]">Client Services</span>
                <span className="font-semibold text-[#263746] font-mono tabular-nums">$22,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#68798A]">Administration</span>
                <span className="font-semibold text-[#263746] font-mono tabular-nums">$30,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
