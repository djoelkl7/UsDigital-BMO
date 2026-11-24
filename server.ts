import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVER_INITIAL_USERS, CATHERINE_LOCK_NOTICE, CATHERINE_CREDENTIAL_HASH } from './serverData';
import { User, UserRole, UserStatus, Transaction } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local .env if present (when invoked directly via tsx/npm start without --env-file)
const localEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(localEnvPath)) {
  for (const rawLine of fs.readFileSync(localEnvPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

function normalizeDomain(value?: string): string {
  if (!value) return '';
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
}

function isInternalHostname(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    !lower ||
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.run.app') ||
    lower.includes('googleusercontent.com') ||
    lower.includes('webcontainer') ||
    lower.startsWith('ais-')
  );
}

const rawEnvUrl = (process.env.SITE_URL || process.env.APP_URL || '').trim();
const envUrlDomain = normalizeDomain(rawEnvUrl);
const DEFAULT_APP_URL =
  rawEnvUrl && envUrlDomain && !isInternalHostname(envUrlDomain)
    ? rawEnvUrl.replace(/\/?$/, '/')
    : 'http://bbmoglobal.online/';
const envDomain = normalizeDomain(process.env.SITE_DOMAIN || process.env.APP_DOMAIN);
const DEFAULT_APP_DOMAIN =
  (envDomain && !isInternalHostname(envDomain) ? envDomain : '') ||
  normalizeDomain(DEFAULT_APP_URL) ||
  'bbmoglobal.online';

const VALID_HOST_HEADER_RE =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?::\d{1,5})?$/i;

function resolveRequestSite(req: Request): { domain: string; origin: string } {
  const rawHost = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  if (rawHost && VALID_HOST_HEADER_RE.test(rawHost)) {
    const hostDomain = normalizeDomain(rawHost);
    if (hostDomain && !isInternalHostname(hostDomain)) {
      const rawProto = (req.get('x-forwarded-proto') || req.protocol || 'http')
        .split(',')[0]
        .trim()
        .toLowerCase();
      const proto = rawProto === 'https' ? 'https' : 'http';
      return {
        domain: hostDomain,
        origin: `${proto}://${rawHost}/`
      };
    }
  }
  return {
    domain: DEFAULT_APP_DOMAIN,
    origin: DEFAULT_APP_URL
  };
}

// Session signing secret held strictly in server memory if not provided via environment
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Password hashing helpers using scrypt with random 16-byte salt
function hashPasscode(passcode: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(passcode, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPasscode(passcode: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(passcode, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

interface TokenPayload {
  jti: string;
  userId: string;
  role: UserRole;
  authMethod: string;
  iat: number;
  exp: number;
}

// Server-side in-memory store (zero passwords stored on User objects)
const serverUsers: User[] = structuredClone(SERVER_INITIAL_USERS);
const credentialHashes = new Map<string, string>(); // userId -> salt:scryptHash
const activeSessions = new Map<string, TokenPayload>(); // jti -> session payload
const revokedTokens = new Set<string>();
const authAttemptsByIp = new Map<string, { count: number; resetAt: number }>();
let bootstrapClaimed = false;

// Server-side authentication initialization process
function initializeServerAuth() {
  const demoPass = process.env.DEMO_PASSCODE?.trim();
  const adminPass = process.env.ADMIN_PASSCODE?.trim();
  const catherineEnvPass = process.env.CATHERINE_PASSCODE?.trim();

  for (const u of serverUsers) {
    if (u.username === 'Cnelson') {
      // Ensure Catherine Nelson is enrolled with PERSONAL role, LOCKED status, and salted scrypt hash
      u.role = UserRole.PERSONAL;
      u.status = UserStatus.LOCKED;
      u.lockReason = CATHERINE_LOCK_NOTICE;
      credentialHashes.set(u.id, catherineEnvPass ? hashPasscode(catherineEnvPass) : CATHERINE_CREDENTIAL_HASH);
    } else if (u.role === UserRole.ADMIN) {
      if (adminPass) {
        credentialHashes.set(u.id, hashPasscode(adminPass));
      }
    } else if (demoPass) {
      credentialHashes.set(u.id, hashPasscode(demoPass));
    }
  }
}
initializeServerAuth();

function getEnvCredentialFlags() {
  const demoConfigured = Boolean(process.env.DEMO_PASSCODE?.trim());
  const adminConfigured = Boolean(process.env.ADMIN_PASSCODE?.trim());
  return { demoConfigured, adminConfigured };
}

function isAuthInitialized(): boolean {
  const { demoConfigured, adminConfigured } = getEnvCredentialFlags();
  return bootstrapClaimed || demoConfigured || adminConfigured;
}

// Verify credentials independently per user role using hashed credentials only
function verifyUserPassword(user: User, candidate: string): boolean {
  if (!candidate) return false;
  const stored = credentialHashes.get(user.id);
  if (!stored) return false;
  return verifyPasscode(candidate, stored);
}

function signSessionToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySessionToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed.jti || !parsed.userId || !parsed.exp) return null;
    if (revokedTokens.has(parsed.jti)) return null;
    const serverSession = activeSessions.get(parsed.jti);
    if (!serverSession || serverSession.userId !== parsed.userId) return null;
    if (Date.now() > serverSession.exp) {
      activeSessions.delete(parsed.jti);
      return null;
    }
    return serverSession;
  } catch {
    return null;
  }
}

function checkRateLimit(req: Request): boolean {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  if (authAttemptsByIp.size > 2000) {
    for (const [key, val] of authAttemptsByIp) {
      if (now > val.resetAt) authAttemptsByIp.delete(key);
    }
  }
  const entry = authAttemptsByIp.get(ip);
  if (!entry || now > entry.resetAt) {
    authAttemptsByIp.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 40) {
    return false;
  }
  entry.count += 1;
  return true;
}

interface AuthenticatedRequest extends Request {
  auth?: TokenPayload;
  authUser?: User;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const token = header.slice('Bearer '.length).trim();
  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
  const user = serverUsers.find(u => u.id === payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Account not found for active session.' });
  }
  req.auth = payload;
  req.authUser = user;
  next();
}

function sanitizeUser(user: User): User {
  return structuredClone(user);
}

function findUserByIdentifier(identifier: string): User | undefined {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return undefined;
  return serverUsers.find(
    u =>
      u.username.toLowerCase() === normalized ||
      (u.email && u.email.toLowerCase() === normalized)
  );
}

function issueAuthenticatedSession(user: User, authMethod: string, rememberMe: boolean) {
  const now = Date.now();
  const ttlMs = rememberMe ? 4 * 60 * 60 * 1000 : 30 * 60 * 1000;
  const expiresAt = now + ttlMs;
  const payload: TokenPayload = {
    jti: crypto.randomUUID(),
    userId: user.id,
    role: user.role,
    authMethod,
    iat: now,
    exp: expiresAt
  };
  activeSessions.set(payload.jti, payload);
  const token = signSessionToken(payload);

  user.failedLoginAttempts = 0;
  user.loginHistory = [
    {
      id: `lh-${now}`,
      timestamp: new Date(now).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      device: authMethod.includes('Face ID') ? 'Camera Preview (Local Only)' : 'Web Browser',
      location: 'Authenticated Session',
      method: authMethod,
      status: 'Authenticated' as const
    },
    ...(user.loginHistory || [])
  ].slice(0, 15);

  return {
    user: sanitizeUser(user),
    session: {
      token,
      expiresAt,
      issuedAt: now,
      authMethod
    },
    directory: user.role === UserRole.ADMIN ? serverUsers.map(sanitizeUser) : undefined
  };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  // Security headers across all responses
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    if (req.secure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // No-store cache header for API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Health check endpoint for hosting/load-balancer monitoring
  app.get('/api/health', (req: Request, res: Response) => {
    const site = resolveRequestSite(req);
    res.json({
      ok: true,
      service: 'UsDigital-BMO',
      domain: site.domain,
      url: site.origin,
      mode: process.env.NODE_ENV || 'development'
    });
  });

  // Check whether environment passcodes or first-run bootstrap credentials exist (boolean flags only)
  app.get('/api/auth/bootstrap-status', (_req: Request, res: Response) => {
    const { demoConfigured, adminConfigured } = getEnvCredentialFlags();
    res.json({
      initialized: isAuthInitialized(),
      envConfigured: demoConfigured || adminConfigured,
      adminConfigured,
      demoConfigured
    });
  });

  // One-time first-run passcode setup only when environment passcodes are not configured
  app.post('/api/auth/bootstrap', (req: Request, res: Response) => {
    if (!checkRateLimit(req)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
    }
    if (isAuthInitialized()) {
      return res.status(409).json({
        error: 'Security credentials are already initialized. Sign in with your configured passcode.'
      });
    }

    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (passcode.length < 8 || passcode.length > 128) {
      return res.status(400).json({
        error: 'Please choose a passcode between 8 and 128 characters.'
      });
    }

    for (const user of serverUsers) {
      if (!credentialHashes.has(user.id)) {
        credentialHashes.set(user.id, hashPasscode(passcode));
      }
    }
    bootstrapClaimed = true;

    return res.status(201).json({
      initialized: true,
      message: 'Session credentials initialized and hashed securely on the server.'
    });
  });

  // Standard Username/Email + Password authentication
  app.post('/api/auth/login', (req: Request, res: Response) => {
    if (!checkRateLimit(req)) {
      return res.status(429).json({ error: 'Too many authentication attempts. Please wait a few minutes.' });
    }
    if (!isAuthInitialized()) {
      return res.status(428).json({
        error: 'Initial security setup required before signing in.'
      });
    }

    const identifier = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!identifier.trim() || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const user = findUserByIdentifier(identifier);
    if (!user || !verifyUserPassword(user, password)) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        user.loginHistory = [
          {
            id: `lh-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
            device: 'Web Session',
            location: 'Client Request',
            method: 'Password Authentication',
            status: 'Failed' as const
          },
          ...(user.loginHistory || [])
        ].slice(0, 15);
      }
      return res.status(401).json({ error: 'Invalid credentials. Please check your username and password.' });
    }

    return res.json(issueAuthenticatedSession(user, 'Password Authentication', rememberMe));
  });

  // Biometric Face ID verification — requires valid server-side credential verification
  app.post('/api/auth/biometric-session', (req: Request, res: Response) => {
    if (!checkRateLimit(req)) {
      return res.status(429).json({ error: 'Too many authentication attempts. Please wait a few minutes.' });
    }
    if (!isAuthInitialized()) {
      return res.status(428).json({
        error: 'Initial security setup required before signing in.'
      });
    }

    const identifier = typeof req.body?.username === 'string' ? req.body.username : '';
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    const biometricFrameVerified = req.body?.biometricFrameVerified === true;
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!biometricFrameVerified) {
      return res.status(400).json({ error: 'Camera face detection check must complete first.' });
    }
    if (!identifier.trim() || !passcode) {
      return res.status(400).json({ error: 'Account username and passcode authorization are required.' });
    }

    const user = findUserByIdentifier(identifier);
    if (!user || !verifyUserPassword(user, passcode)) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        user.loginHistory = [
          {
            id: `lh-${Date.now()}`,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
            device: 'Camera Preview (Local Only)',
            location: 'Client Request',
            method: 'Face ID Verification',
            status: 'Failed' as const
          },
          ...(user.loginHistory || [])
        ].slice(0, 15);
      }
      return res.status(401).json({
        error: 'Biometric verification requires valid account credential verification.'
      });
    }

    if (!user.settings.biometricLogin) {
      return res.status(403).json({
        error: 'Biometric sign-in is disabled in this account’s security settings.'
      });
    }

    return res.json(issueAuthenticatedSession(user, 'Face ID Verification', rememberMe));
  });

  // Non-enumerating Forgot Password endpoint
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    if (!checkRateLimit(req)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' });
    }
    const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
    if (!identifier) {
      return res.status(400).json({ error: 'Please enter a username or email address.' });
    }
    return res.json({
      message:
        'If an enrolled UsDigital-BMO profile matches your entry, recovery instructions have been queued through your registered support channel.'
    });
  });

  // Validate active session
  app.get('/api/auth/session', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    return res.json({
      user: sanitizeUser(user),
      expiresAt: req.auth!.exp,
      authMethod: req.auth!.authMethod
    });
  });

  // Logout & revoke server-side session token
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.auth?.jti) {
      activeSessions.delete(req.auth.jti);
      revokedTokens.add(req.auth.jti);
    }
    return res.json({ ok: true });
  });

  // Change password for authenticated user
  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!currentPassword || !verifyUserPassword(user, currentPassword)) {
      return res.status(401).json({ error: 'Current password verification failed.' });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ error: 'New password must be between 8 and 128 characters.' });
    }

    credentialHashes.set(user.id, hashPasscode(newPassword));
    return res.json({ message: 'Password updated and securely hashed.' });
  });

  // Protected transfer/payment endpoint — enforces LOCKED restriction on server
  app.post('/api/bank/transfer', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const user = req.authUser!;
    if (user.status === UserStatus.LOCKED) {
      return res.status(403).json({
        error: user.lockReason || CATHERINE_LOCK_NOTICE
      });
    }

    const to = typeof req.body?.to === 'string' ? req.body.to.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const amount = Number(req.body?.amount);

    if (!to || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid recipient and positive transfer amount are required.' });
    }
    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient available balance for this transfer.' });
    }
    if (amount > user.settings.transferLimit) {
      return res.status(400).json({
        error: `Transfer exceeds daily limit of $${user.settings.transferLimit.toLocaleString()}.`
      });
    }

    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];
    const displayDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      type: 'DEBIT',
      amount,
      currency: user.currency || 'USD',
      category: 'Transfer',
      transactionTypeLabel: 'Outgoing Transfer',
      description: description || `Transfer to ${to}`,
      date: isoDate,
      displayDate,
      from: user.name,
      to,
      status: 'Settled',
      reference: `TRF-${Date.now().toString().slice(-6)}`,
      isDemo: false
    };

    user.balance -= amount;
    user.transactions = [newTx, ...user.transactions];

    return res.json({ user: sanitizeUser(user), transaction: newTx });
  });

  // Protected user settings/profile update (owner or Admin)
  app.patch('/api/bank/user', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const targetId = typeof req.body?.id === 'string' ? req.body.id : authUser.id;
    if (authUser.role !== UserRole.ADMIN && targetId !== authUser.id) {
      return res.status(403).json({ error: 'Access denied: cannot modify another user profile.' });
    }

    const target = serverUsers.find(u => u.id === targetId);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (req.body?.settings && typeof req.body.settings === 'object') {
      const incomingSettings = req.body.settings as Record<string, unknown>;
      if (typeof incomingSettings.hideBalance === 'boolean') {
        target.settings.hideBalance = incomingSettings.hideBalance;
      }
      if (incomingSettings.analyticsFocus === 'GROWTH' || incomingSettings.analyticsFocus === 'SPENDING') {
        target.settings.analyticsFocus = incomingSettings.analyticsFocus;
      }
      if (typeof incomingSettings.biometricLogin === 'boolean') {
        target.settings.biometricLogin = incomingSettings.biometricLogin;
      }
      if (
        authUser.role === UserRole.ADMIN &&
        typeof incomingSettings.transferLimit === 'number' &&
        Number.isFinite(incomingSettings.transferLimit) &&
        incomingSettings.transferLimit >= 0
      ) {
        target.settings.transferLimit = incomingSettings.transferLimit;
      }
    }
    if (typeof req.body?.passportUrl === 'string') {
      const url = req.body.passportUrl.trim();
      const isSafeAsset =
        url.startsWith('/src/assets/images/') ||
        url.startsWith('/assets/') ||
        /^https:\/\//i.test(url) ||
        /^data:image\/(png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(url);
      if (!isSafeAsset || url.length > 750_000) {
        return res.status(400).json({ error: 'Invalid or oversized portrait image URL.' });
      }
      target.passportUrl = url;
    }
    if (authUser.role === UserRole.ADMIN) {
      if (req.body?.status === UserStatus.ACTIVE || req.body?.status === UserStatus.LOCKED) {
        target.status = req.body.status;
      }
      if (
        typeof req.body?.balance === 'number' &&
        Number.isFinite(req.body.balance) &&
        req.body.balance >= 0
      ) {
        target.balance = req.body.balance;
      }
    }

    return res.json({ user: sanitizeUser(target) });
  });

  // Admin-only user directory endpoint
  app.get('/api/bank/users', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    if (req.authUser!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Administrator clearance required.' });
    }
    return res.json({ users: serverUsers.map(sanitizeUser) });
  });

  // Vite Dev Middleware (dynamically imported so production has zero devDependency requirements)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));
    const distDir = path.resolve(__dirname, 'dist');
    app.use('/src/assets/images', express.static(path.join(distDir, 'src/assets/images')));
    app.use(express.static(distDir, { index: false }));
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'API endpoint not found.' });
    });
    app.use(['/assets', '/src/assets'], (_req, res) => {
      res.status(404).send('Asset not found.');
    });
    const distIndexPath = path.join(distDir, 'index.html');
    app.use((req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method not allowed.' });
      }
      if (!fs.existsSync(distIndexPath)) {
        return res.status(500).send('Production build missing. Run `npm run build` first.');
      }
      const site = resolveRequestSite(req);
      let html = fs.readFileSync(distIndexPath, 'utf8');
      if (site.origin !== 'http://bbmoglobal.online/') {
        html = html.replace(/http:\/\/bbmoglobal\.online\//g, site.origin);
      }
      return res.type('html').send(html);
    });
  }

  const rawPort = process.env.PORT;
  if (rawPort && !/^\d+$/.test(rawPort)) {
    app.listen(rawPort, () => {
      console.log(`UsDigital-BMO server listening on socket ${rawPort}`);
    });
  } else {
    app.listen(PORT, HOST, () => {
      console.log(`UsDigital-BMO server listening on http://${HOST}:${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error('Failed to start UsDigital-BMO server:', err);
  process.exit(1);
});
