# Job Pre-Fetching Test Guide

## 🎯 Test Configuration

### **Location**: Edmonton, AB
### **Radius**: 150 km
### **Schedule**: Tuesday and Saturday at 3:00 AM EST
### **Cron Expression**: `0 8 * * 2,6` (8 AM UTC = 3 AM EST)

---

## 🧪 How to Test NOW

### **1. Start Development Server**
```bash
npm run dev
```

Wait for: `✓ Ready in X.Xs`

### **2. Run Test Endpoint**
```bash
curl http://localhost:3000/api/cron/test-prefetch
```

Or open in browser:
```
http://localhost:3000/api/cron/test-prefetch
```

### **3. What the Test Does**

The test will search for jobs in **5 different categories**:

1. **Sales & Business Development**
   - Keywords: "sales, business development, CRM"
   - Target: 50 jobs

2. **Software Development**
   - Keywords: "software developer, software engineer, developer"
   - Target: 50 jobs

3. **Finance & Accounting**
   - Keywords: "finance, financial analyst, accounting"
   - Target: 50 jobs

4. **Project Management**
   - Keywords: "project manager, program manager, scrum master"
   - Target: 50 jobs

5. **Marketing**
   - Keywords: "marketing, digital marketing, content marketing"
   - Target: 50 jobs

**Total Expected**: ~200-250 jobs across all categories

---

## 📊 Expected Response

```json
{
  "success": true,
  "message": "Test job pre-fetch completed",
  "results": {
    "location": "Edmonton, AB",
    "radius": 150,
    "keywords": [...],
    "searches": [
      {
        "keywords": "sales, business development, CRM",
        "jobCount": 47,
        "success": true,
        "cached": false
      },
      {
        "keywords": "software developer, software engineer, developer",
        "jobCount": 52,
        "success": true,
        "cached": false
      },
      {
        "keywords": "finance, financial analyst, accounting",
        "jobCount": 38,
        "success": true,
        "cached": false
      },
      {
        "keywords": "project manager, program manager, scrum master",
        "jobCount": 45,
        "success": true,
        "cached": false
      },
      {
        "keywords": "marketing, digital marketing, content marketing",
        "jobCount": 41,
        "success": true,
        "cached": false
      }
    ],
    "totalJobs": 223,
    "success": 5,
    "failed": 0,
    "errors": []
  },
  "summary": {
    "totalSearches": 5,
    "successfulSearches": 5,
    "failedSearches": 0,
    "totalJobsFound": 223,
    "averageJobsPerSearch": 45
  }
}
```

---

## ⏱️ Test Duration

- **5 searches** × **3 seconds** (rate limit) = **~15 seconds**
- Plus API call time: **~30-45 seconds total**

---

## ✅ Success Criteria

### **Test Passes If**:
- ✅ All 5 searches succeed
- ✅ Total jobs found: 150-250
- ✅ Average jobs per search: 30-50
- ✅ No errors in response
- ✅ Jobs are from Edmonton area (150km radius)

### **Test Fails If**:
- ❌ Any search returns 0 jobs
- ❌ Total jobs < 50
- ❌ Errors in response
- ❌ API timeout

---

## 🔍 Verifying Results

### **1. Check Console Logs**
Look for:
```
[TEST PREFETCH] Starting test job download for Edmonton, AB...
[TEST PREFETCH] Test configuration: { location: 'Edmonton, AB', radius: 150, ... }
[TEST PREFETCH] Searching for: sales, business development, CRM
[TEST PREFETCH] ✅ Found 47 jobs for: sales, business development, CRM
[TEST PREFETCH] Searching for: software developer, software engineer, developer
[TEST PREFETCH] ✅ Found 52 jobs for: software developer, software engineer, developer
...
[TEST PREFETCH] Test completed: { totalSearches: 5, success: 5, failed: 0, totalJobs: 223 }
```

### **2. Check Database**
Jobs should be cached in `JobSearchCache` collection:
```javascript
// MongoDB query
db.jobsearchcache.find({ location: /Edmonton/i }).count()
// Should return 5 (one per search)
```

### **3. Verify Job Data**
Sample job should have:
- ✅ `title`: Job title
- ✅ `company`: Company name
- ✅ `location`: Edmonton, AB (or within 150km)
- ✅ `url`: Job posting URL
- ✅ `summary`: Job description
- ✅ `salary`: Salary info (if available)
- ✅ `posted`: Posted date

---

## 🚀 Production Deployment

### **Before Launch**:
1. ✅ Test passes locally
2. ✅ Verify job quality and relevance
3. ✅ Check API rate limits
4. ✅ Set `CRON_SECRET` environment variable
5. ✅ Update radius if needed (currently 150km)

### **After Launch**:
1. Change location from Edmonton to user-specific
2. Adjust radius based on results (50km, 100km, etc.)
3. Add more keyword categories
4. Increase user limit from 100 to more

---

## 📅 Cron Schedule

### **Current Schedule**:
- **Days**: Tuesday (2) and Saturday (6)
- **Time**: 3:00 AM EST (8:00 AM UTC)
- **Frequency**: Twice per week

### **Why Tuesday and Saturday?**:
- **Tuesday**: Mid-week refresh (new jobs posted Monday)
- **Saturday**: Weekend refresh (jobs posted during week)
- **3 AM EST**: Before users wake up, fresh jobs ready

### **Cron Expression Breakdown**:
```
0 8 * * 2,6
│ │ │ │ └─── Days: 2 (Tue), 6 (Sat)
│ │ │ └───── Month: * (every month)
│ │ └─────── Day of month: * (any day)
│ └───────── Hour: 8 (8 AM UTC = 3 AM EST)
└─────────── Minute: 0
```

---

## 🐛 Troubleshooting

### **Issue: No jobs found**
**Solution**:
- Check Perplexity API credits
- Verify location spelling: "Edmonton, AB"
- Check API logs for errors
- Try different keywords

### **Issue: Timeout**
**Solution**:
- Reduce number of searches from 5 to 3
- Increase rate limit from 3s to 5s
- Check network connection
- Verify MongoDB connection

### **Issue: Duplicate jobs**
**Solution**:
- Deduplication is automatic
- Check `JobSearchCache` for existing entries
- Clear cache: `db.jobsearchcache.deleteMany({})`

### **Issue: Jobs outside radius**
**Solution**:
- Perplexity API may not respect exact radius
- Filter results client-side if needed
- Adjust radius parameter

---

## 📈 Performance Metrics

### **Target Metrics**:
- **API Response Time**: < 5 seconds per search
- **Total Test Time**: < 60 seconds
- **Jobs per Search**: 30-50
- **Success Rate**: > 95%
- **Cache Hit Rate**: > 80% (after first run)

### **Monitor**:
- Perplexity API usage
- MongoDB storage
- Cache expiration (21 days)
- Error rates

---

## 🎯 Next Steps After Testing

1. **If test succeeds**:
   - ✅ Deploy to production
   - ✅ Set `CRON_SECRET` in Vercel
   - ✅ Monitor first cron run (next Tue/Sat at 3 AM EST)
   - ✅ Verify users see cached jobs

2. **If test fails**:
   - ❌ Check error logs
   - ❌ Verify API credentials
   - ❌ Test individual searches
   - ❌ Contact support if needed

3. **Optimization**:
   - Adjust radius based on results
   - Add more keyword categories
   - Fine-tune search parameters
   - Increase user limit

---

## 🎉 Ready to Test!

**Run this command now**:
```bash
curl http://localhost:3000/api/cron/test-prefetch
```

**Or open in browser**:
```
http://localhost:3000/api/cron/test-prefetch
```

**Expected time**: 30-45 seconds

**Expected result**: 150-250 jobs from Edmonton, AB area

Good luck! 🚀
