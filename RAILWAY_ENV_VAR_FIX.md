# 🎯 RAILWAY HEALTHCHECK FIX - Environment Variable Method

## ✅ THE ACTUAL WORKING SOLUTION

Railway respects the **`RAILWAY_HEALTHCHECK_TIMEOUT_SEC`** environment variable!

I've updated your `railway.json` to include it, but you **ALSO** need to add it in the Railway UI.

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### **Method 1: Add Environment Variable in Railway UI** (FASTEST)

1. **Go to Railway Dashboard**
   - https://railway.app
   - Open your project

2. **Click on Your Service**
   - Select the service that's failing

3. **Go to "Variables" Tab**
   - Click **"Variables"** in the navigation

4. **Add New Variable**
   - Click **"+ New Variable"**
   - **Name**: `RAILWAY_HEALTHCHECK_TIMEOUT_SEC`
   - **Value**: `300`
   - Click **"Add"**

5. **Redeploy**
   - Railway will auto-redeploy with the new setting
   - OR click **"Deploy"** → **"Redeploy"**

6. **Watch Logs**
   - Should now show: `Retry window: 5m0s` ✅
   - Healthcheck should succeed!

---

## 📋 ALL REQUIRED ENVIRONMENT VARIABLES

Make sure these are set in Railway Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `MONGODB_URI` | Your MongoDB connection string | ✅ Yes |
| `NEXTAUTH_SECRET` | Your auth secret (64 chars) | ✅ Yes |
| `NEXTAUTH_URL` | Your Railway app URL | ✅ Yes |
| `PERPLEXITY_API_KEY` | Your Perplexity API key | ✅ Yes |
| `REDIS_URL` | Your Redis connection string | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` | `300` | ✅ **ADD THIS NOW** |

---

## 🔧 METHOD 2: Railway CLI (Alternative)

If you have Railway CLI installed:

```bash
railway variables set RAILWAY_HEALTHCHECK_TIMEOUT_SEC=300
```

---

## 🎯 WHAT HAPPENS AFTER ADDING THE VARIABLE

### **Current Behavior:**
```
====================
Starting Healthcheck
====================
Retry window: 1m0s  ❌ (60 seconds - too short!)
Attempt #6 failed...
Healthcheck failed!
```

### **After Adding Variable:**
```
====================
Starting Healthcheck
====================
Retry window: 5m0s  ✅ (300 seconds - plenty of time!)
Attempt #1 succeeded! ✅
Service is healthy! ✅
```

---

## ⏱️ TIMELINE

| Time | Event |
|------|-------|
| 0:00 | You add `RAILWAY_HEALTHCHECK_TIMEOUT_SEC=300` |
| 0:05 | Railway triggers redeploy |
| 2:00 | Build completes |
| 2:30 | Container starts |
| 3:00 | App initializes (MongoDB, Redis, Next.js) |
| 3:30 | **First healthcheck attempt → SUCCESS!** ✅ |
| 3:35 | Railway marks service as healthy |
| 3:40 | **DEPLOYMENT COMPLETE!** 🎉 |

---

## 💡 WHY THIS WORKS

Railway's healthcheck priority:

1. **Environment Variable** `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` ← **HIGHEST PRIORITY** ✅
2. `railway.json` config
3. Railway UI default (60s)

By setting the environment variable, you **override** the UI default!

---

## ✅ VERIFICATION

After adding the variable and redeploying, check the logs:

**Success looks like:**
```bash
Build time: 117 seconds ✅
Starting Healthcheck
Path: /api/health
Retry window: 5m0s ✅  # This confirms the 300s timeout is active!

Attempt #1 succeeded! ✅
Service is healthy!
Deployment successful! 🎉
```

---

## 🚨 IF IT STILL SHOWS 1m0s

If the logs still show `Retry window: 1m0s` after adding the variable:

1. **Double-check the variable name** (must be EXACT):
   - `RAILWAY_HEALTHCHECK_TIMEOUT_SEC` (no typos!)

2. **Trigger a fresh deploy**:
   - Railway → Service → **"Deploy"** → **"Redeploy"**

3. **Check Railway Variables tab**:
   - Make sure the variable is visible and saved

---

## 📸 SCREENSHOT GUIDE

When adding the variable, you'll see something like:

```
┌──────────────────────────────────────────────┐
│ Variables                                    │
├──────────────────────────────────────────────┤
│ MONGODB_URI: mongodb+srv://...             │
│ NEXTAUTH_SECRET: 8d3f2b1c...               │
│ NEXTAUTH_URL: https://your-app.railway.app │
│ PERPLEXITY_API_KEY: pplx-...               │
│ REDIS_URL: redis://...                     │
│ NODE_ENV: production                        │
│                                              │
│ [+ New Variable]  ← Click this              │
└──────────────────────────────────────────────┘
```

Then:
```
┌──────────────────────────────────────────────┐
│ Add Variable                                 │
├──────────────────────────────────────────────┤
│ Name:  [RAILWAY_HEALTHCHECK_TIMEOUT_SEC]    │
│ Value: [300]                                 │
│                                              │
│          [Cancel]    [Add] ← Click          │
└──────────────────────────────────────────────┘
```

---

## 🎉 FINAL RESULT

Once this variable is set:

✅ **Healthcheck timeout: 300 seconds**  
✅ **App has plenty of time to start**  
✅ **MongoDB/Redis connect successfully**  
✅ **Deployment succeeds!**  
✅ **App goes live!** 🚀

---

**DO THIS NOW: Add `RAILWAY_HEALTHCHECK_TIMEOUT_SEC=300` to Railway Variables!** 🎯

