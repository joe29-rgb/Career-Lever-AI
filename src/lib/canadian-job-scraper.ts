import { PerplexityIntelligenceService } from './perplexity-intelligence'

export async function scrapeJobBankCanada(keywords: string, location: string, limit: number = 20) {
  const query = `${keywords} ${location} site:jobbank.gc.ca`
  try {
    console.log('[SCRAPER] Job Bank query:', query)
    const results = await PerplexityIntelligenceService.jobQuickSearch(
      query,
      ['jobbank.gc.ca'],
      limit,
      'week' // Recent jobs
    )
    console.log('[SCRAPER] Job Bank results:', results.length)
    return results.map(r => ({
      ...r,
      source: 'Job Bank Canada',
      country: 'CA'
    }))
  } catch (error) {
    console.error('[SCRAPER] Job Bank failed:', error)
    return []
  }
}

export async function scrapeIndeedCanada(keywords: string, location: string, limit: number = 20) {
  const query = `${keywords} ${location} site:ca.indeed.com`
  try {
    console.log('[SCRAPER] Indeed query:', query)
    const results = await PerplexityIntelligenceService.jobQuickSearch(
      query,
      ['ca.indeed.com'],
      limit,
      'week'
    )
    console.log('[SCRAPER] Indeed results:', results.length)
    return results.map(r => ({
      ...r,
      source: 'Indeed.ca',
      country: 'CA'
    }))
  } catch (error) {
    console.error('[SCRAPER] Indeed failed:', error)
    return []
  }
}

export async function scrapeCanadianJobs(keywords: string[], location: string) {
  const allKeywords = keywords.join(' ')
  const [jobBank, indeed] = await Promise.all([
    scrapeJobBankCanada(allKeywords, location),
    scrapeIndeedCanada(allKeywords, location)
  ])
  const combined = [...jobBank, ...indeed]
  // Dedupe by title + company
  const unique = combined.filter((job, index, self) =>
    index === self.findIndex(j => j.title === job.title && j.company === job.company)
  )
  console.log('[SCRAPER] Total unique Canadian jobs:', unique.length)
  return unique.slice(0, 30) // Limit total
}
