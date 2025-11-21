import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy apps/api/api to root api directory for Vercel
// Also copy supporting directories (lib, services, utils) to root
const apiSourceDir = path.join(__dirname, 'apps', 'api', 'api');
const apiTargetDir = path.join(__dirname, 'api');
const libSourceDir = path.join(__dirname, 'apps', 'api', 'lib');
const libTargetDir = path.join(__dirname, 'lib');
const servicesSourceDir = path.join(__dirname, 'apps', 'api', 'services');
const servicesTargetDir = path.join(__dirname, 'services');
const utilsSourceDir = path.join(__dirname, 'apps', 'api', 'utils');
const utilsTargetDir = path.join(__dirname, 'utils');

console.log('Building API for Vercel...');

// Copy function
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source not found: ${src}`);
    return;
  }
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Remove existing directories
[apiTargetDir, libTargetDir, servicesTargetDir, utilsTargetDir].forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Removing existing ${path.basename(dir)} directory...`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// Copy API functions
console.log(`Copying API functions from ${apiSourceDir}...`);
copyRecursive(apiSourceDir, apiTargetDir);

// Copy supporting directories
if (fs.existsSync(libSourceDir)) {
  console.log(`Copying lib from ${libSourceDir}...`);
  copyRecursive(libSourceDir, libTargetDir);
}

if (fs.existsSync(servicesSourceDir)) {
  console.log(`Copying services from ${servicesSourceDir}...`);
  copyRecursive(servicesSourceDir, servicesTargetDir);
}

if (fs.existsSync(utilsSourceDir)) {
  console.log(`Copying utils from ${utilsSourceDir}...`);
  copyRecursive(utilsSourceDir, utilsTargetDir);
}

console.log('✅ API functions and dependencies copied to root');

