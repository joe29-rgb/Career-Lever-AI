import { WebScraperService } from './web-scraper'
import * as cheerio from 'cheerio'

// ─── Shared Job Result Type ─────────────────────────────────────────────────
export interface SharedJobResult {
  title?:string;
  company?:string;
  location?:string;
  url:string;
  salary?:string;
  date?:string;
  snippet?:string;
  source?:string;
}

// ──────────────────────────────────────────────────────────────────────────────


export class EnhancedCanadianJobScraper {
  private scraper = new WebScraperService()
  
  async scrapeJobBankDirect(keywords:string, location:string): Promise<SharedJobResult[]> {
    const searchUrl = `https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=${encodeURIComponent(keywords)}&locationstring=${encodeURIComponent(location)}`
    const response = await fetch(searchUrl)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const jobs: SharedJobResult[] = []
    $('.resultJobItem').each((i, elem) => {
      const title = $(elem).find('h3 a').text().trim()
      const company = $(elem).find('.business').text().trim()
      const loc = $(elem).find('.location').text().trim()
      const url = $(elem).find('h3 a').attr('href')
      const salary = $(elem).find('.salary').text().trim()
      const date = $(elem).find('.date').text().trim()
      
      if (title) {
        jobs.push({
          title,
          company,
          location: loc || location,
          url: url ? `https://www.jobbank.gc.ca${url}` : searchUrl,
          salary,
          date: new Date(date).toISOString() || new Date().toISOString()
        })
      }
    })
    
    return jobs.slice(0, 15)
  }
  
  async scrapeIndeedCanadaDirect(keywords:string, location:string): Promise<SharedJobResult[]> {
    const searchUrl = `https://ca.indeed.com/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}`
    const response = await fetch(searchUrl)
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const jobs: SharedJobResult[] = []
    $('.job_seen_beacon').each((i, elem) => {
      const title = $(elem).find('h2 a span').text().trim()
      const company = $(elem).find('.companyName').text().trim()
      const loc = $(elem).find('.companyLocation').text().trim()
      const url = $(elem).find('h2 a').attr('href')
      const salary = $(elem).find('.salary-snippet').text().trim()
      const date = $(elem).find('.date').text().trim()
      
      if (title) {
        jobs.push({
          title,
          company,
          location: loc || location,
          url: url ? `https://ca.indeed.com${url}` : searchUrl,
          salary,
          date: new Date(date).toISOString() || new Date().toISOString()
        })
      }
    })
    
    return jobs.slice(0, 15)
  }
  
  async combineAllSources(keywords: string, location: string): Promise<SharedJobResult[]> {
    // Scrape bank and indeed (already SharedJobResult[])
    const bankJobs = await this.scrapeJobBankDirect(keywords, location);
    const indeedJobs = await this.scrapeIndeedCanadaDirect(keywords, location);

    // Normalize Google results to SharedJobResult
    const googleResultsRaw = await this.scraper.searchJobsByGoogle({ jobTitle: keywords, location });
    const googleJobs: SharedJobResult[] = googleResultsRaw.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      source: r.source
    }));

    // Combine all
    const allJobs = [...bankJobs, ...indeedJobs, ...googleJobs];

    // Dedupe by URL
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.url === job.url)
    );

    // Sort by salary safely
    return uniqueJobs.sort((a, b) => {
      const scoreA = a.salary ? parseFloat(a.salary.replace(/[^\d.]/g, '')) : 0;
      const scoreB = b.salary ? parseFloat(b.salary.replace(/[^\d.]/g, '')) : 0;
      return scoreB - scoreA;
    });
  }
}
