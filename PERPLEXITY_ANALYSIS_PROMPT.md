# 🔍 PERPLEXITY DEEP ANALYSIS PROMPT

## 📋 COPY THIS ENTIRE PROMPT TO PERPLEXITY:

---

I'm building a job scraping system for Canadian jobs. I need a comprehensive analysis of my current codebase and recommendations for fixing broken scrapers.

## 🎯 MY GOAL:
Scrape 10,000+ Canadian jobs per week for $0/month using 100% legal methods (public APIs, public data, no authentication bypass).

## ✅ WHAT'S WORKING:
1. **ATS Direct Access** - 2,778 jobs from Greenhouse/Lever/Workable/Ashby public APIs
2. **LinkedIn Hidden API** - Using `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search` (public endpoint, no auth)

## ❌ WHAT'S BROKEN:
1. **Eluta.ca** - Shows reCAPTCHA even with Puppeteer Stealth plugin
2. **Indeed RSS** - All RSS feeds shut down in 2024
3. **JSON-LD extraction** - Canadian companies don't use JobPosting schema
4. **CivicJobs RSS** - RSS feed URLs return 404

## 📦 MY TECH STACK:
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Vercel (hosting + cron)
- axios, cheerio, puppeteer-extra, rss-parser

## 🔍 QUESTIONS I NEED ANSWERED:

### **1. LINKEDIN API ANALYSIS:**
- Is `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search` a stable public endpoint?
- What are the rate limits?
- Are there better selectors for parsing the HTML response?
- How many jobs can I realistically get per day?
- Any legal concerns with using this endpoint?

### **2. ELUTA.CA BYPASS:**
- Is there a way to bypass Eluta's reCAPTCHA without paid services?
- Does Puppeteer Stealth actually work in 2025?
- Are there better stealth configurations?
- Alternative: Does Eluta have a public API or RSS feed?
- Is it worth the effort or should I skip it?

### **3. CANADIAN JOB SOURCES:**
- What are the TOP 10 free Canadian job APIs/sources?
- Does Job Bank Canada (jobbank.gc.ca) have a public API?
- Are there other government job sources with RSS/APIs?
- What about provincial job boards?
- Any hidden/undocumented APIs I should know about?

### **4. WEB SCRAPING BEST PRACTICES:**
- What's the best way to scrape dynamic JavaScript sites in 2025?
- Puppeteer vs Playwright vs Selenium - which is best for job scraping?
- How to avoid detection without paid proxies?
- Best user-agent rotation strategies?
- How to handle rate limiting gracefully?

### **5. ADZUNA API:**
- Is Adzuna's free tier still available in 2025?
- How many requests per day on free tier?
- Best practices for maximizing Adzuna results?
- Are there similar free job APIs?

### **6. JSEARCH (RAPIDAPI):**
- Is JSearch API worth it for Canadian jobs?
- How many Canadian jobs does it actually have?
- Free tier limits?
- Better alternatives on RapidAPI?

### **7. COMPANY CAREER PAGES:**
- What's the most common ATS used by Canadian companies?
- List of Canadian companies using Workday, Greenhouse, Lever, etc.?
- How to detect which ATS a company uses?
- Best way to scrape Workday career pages?

### **8. LEGAL & ETHICAL:**
- Is scraping LinkedIn's public job search legal?
- robots.txt best practices for job scraping?
- What's considered "fair use" for job data?
- Any Canadian-specific laws about web scraping?

### **9. ARCHITECTURE:**
- Best way to orchestrate multiple scrapers?
- How to handle failures gracefully?
- Deduplication strategies for 10K+ jobs?
- Database schema for job data?
- Cron job best practices for daily scraping?

### **10. PERFORMANCE:**
- How to scrape 10K jobs in under 1 hour?
- Parallel vs sequential scraping?
- Memory management for large scrapes?
- Best way to batch insert to Supabase?

### **11. FALLBACK STRATEGIES:**
- If LinkedIn API changes, what's the backup?
- If ATS Direct fails, what's the fallback?
- How to build a resilient multi-source scraper?
- Circuit breaker patterns for scrapers?

### **12. HIDDEN GEMS:**
- Are there any undocumented job APIs?
- RSS feeds that still work in 2025?
- JSON feeds from job boards?
- Sitemap.xml scraping strategies?
- Any "secret" Canadian job sources?

## 📊 CURRENT CODEBASE STRUCTURE:

```
src/
├── lib/
│   ├── apis/
│   │   ├── ats-direct-access.ts (WORKING ✅)
│   │   ├── linkedin-hidden-api.ts (WORKING ✅)
│   │   ├── indeed-rss.ts (DEAD ❌)
│   │   ├── civic-jobs-rss.ts (BROKEN ❌)
│   │   ├── jsearch.ts (UNTESTED ⚠️)
│   │   └── job-bank-canada.ts (UNTESTED ⚠️)
│   ├── scrapers/
│   │   ├── eluta.ts (BROKEN ❌)
│   │   ├── eluta-puppeteer.ts (CAPTCHA ❌)
│   │   └── jsonld-extractor.ts (BROKEN ❌)
│   └── orchestrator/
│       └── legal-free-scraper.ts (PARTIAL ⚠️)
```

## 🎯 WHAT I NEED FROM YOU:

1. **Validate my working scrapers** - Are ATS Direct and LinkedIn sustainable?
2. **Fix or replace broken scrapers** - Specific code fixes or alternatives
3. **Recommend new sources** - Free Canadian job APIs I'm missing
4. **Architecture advice** - How to build a bulletproof multi-source scraper
5. **Legal guidance** - What's safe vs risky
6. **Performance tips** - How to scale to 10K+ jobs
7. **Fallback strategies** - What to do when sources fail
8. **Hidden opportunities** - Undocumented APIs or clever tricks

## 📝 DELIVERABLES I WANT:

1. **Source Evaluation** - Rate each source (working/broken/worth fixing)
2. **New Source List** - Top 5 free Canadian job sources I should add
3. **Code Fixes** - Specific fixes for broken scrapers
4. **Architecture Plan** - How to structure the final scraper
5. **Legal Assessment** - What's safe to use
6. **Performance Plan** - How to hit 10K jobs in 1 hour
7. **Fallback Strategy** - What to do when things break

## 🚀 BONUS QUESTIONS:

- Is there a "Job Bank Canada API" that's not publicly documented?
- Do any Canadian provinces have job APIs?
- Are there any Canadian job aggregators with free APIs?
- What about scraping Google Jobs (Google for Jobs)?
- Any AI-powered job discovery tools I should know about?
- What's the state of job scraping in 2025 - what's changed?

---

**Please provide a comprehensive analysis with:**
- ✅ Specific, actionable recommendations
- ✅ Code examples where relevant
- ✅ Links to documentation
- ✅ Legal considerations
- ✅ Performance benchmarks
- ✅ Real-world success rates

**I want to build the most reliable, legal, free Canadian job scraper possible!** 🇨🇦

---

## 📎 ADDITIONAL CONTEXT:

**Current Results:**
- ATS Direct: 2,778 jobs ✅
- LinkedIn: 30 jobs in test (10 per search) ✅
- Total: ~2,800 jobs working
- Goal: 10,000+ jobs

**Tech Constraints:**
- Must run on Vercel (serverless)
- Must be $0/month (free tier only)
- Must be 100% legal
- Must complete in under 1 hour
- Must handle failures gracefully

**What I'm willing to do:**
- ✅ Use public APIs
- ✅ Scrape public data
- ✅ Use free tier APIs
- ✅ Build complex orchestration
- ✅ Handle rate limiting

**What I'm NOT willing to do:**
- ❌ Pay for proxies
- ❌ Pay for CAPTCHA solving
- ❌ Bypass authentication
- ❌ Violate ToS
- ❌ Use paid APIs

---

**ANALYZE MY SITUATION AND GIVE ME A COMPLETE BATTLE PLAN TO HIT 10,000+ JOBS!** 🎯
