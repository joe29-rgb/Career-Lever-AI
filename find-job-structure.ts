/**
 * Find the actual job listing structure
 */

import { readFileSync } from 'fs'
import * as cheerio from 'cheerio'

const html = readFileSync('job-bank-debug.html', 'utf-8')
const $ = cheerio.load(html)

console.log('🔍 FINDING JOB LISTING STRUCTURE\n')

// Look for .results-jobs
const resultsJobs = $('.results-jobs')
console.log(`Found ${resultsJobs.length} .results-jobs containers\n`)

if (resultsJobs.length > 0) {
  console.log('Children of .results-jobs:')
  resultsJobs.children().each((i, elem) => {
    const tagName = elem.tagName
    const classes = $(elem).attr('class') || 'no-class'
    const id = $(elem).attr('id') || 'no-id'
    console.log(`  ${i + 1}. <${tagName}> class="${classes}" id="${id}"`)
    
    if (i < 3) {
      // Show first few children's structure
      console.log(`     First child HTML (200 chars):`)
      console.log(`     ${$(elem).html()?.substring(0, 200)}...\n`)
    }
  })
}

// Look for article tags
console.log('\n\nAll <article> tags:')
$('article').each((i, elem) => {
  const classes = $(elem).attr('class') || 'no-class'
  const id = $(elem).attr('id') || 'no-id'
  console.log(`  ${i + 1}. class="${classes}" id="${id}"`)
  
  if (i === 0) {
    console.log('\n  First article full HTML (first 1500 chars):')
    console.log($(elem).html()?.substring(0, 1500))
  }
})
