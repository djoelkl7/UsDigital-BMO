import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const distImagesDir = path.join(distDir, 'src', 'assets', 'images');
const srcImagesDir = path.join(rootDir, 'src', 'assets', 'images');
const stagingDir = path.join(rootDir, 'cpanel-upload');
const zipPath = path.join(rootDir, 'UsDigital-BMO-CPANEL-PRODUCTION.zip');

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

// Mirror src/assets/images inside dist/ as well so both Express static and any static server resolve them
if (fs.existsSync(srcImagesDir)) {
  fs.mkdirSync(distImagesDir, { recursive: true });
  fs.cpSync(srcImagesDir, distImagesDir, { recursive: true });
}

// Recreate clean cpanel-upload staging folder
fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(path.join(stagingDir, 'src', 'assets'), { recursive: true });

fs.cpSync(distDir, path.join(stagingDir, 'dist'), { recursive: true });
if (fs.existsSync(srcImagesDir)) {
  fs.cpSync(srcImagesDir, path.join(stagingDir, 'src', 'assets', 'images'), { recursive: true });
}

const filesToCopy = [
  'server.ts',
  'serverData.ts',
  'types.ts',
  'app.mjs',
  'package.json',
  '.env.example',
  'DEPLOYMENT-README.txt'
];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(stagingDir, file));
  }
}

const lockFile = path.join(rootDir, 'package-lock.json');
if (fs.existsSync(lockFile)) {
  fs.copyFileSync(lockFile, path.join(stagingDir, 'package-lock.json'));
}

const htaccessSrc = path.join(rootDir, 'deploy', '.htaccess');
if (fs.existsSync(htaccessSrc)) {
  fs.copyFileSync(htaccessSrc, path.join(stagingDir, '.htaccess'));
}

// Create UsDigital-BMO-CPANEL-PRODUCTION.zip using python3 zipfile (portable across Linux/macOS/CI)
if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath, { force: true });
}

const pyScript = `
import os, sys, zipfile
src_dir = sys.argv[1]
out_zip = sys.argv[2]
with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src_dir):
        for name in files:
            if name == '.DS_Store':
                continue
            full_path = os.path.join(root, name)
            rel_path = os.path.relpath(full_path, src_dir)
            zf.write(full_path, rel_path)
`;

try {
  execFileSync('python3', ['-c', pyScript, stagingDir, zipPath], { stdio: 'inherit' });
} catch {
  execFileSync('zip', ['-r', zipPath, '.', '-x', '*.DS_Store'], { cwd: stagingDir, stdio: 'inherit' });
}

console.log(`Created cPanel folder: ${stagingDir}`);
console.log(`Created cPanel archive: ${zipPath}`);
