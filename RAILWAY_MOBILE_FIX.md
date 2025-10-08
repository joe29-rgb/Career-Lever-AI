# 📱 Railway Mobile "Not Found" Fix Guide

## **Problem**
Mobile devices (smart devices) show "Not Found" when accessing your Railway deployment.

## **Root Cause**
This is typically caused by:
1. **Domain/DNS configuration issues** - Railway's auto-generated domain not resolving correctly
2. **Next.js routing misconfiguration** - Mobile browsers caching old routes
3. **Railway service not exposed correctly** - PORT environment variable not set

## **Solution**

### **Step 1: Verify Railway Domain**
1. Go to your Railway dashboard: https://railway.app
2. Click your project: `Career-Lever-AI`
3. Click your service (should be `main` or `web`)
4. Check **Settings → Domains**
5. You should see a domain like: `career-lever-ai-production.up.railway.app`

### **Step 2: Generate New Domain (If Needed)**
If the domain shows "Not Found":
1. In **Settings → Domains**
2. Click **Generate Domain** button
3. Copy the new domain
4. Test on mobile: `https://YOUR-NEW-DOMAIN.up.railway.app`

### **Step 3: Check Environment Variables**
Ensure these are set in **Settings → Variables**:
```
PORT=3000
NODE_ENV=production
NEXTAUTH_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

### **Step 4: Verify Railway Configuration**
Check your `railway.json` file has:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Step 5: Clear Mobile Browser Cache**
On your mobile device:
- **iOS Safari**: Settings → Safari → Clear History and Website Data
- **Android Chrome**: Settings → Privacy → Clear browsing data

### **Step 6: Test Healthcheck**
Visit: `https://YOUR-DOMAIN.up.railway.app/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T...",
  "environment": "production"
}
```

### **Step 7: Check Railway Logs**
In Railway dashboard:
1. Click **Deployments** tab
2. Click latest deployment
3. Check logs for errors like:
   - `EADDRINUSE` (port conflict)
   - `Module not found` (build issue)
   - `404` (routing issue)

## **Common Fixes**

### **Fix 1: Force HTTPS Redirect**
Ensure `next.config.js` has:
```javascript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [
        {
          type: 'header',
          key: 'x-forwarded-proto',
          value: 'http',
        },
      ],
      destination: 'https://YOUR-DOMAIN.up.railway.app/:path*',
      permanent: true,
    },
  ]
}
```

### **Fix 2: Update NEXTAUTH_URL**
```bash
# In Railway dashboard → Variables
NEXTAUTH_URL=https://career-lever-ai-production.up.railway.app
```

### **Fix 3: Redeploy**
Sometimes Railway needs a fresh deployment:
1. Go to **Deployments** tab
2. Click **⋮** (three dots) on latest deployment
3. Click **Restart**

## **Verification Checklist**
- [ ] Railway domain generates successfully
- [ ] Desktop browser works: `https://YOUR-DOMAIN.up.railway.app`
- [ ] Mobile browser works: `https://YOUR-DOMAIN.up.railway.app`
- [ ] Healthcheck returns 200: `https://YOUR-DOMAIN.up.railway.app/api/health`
- [ ] No errors in Railway logs
- [ ] `NEXTAUTH_URL` matches your domain

## **Still Not Working?**

### **Option 1: Use Custom Domain**
1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. In Railway → **Settings → Domains** → **Custom Domain**
3. Add your domain
4. Update DNS records as shown by Railway
5. Mobile devices handle custom domains better than Railway subdomains

### **Option 2: Contact Railway Support**
If the issue persists:
1. Go to https://railway.app/help
2. Describe: "Mobile devices show 'Not Found' on auto-generated domain"
3. Provide your project URL and Railway logs

## **Quick Test Command**
Test from terminal (shows if DNS is resolving):
```bash
curl -I https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

Should return:
```
HTTP/2 200
content-type: text/html
...
```

If it returns `404` or connection error, the Railway service isn't exposed correctly.

