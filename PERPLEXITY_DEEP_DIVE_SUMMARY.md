# 🔍 PERPLEXITY DEEP DIVE - CAREER LEVER AI

**Date:** October 7, 2025  
**Latest Commit:** `8bf9c2b` - CSS cleanup complete  
**Status:** Deployed to Railway ✅  

---

## 📋 **PROJECT OVERVIEW**

**Name:** Career Lever AI  
**Tech Stack:** Next.js 14, TypeScript, MongoDB, Redis, Tailwind CSS  
**Purpose:** AI-powered job application assistant with resume customization and company research  
**Deployment:** Railway (Docker container)  

---

## 🎯 **RECENT WORK COMPLETED**

### **Phase 1: Complete CSS Rebuild (10 hours ago)**
- Gutted 1,678 lines of conflicting CSS
- Rebuilt clean 334-line unified system
- Removed 192 hardcoded gradient instances
- Fixed dark mode as default
- Created reusable component classes

### **Phase 2: Critical Fixes (2 hours ago)**
- Fixed 429 rate limiting (increased to 1000/min)
- Fixed CSS z-index layering issues
- Replaced missing logo image
- Fixed test setup build errors
- Added Node 22 compatibility

### **Phase 3: CSS Cleanup (just now)**
- Deleted 1,678-line backup CSS file
- Removed remaining inline styles
- Added 2 new gradient classes
- Verified zero CSS conflicts
- Build passing ✅

---

## 📊 **CURRENT STATE**

### **Build Status:**
```bash
✅ Build: Passing (Exit code: 0)
✅ TypeScript: 0 errors
✅ Tests: Framework ready (Vitest + MongoDB Memory Server)
✅ Deployment: Live on Railway
```

### **CSS System:**
```
✅ 1 CSS file (globals.css - 345 lines)
✅ 0 backup files
✅ 0 competing systems
✅ 0 hardcoded gradients
✅ Dark theme default
✅ Unified theme variables
```

### **Rate Limiting:**
```
✅ file-upload: 1000/min
✅ api-general: 500/min
✅ ai-requests: 100/min
✅ auth-session: 500/min
```

---

## 🏗️ **ARCHITECTURE**

### **Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS (unified system)
- Shadcn/UI components
- Zustand + React Query (state management)

### **Backend:**
- Next.js API Routes
- MongoDB (Mongoose ODM)
- Redis (caching)
- NextAuth.js (authentication)
- Perplexity AI (job search & research)

### **Infrastructure:**
- Docker (multi-stage build)
- Railway (deployment)
- GitHub Actions (ready for CI/CD)
- Sentry (error tracking)

---

## 📁 **KEY FILES**

### **CSS:**
- `src/app/globals.css` - ONLY CSS file (345 lines)

### **Configuration:**
- `next.config.js` - Next.js config (standalone output)
- `tailwind.config.js` - Tailwind config
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies
- `.npmrc` - Strict dependency management
- `railway.json` - Railway deployment config
- `Dockerfile` - Production container

### **Core Services:**
- `src/lib/rate-limiter.ts` - Rate limiting
- `src/lib/database.ts` - Database service
- `src/lib/ai-service-enterprise.ts` - AI service
- `src/lib/perplexity-intelligence.ts` - Perplexity integration
- `src/lib/logger.ts` - Logging service
- `src/lib/redis-cache.ts` - Redis caching

### **Components:**
- `src/components/top-nav.tsx` - Navigation
- `src/components/providers.tsx` - Context providers
- `src/components/theme-toggle.tsx` - Theme switcher
- `src/components/job-card.tsx` - Job listings
- `src/components/resume-upload/` - Resume upload

---

## 🐛 **KNOWN ISSUES**

### **GitHub Dependabot Alerts:**
- 4 high-severity vulnerabilities
- Location: `https://github.com/joe29-rgb/Career-Lever-AI/security/dependabot`
- Status: Not addressed yet

### **Sentry Warnings (Non-blocking):**
- OpenTelemetry instrumentation warnings
- Critical dependency warnings
- Status: Build warnings only, app works fine

---

## ✅ **WHAT WORKS**

1. ✅ **CSS System** - Unified, no conflicts
2. ✅ **Dark Mode** - Default, toggleable
3. ✅ **Rate Limiting** - High limits, no 429 errors
4. ✅ **Navigation** - Sticky, always visible
5. ✅ **Build** - Passing, 63 pages generated
6. ✅ **TypeScript** - Zero errors
7. ✅ **Theme System** - HSL variables, consistent
8. ✅ **PDF Upload** - Working (after rate limit fix)

---

## 🔧 **AREAS FOR INVESTIGATION**

### **1. Security Vulnerabilities**
- **Priority:** HIGH
- **Action:** Review and update dependencies
- **Impact:** 4 high-severity issues

### **2. Performance Optimization**
- **Current:** First Load JS: 87.3 kB (good)
- **Potential:** Code splitting, lazy loading
- **Impact:** Faster page loads

### **3. Testing Coverage**
- **Current:** Test framework ready, 26 test cases written
- **Target:** 60% coverage minimum
- **Impact:** Better code quality

### **4. CI/CD Pipeline**
- **Current:** Manual deployments
- **Needed:** GitHub Actions workflow
- **Impact:** Automated testing & deployment

### **5. Monitoring & Observability**
- **Current:** Logger service implemented
- **Needed:** Full observability stack
- **Impact:** Better debugging

### **6. Database Optimization**
- **Current:** Basic indexing
- **Needed:** Query optimization, aggregation pipelines
- **Impact:** Faster queries

### **7. Caching Strategy**
- **Current:** Redis implemented but minimal usage
- **Needed:** Comprehensive caching strategy
- **Impact:** Reduced API calls

### **8. Error Handling**
- **Current:** Basic try/catch
- **Needed:** Comprehensive error boundaries
- **Impact:** Better UX during failures

---

## 📈 **METRICS**

### **Codebase:**
- **Total Files:** ~200+
- **Lines of Code:** ~15,000+
- **CSS Lines:** 345 (down from 1,678)
- **Components:** 50+
- **API Routes:** 120+

### **Performance:**
- **Build Time:** 45 seconds
- **First Load JS:** 87.3 kB
- **Pages Generated:** 63
- **Bundle Size:** Good ✅

---

## 🎯 **RECOMMENDED DEEP DIVE TOPICS**

### **For Perplexity Investigation:**

1. **Security Best Practices**
   - Review Dependabot alerts
   - Recommend security hardening
   - Suggest dependency updates

2. **Performance Optimization**
   - Analyze bundle size
   - Recommend code splitting strategies
   - Suggest caching improvements

3. **Architecture Review**
   - Evaluate service layer design
   - Review database schema
   - Assess scalability

4. **Testing Strategy**
   - Recommend testing approach
   - Suggest E2E testing tools
   - Coverage targets

5. **DevOps Pipeline**
   - CI/CD best practices
   - Deployment strategies
   - Monitoring solutions

6. **AI Integration**
   - Perplexity API optimization
   - Rate limiting strategies
   - Cost reduction

7. **User Experience**
   - Accessibility review
   - Mobile optimization
   - Performance metrics

8. **Database Design**
   - Schema optimization
   - Index strategy
   - Query performance

---

## 🔗 **LINKS**

- **GitHub:** https://github.com/joe29-rgb/Career-Lever-AI
- **Railway:** (deployment URL needed)
- **Dependabot:** https://github.com/joe29-rgb/Career-Lever-AI/security/dependabot

---

## 📝 **RECENT COMMITS**

```bash
8bf9c2b - fix: CSS cleanup - delete backup, remove inline styles, add gradient classes
81b142b - fix: resolve 429 rate limiting (1000/min), CSS z-index layering, missing logo, test setup
335eddb - feat: complete CSS rebuild - gut 1678 lines, rebuild 334 clean lines, fix all hardcoded gradients, unify theme system
6b97d4f - feat: integrate CareerLever logo in navigation
```

---

## 🚀 **NEXT PRIORITIES**

1. **Security:** Address Dependabot vulnerabilities
2. **Testing:** Expand test coverage
3. **CI/CD:** Set up GitHub Actions
4. **Monitoring:** Full observability stack
5. **Documentation:** API documentation (OpenAPI)
6. **Performance:** Caching strategy
7. **Features:** Continue enterprise features
8. **Mobile:** Optimize mobile experience

---

## 💡 **QUESTIONS FOR PERPLEXITY**

1. What are the security vulnerabilities and how to fix them?
2. What's the best caching strategy for this architecture?
3. How to optimize Perplexity AI API usage?
4. What's the best testing strategy for Next.js 14?
5. How to implement comprehensive error handling?
6. What's the best CI/CD pipeline for Railway?
7. How to optimize MongoDB queries?
8. What monitoring tools work best with Next.js?

---

**This summary should give Perplexity complete context for a deep dive!** 🎯

