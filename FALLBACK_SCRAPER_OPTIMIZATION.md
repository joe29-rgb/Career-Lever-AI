# Fallback Scraper Optimization Strategy

## 🎯 Goal
Reduce live scraping time from **60+ seconds** to **~30 seconds** while maintaining quality results.

## 📊 Current vs Optimized

### Current (Slow)
- Uses **ALL keywords** from resume (10-20 keywords)
- Searches each keyword individually
- Time: 60-90 seconds
- Results: Often redundant/overlapping

### Optimized (Fast)
- Uses **TOP 3 WEIGHTED keywords** only
- Parallel searches
- Time: ~30 seconds
- Results: More focused, less redundant

## 🔑 Keyword Strategy

### Cache Search (Fast - <100ms)
```typescript
// Use ALL keywords for cache search
const allKeywords = extractKeywords(resume)
// Example: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', ...]

const cachedJobs = await searchCache({
  keywords: allKeywords, // ALL keywords
  location: 'Edmonton, AB',
  limit: 50
})
```

### Live Scraping (Slow - 30s)
```typescript
// Only trigger if cache returns < 10 jobs
if (cachedJobs.length < 10) {
  // Extract TOP 3 weighted keywords
  const top3Keywords = getTopWeightedKeywords(resume, 3)
  // Example: ['React', 'Node.js', 'TypeScript']
  
  // Scrape 10 jobs per keyword = 30 jobs total
  const liveJobs = await scrapePublicJobs({
    keywords: top3Keywords, // TOP 3 only
    jobsPerKeyword: 10,
    sources: ['google', 'linkedin', 'indeed']
  })
}
```

## 🏗️ Implementation

### 1. Keyword Weighting Algorithm
```typescript
interface WeightedKeyword {
  keyword: string
  weight: number
  category: 'skill' | 'role' | 'technology' | 'industry'
}

function getTopWeightedKeywords(resume: string, count: number): string[] {
  const keywords = extractKeywords(resume)
  
  // Weight factors:
  // - Frequency in resume (40%)
  // - Position in resume (30%) - earlier = higher weight
  // - Category importance (30%) - skills > roles > tech > industry
  
  const weighted = keywords.map(kw => ({
    keyword: kw,
    weight: calculateWeight(kw, resume)
  }))
  
  return weighted
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .map(w => w.keyword)
}
```

### 2. Parallel Scraping
```typescript
async function scrapePublicJobs(params: {
  keywords: string[]
  jobsPerKeyword: number
  sources: string[]
}): Promise<Job[]> {
  const { keywords, jobsPerKeyword, sources } = params
  
  // Scrape all keywords in parallel
  const promises = keywords.map(keyword =>
    scrapeKeyword(keyword, jobsPerKeyword, sources)
  )
  
  const results = await Promise.all(promises)
  const allJobs = results.flat()
  
  // Deduplicate
  return deduplicateJobs(allJobs)
}

async function scrapeKeyword(
  keyword: string,
  limit: number,
  sources: string[]
): Promise<Job[]> {
  // Scrape each source in parallel
  const promises = sources.map(source =>
    scrapeSource(source, keyword, Math.ceil(limit / sources.length))
  )
  
  const results = await Promise.all(promises)
  return results.flat().slice(0, limit)
}
```

### 3. Source Priority
```typescript
const FALLBACK_SOURCES = [
  {
    name: 'google',
    priority: 1,
    avgTime: 8000, // 8s
    reliability: 0.95
  },
  {
    name: 'linkedin',
    priority: 2,
    avgTime: 12000, // 12s
    reliability: 0.90
  },
  {
    name: 'indeed',
    priority: 3,
    avgTime: 10000, // 10s
    reliability: 0.85
  }
]
```

## 📈 Performance Metrics

### Time Breakdown (30s total)
```
Keyword Extraction:     1s
Top 3 Selection:        0.5s
Parallel Scraping:      25s
  - Google (3 keywords): 8s
  - LinkedIn (3 keywords): 12s
  - Indeed (3 keywords): 10s
Deduplication:          2s
Ranking:                1.5s
```

### Expected Results
```
Top 3 Keywords × 10 jobs each = 30 jobs
After deduplication: ~25 unique jobs
Combined with cache: 10 + 25 = 35 total jobs
```

## 🔄 Complete Flow

```typescript
async function searchJobs(resume: string, location: string) {
  // 1. Extract ALL keywords
  const allKeywords = extractKeywords(resume)
  
  // 2. Search cache with ALL keywords (fast)
  const cachedJobs = await searchCache({
    keywords: allKeywords,
    location,
    limit: 50
  })
  
  console.log(`Found ${cachedJobs.length} jobs in cache`)
  
  // 3. If enough jobs, return immediately
  if (cachedJobs.length >= 10) {
    return {
      jobs: cachedJobs,
      source: 'cache',
      duration: '<100ms'
    }
  }
  
  // 4. Fallback: Live scraping with TOP 3 keywords
  console.log('Cache insufficient, triggering live scraping...')
  
  const top3Keywords = getTopWeightedKeywords(resume, 3)
  console.log(`Top 3 keywords: ${top3Keywords.join(', ')}`)
  
  const liveJobs = await scrapePublicJobs({
    keywords: top3Keywords,
    jobsPerKeyword: 10,
    sources: ['google', 'linkedin', 'indeed']
  })
  
  // 5. Combine and deduplicate
  const allJobs = [...cachedJobs, ...liveJobs]
  const uniqueJobs = deduplicateJobs(allJobs)
  
  return {
    jobs: uniqueJobs,
    source: 'cache+live',
    duration: '~30s',
    breakdown: {
      cached: cachedJobs.length,
      live: liveJobs.length,
      total: uniqueJobs.length
    }
  }
}
```

## 🎯 Trigger Conditions

### When to Use Fallback
```typescript
const FALLBACK_THRESHOLD = 10 // jobs

if (cachedJobs.length < FALLBACK_THRESHOLD) {
  // Trigger fallback scraping
  triggerFallbackScraping()
}
```

### When to Skip Fallback
- Cache has >= 10 jobs ✅
- User is on free tier and hit rate limit ⚠️
- Recent scrape within last 5 minutes (rate limit) ⚠️

## 📊 Success Metrics

### Before Optimization
- ❌ Time: 60-90 seconds
- ❌ Keywords: 10-20 (all)
- ❌ Redundancy: High
- ❌ User experience: Poor

### After Optimization
- ✅ Time: ~30 seconds (50% faster)
- ✅ Keywords: 3 (top weighted)
- ✅ Redundancy: Low
- ✅ User experience: Good
- ✅ API costs: Lower

## 🚀 Next Steps

1. ✅ Build passing
2. ✅ 1,249 jobs in database
3. **TODO**: Implement keyword weighting algorithm
4. **TODO**: Implement parallel fallback scraping
5. **TODO**: Add performance monitoring
6. **TODO**: Test with real resumes

---

**Status**: Design Complete, Ready for Implementation
**Priority**: High
**Estimated Time**: 4-6 hours
