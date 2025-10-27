# 🧹 System Cleanup Plan - Remove Duplicates

## Problem:
We now have TWO systems doing the same thing:
1. **OLD**: Resume signals (keywords, location) stored in Resume model
2. **NEW**: UserProfile (structured data with location, skills, experience)

## Solution:
**Keep UserProfile, remove Resume signals**

---

## 🗑️ What to DELETE:

### 1. Resume Model - Remove `resumeSignals` field
**File**: `src/models/Resume.ts`

**DELETE**:
```typescript
resumeSignals?: {
  keywords: string[];
  location?: string;
  locations?: string[];
};
```

**KEEP**:
- `extractedText` (raw text needed for parsing)
- `comprehensiveResearch` (can be migrated to UserProfile later)
- `resumeVariants` (optimization results)
- `coverLetters` (generation results)

---

### 2. Remove Resume Signal Extraction
**File**: `src/lib/perplexity-intelligence.ts`

**DELETE** entire function:
- `extractResumeKeywordsAndLocation()` (lines ~1556-1585)

**REPLACE WITH**:
- Call `ProfileMapper.mapResumeToProfile()` instead

---

### 3. Update Resume Upload Route
**File**: `src/app/api/resume/upload/route.ts`

**DELETE**:
```typescript
// Extract keywords and location
const signals = await PerplexityIntelligenceService.extractResumeKeywordsAndLocation(extractedText)
resume.resumeSignals = {
  keywords: signals.keywords,
  location: signals.location
}
```

**REPLACE WITH**:
```typescript
// Map resume to user profile
await ProfileMapper.mapResumeToProfile(session.user.id, resume._id.toString())
```

---

### 4. Update Job Search Route
**File**: `src/app/api/jobs/search-by-resume/route.ts`

**DELETE**:
```typescript
// Check if resume has been analyzed
if (!resume.resumeSignals?.keywords || !resume.resumeSignals?.location) {
  return NextResponse.json({
    error: 'Resume not analyzed',
    details: 'Please upload your resume first to extract keywords and location'
  }, { status: 400 })
}

// Fallback to resume signals
keywords = resume.resumeSignals.keywords
location = resume.resumeSignals.location
```

**REPLACE WITH**:
```typescript
// Get profile data (required)
const profileData = await ProfileMapper.getProfileForJobSearch(session.user.id)
if (!profileData) {
  return NextResponse.json({
    error: 'Profile not found',
    details: 'Please upload your resume first to create your profile'
  }, { status: 400 })
}

keywords = profileData.keywords
location = profileData.location
```

---

### 5. Remove Resume Signal Indexes
**File**: `src/models/Resume.ts`

**DELETE**:
```typescript
ResumeSchema.index({ 'resumeSignals.keywords': 1 }); // Search by keywords
ResumeSchema.index({ 'resumeSignals.location': 1 }); // Search by location
```

**ALREADY HAVE** in UserProfile:
```typescript
UserProfileSchema.index({ 'location.city': 1, 'location.province': 1 })
UserProfileSchema.index({ 'skills.technical': 1 })
```

---

## 🔄 Migration Path:

### Step 1: Add Migration Script
**New file**: `src/scripts/migrate-resume-signals-to-profile.ts`

```typescript
// For existing users with resumeSignals but no profile
// Run once to migrate old data
async function migrateResumeSignalsToProfile() {
  const resumes = await Resume.find({ 
    resumeSignals: { $exists: true },
    // Find users without profiles
  })
  
  for (const resume of resumes) {
    await ProfileMapper.mapResumeToProfile(
      resume.userId.toString(),
      resume._id.toString()
    )
  }
}
```

### Step 2: Remove Old Code
1. Delete `resumeSignals` from Resume model
2. Delete `extractResumeKeywordsAndLocation()` function
3. Update all references to use UserProfile instead

### Step 3: Deploy
- Migration runs automatically on first deploy
- Old data preserved in UserProfile
- Resume model simplified

---

## 📊 Before vs After:

### Before (Duplicate Systems):
```
Resume Model:
├─ extractedText (raw text)
├─ resumeSignals (keywords, location) ← DUPLICATE
├─ comprehensiveResearch (full analysis)
└─ resumeVariants (optimized versions)

UserProfile Model:
├─ location (city, province) ← DUPLICATE
├─ skills (categorized keywords) ← DUPLICATE
├─ workExperience (structured)
└─ education (structured)
```

### After (Single Source of Truth):
```
Resume Model:
├─ extractedText (raw text only)
├─ comprehensiveResearch (full analysis)
└─ resumeVariants (optimized versions)

UserProfile Model: ← SINGLE SOURCE
├─ location (city, province)
├─ skills (categorized)
├─ workExperience (structured)
├─ education (structured)
└─ psychologyProfile (from research)
```

---

## ✅ Benefits:

1. **No Duplicates**: One place for user data
2. **Better Structure**: Categorized skills, structured experience
3. **User Control**: Can edit profile directly
4. **Consistency**: All features use same data source
5. **Cleaner Code**: Less confusion about which data to use

---

## 🚀 Implementation Order:

1. **HIGH**: Update Resume upload to use ProfileMapper (remove signal extraction)
2. **HIGH**: Update Job search to require UserProfile (remove signal fallback)
3. **MEDIUM**: Remove `resumeSignals` field from Resume model
4. **MEDIUM**: Delete `extractResumeKeywordsAndLocation()` function
5. **LOW**: Add migration script for existing users
6. **LOW**: Remove old indexes

---

## ⚠️ Breaking Changes:

- Existing users with only `resumeSignals` will need to re-upload resume
- OR run migration script to convert signals → profile
- Job search will fail without UserProfile

**Mitigation**: Add migration on first login or resume access

---

## 🧪 Testing:

- [ ] Upload new resume → creates UserProfile
- [ ] Job search uses UserProfile location
- [ ] Job search uses UserProfile keywords
- [ ] Resume optimization uses UserProfile
- [ ] Cover letter uses UserProfile
- [ ] No references to `resumeSignals` remain
- [ ] Old resumes migrated to UserProfile

---

## 📝 Files to Modify:

1. `src/models/Resume.ts` - Remove resumeSignals field
2. `src/lib/perplexity-intelligence.ts` - Delete extractResumeKeywordsAndLocation
3. `src/app/api/resume/upload/route.ts` - Use ProfileMapper
4. `src/app/api/jobs/search-by-resume/route.ts` - Require UserProfile
5. `src/scripts/migrate-resume-signals-to-profile.ts` - New migration script

---

## 🎯 Goal:

**One system, one source of truth, no confusion.**
