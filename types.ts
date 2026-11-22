export enum UserRole {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED'
}

export type TransactionStatusLabel = 'Settled' | 'Pending Review' | 'Completed';

export interface Transaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency?: string;
  category: string;
  transactionTypeLabel?: string;
  description: string;
  date: string; // ISO YYYY-MM-DD for sorting/filtering
  displayDate?: string; // DD/MM/YYYY for statement presentation
  to?: string;
  from?: string;
  sampleSenderLabel?: string;
  status?: TransactionStatusLabel;
  reference?: string;
  isDemo?: boolean;
}

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  term: number; // months
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}

export interface SubAccount {
  id: string;
  name: string;
  balance: number;
  type: 'SAVINGS' | 'CHECKING' | 'PAYROLL';
}

export interface RecurringPayment {
  id: string;
  amount: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  duration: number;
  occurences: number;
  description: string;
  nextDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface Beneficiary {
  id: string;
  name: string;
  bankName: string;
  accountMask: string;
  routingNumber: string;
  type: 'Domestic Wire' | 'ACH Transfer' | 'Internal Account';
  isDemo?: boolean;
}

export interface SecurityNotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
  read: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  device: string;
  location: string;
  method: string;
  status: 'Authenticated' | 'Failed' | 'Expired';
}

export interface UserSettings {
  hideBalance: boolean;
  analyticsFocus: 'GROWTH' | 'SPENDING';
  transferLimit: number;
  biometricLogin: boolean;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  accountTypeLabel?: string;
  currency?: string;
  status: UserStatus;
  balance: number;
  transactions: Transaction[];
  loans: Loan[];
  recurringPayments: RecurringPayment[];
  beneficiaries?: Beneficiary[];
  notifications?: SecurityNotificationItem[];
  loginHistory?: LoginHistoryEntry[];
  settings: UserSettings;
  subAccounts?: SubAccount[];
  failedLoginAttempts: number;
  passportUrl?: string;
  idNumber?: string;
  accountNumberMasked?: string;
  routingNumber?: string;
  email?: string;
  lockReason?: string;
  isDemoProfile?: boolean;
}

export interface SessionInfo {
  token: string;
  expiresAt: number;
  authMethod: string;
  issuedAt: number;
}

export interface BankState {
  currentUser: User | null;
  session: SessionInfo | null;
  allUsers: User[];
  enterpriseACCOUNTSMode: boolean;
  language: 'EN' | 'ES' | 'FR';
}

export type Action =
  | { type: 'LOGIN'; payload: { user: User; session: SessionInfo; directory?: User[] } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CREATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: UserSettings }
  | { type: 'TOGGLE_ACCOUNTS_MODE' }
  | { type: 'SET_LANGUAGE'; payload: 'EN' | 'ES' | 'FR' }
  | { type: 'APPROVE_LOAN'; payload: { loanId: string; userId: string } }
  | { type: 'REJECT_LOAN'; payload: { loanId: string; userId: string } }
  | { type: 'LOCK_USER'; payload: string }
  | { type: 'UNLOCK_USER'; payload: string }
  | { type: 'ADMIN_UPDATE_BALANCE'; payload: { userId: string; newBalance: number } }
  | { type: 'ADD_RECURRING'; payload: RecurringPayment }
  | { type: 'CANCEL_RECURRING'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_BENEFICIARY'; payload: Beneficiary }
  | { type: 'REMOVE_BENEFICIARY'; payload: string };
