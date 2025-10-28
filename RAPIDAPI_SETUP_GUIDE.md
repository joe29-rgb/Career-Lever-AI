# RapidAPI Setup Guide

## 🎯 What You Need

You need to subscribe to **job search APIs** on RapidAPI to power the new multi-source job aggregator.

---

## 📋 Step-by-Step Setup

### **Step 1: Create RapidAPI Account**

1. Go to [https://rapidapi.com](https://rapidapi.com)
2. Click "Sign Up" (top right)
3. Create account with email or Google/GitHub

---

### **Step 2: Subscribe to Job APIs**

You need to subscribe to these APIs (all on RapidAPI):

#### **🔥 TIER 1: Core APIs (Required)**

1. **Active Jobs DB** ⭐ MOST IMPORTANT
   - URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/active-jobs-db
   - Features: 130k+ career sites, AI-enriched, 100 jobs/request
   - Plan: Start with **Basic** ($0.001 per request)
   - Limit: 1000 requests/month = $1/month

2. **JSearch (Google for Jobs)**
   - URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
   - Features: LinkedIn, Indeed, Glassdoor, ZipRecruiter aggregator
   - Plan: Start with **Basic** ($0.001 per request)
   - Limit: 1000 requests/month = $1/month

3. **Indeed12**
   - URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/indeed12
   - Features: Direct Indeed access
   - Plan: Start with **Basic** ($0.001 per request)
   - Limit: 1000 requests/month = $1/month

#### **🎯 TIER 2: Specialized APIs (Optional but Recommended)**

4. **Remote Jobs API** (if users want remote jobs)
   - URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/remote-jobs-api
   - Features: Remote-only positions
   - Plan: **Basic** ($0.001 per request)

5. **LinkedIn Job Search API** (for high-quality matches)
   - URL: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-job-search-api
   - Features: 10M+ LinkedIn jobs with apply URLs
   - Plan: **Basic** ($0.001 per request)

#### **💼 TIER 3: Freelance APIs (Optional - only if you want freelance jobs)**

6. **Upwork Jobs API**
   - URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/upwork-jobs-api
   - Features: Freelance gigs, 100 jobs/request
   - Plan: **Basic** ($0.001 per request)

7. **Freelancer API**
   - URL: https://rapidapi.com/letscrape-6bRBa3QguO5/api/freelancer-api
   - Features: Freelance/contract work
   - Plan: **Basic** ($0.001 per request)

---

### **Step 3: Get Your API Key**

1. After subscribing to APIs, go to any API page
2. Click "Test Endpoint" or "Code Snippets"
3. Look for `X-RapidAPI-Key` in the headers
4. **Copy this key** - it's the same for ALL APIs!

Example:
```
X-RapidAPI-Key: abc123def456ghi789jkl012mno345pqr678
```

---

### **Step 4: Add API Key to Your Project**

1. Open your `.env.local` file
2. Add this line:
   ```
   RAPIDAPI_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual key
4. Save the file

Example:
```env
# RapidAPI Configuration
RAPIDAPI_KEY=abc123def456ghi789jkl012mno345pqr678
```

---

## 💰 Cost Breakdown

### **Recommended Setup (Tier 1 + Tier 2)**

```
APIs: Active Jobs DB, JSearch, Indeed, Remote Jobs, LinkedIn
Cost per search: $0.005 (5 API calls)
Monthly limit: 1000 searches
Monthly cost: $5

With caching (50% hit rate):
Actual searches: 500
Monthly cost: $2.50
```

### **Minimal Setup (Tier 1 Only)**

```
APIs: Active Jobs DB, JSearch, Indeed
Cost per search: $0.003 (3 API calls)
Monthly limit: 1000 searches
Monthly cost: $3

With caching (50% hit rate):
Actual searches: 500
Monthly cost: $1.50
```

### **Full Setup (All Tiers)**

```
APIs: All 7 APIs
Cost per search: $0.007 (7 API calls)
Monthly limit: 1000 searches
Monthly cost: $7

With caching (50% hit rate):
Actual searches: 500
Monthly cost: $3.50
```

---

## 🎯 Which Plan Should You Choose?

### **For Testing/Development**
- **Tier 1 only** (Active Jobs DB, JSearch, Indeed)
- Cost: ~$1.50/month with caching
- Perfect for testing the system

### **For Production (Recommended)**
- **Tier 1 + Tier 2** (Add Remote Jobs + LinkedIn)
- Cost: ~$2.50/month with caching
- Best coverage and quality

### **For Maximum Coverage**
- **All Tiers** (All 7 APIs)
- Cost: ~$3.50/month with caching
- Includes freelance platforms

---

## 🔧 Configuration

### **Enable/Disable Sources**

You can enable/disable sources in `src/lib/rapidapi-client.ts`:

```typescript
export const JOB_SOURCES: Record<string, JobSource> = {
  'active-jobs-db': {
    enabled: true  // ← Change to false to disable
  },
  'jsearch': {
    enabled: true
  },
  // ... etc
}
```

### **Control Which Sources Are Used**

The system automatically selects sources based on user preferences:

- **Remote jobs?** → Adds Remote Jobs API
- **Freelance?** → Adds Upwork + Freelancer
- **Startups?** → Adds Startup Jobs API
- **Always uses:** Active Jobs DB, JSearch, Indeed

---

## 📊 Monitoring Usage

### **Check Your Usage**

1. Go to [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
2. Click "Analytics"
3. See requests per API

### **Set Usage Alerts**

1. Go to each API's page
2. Click "Pricing"
3. Set up alerts for 80% usage

---

## ✅ Verification

### **Test Your Setup**

1. Start your dev server: `npm run dev`
2. Make a test API call to `/api/jobs/search-v2`:

```bash
curl -X POST http://localhost:3000/api/jobs/search-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["React", "Developer"],
    "location": "Toronto, ON",
    "remote": true
  }'
```

3. Check the response:
   - Should return jobs from multiple sources
   - Check `metadata.sources` to see which APIs were queried
   - Check `metadata.cost` to see the cost

### **Expected Response**

```json
{
  "success": true,
  "jobs": [...],
  "metadata": {
    "sources": ["active-jobs-db", "jsearch", "indeed", "remote-jobs", "linkedin"],
    "cost": 0.005,
    "duration": 8500,
    "cached": false,
    "totalJobs": 350,
    "uniqueJobs": 250,
    "ranking": {
      "averageMatch": 75.5,
      "topMatch": 95.2,
      "excellentMatches": 45
    }
  }
}
```

---

## 🚨 Troubleshooting

### **Error: "No API key found"**
- Make sure `RAPIDAPI_KEY` is in `.env.local`
- Restart your dev server after adding the key

### **Error: "HTTP 403: Forbidden"**
- Your API key is invalid or expired
- Go to RapidAPI dashboard and get a new key

### **Error: "HTTP 429: Too Many Requests"**
- You've hit your monthly limit
- Upgrade your plan or wait for next month
- Enable caching to reduce API calls

### **No jobs returned**
- Check if you're subscribed to the APIs
- Check API status on RapidAPI dashboard
- Try with different keywords

---

## 📈 Scaling Up

### **When to Upgrade**

If you're hitting limits, upgrade plans:

1. **Basic → Pro**: 10,000 requests/month ($10/month per API)
2. **Pro → Ultra**: 100,000 requests/month ($100/month per API)
3. **Ultra → Mega**: 1,000,000 requests/month ($500/month per API)

### **Cost Optimization Tips**

1. **Enable caching** (24-hour TTL) - saves 50-70% of API calls
2. **Limit sources** - use `maxSources: 3` in search preferences
3. **Smart source selection** - only query relevant APIs
4. **Batch searches** - encourage users to refine searches instead of new ones

---

## 🎉 You're Done!

Your multi-source job aggregator is now ready!

**Next steps:**
1. Test with different search queries
2. Monitor usage in RapidAPI dashboard
3. Adjust source selection based on results
4. Scale up as needed

**Questions?** Check the code comments in:
- `src/lib/rapidapi-client.ts`
- `src/lib/job-aggregator-service.ts`
- `src/app/api/jobs/search-v2/route.ts`
