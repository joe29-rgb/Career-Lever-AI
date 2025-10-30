/**
 * ATS SLUG DISCOVERY TOOL
 * 
 * Find the correct ATS slugs for Alberta companies by:
 * 1. Checking their career pages
 * 2. Looking for ATS platform URLs
 * 3. Extracting the company identifier
 */

import * as cheerio from 'cheerio'
import { ALBERTA_COMPANIES } from './src/data/alberta-companies'

async function discoverATSSlug(companyName: string, website?: string): Promise<void> {
  console.log(`\n🔍 Discovering ATS for: ${companyName}`)
  
  // Common career page patterns
  const careerPatterns = [
    `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com/careers`,
    `https://careers.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://jobs.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    `https://apply.${companyName.toLowerCase().replace(/\s+/g, '')}.com`
  ]
  
  for (const url of careerPatterns) {
    try {
      console.log(`  Trying: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        redirect: 'follow'
      })
      
      if (response.ok) {
        const html = await response.text()
        const $ = cheerio.load(html)
        
        // Check for ATS platforms
        const pageHTML = html.toLowerCase()
        
        if (pageHTML.includes('greenhouse.io') || pageHTML.includes('boards.greenhouse')) {
          const match = html.match(/boards\.greenhouse\.io\/([a-zA-Z0-9-_]+)/)
          if (match) {
            console.log(`  ✅ FOUND Greenhouse: ${match[1]}`)
            return
          }
        }
        
        if (pageHTML.includes('lever.co') || pageHTML.includes('jobs.lever')) {
          const match = html.match(/jobs\.lever\.co\/([a-zA-Z0-9-_]+)/)
          if (match) {
            console.log(`  ✅ FOUND Lever: ${match[1]}`)
            return
          }
        }
        
        if (pageHTML.includes('workable.com') || pageHTML.includes('apply.workable')) {
          const match = html.match(/apply\.workable\.com\/([a-zA-Z0-9-_]+)/)
          if (match) {
            console.log(`  ✅ FOUND Workable: ${match[1]}`)
            return
          }
        }
        
        if (pageHTML.includes('ashbyhq.com')) {
          const match = html.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9-_]+)/)
          if (match) {
            console.log(`  ✅ FOUND Ashby: ${match[1]}`)
            return
          }
        }
        
        if (pageHTML.includes('workday.com') || pageHTML.includes('myworkdayjobs')) {
          console.log(`  ✅ FOUND Workday (OAuth required)`)
          return
        }
        
        console.log(`  ⚠️  Found career page but couldn't identify ATS`)
        break
      }
    } catch (error) {
      // Continue to next pattern
    }
  }
  
  console.log(`  ❌ Could not find career page`)
}

async function main() {
  console.log('🚀 ATS SLUG DISCOVERY TOOL\n')
  console.log('Checking Alberta companies for correct ATS slugs...\n')
  
  // Test with first 5 companies
  const testCompanies = ALBERTA_COMPANIES.slice(0, 5)
  
  for (const company of testCompanies) {
    await discoverATSSlug(company.name)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Rate limit
  }
  
  console.log('\n\n✅ DISCOVERY COMPLETE')
  console.log('\n💡 NEXT STEPS:')
  console.log('1. Update alberta-companies.ts with correct slugs')
  console.log('2. Re-run test-ats-direct.ts')
  console.log('3. Expect 500+ jobs from corrected slugs')
}

main().catch(console.error)
