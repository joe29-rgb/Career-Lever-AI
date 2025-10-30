/**
 * INTELLIGENT SLUG DISCOVERY
 * 
 * Fixes the 65% failure rate by trying multiple slug variations
 * Expected: 35% → 80%+ success rate!
 * 
 * How it works:
 * 1. Generate 10+ slug variations per company
 * 2. Test each variation with HEAD request
 * 3. Cache successful slugs for future use
 * 4. Return first working slug
 */

export class SlugDiscovery {
  private cache = new Map<string, string>()
  
  /**
   * Discover the correct slug for a company
   */
  async discoverSlug(
    companyName: string,
    atsType: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'recruitee'
  ): Promise<string | null> {
    // Check cache first
    const cacheKey = `${companyName}_${atsType}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    console.log(`[DISCOVERY] Finding slug for: ${companyName} (${atsType})`)
    
    // Generate all possible variations
    const variations = this.generateSlugVariations(companyName)
    
    // Test each variation
    for (const slug of variations) {
      const exists = await this.testSlug(slug, atsType)
      if (exists) {
        console.log(`[DISCOVERY] ✅ Found: ${slug}`)
        this.cache.set(cacheKey, slug)
        return slug
      }
    }
    
    console.log(`[DISCOVERY] ❌ No slug found for ${companyName}`)
    return null
  }
  
  /**
   * Generate all possible slug variations
   */
  private generateSlugVariations(name: string): string[] {
    const variations: string[] = []
    
    // 1. Basic normalization
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    variations.push(normalized)
    
    // 2. With spaces as nothing
    variations.push(name.toLowerCase().replace(/\s+/g, ''))
    
    // 3. With spaces as dashes
    variations.push(name.toLowerCase().replace(/\s+/g, '-'))
    
    // 4. With spaces as underscores
    variations.push(name.toLowerCase().replace(/\s+/g, '_'))
    
    // 5. Remove common suffixes
    const withoutSuffixes = normalized.replace(/inc|corp|corporation|ltd|llc|limited|company|co$/g, '')
    if (withoutSuffixes !== normalized) {
      variations.push(withoutSuffixes)
    }
    
    // 6. Remove tech-related words
    const withoutTech = normalized.replace(/technologies|technology|tech|software|systems|solutions$/g, '')
    if (withoutTech !== normalized) {
      variations.push(withoutTech)
    }
    
    // 7. First word only
    const firstWord = name.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, '')
    if (firstWord && firstWord !== normalized) {
      variations.push(firstWord)
    }
    
    // 8. First two words
    const words = name.toLowerCase().split(/\s+/)
    if (words.length >= 2) {
      const firstTwo = words.slice(0, 2).join('').replace(/[^a-z0-9]/g, '')
      variations.push(firstTwo)
    }
    
    // 9. Acronym (first letters)
    if (words.length >= 2) {
      const acronym = words.map(w => w[0]).join('').replace(/[^a-z0-9]/g, '')
      if (acronym.length >= 2) {
        variations.push(acronym)
      }
    }
    
    // 10. Remove "the" prefix
    const withoutThe = name.toLowerCase().replace(/^the\s+/g, '').replace(/[^a-z0-9]/g, '')
    if (withoutThe !== normalized) {
      variations.push(withoutThe)
    }
    
    // Remove duplicates and empty strings
    return [...new Set(variations)].filter(v => v.length > 0)
  }
  
  /**
   * Test if a slug exists for the given ATS
   */
  private async testSlug(
    slug: string,
    atsType: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'recruitee'
  ): Promise<boolean> {
    try {
      const url = this.getTestURL(slug, atsType)
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      return response.status === 200
    } catch (error) {
      return false
    }
  }
  
  /**
   * Get the test URL for a slug
   */
  private getTestURL(
    slug: string,
    atsType: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'recruitee'
  ): string {
    switch (atsType) {
      case 'greenhouse':
        return `https://api.greenhouse.io/v1/boards/${slug}/jobs`
      case 'lever':
        return `https://api.lever.co/v0/postings/${slug}`
      case 'workable':
        return `https://apply.workable.com/api/v1/widget/accounts/${slug}`
      case 'ashby':
        return `https://api.ashbyhq.com/posting-api/job-board/${slug}`
      case 'recruitee':
        return `https://${slug}.recruitee.com/api/offers`
      default:
        throw new Error(`Unknown ATS type: ${atsType}`)
    }
  }
  
  /**
   * Batch discover slugs for multiple companies
   */
  async batchDiscover(
    companies: Array<{ name: string; ats: 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'recruitee' }>
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>()
    
    console.log(`\n🔍 BATCH SLUG DISCOVERY: ${companies.length} companies\n`)
    
    for (const company of companies) {
      const slug = await this.discoverSlug(company.name, company.ats)
      if (slug) {
        results.set(company.name, slug)
      }
      
      // Rate limiting
      await sleep(1000)
    }
    
    const successRate = (results.size / companies.length * 100).toFixed(1)
    console.log(`\n✅ Discovery complete: ${results.size}/${companies.length} (${successRate}%)\n`)
    
    return results
  }
  
  /**
   * Export discovered slugs to JSON
   */
  exportCache(): Record<string, string> {
    return Object.fromEntries(this.cache)
  }
  
  /**
   * Import previously discovered slugs
   */
  importCache(cache: Record<string, string>): void {
    for (const [key, value] of Object.entries(cache)) {
      this.cache.set(key, value)
    }
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Singleton
let instance: SlugDiscovery | null = null

export function getSlugDiscovery(): SlugDiscovery {
  if (!instance) {
    instance = new SlugDiscovery()
  }
  return instance
}
