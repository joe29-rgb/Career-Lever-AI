import { WebScraperService } from './web-scraper'

export class EnhancedCanadianJobScraper {
  private scraper = new WebScraperService()
  
  async scrapeJobBankDirect(keywords: string, location: string) {
    // Simulate direct Job Bank scraping with fetch
    const searchUrl = `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(keywords)}&locationstring=${encodeURIComponent(location)}`
    const response = await fetch(searchUrl)
    const html = await response.text()
    // Parse HTML for jobs (in production, use cheerio)
    // For now, return mock parsed jobs
    return [
      {
        title: 'Sample Job from Job Bank',
        company: 'Sample Company',
        location,
        url: searchUrl,
        salary: '$50,000',
        date: new Date().toISOString()
      }
    ]
  }
  
  async scrapeIndeedCanadaDirect(keywords: string, location: string) {
    // Simulate direct Indeed scraping
    const searchUrl = `https://ca.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`
    const response = await fetch(searchUrl)
    const html = await response.text()
    // Parse for jobs
    return [
      {
        title: 'Sample Job from Indeed',
        company: 'Sample Inc',
        location,
        url: searchUrl,
        salary: '$60,000',
        date: new Date().toISOString()
      }
    ]
  }
  
  async combineAllSources(keywords: string, location: string) {
    const results = await Promise.all([
      this.scrapeJobBankDirect(keywords, location),
      this.scrapeIndeedCanadaDirect(keywords, location),
      this.scraper.searchJobsByGoogle({ jobTitle: keywords, location })
    ])
    
    // Deduplicate by url
    const allJobs = results.flat()
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.url === job.url)
    )
    
    // Rank by relevance (simple score)
    return uniqueJobs.sort((a, b) => (b.salary || 0) - (a.salary || 0))
  }
}
