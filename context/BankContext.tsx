import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { BankState, Action, User, UserRole, UserStatus, Transaction } from '../types';

const initialState: BankState = {
  currentUser: null,
  session: null,
  allUsers: [],
  enterpriseACCOUNTSMode: false,
  language: 'EN'
};

const BankContext = createContext<{
  state: BankState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

function bankReducer(state: BankState, action: Action): BankState {
  switch (action.type) {
    case 'LOGIN': {
      const loggedUser = action.payload.user;
      const directory = action.payload.directory;
      const syncedUsers =
        loggedUser.role === UserRole.ADMIN && Array.isArray(directory) && directory.length > 0
          ? directory
          : [loggedUser];
      return {
        ...state,
        currentUser: loggedUser,
        session: action.payload.session,
        allUsers: syncedUsers
      };
    }
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        session: null,
        allUsers: []
      };
    case 'TOGGLE_ACCOUNTS_MODE':
      return { ...state, enterpriseACCOUNTSMode: !state.enterpriseACCOUNTSMode };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'UPDATE_USER': {
      if (
        state.currentUser &&
        state.currentUser.role !== UserRole.ADMIN &&
        action.payload.id !== state.currentUser.id
      ) {
        return state;
      }
      const updatedAllUsers = state.allUsers.map(u => (u.id === action.payload.id ? action.payload : u));
      return {
        ...state,
        allUsers: updatedAllUsers,
        currentUser: state.currentUser?.id === action.payload.id ? action.payload : state.currentUser
      };
    }
    case 'CREATE_USER':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: [action.payload, ...state.allUsers]
      };
    case 'DELETE_USER':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: state.allUsers.filter(u => u.id !== action.payload)
      };
    case 'APPROVE_LOAN':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: state.allUsers.map(u => {
          if (u.id === action.payload.userId) {
            const loanIndex = u.loans.findIndex(l => l.id === action.payload.loanId);
            if (loanIndex !== -1) {
              const updatedLoans = [...u.loans];
              const loan = updatedLoans[loanIndex];
              updatedLoans[loanIndex] = { ...loan, status: 'APPROVED' };
              const newBalance = u.balance + loan.amount;
              const newTransaction: Transaction = {
                id: `t-loan-${Date.now()}`,
                type: 'CREDIT',
                amount: loan.amount,
                currency: u.currency || 'USD',
                category: 'Loan',
                transactionTypeLabel: 'Credit Disbursement',
                description: `Credit Facility ${loan.id} Disbursement`,
                date: new Date().toISOString().split('T')[0],
                status: 'Settled',
                reference: `TRF-${loan.id}`,
                isDemo: false
              };
              return {
                ...u,
                balance: newBalance,
                loans: updatedLoans,
                transactions: [newTransaction, ...u.transactions]
              };
            }
          }
          return u;
        })
      };
    case 'REJECT_LOAN':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: state.allUsers.map(u => {
          if (u.id === action.payload.userId) {
            const updatedLoans = u.loans.map(l =>
              l.id === action.payload.loanId ? { ...l, status: 'REJECTED' as const } : l
            );
            return { ...u, loans: updatedLoans };
          }
          return u;
        })
      };
    case 'LOCK_USER':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: state.allUsers.map(u => (u.id === action.payload ? { ...u, status: UserStatus.LOCKED } : u))
      };
    case 'UNLOCK_USER':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: state.allUsers.map(u => (u.id === action.payload ? { ...u, status: UserStatus.ACTIVE } : u))
      };
    case 'ADMIN_UPDATE_BALANCE':
      if (state.currentUser && state.currentUser.role !== UserRole.ADMIN) {
        return state;
      }
      return {
        ...state,
        allUsers: state.allUsers.map(u =>
          u.id === action.payload.userId ? { ...u, balance: action.payload.newBalance } : u
        )
      };
    case 'ADD_RECURRING': {
      if (!state.currentUser || state.currentUser.status === UserStatus.LOCKED) return state;
      const newUserWithRecurring = {
        ...state.currentUser,
        recurringPayments: [...state.currentUser.recurringPayments, action.payload]
      };
      return {
        ...state,
        currentUser: newUserWithRecurring,
        allUsers: state.allUsers.map(u => (u.id === newUserWithRecurring.id ? newUserWithRecurring : u))
      };
    }
    case 'CANCEL_RECURRING': {
      if (!state.currentUser) return state;
      const newUserAfterCancel = {
        ...state.currentUser,
        recurringPayments: state.currentUser.recurringPayments.map(p =>
          p.id === action.payload ? { ...p, status: 'CANCELLED' as const } : p
        )
      };
      return {
        ...state,
        currentUser: newUserAfterCancel,
        allUsers: state.allUsers.map(u => (u.id === newUserAfterCancel.id ? newUserAfterCancel : u))
      };
    }
    case 'UPDATE_SETTINGS': {
      if (!state.currentUser) return state;
      const newUserWithSettings = {
        ...state.currentUser,
        settings: { ...state.currentUser.settings, ...action.payload }
      };
      return {
        ...state,
        currentUser: newUserWithSettings,
        allUsers: state.allUsers.map(u => (u.id === newUserWithSettings.id ? newUserWithSettings : u))
      };
    }
    case 'MARK_NOTIFICATION_READ': {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        notifications: (state.currentUser.notifications || []).map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
      return {
        ...state,
        currentUser: updatedUser,
        allUsers: state.allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
      };
    }
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        notifications: (state.currentUser.notifications || []).map(n => ({ ...n, read: true }))
      };
      return {
        ...state,
        currentUser: updatedUser,
        allUsers: state.allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
      };
    }
    case 'ADD_BENEFICIARY': {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        beneficiaries: [action.payload, ...(state.currentUser.beneficiaries || [])]
      };
      return {
        ...state,
        currentUser: updatedUser,
        allUsers: state.allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
      };
    }
    case 'REMOVE_BENEFICIARY': {
      if (!state.currentUser) return state;
      const updatedUser: User = {
        ...state.currentUser,
        beneficiaries: (state.currentUser.beneficiaries || []).filter(b => b.id !== action.payload)
      };
      return {
        ...state,
        currentUser: updatedUser,
        allUsers: state.allUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
      };
    }
    default:
      return state;
  }
}

export const BankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bankReducer, initialState);

  // Automatic session expiration monitor (keeps token solely in memory)
  useEffect(() => {
    if (!state.session) return;
    const msRemaining = state.session.expiresAt - Date.now();
    if (msRemaining <= 0) {
      dispatch({ type: 'LOGOUT' });
      return;
    }
    const timer = window.setTimeout(() => {
      dispatch({ type: 'LOGOUT' });
    }, msRemaining);
    return () => window.clearTimeout(timer);
  }, [state.session]);

  return <BankContext.Provider value={{ state, dispatch }}>{children}</BankContext.Provider>;
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) throw new Error('useBank must be used within a BankProvider');
  return context;
};
