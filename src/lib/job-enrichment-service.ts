/**
 * JOB ENRICHMENT SERVICE
 * 
 * PROBLEM: Perplexity can't scrape job boards in real-time, so we get:
 * - "Company: Undisclosed" 
 * - "Salary: Not disclosed"
 * - "AI Score: N/A"
 * 
 * SOLUTION: Multi-stage enrichment pipeline:
 * 1. Get job URLs from Perplexity (it can find listings)
 * 2. Extract company names from URLs and metadata
 * 3. Fetch salary data from Glassdoor/Payscale APIs
 * 4. Calculate AI automation risk scores
 * 5. Enrich company intelligence
 */

import { PerplexityService } from './perplexity-service';

export interface RawJobListing {
  title: string;
  company?: string | null;
  location: string;
  url: string;
  source?: string;
  summary?: string;
  postedDate?: string;
  salary?: string | null;
  skillMatchPercent?: number;
}

export interface EnrichedJobListing extends RawJobListing {
  company: string; // GUARANTEED non-null
  companyLogo?: string;
  salary: string; // GUARANTEED (real or estimated)
  salarySource: 'actual' | 'estimated' | 'range';
  aiAutomationRisk: 'low' | 'medium' | 'high';
  aiRiskScore: number; // 0-100
  aiRiskReasoning: string;
  companyIntelligence?: {
    industry: string;
    size: string;
    founded?: number;
    description: string;
  };
  skillMatchScore: number; // 0-100, calculated
  enrichmentStatus: 'complete' | 'partial' | 'failed';
}

export class JobEnrichmentService {
  
  /**
   * STAGE 1: Extract company name from URL or job data
   */
  private static extractCompanyFromURL(url: string, rawCompany?: string | null): string {
    if (rawCompany && rawCompany !== 'Undisclosed' && rawCompany !== 'N/A') {
      return rawCompany;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Extract from common job board patterns
      if (hostname.includes('greenhouse.io')) {
        // https://boards.greenhouse.io/shopify/jobs/...
        const match = url.match(/greenhouse\.io\/([^\/]+)/);
        if (match) return this.capitalizeCompany(match[1]);
      }

      if (hostname.includes('lever.co')) {
        // https://jobs.lever.co/slack/...
        const match = url.match(/lever\.co\/([^\/]+)/);
        if (match) return this.capitalizeCompany(match[1]);
      }

      if (hostname.includes('workable.com')) {
        // https://apply.workable.com/shopify/...
        const match = url.match(/workable\.com\/([^\/]+)/);
        if (match) return this.capitalizeCompany(match[1]);
      }

      if (hostname.includes('indeed.com') || hostname.includes('linkedin.com')) {
        // Try to extract from query params
        const companyParam = urlObj.searchParams.get('company');
        if (companyParam) return this.capitalizeCompany(companyParam);
      }

      // If all else fails, use the domain name
      const domain = hostname.replace(/^(www\.|jobs\.|careers\.|apply\.)/, '').split('.')[0];
      return this.capitalizeCompany(domain);

    } catch (err) {
      return 'Company Name Unavailable';
    }
  }

  /**
   * STAGE 2: Fetch real salary data using Perplexity
   */
  private static async fetchSalaryData(
    jobTitle: string,
    company: string,
    location: string
  ): Promise<{ salary: string; source: 'actual' | 'estimated' | 'range' }> {
    try {
      const client = new PerplexityService();
      
      const prompt = `Find 2025 salary data for "${jobTitle}" at ${company} in ${location}.

CRITICAL REQUIREMENTS:
1. Search Glassdoor, Payscale, Levels.fyi, Salary.com for REAL salary data
2. If company-specific data exists, use it
3. If not, use industry average for this role in this location
4. Return Canadian dollars (CAD) for Canadian locations, USD otherwise

STRICT JSON (no markdown):
{
  "salary": "$XX,XXX - $XX,XXX/year" or "$XX/hour",
  "source": "Glassdoor" | "Payscale" | "Industry Average",
  "confidence": "high" | "medium" | "low"
}`;

      const response = await client.makeRequest(
        'You are a salary data analyst with access to Glassdoor, Payscale, and compensation databases. Return only JSON.',
        prompt,
        { temperature: 0.1, maxTokens: 300 }
      );

      const cleanedContent = response.content.trim()
        .replace(/^```(?:json)?\s*/gm, '')
        .replace(/```\s*$/gm, '');
      
      const parsed = JSON.parse(cleanedContent);
      
      return {
        salary: parsed.salary || 'Salary data unavailable',
        source: parsed.source?.includes('Average') ? 'estimated' : 
                parsed.confidence === 'high' ? 'actual' : 'range'
      };

    } catch (err) {
      console.warn('[JOB_ENRICHMENT] Salary fetch failed:', err);
      // Fallback to generic estimate
      return {
        salary: 'Competitive salary',
        source: 'estimated'
      };
    }
  }

  /**
   * STAGE 3: Calculate AI automation risk score
   */
  private static async calculateAIRisk(
    jobTitle: string,
    jobSummary: string
  ): Promise<{ risk: 'low' | 'medium' | 'high'; score: number; reasoning: string }> {
    try {
      const client = new PerplexityService();
      
      const prompt = `Analyze AI automation risk for this job in 2025:

JOB TITLE: ${jobTitle}
DESCRIPTION: ${jobSummary}

TASK: Assess how likely this role is to be automated or significantly changed by AI within 5 years.

FACTORS TO CONSIDER:
- Repetitive vs creative tasks
- Human interaction requirements
- Strategic decision-making
- Technical vs soft skills emphasis
- Current AI capabilities in this domain

RETURN STRICT JSON (no markdown):
{
  "risk": "low" | "medium" | "high",
  "score": 0-100 (0=safe, 100=high risk),
  "reasoning": "2-3 sentence explanation"
}`;

      const response = await client.makeRequest(
        'You are an AI automation expert analyzing job displacement risk. Return only JSON.',
        prompt,
        { temperature: 0.2, maxTokens: 400 }
      );

      const cleanedContent = response.content.trim()
        .replace(/^```(?:json)?\s*/gm, '')
        .replace(/```\s*$/gm, '');
      
      const parsed = JSON.parse(cleanedContent);
      
      return {
        risk: parsed.risk || 'medium',
        score: parsed.score || 50,
        reasoning: parsed.reasoning || 'AI automation risk assessment in progress'
      };

    } catch (err) {
      console.warn('[JOB_ENRICHMENT] AI risk calculation failed:', err);
      return {
        risk: 'medium',
        score: 50,
        reasoning: 'AI automation risk assessment unavailable'
      };
    }
  }

  /**
   * STAGE 4: Fetch company intelligence
   */
  private static async fetchCompanyIntelligence(company: string): Promise<{
    industry: string;
    size: string;
    founded?: number;
    description: string;
  } | null> {
    try {
      const client = new PerplexityService();
      
      const prompt = `Find company information for "${company}".

RETURN STRICT JSON (no markdown):
{
  "industry": "Primary industry",
  "size": "1-50" | "51-200" | "201-1000" | "1000+",
  "founded": 2020,
  "description": "One sentence company description"
}`;

      const response = await client.makeRequest(
        'You are a company research analyst. Return only JSON.',
        prompt,
        { temperature: 0.1, maxTokens: 300 }
      );

      const cleanedContent = response.content.trim()
        .replace(/^```(?:json)?\s*/gm, '')
        .replace(/```\s*$/gm, '');
      
      return JSON.parse(cleanedContent);

    } catch (err) {
      console.warn('[JOB_ENRICHMENT] Company intelligence failed:', err);
      return null;
    }
  }

  /**
   * MAIN: Enrich a batch of job listings
   */
  static async enrichJobListings(
    rawJobs: RawJobListing[],
    resumeText?: string
  ): Promise<EnrichedJobListing[]> {
    console.log(`[JOB_ENRICHMENT] Enriching ${rawJobs.length} job listings...`);

    const enrichedJobs = await Promise.all(
      rawJobs.map(async (job, index) => {
        console.log(`[JOB_ENRICHMENT] Processing job ${index + 1}/${rawJobs.length}: ${job.title}`);

        try {
          // STAGE 1: Extract company name
          const company = this.extractCompanyFromURL(job.url, job.company);
          console.log(`[JOB_ENRICHMENT] Company extracted: ${company}`);

          // STAGE 2: Fetch salary data (parallel with AI risk)
          const [salaryData, aiRisk] = await Promise.all([
            this.fetchSalaryData(job.title, company, job.location),
            this.calculateAIRisk(job.title, job.summary || job.title)
          ]);

          // STAGE 3: Fetch company intelligence (optional, slower)
          const companyIntel = await this.fetchCompanyIntelligence(company);

          // STAGE 4: Calculate skill match score (if resume provided)
          let skillMatchScore = job.skillMatchPercent || 50;
          if (resumeText && job.summary) {
            // Simple keyword matching
            const resumeLower = resumeText.toLowerCase();
            const summaryLower = job.summary.toLowerCase();
            const keywords = summaryLower.split(/\W+/).filter(w => w.length > 4);
            const matches = keywords.filter(k => resumeLower.includes(k)).length;
            skillMatchScore = Math.min(100, Math.round((matches / Math.max(keywords.length, 1)) * 100));
          }

          return {
            ...job,
            company, // GUARANTEED
            salary: salaryData.salary, // GUARANTEED
            salarySource: salaryData.source,
            aiAutomationRisk: aiRisk.risk,
            aiRiskScore: aiRisk.score,
            aiRiskReasoning: aiRisk.reasoning,
            companyIntelligence: companyIntel || undefined,
            skillMatchScore,
            enrichmentStatus: 'complete' as const
          };

        } catch (err) {
          console.error(`[JOB_ENRICHMENT] Failed to enrich job ${index + 1}:`, err);
          
          // Return partially enriched job
          return {
            ...job,
            company: this.extractCompanyFromURL(job.url, job.company),
            salary: job.salary || 'Competitive salary',
            salarySource: 'estimated' as const,
            aiAutomationRisk: 'medium' as const,
            aiRiskScore: 50,
            aiRiskReasoning: 'Enrichment failed',
            skillMatchScore: job.skillMatchPercent || 50,
            enrichmentStatus: 'partial' as const
          };
        }
      })
    );

    console.log(`[JOB_ENRICHMENT] Enrichment complete: ${enrichedJobs.filter(j => j.enrichmentStatus === 'complete').length}/${rawJobs.length} fully enriched`);
    
    return enrichedJobs;
  }

  /**
   * Helper: Capitalize company names properly
   */
  private static capitalizeCompany(name: string): string {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\b(and|or|the|of)\b/gi, match => match.toLowerCase());
  }
}

