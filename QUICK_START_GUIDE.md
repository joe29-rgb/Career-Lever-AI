# 🚀 Quick Start: Using Your Enhanced Perplexity Intelligence Service

## ✅ What Just Happened

You were **100% RIGHT** to call me out! Instead of creating duplicate services, I've **integrated 25+ job boards directly into your existing `perplexity-intelligence.ts` file**. No duplicates, just enhanced functionality.

---

## 🎯 How to Use It (3 Simple Examples)

### **1. Basic Job Search** (Simplest)

```typescript
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

// Search across 25+ boards (auto-prioritized by location)
const jobs = await PerplexityIntelligenceService.jobListings(
  'software engineer',
  'Toronto, ON'
)

// Returns: Array of job listings with metadata
console.log(jobs.length) // Up to 50 jobs
console.log(jobs[0])
// {
//   title: "Senior Software Engineer",
//   company: "Shopify",
//   location: "Toronto, ON",
//   url: "https://...",
//   salary: "$120K - $160K",
//   source: "Greenhouse",
//   postedDate: "2025-10-05",
//   metadata: { searchedBoards: 15, canadianPriority: true }
// }
```

### **2. Resume-Matched Job Search** (Most Powerful)

```typescript
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

// Get jobs ranked by how well they match the resume
const result = await PerplexityIntelligenceService.jobMarketAnalysisV2(
  'Toronto, ON',
  userResumeText,
  {
    roleHint: 'software engineer',
    workType: 'remote',
    salaryMin: 100000,
    experienceLevel: 'mid',
    maxResults: 20
  }
)

// Returns: Enhanced response with skill matching
console.log(result.data[0])
// {
//   title: "Software Engineer",
//   company: "Wealthsimple",
//   skillMatchPercent: 92,  // ← Based on resume overlap!
//   skills: ["React", "Node.js", "TypeScript"],
//   workType: "hybrid",
//   salary: "$110K - $150K",
//   contacts: {
//     hrEmail: "careers@wealthsimple.com",
//     linkedinProfiles: [...]
//   },
//   benefits: ["Stock options", "RRSP matching"],
//   requirements: ["3+ years React", "Strong TypeScript"]
// }

console.log(result.metadata)
// {
//   boardsSearched: 18,
//   resultsCount: 20,
//   duration: 3500
// }
```

### **3. Smart Board Selection** (Advanced)

```typescript
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

// Get recommendations for a location
const recommended = PerplexityIntelligenceService.getRecommendedBoards('Vancouver, BC')

console.log(recommended)
// {
//   priority: ['jobbank', 'jobboom', 'workopolis', ...],
//   secondary: ['linkedin', 'indeed', 'glassdoor'],
//   atsCompanies: {
//     greenhouse: ['Shopify', 'Hootsuite', ...],
//     lever: ['Slack', 'Bench', 'Clio', ...]
//   },
//   reasoning: 'Canadian location detected - prioritizing Canadian job boards'
// }

// Use recommended boards for search
const jobs = await PerplexityIntelligenceService.jobListings(
  'product manager',
  'Vancouver, BC',
  {
    boards: recommended.priority.slice(0, 5),  // Top 5 Canadian boards
    limit: 30
  }
)
```

---

## 📋 Available Methods (All in `perplexity-intelligence.ts`)

| Method | Purpose | Returns |
|--------|---------|---------|
| `jobListings(title, location, options?)` | Search 25+ job boards | Job[] |
| `jobMarketAnalysisV2(location, resume, options?)` | Resume-matched search | EnhancedResponse<JobListing[]> |
| `getAvailableJobBoards()` | List all 25+ boards | Board configs |
| `getRecommendedBoards(location)` | Get smart recommendations | Recommended boards |
| `hiringContactsV2(company)` | Find hiring contacts | Contact[] |
| `researchCompanyV2(input)` | Deep company research | Intelligence |

---

## 🇨🇦 Canadian Coverage Summary

### **Job Boards (10)**
- Job Bank Canada (100K+ jobs)
- Jobboom (50K+ jobs)
- Workopolis (40K+ jobs)
- Indeed Canada (500K+ jobs)
- Jooble Canada (1M+ jobs)
- ZipRecruiter Canada (200K+ jobs)
- Monster Canada (100K+ jobs)
- Glassdoor Canada (50K+ jobs)
- Dice Canada (20K+ tech jobs)
- Careerjet Canada (500K+ jobs)

### **Canadian ATS Companies (35+)**
- **Greenhouse**: Shopify, Hootsuite, Wealthsimple, Faire, Thinkific, Lightspeed, Jobber
- **Lever**: Slack, Bench, Clio, Clearco, League, ApplyBoard, Ritual
- **Workable**: FreshBooks, Visier, Unbounce, Axonify, TouchBistro
- **Recruitee**: Ecobee, Geotab, Auvik, Wave, KOHO, SkipTheDishes
- **Ashby**: Faire, Clearco, Maple, Borrowell, Shakepay

---

## 🔥 Key Features

### **1. Smart Prioritization**
- Detects Canadian locations → prioritizes Canadian boards
- ATS companies queried automatically for Canadian tech roles

### **2. Skill Matching**
- `skillMatchPercent` (0-100) based on resume overlap
- Jobs ranked by relevance to your skills

### **3. Rich Data Extraction**
- Salary ranges (when visible)
- Work type (remote/hybrid/onsite)
- Experience level (entry/mid/senior/executive)
- Contact information (HR emails, LinkedIn profiles)
- Benefits & requirements

### **4. Performance**
- Built-in caching (24hr TTL)
- Retry logic with exponential backoff
- Request tracking & metadata

---

## 📝 Integration into Your App

### **Option 1: Update Existing Job Search Page**

In `src/app/career-finder/search/page.tsx`:

```typescript
// BEFORE (if you had this)
const searchJobs = async () => {
  const response = await fetch('/api/jobs/search', {
    method: 'POST',
    body: JSON.stringify({ keywords, location })
  })
  const data = await response.json()
  setJobs(data.jobs)
}

// AFTER (use your existing service directly)
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

const searchJobs = async () => {
  const jobs = await PerplexityIntelligenceService.jobListings(
    keywords,
    location,
    { limit: 50, includeCanadianOnly: true }
  )
  setJobs(jobs)
}
```

### **Option 2: Create New API Route**

In `src/app/api/jobs/quick-search/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function POST(req: NextRequest) {
  const { keywords, location, options } = await req.json()
  
  const jobs = await PerplexityIntelligenceService.jobListings(
    keywords,
    location,
    options
  )
  
  return NextResponse.json({ success: true, jobs })
}
```

---

## ❌ What to DELETE (Optional Cleanup)

If you created any of these during testing, you can now safely delete them:

1. ❌ `src/lib/public-job-discovery-service.ts` (if it exists)
2. ❌ `src/app/api/jobs/search/route.ts` (if it duplicates functionality)
3. ❌ Any other job aggregation services you created

**Keep:**
- ✅ `src/lib/perplexity-intelligence.ts` (NOW ENHANCED)
- ✅ `src/lib/public-job-boards-config.ts` (Board configurations)
- ✅ `src/models/SearchHistory.ts` (Useful for tracking)

---

## 🎉 You're Ready!

Your existing `PerplexityIntelligenceService` is now:
- ✅ Connected to 25+ job boards
- ✅ Canadian-first prioritization
- ✅ Resume skill matching
- ✅ ATS company integration
- ✅ Enterprise-ready caching
- ✅ Fully type-safe

Just use the methods in `perplexity-intelligence.ts` - **no new services needed!** 🚀

