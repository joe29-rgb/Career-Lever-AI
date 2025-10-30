/**
 * Incremental Download: One location at a time
 * Safer approach with smaller batches
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { AdzunaAPIClient } from './src/lib/adzuna-api-client'
import { supabaseAdmin } from './src/lib/supabase'
import type { Job } from './src/types/supabase'

const adzuna = new AdzunaAPIClient()

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function downloadLocationJobs(location: string) {
  console.log(`\n📍 Downloading jobs for ${location}...`)
  
  const jobs: any[] = []
  const seenIds = new Set<string>()
  let totalScraped = 0
  
  // Scrape up to 20 pages (1,000 jobs per location)
  for (let page = 1; page <= 20; page++) {
    try {
      const result = await adzuna.searchJobs({
        what: '',
        where: location,
        country: 'ca',
        resultsPerPage: 50,
        page,
        sortBy: 'date'
      })
      
      // Validate and deduplicate
      const validJobs = result.results.filter((j: any) => {
        if (seenIds.has(j.id)) return false
        
        const hasCompany = j.company?.display_name?.trim()
        const hasDescription = j.description?.trim()
        const hasTitle = j.title?.trim()
        const hasUrl = j.redirect_url?.trim()
        
        if (!hasCompany || !hasDescription || !hasTitle || !hasUrl) {
          return false
        }
        
        seenIds.add(j.id)
        return true
      })
      
      jobs.push(...validJobs.map((j: any) => ({
        title: j.title,
        company: j.company.display_name,
        location: j.location.display_name,
        description: j.description,
        url: j.redirect_url,
        external_id: `adzuna_${j.id}`,
        source: 'adzuna',
        salary_min: j.salary_min || null,
        salary_max: j.salary_max || null,
        salary_type: 'yearly',
        salary_currency: 'CAD',
        job_type: j.contract_time || null,
        remote_type: 'on-site',
        apply_link: j.redirect_url,
        city: location.split(',')[0].trim(),
        state: 'AB',
        country: 'Canada',
        posted_date: j.created,
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        keywords: []
      })))
      
      totalScraped += validJobs.length
      console.log(`  Page ${page}: ${validJobs.length} valid jobs (Total: ${totalScraped})`)
      
      if (result.results.length === 0) {
        console.log(`  No more results, stopping at page ${page}`)
        break
      }
      
      await sleep(500)
      
    } catch (error: any) {
      console.error(`  Page ${page} error:`, error.message)
      break
    }
  }
  
  console.log(`\n✅ Scraped ${jobs.length} jobs for ${location}`)
  
  // Insert in small batches of 50
  if (jobs.length > 0) {
    console.log(`📥 Inserting ${jobs.length} jobs in batches of 50...`)
    
    let inserted = 0
    let errors = 0
    const batchSize = 50
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      try {
        const { data, error } = await supabaseAdmin
          .from('jobs')
          .upsert(batch, {
            onConflict: 'external_id',
            ignoreDuplicates: false
          })
          .select('id')
        
        if (error) {
          console.error(`  Batch ${batchNum} error:`, error.message)
          errors += batch.length
        } else {
          inserted += data?.length || 0
          console.log(`  Batch ${batchNum}: ✅ ${data?.length || 0} jobs`)
        }
        
        await sleep(1000) // Wait 1s between batches
        
      } catch (error: any) {
        console.error(`  Batch ${batchNum} exception:`, error.message)
        errors += batch.length
      }
    }
    
    console.log(`\n✅ Inserted ${inserted} jobs, ${errors} errors`)
    return { inserted, errors }
  }
  
  return { inserted: 0, errors: 0 }
}

async function main() {
  console.log('🚀 INCREMENTAL DOWNLOAD: Edmonton Area')
  console.log('Strategy: One location at a time, 50 jobs per batch\n')
  
  const locations = [
    'Edmonton, AB',
    'St. Albert, AB',
    'Sherwood Park, AB',
    'Spruce Grove, AB',
    'Leduc, AB',
    'Fort Saskatchewan, AB',
    'Stony Plain, AB',
    'Beaumont, AB'
  ]
  
  let totalInserted = 0
  let totalErrors = 0
  
  for (const location of locations) {
    const { inserted, errors } = await downloadLocationJobs(location)
    totalInserted += inserted
    totalErrors += errors
    
    console.log(`\n📊 Running Total: ${totalInserted} inserted, ${totalErrors} errors`)
    
    // Wait 2 seconds between locations
    await sleep(2000)
  }
  
  console.log('\n\n🎉 COMPLETE!')
  console.log(`Total Inserted: ${totalInserted}`)
  console.log(`Total Errors: ${totalErrors}`)
}

main().catch(console.error)
