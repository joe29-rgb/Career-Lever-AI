# UI Components Usage Guide
**Career Lever AI - Complete UI Redesign Implementation**

## 📦 **Available Components**

All components are now available from `@/components/ui`:

```tsx
import { 
  Toast, 
  JobMatchExplanation, 
  CompanyResearchCard,
  LoadingButton,
  PreviewEmpty,
  FormGroup 
} from '@/components/ui'
```

---

## 🎨 **1. Toast Notifications**

### Basic Usage
```tsx
import { useToast } from '@/components/ui'

function MyComponent() {
  const { success, error, warning, info } = useToast()
  
  const handleSubmit = async () => {
    try {
      await submitForm()
      success('Form submitted successfully!')
    } catch (err) {
      error('Failed to submit form')
    }
  }
}
```

### Manual Toast
```tsx
import { Toast } from '@/components/ui'

<Toast 
  type="success"
  message="Resume generated!"
  autoDismiss={3000}
  onClose={() => console.log('closed')}
/>
```

### Toast Types
- `success` - Green with checkmark
- `error` - Red with X icon
- `warning` - Orange with alert icon
- `info` - Blue with info icon

---

## 🎯 **2. Job Match Explanation**

Shows why a job matches the user's profile with visual progress bar.

```tsx
import { JobMatchExplanation } from '@/components/ui'

<JobMatchExplanation 
  data={{
    matchScore: 85,
    skillsMatch: 92,
    experienceMatch: true,
    matchedSkills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    reasons: [
      '92% of your top skills match',
      'Your experience level aligns perfectly',
      'You have 4 required skills'
    ]
  }}
/>
```

### Features
- ✅ Color-coded progress bar (green >80%, yellow >60%, red <60%)
- ✅ Matched skills tags (shows first 5, then "+X more")
- ✅ Custom reasons or auto-generated from data

---

## 🏢 **3. Company Research Cards**

Beautiful pros/cons cards for company research.

```tsx
import { CompanyResearchCard } from '@/components/ui'

<CompanyResearchCard 
  data={{
    pros: [
      'Great work-life balance',
      'Competitive salary and benefits',
      'Strong engineering culture'
    ],
    cons: [
      'Limited remote work options',
      'Slow promotion process'
    ]
  }}
/>
```

### Single Card Variant
```tsx
import { CompanyCard } from '@/components/ui'

<CompanyCard 
  type="pros"
  title="What We Love"
  items={['Great culture', 'Good pay', 'Remote work']}
/>
```

---

## ⏳ **4. Loading States**

### Loading Button
```tsx
import { LoadingButton } from '@/components/ui'

<LoadingButton 
  isLoading={isSubmitting}
  loadingText="Generating..."
  onClick={handleGenerate}
>
  Generate Resume
</LoadingButton>
```

### Full Page Overlay
```tsx
import { LoadingOverlay } from '@/components/ui'

{isProcessing && <LoadingOverlay message="Processing your resume..." />}
```

### Inline Loading
```tsx
import { LoadingState } from '@/components/ui'

{isLoading ? (
  <LoadingState message="Loading jobs..." />
) : (
  <JobsList jobs={jobs} />
)}
```

### Spinner Only
```tsx
import { Spinner } from '@/components/ui'

<Spinner size="lg" />  // sm, md, lg
```

---

## 📄 **5. Preview Empty State**

Shows when preview area is empty with helpful message.

```tsx
import { PreviewEmpty } from '@/components/ui'

<PreviewEmpty 
  icon="document"  // document, email, job, search
  title="No resume preview"
  description="Upload your resume to see a preview"
  action={
    <button className="btn-primary">
      Upload Resume
    </button>
  }
/>
```

### With Container
```tsx
import { PreviewContainer } from '@/components/ui'

<PreviewContainer 
  isEmpty={!resume}
  emptyState={{
    icon: 'document',
    title: 'No preview available',
    description: 'Complete the form to see a preview'
  }}
>
  <ResumePreview data={resume} />
</PreviewContainer>
```

---

## 📝 **6. Form Validation**

### Form Group with Validation
```tsx
import { FormGroup } from '@/components/ui'

<FormGroup
  label="Email Address"
  required
  error={errors.email}
  success={isValid && 'Email looks good!'}
>
  <input 
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormGroup>
```

### Manual Feedback
```tsx
import { FormFeedback } from '@/components/ui'

<FormFeedback 
  type="error"
  message="Password must be at least 8 characters"
/>
```

---

## 🎨 **CSS Classes Available**

### Automatic Validation States
```css
/* Inputs automatically show validation colors */
input:invalid:not(:placeholder-shown) {
  border-color: var(--color-error);
  background-color: rgba(var(--color-error-rgb), 0.05);
}

input:valid:not(:placeholder-shown) {
  border-color: var(--color-success);
  background-color: rgba(var(--color-success-rgb), 0.05);
}
```

### Button Loading State
```tsx
<button className="btn-primary btn-loading">
  Processing...
</button>
```

### Resume Textarea
```tsx
<textarea 
  name="resume"
  className="resume-textarea"  // Better readability
/>
```

### Preview Container
```tsx
<div className="preview-container">
  {/* Your preview content */}
</div>
```

### Company Cards (Manual)
```tsx
<div className="company-research">
  <div className="company-card company-card--pros">
    <h4>Pros</h4>
    <ul>
      <li>Great culture</li>
    </ul>
  </div>
</div>
```

---

## 🎯 **Design System Variables**

All components use the clean CSS variable system:

```css
/* Colors */
var(--color-primary)           /* Teal accent */
var(--color-text)              /* Primary text */
var(--color-text-secondary)    /* Secondary text */
var(--color-surface)           /* Card backgrounds */
var(--color-background)        /* Page background */
var(--color-success)           /* Green */
var(--color-error)             /* Red */
var(--color-warning)           /* Orange */

/* Spacing */
var(--space-4)   /* 4px */
var(--space-8)   /* 8px */
var(--space-12)  /* 12px */
var(--space-16)  /* 16px */
var(--space-24)  /* 24px */
var(--space-32)  /* 32px */

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)

/* Border Radius */
var(--radius-sm)
var(--radius-md)
var(--radius-lg)
var(--radius-full)
```

---

## ✨ **Quick Examples**

### Resume Builder with Preview
```tsx
import { PreviewContainer, LoadingButton } from '@/components/ui'

function ResumeBuilder() {
  const [resume, setResume] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="resume-editor-container">
      <div className="editor">
        <textarea name="resume" className="resume-textarea" />
        <LoadingButton 
          isLoading={isGenerating}
          loadingText="Generating..."
          onClick={handleGenerate}
        >
          Generate Resume
        </LoadingButton>
      </div>
      
      <PreviewContainer 
        isEmpty={!resume}
        emptyState={{
          icon: 'document',
          title: 'No preview yet',
          description: 'Fill out the form to generate your resume'
        }}
      >
        <ResumePreview data={resume} />
      </PreviewContainer>
    </div>
  )
}
```

### Job Card with Match Explanation
```tsx
import { JobMatchExplanation, CompanyResearchCard } from '@/components/ui'

function JobDetails({ job }) {
  return (
    <div>
      <JobMatchExplanation data={job.matchData} />
      <CompanyResearchCard data={job.companyResearch} />
    </div>
  )
}
```

### Form with Validation
```tsx
import { FormGroup, useToast } from '@/components/ui'

function ApplicationForm() {
  const { success, error } = useToast()
  const [errors, setErrors] = useState({})

  const handleSubmit = async () => {
    try {
      await submitApplication()
      success('Application submitted!')
    } catch (err) {
      error('Failed to submit application')
    }
  }

  return (
    <form>
      <FormGroup
        label="Full Name"
        required
        error={errors.name}
      >
        <input type="text" />
      </FormGroup>
      
      <FormGroup
        label="Email"
        required
        error={errors.email}
      >
        <input type="email" />
      </FormGroup>
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

## 🚀 **Next Steps**

1. **Replace old components** with new ones throughout the app
2. **Use CSS variables** instead of hardcoded colors
3. **Add ARIA labels** to all interactive elements
4. **Test keyboard navigation** on all pages
5. **Verify WCAG AA compliance** for color contrast

---

## 📚 **Additional Resources**

- `UI_REDESIGN_PLAN.md` - Original design plan with all 20 improvements
- `src/app/globals.css` - Complete CSS system with all variables
- `src/components/ui/` - All component source code

**All components are production-ready and deployed to Railway!** 🎉
