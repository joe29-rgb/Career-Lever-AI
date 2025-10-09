# 📝 PROMPT SYSTEM ARCHITECTURE
## Dual-Purpose Prompt Strategy - Decision 2

**Decision Date**: October 9, 2025  
**Status**: ✅ Both systems kept - serving different purposes

---

## 🎯 ARCHITECTURE OVERVIEW

After comprehensive analysis, we've decided to **KEEP BOTH** prompt systems as they serve complementary roles:

### **System A: Static Base Prompts** 
📁 `src/lib/prompts/perplexity.ts`

### **System B: Dynamic Context-Aware Prompts**
📁 `src/lib/prompts/perplexity-prompts.ts`

---

## 📋 SYSTEM A: Static Base Prompts (`perplexity.ts`)

### **Purpose**
Provides **foundational system prompts** and **template builders** for core operations.

### **Contains**
- `JOB_ANALYSIS_SYSTEM_PROMPT` - Base job analysis prompt
- `ENHANCED_RESUME_SYSTEM_PROMPT` - Resume optimization with authenticity rules
- `ENHANCED_COVER_LETTER_SYSTEM_PROMPT` - Cover letter generation
- **Builder functions**:
  - `buildEnhancedResumeUserPrompt()` - Dynamic resume prompt construction
  - `buildEnhancedCoverLetterUserPrompt()` - Dynamic cover letter construction

### **Key Features**
- ✅ **Authenticity Rules** - Prevents AI-detection triggers
- ✅ **ATS Optimization** - Ensures 85%+ compatibility
- ✅ **Human Voice** - Natural, varied sentence structures
- ✅ **No Fabrication Rules** - Critical for fresh graduates

### **Usage Pattern**
```typescript
import { 
  ENHANCED_RESUME_SYSTEM_PROMPT, 
  buildEnhancedResumeUserPrompt 
} from './prompts/perplexity'

const systemPrompt = ENHANCED_RESUME_SYSTEM_PROMPT
const userPrompt = buildEnhancedResumeUserPrompt({
  resumeText,
  jobDescription,
  candidate: { fullName, location, linkedin }
})

const result = await perplexity.makeRequest(systemPrompt, userPrompt)
```

### **When to Use**
- Resume optimization
- Cover letter generation  
- Job analysis
- Operations requiring **strict authenticity rules**

---

## 🎯 SYSTEM B: Dynamic Context-Aware Prompts (`perplexity-prompts.ts`)

### **Purpose**
Provides **comprehensive, versioned prompts** for all Perplexity operations with detailed schemas.

### **Contains**
Centralized `PERPLEXITY_PROMPTS` object with:
- `RESUME_ANALYSIS` - v2.0.0 - AI risk, career outlook, market intelligence
- `JOB_SEARCH` - v2.0.0 - Multi-board search with AI analysis
- `COMPANY_RESEARCH` - v2.0.0 - Comprehensive company intelligence
- `HIRING_CONTACTS` - v2.1.0 - Contact discovery with intelligence
- `SALARY_ANALYSIS` - v2.0.0 - Market-based compensation data
- `MARKET_ANALYSIS` - v2.0.0 - Job market intelligence
- `JOB_MATCHING` - v2.0.0 - Resume-to-job matching

### **Key Features**
- ✅ **Version Control** - Each prompt has semantic version
- ✅ **JSON Schemas** - Detailed expected response structures
- ✅ **Template Functions** - Dynamic prompt generation with context
- ✅ **Competitive Features** - AI risk, career outlook, market intelligence

### **Usage Pattern**
```typescript
import { PERPLEXITY_PROMPTS } from './prompts/perplexity-prompts'

const { system, userTemplate } = PERPLEXITY_PROMPTS.HIRING_CONTACTS

const systemPrompt = system
const userPrompt = userTemplate(companyName, industry)

const result = await perplexity.makeRequest(systemPrompt, userPrompt)
```

### **When to Use**
- Job searches
- Company research
- Hiring contact discovery
- Salary analysis
- Market intelligence
- Operations requiring **structured JSON outputs**

---

## 🔄 INTEGRATION PATTERN

### **Hybrid Approach** (Recommended)

Combine both systems for maximum flexibility:

```typescript
import { ENHANCED_RESUME_SYSTEM_PROMPT } from './prompts/perplexity'
import { PERPLEXITY_PROMPTS } from './prompts/perplexity-prompts'

// Example: Resume analysis with authenticity rules
const resumeAnalysis = {
  system: `${ENHANCED_RESUME_SYSTEM_PROMPT}
  
  ${PERPLEXITY_PROMPTS.RESUME_ANALYSIS.system}`,
  
  user: PERPLEXITY_PROMPTS.RESUME_ANALYSIS.userTemplate(resumeText)
}
```

---

## 📊 DECISION MATRIX

| Operation | Primary System | Reason |
|-----------|---------------|---------|
| **Resume Optimization** | System A (`perplexity.ts`) | Needs authenticity rules, ATS focus |
| **Cover Letter** | System A (`perplexity.ts`) | Human voice critical, no fabrication |
| **Job Analysis** | System A (`perplexity.ts`) | Market context awareness |
| **Resume Analysis** | System B (`perplexity-prompts.ts`) | Structured output, AI risk analysis |
| **Job Search** | System B (`perplexity-prompts.ts`) | Multi-board aggregation, JSON output |
| **Company Research** | System B (`perplexity-prompts.ts`) | Comprehensive intelligence, versioned |
| **Hiring Contacts** | System B (`perplexity-prompts.ts`) | Contact intelligence, email discovery |
| **Salary Analysis** | System B (`perplexity-prompts.ts`) | Market data, structured ranges |
| **Market Analysis** | System B (`perplexity-prompts.ts`) | Industry trends, forecasting |

---

## 🚀 BEST PRACTICES

### **1. Version All Prompts**
```typescript
// GOOD: Versioned and documented
export const PERPLEXITY_PROMPTS = {
  RESUME_ANALYSIS: {
    version: '2.0.0',
    purpose: 'Extract comprehensive resume data with AI risk',
    system: '...',
    userTemplate: (text) => '...'
  }
}
```

### **2. Include Response Schemas**
```typescript
// GOOD: Clear expected output structure
userTemplate: (resumeText) => `Return JSON:
{
  "keywords": ["skill1", "skill2"],
  "location": { "city": "Toronto", "province": "Ontario" },
  ...
}`
```

### **3. Separate Concerns**
- **System A** - Authenticity, human voice, ATS optimization
- **System B** - Structured data, versioning, comprehensive schemas

### **4. Use Builder Functions for Dynamic Context**
```typescript
// GOOD: Dynamic context injection
buildEnhancedResumeUserPrompt({
  resumeText,
  jobDescription,
  candidate: { fullName, location }
})
```

---

## 🔧 MAINTENANCE

### **When to Update System A (`perplexity.ts`)**
- ATS compatibility rules change
- AI detection patterns evolve
- Authenticity requirements update
- New formatting standards emerge

### **When to Update System B (`perplexity-prompts.ts`)**
- Add new Perplexity operations
- Update JSON schemas for responses
- Increment prompt versions
- Add new competitive features

### **Version Bumping**
- **MAJOR** (v2.0.0 → v3.0.0): Breaking schema changes
- **MINOR** (v2.0.0 → v2.1.0): New features, backward compatible
- **PATCH** (v2.0.0 → v2.0.1): Bug fixes, clarifications

---

## ✅ DECISION RATIONALE

### **Why Keep Both?**

1. **Different Purposes**
   - System A: Human-centric, authenticity-focused
   - System B: Machine-centric, structured data

2. **Complementary Strengths**
   - System A: Best for user-facing content (resumes, cover letters)
   - System B: Best for data extraction (analysis, research)

3. **Avoid Breaking Changes**
   - Both systems are in production use
   - Migration would be risky and time-consuming

4. **Clear Boundaries**
   - Easy to decide which system to use for each operation
   - No overlap or confusion in practice

### **Alternative Considered (Rejected)**
❌ **Merge into one system** - Would lose the clarity of separation between human-centric and data-centric operations

---

## 📈 FUTURE ENHANCEMENTS

### **Potential Improvements**
- [ ] Add prompt A/B testing framework
- [ ] Implement prompt performance metrics
- [ ] Create prompt versioning dashboard
- [ ] Add automatic schema validation for System B
- [ ] Build prompt optimization tool for System A

---

**Last Updated**: October 9, 2025  
**Next Review**: January 2026 (or when Perplexity API updates)

