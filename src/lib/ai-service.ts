import OpenAI from 'openai';
import crypto from 'crypto';
import { extractKeywords, calculateMatchScore } from './utils';
import { logAIUsage } from './observability'

// Instantiate with a safe fallback so build doesn't fail when OPENAI_API_KEY is not set.
// At runtime, provide a real key via env; calls will fail if the placeholder is used.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'build-placeholder',
});

const ASSISTANT_JOB_ANALYSIS_ID = process.env.OPENAI_ASSISTANT_JOB_ANALYSIS;
const ASSISTANT_RESUME_TAILOR_ID = process.env.OPENAI_ASSISTANT_RESUME_TAILOR;
const ASSISTANT_COVER_LETTER_ID = process.env.OPENAI_ASSISTANT_COVER_LETTER;
const ASSISTANT_INTERVIEW_PREP_ID = process.env.OPENAI_ASSISTANT_INTERVIEW_PREP;
const ASSISTANT_SALARY_COACH_ID = process.env.OPENAI_ASSISTANT_SALARY_COACH;
const ASSISTANT_COMPANY_INSIGHTS_ID = process.env.OPENAI_ASSISTANT_COMPANY_INSIGHTS;

// Runtime controls
const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);
const NO_OPENAI = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'build-placeholder';
const DEMO_MODE = NO_OPENAI || String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true';
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer!));
}

// AI Prompts for different operations
export const AI_PROMPTS = {
  RESUME_TAILORING: `Analyze this job description and customize the provided resume to highlight relevant skills and experiences. Focus on:

1. Matching keywords naturally throughout the resume
2. Rewriting bullet points to emphasize relevant achievements
3. Adjusting the professional summary to align with the role
4. Ensuring ATS compatibility

Job Description: {jobDescription}

Original Resume:
{resumeText}

Provide the updated resume maintaining the candidate's authentic voice while optimizing for this specific role. Keep the same overall structure and length.`,

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

  COVER_LETTER_GENERATION: `Create a professional cover letter using the following information:

Job Details:
- Position: {jobTitle}
- Company: {companyName}
- Job Description: {jobDescription}

Candidate Background:
{resumeText}

{companyData}

Requirements:
- Tone: {tone} (professional, casual, enthusiastic)
- Length: {length} (short: 200-300 words, medium: 300-400 words, long: 400-500 words)
- Include specific company insights and demonstrate genuine interest
- Highlight 2-3 key achievements that match the job requirements
- Reference company values or recent developments if available

Structure the cover letter professionally with:
1. Strong opening paragraph introducing yourself and the position
2. Body paragraphs highlighting relevant experience and achievements
3. Closing paragraph expressing enthusiasm and call to action

Use the candidate's actual experience and achievements from their resume.`,

  COMPANY_INSIGHTS: `Based on this company research data, generate personalized insights for a job application:

Company Data: {companyData}
Job Title: {jobTitle}
Industry: {industry}

Generate 3-5 key talking points that demonstrate knowledge of the company and genuine interest in their mission, values, and culture. Make these points specific and reference actual company information.`,

  FOLLOW_UP_EMAIL: `Create a professional follow-up email for a job application that:
- References specific aspects of our previous interaction
- Includes relevant company research insights
- Maintains professional tone while showing continued interest
- Includes a clear call-to-action

Context:
- Applied for: {jobTitle}
- Company: {companyName}
- Days since application: {daysSinceApplication}
- Application highlights: {applicationHighlights}
- Company insights: {companyInsights}

Keep the email concise (100-150 words) and professional.`,

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
  static async analyzeJobDescription(jobDescription: string): Promise<JobAnalysisResult> {
    try {
      if (ASSISTANT_JOB_ANALYSIS_ID) {
        return await this.analyzeJobDescriptionWithAssistant(jobDescription);
      }
      return await this.analyzeJobDescriptionWithModel(jobDescription);
    } catch (err: any) {
      // Fallback to heuristic result on invalid/missing API key or when demo mode is enabled
      if (DEMO_MODE || isInvalidKeyError(err)) {
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
    if (!ASSISTANT_INTERVIEW_PREP_ID) {
      // Simple fallback without assistant
      return {
        behavioralQuestions: [
          'Tell me about yourself',
          'Tell me about a challenging project and what you learned'
        ],
        technicalQuestions: ['Discuss a system you designed end-to-end'],
        starGuidance: ['Situation, Task, Action, Result'],
        companySpecificAngles: ['Align answers to company values']
      }
    }

    const companyInfo = companyData ? JSON.stringify(companyData, null, 2) : '';
    const payload = {
      jobTitle,
      seniority,
      resumeHighlights,
      companyData: companyInfo,
      focusAreas: focusAreas || [],
      numBehavioral: numBehavioral || 6,
      numTechnical: numTechnical || 6,
    };
    const thread = await openai.beta.threads.create({});
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `Generate interview prep as JSON for: ${jobTitle} (${seniority}).\nResume:\n${resumeHighlights}\nCompany:\n${companyInfo}`,
    });
    let run: any = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_INTERVIEW_PREP_ID as string,
      tools: [
        { type: 'function', function: { name: 'generate_interview_prep', description: 'Generate tailored interview prep', parameters: (payload as any) } }
      ] as any
    });
    while (true) {
      if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
        const tool_outputs = run.required_action.submit_tool_outputs.tool_calls.map((tc: any) => ({ tool_call_id: tc.id, output: JSON.stringify(payload) }));
        run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs });
        continue;
      }
      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const last = messages.data.find((m) => m.role === 'assistant');
        const content = last?.content?.[0];
        const text = (content && 'text' in content) ? content.text.value : undefined;
        try {
          const parsed = text ? JSON.parse(text) : {};
          return {
            behavioralQuestions: Array.isArray(parsed.behavioralQuestions) ? parsed.behavioralQuestions : [],
            technicalQuestions: Array.isArray(parsed.technicalQuestions) ? parsed.technicalQuestions : [],
            starGuidance: Array.isArray(parsed.starGuidance) ? parsed.starGuidance : [],
            companySpecificAngles: Array.isArray(parsed.companySpecificAngles) ? parsed.companySpecificAngles : [],
          };
        } catch {
          return {
            behavioralQuestions: [], technicalQuestions: [], starGuidance: [], companySpecificAngles: []
          }
        }
      }
      if (['failed','cancelled','expired'].includes(run.status)) {
        return { behavioralQuestions: [], technicalQuestions: [], starGuidance: [], companySpecificAngles: [] };
      }
      await new Promise(r=>setTimeout(r, 600));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
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

      const completion = await withTimeout(openai.chat.completions.create({
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
      }), AI_TIMEOUT_MS);

      const analysisText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('job-analysis', undefined, completion)
      if (!analysisText) {
        throw new Error('Failed to get analysis from OpenAI');
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
        const last = messages.data.find((m) => m.role === 'assistant');
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
    length: 'same' | 'shorter' | 'longer' = 'same'
  ): Promise<ResumeCustomizationResult> {
    if (ASSISTANT_RESUME_TAILOR_ID) {
      return this.customizeResumeWithAssistant(resumeText, jobDescription, jobTitle, companyName, tone, length);
    }
    return this.customizeResumeWithModel(resumeText, jobDescription);
  }

  private static async customizeResumeWithModel(
    resumeText: string,
    jobDescription: string
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
    const cacheKey = makeKey('resume-tailor', JSON.stringify({ resumeText, jobDescription }));
    const cached = getCache(cacheKey);
    if (cached) return cached as ResumeCustomizationResult;
    const rcached = await getCacheFromRedis(cacheKey)
    if (rcached) return rcached as ResumeCustomizationResult
    try {
      const prompt = AI_PROMPTS.RESUME_TAILORING
        .replace('{jobDescription}', jobDescription)
        .replace('{resumeText}', resumeText);

      const completion = await withTimeout(openai.chat.completions.create({
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
        temperature: 0.7,
        max_tokens: 3000,
      }), AI_TIMEOUT_MS);

      const customizedText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('resume-tailor', undefined, completion)
      if (!customizedText) {
        throw new Error('Failed to get customized resume from OpenAI');
      }

      const matchScore = calculateMatchScore(customizedText, jobDescription);
      const suggestions = await this.getResumeImprovementSuggestions(resumeText, jobDescription);

      const result = {
        customizedResume: customizedText,
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
      content: userContent,
    });

    // Start assistant run
    let run: any = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_RESUME_TAILOR_ID as string,
    });

    // Handle tool calls and poll until completion
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await Promise.all(
          toolCalls.map(async (toolCall: any) => {
            try {
              const fn = toolCall.function;
              if (fn?.name === 'tailor_resume') {
                const args = JSON.parse(fn.arguments || '{}');
                const rd = typeof args.resumeText === 'string' ? args.resumeText : resumeText;
                const jd = typeof args.jobDescription === 'string' ? args.jobDescription : jobDescription;
                const result = await this.customizeResumeWithModel(rd, jd);
                return { tool_call_id: toolCall.id, output: result.customizedResume };
              }
              return { tool_call_id: toolCall.id, output: '' };
            } catch {
              return { tool_call_id: toolCall.id, output: '' };
            }
          })
        );

        run = await openai.beta.threads.runs.submitToolOutputs(
          thread.id,
          run.id,
          { tool_outputs: toolOutputs }
        );
        continue;
      }

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const last = messages.data.find((m) => m.role === 'assistant');
        const content = last?.content?.[0];
        const text = (content && 'text' in content) ? content.text.value : undefined;
        const customizedResume = text && text.trim().length > 0 ? text.trim() : (await this.customizeResumeWithModel(resumeText, jobDescription)).customizedResume;
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

  static async generateCoverLetter(
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    companyData?: any,
    tone: 'professional' | 'casual' | 'enthusiastic' = 'professional',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<CoverLetterResult> {
    if (DEMO_MODE) {
      const coverLetter = `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} role at ${companyName}. I bring relevant achievements and alignment to your needs...\n\nSincerely,\nCandidate`;
      return { coverLetter, keyPoints: ['Strong intro', 'Aligned achievements', 'Clear CTA'], wordCount: coverLetter.split(/\s+/).length };
    }
    if (ASSISTANT_COVER_LETTER_ID) {
      return this.generateCoverLetterWithAssistant(
        jobTitle,
        companyName,
        jobDescription,
        resumeText,
        companyData,
        tone,
        length
      );
    }
    try {
      const cacheKey = makeKey('cover-letter', JSON.stringify({ jobTitle, companyName, jobDescription, resumeText, tone, length }))
      const cached = getCache(cacheKey)
      if (cached) return cached as CoverLetterResult
      const rcached = await getCacheFromRedis(cacheKey)
      if (rcached) return rcached as CoverLetterResult
      let companyInfo = '';
      if (companyData) {
        companyInfo = `
Company Research:
- Industry: ${companyData.industry || 'Not available'}
- Size: ${companyData.size || 'Not available'}
- Description: ${companyData.description || 'Not available'}
- Culture: ${companyData.culture?.join(', ') || 'Not available'}
- Recent News: ${companyData.recentNews?.map((news: any) => news.title).join(', ') || 'Not available'}`;
      }

      const prompt = AI_PROMPTS.COVER_LETTER_GENERATION
        .replace('{jobTitle}', jobTitle)
        .replace('{companyName}', companyName)
        .replace('{jobDescription}', jobDescription)
        .replace('{resumeText}', resumeText)
        .replace('{companyData}', companyInfo)
        .replace('{tone}', tone)
        .replace('{length}', length);

      const completion = await withTimeout(openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional career counselor and expert cover letter writer. Create compelling, personalized cover letters that demonstrate genuine interest and highlight relevant qualifications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }), AI_TIMEOUT_MS);

      const coverLetter = completion.choices[0]?.message?.content?.trim();
      logAIUsage('cover-letter', undefined, completion)
      if (!coverLetter) {
        throw new Error('Failed to generate cover letter from OpenAI');
      }

      // Extract key points
      const keyPoints = await this.extractKeyPointsFromCoverLetter(coverLetter);
      const wordCount = coverLetter.split(/\s+/).length;

      const result = {
        coverLetter,
        keyPoints,
        wordCount
      };
      setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Cover letter generation error:', error);
      throw new Error('Failed to generate cover letter');
    }
  }

  private static async generateCoverLetterWithAssistant(
    jobTitle: string,
    companyName: string,
    jobDescription: string,
    resumeText: string,
    companyData?: any,
    tone: 'professional' | 'casual' | 'enthusiastic' = 'professional',
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<CoverLetterResult> {
    if (!ASSISTANT_COVER_LETTER_ID) {
      return this.generateCoverLetter(jobTitle, companyName, jobDescription, resumeText, companyData, tone, length);
    }

    const companyInfo = companyData ? JSON.stringify(companyData, null, 2) : '';
    const userContent = `TASK: Generate a tailored cover letter.\n\nJob Title: ${jobTitle}\nCompany: ${companyName}\nTone: ${tone}\nLength: ${length}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}\n\nCOMPANY DATA:\n${companyInfo}`;

    // Create a thread and add the request
    const thread = await openai.beta.threads.create({});
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: userContent,
    });

    // Start run
    let run: any = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_COVER_LETTER_ID as string,
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
              if (fn?.name === 'generate_cover_letter') {
                const args = JSON.parse(fn.arguments || '{}');
                const title = typeof args.jobTitle === 'string' ? args.jobTitle : jobTitle;
                const company = typeof args.companyName === 'string' ? args.companyName : companyName;
                const jd = typeof args.jobDescription === 'string' ? args.jobDescription : jobDescription;
                const rt = typeof args.resumeText === 'string' ? args.resumeText : resumeText;
                const cd = typeof args.companyData === 'string' ? args.companyData : (companyInfo || '');
                const t = typeof args.tone === 'string' ? args.tone : tone;
                const l = typeof args.length === 'string' ? args.length : length;
                const result = await this.generateCoverLetter(title, company, jd, rt, cd ? { raw: cd } : undefined, t, l);
                return { tool_call_id: toolCall.id, output: result.coverLetter };
              }
              return { tool_call_id: toolCall.id, output: '' };
            } catch {
              return { tool_call_id: toolCall.id, output: '' };
            }
          })
        );

        run = await openai.beta.threads.runs.submitToolOutputs(
          thread.id,
          run.id,
          { tool_outputs: toolOutputs }
        );
        continue;
      }

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const last = messages.data.find((m) => m.role === 'assistant');
        const content = last?.content?.[0];
        const text = (content && 'text' in content) ? content.text.value : undefined;
        const coverLetterText = text && text.trim().length > 0 ? text.trim() : '';
        const keyPoints = await this.extractKeyPointsFromCoverLetter(coverLetterText);
        const wordCount = coverLetterText ? coverLetterText.split(/\s+/).length : 0;
        return {
          coverLetter: coverLetterText,
          keyPoints,
          wordCount,
        };
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        return this.generateCoverLetter(jobTitle, companyName, jobDescription, resumeText, companyData, tone, length);
      }

      await new Promise((r) => setTimeout(r, 600));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
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

      const completion = await openai.chat.completions.create({
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
      const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
      const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '') : `Follow-up on ${jobTitle} Position`;
      const body = lines.filter(line => !line.toLowerCase().startsWith('subject:')).join('\n').trim();

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

      const completion = await openai.chat.completions.create({
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
        .filter(suggestion => suggestion.trim().length > 10)
        .map(suggestion => suggestion.trim())
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

      const completion = await openai.chat.completions.create({
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
    // Assistant-backed path
    if (ASSISTANT_COMPANY_INSIGHTS_ID) {
      const thread = await openai.beta.threads.create({});
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: `Generate tailored company insights as JSON for job title: ${jobTitle}. Company data: ${JSON.stringify(companyData, null, 2)}`,
      });
      let run: any = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_COMPANY_INSIGHTS_ID as string,
      });
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (run.status === 'requires_action' && run.required_action?.submit_tool_outputs?.tool_calls?.length) {
          const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
          const toolOutputs = toolCalls.map((tc: any) => ({ tool_call_id: tc.id, output: JSON.stringify({ jobTitle, companyData }) }));
          run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs: toolOutputs });
          continue;
        }
        if (run.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(thread.id);
          const last = messages.data.find((m) => m.role === 'assistant');
          const content = last?.content?.[0];
          const text = (content && 'text' in content) ? (content as any).text.value : undefined;
          if (text) {
            try {
              const parsed = JSON.parse(text);
              return {
                talkingPoints: Array.isArray(parsed.talkingPoints) ? parsed.talkingPoints : [],
                keyValues: Array.isArray(parsed.keyValues) ? parsed.keyValues : (companyData?.culture || []),
                cultureFit: Array.isArray(parsed.cultureFit) ? parsed.cultureFit : [],
              };
            } catch {/* fallthrough */}
          }
          break;
        }
        if ([ 'failed','cancelled','expired' ].includes(run.status)) break;
        await new Promise(r=>setTimeout(r,600));
        run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }
    }
    try {
      const companyDataString = JSON.stringify(companyData, null, 2);
      const prompt = AI_PROMPTS.COMPANY_INSIGHTS
        .replace('{companyData}', companyDataString)
        .replace('{jobTitle}', jobTitle)
        .replace('{industry}', companyData.industry || 'technology');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a career strategist specializing in company research and culture analysis. Generate insights that help candidates demonstrate genuine interest and cultural fit.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 600,
      });

      const insightsText = completion.choices[0]?.message?.content?.trim();
      logAIUsage('company-insights', undefined, completion)
      if (!insightsText) {
        throw new Error('Failed to generate company insights');
      }

      // Parse the response (assuming it's structured)
      const talkingPoints = insightsText
        .split(/\d+\.|\n-|\n•/)
        .filter(point => point.trim().length > 10)
        .map(point => point.trim())
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

    const completion = await withTimeout(openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You evaluate job application success probability and output strict JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 600
    }), AI_TIMEOUT_MS)

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
          body: 'Hi <Name>,\n\nThank you for the offer. Based on Austin market norms for senior roles and my impact (e.g., 18% infra savings; 10M msg/day pipeline), I’m targeting a base of $180k-$190k with total comp in the $280k-$300k range. I value the opportunity and am flexible on equity/bonus to reach this base.\n\nIf helpful, happy to discuss details.\n\nBest,\n<Your Name>'
        },
        talkingPoints: [
          'Anchor to Austin senior market bands',
          'Quantify prior impact and scope',
          'State clear base target and rationale',
          'Offer flexibility on secondary levers'
        ]
      };
    }

    if (ASSISTANT_SALARY_COACH_ID) {
      return this.generateSalaryNegotiationPlanWithAssistant(input);
    }
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
    const completion = await withTimeout(openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.6,
      max_tokens: 1200,
    }), AI_TIMEOUT_MS);
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
        const last = messages.data.find((m) => m.role === 'assistant');
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
}

