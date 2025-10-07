# 🚨 URGENT: RAILWAY UI MANUAL FIX REQUIRED

## THE PROBLEM

**Railway is IGNORING your `railway.json` file completely!**

Evidence:
- Your `railway.json` says: `"timeout": 600`
- Railway logs show: `Retry window: 1m0s` (60 seconds)
- **Railway UI settings WIN every time!**

## ✅ THE ONLY SOLUTION: MANUAL UI UPDATE

You **MUST** change the setting in the Railway dashboard. The file won't work alone.

### **Step-by-Step Instructions:**

1. **Open your Railway Dashboard**
   - Go to https://railway.app
   - Click on your project: `Career-Lever-AI` or `job-craft-ai`

2. **Select Your Service**
   - Click on the service that's failing

3. **Go to Settings Tab**
   - Click **"Settings"** in the top navigation

4. **Scroll to "Deploy" Section**
   - Look for **"Healthcheck"** settings

5. **Find "Healthcheck Timeout"**
   - Current value: **60** seconds
   - Change to: **300** seconds (5 minutes)

6. **Alternative: Disable Healthcheck Temporarily**
   - Find **"Healthcheck Path"** field
   - **DELETE** the value `/api/health` (leave it empty)
   - This will let the app start without healthcheck

7. **Click Save/Update**
   - Railway will automatically redeploy

8. **Watch the Logs**
   - Should succeed this time!

---

## 🎯 WHAT YOU'LL SEE AFTER FIX

### **Before (Current):**
```
Retry window: 1m0s  ❌
Attempt #6 failed...
Healthcheck failed!
```

### **After (Fixed):**
```
Retry window: 5m0s  ✅
Attempt #1 succeeded!
Service is healthy!
```

---

## 🔧 IF YOU CAN'T FIND THE SETTING

Railway's UI changes frequently. Here are alternative locations:

**Option A: Service Variables**
1. Service → Variables tab
2. Add: `RAILWAY_HEALTHCHECK_TIMEOUT=300`

**Option B: Railway CLI**
```bash
railway variables set RAILWAY_HEALTHCHECK_TIMEOUT=300
```

**Option C: Contact Railway Support**
- Ask them to increase healthcheck timeout to 300 seconds

---

## ⚡ FASTEST FIX: DISABLE HEALTHCHECK

If you can't find the timeout setting:

1. **Railway Dashboard → Settings**
2. **Delete the healthcheck path** (clear the field)
3. **Save**
4. **Deploy will succeed without healthcheck**
5. **Add healthcheck back later once app is running**

---

## 📸 VISUAL GUIDE

Look for a section that looks like:

```
┌─────────────────────────────────┐
│ Healthcheck                     │
├─────────────────────────────────┤
│ Path: /api/health               │
│ Timeout: [60] seconds      ← CHANGE THIS TO 300
│ Interval: 10 seconds            │
└─────────────────────────────────┘
```

OR

```
┌─────────────────────────────────┐
│ Healthcheck Path                │
│ [/api/health]              ← DELETE THIS
└─────────────────────────────────┘
```

---

## 🚀 AFTER YOU CHANGE IT

Railway will:
1. ✅ Auto-redeploy (takes ~3 minutes)
2. ✅ Give app 5 minutes to start
3. ✅ Healthcheck succeeds
4. ✅ App goes live!

---

## ❌ WHAT WON'T WORK

- ❌ Updating `railway.json` alone
- ❌ Pushing more code changes
- ❌ Rebuilding the Docker image
- ❌ Changing environment variables

**You MUST change it in the Railway UI!**

---

## 📞 NEED HELP?

If you absolutely cannot find the setting:

1. **Railway Discord**: https://discord.gg/railway
2. **Railway Support**: https://help.railway.app
3. **Ask them**: "Where do I change the healthcheck timeout in the UI?"

---

**THIS IS A UI-ONLY FIX. NO CODE CHANGES WILL HELP.** 🎯

