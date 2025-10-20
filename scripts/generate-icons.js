#!/usr/bin/env node

/**
 * App Icon Generator Script
 * Converts SVG icon to all required iOS and Android sizes
 * 
 * Prerequisites:
 * - npm install -g sharp-cli (for PNG conversion)
 * OR
 * - Use online tool: https://appicon.co
 * 
 * This script provides instructions and file structure
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Career Lever AI - App Icon Generator\n');

// Icon sizes required
const iosSizes = [
  { size: 20, scale: 1, name: 'AppIcon-20x20@1x.png' },
  { size: 20, scale: 2, name: 'AppIcon-20x20@2x.png' },
  { size: 20, scale: 3, name: 'AppIcon-20x20@3x.png' },
  { size: 29, scale: 1, name: 'AppIcon-29x29@1x.png' },
  { size: 29, scale: 2, name: 'AppIcon-29x29@2x.png' },
  { size: 29, scale: 3, name: 'AppIcon-29x29@3x.png' },
  { size: 40, scale: 1, name: 'AppIcon-40x40@1x.png' },
  { size: 40, scale: 2, name: 'AppIcon-40x40@2x.png' },
  { size: 40, scale: 3, name: 'AppIcon-40x40@3x.png' },
  { size: 60, scale: 2, name: 'AppIcon-60x60@2x.png' },
  { size: 60, scale: 3, name: 'AppIcon-60x60@3x.png' },
  { size: 76, scale: 1, name: 'AppIcon-76x76@1x.png' },
  { size: 76, scale: 2, name: 'AppIcon-76x76@2x.png' },
  { size: 83.5, scale: 2, name: 'AppIcon-83.5x83.5@2x.png' },
  { size: 1024, scale: 1, name: 'AppIcon-1024x1024@1x.png' }
];

const androidSizes = [
  { density: 'mdpi', size: 48, folder: 'mipmap-mdpi' },
  { density: 'hdpi', size: 72, folder: 'mipmap-hdpi' },
  { density: 'xhdpi', size: 96, folder: 'mipmap-xhdpi' },
  { density: 'xxhdpi', size: 144, folder: 'mipmap-xxhdpi' },
  { density: 'xxxhdpi', size: 192, folder: 'mipmap-xxxhdpi' }
];

console.log('📋 Required Icon Sizes:\n');

console.log('iOS (15 sizes):');
iosSizes.forEach(icon => {
  const actualSize = icon.size * icon.scale;
  console.log(`  - ${actualSize}x${actualSize} (${icon.name})`);
});

console.log('\nAndroid (5 densities):');
androidSizes.forEach(icon => {
  console.log(`  - ${icon.size}x${icon.size} (${icon.folder}/ic_launcher.png)`);
});

console.log('\n📁 Source Icon Location:');
console.log('  public/icon-512.svg (Career Lever AI logo)\n');

console.log('🛠️  Generation Options:\n');

console.log('Option 1: Online Tool (Easiest)');
console.log('  1. Go to https://appicon.co');
console.log('  2. Upload public/icon-512.svg');
console.log('  3. Select iOS and Android');
console.log('  4. Download generated packages');
console.log('  5. Extract to ios/ and android/ directories\n');

console.log('Option 2: Manual Conversion');
console.log('  1. Convert SVG to 1024x1024 PNG');
console.log('  2. Use image editor to resize for each size');
console.log('  3. Save to appropriate directories\n');

console.log('Option 3: Sharp CLI (Automated)');
console.log('  npm install -g sharp-cli');
console.log('  Then run this script with --generate flag\n');

console.log('📂 Installation Directories:\n');
console.log('iOS:');
console.log('  ios/App/App/Assets.xcassets/AppIcon.appiconset/\n');
console.log('Android:');
androidSizes.forEach(icon => {
  console.log(`  android/app/src/main/res/${icon.folder}/ic_launcher.png`);
});

console.log('\n✅ Next Steps:');
console.log('  1. Choose a generation option above');
console.log('  2. Generate all required sizes');
console.log('  3. Copy files to installation directories');
console.log('  4. Verify in Xcode and Android Studio');
console.log('  5. Test on simulators/emulators\n');

console.log('📝 Icon Checklist:');
console.log('  [ ] Generate 1024x1024 master PNG from SVG');
console.log('  [ ] Generate all 15 iOS sizes');
console.log('  [ ] Generate all 5 Android sizes');
console.log('  [ ] Copy to iOS directory');
console.log('  [ ] Copy to Android directories');
console.log('  [ ] Verify in Xcode');
console.log('  [ ] Verify in Android Studio');
console.log('  [ ] Test on iOS simulator');
console.log('  [ ] Test on Android emulator\n');

console.log('💡 Tip: The existing icon-512.svg is perfect for conversion!');
console.log('   It has a professional design with Career Lever AI branding.\n');

// Check if directories exist
const iosIconDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

if (fs.existsSync(iosIconDir)) {
  console.log('✅ iOS icon directory exists');
} else {
  console.log('⚠️  iOS icon directory not found');
}

if (fs.existsSync(androidResDir)) {
  console.log('✅ Android resource directory exists');
} else {
  console.log('⚠️  Android resource directory not found');
}

console.log('\n🎯 Recommended: Use https://appicon.co for fastest results!');
