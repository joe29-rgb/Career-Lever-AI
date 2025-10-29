# Bulk Download Strategy - Getting 6K-10K Jobs

## Problem
Currently getting only ~100 jobs when we should get 6,000-10,000 jobs from Edmonton.

## Root Causes
1. **APIs require search terms** - Empty queries return minimal results
2. **No pagination** - Only getting page 1 (10-100 jobs per API)
3. **Free tier limits** - RapidAPI free tiers limit requests/month
4. **Single API call per source** - Need multiple calls with different parameters

## Solution: Multi-Strategy Approach

### Strategy 1: Broad Category Searches (Recommended)
Make multiple API calls with broad job categories:
- "full time" 
- "part time"
- "manager"
- "engineer"
- "sales"
- "healthcare"
- "retail"
- "administrative"
- "customer service"
- "warehouse"

**Expected**: 10 searches × 4 APIs × 100 jobs = 4,000 jobs
**After dedup**: ~2,500-3,000 unique jobs

### Strategy 2: Pagination (If APIs Support)
For each API, make multiple requests with pagination:
- JSearch: `num_pages: 10` (already implemented)
- Active Jobs DB: `offset: 0, 100, 200, 300...`
- Google Jobs: Multiple calls with different pages
- Adzuna: `page: 1, 2, 3...`

**Expected**: 10 pages × 4 APIs × 100 jobs = 4,000 jobs

### Strategy 3: Location Expansion
Search surrounding cities within 150km:
- Edmonton
- Sherwood Park
- St. Albert
- Spruce Grove
- Fort Saskatchewan
- Leduc

**Expected**: 6 cities × 4 APIs × 100 jobs = 2,400 jobs

### Strategy 4: Hybrid (BEST)
Combine all strategies:
1. Use 5-10 broad search terms
2. Paginate each search (2-3 pages)
3. Search main city + 2-3 surrounding cities

**Expected**: 8 searches × 3 pages × 3 cities × 4 APIs = 9,600 jobs
**After dedup**: ~6,000-8,000 unique jobs ✅

## Implementation Plan

### Phase 1: Broad Searches (Quick Win)
```typescript
const searches = [
  'full time', 'part time', 'manager', 'engineer', 
  'sales', 'healthcare', 'retail', 'customer service'
]

for (const term of searches) {
  const jobs = await queryAPIs(term, 'Edmonton')
  allJobs.push(...jobs)
  await delay(2000) // Rate limit protection
}
```

### Phase 2: Add Pagination
```typescript
for (const term of searches) {
  for (let page = 1; page <= 3; page++) {
    const jobs = await queryAPIs(term, 'Edmonton', page)
    allJobs.push(...jobs)
  }
}
```

### Phase 3: Add Surrounding Cities
```typescript
const cities = ['Edmonton', 'Sherwood Park', 'St. Albert']

for (const city of cities) {
  for (const term of searches) {
    const jobs = await queryAPIs(term, city)
    allJobs.push(...jobs)
  }
}
```

## Rate Limits & Timing

### RapidAPI Free Tier Limits
- **Requests/month**: 500-1,000 (varies by API)
- **Requests/second**: 1-5

### Our Usage
- **Bulk download**: 2x/week = 8x/month
- **Requests per download**: 
  - 8 searches × 4 APIs = 32 requests
  - With pagination (3 pages): 96 requests
  - With cities (3): 288 requests

**Total**: 288 requests × 8 downloads = **2,304 requests/month**

### Solution: Upgrade to Paid Tier
- **Basic Plan**: $10-20/month per API
- **Requests**: 10,000-50,000/month
- **Cost**: $40-80/month for 4 APIs
- **ROI**: Enables 6K-10K jobs vs 100 jobs

## Recommendation

**Immediate (Free Tier)**:
- Implement broad category searches (8 terms)
- Expected: 2,500-3,000 jobs
- Time: 5-10 minutes per download

**Next Week (Paid Tier)**:
- Upgrade to Basic plans ($40/month)
- Add pagination (3 pages per search)
- Add surrounding cities
- Expected: 6,000-8,000 jobs
- Time: 20-30 minutes per download

## Testing

Run bulk download and check:
```
db.globaljobscaches.countDocuments()
// Expected: 2,500+ (free tier) or 6,000+ (paid tier)

db.globaljobscaches.aggregate([
  { $group: { _id: "$source", count: { $sum: 1 } } }
])
// Should show jobs from all 4 sources
```
