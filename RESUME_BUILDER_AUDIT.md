# Resume Builder Feature Audit

## 🔍 What EXISTS:

### ✅ **1. Resume Upload Component**
- **File**: `src/components/resume-upload/index.tsx`
- **Features**:
  - Drag & drop PDF/DOCX upload
  - LinkedIn import button
  - File validation
  - Progress tracking
  - Autopilot flow (background job search)
- **Status**: EXISTS but needs testing

### ✅ **2. Resume Upload API**
- **File**: `src/app/api/resume/upload/route.ts`
- **Features**:
  - PDF text extraction (3 methods + AI fallback)
  - DOCX support
  - Text cleaning
  - Database storage
- **Status**: EXISTS and comprehensive

### ✅ **3. LinkedIn Scraping API**
- **File**: `src/app/api/resume/scrape-linkedin/route.ts`
- **Features**:
  - Scrapes public LinkedIn profiles (no OAuth!)
  - Uses Perplexity with web search
  - Extracts: personal info, experience, education, skills, projects
  - Returns structured JSON
- **Status**: EXISTS but may need RapidAPI fallback

### ✅ **4. LinkedIn Import Component**
- **File**: `src/components/linkedin-import.tsx`
- **Features**:
  - OAuth flow (broken - needs API approval)
  - Auto-fetch on sign-in
  - Two modes: structured (resume builder) vs upload (career finder)
- **Status**: EXISTS but OAuth broken

### ✅ **5. Resume Parse API**
- **File**: `src/app/api/resume/parse/route.ts`
- **Features**: Likely parses resume text into structured data
- **Status**: EXISTS (need to verify)

### ✅ **6. Generate Bullets API**
- **File**: `src/app/api/resume/generate-bullets/route.ts`
- **Features**: AI-generated achievement bullets
- **Status**: EXISTS

### ✅ **7. Resume Templates**
- **File**: `src/lib/resume-templates-v2.ts`
- **Features**: 9 templates with HTML/CSS
- **Status**: EXISTS and complete

### ✅ **8. Preview Modal**
- **File**: `src/components/resume-builder/resume-preview-modal.tsx`
- **Features**: Live preview in modal
- **Status**: JUST CREATED

---

## ❌ What's BROKEN:

### **1. LinkedIn OAuth Import**
- **Problem**: Requires LinkedIn API approval (very hard to get)
- **Solution**: Switch to URL scraping (already built!)
- **Fix**: Update UI to use `/api/resume/scrape-linkedin` instead of OAuth

### **2. Resume Upload Flow**
- **Problem**: May not be integrated with Resume Builder
- **Solution**: Connect upload component to builder
- **Fix**: Add upload option to Resume Builder page

### **3. LinkedIn URL Input**
- **Problem**: No UI for pasting LinkedIn URL
- **Solution**: Add input field + button
- **Fix**: Create simple form component

---

## 🚀 What's MISSING:

### **1. Integrated Import UI** (HIGH PRIORITY)
Need a unified component that offers:
```
┌─────────────────────────────────────┐
│  How would you like to start?      │
├─────────────────────────────────────┤
│  🔗 Paste LinkedIn URL             │
│  📄 Upload Resume (PDF/DOCX)       │
│  ✨ Start from Scratch             │
└─────────────────────────────────────┘
```

### **2. RapidAPI LinkedIn Scraper Fallback**
If Perplexity fails, use RapidAPI:
- `linkedin-profile-data.p.rapidapi.com`
- `linkedin-data-api.p.rapidapi.com`

### **3. Resume Builder Integration**
Connect all pieces:
- Import methods → Resume Builder
- Preview button → Modal
- Template selector → Generation

### **4. AI Achievement Generator UI**
- User enters job title + company
- AI generates 5 bullet points
- User selects which to keep

---

## 🔧 IMPLEMENTATION PLAN:

### **Phase 1: Fix LinkedIn Import** (1 hour)
1. Create `<LinkedInUrlInput />` component
2. Connect to `/api/resume/scrape-linkedin`
3. Add RapidAPI fallback
4. Test with real LinkedIn URLs

### **Phase 2: Unified Import Component** (2 hours)
1. Create `<ResumeImportOptions />` component
2. Integrate LinkedIn URL, Upload, Manual options
3. Add to Resume Builder page
4. Test all flows

### **Phase 3: AI Enhancements** (2 hours)
1. Create `<AchievementGenerator />` component
2. Connect to `/api/resume/generate-bullets`
3. Add to experience form
4. Test generation

### **Phase 4: Polish** (1 hour)
1. Add loading states
2. Error handling
3. Success messages
4. Mobile optimization

---

## 📝 DETAILED FIXES:

### **Fix 1: LinkedIn URL Scraper Component**
```typescript
// src/components/resume-builder/linkedin-url-import.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Linkedin } from 'lucide-react'

export function LinkedInUrlImport({ onImport }: { onImport: (data: any) => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!url.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/resume/scrape-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      if (!response.ok) throw new Error('Failed to import')

      const data = await response.json()
      onImport(data.resumeData)
    } catch (err) {
      setError('Failed to import LinkedIn profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Input
        type="url"
        placeholder="https://linkedin.com/in/yourname"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={loading}
      />
      <Button
        onClick={handleImport}
        disabled={loading || !url}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <Linkedin className="w-4 h-4" />
            Import from LinkedIn
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

### **Fix 2: Unified Import Component**
```typescript
// src/components/resume-builder/resume-import-options.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LinkedInUrlImport } from './linkedin-url-import'
import { ResumeUpload } from '@/components/resume-upload'
import { Linkedin, Upload, Sparkles } from 'lucide-react'

export function ResumeImportOptions({ onImport }: { onImport: (data: any) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Let's build your resume in 5 minutes! ✨</CardTitle>
        <CardDescription>
          Choose how you'd like to start - we'll handle the rest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="linkedin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="scratch" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Start Fresh
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linkedin" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Paste your LinkedIn profile URL and we'll extract all your info automatically
            </div>
            <LinkedInUrlImport onImport={onImport} />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload your existing resume (PDF or DOCX) and we'll extract the data
            </div>
            <ResumeUpload
              onUploadSuccess={(resume) => {
                // Parse resume text into structured data
                fetch('/api/resume/parse', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: resume.extractedText })
                }).then(res => res.json()).then(data => onImport(data.resumeData))
              }}
              onUploadError={(error) => console.error(error)}
            />
          </TabsContent>

          <TabsContent value="scratch" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Start with a blank slate - we'll guide you step by step with AI assistance
            </div>
            <Button onClick={() => onImport(null)} className="w-full">
              Start Building
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
```

---

## ✅ SUMMARY:

### **What Works:**
- ✅ Resume upload (PDF/DOCX)
- ✅ LinkedIn scraping API (Perplexity)
- ✅ AI bullet generation
- ✅ 9 resume templates
- ✅ Preview modal

### **What's Broken:**
- ❌ LinkedIn OAuth (needs API approval)
- ❌ No UI for LinkedIn URL input
- ❌ Components not integrated

### **What's Needed:**
1. LinkedIn URL input component
2. Unified import options component
3. Connect to Resume Builder
4. Add RapidAPI fallback
5. Test everything

---

**Next Steps**: Implement the 3 missing components and integrate them into the Resume Builder page.
