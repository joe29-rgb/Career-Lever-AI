# Perplexity Output Improvement Plan

## 🎯 Current Problem:
Perplexity's output after analyzing resume + research is not well-formatted or actionable.

## 📊 What Perplexity Currently Does:
1. Extracts keywords from user's resume
2. Researches industry trends, skills, companies
3. Returns raw text output

## 🔧 What We Need to Improve:

### **1. Structured Output Format**
Instead of raw text, return JSON with:
```json
{
  "resumeAnalysis": {
    "strengths": ["keyword1", "keyword2"],
    "gaps": ["missing_skill1", "missing_skill2"],
    "atsScore": 85,
    "recommendations": []
  },
  "industryInsights": {
    "trendingSkills": [],
    "salaryRange": { "min": 80000, "max": 120000 },
    "topCompanies": [],
    "growthAreas": []
  },
  "actionableAdvice": {
    "skillsToLearn": [],
    "certificationsToGet": [],
    "resumeImprovements": [],
    "jobSearchStrategy": []
  }
}
```

### **2. Better Prompts**
Current prompt is too generic. Need to:
- Ask for specific format (JSON)
- Request actionable insights
- Include examples of good output
- Specify what NOT to include (fluff, generic advice)

### **3. Post-Processing**
After Perplexity returns data:
- Parse JSON response
- Validate structure
- Format for UI display
- Generate visual charts/graphs
- Create downloadable reports

### **4. UI Presentation**
Display results in:
- **Cards** for each section
- **Progress bars** for ATS score
- **Badges** for skills
- **Charts** for salary data
- **Action items** checklist

---

## 🚀 Implementation Steps:

### **Step 1: Update Perplexity Prompt**
```typescript
const improvedPrompt = `
Analyze this resume and provide a structured JSON response with the following format:

{
  "resumeAnalysis": {
    "strengths": ["list of strong keywords/skills found"],
    "gaps": ["skills missing for target role"],
    "atsScore": <number 0-100>,
    "recommendations": ["specific improvements"]
  },
  "industryInsights": {
    "trendingSkills": ["top 10 in-demand skills for this role"],
    "salaryRange": { "min": <number>, "max": <number>, "currency": "USD" },
    "topCompanies": ["companies hiring for this role"],
    "growthAreas": ["emerging technologies/trends"]
  },
  "actionableAdvice": {
    "skillsToLearn": ["prioritized list with learning resources"],
    "certificationsToGet": ["relevant certifications"],
    "resumeImprovements": ["specific changes to make"],
    "jobSearchStrategy": ["tactical advice"]
  }
}

Resume Content:
${resumeText}

Target Role: ${targetRole}
Industry: ${industry}
Experience Level: ${experienceLevel}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just JSON.
`
```

### **Step 2: Create Parser**
```typescript
interface PerplexityAnalysis {
  resumeAnalysis: {
    strengths: string[]
    gaps: string[]
    atsScore: number
    recommendations: string[]
  }
  industryInsights: {
    trendingSkills: string[]
    salaryRange: { min: number; max: number; currency: string }
    topCompanies: string[]
    growthAreas: string[]
  }
  actionableAdvice: {
    skillsToLearn: Array<{ skill: string; resources: string[] }>
    certificationsToGet: string[]
    resumeImprovements: string[]
    jobSearchStrategy: string[]
  }
}

function parsePerplexityResponse(rawResponse: string): PerplexityAnalysis {
  // Extract JSON from markdown code blocks if present
  const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || 
                    rawResponse.match(/```\n([\s\S]*?)\n```/)
  
  const jsonString = jsonMatch ? jsonMatch[1] : rawResponse
  
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    // Fallback: try to extract data with regex
    return extractDataWithFallback(rawResponse)
  }
}
```

### **Step 3: Create UI Components**
- `<ResumeAnalysisCard />` - Shows strengths, gaps, ATS score
- `<IndustryInsightsCard />` - Trending skills, salary, companies
- `<ActionableAdviceCard />` - Checklist of improvements
- `<SkillGapChart />` - Visual comparison of current vs required skills
- `<SalaryRangeChart />` - Salary distribution graph

### **Step 4: Add Export Options**
- PDF report
- CSV of skills to learn
- Markdown checklist
- Email summary

---

## 📝 Example Improved Output:

### **Before (Current):**
```
Your resume shows experience in JavaScript and React. The industry is moving towards TypeScript and Next.js. Consider learning these technologies. Salaries range from $80k-$120k. Top companies include Google, Meta, Amazon.
```

### **After (Improved):**
```json
{
  "resumeAnalysis": {
    "strengths": [
      "5+ years JavaScript experience",
      "React expertise with hooks",
      "RESTful API development",
      "Agile methodology"
    ],
    "gaps": [
      "TypeScript (required by 78% of postings)",
      "Next.js (requested in 65% of senior roles)",
      "GraphQL (growing 45% YoY)",
      "Docker/Kubernetes (DevOps integration)"
    ],
    "atsScore": 72,
    "recommendations": [
      "Add 'TypeScript' to skills section (appears in 89% of job descriptions)",
      "Quantify React achievements (e.g., 'Improved load time by 40%')",
      "Include GitHub profile link",
      "Add section for open-source contributions"
    ]
  },
  "industryInsights": {
    "trendingSkills": [
      "TypeScript (+89% demand)",
      "Next.js (+76% demand)",
      "GraphQL (+65% demand)",
      "Tailwind CSS (+54% demand)",
      "Vercel/Netlify deployment (+48% demand)"
    ],
    "salaryRange": {
      "min": 95000,
      "max": 145000,
      "currency": "USD",
      "median": 118000,
      "percentile90": 135000
    },
    "topCompanies": [
      "Vercel (20 openings)",
      "Shopify (15 openings)",
      "Netflix (12 openings)",
      "Stripe (10 openings)"
    ],
    "growthAreas": [
      "AI-powered development tools",
      "Edge computing",
      "Web3 integration",
      "Real-time collaboration features"
    ]
  },
  "actionableAdvice": {
    "skillsToLearn": [
      {
        "skill": "TypeScript",
        "priority": "HIGH",
        "timeToLearn": "2-4 weeks",
        "resources": [
          "TypeScript Handbook (free)",
          "Execute Program TypeScript course",
          "Build a TypeScript + React project"
        ]
      },
      {
        "skill": "Next.js",
        "priority": "HIGH",
        "timeToLearn": "3-6 weeks",
        "resources": [
          "Next.js official tutorial",
          "Lee Robinson's Next.js course",
          "Deploy a production Next.js app"
        ]
      }
    ],
    "certificationsToGet": [
      "AWS Certified Developer (increases salary by avg $12k)",
      "Meta Front-End Developer Certificate"
    ],
    "resumeImprovements": [
      "Move skills section above experience",
      "Add metrics to each bullet point",
      "Create a 'Technical Projects' section",
      "Reduce work experience to 10 years max"
    ],
    "jobSearchStrategy": [
      "Apply to Series B-C startups (higher acceptance rate)",
      "Target companies using your stack (React/JS)",
      "Network on Twitter/LinkedIn with hiring managers",
      "Contribute to open-source Next.js projects"
    ]
  }
}
```

---

## 🎯 Success Metrics:
- ✅ Perplexity returns valid JSON 95%+ of the time
- ✅ Users can export analysis as PDF
- ✅ UI displays data in visual, actionable format
- ✅ Response time < 5 seconds
- ✅ Users report insights are "very helpful" (4.5+ stars)

---

## 📅 Implementation Timeline:
1. **Phase 1** (Today): Update Perplexity prompt for JSON output
2. **Phase 2** (Tomorrow): Create parser and fallback logic
3. **Phase 3** (Next): Build UI components for display
4. **Phase 4** (Final): Add export and sharing features

---

**Status**: Ready to implement
**Priority**: HIGH (part of Issue #15)
**Estimated Time**: 4-6 hours
