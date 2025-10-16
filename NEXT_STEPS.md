# Next Steps - Frontend Autopilot Integration

## ✅ Completed (Just Now)
1. ✅ Analytics page re-enabled with relative imports
2. ✅ Resume upload page triggers autopilot
3. ✅ All backend infrastructure complete

## 🎯 Remaining Work (3-4 hours)

### Priority 1: Update Optimizer Page (30 min)
**File:** `src/app/career-finder/optimizer/page.tsx`

**Current Issue:**
- Uses old `/api/resume-builder/generate` endpoint
- Generates variants every time (no caching)
- Makes 2 API calls per generation

**Required Changes:**
```typescript
// 1. Check cache first
const cached = localStorage.getItem('cf:resumeVariants')
if (cached) {
  const variants = JSON.parse(cached)
  setVariantA(variants.variantA)
  setVariantB(variants.variantB)
  return
}

// 2. Call new endpoint
const response = await fetch('/api/resume/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resumeText,
    jobTitle,
    jobRequirements: [],
    companyInsights: { culture: '', values: [], industry: '' }
  })
})

const { data } = await response.json()

// 3. Cache result
localStorage.setItem('cf:resumeVariants', JSON.stringify(data))
setVariantA(data.variantA)
setVariantB(data.variantB)
```

---

### Priority 2: Update Cover Letter Page (30 min)
**File:** `src/app/career-finder/cover-letter/page.tsx`

**Required Changes:**
```typescript
// 1. Check cache first
const cached = localStorage.getItem('cf:coverLetters')
if (cached) {
  const letters = JSON.parse(cached)
  setCoverLetters(letters)
  return
}

// 2. Call new endpoint
const response = await fetch('/api/cover-letter/generate-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobTitle,
    company,
    resumeText,
    jobRequirements: [],
    companyInsights: { culture: '', values: [], recentNews: [] },
    hiringManager: { name: '', title: '' }
  })
})

const { data } = await response.json()

// 3. Cache result
localStorage.setItem('cf:coverLetters', JSON.stringify(data))
setCoverLetters(data)
```

---

### Priority 3: Update Outreach Page (30 min)
**File:** `src/app/career-finder/outreach/page.tsx`

**Required Changes:**
```typescript
// 1. Check cache first
const cached = localStorage.getItem('cf:emailOutreach')
if (cached) {
  const outreach = JSON.parse(cached)
  setEmailData(outreach)
  return
}

// 2. Call new endpoint
const response = await fetch('/api/contacts/email-outreach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hiringContact: { name: '', title: '', email: '' },
    jobTitle,
    company,
    resumeHighlights: []
  })
})

const { data } = await response.json()

// 3. Cache result
localStorage.setItem('cf:emailOutreach', JSON.stringify(data))
setEmailData(data)
```

---

### Priority 4: Test End-to-End Flow (1 hour)

**Test Scenario:**
1. Upload resume → Autopilot triggers
2. Navigate to search → Uses cached signals
3. Select job → Comprehensive research runs
4. Go to optimizer → Check cache first, generate if needed
5. Go to cover letter → Check cache first, generate if needed
6. Go to outreach → Check cache first, generate if needed
7. Refresh page → All data loads from cache instantly

**Expected Results:**
- First run: 6 Perplexity API calls
- Subsequent visits: 0 API calls (all from cache)
- Page loads: Instant (no loading spinners)

---

### Priority 5: Optional Improvements (1-2 hours)

#### A. Add Cache Invalidation
```typescript
// Clear cache when user uploads new resume
const clearAutopilotCache = () => {
  localStorage.removeItem('cf:signals')
  localStorage.removeItem('cf:comprehensiveResearch')
  localStorage.removeItem('cf:resumeVariants')
  localStorage.removeItem('cf:coverLetters')
  localStorage.removeItem('cf:emailOutreach')
}
```

#### B. Add Loading States
```typescript
// Show cached data immediately, then refresh in background
const [isRefreshing, setIsRefreshing] = useState(false)

// Load from cache
const cached = localStorage.getItem('cf:resumeVariants')
if (cached) {
  setVariantA(JSON.parse(cached).variantA)
  setVariantB(JSON.parse(cached).variantB)
}

// Refresh in background if stale
if (isCacheStale(cached)) {
  setIsRefreshing(true)
  // Call API and update cache
}
```

#### C. Add TTL Checks
```typescript
interface CachedData {
  data: any
  cachedAt: number
  ttl: number // milliseconds
}

const isCacheStale = (cached: string | null): boolean => {
  if (!cached) return true
  const { cachedAt, ttl } = JSON.parse(cached)
  return Date.now() - cachedAt > ttl
}
```

---

## 📊 Impact Summary

### Before Autopilot:
- 12+ API calls per complete flow
- Additional calls on every page refresh
- Slow page loads
- High Perplexity costs

### After Autopilot:
- 6 API calls on first run
- 0 API calls on subsequent visits
- Instant page loads
- 50% cost reduction

---

## 🔧 Technical Notes

### Cache Keys:
- `cf:signals` - Resume keywords and location
- `cf:comprehensiveResearch` - Full job research data
- `cf:resumeVariants` - Generated resume variants
- `cf:coverLetters` - Generated cover letters
- `cf:emailOutreach` - Generated email templates

### API Endpoints:
- `POST /api/career-finder/autopilot` - Trigger comprehensive research
- `POST /api/resume/optimize` - Generate resume variants
- `POST /api/cover-letter/generate-v2` - Generate cover letters
- `POST /api/contacts/email-outreach` - Generate email templates

### Error Handling:
```typescript
try {
  // Try to load from cache
  const cached = localStorage.getItem(key)
  if (cached) return JSON.parse(cached)
  
  // Call API if no cache
  const response = await fetch(endpoint, options)
  if (!response.ok) throw new Error('API call failed')
  
  const data = await response.json()
  localStorage.setItem(key, JSON.stringify(data))
  return data
} catch (error) {
  console.error('Error:', error)
  // Show error to user
  // Fall back to default behavior
}
```

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] All TypeScript errors resolved
- [ ] All pages tested locally
- [ ] Cache-first pattern implemented
- [ ] Error handling added
- [ ] Loading states added
- [ ] Documentation updated

After deploying:
- [ ] Test on production
- [ ] Monitor Perplexity API usage
- [ ] Check error logs
- [ ] Verify cache hit rates
- [ ] Test on mobile devices

---

## 📝 Code Snippets

### Generic Cache-First Hook
```typescript
function useCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 24 * 60 * 60 * 1000 // 24 hours
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check cache
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const { data, cachedAt } = JSON.parse(cached)
          if (Date.now() - cachedAt < ttl) {
            setData(data)
            setLoading(false)
            return
          }
        }

        // Fetch if no cache or stale
        const freshData = await fetchFn()
        localStorage.setItem(cacheKey, JSON.stringify({
          data: freshData,
          cachedAt: Date.now()
        }))
        setData(freshData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [cacheKey])

  return { data, loading, error }
}
```

### Usage Example
```typescript
const { data: variants, loading, error } = useCachedData(
  'cf:resumeVariants',
  async () => {
    const response = await fetch('/api/resume/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobTitle, jobRequirements, companyInsights })
    })
    return response.json()
  }
)
```

---

## 🎯 Success Criteria

1. ✅ Resume upload triggers autopilot
2. ⏳ Optimizer uses cache-first pattern
3. ⏳ Cover letter uses cache-first pattern
4. ⏳ Outreach uses cache-first pattern
5. ⏳ Page refreshes load instantly from cache
6. ⏳ First-time flow makes only 6 API calls
7. ⏳ Subsequent visits make 0 API calls

---

## 📞 Support

See documentation:
- `AUTOPILOT_IMPLEMENTATION.md` - Complete autopilot guide
- `PRODUCTION_IMPROVEMENTS.md` - Production improvements
- `PROGRESS_SUMMARY.md` - Current status

---

**Ready to continue? Start with Priority 1: Update Optimizer Page**
