UsDigital-BMU — Production Deployment Guide (cPanel & Hostinger)
================================================================

IMPORTANT ARCHITECTURE NOTE
---------------------------
UsDigital-BMU is a full-stack Node.js (Express 5) + pre-built Vite React
application. Express serves the pre-compiled frontend (`dist/`) AND handles
server-side authentication, HMAC session tokens, `/api/auth/*`, `/api/bank/*`,
`/api/health`, and local image assets (`/src/assets/images/*`).

Do NOT upload this archive as a plain static HTML site without Node.js runtime;
authentication and banking API endpoints require the Node.js Express server.


PACKAGE CONTENTS
----------------
- dist/                 Pre-built production React + Vite frontend bundle
- src/assets/images/    Local portrait and avatar assets served by Express
- server.ts             Express 5 server & authentication API
- serverData.ts         Server-side profile & credential initialization data
- types.ts              Shared TypeScript definitions
- app.mjs               Node.js ESM startup file (for cPanel Passenger / Node CLI)
- package.json          Production dependencies & start script
- package-lock.json     Locked dependency graph for deterministic npm ci
- .env.example          Environment variable template (DO NOT deploy with empty secrets)
- .htaccess             Apache/LiteSpeed security headers, compression & cache rules


REQUIRED ENVIRONMENT VARIABLES (CONFIGURE IN HOSTING PANEL OR SERVER .env)
--------------------------------------------------------------------------
Never commit `.env` to Git or store real passcodes inside frontend files.
Configure these variables in cPanel ("Setup Node.js App" -> Environment Variables),
Hostinger Node.js App Settings, or a server-only `.env` file outside public_html:

  NODE_ENV=production
  PORT=3000                     (Host/Passenger may inject PORT automatically)
  SESSION_SECRET=<64-char random hex secret>
  ADMIN_PASSCODE=<strong administrator passcode>
  DEMO_PASSCODE=<strong demo user passcode>
  CATHERINE_PASSCODE=<optional override for Cnelson profile passcode>


OPTION A — cPanel DEPLOYMENT ("Setup Node.js App" / Phusion Passenger)
----------------------------------------------------------------------
1. Log in to cPanel -> File Manager.
2. Create an application directory OUTSIDE `public_html` (recommended), e.g.:
     `/home/<username>/usdigital-bmu`
3. Upload `UsDigital-BMO-CPANEL-PRODUCTION.zip` into that directory and click Extract.
4. Open cPanel -> "Setup Node.js App" -> "Create Application":
   - Node.js version:      20.x or 22.x (LTS recommended)
   - Application mode:     Production
   - Application root:     /home/<username>/usdigital-bmu
   - Application URL:      Your target domain or subdomain
   - Application startup file: app.mjs
5. Under "Environment Variables", add:
   - NODE_ENV = production
   - SESSION_SECRET = <secure random string>
   - ADMIN_PASSCODE = <your admin passcode>
   - DEMO_PASSCODE = <your demo passcode>
   - (Optional) CATHERINE_PASSCODE = <custom passcode for Cnelson>
6. Click "Run NPM Install" (installs production dependencies from package-lock.json).
7. Click "Restart" / "Start App".
8. Note: Keep the Passenger directives that cPanel appends to your domain's `.htaccess`
   intact. Only merge the security/caching blocks from the included `.htaccess` if desired.


OPTION B — HOSTINGER DEPLOYMENT (Node.js Web App / Cloud / VPS)
-----------------------------------------------------------------
1. In Hostinger hPanel (Node.js Web App) or via SSH/SFTP on Cloud/VPS:
   Upload and extract `UsDigital-BMO-CPANEL-PRODUCTION.zip` into your app folder.
2. Ensure Node.js 20 LTS or 22 LTS is selected.
3. Configure Environment Variables in hPanel (or create `.env` from `.env.example`):
   NODE_ENV, SESSION_SECRET, ADMIN_PASSCODE, DEMO_PASSCODE (and optional CATHERINE_PASSCODE).
4. Set the install & start commands (or run via SSH/PM2):
   - Install command:  npm ci --omit=dev
   - Start command:    npm start   (or `node app.mjs`)
5. If using a reverse proxy (Nginx / Apache / OpenLiteSpeed) on VPS, proxy all
   requests (/, /api/*, /assets/*, /src/assets/images/*) to `http://127.0.0.1:3000`.


POST-DEPLOYMENT VERIFICATION CHECKLIST
--------------------------------------
1. Health endpoint:
     GET https://<your-domain>/api/health
     Expected HTTP 200: {"ok":true,"service":"UsDigital-BMU","mode":"production"}
2. Frontend load:
     GET https://<your-domain>/
     Expected HTTP 200 with UsDigital-BMU login screen.
3. Profile image asset:
     GET https://<your-domain>/src/assets/images/catherine_nelson_passport.jpg
     Expected HTTP 200.
4. Authentication check:
     Sign in via UI (or POST /api/auth/login) and confirm dashboard loads,
     session expires/logs out cleanly, and LOCKED profiles block outgoing transfers.
