/**
 * Test Adzuna data quality
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { AdzunaAPIClient } from './src/lib/adzuna-api-client'

async function testAdzunaQuality() {
  console.log('🧪 Testing Adzuna data quality...\n')

  const adzuna = new AdzunaAPIClient()

  // Test search
  const result = await adzuna.searchJobs({
    what: 'sales',
    where: 'Edmonton, AB',
    country: 'ca',
    resultsPerPage: 10,
    page: 1
  })

  console.log(`✅ Found ${result.results.length} jobs\n`)

  // Check data quality
  result.results.forEach((job, i) => {
    console.log(`Job ${i + 1}:`)
    console.log(`  ✓ Title: ${job.title}`)
    console.log(`  ✓ Company: ${job.company.display_name}`)
    console.log(`  ✓ Location: ${job.location.display_name}`)
    console.log(`  ✓ Description: ${job.description.substring(0, 100)}...`)
    console.log(`  ✓ URL: ${job.redirect_url}`)
    console.log(`  ✓ Salary: ${job.salary_min && job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : 'Not specified'}`)
    console.log(`  ✓ Posted: ${job.created}`)
    console.log('')

    // Validate required fields
    const issues = []
    if (!job.title) issues.push('Missing title')
    if (!job.company?.display_name) issues.push('Missing company')
    if (!job.description) issues.push('Missing description')
    if (!job.redirect_url) issues.push('Missing URL')

    if (issues.length > 0) {
      console.log(`  ❌ ISSUES: ${issues.join(', ')}`)
    }
  })

  // Summary
  const withSalary = result.results.filter(j => j.salary_min || j.salary_max).length
  const withCompany = result.results.filter(j => j.company?.display_name).length
  const withDescription = result.results.filter(j => j.description).length

  console.log('\n📊 Data Quality Summary:')
  console.log(`  Companies: ${withCompany}/${result.results.length} (${Math.round(withCompany/result.results.length*100)}%)`)
  console.log(`  Descriptions: ${withDescription}/${result.results.length} (${Math.round(withDescription/result.results.length*100)}%)`)
  console.log(`  Salaries: ${withSalary}/${result.results.length} (${Math.round(withSalary/result.results.length*100)}%)`)
}

testAdzunaQuality().catch(console.error)
