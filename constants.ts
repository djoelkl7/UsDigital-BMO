export const CATHERINE_LOCK_NOTICE =
  'Your account is temporarily locked due to a high-value deposit activity. Please contact the bank’s support team for assistance with account verification.';

export interface AvatarStyleArchetype {
  id: string;
  name: string;
  badge: string;
  description: string;
  lighting: string;
  attire: string;
  assetUrl: string;
  promptTemplate: (name: string) => string;
}

export const AVATAR_STYLE_ARCHETYPES: AvatarStyleArchetype[] = [
  {
    id: 'executive_portrait',
    name: 'Private Banking Portrait',
    badge: 'PRIVATE BANKING',
    description: 'Charcoal wool suit with balanced morning-blue studio backdrop',
    lighting: 'Balanced soft studio lighting on morning blue backdrop',
    attire: 'Tailored charcoal suit, crisp white collar',
    assetUrl: '/src/assets/images/dolmat_bin_avatar_1791242922162.jpg',
    promptTemplate: (name: string) =>
      `Corporate banking headshot portrait of ${name}, tailored charcoal suit, neutral studio lighting on morning blue background, high resolution 1:1`
  },
  {
    id: 'wealth_director',
    name: 'Executive Wealth Portrait',
    badge: 'WEALTH',
    description: 'Morning blue blazer with soft studio rim lighting',
    lighting: 'Warm studio lighting with clean neutral backdrop',
    attire: 'Morning blue blazer, understated executive styling',
    assetUrl: '/src/assets/images/sarah_lee_avatar_1791242931296.jpg',
    promptTemplate: (name: string) =>
      `Corporate banking headshot portrait of ${name}, tailored morning blue blazer, clean warm studio lighting, neutral background, high resolution 1:1`
  },
  {
    id: 'security_officer',
    name: 'Security Compliance Officer',
    badge: 'COMPLIANCE',
    description: 'Formal tailored blazer with cool institutional lighting',
    lighting: 'Balanced studio key light on slate backdrop',
    attire: 'Formal slate-blue suit with understated lapel pin',
    assetUrl: '/src/assets/images/admin_master_avatar_1791242940520.jpg',
    promptTemplate: (name: string) =>
      `Corporate security director headshot of ${name}, formal slate blazer, clean studio lighting, high resolution 1:1`
  },
  {
    id: 'institutional_client',
    name: 'Institutional Client',
    badge: 'INSTITUTIONAL',
    description: 'Tailored cashmere jacket, classic banking portrait',
    lighting: 'Warm architectural studio light',
    attire: 'Tailored jacket, crisp shirt',
    assetUrl: '/src/assets/images/sovereign_avatar_1791242949331.jpg',
    promptTemplate: (name: string) =>
      `Corporate executive portrait of ${name}, tailored jacket, warm studio lighting, neutral backdrop, 1:1`
  }
];

export const PASSPORT_PHOTO_PRESETS = [
  { name: 'Executive Portrait', url: '/src/assets/images/dolmat_bin_avatar_1791242922162.jpg', tag: 'PERSONAL' },
  { name: 'Wealth Portrait', url: '/src/assets/images/sarah_lee_avatar_1791242931296.jpg', tag: 'WEALTH' },
  { name: 'Compliance Portrait', url: '/src/assets/images/admin_master_avatar_1791242940520.jpg', tag: 'COMPLIANCE' },
  { name: 'Institutional Crest', url: '/src/assets/images/sovereign_avatar_1791242949331.jpg', tag: 'CORPORATE' }
];

export const TRANSLATIONS = {
  EN: {
    welcome: 'Welcome back',
    balance: 'Available Balance',
    transfer: 'Payments',
    payBills: 'Pay Bills',
    applyLoan: 'Credit Facilities',
    history: 'Transactions',
    analytics: 'Account Overview',
    logout: 'Sign Out',
    accounts: 'Accounts',
    settings: 'Security',
    demoMode: 'Administrative Override',
    status: 'Status',
    role: 'Account Type',
    action: 'Actions'
  },
  ES: {
    welcome: 'Bienvenido de nuevo',
    balance: 'Saldo Disponible',
    transfer: 'Pagos',
    payBills: 'Pagar Facturas',
    applyLoan: 'Créditos',
    history: 'Transacciones',
    analytics: 'Resumen',
    logout: 'Cerrar Sesión',
    accounts: 'Cuentas',
    settings: 'Seguridad',
    demoMode: 'Modo Administrativo',
    status: 'Estado',
    role: 'Tipo de Cuenta',
    action: 'Acciones'
  },
  FR: {
    welcome: 'Bon retour',
    balance: 'Solde Disponible',
    transfer: 'Paiements',
    payBills: 'Payer Factures',
    applyLoan: 'Crédits',
    history: 'Transactions',
    analytics: 'Aperçu du Compte',
    logout: 'Déconnexion',
    accounts: 'Comptes',
    settings: 'Sécurité',
    demoMode: 'Mode Administrateur',
    status: 'Statut',
    role: 'Type de Compte',
    action: 'Actions'
  }
};
