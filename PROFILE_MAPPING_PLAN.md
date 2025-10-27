# 🗺️ Profile Mapping Implementation Plan

## Overview

Centralize all user data in `UserProfile` model for:
- **Job Search**: Location, keywords, preferences
- **Resume Optimization**: Work history, education, skills
- **Cover Letter Generation**: Experience, psychology profile
- **Application Tracking**: Career preferences

---

## ✅ What's Been Created:

### 1. **UserProfile Model** (`src/models/UserProfile.ts`)
Comprehensive user profile with:
- Personal information (name, email, phone, links)
- **Location** (city, province, country) - PRIMARY for job search
- Work experience (company, title, dates, achievements, skills)
- Education (institution, degree, field, dates)
- Certifications
- Skills (technical, soft, languages, tools)
- Career preferences (target roles, work type, salary, relocation)
- Psychology profile (work style, motivators, strengths)
- Profile completeness score (0-100)

### 2. **ProfileMapper Service** (`src/lib/profile-mapper.ts`)
Maps resume data to UserProfile:
- `mapResumeToProfile()` - Extract all data from resume
- `getProfileForJobSearch()` - Get location + keywords
- `getProfileForOptimization()` - Get full profile for resume/cover letter
- Location parsing (City, Province format)
- Skill categorization (technical, soft, languages, tools)

### 3. **API Routes** (`src/app/api/profile/sync-from-resume/route.ts`)
- `POST /api/profile/sync-from-resume` - Sync profile from resume
- `GET /api/profile/sync-from-resume` - Get current profile

### 4. **Updated Job Search** (`src/app/api/jobs/search-by-resume/route.ts`)
- Now uses `ProfileMapper.getProfileForJobSearch()` first
- Falls back to resume signals if no profile
- Better location handling

---

## 🔧 Next Steps to Complete:

### Phase 1: Fix TypeScript Errors (30 min)
**Files to fix**:
1. `src/models/UserProfile.ts` - Fix `calculateCompleteness` method type
2. `src/lib/profile-mapper.ts` - Fix `ParsedResume` interface mismatch
3. `src/lib/local-resume-parser.ts` - Add missing properties to return type

**Actions**:
```typescript
// In local-resume-parser.ts, add to ParsedResume interface:
export interface ParsedResume {
  // ... existing fields
  yearsExperience?: number
  workExperience?: IWorkExperience[]
  education?: IEducation[]
}
```

---

### Phase 2: Trigger Profile Sync on Resume Upload (15 min)
**File**: `src/app/api/resume/upload/route.ts`

**Add after resume analysis**:
```typescript
// After resume signals are extracted
try {
  const { ProfileMapper } = await import('@/lib/profile-mapper')
  await ProfileMapper.mapResumeToProfile(session.user.id, savedResume._id.toString())
  console.log('[RESUME_UPLOAD] Profile synced from resume')
} catch (error) {
  console.error('[RESUME_UPLOAD] Profile sync failed:', error)
  // Don't fail upload if profile sync fails
}
```

---

### Phase 3: Update Resume Optimization to Use Profile (1 hour)
**File**: `src/lib/perplexity-intelligence.ts` or new file

**Current**: Resume optimization uses raw resume text
**New**: Use structured profile data

```typescript
// Get profile for optimization
const profile = await ProfileMapper.getProfileForOptimization(userId)

// Build structured resume from profile
const structuredResume = {
  personalInfo: profile.personalInfo,
  summary: profile.summary,
  workExperience: profile.workExperience.map(exp => ({
    company: exp.company,
    title: exp.title,
    dates: `${exp.startDate} - ${exp.endDate || 'Present'}`,
    achievements: exp.achievements,
    skills: exp.skills
  })),
  education: profile.education,
  skills: profile.skills,
  certifications: profile.certifications
}

// Optimize for specific job
const optimizedResume = await optimizeResumeForJob(
  structuredResume,
  jobDescription,
  profile.psychologyProfile
)
```

---

### Phase 4: Update Cover Letter to Use Profile (1 hour)
**File**: `src/lib/perplexity-intelligence.ts`

**Current**: Cover letter uses resume text + job description
**New**: Use profile data + psychology + job description

```typescript
const profile = await ProfileMapper.getProfileForOptimization(userId)

const coverLetterPrompt = `
Generate a cover letter for:

CANDIDATE PROFILE:
Name: ${profile.personalInfo.name}
Location: ${profile.personalInfo.location.city}, ${profile.personalInfo.location.province}
Years Experience: ${profile.yearsExperience}

WORK EXPERIENCE:
${profile.workExperience.map(exp => `
- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  Key achievements: ${exp.achievements.join(', ')}
`).join('\n')}

PSYCHOLOGY PROFILE:
Work Style: ${profile.psychologyProfile.workStyle.join(', ')}
Motivators: ${profile.psychologyProfile.motivators.join(', ')}
Strengths: ${profile.psychologyProfile.strengths.join(', ')}

JOB DESCRIPTION:
${jobDescription}

Generate a personalized cover letter that:
1. Highlights relevant experience from work history
2. Matches communication style to psychology profile
3. Emphasizes motivators and strengths
4. Shows genuine interest in the role
`
```

---

### Phase 5: Add Profile Completion UI (2 hours)
**New file**: `src/app/profile/page.tsx`

**Features**:
- Display profile completeness (0-100%)
- Edit personal information
- Edit location (CRITICAL for job search)
- Edit work experience
- Edit education
- Edit skills
- Edit career preferences
- Save changes

---

### Phase 6: Add Profile Sync Button (30 min)
**File**: `src/app/dashboard/page.tsx` or resume upload page

**Add button**:
```tsx
<Button onClick={async () => {
  const res = await fetch('/api/profile/sync-from-resume', {
    method: 'POST',
    body: JSON.stringify({ resumeId })
  })
  const data = await res.json()
  console.log('Profile synced:', data)
}}>
  Sync Profile from Resume
</Button>
```

---

## 📊 Data Flow:

### Before (Fragmented):
```
Resume Upload
  ↓
Extract Text
  ↓
Resume Signals (keywords, location) ← Used for job search
  ↓
Comprehensive Research ← Used for optimization
  ↓
Generate Resume Variants ← Uses raw text
  ↓
Generate Cover Letter ← Uses raw text
```

### After (Centralized):
```
Resume Upload
  ↓
Extract Text
  ↓
Map to UserProfile ← CENTRAL SOURCE OF TRUTH
  ├─→ Location (City, Province) → Job Search
  ├─→ Work Experience → Resume Optimization
  ├─→ Education → Resume Optimization
  ├─→ Skills (categorized) → Job Matching
  ├─→ Psychology Profile → Cover Letter
  └─→ Career Preferences → Job Filtering
```

---

## 🎯 Benefits:

1. **Better Job Search**
   - Specific location (Edmonton, AB) instead of "Canada"
   - Categorized skills (technical, soft, languages, tools)
   - Experience level auto-calculated
   - Career preferences applied

2. **Better Resume Optimization**
   - Structured work history
   - Specific achievements per role
   - Skills mapped to experiences
   - Psychology-informed writing style

3. **Better Cover Letters**
   - Personalized to candidate's experience
   - Matches communication style
   - Highlights relevant achievements
   - Shows genuine interest

4. **User Control**
   - Edit profile directly
   - Update location without re-uploading resume
   - Add/remove experiences
   - Set career preferences

---

## 🚀 Implementation Priority:

1. **HIGH**: Fix TypeScript errors (blocks build)
2. **HIGH**: Trigger profile sync on resume upload
3. **MEDIUM**: Update job search to use profile (already done!)
4. **MEDIUM**: Update resume optimization
5. **MEDIUM**: Update cover letter generation
6. **LOW**: Add profile UI
7. **LOW**: Add sync button

---

## Testing Checklist:

- [ ] Profile syncs from resume upload
- [ ] Job search uses profile location
- [ ] Job search uses profile keywords
- [ ] Resume optimization uses profile data
- [ ] Cover letter uses profile + psychology
- [ ] Profile completeness calculates correctly
- [ ] User can edit profile
- [ ] Changes persist to database

---

## Notes:

- Profile is optional fallback - system still works with just resume
- Profile improves accuracy and personalization
- User can manually edit profile for better control
- Profile completeness encourages users to fill out all fields
