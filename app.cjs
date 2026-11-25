'use strict';

const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
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

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

async function boot() {
  const compiledServer = path.join(__dirname, 'server.mjs');
  if (fs.existsSync(compiledServer)) {
    await import('./server.mjs');
    return;
  }
  await import('tsx');
  await import('./server.ts');
}

boot().catch(err => {
  console.error('Failed to start UsDigital-BMO server:', err);
  process.exit(1);
});
