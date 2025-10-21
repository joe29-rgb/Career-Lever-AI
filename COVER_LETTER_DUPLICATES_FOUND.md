# Cover Letter Duplicate Files & Issues Found

## 🔴 CRITICAL PROBLEM

The career finder uses **`/api/cover-letter/generate-v2`** which does NOT calculate years of experience from the resume, causing the "38 years" hallucination.

The main **`/api/cover-letter/generate`** API HAS the fix but is NOT being used by career finder!

---

## 📁 Duplicate Cover Letter Files

### **1. API Routes (2 files)**

#### `/api/cover-letter/generate/route.ts` (395 lines) ✅ HAS FIX
- **Used by:** Old cover letter page, direct API calls
- **Features:**
  - ✅ `calculateYearsFromResume()` function (lines 20-102)
  - ✅ Extracts work experience section only
  - ✅ Merges overlapping periods
  - ✅ Caps at 25 years max
  - ✅ Injects years constraint into system prompt (lines 223-232, 343-352)
  - ✅ Uses Perplexity directly with proper constraints

#### `/api/cover-letter/generate-v2/route.ts` (53 lines) ❌ NO FIX
- **Used by:** Career finder (`/career-finder/cover-letter/page.tsx`)
- **Features:**
  - ❌ NO years calculation
  - ❌ Just passes resume text to PerplexityIntelligenceService
  - ❌ Generic constraint in prompt but no specific number

---

### **2. Service Files (3 files)**

#### `lib/ai-service.ts` - `generateCoverLetter()` (lines 943-1020)
- Uses old OpenAI prompt template
- Routes through Perplexity via `chatCreate()`
- ❌ NO years calculation
- Uses `AI_PROMPTS.COVER_LETTER_GENERATION` template

#### `lib/ai-service-enterprise.ts` - `generateCoverLetter()` (line 306+)
- Enterprise version with circuit breakers
- ❌ NO years calculation
- Probably not used

#### `lib/perplexity-intelligence.ts` - `generateCoverLetters()` (lines 1921-2040)
- **THIS IS THE ONE CAREER FINDER USES**
- Generates TWO variants (A & B)
- Has generic constraint: "DO NOT make up or exaggerate years of experience" (line 1980)
- ❌ NO specific years calculation
- ❌ NO years number injected into prompt

---

## 🔍 The Problem

### Career Finder Flow:
```
User clicks "Generate Cover Letter"
    ↓
/career-finder/cover-letter/page.tsx
    ↓
POST /api/cover-letter/generate-v2
    ↓
PerplexityIntelligenceService.generateCoverLetters()
    ↓
Generic prompt: "DO NOT make up years"
    ↓
❌ AI still hallucinates "38 years" because no specific constraint
```

### What SHOULD Happen:
```
User clicks "Generate Cover Letter"
    ↓
Calculate years from resume: calculateYearsFromResume(resumeText)
    ↓
Result: 10 years
    ↓
Inject into prompt: "Candidate has EXACTLY 10 years. DO NOT say 38 years."
    ↓
✅ AI respects the constraint
```

---

## 🛠️ The Fix

### Option 1: Update generate-v2 to calculate years (RECOMMENDED)
1. Copy `calculateYearsFromResume()` and `extractExperienceSection()` from `generate/route.ts`
2. Calculate years in `generate-v2/route.ts` before calling service
3. Pass years to `PerplexityIntelligenceService.generateCoverLetters()`
4. Update the service to inject years constraint

### Option 2: Delete generate-v2 and use generate (SIMPLER)
1. Delete `/api/cover-letter/generate-v2/route.ts`
2. Update career finder to use `/api/cover-letter/generate` with `raw=true`
3. Modify generate to return TWO variants instead of one

### Option 3: Consolidate everything (BEST LONG-TERM)
1. Keep ONE API route: `/api/cover-letter/generate`
2. Delete `generate-v2`
3. Delete unused functions in `ai-service.ts` and `ai-service-enterprise.ts`
4. Keep only `perplexity-intelligence.ts` but add years calculation

---

## 📊 Files to Delete/Consolidate

### Can Delete:
- ❌ `/api/cover-letter/generate-v2/route.ts` (duplicate, missing fix)
- ❌ `ai-service.ts` → `generateCoverLetter()` function (not used, old OpenAI code)
- ❌ `ai-service-enterprise.ts` → `generateCoverLetter()` function (not used)

### Keep & Fix:
- ✅ `/api/cover-letter/generate/route.ts` (has the fix)
- ✅ `perplexity-intelligence.ts` → `generateCoverLetters()` (used by career finder, needs years calc)

---

## 🎯 Immediate Action Plan

1. **Add years calculation to perplexity-intelligence.ts:**
   - Copy `calculateYearsFromResume()` function
   - Copy `extractExperienceSection()` function
   - Calculate years in `generateCoverLetters()`
   - Inject years constraint into prompt

2. **Update the prompt in perplexity-intelligence.ts:**
   ```typescript
   const yearsExperience = calculateYearsFromResume(params.resumeText)
   
   CRITICAL REQUIREMENTS:
   - Candidate has EXACTLY ${yearsExperience} years of total work experience
   - DO NOT say "decades", "38 years", or any number higher than ${yearsExperience}
   - If ${yearsExperience} < 10, say "several years" or "${yearsExperience} years"
   - Use ONLY the experience data provided in the resume
   ```

3. **Test:**
   - Generate cover letter in career finder
   - Check that it says correct years (e.g., "10 years" not "38 years")

4. **Clean up later:**
   - Delete `/api/cover-letter/generate-v2/route.ts`
   - Remove unused cover letter functions from `ai-service.ts`
   - Consolidate to single source of truth

---

## 📝 Summary

**Root Cause:** Career finder uses v2 API which doesn't calculate years from resume

**Files Involved:**
- `/api/cover-letter/generate/route.ts` ✅ (has fix, not used by career finder)
- `/api/cover-letter/generate-v2/route.ts` ❌ (used by career finder, missing fix)
- `perplexity-intelligence.ts` ❌ (generates letters, no years calc)

**Solution:** Add years calculation to `perplexity-intelligence.ts` and inject into prompt
