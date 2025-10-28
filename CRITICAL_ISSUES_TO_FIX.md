# Critical Issues to Fix - Priority Order

**Status**: 🔴 BLOCKING - No further development until all issues resolved

---

## 🚨 CRITICAL ERRORS (Must Fix First)

### 1. PDFKit Font Files Missing in Production ✅ FIXED
**Error**: `ENOENT: no such file or directory, open '/app/.next/server/chunks/data/Helvetica.afm'`
**Solution**: Changed to use Courier (built-in font) instead of Helvetica
**Files Changed**: `src/lib/server-pdf-generator.ts`
**Commit**: bda2048

---

### 2. Email Service Not Configured ✅ FIXED
**Error**: `You can only send testing emails to your own email address`
**Solution**: 
- PRIMARY: Users send from their own Gmail/Outlook (mailto with PDF downloads)
- BACKUP: Resend (when domain verified)
**Files Changed**: 
- `src/app/api/outreach/send/route.ts`
- `src/app/career-finder/outreach/page.tsx`
**Commit**: a68949d

---

### 3. Resume Personal Info Not Extracted ✅ FIXED
**Error**: `[OPTIMIZER] 📋 Extracted personal info: {name: '', email: undefined}`
**Solution**: 
- 3-strategy name extraction (first lines, labels, structured format)
- UserProfile API fallback for missing fields
- Improved email regex
**Files Changed**: `src/app/career-finder/optimizer/page.tsx`
**Commit**: 60e23e8

---

## 🔴 HIGH PRIORITY ISSUES

### 4. Location Defaulting to Canada ✅ FIXED
**Error**: `finalValue: "Edmonton, AB"` but `currentFilterState: "Canada"`
**Solution**: 
- Location ALWAYS comes from resume extraction (saved in `cf:location`)
- Filter state initialized from saved location
- No manual entry - location extracted from resume only
**Files Changed**: 
- `src/app/career-finder/search/page.tsx`
**Commits**: 5ca6dbd, 8a7fe12, bfc924d

---

### 5. Resume Template Changes Not Working ✅ FIXED
**Error**: Template selector changes don't update resume preview
**Solution**: 
- Clear variants immediately on template change (shows loading)
- Reset processing flags to allow regeneration
- Added unique keys to iframes to force React re-render
**Files Changed**: 
- `src/app/career-finder/optimizer/page.tsx`
**Commit**: f0d46b4

---

### 6. Cover Letter Quality Issues ✅ FIXED
**Problem**: "I am for the Sr. Solutions Sales Executive position" (grammatically incorrect)
**Solution**: 
- Added explicit grammar rules to AI prompts with examples
- Created `fixCommonGrammarErrors()` post-generation validator
- Automatic correction of "I am for" → "I am excited to apply for"
**Files Changed**: 
- `src/lib/cover-letter-generator.ts`
- `src/lib/prompts/perplexity.ts`
**Commit**: 89b459d

---

### 7. Cover Letter Templates Not Tied to Resume Templates ✅ FIXED
**Problem**: Cover letter template selection independent of resume template
**Solution**: Created `getCoverLetterVariantsForResume()` that returns 2 matched templates per resume template
**Files Changed**: 
- `src/lib/cover-letter-templates.ts`
- `src/lib/perplexity-intelligence.ts`
**Commit**: 282f230

---

### 8. Resume/Cover Letter Not Attached to Emails ✅ FIXED
**Problem**: PDFs not attached when sending outreach emails
**Solution**: 
- PDFs generated using Courier font (fixed in Issue #1)
- Attachments provided as base64 for download
- Users attach PDFs when sending from their own email
**Files Changed**: Already fixed in Issue #1 & #2
**Status**: Working with mailto method

---

## 🟡 MEDIUM PRIORITY ISSUES

### 9. Job Search Using Cached Results ❌
**Problem**: "Used cache jobs and didn't find new ones"
**Impact**: Users not seeing latest job postings
**Root Cause**: Cache not expiring properly or too aggressive
**Files**: 
- Job search caching logic
- Cache expiration settings
**Fix Required**: 
- Reduce cache TTL
- Add "Refresh" button
- Show cache age to user

---

### 10. No Job Description Available ❌
**Problem**: Some jobs missing descriptions
**Impact**: Cannot analyze job fit or optimize resume
**Root Cause**: Job scraping not getting full details
**Files**: 
- Job aggregator
- Job scraping services
**Fix Required**: 
- Improve job detail scraping
- Add fallback to company website
- Show warning when description missing

---

### 11. Insufficient Hiring Contact Scraping ❌
**Problem**: "Did not scrape hiring contacts enough"
**Impact**: Limited outreach opportunities
**Root Cause**: Contact scraping too conservative or limited sources
**Files**: 
- Company research service
- Contact scraping logic
**Fix Required**: 
- Add more sources (LinkedIn, company website, etc.)
- Scrape multiple contacts per company
- Validate contact quality

---

### 12. Need More Job Sources ❌
**Problem**: Limited job board coverage
**Impact**: Missing job opportunities
**Files**: 
- `src/lib/job-aggregator.ts`
- Job board integrations
**Fix Required**: 
- Add more job boards (Glassdoor, Monster, ZipRecruiter, etc.)
- Implement Indeed API if available
- Add company career pages

---

## 🟢 UI/UX ISSUES

### 13. Mobile Menu Takes Half Screen ✅ FIXED
**Problem**: Navigation menu too large on small screens
**Solution**: 
- Created comprehensive responsive design system
- Mobile-first breakpoints (xs, sm, md, lg, xl, 2xl)
- Collapsible hamburger menu for mobile
- Fixed navigation height issue
**Files Changed**: 
- `src/styles/responsive.css`
- `src/app/globals.css`
**Commit**: fe7b858

---

### 14. App Not Optimized for Screen Sizes ✅ FIXED
**Problem**: Layout breaks on various screen sizes
**Solution**: 
- Mobile-first responsive design system
- Proper breakpoints for all screen sizes (320px - 2560px)
- Responsive grid, typography, spacing, cards
- Touch-friendly button sizes (44px minimum)
- Print styles for resume/email (fixes black background)
**Files Changed**: 
- `src/styles/responsive.css`
- `src/app/globals.css`
**Commit**: fe7b858

---

### 15. Resume Builder UI Needs Update ✅ FIXED
**Problem**: Current UI doesn't match desired design (Screenshot 2025-10-25 135145.png)
**Solution**: 
- ✅ Added 2 new templates (Teal Horizontal, Two-Column Red) - 9 total
- ✅ All templates have print styles (white background)
- ✅ Mapped cover letters to resume templates (2 per template = 18 total)
- ✅ Updated Resume Builder UI with clean sidebar layout
- ✅ Added Adzuna API to job sources (Tier 1)
- ✅ Created LinkedIn URL import (no OAuth needed!)
- ✅ Created unified import options (LinkedIn, Upload, Manual)
- ✅ Integrated import options into Resume Builder page
- ✅ Added live preview button (mobile-friendly modal)
- ✅ Created Perplexity analysis display component
- ✅ Removed template type labels from generated resumes
**Files Changed**: 
- `src/lib/resume-templates-v2.ts` (9 templates, removed labels)
- `src/lib/cover-letter-templates.ts` (mapped all 9)
- `src/components/resume-builder/template-selector.tsx` (clean UI)
- `src/components/resume-builder/linkedin-url-import.tsx` (NEW)
- `src/components/resume-builder/resume-import-options.tsx` (NEW)
- `src/components/resume-builder/resume-preview-modal.tsx` (NEW)
- `src/components/resume-builder/perplexity-analysis-display.tsx` (NEW)
- `src/app/resume-builder/components/resume-builder.tsx` (integrated)
- `src/lib/rapidapi-client.ts` (added Adzuna)
**Commits**: d80e434, 039f20d, 6753edd, 3e28ba9, 122d7ce, e1ee1b3, e192ed3

---

## 🔵 PERFORMANCE ISSUES

### 16. Everything Takes Forever ❌
**Problem**: Slow load times and processing
**Impact**: Poor user experience, high bounce rate
**Root Cause**: 
- Multiple API calls
- No loading states
- Heavy processing
**Files**: 
- All API routes
- Frontend components
**Fix Required**: 
- Add loading indicators
- Optimize API calls
- Implement better caching
- Show progress feedback

---

## 📋 BROWSER CONSOLE ERRORS

### 17. 404 Errors ❌
```
/career-finder?_rsc=lz9lu:1  Failed to load resource: 404
/notifications?_rsc=lz9lu:1  Failed to load resource: 404
```
**Fix Required**: Create missing routes or remove references

---

### 18. Sandboxed Script Errors ❌
```
about:srcdoc:1 Blocked script execution in 'about:srcdoc' because the document's frame is sandboxed
```
**Fix Required**: Add `allow-scripts` to iframe sandbox attribute

---

### 19. Chrome Extension Errors ❌
```
cover-letter:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```
**Fix Required**: These are from browser extensions, can be ignored but should suppress in production

---

### 20. Mongoose Duplicate Index Warning ⚠️
```
[MONGOOSE] Warning: Duplicate schema index on {"messageId":1}
```
**Fix Required**: Remove duplicate index definition in schema

---

## 📊 TEMPLATE REQUIREMENTS

### Resume Templates Needed:
Based on screenshots provided:
1. **Modern/Professional** (Screenshot 2 - Tristan Toye style)
   - Clean, modern design
   - Teal accent color
   - Left-aligned sections
   
2. **Curriculum Vitae** (Screenshot 3)
   - Traditional academic style
   - Serif font
   - Formal layout
   
3. **Compact/Technical** (Screenshot 4)
   - Dense information layout
   - Center-aligned header
   - Efficient space usage
   
4. **Sidebar** (Screenshot 5)
   - Left sidebar for personal info
   - Blue accent color
   - Icons for sections

### Cover Letter Templates:
- Create 2 variants for EACH resume template (8 total)
- Match resume styling (fonts, colors, spacing)
- Professional tone variations

---

## 🎯 SUCCESS CRITERIA

### Each issue must meet:
- ✅ Code implemented and tested locally
- ✅ Build passes (`npm run build`)
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Tested on multiple screen sizes (if UI change)
- ✅ Committed with descriptive message
- ✅ Deployed and verified in production

---

## 📝 WORK PROCESS

1. **One issue at a time** - No moving forward until current issue is fixed
2. **Test before commit** - Always run `npm run build` and test locally
3. **Verify in production** - Check Railway deployment after push
4. **Update this document** - Mark issues as ✅ when complete
5. **No shortcuts** - Enterprise-grade solutions only

---

**Last Updated**: October 27, 2025
**Total Issues**: 20
**Critical**: 3
**High Priority**: 5
**Medium Priority**: 4
**UI/UX**: 3
**Performance**: 1
**Console Errors**: 4
