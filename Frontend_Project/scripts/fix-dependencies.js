const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[v0] Starting dependency fix process...');

const projectDir = '/vercel/share/v0-project/Frontend_Project';
const nodeModulesPath = path.join(projectDir, 'node_modules');
const lockfilePath = path.join(projectDir, 'package-lock.json');

// Remove node_modules
if (fs.existsSync(nodeModulesPath)) {
  console.log('[v0] Removing node_modules directory...');
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  console.log('[v0] node_modules removed successfully');
}

// Remove package-lock.json
if (fs.existsSync(lockfilePath)) {
  console.log('[v0] Removing package-lock.json...');
  fs.unlinkSync(lockfilePath);
  console.log('[v0] package-lock.json removed successfully');
}

// Run npm install
try {
  console.log('[v0] Running npm install...');
  process.chdir(projectDir);
  execSync('npm install', { stdio: 'inherit' });
  console.log('[v0] npm install completed successfully');
} catch (error) {
  console.error('[v0] Error during npm install:', error.message);
  process.exit(1);
}

console.log('[v0] Dependency fix process completed!');
