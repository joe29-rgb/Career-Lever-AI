#!/usr/bin/env node

/**
 * Mobile Build Script
 * Temporarily switches to mobile config, builds, then restores
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const mainConfig = path.join(rootDir, 'next.config.js');
const mobileConfig = path.join(rootDir, 'next.config.mobile.js');
const backupConfig = path.join(rootDir, 'next.config.backup.js');

console.log('📱 Starting mobile build...\n');

try {
  // Step 1: Backup current config
  console.log('1️⃣  Backing up next.config.js...');
  fs.copyFileSync(mainConfig, backupConfig);
  console.log('✅ Backup created\n');

  // Step 2: Replace with mobile config
  console.log('2️⃣  Switching to mobile configuration...');
  fs.copyFileSync(mobileConfig, mainConfig);
  console.log('✅ Mobile config active\n');

  // Step 3: Build
  console.log('3️⃣  Building Next.js app for mobile...');
  execSync('next build', { stdio: 'inherit', cwd: rootDir });
  console.log('✅ Build complete\n');

  // Step 4: Restore original config
  console.log('4️⃣  Restoring original configuration...');
  fs.copyFileSync(backupConfig, mainConfig);
  fs.unlinkSync(backupConfig);
  console.log('✅ Configuration restored\n');

  console.log('🎉 Mobile build successful!');
  console.log('📁 Output directory: ./out');
  console.log('🔄 Run "npx cap sync" to sync with Capacitor\n');

} catch (error) {
  // Restore config even if build fails
  if (fs.existsSync(backupConfig)) {
    console.error('\n❌ Build failed! Restoring configuration...');
    fs.copyFileSync(backupConfig, mainConfig);
    fs.unlinkSync(backupConfig);
    console.log('✅ Configuration restored\n');
  }
  
  console.error('Error:', error.message);
  process.exit(1);
}
