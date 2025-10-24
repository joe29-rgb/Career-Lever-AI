/**
 * Perplexity Agent Tool Definitions
 * 
 * Defines tools the AI agent can call to gather job/company intelligence
 * These tools guarantee execution (not just suggestions like prompts)
 */

export interface AgentTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}

export const CAREER_AGENT_TOOLS: AgentTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_job_boards',
      description: 'Searches multiple job boards for job listings matching criteria. Returns job URLs and basic metadata.',
      parameters: {
        type: 'object',
        properties: {
          job_title: {
            type: 'string',
            description: 'Job title to search for (e.g., "Senior Developer", "Business Development Manager")'
          },
          location: {
            type: 'string',
            description: 'City and province/state (e.g., "Toronto, ON", "New York, NY")'
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of job postings to return (default: 20)'
          }
        },
        required: ['job_title', 'location']
      }
    }
  },
  
  {
    type: 'function',
    function: {
      name: 'scrape_job_posting',
      description: 'Visits a specific job posting URL and extracts the COMPLETE job description, requirements, salary, benefits, and application details.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Direct URL to the job posting'
          },
          company_name: {
            type: 'string',
            description: 'Company name (for context)'
          }
        },
        required: ['url']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'search_linkedin_profiles',
      description: 'Searches LinkedIn for people at a specific company with specific roles (recruiters, hiring managers, HR). Returns verified profiles with LinkedIn URLs.',
      parameters: {
        type: 'object',
        properties: {
          company_name: {
            type: 'string',
            description: 'Company name to search'
          },
          role_keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Keywords like "recruiter", "talent acquisition", "HR manager", "hiring manager"'
          }
        },
        required: ['company_name', 'role_keywords']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'verify_company_website',
      description: 'Visits company website and extracts careers page, team pages, contact emails, and official hiring information.',
      parameters: {
        type: 'object',
        properties: {
          company_name: {
            type: 'string',
            description: 'Company name'
          },
          website_url: {
            type: 'string',
            description: 'Company website URL (if known)'
          }
        },
        required: ['company_name']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'validate_email',
      description: 'Validates if an email address is real and on the company domain (not personal email like gmail/yahoo).',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'Email address to validate'
          },
          company_domain: {
            type: 'string',
            description: 'Expected company domain (e.g., "bmo.com", "google.com")'
          }
        },
        required: ['email', 'company_domain']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'get_company_intelligence',
      description: 'Gathers comprehensive company intelligence including news, culture, values, recent activities, and market position.',
      parameters: {
        type: 'object',
        properties: {
          company_name: {
            type: 'string',
            description: 'Company name'
          }
        },
        required: ['company_name']
      }
    }
  }
]
