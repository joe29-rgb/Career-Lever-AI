# 🚨 CRITICAL FIXES NEEDED

## Issues Found (Oct 27, 2025):

### 1. ❌ **PDF Generation Failing - No Attachments**
**Error**: `ENOENT: no such file or directory, open '/app/.next/server/chunks/data/Helvetica.afm'`

**Cause**: PDFKit font files not included in Docker build

**Fix Required**:
- Add font files to Docker image
- OR switch to a different PDF library (jsPDF, Puppeteer PDF)
- OR use external PDF service

**Priority**: CRITICAL - Users can't send applications

---

### 2. ❌ **Cover Letters Say "I am for" - Template Bug**
**Error**: Cover letters start with "I am for" instead of proper introduction

**Cause**: Template variable not being replaced correctly

**Fix Required**:
- Check cover letter generation in `perplexity-intelligence.ts`
- Fix template string replacement
- Add validation for cover letter output

**Priority**: HIGH - Makes applications look unprofessional

---

### 3. ❌ **No Job Descriptions Returned**
**Error**: `[COVER_LETTER] No job description provided, using generic text`

**Cause**: Jobs from Perplexity don't have `description` field, only `summary`

**Fix Required**:
- Update job aggregator to ensure all jobs have description
- Map `summary` to `description` in Perplexity converter
- Add fallback for missing descriptions

**Priority**: HIGH - Generic cover letters are useless

---

### 4. ❌ **Location Too Broad ("Canada")**
**Error**: Job search using "Canada" instead of specific city

**Cause**: Resume location extraction returning country instead of city

**Fix Required**:
- Improve location extraction in `local-resume-parser.ts`
- Add city detection
- Default to user's profile location if resume location is too broad

**Priority**: MEDIUM - Returns irrelevant jobs

---

### 5. ❌ **Resume Templates Not Loading**
**Error**: `JSON parsing failed after 6 attempts`

**Cause**: Perplexity returning malformed JSON for resume variants

**Fix Required**:
- Improve JSON parsing in resume variant generation
- Add better error handling
- Use structured output format

**Priority**: MEDIUM - Feature doesn't work

---

### 6. ❌ **Email Domain Not Verified**
**Error**: `You can only send testing emails to your own email address`

**Cause**: Resend.dev requires domain verification for production

**Fix Required**:
- Verify domain at resend.com/domains
- Update `from` address to use verified domain
- OR provide mailto fallback (already implemented)

**Priority**: HIGH - Users can't send emails

---

### 7. ⚠️ **Jobs Only From Perplexity, Not Scrapers**
**Observation**: Only Perplexity results returned, scrapers not used

**Cause**: Perplexity returned enough results, scrapers not triggered

**Status**: Working as designed (waterfall approach)

**Priority**: LOW - System is working, but should verify scraper functionality

---

## Immediate Action Items:

### 1. Fix PDF Generation (CRITICAL)
```bash
# Option A: Add fonts to Docker
COPY --from=builder /app/node_modules/pdfkit/js/data /app/.next/server/chunks/data

# Option B: Switch to Puppeteer PDF
# Already have Puppeteer installed for scrapers
```

### 2. Fix Cover Letter Template (HIGH)
- Check template in `perplexity-intelligence.ts`
- Fix "I am for" bug
- Add validation

### 3. Fix Job Descriptions (HIGH)
- Ensure all jobs have description field
- Map summary → description
- Add fallback text

### 4. Verify Domain for Email (HIGH)
- Go to resend.com/domains
- Add and verify your domain
- Update FROM address

### 5. Improve Location Extraction (MEDIUM)
- Extract city from resume
- Add fallback to user profile
- Validate location before search

---

## Testing Checklist:

- [ ] PDF attachments work
- [ ] Cover letters have proper introduction
- [ ] Jobs have descriptions
- [ ] Location is specific (city, not country)
- [ ] Resume templates load
- [ ] Emails send successfully
- [ ] Scrapers work when needed

---

## Notes:

- Most issues are in production deployment
- Local development may work fine
- Docker build needs font files
- Resend.dev domain verification required
