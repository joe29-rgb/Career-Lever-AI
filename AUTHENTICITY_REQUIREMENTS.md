# 🔒 AUTHENTICITY REQUIREMENTS - CRITICAL

**Priority**: HIGHEST  
**Impact**: Legal/Ethical Compliance  
**Date Added**: October 8, 2025

---

## ⚠️ **CRITICAL RULE: NO FABRICATION**

Perplexity AI must **NEVER** add false information when:
- Customizing resumes
- Generating cover letters
- Creating job application materials

---

## ✅ **ALLOWED ACTIONS**

### **1. Rearrange Existing Content**
```
ORIGINAL RESUME:
- Education: Bachelor's in Computer Science (2024)
- Skills: JavaScript, React, Python
- Experience: Intern at StartupCo (2023)

ALLOWED CUSTOMIZATION FOR WEB DEV JOB:
- Skills: JavaScript, React [highlighted first]
- Education: Bachelor's in Computer Science, 2024
- Experience: Web Development Intern at StartupCo (2023)
  - Built React applications [if this was in original]
```

### **2. Highlight Relevant Sections**
- **For Entry-Level/Fresh Graduates**: Emphasize education, coursework, academic projects
- **For Students**: Highlight part-time availability, coursework, GPA (if mentioned)
- **For Experienced**: Emphasize relevant work history
- **School Projects**: Include if mentioned in original resume

### **3. Reword for Clarity (Using Original Facts)**
```
ORIGINAL: "Worked on website"
ALLOWED: "Developed web application features" (if context supports)
NOT ALLOWED: "Led team of 5 developers" (if not in original)
```

---

## 🚫 **PROHIBITED ACTIONS**

### **1. Adding Experience Not in Original**
❌ NOT ALLOWED:
- Adding job titles not held
- Adding companies not worked at
- Adding years of experience beyond actual
- Adding technologies never used
- Adding degrees not earned
- Adding certifications not obtained

### **2. Inflating Responsibilities**
❌ NOT ALLOWED:
- "Led team" if was individual contributor
- "Managed budget" if not a manager
- "Increased sales by X%" if no metrics in original
- "Senior" title if was junior

### **3. Fabricating Skills**
❌ NOT ALLOWED:
- Adding programming languages not mentioned
- Adding tools/frameworks never used
- Adding soft skills not demonstrated in original

---

## 📚 **SPECIAL HANDLING: FRESH GRADUATES & STUDENTS**

### **What to Highlight:**
1. **Education First**
   - Degree and major
   - GPA (if 3.0+)
   - Relevant coursework
   - Academic honors/awards
   - Thesis/capstone projects

2. **Academic Projects**
   - School projects using relevant tech
   - Group projects (with role clarification)
   - Hackathons
   - Research projects

3. **Internships & Part-Time Work**
   - Any professional experience (even brief)
   - Volunteer work related to field
   - Freelance projects

4. **Technical Skills**
   - Programming languages from coursework
   - Tools used in school projects
   - Certifications earned

5. **Availability**
   - Part-time availability for students
   - Full-time availability for graduates
   - Start date flexibility

### **Sample Prompt Enhancement for Students:**
```
CANDIDATE PROFILE: Recent graduate / Current student
EDUCATION: [Degree, Year, GPA if mentioned]
RELEVANT COURSEWORK: [If mentioned]
PROJECTS: [School projects if mentioned]

CRITICAL RULES:
1. Emphasize education section prominently
2. Highlight academic projects as "experience"
3. Include coursework if relevant to job
4. Mention part-time availability for students
5. DO NOT add experience not in original resume
6. DO NOT fabricate projects or skills
```

---

## 🔍 **VALIDATION CHECKS**

Before generating any resume or cover letter, AI must verify:

### **Checklist:**
- [ ] Every job title matches original resume
- [ ] Every company name matches original resume
- [ ] Every skill listed was in original resume
- [ ] Every achievement has basis in original content
- [ ] Education details match exactly
- [ ] Years of experience calculated correctly
- [ ] No fabricated metrics or numbers
- [ ] No inflated responsibilities

---

## 📝 **IMPLEMENTATION**

### **1. Resume Customization Prompt Enhancement**

```typescript
// BEFORE (risky):
`Customize this resume for the job`

// AFTER (safe):
`Rearrange and highlight this resume for the job.

CRITICAL AUTHENTICITY RULES:
1. Use ONLY information present in the original resume
2. DO NOT add job titles, companies, skills, or experiences not in original
3. DO NOT fabricate achievements or metrics
4. For fresh graduates: Emphasize education, coursework, and academic projects
5. For students: Highlight part-time availability and school projects
6. You may rearrange sections and reword for clarity using original facts
7. You may highlight relevant portions but not invent new content

ORIGINAL RESUME:
${originalResumeText}

JOB REQUIREMENTS:
${jobDescription}

Customize by:
- Reordering sections to match job priorities
- Highlighting relevant existing experience
- Emphasizing education for entry-level candidates
- Using job description keywords that appear in original resume
- DO NOT add anything not in the original
```

### **2. Cover Letter Prompt Enhancement**

```typescript
// Add to cover letter prompt:
`
AUTHENTICITY REQUIREMENTS:
- Reference ONLY experiences, skills, and achievements from the provided resume
- DO NOT mention projects, jobs, or skills not in the resume
- For fresh graduates: Focus on education, academic projects, eagerness to learn
- For students: Mention part-time availability if relevant
- Be honest about experience level
`
```

### **3. Post-Generation Validation**

```typescript
async function validateAuthenticity(
  originalResume: string,
  customizedContent: string
): Promise<{
  isValid: boolean
  violations: string[]
}> {
  const violations: string[] = []
  
  // Extract entities from original
  const originalSkills = extractSkills(originalResume)
  const originalCompanies = extractCompanies(originalResume)
  const originalTitles = extractJobTitles(originalResume)
  
  // Extract entities from customized
  const customizedSkills = extractSkills(customizedContent)
  const customizedCompanies = extractCompanies(customizedContent)
  const customizedTitles = extractJobTitles(customizedContent)
  
  // Check for fabrications
  for (const skill of customizedSkills) {
    if (!originalSkills.includes(skill)) {
      violations.push(`Fabricated skill: ${skill}`)
    }
  }
  
  for (const company of customizedCompanies) {
    if (!originalCompanies.includes(company)) {
      violations.push(`Fabricated company: ${company}`)
    }
  }
  
  for (const title of customizedTitles) {
    if (!originalTitles.includes(title)) {
      violations.push(`Fabricated job title: ${title}`)
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations
  }
}
```

---

## 🎓 **EXAMPLE: FRESH GRADUATE**

### **Original Resume:**
```
John Smith
Bachelor of Science in Computer Science, University of Toronto (2024)
GPA: 3.7

COURSEWORK:
- Data Structures
- Web Development
- Database Systems

PROJECTS:
- E-commerce Website (React, Node.js)
  Built full-stack web application for class project

SKILLS:
- JavaScript, React, Node.js, Python, SQL
- Git, VS Code

INTERNSHIP:
- Software Development Intern, TechStartup Inc. (Summer 2023)
  - Assisted with front-end development
  - Fixed bugs in React codebase
```

### **✅ GOOD CUSTOMIZATION (For Web Dev Job):**
```
John Smith
Recent Computer Science Graduate | Full-Stack Developer

EDUCATION
Bachelor of Science in Computer Science
University of Toronto, 2024 | GPA: 3.7
Relevant Coursework: Web Development, Database Systems, Data Structures

TECHNICAL SKILLS
Frontend: JavaScript, React
Backend: Node.js, Python
Database: SQL
Tools: Git, VS Code

EXPERIENCE
Software Development Intern | TechStartup Inc.
Summer 2023
• Contributed to front-end development using React
• Resolved bugs and improved code quality in production codebase

PROJECTS
Full-Stack E-Commerce Application
Academic Capstone Project
• Built complete web application using React and Node.js
• Implemented user authentication and product catalog features
```

### **❌ BAD CUSTOMIZATION (Fabrication):**
```
John Smith
Senior Full-Stack Developer | 3+ Years Experience [FABRICATED]

EXPERIENCE
Lead Developer | TechStartup Inc. [INFLATED TITLE]
2023-Present [WRONG DATES]
• Led team of 5 developers [FABRICATED]
• Increased user engagement by 50% [FABRICATED METRIC]
• Architected microservices infrastructure [NOT IN ORIGINAL]

SKILLS
JavaScript, React, Node.js, Python, SQL
Docker, Kubernetes, AWS, Azure [FABRICATED SKILLS]
```

---

## 🚀 **IMPLEMENTATION PRIORITY**

**Status**: CRITICAL - Must implement before any resume customization  
**Estimated Time**: 2 hours  
**Files to Update**:
- `src/lib/prompts/perplexity.ts` (resume customization prompts)
- `src/lib/authenticity.ts` (validation functions)
- `src/app/api/resume/customize/route.ts` (add validation)

**Testing Requirements**:
- Test with fresh graduate resume
- Test with student resume
- Test with experienced professional resume
- Verify no fabrication in any scenario

---

## 📋 **COMPLIANCE**

This requirement ensures:
- ✅ Legal compliance (no false representation)
- ✅ Ethical AI use
- ✅ User trust and credibility
- ✅ Professional integrity
- ✅ Protection against fraud

**Violation of this rule could result in**:
- User rejections from jobs
- Legal issues for users
- Reputation damage to Career Lever AI
- Loss of user trust

---

**PRIORITY: CRITICAL - IMPLEMENT IMMEDIATELY**

