import { PerplexityService } from './perplexity-service'
import crypto from 'crypto';
import { extractKeywords, calculateMatchScore } from './utils';
import { logAIUsage } from './observability'

// Instantiate with a safe fallback so build doesn't fail when OPENAI_API_KEY is not set.
// At runtime, provide a real key via env; calls will fail if the placeholder is used.
// Lazily handle missing API key to avoid build-time failures. At runtime, callers
// should gracefully handle null client or catch errors and provide fallbacks.
const OPENAI_KEYS: string[] = (process.env.OPENAI_API_KEYS || process.env.OPENAI_API_KEY || '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean)
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || undefined

function createOpenAIClient(_apiKey: string): any {
  // disabled after Perplexity migration
  return null
}

// Retained default client for backward-compat reads, but do not use directly for calls
const openai: any = null;

// OpenAI assistant IDs deprecated after Perplexity migration
const ASSISTANT_JOB_ANALYSIS_ID = undefined as unknown as string | undefined;
const ASSISTANT_RESUME_TAILOR_ID = undefined as unknown as string | undefined;
const ASSISTANT_COVER_LETTER_ID = undefined as unknown as string | undefined;
const ASSISTANT_INTERVIEW_PREP_ID = undefined as unknown as string | undefined;
const ASSISTANT_SALARY_COACH_ID = undefined as unknown as string | undefined;
const ASSISTANT_COMPANY_INSIGHTS_ID = undefined as unknown as string | undefined;

// Runtime controls
const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);
const DEMO_MODE = false;
const CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS || 10 * 60 * 1000);

// Simple in-memory cache (ephemeral). Optionally back with Redis if configured.
type CacheEntry = { expiresAt: number; value: any };
const aiCache: Map<string, CacheEntry> = new Map();
let redisClient: any = null
if (process.env.REDIS_URL) {
  try {
    // Lazy import to avoid build-time issues
    const { createClient } = require('redis')
    redisClient = createClient({ url: process.env.REDIS_URL })
    redisClient.on('error', () => {})
    redisClient.connect().catch(()=>{})
  } catch {}
}

async function getCacheFromRedis(key: string): Promise<any | undefined> {
  if (!redisClient) return undefined
  try {
    const raw = await redisClient.get(`ai:${key}`)
    if (!raw) return undefined
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

function getCache(key: string): any | undefined {
  const entry = aiCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    aiCache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCache(key: string, value: any) {
  aiCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  if (redisClient) {
    redisClient.setEx(`ai:${key}`, Math.floor(CACHE_TTL_MS/1000), JSON.stringify(value)).catch(()=>{})
  }
}

function makeKey(prefix: string, payload: string) {
  return `${prefix}:${crypto.createHash('sha256').update(payload).digest('hex')}`;
}

function isInvalidKeyError(error: any): boolean {
  const msg = (error?.message || '').toString().toLowerCase()
  return msg.includes('incorrect api key') || msg.includes('invalid_api_key') || msg.includes('api key')
}

function isQuotaOrKeyError(error: any): boolean {
  const code = (error && (error.code || error.status))
  const msg = (error?.message || '').toString().toLowerCase()
  return code === 'insufficient_quota' || code === 429 || msg.includes('quota') || isInvalidKeyError(error)
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer!));
}

async function runWithOpenAI<T>(call: (client: any) => Promise<T>): Promise<T> {
  if (!OPENAI_KEYS.length) throw new Error('OPENAI_API_KEY missing')
  let lastErr: any
  for (let i = 0; i < OPENAI_KEYS.length; i++) {
    const key = OPENAI_KEYS[i]
    const client = createOpenAIClient(key)
    // simple retry for transient 429 rate_limit (not insufficient_quota)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await call(client)
      } catch (e: any) {
        lastErr = e
        const msg = (e?.message || '').toString().toLowerCase()
        const code = e?.code || e?.status
        const quota = code === 'insufficient_quota' || code === 429 && msg.includes('quota') || msg.includes('insufficient_quota')
        const rate = code === 429 && !quota
        if (quota) break // try next key
        if (rate && attempt === 0) { await new Promise(r=>setTimeout(r, 600)); continue }
        break
      }
    }
  }
  throw lastErr || new Error('OpenAI call failed')
}

async function chatCreate(args: any): Promise<any> {
  // Route all generic chat calls through Perplexity for consistency
  const ppx = new PerplexityService()
  const messages = Array.isArray(args?.messages) ? args.messages : []
  const systemMsg = (messages.find((m: any) => m && m.role === 'system')?.content || '').toString()
  const userMsg = messages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant'))
    .map((m: any) => (m.content || '').toString())
    .join('\n\n')
    .trim()
  const maxTokens = typeof args?.max_tokens === 'number' ? args.max_tokens : 1200
  const temperature = typeof args?.temperature === 'number' ? args.temperature : 0.3

  const result = await withTimeout(ppx.makeRequest(systemMsg, userMsg, { maxTokens, temperature }), AI_TIMEOUT_MS)
  const content = (result as any)?.content || ''
  // Return an OpenAI-like shape so existing callers remain unchanged
  return { choices: [{ message: { content } }] }
}

// AI Prompts for different operations
export const AI_PROMPTS = {
  RESUME_TAILORING: `You are a senior resume strategist. Rewrite ONLY using details from the Original Resume. Do not invent employers, dates, titles, or achievements.

Follow 2025 best practices (recruiter eye-tracking + ATS):
- Single-column, reverse-chronological, left-aligned for F-pattern scanning
- Section order: Contact, Professional Summary (2–3 lines), Core Competencies (8–12 keywords), Professional Experience, Education, Certifications
- Use bullets with: Action Verb + Specific Task + Quantified Result + Timeframe
 - Bullets must use professional bullet characters (•) with proper spacing, not hyphens (-) or asterisks (*)
- Naturally weave relevant keywords without stuffing; vary sentence length; avoid generic AI phrasing
- No graphics/tables/headers/footers/placeholders; plain text output only
- Do NOT copy sentences from Job Description; use it only to prioritize content from the Original Resume
- Never insert the target company name unless already present in the Original Resume

Target Context:
{jobDescription}

Original Resume (single source of truth):
{resumeText}

Return a polished, human-sounding resume as plain text.`,

  JOB_ANALYSIS: `Analyze this job description and extract key information. Provide a structured analysis in JSON format.

Job Description: {jobDescription}

Please respond with a JSON object containing:
{
  "jobTitle": "extracted or provided job title",
  "companyName": "extracted or provided company name",
  "keyRequirements": ["list of 5-8 most important requirements"],
  "preferredSkills": ["list of 5-8 preferred technical skills"],
  "responsibilities": ["list of 4-6 main job responsibilities"],
  "companyCulture": ["list of 3-5 inferred company culture aspects"],
  "salaryRange": "estimated salary range if mentioned, otherwise null",
  "experienceLevel": "entry/mid/senior level based on requirements",
  "educationRequirements": ["required degrees or certifications"],
  "remoteWorkPolicy": "remote/hybrid/onsite/on-site"
}

Focus on technical skills, experience requirements, and cultural indicators.`,


  COMPANY_INSIGHTS: `Based on this company research data, generate personalized insights for a job application:

Company Data: {companyData}
Job Title: {jobTitle}
Industry: {industry}

Generate 3-5 key talking points that demonstrate knowledge of the company and genuine interest in their mission, values, and culture. Make these points specific and reference actual company information.`,

  FOLLOW_UP_EMAIL: `Create a professional follow-up email for a job application that:
- References specific aspects of our previous interaction
- Includes relevant company research insights
- Maintains professional tone while sounding human (vary sentence starts, keep it short)
- Includes a clear call-to-action and offers value (additional info, availability)

Context:
- Applied for: {jobTitle}
- Company: {companyName}
- Days since application: {daysSinceApplication}
- Application highlights: {applicationHighlights}
- Company insights: {companyInsights}

Return strictly with a first line "Subject: ..." then the email body on subsequent lines. Keep the email concise (80-140 words), specific, and polite.`,

  RESUME_IMPROVEMENT_SUGGESTIONS: `Analyze this resume and provide specific improvement suggestions for the given job description:

Job Description: {jobDescription}
Resume: {resumeText}

Provide 5-7 specific, actionable suggestions to improve the resume's effectiveness for this specific role. Focus on:
- Keyword optimization
- Achievement quantification
- Skills alignment
- Experience relevance
- ATS compatibility`
,
  SUCCESS_SCORE: `You are an expert recruiter. Score the probability of success for this application (0-100).

Return JSON strictly in this shape:
{
  "score": number,                      // 0-100
  "reasons": string[3-6],              // why this score
  "riskFactors": string[2-5],          // risks to address
  "improvements": string[3-6]          // concrete actions to raise score
}

Consider:
- Job match (keywords, seniority, responsibilities)
- Resume alignment and quantified impact
- Company culture fit (if provided)
- Signal quality (job source, clarity)
- Any red flags

Job Description:\n{jobDescription}\n\nResume:\n{resumeText}\n\nCompany Data (optional):\n{companyData}`
};

export interface JobAnalysisResult {
  jobTitle: string;
  companyName: string;
  keyRequirements: string[];
  preferredSkills: string[];
  responsibilities: string[];
  companyCulture: string[];
  salaryRange?: string;
  experienceLevel: string;
  educationRequirements: string[];
  remoteWorkPolicy: string;
}

export interface ResumeCustomizationResult {
  customizedResume: string;
  matchScore: number;
  improvements: string[];
  suggestions: string[];
}

export interface CoverLetterResult {
  coverLetter: string;
  keyPoints: string[];
  wordCount: number;
}

export interface SalaryNegotiationPlan {
  targetRange: { base: string; totalComp: string };
  justifications: string[];
  tradeoffs: string[];
  negotiationEmail: { subject: string; body: string };
  talkingPoints: string[];
}

export interface CompanyInsightsResult {
  talkingPoints: string[];
  keyValues: string[];
  cultureFit: string[];
}

export class AIService {
  static async atsScore(resumeText: string, jobAnalysisOrDescription: any, system: 'generic'|'workday'|'greenhouse'|'lever'|'taleo'|'icims' = 'generic'): Promise<{ score: number; matchedKeywords: string[]; missingKeywords: string[]; keywordDensity: Record<string, number>; suggestions: string[] }> {
    try {
      // Reuse existing ATS endpoint logic by making an internal call path if available
      const analysis = typeof jobAnalysisOrDescription === 'string' ? await this.analyzeJobDescription(jobAnalysisOrDescription) : jobAnalysisOrDescription
      // Quick local scoring mirroring /api/insights/ats/score
      const tokenize = (t: string) => (t || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').split(/\s+/).filter(Boolean)
      const tokens = tokenize(resumeText)
      const tokenSet = new Set(tokens)
      const targets: string[] = [
        ...((analysis?.analysis?.keyRequirements) || analysis?.keyRequirements || []),
        ...((analysis?.analysis?.preferredSkills) || analysis?.preferredSkills || []),
        ...(analysis?.keywords || [])
      ].map((s: string) => (s || '').toLowerCase()).filter(Boolean)
      const expanded = Array.from(new Set(targets.flatMap((t) => t.split(/[,;•\-]/).map(p => p.trim()).filter(p => p.length > 1))))
      const matched: string[] = []
      const missing: string[] = []
      const density: Record<string, number> = {}
      for (const kw of expanded) {
        const parts = kw.split(/\s+/)
        const present = parts.every(p => tokenSet.has(p))
        if (present) matched.push(kw); else missing.push(kw)
        const first = parts[0]
        density[kw] = tokens.filter(t => t === first).length / Math.max(tokens.length, 1)
      }
      const coverage = matched.length / Math.max(expanded.length || 1, 1)
      const lengthPenalty = Math.min(0.15, Math.max(0, (tokens.length - 1200) / 6000))
      const repetitionPenalty = Math.min(0.15, matched.length ? 0 : 0.1)
      let score = Math.round(Math.max(0, Math.min(100, (coverage * 100) * 0.7 + 30 * (1 - lengthPenalty - repetitionPenalty))))
      // Small ATS system weight adjustments (placeholder heuristics)
      if (system === 'workday') score = Math.max(0, Math.min(100, score + 2))
      if (system === 'lever') score = Math.max(0, Math.min(100, score + 1))
      const suggestions: string[] = []
      if (coverage < 0.8) suggestions.push('Add missing high-value keywords naturally in bullets')
      if (lengthPenalty > 0.1) suggestions.push('Trim low-impact content to improve ATS parsing')
      if (matched.length < 5) suggestions.push('Front-load quantified achievements that match role must-haves')
      return { score, matchedKeywords: matched.slice(0, 50), missingKeywords: missing.slice(0, 50), keywordDensity: density, suggestions }
    } catch {
      return { score: 0, matchedKeywords: [], missingKeywords: [], keywordDensity: {}, suggestions: [] }
    }
  }
  // Helpers to post-process AI outputs
  private static stripMarkdown(input: string): string {
    let out = input
    // Remove bold/italic markers
    out = out.replace(/\*\*(.*?)\*\*/g, '$1')
    out = out.replace(/\*(.*?)\*/g, '$1')
    out = out.replace(/__(.*?)__/g, '$1')
    out = out.replace(/_(.*?)_/g, '$1')
    // Remove headings like ###, ***, etc.
    out = out.replace(/^\s*#{1,6}\s+/gm, '')
    out = out.replace(/^\s*-\s*\[.?\]\s*/gm, '')
    return out
  }
  private static normalizeBullets(input: string): string {
    const lines = input.split(/\r?\n/)
    const out = lines.map(l => {
      const t = l.trimStart()
      if (/^[*-]\s+/.test(t) || /^[–—-]\s+/.test(t)) return '• ' + t.replace(/^([*–—-])\s+/, '')
      // bullets like "•" already
      return l
    })
    return out.join('\n')
  }
  private static tidyWhitespace(input: string): string {
    // Collapse >2 blank lines to just 2, trim trailing spaces
    return input.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim()
  }
  // Bridge assistant tool calls to our REST endpoints and local model helpers
  private static async handleAssistantToolCalls(threadId: string, run: any, context?: any): Promise<Array<{ tool_call_id: string; output: string }>> {
    const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || []
    const outputs: Array<{ tool_call_id: string; output: string }> = []
    for (const tc of toolCalls) {
      const name = tc.function?.name as string
      let args: any = {}
      try { args = JSON.parse(tc.function?.arguments || '{}') } catch { args = {} }
      try {
        // 1) Built-in tools we already support
        if (name === 'analyze_job_description') {
          const jd = typeof args.jobDescription === 'string' && args.jobDescription.trim().length > 0 ? args.jobDescription : (context?.jobDescription || '')
          const result = await this.analyzeJobDescriptionWithModel(jd)
          outputs.push({ tool_call_id: tc.id, output: JSON.stringify(result) })
          continue
        }
        if (name === 'tailor_resume') {
          const rd = typeof args.resumeText === 'string' && args.resumeText.trim().length > 0 ? args.resumeText : (context?.resumeText || '')
          const jd = typeof args.jobDescription === 'string' && args.jobDescription.trim().length > 0 ? args.jobDescription : (context?.jobDescription || '')
          const tone = (context?.tone || 'professional') as 'professional' | 'enthusiastic' | 'concise'
          const result = await this.customizeResumeWithModel(rd, jd, undefined, undefined, tone)
          outputs.push({ tool_call_id: tc.id, output: result.customizedResume })
          continue
        }
        if (name === 'generate_cover_letter') {
          const title = typeof args.jobTitle === 'string' ? args.jobTitle : (context?.jobTitle || '')
          const company = typeof args.companyName === 'string' ? args.companyName : (context?.companyName || '')
          const jd = typeof args.jobDescription === 'string' ? args.jobDescription : (context?.jobDescription || '')
          const rt = typeof args.resumeText === 'string' ? args.resumeText : (context?.resumeText || '')
          const cdRaw = typeof args.companyData === 'string' ? args.companyData : (context?.companyData || '')
          const tone = (args.tone || context?.tone || 'professional') as 'professional' | 'casual' | 'enthusiastic'
          const length = (args.length || context?.length || 'medium') as 'short' | 'medium' | 'long'
          const result = await this.generateCoverLetter(title, company, jd, rt, cdRaw ? { raw: cdRaw } : undefined, tone, length)
          outputs.push({ tool_call_id: tc.id, output: result.coverLetter })
          continue
        }
        if (name === 'generate_negotiation_plan') {
          const merged = {
            jobTitle: args.jobTitle || context?.jobTitle,
            companyName: args.companyName || context?.companyName,
            location: args.location || context?.location || '',
            seniority: args.seniority || context?.seniority || 'mid',
            offer: args.offer || context?.offer || { base: 'TBD' },
            marketData: args.marketData || context?.marketData,
            candidateHighlights: args.candidateHighlights || context?.candidateHighlights || '',
            constraints: args.constraints || context?.constraints,
            tone: args.tone || context?.tone || 'professional'
          }
          const plan = await this.generateSalaryNegotiationPlanWithModel(merged as any)
          outputs.push({ tool_call_id: tc.id, output: JSON.stringify(plan) })
          continue
        }

        // 2) Company OSINT tools -> our REST endpoints
        if (name === 'scrape_linkedin_company' || name === 'identify_hiring_contacts' || name === 'scrape_glassdoor_insights') {
          const payload = { companyName: args.companyName, jobTitle: args.roleType || args.jobTitle, location: args.location }
          const res = await fetch('/api/v2/company/deep-research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          const json = await res.json()
          if (name === 'identify_hiring_contacts') {
            const contacts = (json.companyData?.hiringContacts || json.research?.keyContacts || [])
            outputs.push({ tool_call_id: tc.id, output: JSON.stringify(contacts) })
          } else if (name === 'scrape_glassdoor_insights') {
            const out = {
              glassdoorRating: json.companyData?.glassdoorRating ?? null,
              glassdoorReviews: json.companyData?.glassdoorReviews ?? null,
              culture: json.companyData?.culture ?? [],
              benefits: json.companyData?.benefits ?? []
            }
            outputs.push({ tool_call_id: tc.id, output: JSON.stringify(out) })
          } else {
            outputs.push({ tool_call_id: tc.id, output: JSON.stringify(json.companyData || json.research || {}) })
          }
          continue
        }
        if (name === 'analyze_company_financials') {
          const res = await fetch('/api/v2/company/financials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: args.companyName }) })
          const json = await res.json()
          outputs.push({ tool_call_id: tc.id, output: JSON.stringify(json.financials || {}) })
          continue
        }
        if (name === 'scrape_company_news') {
          const res = await fetch('/api/v2/company/google-intel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: args.companyName }) })
          const json = await res.json()
          outputs.push({ tool_call_id: tc.id, output: JSON.stringify(json.intel?.news || []) })
          continue
        }
        if (name === 'research_interviewer_profiles') {
          const res = await fetch('/api/v2/interviewers/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names: args.interviewerNames || [], companyName: args.companyName }) })
          const json = await res.json()
          outputs.push({ tool_call_id: tc.id, output: JSON.stringify(json.profiles || []) })
          continue
        }

        // Unknown tool: return empty
        outputs.push({ tool_call_id: tc.id, output: '{}' })
      } catch {
        outputs.push({ tool_call_id: tc.id, output: '{}' })
      }
    }
    return outputs
  }
  static async generateText(prompt: string): Promise<string> {
    // Minimal helper for quick text generations where assistants are not required
    const completion = await chatCreate({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You write concise outputs. If JSON requested, return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 800,
    })
    return completion.choices[0]?.message?.content?.trim() || ''
  }
  static async analyzeJobDescription(jobDescription: string): Promise<JobAnalysisResult> {
    try {
      // Perplexity-only: always use model path
      return await this.analyzeJobDescriptionWithModel(jobDescription);
    } catch (err: any) {
      // Fallback to heuristic/minimal result on quota or invalid/missing API key
      if (DEMO_MODE || isQuotaOrKeyError(err)) {
        return {
          jobTitle: 'Unknown Position',
          companyName: 'Unknown Company',
          keyRequirements: extractKeywords(jobDescription).slice(0, 6),
          preferredSkills: [],
          responsibilities: [],
          companyCulture: ['Collaborative', 'Ownership', 'Customer-first'],
          experienceLevel: 'mid',
          educationRequirements: [],
          remoteWorkPolicy: 'hybrid',
          salaryRange: undefined,
        }
      }
      throw err
    }
  }

  static async generateInterviewCoach(
    jobTitle: string,
    seniority: 'entry' | 'mid' | 'senior',
    resumeHighlights: string,
    companyData?: any,
    focusAreas?: string[],
    numBehavioral?: number,
    numTechnical?: number
  ): Promise<{ behavioralQuestions: string[]; technicalQuestions: string[]; starGuidance: string[]; companySpecificAngles: string[] }> {
    if (DEMO_MODE) {
      return {
        behavioralQuestions: [
          'Tell me about a time you led a project.',
          'Describe a conflict you resolved on your team.'
        ],
        technicalQuestions: [
          'Design a rate limiter for an API.',
          'Explain database indexing and query optimization.'
        ],
        starGuidance: ['State context in 1-2 lines', 'Quantify impact', 'Tie to role'],
        companySpecificAngles: ['Connect achievements to product goals', 'Show ownership and bias for action']
      }
    }
    const system = 'You are an interview coach. Return strict JSON: {behavioralQuestions[], technicalQuestions[], starGuidance[], companySpecificAngles[]}'
    const user = `Generate interview prep for ${jobTitle} (${seniority}).\nFocus areas: ${(focusAreas||[]).join(', ')}\nResume:\n${resumeHighlights}\nCompany:\n${companyData ? JSON.stringify(companyData, null, 2) : 'N/A'}\nCounts: behavioral=${numBehavioral||6}, technical=${numTechnical||6}`
    const text = await this.generateText(`${system}\n\n${user}`)
    try {
      const parsed = JSON.parse(text)
      return {
        behavioralQuestions: Array.isArray(parsed.behavioralQuestions) ? parsed.behavioralQuestions : [],
        technicalQuestions: Array.isArray(parsed.technicalQuestions) ? parsed.technicalQuestions : [],
        starGuidance: Array.isArray(parsed.starGuidance) ? parsed.starGuidance : [],
        companySpecificAngles: Array.isArray(parsed.companySpecificAngles) ? parsed.companySpecificAngles : [],
      }
    } catch {
      return { behavioralQuestions: [], technicalQuestions: [], starGuidance: [], companySpecificAngles: [] }
    }
  }

  private static async analyzeJobDescriptionWithModel(jobDescription: string): Promise<JobAnalysisResult> {
    if (DEMO_MODE) {
      return {
        jobTitle: 'Software Engineer',
        companyName: 'Acme Inc',
        keyRequirements: ['JavaScript', 'React', 'Node.js', 'APIs', 'Testing'],
        preferredSkills: ['TypeScript', 'CI/CD', 'Cloud'],
        responsibilities: ['Build features', 'Write tests', 'Code reviews'],
        companyCulture: ['Collaborative', 'Ownership', 'Customer-first'],
        experienceLevel: 'mid',
        educationRequirements: ['BS CS or equivalent experience'],
        remoteWorkPolicy: 'hybrid',
        salaryRange: '120k-150k',
      };
    }

    const cacheKey = makeKey('job-analysis', jobDescription);
    const cached = getCache(cacheKey);
    if (cached) return cached as JobAnalysisResult;
    const rcached = await getCacheFromRedis(cacheKey)
    if (rcached) return rcached as JobAnalysisResult
    try {
      const prompt = AI_PROMPTS.JOB_ANALYSIS.replace('{jobDescription}', jobDescription);

      const completion: any = await chatCreate({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a senior HR professional and job market expert. Analyze job descriptions with deep understanding of industry requirements and company culture.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      let analysisText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('job-analysis', undefined, completion)
      if (!analysisText) {
        throw new Error('Failed to get analysis from OpenAI');
      }

      // Strip markdown fences if present
      if (/^```/m.test(analysisText)) {
        const match = analysisText.match(/```[a-zA-Z]*\n([\s\S]*?)\n```/)
        if (match && match[1]) analysisText = match[1].trim()
      }

      let analysis: JobAnalysisResult;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', analysisText);
        analysis = {
          jobTitle: 'Unknown Position',
          companyName: 'Unknown Company',
          keyRequirements: extractKeywords(jobDescription).slice(0, 5),
          preferredSkills: [],
          responsibilities: [],
          companyCulture: [],
          experienceLevel: 'mid',
          educationRequirements: [],
          remoteWorkPolicy: 'hybrid',
        };
      }

      setCache(cacheKey, analysis);
      return analysis;
    } catch (error: any) {
      console.error('Job analysis error:', error);
      if (DEMO_MODE || isInvalidKeyError(error)) {
        return {
          jobTitle: 'Unknown Position',
          companyName: 'Unknown Company',
          keyRequirements: extractKeywords(jobDescription).slice(0, 6),
          preferredSkills: [],
          responsibilities: [],
          companyCulture: ['Collaborative', 'Ownership', 'Customer-first'],
          experienceLevel: 'mid',
          educationRequirements: [],
          remoteWorkPolicy: 'hybrid',
          salaryRange: undefined,
        }
      }
      throw new Error('Failed to analyze job description');
    }
  }

  private static async analyzeJobDescriptionWithAssistant(jobDescription: string): Promise<JobAnalysisResult> {
    if (!ASSISTANT_JOB_ANALYSIS_ID) {
      return this.analyzeJobDescriptionWithModel(jobDescription);
    }

    // Create a thread and add the user's job description
    const thread = await openai.beta.threads.create({});
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: jobDescription,
    });

    // Start a run for the assistant
    let run: any = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_JOB_ANALYSIS_ID as string,
    });

    // Poll for tool calls or completion
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

        const toolOutputs = await Promise.all(
          toolCalls.map(async (toolCall: any) => {
            try {
              const fn = toolCall.function;
              if (fn?.name === 'analyze_job_description') {
                const args = JSON.parse(fn.arguments || '{}');
                const jd = typeof args.jobDescription === 'string' ? args.jobDescription : jobDescription;
                const result = await this.analyzeJobDescriptionWithModel(jd);
                return { tool_call_id: toolCall.id, output: JSON.stringify(result) };
              }
              // Unknown tool: return empty object
              return { tool_call_id: toolCall.id, output: '{}' };
            } catch (e) {
              return { tool_call_id: toolCall.id, output: '{}' };
            }
          })
        );

        run = await openai.beta.threads.runs.submitToolOutputs(
          thread.id,
          run.id,
          { tool_outputs: toolOutputs }
        );
        // Continue loop after submitting outputs
        continue;
      }

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const last = messages.data.find((m: any) => m.role === 'assistant');
        const content = last?.content?.[0];
        const text = (content && 'text' in content) ? content.text.value : undefined;
        if (!text) {
          // If the assistant responded via tool only, return model result
          return this.analyzeJobDescriptionWithModel(jobDescription);
        }
        try {
          return JSON.parse(text) as JobAnalysisResult;
        } catch {
          return this.analyzeJobDescriptionWithModel(jobDescription);
        }
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        return this.analyzeJobDescriptionWithModel(jobDescription);
      }

      await new Promise((r) => setTimeout(r, 600));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
  }

  static async customizeResume(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    companyName: string,
    tone: 'professional' | 'enthusiastic' | 'concise' = 'professional',
    length: 'same' | 'shorter' | 'longer' = 'same',
    psychology?: any,
    companyData?: any
  ): Promise<ResumeCustomizationResult> {
    if (ASSISTANT_RESUME_TAILOR_ID) {
      try {
        return await this.customizeResumeWithAssistant(resumeText, jobDescription, jobTitle, companyName, tone, length);
      } catch (e) {
        // Fallback to model path on any assistant error
        return this.customizeResumeWithModel(resumeText, jobDescription);
      }
    }
    return this.customizeResumeWithModel(resumeText, jobDescription, psychology, companyData, tone);
  }

  private static async customizeResumeWithModel(
    resumeText: string,
    jobDescription: string,
    psychology?: any,
    companyData?: any,
    tone: 'professional' | 'enthusiastic' | 'concise' = 'professional'
  ): Promise<ResumeCustomizationResult> {
    if (DEMO_MODE) {
      const customized = `Summary: Experienced engineer aligned to role.\n\n${resumeText}`;
      return {
        customizedResume: customized,
        matchScore: 75,
        improvements: ['Keywords aligned', 'Achievements quantified'],
        suggestions: ['Tighten summary', 'Reorder skills'],
      };
    }
    const cacheKey = makeKey('resume-tailor', JSON.stringify({ resumeText, jobDescription, tone, psychology: !!psychology, companyData: !!companyData }));
    const cached = getCache(cacheKey);
    if (cached) return cached as ResumeCustomizationResult;
    const rcached = await getCacheFromRedis(cacheKey)
    if (rcached) return rcached as ResumeCustomizationResult
    try {
      const toneLine = `Preferred tone: ${tone}.`;
      const psychLine = psychology ? `
Psychology guidance (tone, formality, values): ${JSON.stringify(psychology).slice(0, 1000)}
` : ''
      const companyLine = companyData ? `
Company insights (use for relevance, not fabrication): ${JSON.stringify(companyData).slice(0, 1200)}
` : ''
      const atsLine = companyData && (companyData as any).atsTarget ? `
ATS system target: ${(companyData as any).atsTarget}. Optimization level: ${(companyData as any).optimizationLevel || 'moderate'}.
Use standard section headers; no tables/columns; ensure keyword coverage without stuffing.
` : ''
      const industryLine = (companyData && ((companyData as any).industryFocus || (companyData as any).experienceLevel)) ? `
Industry focus: ${((companyData as any).industryFocus || '').toString().slice(0,60)}. Candidate seniority: ${((companyData as any).experienceLevel || '').toString()}.
` : ''
      const style = (companyData && (companyData as any).styleProfile) ? `\nUser writing fingerprint (tone, vocabulary, cadence): ${JSON.stringify((companyData as any).styleProfile).slice(0, 800)}\n` : ''
      const years = (companyData && typeof (companyData as any).yearsExperience === 'number') ? (companyData as any).yearsExperience : undefined
      const yearsLine = years && years > 0 ? `\nCandidate tenure: ${years}+ years total related experience. Reflect this accurately in the Professional Summary and Experience sections.\n` : ''
      const prompt = AI_PROMPTS.RESUME_TAILORING
        .replace('{jobDescription}', jobDescription + '\n' + toneLine + psychLine + companyLine + atsLine + industryLine + style + yearsLine)
        .replace('{resumeText}', resumeText);

      const completion = await chatCreate({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and professional resume writer. Customize resumes to perfectly match job requirements while maintaining authenticity and ATS optimization.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1400,
      });

      const customizedText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('resume-tailor', undefined, completion)
      if (!customizedText) {
        throw new Error('Failed to get customized resume from OpenAI');
      }

      // Optional humanization step to reduce AI-detectable patterns
      let humanized = customizedText
      try {
        const wantsHumanize = !!(companyData && (companyData as any).antiAIDetection)
        if (wantsHumanize && humanized) {
          const hPrompt = `Rewrite the following resume to sound more human and less AI-generated while preserving all facts, employers, dates, and achievements. Vary sentence lengths, reduce template phrasing, and increase specificity without inventing anything. Keep plain text only.\n\n${humanized}`
          const h: any = await chatCreate({
            model: DEFAULT_MODEL,
            messages: [
              { role: 'system', content: 'You rewrite text to be more human and less AI-detectable without changing facts.' },
              { role: 'user', content: hPrompt }
            ],
            temperature: 0.4,
            max_tokens: 500,
          })
          const hv = h.choices[0]?.message?.content?.trim()
          if (hv && hv.length > 100) humanized = hv
        }
      } catch { /* non-fatal */ }

      // Normalize formatting (remove markdown, enforce professional bullets, tidy whitespace)
      humanized = this.tidyWhitespace(this.normalizeBullets(this.stripMarkdown(humanized || '')))

      // Guard against job description leakage by reducing score impact if JD phrases appear verbatim
      const jdPhrases = (jobDescription || '').split(/[^a-zA-Z0-9]+/).filter(w => w.length > 6).slice(0, 30)
      const jdLeak = jdPhrases.some(p => (humanized || '').includes(p))
      const matchScoreRaw = calculateMatchScore(humanized || '', jobDescription);
      const matchScore = jdLeak ? Math.max(0, Math.round(matchScoreRaw * 0.8)) : matchScoreRaw;
      const suggestions = await this.getResumeImprovementSuggestions(resumeText, jobDescription);

      const result = {
        customizedResume: humanized || '',
        matchScore,
        improvements: [
          'Keywords optimized for ATS',
          'Achievements aligned with job requirements',
          'Professional summary tailored to role',
          'Skills section prioritized for relevance'
        ],
        suggestions
      };
      setCache(cacheKey, result);
      return result;
    } catch (error: any) {
      console.error('Resume customization error:', error);
      if (DEMO_MODE || isInvalidKeyError(error)) {
        const customized = `Summary: Experienced candidate aligned to role.\n\n${resumeText}`
        return {
          customizedResume: customized,
          matchScore: calculateMatchScore(customized, jobDescription),
          improvements: ['Keywords aligned', 'Achievements quantified'],
          suggestions: ['Tighten summary', 'Reorder skills'],
        }
      }
      throw new Error('Failed to customize resume');
    }
  }

  private static async customizeResumeWithAssistant(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    companyName: string,
    tone: 'professional' | 'enthusiastic' | 'concise',
    length: 'same' | 'shorter' | 'longer'
  ): Promise<ResumeCustomizationResult> {
    if (!ASSISTANT_RESUME_TAILOR_ID) {
      return this.customizeResumeWithModel(resumeText, jobDescription);
    }

    // Create a thread and provide structured content
    const thread = await openai.beta.threads.create({});
    const userContent = `TASK: Rewrite the resume to align with the job.

Job Title: ${jobTitle}
Company: ${companyName}
Tone: ${tone}
Length: ${length}

JOB DESCRIPTION:\n${jobDescription}\n
RESUME:\n${resumeText}`;
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userContent + "\n\nReturn the final tailored resume as plain text (not JSON).",
    });

    // Start assistant run
    let run: any = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_RESUME_TAILOR_ID as string,
      response_format: { type: 'text' } as any,
    });

    // Handle tool calls and poll until completion
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
        const tool_outputs = await this.handleAssistantToolCalls(thread.id, run, { resumeText, jobDescription, tone })
        run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs })
        continue;
      }

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const last = messages.data.find((m: any) => m.role === 'assistant');
        const content = last?.content?.[0];
        const text = (content && 'text' in content) ? content.text.value : undefined;
        let customizedResume = text && text.trim().length > 0 ? text.trim() : (await this.customizeResumeWithModel(resumeText, jobDescription)).customizedResume;
        // Normalize formatting
        customizedResume = this.tidyWhitespace(this.normalizeBullets(this.stripMarkdown(customizedResume)))
        const matchScore = calculateMatchScore(customizedResume, jobDescription);
        const suggestions = await this.getResumeImprovementSuggestions(resumeText, jobDescription);
        return {
          customizedResume,
          matchScore,
          improvements: [
            'Keywords optimized for ATS',
            'Achievements aligned with job requirements',
            'Professional summary tailored to role',
            'Skills section prioritized for relevance'
          ],
          suggestions,
        };
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        return this.customizeResumeWithModel(resumeText, jobDescription);
      }

      await new Promise((r) => setTimeout(r, 600));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
  }

  // DEPRECATED: Use /api/cover-letter/generate with templates instead
  // Kept for backward compatibility with assistant tool calls
  static async generateCoverLetter(
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    companyData?: any,
    tone: 'professional' | 'casual' | 'enthusiastic' = 'professional',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<CoverLetterResult> {
    // Redirect to main API route which uses templates
    const response = await fetch('/api/cover-letter/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw: true,
        jobTitle,
        companyName,
        jobDescription,
        resumeText,
        save: false,
        tone,
        length
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate cover letter')
    }
    
    const result = await response.json()
    return {
      coverLetter: result.coverLetter || '',
      keyPoints: result.keyPoints || [],
      wordCount: result.wordCount || 0
    }
  }

  static async generateFollowUpEmail(
    jobTitle: string,
    companyName: string,
    daysSinceApplication: number,
    applicationHighlights: string[],
    companyInsights: string[]
  ): Promise<{ subject: string; body: string }> {
    try {
      const prompt = AI_PROMPTS.FOLLOW_UP_EMAIL
        .replace('{jobTitle}', jobTitle)
        .replace('{companyName}', companyName)
        .replace('{daysSinceApplication}', daysSinceApplication.toString())
        .replace('{applicationHighlights}', applicationHighlights.join(', '))
        .replace('{companyInsights}', companyInsights.join(', '));

      const completion: any = await chatCreate({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career counselor specializing in job application follow-up communication. Create polite, professional follow-up emails that maintain relationships and show continued interest.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 500,
      });

      const emailContent = completion.choices[0]?.message?.content?.trim();
      logAIUsage('follow-up-email', undefined, completion)
      if (!emailContent) {
        throw new Error('Failed to generate follow-up email from OpenAI');
      }

      // Parse subject and body
      const lines = emailContent.split('\n');
      const subjectLine = lines.find((line: string) => line.toLowerCase().startsWith('subject:'));
      const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '') : `Follow-up on ${jobTitle} Position`;
      const body = lines.filter((line: string) => !line.toLowerCase().startsWith('subject:')).join('\n').trim();

      return {
        subject,
        body
      };
    } catch (error) {
      console.error('Follow-up email generation error:', error);
      throw new Error('Failed to generate follow-up email');
    }
  }

  static async getResumeImprovementSuggestions(
    resumeText: string,
    jobDescription: string
  ): Promise<string[]> {
    try {
      const prompt = AI_PROMPTS.RESUME_IMPROVEMENT_SUGGESTIONS
        .replace('{jobDescription}', jobDescription)
        .replace('{resumeText}', resumeText);

      const completion: any = await chatCreate({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume reviewer and career coach. Provide specific, actionable suggestions to improve resumes for specific job applications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800,
      });

      const suggestionsText = completion.choices[0]?.message?.content?.trim();
      if (!suggestionsText) {
        return [];
      }

      // Parse suggestions (assuming they're numbered or bulleted)
      const suggestions = suggestionsText
        .split(/\d+\.|\n-|\n•/)
        .filter((suggestion: string) => suggestion.trim().length > 10)
        .map((suggestion: string) => suggestion.trim())
        .slice(0, 7);

      return suggestions;
    } catch (error) {
      console.error('Resume improvement suggestions error:', error);
      return [];
    }
  }

  static async extractKeyPointsFromCoverLetter(coverLetter: string): Promise<string[]> {
    try {
      const prompt = `Analyze this cover letter and extract 3-5 key points that make it effective:

${coverLetter}

Respond with a JSON array of key points (strings).`;

      const completion = await chatCreate({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Extract key strengths and highlights from cover letters. Respond only with a JSON array of strings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const keyPointsText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('cover-letter-keypoints', undefined, completion)
      if (!keyPointsText) {
        return [];
      }

      try {
        return JSON.parse(keyPointsText);
      } catch {
        // Fallback: extract manually
        return [
          'Personalized introduction showing genuine interest',
          'Relevant experience and achievements highlighted',
          'Company research integrated naturally',
          'Strong call to action in closing'
        ];
      }
    } catch (error) {
      console.error('Key points extraction error:', error);
      return [];
    }
  }

  static async generateCompanyInsights(
    companyData: any,
    jobTitle: string
  ): Promise<CompanyInsightsResult> {
    // Perplexity-only: skip assistant path
    try {
      const companyDataString = JSON.stringify(companyData, null, 2);
      const prompt = AI_PROMPTS.COMPANY_INSIGHTS
        .replace('{companyData}', companyDataString)
        .replace('{jobTitle}', jobTitle)
        .replace('{industry}', companyData.industry || 'technology');

      const completion = await chatCreate({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert company insights summarizer.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const insightsText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('company-insights', undefined, completion)
      if (!insightsText) {
        throw new Error('Failed to generate company insights');
      }

      // Parse the response (assuming it's structured)
      const talkingPoints = insightsText
        .split(/\d+\.|\n-|\n•/)
        .filter((point: string) => point.trim().length > 10)
        .map((point: string) => point.trim())
        .slice(0, 5);

      return {
        talkingPoints,
        keyValues: companyData.culture || [],
        cultureFit: talkingPoints.slice(0, 3)
      };
    } catch (error) {
      console.error('Company insights generation error:', error);
      return {
        talkingPoints: [],
        keyValues: [],
        cultureFit: []
      };
    }
  }

  static async scoreApplication(
    jobDescription: string,
    resumeText: string,
    companyData?: any
  ): Promise<{ score: number; reasons: string[]; riskFactors: string[]; improvements: string[] }> {
    const cacheKey = makeKey('success-score', JSON.stringify({ jobDescription, resumeText, companyData }))
    const cached = getCache(cacheKey)
    if (cached) return cached
    const rcached = await getCacheFromRedis(cacheKey)
    if (rcached) return rcached

    const prompt = AI_PROMPTS.SUCCESS_SCORE
      .replace('{jobDescription}', jobDescription)
      .replace('{resumeText}', resumeText)
      .replace('{companyData}', companyData ? JSON.stringify(companyData, null, 2) : 'N/A')

    const completion: any = await chatCreate({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You evaluate job application success probability and output strict JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.25,
      max_tokens: 1200,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '{}'
    logAIUsage('success-score', undefined, completion)
    let parsed: any = { score: 0, reasons: [], riskFactors: [], improvements: [] }
    try { parsed = JSON.parse(text) } catch {}
    const result = {
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0,
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : []
    }
    setCache(cacheKey, result)
    return result
  }

  static async generateSalaryNegotiationPlan(input: {
    jobTitle: string;
    companyName: string;
    location: string;
    seniority: 'entry' | 'mid' | 'senior';
    offer: { base: string; bonus?: string; equity?: string; benefits?: string };
    marketData?: string;
    candidateHighlights: string;
    constraints?: string;
    tone?: 'professional' | 'warm' | 'concise';
  }): Promise<SalaryNegotiationPlan> {
    if (DEMO_MODE) {
      return {
        targetRange: { base: '$175k-$190k', totalComp: '$270k-$310k' },
        justifications: [
          'Senior market in Austin trends toward upper bands',
          'Led cost reductions of 18% with measurable impact',
          'Owned 10M msg/day pipeline — high complexity',
          'Hybrid role warrants premium vs remote-only'
        ],
        tradeoffs: [
          'Prioritize base over equity',
          'Concede minor signing bonus deltas',
          'Flexible start date within 4-6 weeks'
        ],
        negotiationEmail: {
          subject: 'Compensation Discussion – Senior Backend Engineer',
          body: `Hi <Name>,

Thank you for the offer. Based on Austin market norms for senior roles and my impact (e.g., 18% infra savings; 10M msg/day pipeline), I'm targeting a base of $180k-$190k with total comp in the $280k-$300k range. I value the opportunity and am flexible on equity/bonus to reach this base.

If helpful, happy to discuss details.

Best,
<Your Name>`
        },
        talkingPoints: [
          'Anchor to Austin senior market bands',
          'Quantify prior impact and scope',
          'State clear base target and rationale',
          'Offer flexibility on secondary levers'
        ]
      };
    }

    // Perplexity-only: skip assistant path
    return this.generateSalaryNegotiationPlanWithModel(input);
  }

  private static async generateSalaryNegotiationPlanWithModel(input: {
    jobTitle: string;
    companyName: string;
    location: string;
    seniority: 'entry' | 'mid' | 'senior';
    offer: { base: string; bonus?: string; equity?: string; benefits?: string };
    marketData?: string;
    candidateHighlights: string;
    constraints?: string;
    tone?: 'professional' | 'warm' | 'concise';
  }): Promise<SalaryNegotiationPlan> {
    const system = 'You are a salary negotiation coach. Output strictly JSON with the requested keys.';
    const user = `Given the role and offer, produce a JSON plan with keys: targetRange, justifications, tradeoffs, negotiationEmail {subject, body}, talkingPoints.\n\nInput:\njobTitle: ${input.jobTitle}\ncompanyName: ${input.companyName}\nlocation: ${input.location}\nseniority: ${input.seniority}\noffer: ${JSON.stringify(input.offer)}\nmarketData: ${input.marketData || ''}\ncandidateHighlights: ${input.candidateHighlights}\nconstraints: ${input.constraints || ''}\ntone: ${input.tone || 'professional'}`;
    const completion: any = await chatCreate({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.3,
      max_tokens: 1100,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('No negotiation plan generated');
    try {
      return JSON.parse(text);
    } catch (e) {
      // Best-effort fallback minimal plan
      return {
        targetRange: { base: input.offer.base || 'TBD', totalComp: 'TBD' },
        justifications: ['Market alignment', 'Role scope', 'Prior impact', 'Location norms'],
        tradeoffs: ['Flex equity/bonus', 'Firm on base'],
        negotiationEmail: { subject: `Compensation Discussion – ${input.jobTitle}`, body: text },
        talkingPoints: ['Anchor to market', 'Quantify impact', 'Set clear target']
      };
    }
  }

  private static async generateSalaryNegotiationPlanWithAssistant(input: {
    jobTitle: string;
    companyName: string;
    location: string;
    seniority: 'entry' | 'mid' | 'senior';
    offer: { base: string; bonus?: string; equity?: string; benefits?: string };
    marketData?: string;
    candidateHighlights: string;
    constraints?: string;
    tone?: 'professional' | 'warm' | 'concise';
  }): Promise<SalaryNegotiationPlan> {
    const thread = await openai.beta.threads.create({});
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Generate a negotiation plan as JSON for ${input.jobTitle} at ${input.companyName} (${input.location}). Seniority: ${input.seniority}. Offer: ${JSON.stringify(input.offer)}. Market: ${input.marketData || 'n/a'}. Highlights: ${input.candidateHighlights}. Constraints: ${input.constraints || 'n/a'}. Tone: ${input.tone || 'professional'}.`,
    });
    let run: any = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_SALARY_COACH_ID as string,
    });
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await Promise.all(toolCalls.map(async (tc: any) => {
          const fn = tc.function;
          if (fn?.name === 'generate_negotiation_plan') {
            const args = JSON.parse(fn.arguments || '{}');
            // Prefer assistant-parsed args if present
            const merged = {
              jobTitle: args.jobTitle || input.jobTitle,
              companyName: args.companyName || input.companyName,
              location: args.location || input.location,
              seniority: args.seniority || input.seniority,
              offer: args.offer || input.offer,
              marketData: args.marketData || input.marketData,
              candidateHighlights: args.candidateHighlights || input.candidateHighlights,
              constraints: args.constraints || input.constraints,
              tone: args.tone || input.tone,
            } as typeof input;
            const result = await this.generateSalaryNegotiationPlanWithModel(merged);
            return { tool_call_id: tc.id, output: JSON.stringify(result) };
          }
          return { tool_call_id: tc.id, output: '{}' };
        }));
        run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs: toolOutputs });
        continue;
      }
      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const last = messages.data.find((m: any) => m.role === 'assistant');
        const content = last?.content?.[0];
        const text = (content && 'text' in content) ? (content as any).text.value : undefined;
        if (text) {
          try {
            return JSON.parse(text) as SalaryNegotiationPlan;
          } catch {
            return this.generateSalaryNegotiationPlanWithModel(input);
          }
        }
        return this.generateSalaryNegotiationPlanWithModel(input);
      }
      if (['failed','cancelled','expired'].includes(run.status)) {
        return this.generateSalaryNegotiationPlanWithModel(input);
      }
      await new Promise(r => setTimeout(r, 600));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
  }

  static async employerPsychologyProfile(input: { jobDescription: string; companySignals?: any }): Promise<{ tone: 'formal'|'neutral'|'casual'; formality: number; values: string[]; languageGuidance: string[]; bestSendWindows: string[] }> {
    const content = `Analyze job and company signals to infer a communication psychology profile.
Return JSON strictly with keys: tone: "formal|neutral|casual", formality: 0-100, values: string[3-6], languageGuidance: string[2-4], bestSendWindows: string[2-4].
Job Description:\n${input.jobDescription}\n\nCompany Signals (optional):\n${input.companySignals ? JSON.stringify(input.companySignals) : 'N/A'}`
    try {
      const text = await this.generateText(content)
      return JSON.parse(text)
    } catch {
      return { tone: 'neutral', formality: 50, values: [], languageGuidance: [], bestSendWindows: [] }
    }
  }

  static async marketIntelligence(companyName: string, role?: string, geo?: string): Promise<{
    financial: Array<{ title: string; url: string; snippet: string }>
    culture: Array<{ title: string; url: string; snippet: string }>
    news: Array<{ title: string; url: string; snippet: string }>
    leadership: Array<{ title: string; url: string; snippet: string }>
    growth: Array<{ title: string; url: string; snippet: string }>
    benefits: Array<{ title: string; url: string; snippet: string }>
    summary: string
  }> {
    try {
      const payload = {
        companyName,
        role: role || '',
        geo: geo || ''
      }
      const summary = await this.generateText(`You are a market analyst. Given a company name and optional role and geo, summarize actionable market intelligence in 4-7 concise bullets (no headers). Focus on: hiring momentum, competitive positioning, culture signals, product direction, and candidate positioning angles.
Return plain text bullets.

Company: ${companyName}
Role: ${role || 'n/a'}
Geo: ${geo || 'n/a'}`)
      return {
        financial: [],
        culture: [],
        news: [],
        leadership: [],
        growth: [],
        benefits: [],
        summary
      }
    } catch {
      return { financial: [], culture: [], news: [], leadership: [], growth: [], benefits: [], summary: '' }
    }
  }

  static async successPredictorV2(input: { jobDescription: string; resumeText: string; jobUrl?: string; applicantsEstimate?: number; urgencyHint?: number; companyData?: any }): Promise<{
    score: number; reasons: string[]; riskFactors: string[]; improvements: string[]; timing?: any; competition?: any
  }> {
    try {
      const base = await this.scoreApplication(input.jobDescription, input.resumeText, input.companyData)
      // Lightweight signals: competition and timing via internal endpoints
      let competition: any = null
      let timing: any = null
      const baseUrl = process.env.NEXTAUTH_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      try {
        const compRes = await fetch(`${baseUrl}/api/insights/competition`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobDescription: input.jobDescription, jobUrl: input.jobUrl, resumeText: input.resumeText }) } as any)
        if (compRes.ok) { const cj = await compRes.json(); competition = cj.competition }
      } catch {}
      try {
        const timRes = await fetch(`${baseUrl}/api/insights/timing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urgency: input.urgencyHint, jobTitle: '', companyName: '', location: '' }) } as any)
        if (timRes.ok) { const tj = await timRes.json(); timing = tj.timing }
      } catch {}
      let score = base.score
      if (competition?.competitionBand === 'high') score = Math.max(0, score - 8)
      if (competition?.competitionBand === 'low') score = Math.min(100, score + 4)
      if (timing?.score) score = Math.round((score * 0.85) + (timing.score * 0.15))
      return { score, reasons: base.reasons, riskFactors: base.riskFactors, improvements: base.improvements, timing, competition }
    } catch {
      return { score: 0, reasons: [], riskFactors: [], improvements: [] }
    }
  }

  static async careerTrajectoryPredictor(input: { resumeText: string; targetRole: string; targetIndustry?: string; geo?: string }): Promise<{
    steps: string[]; skillsToAcquire: string[]; timelineMonths: number; sampleProjects: string[]; networkingPlan: string[]
  }> {
    try {
      const prompt = `You are a career coach. Given a resume (plain text) and a target role (${input.targetRole}), produce a concise JSON plan with keys:
steps: string[5-9], skillsToAcquire: string[6-12], timelineMonths: number (6-36), sampleProjects: string[3-6], networkingPlan: string[4-8].
Context:
Industry: ${input.targetIndustry || 'n/a'}
Geo: ${input.geo || 'n/a'}
Resume:\n${input.resumeText}`
      const text = await this.generateText(prompt)
      const parsed = JSON.parse(text)
      return {
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        skillsToAcquire: Array.isArray(parsed.skillsToAcquire) ? parsed.skillsToAcquire : [],
        timelineMonths: typeof parsed.timelineMonths === 'number' ? parsed.timelineMonths : 12,
        sampleProjects: Array.isArray(parsed.sampleProjects) ? parsed.sampleProjects : [],
        networkingPlan: Array.isArray(parsed.networkingPlan) ? parsed.networkingPlan : []
      }
    } catch {
      return { steps: [], skillsToAcquire: [], timelineMonths: 12, sampleProjects: [], networkingPlan: [] }
    }
  }

  static async emotionalCareerCoach(messages: Array<{ role: 'user'|'system'|'assistant'; content: string }>, context?: { stressors?: string[]; wins?: string[]; targetRole?: string }): Promise<{ reflection: string; encouragement: string[]; reframes: string[]; nextSmallSteps: string[] }> {
    try {
      const convo = (messages || []).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
      const prompt = `You are a compassionate career coach. Provide supportive, practical guidance with short, concrete suggestions.
Return strict JSON with keys: reflection (string), encouragement (string[3-6]), reframes (string[3-6]), nextSmallSteps (string[3-6]).
Context: ${JSON.stringify(context || {})}
Conversation:\n${convo}`
      const text = await this.generateText(prompt)
      const parsed = JSON.parse(text)
      return {
        reflection: String(parsed.reflection || ''),
        encouragement: Array.isArray(parsed.encouragement) ? parsed.encouragement : [],
        reframes: Array.isArray(parsed.reframes) ? parsed.reframes : [],
        nextSmallSteps: Array.isArray(parsed.nextSmallSteps) ? parsed.nextSmallSteps : []
      }
    } catch {
      return { reflection: '', encouragement: [], reframes: [], nextSmallSteps: [] }
    }
  }
}

