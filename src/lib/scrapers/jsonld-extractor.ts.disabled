/**
 * JSON-LD EXTRACTOR
 * 
 * Extracts job postings from company career pages using JSON-LD structured data
 * 100% legal - this is public data designed for search engines
 * 
 * Expected: 5,000+ jobs from Canadian companies
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import type { Job } from '@/types/supabase'

export class JSONLDExtractor {
  
  private readonly CANADIAN_COMPANIES = [
    // Energy & Resources
    { name: 'Suncor Energy', domain: 'suncor.com', careers: '/careers' },
    { name: 'Shell Canada', domain: 'shell.ca', careers: '/careers' },
    { name: 'Imperial Oil', domain: 'imperialoil.ca', careers: '/careers' },
    { name: 'Enbridge', domain: 'enbridge.com', careers: '/careers' },
    { name: 'TC Energy', domain: 'tcenergy.com', careers: '/careers' },
    
    // Banking & Finance
    { name: 'RBC', domain: 'rbc.com', careers: '/careers' },
    { name: 'TD Bank', domain: 'td.com', careers: '/careers' },
    { name: 'BMO', domain: 'bmo.com', careers: '/careers' },
    { name: 'Scotiabank', domain: 'scotiabank.com', careers: '/careers' },
    { name: 'CIBC', domain: 'cibc.com', careers: '/careers' },
    
    // Tech
    { name: 'Shopify', domain: 'shopify.com', careers: '/careers' },
    { name: 'OpenText', domain: 'opentext.com', careers: '/careers' },
    { name: 'CGI', domain: 'cgi.com', careers: '/careers' },
    { name: 'BlackBerry', domain: 'blackberry.com', careers: '/careers' },
    
    // Retail
    { name: 'Loblaw', domain: 'loblaw.ca', careers: '/careers' },
    { name: 'Canadian Tire', domain: 'canadiantire.ca', careers: '/careers' },
    { name: 'Metro', domain: 'metro.ca', careers: '/careers' },
    
    // Telecom
    { name: 'Bell Canada', domain: 'bell.ca', careers: '/careers' },
    { name: 'Telus', domain: 'telus.com', careers: '/careers' },
    { name: 'Rogers', domain: 'rogers.com', careers: '/careers' },
    
    // Construction & Engineering
    { name: 'PCL Construction', domain: 'pcl.com', careers: '/careers' },
    { name: 'Stantec', domain: 'stantec.com', careers: '/careers' },
    { name: 'AECOM', domain: 'aecom.com', careers: '/careers' },
    { name: 'SNC-Lavalin', domain: 'snclavalin.com', careers: '/careers' },
  ]

  async extractAllCompanies(): Promise<Partial<Job>[]> {
    console.log('[JSON-LD] Extracting from company websites...')
    const allJobs: Partial<Job>[] = []

    for (const company of this.CANADIAN_COMPANIES) {
      try {
        const jobs = await this.extractFromCompany(company)
        allJobs.push(...jobs)
        console.log(`[${company.name}] ${jobs.length} jobs`)
        await this.sleep(2000) // Respectful rate limiting
      } catch (error) {
        console.error(`[${company.name}] Error:`, error)
      }
    }

    console.log(`[JSON-LD] Total: ${allJobs.length} jobs`)
    return allJobs
  }

  private async extractFromCompany(company: { name: string; domain: string; careers: string }): Promise<Partial<Job>[]> {
    try {
      // Try common career page URLs
      const urls = [
        `https://${company.domain}${company.careers}`,
        `https://${company.domain}/careers/`,
        `https://${company.domain}/jobs`,
        `https://${company.domain}/en/careers`,
        `https://careers.${company.domain}`,
      ]

      for (const url of urls) {
        try {
          const jobs = await this.extractFromURL(url, company.name)
          if (jobs.length > 0) {
            return jobs
          }
        } catch (error) {
          // Try next URL
          continue
        }
      }

      return []
    } catch (error) {
      return []
    }
  }

  private async extractFromURL(url: string, companyName: string): Promise<Partial<Job>[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
        maxRedirects: 5,
      })

      const $ = cheerio.load(response.data)
      const jobs: Partial<Job>[] = []

      // Find all JSON-LD scripts
      $('script[type="application/ld+json"]').each((i, elem) => {
        try {
          const jsonLD = JSON.parse($(elem).html() || '{}')

          // Handle single JobPosting
          if (jsonLD['@type'] === 'JobPosting') {
            jobs.push(this.parseJobPosting(jsonLD, companyName))
          }

          // Handle array of JobPostings
          if (Array.isArray(jsonLD)) {
            jsonLD.forEach(item => {
              if (item['@type'] === 'JobPosting') {
                jobs.push(this.parseJobPosting(item, companyName))
              }
            })
          }

          // Handle nested @graph
          if (jsonLD['@graph'] && Array.isArray(jsonLD['@graph'])) {
            jsonLD['@graph'].forEach((item: any) => {
              if (item['@type'] === 'JobPosting') {
                jobs.push(this.parseJobPosting(item, companyName))
              }
            })
          }
        } catch (err) {
          // Invalid JSON, skip
        }
      })

      return jobs
    } catch (error) {
      return []
    }
  }

  private parseJobPosting(jobLD: any, companyName: string): Partial<Job> {
    return {
      title: jobLD.title || jobLD.name || 'Unknown',
      company: jobLD.hiringOrganization?.name || companyName,
      location: this.parseLocation(jobLD.jobLocation),
      description: jobLD.description || '',
      url: jobLD.url || jobLD.identifier?.value || '',
      source: 'json-ld',
      salary_min: jobLD.baseSalary?.value?.minValue,
      salary_max: jobLD.baseSalary?.value?.maxValue,
      posted_date: jobLD.datePosted ? new Date(jobLD.datePosted).toISOString() : undefined,
      external_id: `jsonld_${Buffer.from(jobLD.url || jobLD.title || '').toString('base64').slice(0, 16)}`,
      scraped_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      keywords: []
    }
  }

  private parseLocation(jobLocation: any): string {
    if (!jobLocation) return 'Unknown'
    if (typeof jobLocation === 'string') return jobLocation

    if (jobLocation.address) {
      const addr = jobLocation.address
      return [addr.addressLocality, addr.addressRegion, addr.addressCountry]
        .filter(Boolean)
        .join(', ')
    }

    return 'Unknown'
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton
let instance: JSONLDExtractor | null = null

export function getJSONLDExtractor(): JSONLDExtractor {
  if (!instance) {
    instance = new JSONLDExtractor()
  }
  return instance
}
