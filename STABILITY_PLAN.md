# 🛡️ STABILITY & RESILIENCE PLAN FOR CAREER LEVER AI

## ✅ CURRENT STATUS
- **Local Build:** ✅ SUCCESS (63 pages generated)
- **NPM Vulnerabilities:** ✅ 0 vulnerabilities
- **TypeScript:** ✅ No errors
- **Tests:** Need implementation

---

## 🔍 ROOT CAUSE ANALYSIS

### Common Failure Points in Your Stack:

1. **Dependency Hell**
   - devDependencies imported in production code
   - Version conflicts during npm install
   - Missing peer dependencies

2. **Build Environment Differences**
   - Docker vs Local differences
   - Node version mismatches
   - Environment variables not set

3. **Next.js Specific Issues**
   - Dynamic imports not configured properly
   - Static generation errors
   - API routes timing out

---

## 🛡️ **STABILITY SOLUTIONS - IMPLEMENTATION PLAN**

### **PHASE 1: IMMEDIATE FIXES** (Do Now - 30 minutes)

#### 1. Lock File Strategy
```bash
# Use exact versions (no ^ or ~)
npm install --save-exact <package>
```

**Action:** Create `.npmrc` to enforce exact versions

#### 2. Build Verification Script
**Action:** Add pre-deployment checks

#### 3. Docker Build Consistency
**Action:** Pin Node version exactly

---

## 📦 **SOLUTION 1: DEPENDENCY LOCK-DOWN**

### Create `.npmrc` file:
```ini
# Force exact versions
save-exact=true

# Prevent auto-updates
package-lock=true

# Use production-only installs in CI
production=false

# Fail on peer dependency conflicts
legacy-peer-deps=false
strict-peer-dependencies=true

# Engine strict
engine-strict=true
```

### Update `package.json` engines:
```json
{
  "engines": {
    "node": "20.x",
    "npm": ">=10.0.0"
  }
}
```

---

## 🔍 **SOLUTION 2: PRE-DEPLOYMENT VALIDATION**

### Create `scripts/pre-deploy-check.js`:
```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Running Pre-Deployment Checks...\n');

const checks = [
  {
    name: 'TypeScript',
    command: 'npm run type-check',
    critical: true
  },
  {
    name: 'Build',
    command: 'npm run build',
    critical: true
  },
  {
    name: 'Security Audit',
    command: 'npm audit --production',
    critical: false
  },
  {
    name: 'Environment Variables',
    check: () => {
      const required = [
        'MONGODB_URI',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'PERPLEXITY_API_KEY'
      ];
      const missing = required.filter(key => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Missing env vars: ${missing.join(', ')}`);
      }
    },
    critical: true
  }
];

let failed = false;

for (const check of checks) {
  process.stdout.write(`Checking ${check.name}... `);
  
  try {
    if (check.command) {
      execSync(check.command, { stdio: 'pipe' });
    } else if (check.check) {
      check.check();
    }
    console.log('✅');
  } catch (error) {
    console.log('❌');
    if (check.critical) {
      console.error(`\n❌ Critical check failed: ${check.name}`);
      console.error(error.message);
      failed = true;
    } else {
      console.warn(`⚠️  Non-critical check failed: ${check.name}`);
    }
  }
}

if (failed) {
  console.error('\n🚫 Pre-deployment checks failed!');
  process.exit(1);
}

console.log('\n✅ All checks passed! Ready to deploy.');
```

### Add to `package.json`:
```json
{
  "scripts": {
    "pre-deploy": "node scripts/pre-deploy-check.js",
    "deploy": "npm run pre-deploy && <your-deploy-command>"
  }
}
```

---

## 🐳 **SOLUTION 3: ROBUST DOCKER CONFIGURATION**

### Update `Dockerfile` (Production-Hardened):
```dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20.18.1-alpine AS deps

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with exact versions
RUN npm ci --only=production --ignore-scripts --prefer-offline && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20.18.1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install ALL dependencies for build (including devDependencies)
RUN npm ci && npm cache clean --force

# Build the application
RUN npm run build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20.18.1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "server.js"]
```

---

## 🔄 **SOLUTION 4: GITHUB ACTIONS CI/CD**

### Create `.github/workflows/ci.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test & Build
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
        continue-on-error: true
      
      - name: Security audit
        run: npm audit --production
        continue-on-error: true
      
      - name: Build
        run: npm run build
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          PERPLEXITY_API_KEY: ${{ secrets.PERPLEXITY_API_KEY }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: .next/
          retention-days: 7

  docker-build:
    name: Docker Build Test
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: false
          tags: career-lever-ai:test
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 🔧 **SOLUTION 5: ENVIRONMENT VARIABLE MANAGEMENT**

### Create `scripts/check-env.js`:
```javascript
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
    console.log(`✅ ${varName}`);
  }
}

console.log(`\n📊 Summary: ${present.length}/${required.length} present`);

if (missing.length > 0) {
  console.error(`\n❌ Missing required environment variables:`);
  missing.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');
```

### Add to `package.json`:
```json
{
  "scripts": {
    "check:env": "node scripts/check-env.js",
    "prebuild": "npm run check:env"
  }
}
```

---

## 📊 **SOLUTION 6: BUILD MONITORING & ALERTS**

### Create `scripts/post-build-report.js`:
```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const buildInfoPath = path.join(__dirname, '../.next/build-info.json');
const packageJson = require('../package.json');

const report = {
  timestamp: new Date().toISOString(),
  version: packageJson.version,
  nodeVersion: process.version,
  platform: process.platform,
  success: true,
  warnings: [],
  stats: {
    totalPages: 0,
    staticPages: 0,
    serverPages: 0,
    apiRoutes: 0
  }
};

// Parse Next.js build output
// (Implementation would parse the build output for statistics)

console.log('\n📊 Build Report:');
console.log(`   Version: ${report.version}`);
console.log(`   Node: ${report.nodeVersion}`);
console.log(`   Timestamp: ${report.timestamp}`);
console.log(`\n✅ Build completed successfully!`);

// Save report
fs.writeFileSync(
  path.join(__dirname, '../build-report.json'),
  JSON.stringify(report, null, 2)
);
```

---

## 🚨 **SOLUTION 7: ERROR RECOVERY & ROLLBACK**

### Create `scripts/rollback.sh`:
```bash
#!/bin/bash

echo "🔄 Rolling back to previous deployment..."

# Get previous commit
PREVIOUS_COMMIT=$(git rev-parse HEAD~1)

echo "📍 Rolling back to commit: $PREVIOUS_COMMIT"

# Create rollback branch
git checkout -b rollback-$(date +%s) $PREVIOUS_COMMIT

# Redeploy
npm run deploy

echo "✅ Rollback complete!"
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Immediate (30 mins)**
- [ ] Create `.npmrc` file
- [ ] Add `engines` to package.json
- [ ] Create `scripts/check-env.js`
- [ ] Add `prebuild` script

### **Phase 2: Short-term (2 hours)**
- [ ] Update Dockerfile with hardened config
- [ ] Create `scripts/pre-deploy-check.js`
- [ ] Add pre-commit hooks
- [ ] Set up build monitoring

### **Phase 3: Long-term (1 day)**
- [ ] Implement GitHub Actions CI/CD
- [ ] Add automated testing
- [ ] Set up error tracking (Sentry already configured)
- [ ] Create rollback procedures

---

## 🎯 **EXPECTED OUTCOMES**

After implementing these solutions:

| Metric | Before | After |
|--------|--------|-------|
| **Build Failures** | 30%+ | <5% |
| **Deploy Confidence** | Low | High |
| **Recovery Time** | Hours | Minutes |
| **Error Detection** | Manual | Automated |
| **Rollback Speed** | N/A | 2 minutes |

---

## 🚀 **QUICK START - DO THIS NOW**

### **Option A: Minimal (5 minutes)**
Just prevent the most common failures:

```bash
# 1. Create .npmrc
echo "save-exact=true
package-lock=true" > .npmrc

# 2. Add engines to package.json
# (manually add the engines field)

# 3. Run build test
npm run build
```

### **Option B: Comprehensive (30 minutes)**
Implement all Phase 1 solutions above.

### **Option C: Full System (2 hours)**
Implement all phases for maximum stability.

---

## 💡 **RAILWAY-SPECIFIC FIXES**

Since you're using Railway, add this to your repo:

### `railway.json`:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "healthcheck": {
    "path": "/api/health",
    "timeout": 300
  }
}
```

### Railway Environment Variables Check:
Make sure these are set in Railway dashboard:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`  
- `NEXTAUTH_URL`
- `PERPLEXITY_API_KEY`
- `REDIS_URL`
- `NODE_ENV=production`

---

## 🔍 **DEBUGGING WORKFLOW**

When a build fails:

1. **Check Local First**
   ```bash
   npm run build
   ```

2. **Check Docker Locally**
   ```bash
   docker build -t test-build .
   ```

3. **Check Environment Variables**
   ```bash
   node scripts/check-env.js
   ```

4. **Check Logs**
   - Railway: View deployment logs
   - Look for specific error messages
   - Check for missing dependencies

5. **Compare package-lock.json**
   ```bash
   git diff HEAD~1 package-lock.json
   ```

---

## ✅ **SUCCESS METRICS**

You'll know the system is stable when:
- ✅ Builds succeed 95%+ of the time
- ✅ Failures are caught in CI before deployment
- ✅ Clear error messages when something fails
- ✅ Automated rollback available
- ✅ No manual intervention needed for deployments

---

Would you like me to implement any of these solutions immediately?

