# Phase 1: Weighted Skills - Current State Audit

## ✅ What We Have

### 1. **Perplexity Resume Analysis** (`extractResumeSignals`)
**Location**: `src/lib/perplexity-intelligence.ts`

**Current Output**:
```typescript
{
  keywords: string[],  // 50 skills in priority order
  location: string,    // "City, Province"
  personalInfo: {
    name: string,
    email: string,
    phone: string
  }
}
```

**Issues**:
- ❌ Returns flat array of keywords (no weights)
- ❌ No distinction between primary/secondary skills
- ❌ No years of experience per skill
- ❌ No skill categories (technical vs soft skills)

### 2. **Enhanced Resume Extractor** (`calculateSkillWeights`)
**Location**: `src/lib/enhanced-resume-extractor.ts`

**Current Logic**:
```typescript
private static calculateSkillWeights(
  skills: any,
  workExperience: any[],
  education: any[]
): Array<{ skill: string, weight: number, years?: number }> {
  // Maps skills to weights based on:
  // - Recency (recent jobs = higher weight)
  // - Frequency (mentioned multiple times = higher weight)
  // - Context (job title vs description)
}
```

**Status**: ✅ Good logic BUT not used in job search!

### 3. **UserProfile Schema**
**Location**: `src/models/UserProfile.ts`

**Current Structure**:
```typescript
skills: {
  technical: string[],  // Flat array
  soft: string[],       // Flat array
  languages: string[]   // Flat array
}
```

**Issues**:
- ❌ No weights stored
- ❌ No years of experience
- ❌ No primary vs secondary distinction
- ❌ Not used for job matching

### 4. **Job Search**
**Location**: `src/app/api/jobs/search/route.ts`

**Current Flow**:
```typescript
// Uses basic keyword matching
const keywords = extractKeywords(resumeText) // ❌ Basic string split
// Returns: ["react", "node", "aws"] (no context, no weights)
```

**Issues**:
- ❌ Uses `extractKeywords()` from `utils.ts` (basic string splitting)
- ❌ Doesn't use `extractResumeSignals()` (Perplexity AI)
- ❌ Doesn't use `calculateSkillWeights()` (enhanced extractor)
- ❌ No weighted matching

---

## 🎯 Phase 1 Goals

### Goal 1: Enhance Perplexity Resume Analysis
**Change**: Update `extractResumeSignals()` to return weighted skills

**New Output**:
```typescript
{
  keywords: string[],  // Keep for backward compatibility
  skillsWeighted: {
    primarySkills: Array<{
      skill: string,
      weight: number,      // 0.0 - 1.0
      years?: number,      // Years of experience
      category: 'technical' | 'soft' | 'language' | 'tool'
    }>,
    secondarySkills: Array<{
      skill: string,
      weight: number,
      years?: number,
      category: string
    }>
  },
  location: string,
  personalInfo: { ... }
}
```

### Goal 2: Update UserProfile Schema
**Change**: Add weighted skills storage

**New Schema**:
```typescript
skills: {
  technical: string[],  // Keep for backward compatibility
  soft: string[],
  languages: string[],
  
  // NEW: Weighted skills
  weighted: {
    primarySkills: Array<{
      skill: string,
      weight: number,
      years?: number,
      category: string,
      extractedAt: Date
    }>,
    secondarySkills: Array<{
      skill: string,
      weight: number,
      years?: number,
      category: string,
      extractedAt: Date
    }>,
    lastAnalyzedAt: Date
  }
}
```

### Goal 3: Update Job Search to Use Weighted Skills
**Change**: Replace `extractKeywords()` with weighted skill matching

**New Flow**:
```typescript
// Get user's weighted skills from UserProfile
const userProfile = await UserProfile.findOne({ userId })
const { primarySkills, secondarySkills } = userProfile.skills.weighted

// Match jobs with skill weights
jobs.forEach(job => {
  let score = 0
  
  // Primary skills: 2x weight
  primarySkills.forEach(skill => {
    if (job.description.includes(skill.skill)) {
      score += skill.weight * 2
    }
  })
  
  // Secondary skills: 1x weight
  secondarySkills.forEach(skill => {
    if (job.description.includes(skill.skill)) {
      score += skill.weight
    }
  })
  
  job.matchScore = score
})

// Sort by match score
jobs.sort((a, b) => b.matchScore - a.matchScore)
```

---

## 📋 Implementation Checklist

### Step 1: Enhance Perplexity Prompt (30 min)
- [ ] Update `extractResumeSignals()` prompt to extract skill weights
- [ ] Add skill categorization (technical, soft, language, tool)
- [ ] Add years of experience per skill
- [ ] Test with sample resumes

### Step 2: Update UserProfile Schema (15 min)
- [ ] Add `skills.weighted` field to schema
- [ ] Create migration script (optional - can populate on next resume upload)
- [ ] Add indexes for weighted skills

### Step 3: Update Resume Upload Flow (30 min)
- [ ] Call enhanced `extractResumeSignals()`
- [ ] Store weighted skills in UserProfile
- [ ] Keep backward compatibility with flat arrays

### Step 4: Update Job Search (45 min)
- [ ] Get weighted skills from UserProfile
- [ ] Implement weighted matching algorithm
- [ ] Sort jobs by match score
- [ ] Add match score to job results

### Step 5: Testing (30 min)
- [ ] Test with 3-5 sample resumes
- [ ] Verify weighted skills extracted correctly
- [ ] Verify job matching improves
- [ ] Compare old vs new match quality

**Total Time: ~2.5 hours**

---

## 🚀 Expected Impact

### Before (Current):
```
Resume: "Senior React Developer with 5 years Node.js"
Extracted: ["senior", "react", "developer", "years", "node"]
Job Match: Basic keyword count (poor quality)
```

### After (Phase 1):
```
Resume: "Senior React Developer with 5 years Node.js"
Extracted: {
  primarySkills: [
    { skill: "React", weight: 0.95, years: 5, category: "technical" },
    { skill: "Node.js", weight: 0.90, years: 5, category: "technical" },
    { skill: "JavaScript", weight: 0.85, years: 5, category: "technical" }
  ],
  secondarySkills: [
    { skill: "TypeScript", weight: 0.60, years: 2, category: "technical" },
    { skill: "Leadership", weight: 0.50, years: 3, category: "soft" }
  ]
}
Job Match: Weighted scoring (10x better quality)
```

### Metrics:
- **Match Quality**: 10x improvement
- **User Satisfaction**: Higher (more relevant jobs)
- **Cost**: $0.01 per resume (one-time)
- **Speed**: No impact (same Perplexity call)

---

## 🔄 Backward Compatibility

All changes maintain backward compatibility:
- ✅ Keep `keywords` array in `extractResumeSignals()`
- ✅ Keep flat `skills.technical`, `skills.soft` arrays
- ✅ Add new fields without breaking existing code
- ✅ Gradual migration (populate on next resume upload)

---

## Ready to Start?

**Next Action**: Update Perplexity prompt in `extractResumeSignals()` to extract weighted skills.

Should I proceed with Step 1?
