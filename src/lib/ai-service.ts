import OpenAI from 'openai';
import { extractKeywords, calculateMatchScore } from './utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_JOB_ANALYSIS_ID = process.env.OPENAI_ASSISTANT_JOB_ANALYSIS;
const ASSISTANT_RESUME_TAILOR_ID = process.env.OPENAI_ASSISTANT_RESUME_TAILOR;
const ASSISTANT_COVER_LETTER_ID = process.env.OPENAI_ASSISTANT_COVER_LETTER;

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

export interface CompanyInsightsResult {
  talkingPoints: string[];
  keyValues: string[];
  cultureFit: string[];
}

export class AIService {
  static async analyzeJobDescription(jobDescription: string): Promise<JobAnalysisResult> {
    if (ASSISTANT_JOB_ANALYSIS_ID) {
      return this.analyzeJobDescriptionWithAssistant(jobDescription);
    }
    return this.analyzeJobDescriptionWithModel(jobDescription);
  }

  private static async analyzeJobDescriptionWithModel(jobDescription: string): Promise<JobAnalysisResult> {
    try {
      const prompt = AI_PROMPTS.JOB_ANALYSIS.replace('{jobDescription}', jobDescription);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
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

      const analysisText = completion.choices[0]?.message?.content?.trim();
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

      return analysis;
    } catch (error) {
      console.error('Job analysis error:', error);
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
    try {
      const prompt = AI_PROMPTS.RESUME_TAILORING
        .replace('{jobDescription}', jobDescription)
        .replace('{resumeText}', resumeText);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
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
      });

      const customizedText = completion.choices[0]?.message?.content?.trim();
      if (!customizedText) {
        throw new Error('Failed to get customized resume from OpenAI');
      }

      const matchScore = calculateMatchScore(customizedText, jobDescription);
      const suggestions = await this.getResumeImprovementSuggestions(resumeText, jobDescription);

      return {
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
    } catch (error) {
      console.error('Resume customization error:', error);
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

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
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
      });

      const coverLetter = completion.choices[0]?.message?.content?.trim();
      if (!coverLetter) {
        throw new Error('Failed to generate cover letter from OpenAI');
      }

      // Extract key points
      const keyPoints = await this.extractKeyPointsFromCoverLetter(coverLetter);
      const wordCount = coverLetter.split(/\s+/).length;

      return {
        coverLetter,
        keyPoints,
        wordCount
      };
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
}

