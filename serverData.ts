import { User, UserRole, UserStatus } from './types';

export const CATHERINE_LOCK_NOTICE =
  'Your account is temporarily locked due to a high-value deposit activity. Please contact the bank’s support team for assistance with account verification.';

// Server-only salted scrypt hash (16-byte salt : 64-byte scrypt key) for Catherine Nelson demo profile
export const CATHERINE_CREDENTIAL_HASH =
  '65ea40ac430d419d23f9ac0f37f92276:4d41d4d568a348fe4ef0060b5744d620425090c4f397e4b71f031ea42a8b7414e410991caca0ac195e33e446714e3ca3c0661acde3a42eb16635832a5d3d392f';

const SERVER_DOMAIN =
  (process.env.APP_DOMAIN || process.env.APP_URL || 'bbmoglobal.online')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '') || 'bbmoglobal.online';

// Server-only demonstration user directory (never bundled into client code)
export const SERVER_INITIAL_USERS: User[] = [
  {
    id: '5',
    username: 'Cnelson',
    name: 'Catherine Nelson',
    role: UserRole.PERSONAL,
    accountTypeLabel: 'Personal Banking',
    currency: 'USD',
    status: UserStatus.LOCKED,
    lockReason: CATHERINE_LOCK_NOTICE,
    balance: 4670000.0,
    failedLoginAttempts: 0,
    passportUrl: '/src/assets/images/catherine_nelson_passport.jpg',
    idNumber: 'USB-774920-P',
    accountNumberMasked: '•••• •••• 8379',
    routingNumber: '021000021',
    email: `catherine.nelson@${SERVER_DOMAIN}`,
    isDemoProfile: false,
    transactions: [
      {
        id: 't-cn-2',
        type: 'CREDIT',
        amount: 2870000.0,
        currency: 'USD',
        category: 'Wire Transfer',
        transactionTypeLabel: 'Wire Transfer',
        description: 'Corporate Wire Transfer — Los Angeles',
        date: '2026-11-20',
        displayDate: '20/11/2026',
        from: 'Nestlé Food',
        sampleSenderLabel: 'Nestlé Food',
        to: 'Catherine Nelson',
        status: 'Settled',
        reference: 'WIR-20261120-002',
        isDemo: false
      },
      {
        id: 't-cn-1',
        type: 'CREDIT',
        amount: 1800000.0,
        currency: 'USD',
        category: 'Check Deposit',
        transactionTypeLabel: 'Check Deposit',
        description: 'Check Deposit',
        date: '2026-11-20',
        displayDate: '20/11/2026',
        from: 'Clearing Desk',
        to: 'Catherine Nelson',
        status: 'Settled',
        reference: 'CHK-20261120-001',
        isDemo: false
      }
    ],
    loans: [],
    recurringPayments: [],
    beneficiaries: [
      {
        id: 'ben-1',
        name: 'Pacific Escrow Holdings',
        bankName: 'First Republic Clearing',
        accountMask: '•••• 4418',
        routingNumber: '121000358',
        type: 'Domestic Wire',
        isDemo: false
      },
      {
        id: 'ben-2',
        name: 'West Coast Property Trust',
        bankName: 'Metro Commercial Bank',
        accountMask: '•••• 9021',
        routingNumber: '026009593',
        type: 'ACH Transfer',
        isDemo: false
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        title: 'Security Alert: Account Temporarily Locked',
        message: CATHERINE_LOCK_NOTICE,
        date: '20/11/2026',
        severity: 'ALERT',
        read: false
      },
      {
        id: 'notif-2',
        title: 'High-Value Deposit Activity Recorded',
        message:
          'Two incoming credits totaling +$4,670,000.00 USD (20/11/2026) are under standard verification review.',
        date: '20/11/2026',
        severity: 'WARNING',
        read: false
      }
    ],
    loginHistory: [
      {
        id: 'lh-1',
        timestamp: '20/11/2026 · 09:42 PST',
        device: 'Desktop Browser (Chrome)',
        location: 'Los Angeles, CA',
        method: 'Password Authentication',
        status: 'Authenticated'
      }
    ],
    settings: {
      hideBalance: false,
      analyticsFocus: 'GROWTH',
      transferLimit: 250000,
      biometricLogin: true
    }
  },
  {
    id: '2',
    username: 'SarahLee',
    name: 'Sarah Lee',
    role: UserRole.PERSONAL,
    accountTypeLabel: 'Personal Banking',
    currency: 'USD',
    status: UserStatus.ACTIVE,
    balance: 24580.75,
    failedLoginAttempts: 0,
    passportUrl: '/src/assets/images/sarah_lee_avatar_1791242931296.jpg',
    idNumber: 'USB-492108-P',
    accountNumberMasked: '•••• •••• 3104',
    routingNumber: '021000021',
    email: `sarah.lee@${SERVER_DOMAIN}`,
    isDemoProfile: false,
    transactions: [
      {
        id: 't2',
        type: 'CREDIT',
        amount: 5000,
        currency: 'USD',
        category: 'Salary',
        transactionTypeLabel: 'Direct Deposit',
        description: 'Monthly Payroll Deposit',
        date: '2026-11-01',
        displayDate: '01/11/2026',
        from: 'Northstar Systems',
        to: 'Sarah Lee',
        status: 'Settled',
        reference: 'PAY-20261101-011',
        isDemo: false
      },
      {
        id: 't3',
        type: 'DEBIT',
        amount: 120,
        currency: 'USD',
        category: 'Dining',
        transactionTypeLabel: 'Debit Card',
        description: 'City Roast Coffee House',
        date: '2026-11-05',
        displayDate: '05/11/2026',
        from: 'Sarah Lee',
        to: 'City Roast Coffee',
        status: 'Settled',
        reference: 'POS-20261105-019',
        isDemo: false
      }
    ],
    loans: [],
    recurringPayments: [],
    beneficiaries: [],
    notifications: [],
    loginHistory: [],
    settings: {
      hideBalance: false,
      analyticsFocus: 'SPENDING',
      transferLimit: 5000,
      biometricLogin: true
    }
  },
  {
    id: '3',
    username: 'NovaCorp',
    name: 'Nova Corporation',
    role: UserRole.BUSINESS,
    accountTypeLabel: 'Commercial Treasury',
    currency: 'USD',
    status: UserStatus.ACTIVE,
    balance: 1280450.0,
    failedLoginAttempts: 0,
    passportUrl: '/src/assets/images/sovereign_avatar_1791242949331.jpg',
    idNumber: 'USB-994112-C',
    accountNumberMasked: '•••• •••• 4410',
    routingNumber: '021000021',
    email: 'treasury@novacorp.com',
    isDemoProfile: false,
    subAccounts: [
      { id: 's1', name: 'Main Operating', balance: 1000000.0, type: 'CHECKING' },
      { id: 's2', name: 'Payroll Reserve', balance: 250000.0, type: 'PAYROLL' },
      { id: 's3', name: 'Tax Savings', balance: 30450.0, type: 'SAVINGS' }
    ],
    transactions: [],
    loans: [],
    recurringPayments: [],
    beneficiaries: [],
    notifications: [],
    loginHistory: [],
    settings: {
      hideBalance: false,
      analyticsFocus: 'GROWTH',
      transferLimit: 500000,
      biometricLogin: false
    }
  },
  {
    id: '4',
    username: 'AdminMaster',
    name: 'Super Admin',
    role: UserRole.ADMIN,
    accountTypeLabel: 'Compliance Oversight',
    currency: 'USD',
    status: UserStatus.ACTIVE,
    balance: 0,
    failedLoginAttempts: 0,
    passportUrl: '/src/assets/images/admin_master_avatar_1791242940520.jpg',
    idNumber: 'USB-SEC-000001-A',
    email: `admin.ops@${SERVER_DOMAIN}`,
    isDemoProfile: false,
    transactions: [],
    loans: [],
    recurringPayments: [],
    beneficiaries: [],
    notifications: [],
    loginHistory: [],
    settings: {
      hideBalance: false,
      analyticsFocus: 'GROWTH',
      transferLimit: 0,
      biometricLogin: true
    }
  }
];
