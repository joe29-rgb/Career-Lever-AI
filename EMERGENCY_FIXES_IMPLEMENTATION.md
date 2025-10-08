# 🚨 Emergency Fixes - Collaborative Implementation Guide

**Created**: October 8, 2025  
**Approach**: Blending AI analysis with practical implementation  
**Tone**: Collaborative problem-solving (not authoritative)

---

## 📊 ISSUE SEVERITY ASSESSMENT

Based on combined analysis from both AIs, here are the **7 critical problems** blocking core functionality:

### **CRITICAL (Fix Immediately):**
1. 🔴 **Text Contrast Crisis** - Content invisible in wrong theme mode
2. 🔴 **Job Selection Breaks Workflow** - Redirects to external sites
3. 🔴 **Cover Letter Context Error** - Says user works at target company

### **HIGH PRIORITY (Fix Today):**
4. 🟡 **Company Research Empty** - No hiring contacts returned
5. 🟡 **Missing Back Navigation** - Users trapped in workflow
6. 🟡 **Auto-Population Missing** - Manual data re-entry required

### **MEDIUM PRIORITY (Fix Soon):**
7. 🟢 **Resume Builder Inconsistency** - Different experience in Career Finder
8. 🟢 **Compare Button Broken** - No resume matching functionality

---

## 🎯 FIX #1: TEXT CONTRAST EMERGENCY

### **What We Found:**
- White text on white backgrounds (invisible)
- Black text on black backgrounds (invisible)
- Hardcoded colors bypassing theme system
- WCAG accessibility violations

### **Root Cause:**
Components using `bg-white`, `text-black`, `bg-gray-*` instead of CSS variables.

### **Solution Strategy:**
Replace all hardcoded colors with theme-aware CSS variables.

**Files to Fix:**
```typescript
// Priority files with contrast issues:
src/components/resume-customizer/index.tsx
src/app/career-finder/resume/page.tsx  
src/app/career-finder/search/page.tsx
src/app/career-finder/company-insights/page.tsx
```

**Replacement Pattern:**
```tsx
// ❌ WRONG (hardcoded):
<div className="bg-white text-black border-gray-300">
  <h4 className="text-gray-900">Title</h4>
  <p className="text-gray-600">Description</p>
</div>

// ✅ CORRECT (theme-aware):
<div className="bg-card text-foreground border-border">
  <h4 className="text-foreground">Title</h4>
  <p className="text-muted-foreground">Description</p>
</div>
```

**CSS Variable Reference:**
```css
/* Use these instead of hardcoded colors: */
--background       /* Main page background */
--foreground       /* Primary text */
--card            /* Card backgrounds */
--card-foreground /* Text on cards */
--muted           /* Subtle backgrounds */
--muted-foreground /* Secondary text */
--border          /* All borders */
--primary         /* Brand color (#5424FD) */
--primary-foreground /* Text on primary */
```

---

## 🎯 FIX #2: JOB SELECTION WORKFLOW

### **What We Found:**
- Clicking job card → Redirects to Indeed/LinkedIn
- Breaks Career Finder flow completely
- Users can't analyze jobs or research companies

### **Current Behavior (BROKEN):**
```tsx
// ModernJobCard redirects externally
<Link href={job.url} target="_blank">
  View Job →
</Link>
```

### **Solution Strategy:**
Store job locally → Navigate to internal analysis page → Auto-analyze

**Implementation Plan:**

#### **Step 1: Update Job Card**
```tsx
// src/components/modern-job-card.tsx
export function ModernJobCard({ job, onSelect }: ModernJobCardProps) {
  const handleSelectJob = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Call parent handler instead of external redirect
    if (onSelect) {
      onSelect(job)
    }
  }

  return (
    <div onClick={handleSelectJob} className="cursor-pointer">
      {/* Card content */}
      <button className="btn-primary">
        Select & Analyze This Job
      </button>
    </div>
  )
}
```

#### **Step 2: Create Job Selection Handler**
```tsx
// src/app/career-finder/search/page.tsx
const handleJobSelection = async (selectedJob: JobListing) => {
  try {
    // Store in localStorage for persistence
    localStorage.setItem('selectedJob', JSON.stringify({
      ...selectedJob,
      selectedAt: Date.now()
    }))
    
    // Store in database for history
    await fetch('/api/jobs/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedJob)
    })
    
    // Navigate to analysis page
    router.push('/career-finder/job-analysis')
  } catch (error) {
    console.error('Failed to store job:', error)
    toast.error('Failed to select job. Please try again.')
  }
}
```

#### **Step 3: Create Job Analysis Page**
```tsx
// src/app/career-finder/job-analysis/page.tsx
'use client'

export default function JobAnalysisPage() {
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load selected job
    const stored = localStorage.getItem('selectedJob')
    if (!stored) {
      router.push('/career-finder/search')
      return
    }
    
    const jobData = JSON.parse(stored)
    setJob(jobData)
    
    // AUTO-ANALYZE immediately
    analyzeJob(jobData)
  }, [])

  const analyzeJob = async (jobData: any) => {
    try {
      // Get user's resume
      const resume = localStorage.getItem('uploadedResume')
      
      // Call analysis API
      const response = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: jobData,
          resume: resume
        })
      })
      
      const result = await response.json()
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6">
        ← Back to Search
      </button>

      {loading ? (
        <div>Analyzing job...</div>
      ) : (
        <div>
          <h1>{job.title}</h1>
          <p>{job.company}</p>
          
          {/* Show analysis results */}
          <div className="mt-8">
            <h2>Match Analysis</h2>
            <p>Your resume matches this job: {analysis.matchScore}%</p>
            
            <h3>Matching Skills:</h3>
            <ul>
              {analysis.matchingSkills?.map(skill => (
                <li key={skill} className="text-green-500">✓ {skill}</li>
              ))}
            </ul>
            
            <h3>Skills to Highlight:</h3>
            <ul>
              {analysis.missingSkills?.map(skill => (
                <li key={skill} className="text-yellow-500">→ {skill}</li>
              ))}
            </ul>
          </div>

          {/* Next step button */}
          <button 
            onClick={() => router.push('/career-finder/company-insights')}
            className="btn-primary mt-8"
          >
            Research Company →
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 🎯 FIX #3: COVER LETTER CONTEXT ERROR

### **What We Found:**
Cover letter says: "In my current role at Michaels..." when user is APPLYING to Michaels (not working there).

### **Root Cause:**
AI prompt doesn't distinguish between:
- User's CURRENT employer
- Company user is APPLYING TO

### **Solution:**

```typescript
// src/lib/cover-letter-generator.ts (or wherever cover letter is generated)

interface CoverLetterContext {
  applicantName: string
  currentEmployer?: string  // ← Add this
  targetCompany: string
  targetPosition: string
  resume: string
  jobDescription: string
}

async function generateCoverLetter(context: CoverLetterContext) {
  const prompt = `
Generate a professional cover letter for a job application.

CRITICAL CONTEXT (READ CAREFULLY):
- Applicant name: ${context.applicantName}
- Current employer: ${context.currentEmployer || 'Not specified'}
- Target company (APPLYING TO): ${context.targetCompany}
- Target position: ${context.targetPosition}

IMPORTANT RULES:
1. The applicant is APPLYING TO ${context.targetCompany}
2. The applicant does NOT currently work at ${context.targetCompany}
3. Do NOT say "In my current role at ${context.targetCompany}"
4. Do NOT imply the applicant already works at ${context.targetCompany}
5. Use phrases like:
   - "I am excited to apply for the ${context.targetPosition} position at ${context.targetCompany}"
   - "I am drawn to ${context.targetCompany}'s mission"
   - "I would bring to ${context.targetCompany}..."

Resume:
${context.resume}

Job Description:
${context.jobDescription}

Generate a compelling cover letter following the rules above.
`

  const response = await callAI(prompt)
  
  // Post-process to catch any mistakes
  const sanitized = response
    .replace(
      new RegExp(`(In my current role|Currently working) at ${context.targetCompany}`, 'gi'),
      `In my experience`
    )
    .replace(
      new RegExp(`at ${context.targetCompany}`, 'g'),
      (match, offset) => {
        // Only replace if it implies current employment
        const precedingText = response.slice(Math.max(0, offset - 50), offset)
        if (precedingText.includes('current') || precedingText.includes('working')) {
          return 'in my current role'
        }
        return match
      }
    )
  
  return sanitized
}
```

---

## 🎯 FIX #4: COMPANY RESEARCH - HIRING CONTACTS

### **What We Found:**
- Company research returns generic info
- No hiring manager names, emails, or phone numbers
- Breaks key app value proposition

### **Current State:**
`hiringContactsV2` method exists in `perplexity-intelligence.ts` but may not return detailed contacts.

### **Solution Strategy:**
Enhance Perplexity prompt to explicitly request contact details.

```typescript
// src/lib/prompts/perplexity-prompts.ts

export const HIRING_CONTACTS_PROMPT = {
  system: `You are an expert at finding hiring manager contact information using public sources.

Your goal is to find REAL, VERIFIABLE contact information for hiring managers and recruiters.

Sources to check:
- LinkedIn company pages (look for "Talent Acquisition", "Hiring Manager", "HR")
- Company "About Us" / "Team" pages
- Press releases mentioning HR contacts
- Industry directories
- Public records

For each contact, provide:
1. Full name
2. Job title
3. Email address (use standard formats: firstname.lastname@company.com)
4. Phone number (if publicly available)
5. LinkedIn profile URL
6. Department
7. Decision-making power (high/medium/low)
8. Best contact method (email/LinkedIn/phone)

IMPORTANT: Only return contacts with at least a name and one valid contact method (email OR LinkedIn).`,

  userTemplate: (companyName: string, industry?: string) => `
Find hiring managers and recruiters at ${companyName}${industry ? ` in the ${industry} industry` : ''}.

Return JSON array of contacts:
[
  {
    "name": "FirstName LastName",
    "title": "Director of Talent Acquisition",
    "email": "firstname.lastname@company.com",
    "phone": "+1-555-123-4567",
    "linkedIn": "https://linkedin.com/in/profile",
    "department": "Human Resources",
    "decisionMakingPower": "high",
    "bestContactMethod": "email",
    "bestContactTime": "Tuesday-Thursday, 9-11 AM",
    "notes": "Handles technical hiring"
  }
]

If you cannot find contacts, return empty array [].
`
}
```

---

## 🎯 FIX #5: BACK BUTTON IMPLEMENTATION

### **Solution:**
Add consistent back navigation to all Career Finder pages.

```tsx
// src/components/career-finder-back-button.tsx
'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CareerFinderBackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  )
}
```

**Add to every Career Finder page:**
```tsx
import { CareerFinderBackButton } from '@/components/career-finder-back-button'

export default function CareerFinderPage() {
  return (
    <div>
      <CareerFinderBackButton />
      {/* Page content */}
    </div>
  )
}
```

---

## 🎯 FIX #6: AUTO-POPULATE COMPANY INFO

### **Solution:**
Pass job data through the workflow automatically.

```tsx
// When navigating from job analysis to company research:
const handleResearchCompany = () => {
  const companyContext = {
    name: job.company,
    website: extractWebsite(job.url) || `${job.company.toLowerCase().replace(/\s+/g, '')}.com`,
    location: job.location,
    industry: job.industry || 'Unknown',
    position: job.title
  }
  
  sessionStorage.setItem('companyResearchContext', JSON.stringify(companyContext))
  router.push('/career-finder/company-insights')
}

// In company-insights page:
useEffect(() => {
  const context = sessionStorage.getItem('companyResearchContext')
  if (context) {
    const data = JSON.parse(context)
    
    // Auto-fill form
    setCompanyName(data.name)
    setWebsite(data.website)
    setLocation(data.location)
    
    // Auto-trigger research
    triggerResearch(data)
    
    sessionStorage.removeItem('companyResearchContext')
  }
}, [])
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Critical Fixes (Do Today)**
- [ ] Fix text contrast in resume-customizer
- [ ] Fix text contrast in career-finder pages
- [ ] Update job card to call onSelect instead of redirecting
- [ ] Create job-analysis page with auto-analysis
- [ ] Fix cover letter generation prompt

### **Phase 2: High Priority (Do Today)**
- [ ] Enhance hiring contacts prompt
- [ ] Add back buttons to all career-finder pages
- [ ] Implement auto-population for company research

### **Phase 3: Polish (Do Tomorrow)**
- [ ] Copy resume-builder components to career-finder/resume
- [ ] Fix compare-with-resume button functionality

---

## 🧪 TESTING PLAN

After implementing fixes, test this complete flow:

1. **Upload resume** → Verify theme contrast
2. **Search jobs** → Click job card
3. **Verify** → Should go to job-analysis, NOT external site
4. **Check** → Auto-analysis starts immediately
5. **Click** → "Research Company" button
6. **Verify** → Company name/website auto-populated
7. **Check** → Hiring contacts include names + emails
8. **Generate** → Cover letter
9. **Verify** → Does NOT say "I work at [target company]"
10. **Test** → Back buttons work on every page

---

**This is a collaborative plan - let's work together to implement these fixes!**

**Question: Should we start with Phase 1 (critical fixes) right now?**

