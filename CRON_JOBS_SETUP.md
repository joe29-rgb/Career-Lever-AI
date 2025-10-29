# Cron Jobs Setup Guide

## 🎯 Overview

This document explains how to set up automated cron jobs for Career Lever AI to pre-fetch jobs daily and keep the cache fresh.

---

## 📅 Job Pre-Fetching Cron

### **Purpose**:
Pre-fetch jobs for all active users daily so they see results immediately when opening Career Finder.

### **Schedule**:
- **Time**: 3:00 AM EST on Tuesday and Saturday
- **Cron Expression**: `0 8 * * 2,6` (8 AM UTC = 3 AM EST)
- **Days**: Tuesday (2) and Saturday (6)
- **Duration**: Up to 5 minutes
- **Rate Limit**: 2 seconds between users
- **Test Radius**: 150km around Edmonton, AB

### **What It Does**:
1. Finds all users with 50%+ complete profiles
2. Extracts their target roles and skills
3. Searches for jobs in their location
4. Caches results for 12 hours
5. Processes max 100 users per run

---

## 🚀 Deployment Setup

### **1. Vercel Cron (Recommended)**

The `vercel.json` file is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/prefetch-jobs",
      "schedule": "0 8 * * 2,6"
    }
  ]
}
```
**Note**: `0 8 * * 2,6` means:
- `0` = minute 0
- `8` = hour 8 (UTC)
- `*` = any day of month
- `*` = any month
- `2,6` = Tuesday (2) and Saturday (6)

**Steps**:
1. Deploy to Vercel
2. Cron jobs automatically enabled
3. Set environment variable: `CRON_SECRET=your-secret-key`
4. Done! Vercel handles the rest

**Vercel will**:
- Call `/api/cron/prefetch-jobs` on Tuesday and Saturday at 3 AM EST
- Pass `Authorization: Bearer ${CRON_SECRET}` header
- Handle retries on failure
- Send notifications on errors

---

### **2. Test Endpoint (Edmonton, AB)**

Test the job pre-fetching with Edmonton data (150km radius):

```bash
curl -X GET "http://localhost:8080/api/cron/test-prefetch"
# or production
curl -X GET "https://your-domain.com/api/cron/test-prefetch"
```

**What It Tests**:
- 5 different keyword combinations
- 150km radius around Edmonton, AB
- 50 jobs per search
- Rate limiting (3 seconds between searches)

**Expected Response**:
```json
{
  "success": true,
  "message": "Test job pre-fetch completed",
  "results": {
    "location": "Edmonton, AB",
    "radius": 150,
    "searches": [
      {
        "keywords": "sales, business development, CRM",
        "jobCount": 47,
        "success": true,
        "cached": false
      }
    ],
    "totalJobs": 235
  },
  "summary": {
    "totalSearches": 5,
    "successfulSearches": 5,
    "totalJobsFound": 235,
    "averageJobsPerSearch": 47
  }
}
```

---

### **3. Manual Production Testing**

Test the full cron job in production:

```bash
curl -X GET "https://your-domain.com/api/cron/prefetch-jobs" \
  -H "Authorization: Bearer your-secret-key"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Job pre-fetch completed",
  "results": {
    "total": 25,
    "success": 23,
    "failed": 0,
    "skipped": 2,
    "errors": []
  }
}
```

---

### **4. Alternative: GitHub Actions**

If not using Vercel, use GitHub Actions:

Create `.github/workflows/prefetch-jobs.yml`:

```yaml
name: Pre-fetch Jobs Twice Weekly

on:
  schedule:
    - cron: '0 8 * * 2,6'  # 3 AM EST on Tuesday and Saturday
  workflow_dispatch:  # Manual trigger

jobs:
  prefetch:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron Endpoint
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/prefetch-jobs" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Required Secrets**:
- `APP_URL`: Your production URL
- `CRON_SECRET`: Your cron secret key

---

## 🔐 Security

### **Authentication**:
The cron endpoint requires a secret token:

```typescript
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET || 'dev-secret'

if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### **Environment Variables**:
```bash
# Production
CRON_SECRET=your-very-secret-key-here

# Development (optional)
CRON_SECRET=dev-secret
```

**Generate a secure secret**:
```bash
openssl rand -base64 32
```

---

## 📊 Monitoring

### **Logs**:
Check logs for cron execution:

```bash
# Vercel
vercel logs --follow

# Or check Vercel dashboard > Functions > Logs
```

**Log Examples**:
```
[CRON] Starting job pre-fetch for all users...
[CRON] Found 25 users to pre-fetch jobs for
[CRON] ✅ Pre-fetched 47 jobs for user 68c9c97d2cd7bfaad180e0bc
[CRON] ✅ Pre-fetched 32 jobs for user 68ff1bd354105ecb5380e1c4
[CRON] Job pre-fetch completed: { total: 25, success: 23, failed: 0, skipped: 2 }
```

### **Metrics to Track**:
- Total users processed
- Success rate
- Average jobs per user
- Execution time
- Error rate

---

## 🎯 How It Works

### **User Selection**:
```typescript
const profiles = await UserProfile.find({
  profileCompleteness: { $gte: 50 },  // 50%+ complete
  'careerPreferences.targetRoles': { $exists: true, $ne: [] },
  'location.city': { $exists: true }
})
.limit(100)  // Max 100 users per run
```

### **Cache Check**:
```typescript
// Skip if user has cache < 12 hours old
const existingCache = await JobSearchCache.findOne({
  userId: profile.userId.toString(),
  createdAt: { $gt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
})
```

### **Job Search**:
```typescript
// Build keywords from profile
const keywords = [
  ...profile.careerPreferences.targetRoles.slice(0, 5),
  ...profile.skills.technical.slice(0, 10)
]

// Call job search API
const searchUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/v2/job-search`)
searchUrl.searchParams.set('jobTitle', keywords.join(', '))
searchUrl.searchParams.set('location', location)
searchUrl.searchParams.set('maxResults', '50')
```

### **Rate Limiting**:
```typescript
// Wait 2 seconds between requests
await new Promise(resolve => setTimeout(resolve, 2000))
```

---

## 🐛 Troubleshooting

### **Issue: Cron not running**
**Solution**:
1. Check `vercel.json` is in root directory
2. Verify cron schedule syntax
3. Check Vercel dashboard > Settings > Cron Jobs
4. Ensure `CRON_SECRET` is set

### **Issue: 401 Unauthorized**
**Solution**:
1. Check `CRON_SECRET` environment variable
2. Verify Authorization header format
3. Ensure secret matches in both places

### **Issue: Timeout (504)**
**Solution**:
1. Reduce `limit(100)` to `limit(50)`
2. Increase `maxDuration` to 300 seconds
3. Check database connection
4. Verify API rate limits

### **Issue: No jobs found**
**Solution**:
1. Check user profiles have target roles
2. Verify location data exists
3. Check Perplexity API credits
4. Review job search API logs

---

## 📈 Performance Optimization

### **Current Settings**:
- Max users per run: 100
- Rate limit: 2 seconds between users
- Cache duration: 12 hours
- Max results per user: 50 jobs
- Timeout: 5 minutes

### **Scaling Up**:
If you need to process more users:

1. **Increase max users**:
   ```typescript
   .limit(200)  // Process 200 users
   ```

2. **Run more frequently**:
   ```json
   "schedule": "0 */6 * * *"  // Every 6 hours
   ```

3. **Parallel processing**:
   ```typescript
   await Promise.all(
     profiles.map(profile => prefetchForUser(profile))
   )
   ```

---

## ✅ Success Criteria

### **Healthy Cron Job**:
- ✅ Runs daily at 6 AM
- ✅ Processes 80%+ of active users
- ✅ Success rate > 95%
- ✅ Execution time < 3 minutes
- ✅ No critical errors

### **User Experience**:
- ✅ Users see jobs immediately (no loading)
- ✅ Jobs are fresh (< 12 hours old)
- ✅ 30-50 jobs per user
- ✅ Relevant to user's profile

---

## 🎉 Summary

**Setup Complete When**:
1. ✅ `vercel.json` configured
2. ✅ `CRON_SECRET` environment variable set
3. ✅ Deployed to Vercel
4. ✅ Cron job shows in Vercel dashboard
5. ✅ Test run successful

**Result**: Users wake up to fresh job listings every morning! 🌅
