import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'

export async function scrapeJobBankCanada(keywords: string, location: string) {
  try {
    const q = `site:jobbank.gc.ca ${keywords} ${location}`
    return await PerplexityIntelligenceService.jobQuickSearch(q, ['jobbank.gc.ca'], 15, 'week')
  } catch (error) {
    console.error('Job Bank scraping failed:', error)
    return []
  }
}

export async function scrapeIndeedCanada(keywords: string, location: string) {
  try {
    const q = `site:ca.indeed.com ${keywords} ${location}`
    return await PerplexityIntelligenceService.jobQuickSearch(q, ['ca.indeed.com'], 15, 'week')
  } catch (error) {
    console.error('Indeed scraping failed:', error)
    return []
  }
}


