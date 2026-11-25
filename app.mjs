import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// Prefer pre-compiled production server.mjs when present (avoids runtime esbuild/tsx on shared cPanel)
const compiledServer = path.join(__dirname, 'server.mjs');
if (fs.existsSync(compiledServer)) {
  await import('./server.mjs');
} else {
  await import('tsx');
  await import('./server.ts');
}

