#!/usr/bin/env node

const requiredEnvVars = {
  production: [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'PERPLEXITY_API_KEY',
    'REDIS_URL'
  ],
  development: [
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'PERPLEXITY_API_KEY'
  ]
};

const env = process.env.NODE_ENV || 'development';
const required = requiredEnvVars[env] || requiredEnvVars.development;

console.log(`🔍 Checking environment variables for: ${env}\n`);

const missing = [];
const present = [];

for (const varName of required) {
  if (!process.env[varName]) {
    missing.push(varName);
    console.log(`❌ ${varName}`);
  } else {
    present.push(varName);
    const value = process.env[varName];
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName} (${preview})`);
  }
}

console.log(`\n📊 Summary: ${present.length}/${required.length} present`);

if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables:`);
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\n💡 Tip: Create a .env file with these variables or set them in your deployment platform');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');

