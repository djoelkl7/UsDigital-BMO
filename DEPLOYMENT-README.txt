UsDigital-BMO — Production Deployment Guide (cPanel & Hostinger)
================================================================

CONFIGURED DOMAIN: http://bbmoglobal.online/
(Automatically adapts to any custom domain or subdomain you assign in cPanel.)


IMPORTANT ARCHITECTURE NOTE
---------------------------
UsDigital-BMO is a full-stack Node.js (Express 5) + pre-built Vite React
application. Express serves the pre-compiled frontend (`dist/`) AND handles
server-side authentication, HMAC session tokens, `/api/auth/*`, `/api/bank/*`,
`/api/health`, logo (`/assets/aistudio/IMG_9215_0abfc822.jpeg`), and portrait
assets (`/src/assets/images/*`).

Do NOT upload this archive as a plain static HTML site without Node.js runtime;
authentication and banking API endpoints require the Node.js Express server.


PACKAGE CONTENTS (Inside UsDigital-BMO-CPANEL-PRODUCTION.zip)
-------------------------------------------------------------
- dist/                 Pre-built production React + Vite frontend bundle
- src/assets/images/    Local portrait and avatar assets served by Express
- server.ts             Express 5 server & authentication API
- serverData.ts         Server-side profile & credential initialization data
- types.ts              Shared TypeScript definitions
- app.mjs               Node.js ESM startup file (for cPanel Passenger / Node CLI)
- package.json          Production dependencies & start script
- .env.example          Environment variable template (DO NOT deploy with empty secrets)
- .htaccess             Apache/LiteSpeed security headers, compression & cache rules


REQUIRED ENVIRONMENT VARIABLES (CONFIGURE IN cPanel OR `.env`)
--------------------------------------------------------------
Never store real passcodes inside frontend files.
Configure these variables in cPanel ("Setup Node.js App" -> Environment Variables),
or copy `.env.example` to `.env` inside your application root:

  NODE_ENV=production
  PORT=3000                     (cPanel Passenger injects PORT automatically)
  APP_URL=http://bbmoglobal.online/
  APP_DOMAIN=bbmoglobal.online
  SESSION_SECRET=<64-char random hex secret>
  ADMIN_PASSCODE=<strong administrator passcode>
  DEMO_PASSCODE=<strong user passcode>
  CATHERINE_PASSCODE=<optional override for Cnelson profile passcode>

NOTE: If you attach a different domain in cPanel (e.g. yourdomain.com),
UsDigital-BMO automatically uses that active domain for requests, OpenGraph
URLs, and support emails—or you can explicitly set `APP_URL` and `APP_DOMAIN`.


EASIEST cPanel UPLOAD ("Setup Node.js App" / Phusion Passenger)
---------------------------------------------------------------
1. Log in to cPanel -> File Manager.
2. Create an application folder OUTSIDE `public_html`, e.g.:
     `/home/<username>/usdigital-bmo`
3. Upload `UsDigital-BMO-CPANEL-PRODUCTION.zip` into `/home/<username>/usdigital-bmo`
   and click "Extract" in File Manager.
4. Open cPanel -> "Setup Node.js App" -> "Create Application":
   - Node.js version:        20.x or 22.x (LTS recommended)
   - Application mode:       Production
   - Application root:       /home/<username>/usdigital-bmo
   - Application URL:        bbmoglobal.online  (or any domain you added in cPanel)
   - Application startup file: app.mjs
5. Under "Environment Variables", add:
   - NODE_ENV = production
   - APP_URL = http://bbmoglobal.online/
   - APP_DOMAIN = bbmoglobal.online
   - SESSION_SECRET = <secure random string>
   - ADMIN_PASSCODE = <your admin passcode>
   - DEMO_PASSCODE = <your user passcode>
   - (Optional) CATHERINE_PASSCODE = <custom passcode for Cnelson>
6. Click "Run NPM Install" (installs Express + tsx production dependencies).
7. Click "Restart" / "Start App".
8. Keep the Phusion Passenger lines that cPanel adds to your domain's `.htaccess`
   intact. Do NOT add static RewriteRules that intercept `/api/*` routes.


POST-DEPLOYMENT VERIFICATION CHECKLIST
--------------------------------------
1. Health endpoint:
     GET http://bbmoglobal.online/api/health
     Expected HTTP 200: {"ok":true,"service":"UsDigital-BMO","domain":"bbmoglobal.online",...}
2. Frontend load:
     GET http://bbmoglobal.online/
     Expected HTTP 200 with UsDigital-BMO login screen and BMO logo.
3. Logo & profile image assets:
     GET http://bbmoglobal.online/assets/aistudio/IMG_9215_0abfc822.jpeg
     GET http://bbmoglobal.online/src/assets/images/catherine_nelson_passport.jpg
     Expected HTTP 200.
4. Authentication check:
     Sign in via UI (or POST /api/auth/login) and confirm dashboard loads,
     session expires/logs out cleanly, and LOCKED profiles block outgoing transfers.
