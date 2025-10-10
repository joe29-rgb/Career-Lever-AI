# 🔍 PERPLEXITY WEB SEARCH QUESTIONS
## AI-Powered Job Search & Career Intelligence Platform Optimization

**Date:** October 10, 2025  
**Project:** Career Lever AI  
**Purpose:** Get authoritative answers via web search for critical implementation decisions

---

## 📊 CRITICAL QUESTIONS FOR WEB SEARCH

### **1. Perplexity AI API - Best Practices** ⭐⭐⭐⭐⭐

**Question for Perplexity:**
```
What are the current best practices for using Perplexity AI API for job search and company research in October 2025? 

Specifically:
1. Which Perplexity model (sonar, sonar-pro, sonar-reasoning) is best for:
   - Job board web searches
   - Company intelligence gathering
   - Resume keyword extraction
   - JSON-structured responses

2. What are the optimal parameters for job search prompts:
   - Temperature settings (0.1-0.5?)
   - Token limits (2000-4000?)
   - Should web search be enabled or disabled?
   - Best practices for site-specific searches (site:indeed.com syntax)

3. How to structure prompts to get consistent JSON responses:
   - Should I use markdown code blocks?
   - What's the success rate of JSON extraction?
   - How to handle malformed responses?

4. Rate limits and caching strategies:
   - What are the current API rate limits?
   - Recommended cache TTL for job searches?
   - Best practices for retry logic?

Please include links to official Perplexity AI documentation, recent blog posts (2024-2025), and developer forum discussions.
```

**Why This Matters:**
- Your code uses `sonar-pro` but unsure if it's optimal
- Need to verify token limits (currently 2000-4000)
- Job searches returning 0 results might be model-related

---

### **2. Job Board Web Scraping Legal Compliance** ⭐⭐⭐⭐⭐

**Question for Perplexity:**
```
What are the legal and ethical guidelines for web scraping job boards in Canada and the USA as of October 2025?

Specifically:
1. Which job boards explicitly allow API access or data aggregation:
   - Indeed API terms of use
   - LinkedIn Jobs API (if available)
   - Glassdoor scraping policy
   - Canadian job boards (Job Bank, Workopolis, Jobboom)

2. What are the robots.txt rules for major job boards:
   - site:indeed.com/robots.txt
   - site:linkedin.com/robots.txt
   - site:glassdoor.com/robots.txt

3. Legal precedents for job aggregation platforms:
   - hiQ Labs vs LinkedIn (2022 ruling)
   - Meta vs Bright Data (2023 case)
   - Canadian privacy laws (PIPEDA) for job data

4. Best practices for responsible scraping:
   - Rate limiting guidelines
   - User-agent identification
   - Attribution requirements
   - Data retention policies

Please include recent legal updates, terms of service changes, and compliance frameworks.
```

**Why This Matters:**
- Your app searches 25+ job boards via Perplexity
- Need to ensure compliance with ToS
- Avoid legal issues before scaling

---

### **3. ATS-Friendly Resume Optimization Algorithms** ⭐⭐⭐⭐

**Question for Perplexity:**
```
What are the current best practices and algorithms for ATS (Applicant Tracking System) resume optimization in 2025?

Specifically:
1. Which ATS systems are most common:
   - Workday, Greenhouse, Lever, Taleo market share
   - Parsing algorithms they use
   - Common rejection reasons

2. Resume formatting best practices:
   - Font recommendations (Arial, Calibri, Times New Roman?)
   - Section ordering (Experience first vs Education first?)
   - Bullet point formatting
   - Date formats that parse correctly
   - Contact information placement

3. Keyword optimization strategies:
   - How to extract relevant keywords from job descriptions
   - Keyword density recommendations (avoid overstuffing)
   - Synonyms and variations (e.g., "JavaScript" vs "JS")
   - Industry-specific terminology

4. ATS scoring algorithms:
   - How to calculate match percentage (0-100%)
   - Which factors matter most (exact keyword match, skills, experience years?)
   - How to weight different sections (Experience: 40%, Skills: 30%, Education: 20%?)

Please include links to ATS vendor documentation, resume optimization tools, and recent studies on ATS effectiveness.
```

**Why This Matters:**
- Your app calculates ATS scores but algorithm might be basic
- Users rely on this score for resume optimization
- Want industry-standard calculations

---

### **4. Company Intelligence Data Sources** ⭐⭐⭐⭐

**Question for Perplexity:**
```
What are the best free and paid data sources for company intelligence gathering in 2025?

Specifically:
1. Financial data sources:
   - Public company financials (Yahoo Finance, NASDAQ, TMX for Canadian stocks)
   - Private company estimates (Crunchbase, PitchBook, CB Insights)
   - Revenue and valuation databases

2. Company culture and employee sentiment:
   - Glassdoor API availability and scraping policies
   - Indeed company reviews
   - Comparably, Blind, Fishbowl alternatives
   - LinkedIn employee sentiment analysis

3. Recent news and press releases:
   - Best sources for tech company news (TechCrunch, Bloomberg, Reuters)
   - How to filter for recent news (last 3-6 months)
   - RSS feeds or APIs available?

4. Social media monitoring:
   - How to verify official company accounts (LinkedIn, Twitter, Facebook)
   - Employee advocacy programs (employees posting on behalf of company)
   - GitHub presence for tech companies (activity, stars, contributors)

5. Hiring trends and job posting analysis:
   - How to identify if a company is growing (increasing job postings)
   - Layoff tracking sources (Layoffs.fyi, WARN notices)
   - Compensation data (Levels.fyi, H1B salary databases)

Please include API availability, pricing tiers, and legal access methods.
```

**Why This Matters:**
- Your app calls Perplexity for company research
- Want to ensure comprehensive data sources
- Need alternatives if Perplexity results are incomplete

---

### **5. Email Finding and Verification Best Practices** ⭐⭐⭐⭐

**Question for Perplexity:**
```
What are the current best practices and legal guidelines for finding and verifying hiring manager contact information in 2025?

Specifically:
1. Legal email finding methods:
   - LinkedIn Sales Navigator terms of use
   - Email pattern inference legality (GDPR, CASL compliance)
   - Cold outreach regulations (Canada's CASL, US CAN-SPAM)

2. Email verification services:
   - Hunter.io, RocketReach, Apollo.io pricing and accuracy
   - ZeroBounce, NeverBounce for verification
   - Which services provide GDPR-compliant data?

3. LinkedIn scraping alternatives:
   - LinkedIn public profiles vs authenticated scraping
   - Recent LinkedIn ToS changes (2024-2025)
   - Legal precedents (hiQ vs LinkedIn updates)

4. Email pattern inference accuracy:
   - Common corporate email formats (firstname.lastname@company.com)
   - How to validate patterns (MX record checking, SMTP verification)
   - False positive rates

5. Best practices for hiring manager outreach:
   - Personalization strategies (mention specific projects, news)
   - Subject line optimization (open rates)
   - Timing (best days/times to send)
   - Follow-up sequences (how many, what intervals?)

Please include recent studies on cold email effectiveness, compliance frameworks, and tool comparisons.
```

**Why This Matters:**
- Your app finds hiring contacts via Perplexity
- Users reported generic emails (service@company.com)
- Need better contact discovery and verification

---

### **6. React Performance Optimization for Data-Heavy Apps** ⭐⭐⭐

**Question for Perplexity:**
```
What are the best React performance optimization techniques for applications with heavy data fetching and large lists in 2025?

Specifically for:
1. Job listing display (50-100+ jobs per page):
   - Virtual scrolling libraries (react-window vs react-virtualized)
   - Pagination vs infinite scroll (UX best practices)
   - Skeleton loaders vs loading spinners

2. localStorage performance:
   - Best practices for storing large objects (resume text, job data)
   - IndexedDB vs localStorage for >5MB data
   - Race condition prevention (atomic writes)

3. useEffect and data fetching:
   - Preventing infinite loops (dependency arrays)
   - useRef vs useState for mutable refs
   - React Query vs SWR vs useSWR (which is best in 2025?)

4. Next.js 14+ specific optimizations:
   - Server Components vs Client Components for job listings
   - Dynamic imports for heavy components
   - Edge runtime vs Node runtime for APIs

5. Common anti-patterns to avoid:
   - Prop drilling (Context API vs Zustand vs Redux)
   - Re-renders on every keystroke (debouncing strategies)
   - Memory leaks (cleanup in useEffect)

Please include benchmarks, code examples, and links to official Next.js and React documentation.
```

**Why This Matters:**
- Your app has redirect loop issues (useEffect problems)
- Job search page renders 50+ jobs
- Want to ensure best performance practices

---

### **7. AI-Powered Resume Optimization Ethics** ⭐⭐⭐⭐

**Question for Perplexity:**
```
What are the ethical guidelines and best practices for AI-powered resume optimization in 2025?

Specifically:
1. Content fabrication prevention:
   - How to prevent AI from inventing experience or skills
   - Fact-checking mechanisms for AI-generated content
   - Disclosure requirements (do users need to disclose AI usage?)

2. Bias mitigation:
   - How ATS systems perpetuate hiring bias
   - How to ensure resume optimization doesn't discriminate
   - Accessibility considerations (screen readers, dyslexia-friendly formatting)

3. Authenticity vs optimization balance:
   - How much "enhancement" is acceptable?
   - What counts as misrepresentation?
   - Legal implications of exaggerated claims

4. AI transparency:
   - Should users be told what changes AI made?
   - Version control (original vs optimized resume comparison)
   - Audit trails for compliance

5. Industry standards:
   - SHRM (Society for Human Resource Management) guidelines
   - NACE (National Association of Colleges and Employers) recommendations
   - Canadian HR standards (HRPA guidelines)

Please include ethical frameworks, case studies, and expert opinions from HR professionals.
```

**Why This Matters:**
- Your app uses AI to optimize resumes
- User complained about AI fabrication
- Want to ensure ethical, transparent operations

---

### **8. Canadian Job Market Trends 2025** ⭐⭐⭐

**Question for Perplexity:**
```
What are the current Canadian job market trends and hiring patterns in October 2025?

Specifically:
1. Hot industries and roles:
   - Which sectors are hiring most (tech, healthcare, finance, trades?)
   - In-demand skills (AI/ML, cloud, cybersecurity, data analysis?)
   - Regional variations (Toronto vs Vancouver vs Calgary vs Montreal)

2. Remote work policies:
   - Percentage of Canadian companies offering remote work
   - Hybrid work prevalence (2-3 days in office)
   - Return-to-office mandates (which industries?)

3. Compensation trends:
   - Average salary increases (inflation-adjusted)
   - Signing bonuses and equity compensation
   - Benefits trends (mental health, flexible hours, 4-day work weeks)

4. Hiring timelines:
   - Average time-to-hire (application to offer)
   - Interview process length (1 round vs 5+ rounds)
   - Ghost

ing rates (companies not responding)

5. Canadian-specific job boards:
   - Market share (Indeed Canada, Workopolis, Job Bank, Jobboom)
   - Which boards are most effective for different industries?
   - Indigenous hiring initiatives (partnerships with Indigenous communities)

6. Economic indicators:
   - Unemployment rate by province
   - Job posting volumes (increasing or decreasing?)
   - Tech layoffs impact (2023-2024 layoffs recovery)

Please include Statistics Canada data, industry reports, and recent news articles.
```

**Why This Matters:**
- Your app prioritizes Canadian job boards
- Want to provide relevant market insights to users
- Help users understand current job market

---

### **9. Next.js 14+ API Route Best Practices** ⭐⭐⭐

**Question for Perplexity:**
```
What are the current best practices for Next.js 14+ API routes in production applications (2025)?

Specifically:
1. Error handling and validation:
   - Zod vs Yup vs manual validation (which is fastest?)
   - Proper HTTP status codes (when to use 400 vs 422 vs 500?)
   - Error logging (Sentry vs LogRocket vs custom solutions)

2. Rate limiting strategies:
   - Client-side vs server-side rate limiting
   - Redis vs in-memory rate limiting
   - Per-user vs per-IP limits

3. Caching strategies:
   - When to use Next.js cache vs custom caching
   - Stale-while-revalidate patterns
   - Cache invalidation best practices

4. Database connections:
   - Connection pooling with MongoDB/Prisma
   - Preventing connection leaks
   - Serverless function optimization (cold starts)

5. Security best practices:
   - CSRF protection (necessary in 2025?)
   - Input sanitization (SQL injection, XSS prevention)
   - API key management (environment variables, secret managers)
   - CORS configuration (restrictive vs permissive)

6. Performance monitoring:
   - Best observability tools (Datadog, New Relic, Vercel Analytics)
   - Tracing and profiling API routes
   - Identifying bottlenecks

Please include code examples, benchmark comparisons, and links to official Next.js documentation.
```

**Why This Matters:**
- Your app has multiple API routes
- Need to ensure production-ready error handling
- Want optimal performance and security

---

### **10. TypeScript Best Practices for Large Codebases** ⭐⭐⭐

**Question for Perplexity:**
```
What are the current TypeScript best practices for maintaining large codebases with 100+ files in 2025?

Specifically:
1. Type organization:
   - Shared types vs inline types (when to use each?)
   - Type imports vs type exports (verbosity vs clarity)
   - Generic types best practices (avoid over-engineering)

2. Avoiding 'any' type:
   - When is 'any' acceptable (external libraries, JSON parsing)?
   - 'unknown' vs 'any' (type narrowing strategies)
   - Gradual typing migration strategies

3. Interface vs Type:
   - When to use interface vs type alias (2025 consensus)
   - Declaration merging use cases
   - Performance implications

4. Utility types:
   - Most useful built-in utility types (Partial, Pick, Omit, Record)
   - Creating custom utility types
   - Type guards and discriminated unions

5. tsconfig.json optimization:
   - Strict mode recommendations (all checks enabled?)
   - Module resolution strategies
   - Build performance optimization (incremental compilation)

6. Common pitfalls:
   - Optional chaining overuse (?. everywhere)
   - Type assertions (as Type) abuse
   - Circular dependencies

Please include examples from popular open-source projects, TypeScript handbook updates, and community best practices.
```

**Why This Matters:**
- Your codebase has TypeScript
- Some files use 'any' type (Perplexity flagged this)
- Want consistent, maintainable type system

---

## 🎯 HOW TO USE THESE QUESTIONS

### **For Each Question:**

1. **Copy the entire question** (including context)
2. **Paste into Perplexity** (enable web search mode)
3. **Review the sources** provided (verify credibility)
4. **Extract actionable insights** (code examples, configuration changes)
5. **Document findings** in a new markdown file

### **Expected Outputs:**

- **Links to official documentation** (Perplexity AI, Next.js, React)
- **Recent blog posts** (2024-2025) from authoritative sources
- **Code examples** and configuration snippets
- **Best practices** from industry leaders
- **Legal and ethical guidelines** with citations

### **Priority Order:**

1. ⭐⭐⭐⭐⭐ **Questions 1, 2, 4, 5** - Directly impact core functionality
2. ⭐⭐⭐⭐ **Questions 3, 7** - Impact user trust and value
3. ⭐⭐⭐ **Questions 6, 8, 9, 10** - Performance and code quality

---

## 📋 ADDITIONAL RESEARCH TOPICS

### **Follow-Up Questions (If Time Permits):**

11. **"What are the best practices for building multi-tenant SaaS applications with Next.js and MongoDB in 2025?"**
    - User isolation strategies
    - Pricing tiers implementation
    - Usage tracking and analytics

12. **"How to implement effective job application tracking systems (personal CRM) for job seekers in 2025?"**
    - Status pipeline management (Applied → Interview → Offer)
    - Reminder and follow-up automation
    - Integration with email providers (Gmail, Outlook)

13. **"What are the current trends in AI-powered career coaching and job search assistance (2025)?"**
    - Competitor analysis (LinkedIn, Indeed, ZipRecruiter AI features)
    - Unique value propositions
    - Pricing strategies for AI-enhanced services

14. **"How to build and scale a web scraping infrastructure that respects robots.txt and ToS in 2025?"**
    - Proxy rotation strategies
    - Headless browser alternatives (Playwright, Puppeteer)
    - Anti-bot detection avoidance (ethical methods)

15. **"What are the GDPR and CASL compliance requirements for storing user resumes and job application data in 2025?"**
    - Data retention policies
    - Right to deletion implementation
    - Data portability requirements
    - Cookie consent and tracking

---

## 🔥 CRITICAL INSIGHTS TO SEEK

### **From Perplexity's Responses, Extract:**

1. **Configuration values:**
   - Exact temperature settings for different AI tasks
   - Token limits for various prompt types
   - Cache TTL recommendations

2. **Code patterns:**
   - How to structure prompts for consistent JSON
   - Error handling patterns for API calls
   - Type-safe localStorage wrappers

3. **Legal frameworks:**
   - Which job boards allow aggregation
   - Email finding legal boundaries
   - Resume data retention requirements

4. **Competitive intelligence:**
   - What features do LinkedIn Premium/Indeed offer?
   - How do competitors handle AI-powered matching?
   - What's the market positioning opportunity?

5. **Performance benchmarks:**
   - Expected API response times
   - Acceptable job search latency (<2s? <5s?)
   - Database query optimization targets

---

## ✅ SUCCESS CRITERIA

After researching these questions, you should be able to:

1. ✅ **Optimize Perplexity prompts** with industry-standard parameters
2. ✅ **Ensure legal compliance** for all data sources
3. ✅ **Improve ATS scoring algorithm** with verified formulas
4. ✅ **Enhance company research** with authoritative data sources
5. ✅ **Fix email finding** to return real contacts, not patterns
6. ✅ **Optimize React performance** using latest best practices
7. ✅ **Maintain ethical AI usage** with transparency and fact-checking
8. ✅ **Understand Canadian job market** to provide relevant insights
9. ✅ **Secure API routes** with proper validation and error handling
10. ✅ **Improve TypeScript codebase** with strict typing

---

## 📊 DOCUMENTATION TEMPLATE

**For each question researched, create a file named:**
`RESEARCH_[TOPIC]_[DATE].md`

**Example:** `RESEARCH_PERPLEXITY_BEST_PRACTICES_2025-10-10.md`

**Include:**
1. Question asked
2. Perplexity's response summary
3. Key sources (with URLs)
4. Actionable insights
5. Code changes needed
6. Implementation priority

---

**END OF QUESTIONS**

*Ready for web search research via Perplexity AI*  
*Delete after documentation is complete*

