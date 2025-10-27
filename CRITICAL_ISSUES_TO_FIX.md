# Critical Issues to Fix - Priority Order

**Status**: 🔴 BLOCKING - No further development until all issues resolved

---

## 🚨 CRITICAL ERRORS (Must Fix First)

### 1. PDFKit Font Files Missing in Production ❌
**Error**: `ENOENT: no such file or directory, open '/app/.next/server/chunks/data/Helvetica.afm'`
**Impact**: Resume/Cover letter PDFs cannot be generated or attached to emails
**Root Cause**: PDFKit fonts not copied to correct location in Docker container
**Files**: 
- `Dockerfile` (line 66)
- `src/lib/pdf/unified-pdf-generator.ts`
**Fix Required**: Copy PDFKit fonts to `/app/.next/server/chunks/data/` in Docker

---

### 2. Email Service Not Configured ❌
**Error**: `You can only send testing emails to your own email address`
**Impact**: Cannot send outreach emails to hiring managers
**Root Cause**: Resend domain not verified, using test mode
**Files**: 
- `src/app/api/outreach/send/route.ts`
**Fix Required**: 
- Verify domain in Resend
- Update `from` address to verified domain
- Add proper error handling for unverified domains

---

### 3. Resume Personal Info Not Extracted ❌
**Error**: `[OPTIMIZER] 📋 Extracted personal info: {name: '', email: undefined, phone: ' 587 778-9029', location: 'Edmonton, Al'}`
**Impact**: Optimized resumes missing user name and email
**Root Cause**: Resume parser not extracting name/email correctly
**Files**: 
- `src/lib/enhanced-resume-extractor.ts`
- Resume optimizer component
**Fix Required**: Improve name/email extraction from resume text

---

## 🔴 HIGH PRIORITY ISSUES

### 4. Location Defaulting to Canada ❌
**Error**: `finalValue: "Edmonton, AB"` but `currentFilterState: "Canada"`
**Impact**: Job searches not respecting user's saved location
**Root Cause**: Location filter logic not using saved location properly
**Files**: 
- Job search component
- Location filter logic
**Fix Required**: Ensure saved location takes precedence over default

---

### 5. Resume Template Changes Not Working ❌
**Error**: Template selector changes don't update resume preview
**Impact**: Users cannot switch between resume templates
**Root Cause**: Template state not triggering re-render
**Files**: 
- Resume optimizer component
- Template selector
**Fix Required**: 
- Fix template state management
- Trigger regeneration on template change
- Update preview immediately

---

### 6. Cover Letter Quality Issues ❌
**Problem**: "I am for the Sr. Solutions Sales Executive position" (grammatically incorrect)
**Impact**: Unprofessional cover letters
**Root Cause**: Template not properly enforced, AI generating poor quality text
**Files**: 
- `src/lib/cover-letter-generator.ts`
- `src/lib/cover-letter-templates.ts`
- `src/lib/perplexity-intelligence.ts`
**Fix Required**: 
- Enforce proper grammar: "I am applying for" or "I am excited to apply for"
- Improve prompt quality
- Add grammar validation

---

### 7. Cover Letter Templates Not Tied to Resume Templates ❌
**Problem**: Cover letter template selection independent of resume template
**Impact**: Inconsistent branding between resume and cover letter
**Files**: 
- Cover letter generator
- Template mapping logic
**Fix Required**: 
- Create 2 cover letter templates for each resume template
- Auto-select matching cover letter template when resume template chosen
- Maintain consistent styling

---

### 8. Resume/Cover Letter Not Attached to Emails ❌
**Problem**: PDFs not attached when sending outreach emails
**Impact**: Incomplete job applications
**Root Cause**: PDF generation failing (see issue #1)
**Files**: 
- `src/app/api/outreach/send/route.ts`
**Fix Required**: Fix PDF generation, then ensure attachments work

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

### 13. Mobile Menu Takes Half Screen ❌
**Problem**: Navigation menu too large on small screens
**Impact**: Poor mobile experience
**Files**: 
- Layout component
- Navigation component
**Fix Required**: 
- Make menu collapsible
- Reduce menu height
- Improve responsive design

---

### 14. App Not Optimized for Screen Sizes ❌
**Problem**: Layout breaks on various screen sizes
**Impact**: Poor user experience across devices
**Files**: 
- All page components
- Global CSS
**Fix Required**: 
- Add responsive breakpoints
- Test on multiple screen sizes
- Use mobile-first design

---

### 15. Resume Builder UI Needs Update ❌
**Problem**: Current UI doesn't match desired design (Screenshot 2025-10-25 135145.png)
**Impact**: Inconsistent user experience
**Files**: 
- Resume builder component
- Resume builder CSS
**Fix Required**: 
- Update layout to match design
- Improve template preview
- Better section organization

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
