import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy apps/api/api to root api directory for Vercel
// Also copy supporting directories (lib, services, utils) to root
// Also copy packages/shared/src to root so relative imports work
const apiSourceDir = path.join(__dirname, 'apps', 'api', 'api');
const apiTargetDir = path.join(__dirname, 'api');
const libSourceDir = path.join(__dirname, 'apps', 'api', 'lib');
const libTargetDir = path.join(__dirname, 'lib');
const servicesSourceDir = path.join(__dirname, 'apps', 'api', 'services');
const servicesTargetDir = path.join(__dirname, 'services');
const utilsSourceDir = path.join(__dirname, 'apps', 'api', 'utils');
const utilsTargetDir = path.join(__dirname, 'utils');
const sharedSourceDir = path.join(__dirname, 'packages', 'shared', 'src');
const sharedTargetDir = path.join(__dirname, 'packages', 'shared', 'src');

console.log('Building API for Vercel...');

// Transform import paths from apps/api relative paths to root relative paths
function transformImports(content, filePath) {
  // Only transform TypeScript/JavaScript files
  if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) {
    return content;
  }

  // Transform relative paths from apps/api to root
  // ../../../packages/shared/src/ -> ../../packages/shared/src/
  // ../../../../packages/shared/src/ -> ../../packages/shared/src/
  let transformed = content;
  
  // Match various relative path patterns
  transformed = transformed.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/packages\/shared\/src\//g,
    "from '../../packages/shared/src/"
  );
  transformed = transformed.replace(
    /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/packages\/shared\/src\//g,
    "from '../../packages/shared/src/"
  );
  
  return transformed;
}

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
    // Read, transform, and write file
    const content = fs.readFileSync(src, 'utf8');
    const transformed = transformImports(content, src);
    fs.writeFileSync(dest, transformed, 'utf8');
  }
}

// Remove existing directories
[apiTargetDir, libTargetDir, servicesTargetDir, utilsTargetDir].forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Removing existing ${path.basename(dir)} directory...`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// For shared, we need to be careful - only remove target if it's different from source
// Since source and target are the same in monorepo, we just ensure it exists
// (It's already in the right place for Vercel)

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

// Copy shared package
// Note: In monorepo, source and target are the same path, so we just verify it exists
console.log(`Checking for shared source at: ${sharedSourceDir}`);
if (fs.existsSync(sharedSourceDir)) {
  console.log(`✅ Shared package found at ${sharedSourceDir} (already in correct location for Vercel)`);
} else {
  console.log(`⚠️  Shared source directory not found at ${sharedSourceDir}`);
  console.log(`   This may cause import errors in Vercel deployment.`);
}

console.log('✅ API functions and dependencies copied to root');

