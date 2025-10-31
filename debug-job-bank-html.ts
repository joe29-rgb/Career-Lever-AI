/**
 * Download actual Job Bank HTML to see structure
 */

import { writeFileSync } from 'fs'

async function downloadJobBankHTML() {
  const url = 'https://www.jobbank.gc.ca/jobsearch/jobsearch?searchstring=software&locationstring=Toronto&sort=D'
  
  console.log('Downloading Job Bank HTML...')
  console.log(`URL: ${url}\n`)
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  })
  
  console.log(`Status: ${response.status}`)
  console.log(`Content-Type: ${response.headers.get('content-type')}\n`)
  
  const html = await response.text()
  
  writeFileSync('job-bank-debug.html', html)
  console.log('✅ Saved to: job-bank-debug.html')
  console.log(`Size: ${html.length} bytes\n`)
  
  // Check for common selectors
  console.log('Checking for selectors:')
  console.log(`  article.resultJobItem: ${html.includes('resultJobItem') ? '✅ FOUND' : '❌ NOT FOUND'}`)
  console.log(`  resultJobItemTitle: ${html.includes('resultJobItemTitle') ? '✅ FOUND' : '❌ NOT FOUND'}`)
  console.log(`  resultJobItemEmployer: ${html.includes('resultJobItemEmployer') ? '✅ FOUND' : '❌ NOT FOUND'}`)
  
  // Check for job-related content
  console.log(`\n  Contains "job": ${html.toLowerCase().includes('job') ? '✅ YES' : '❌ NO'}`)
  console.log(`  Contains "position": ${html.toLowerCase().includes('position') ? '✅ YES' : '❌ NO'}`)
  console.log(`  Contains "search results": ${html.toLowerCase().includes('search results') ? '✅ YES' : '❌ NO'}`)
}

downloadJobBankHTML()
