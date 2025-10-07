# Capacitor Configuration - DISABLED FOR WEB BUILD

## Why Disabled?

The `capacitor.config.ts` file was breaking Railway production builds with this error:
```
Module not found: Can't resolve '@capacitor/cli'
```

## Current Status

- **File**: `capacitor.config.ts.disabled` (renamed from `capacitor.config.ts`)
- **Status**: Temporarily disabled for web-only deployment
- **Impact**: No impact on web app functionality

## Mobile App Development

When you're ready to build the mobile app:

1. **Re-enable Capacitor**:
   ```bash
   mv capacitor.config.ts.disabled capacitor.config.ts
   ```

2. **Install Capacitor CLI** (dev dependency only):
   ```bash
   npm install --save-dev @capacitor/cli
   ```

3. **Build for mobile**:
   ```bash
   npm run build
   npx cap sync
   ```

## Configuration Details

The disabled config contains:
```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ai.careerlever.app',
  appName: 'Career Lever AI',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
}

export default config
```

## Why This Fix Works

**Root Cause**: `@capacitor/cli` is only in `devDependencies`, but Railway's Docker build doesn't install dev dependencies in production.

**Solution**: Disable Capacitor for web deployment, re-enable only when building native mobile apps.

## Railway Deployment

With this fix:
- ✅ Web app builds successfully
- ✅ No Capacitor dependencies required
- ✅ Faster build times
- ✅ Smaller Docker image

When deploying mobile apps later, use a separate build pipeline or conditional Capacitor loading.

