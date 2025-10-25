/**
 * Complete LinkedIn + Job Scraping Integration
 * Combines OAuth, job search, and contact validation
 */

import { PerplexityIntelligenceService, type JobListing } from './perplexity-intelligence'
import { validateHiringContacts, filterContactsByScore, getBestContact, type ValidatedContact } from './contact-validation'

export interface JobWithContacts {
  job: JobListing
  contacts: ValidatedContact[]
  bestContact: ValidatedContact | null
  contactStats: {
    total: number
    withEmail: number
    withLinkedIn: number
    validated: number
  }
}

export interface JobSearchResult {
  success: boolean
  totalJobs: number
  jobsWithContacts: number
  jobs: JobWithContacts[]
  searchMetadata: {
    location: string
    role: string
    duration: number
    timestamp: number
  }
}

/**
 * Main integration function: Find jobs with verified hiring contacts
 */
export async function findJobsWithVerifiedContacts(
  location: string,
  role: string,
  resumeText: string,
  options: {
    maxJobs?: number
    workType?: 'remote' | 'hybrid' | 'onsite' | 'any'
    minContactScore?: number
  } = {}
): Promise<JobSearchResult> {
  const startTime = Date.now()
  const maxJobs = options.maxJobs || 10
  const minContactScore = options.minContactScore || 50

  console.log(`🔍 Starting job search: ${role} in ${location}`)

  // 1. Search for jobs
  const jobsResult = await PerplexityIntelligenceService.jobMarketAnalysisV2(
    location,
    resumeText,
    {
      roleHint: role,
      maxResults: 40,
      workType: options.workType || 'any'
    }
  )

  if (!jobsResult.success || jobsResult.data.length === 0) {
    console.log('❌ No jobs found')
    return {
      success: false,
      totalJobs: 0,
      jobsWithContacts: 0,
      jobs: [],
      searchMetadata: {
        location,
        role,
        duration: Date.now() - startTime,
        timestamp: startTime
      }
    }
  }

  console.log(`✅ Found ${jobsResult.data.length} jobs`)

  // 2. For each job, find and validate hiring contacts
  const jobsWithContacts: JobWithContacts[] = []
  const topJobs = jobsResult.data.slice(0, maxJobs)

  for (let i = 0; i < topJobs.length; i++) {
    const job = topJobs[i]
    console.log(`\n[${i + 1}/${topJobs.length}] 📧 Finding contacts for ${job.company}...`)

    try {
      // Find contacts
      const contactsResult = await PerplexityIntelligenceService.hiringContactsWithAgent(
        job.company
      )

      if (!contactsResult.success || contactsResult.data.length === 0) {
        console.log(`  ⚠️ No contacts found`)
        jobsWithContacts.push({
          job,
          contacts: [],
          bestContact: null,
          contactStats: {
            total: 0,
            withEmail: 0,
            withLinkedIn: 0,
            validated: 0
          }
        })
        continue
      }

      console.log(`  ✅ Found ${contactsResult.data.length} potential contacts`)

      // Validate contacts
      const validatedContacts = await validateHiringContacts(contactsResult.data)
      const filteredContacts = filterContactsByScore(validatedContacts, minContactScore)
      const bestContact = getBestContact(filteredContacts)

      // Calculate stats
      const contactStats = {
        total: validatedContacts.length,
        withEmail: validatedContacts.filter(c => c.validation.emailValid).length,
        withLinkedIn: validatedContacts.filter(c => c.validation.linkedInValid).length,
        validated: filteredContacts.length
      }

      console.log(`  📊 Stats: ${contactStats.validated}/${contactStats.total} validated (score ≥${minContactScore})`)
      
      if (bestContact) {
        console.log(`  ⭐ Best: ${bestContact.name} (${bestContact.title}) - Score: ${bestContact.validation.overallScore}`)
      }

      jobsWithContacts.push({
        job,
        contacts: filteredContacts,
        bestContact,
        contactStats
      })

    } catch (error) {
      console.error(`  ❌ Error processing ${job.company}:`, error)
      jobsWithContacts.push({
        job,
        contacts: [],
        bestContact: null,
        contactStats: {
          total: 0,
          withEmail: 0,
          withLinkedIn: 0,
          validated: 0
        }
      })
    }

    // Small delay to avoid rate limits
    if (i < topJobs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const duration = Date.now() - startTime
  const jobsWithValidContacts = jobsWithContacts.filter(j => j.contacts.length > 0).length

  console.log(`\n✅ Complete! Found ${jobsWithValidContacts}/${jobsWithContacts.length} jobs with verified contacts`)
  console.log(`⏱️ Duration: ${(duration / 1000).toFixed(1)}s`)

  return {
    success: true,
    totalJobs: jobsWithContacts.length,
    jobsWithContacts: jobsWithValidContacts,
    jobs: jobsWithContacts,
    searchMetadata: {
      location,
      role,
      duration,
      timestamp: startTime
    }
  }
}

/**
 * Export results to JSON
 */
export function exportJobsToJSON(result: JobSearchResult): string {
  return JSON.stringify(result, null, 2)
}

/**
 * Export results to CSV
 */
export function exportJobsToCSV(result: JobSearchResult): string {
  const headers = [
    'Job Title',
    'Company',
    'Location',
    'URL',
    'Salary',
    'Work Type',
    'Posted Date',
    'Match %',
    'Contact Name',
    'Contact Title',
    'Contact Email',
    'Contact LinkedIn',
    'Contact Score'
  ]

  const rows = result.jobs.map(item => {
    const contact = item.bestContact
    return [
      item.job.title,
      item.job.company,
      item.job.location,
      item.job.url,
      item.job.salary || 'N/A',
      item.job.workType,
      item.job.postedDate,
      item.job.skillMatchPercent,
      contact?.name || 'N/A',
      contact?.title || 'N/A',
      contact?.email || 'N/A',
      contact?.linkedinUrl || 'N/A',
      contact?.validation.overallScore || 0
    ].map(val => `"${val}"`).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Generate outreach email for a job
 */
export async function generateOutreachForJob(
  jobWithContacts: JobWithContacts,
  userProfile: {
    name: string
    currentRole?: string
    summary?: string
  }
): Promise<string | null> {
  if (!jobWithContacts.bestContact) {
    return null
  }

  const contact = jobWithContacts.bestContact
  const job = jobWithContacts.job

  // Use Perplexity to generate personalized outreach
  // This would call your existing outreach generation function
  const outreach = `Subject: ${job.title} at ${job.company}

Hi ${contact.name?.split(' ')[0] || 'there'},

I noticed ${job.company} is hiring for a ${job.title} position. With my background in ${userProfile.currentRole || 'this field'}, I believe I'd be a strong fit.

${userProfile.summary || 'I have relevant experience and skills that align well with this role.'}

I'd love to learn more about the position and discuss how I can contribute to ${job.company}'s success.

Best regards,
${userProfile.name}

---
Job: ${job.url}
${contact.linkedinUrl ? `LinkedIn: ${contact.linkedinUrl}` : ''}
`

  return outreach
}

/**
 * Example usage
 */
export async function exampleUsage() {
  const result = await findJobsWithVerifiedContacts(
    'Toronto, ON',
    'Product Manager',
    'Experienced Product Manager with 5 years in SaaS. Led product teams, launched features, drove growth.',
    {
      maxJobs: 5,
      workType: 'hybrid',
      minContactScore: 60
    }
  )

  // Export to JSON
  console.log('\n📄 JSON Export:')
  console.log(exportJobsToJSON(result))

  // Export to CSV
  console.log('\n📊 CSV Export:')
  console.log(exportJobsToCSV(result))

  // Generate outreach for first job with contacts
  const jobWithContact = result.jobs.find(j => j.bestContact)
  if (jobWithContact) {
    const outreach = await generateOutreachForJob(jobWithContact, {
      name: 'John Doe',
      currentRole: 'Senior Product Manager',
      summary: 'Led product strategy for B2B SaaS platform with 10k+ users'
    })
    console.log('\n📧 Sample Outreach:')
    console.log(outreach)
  }

  return result
}
