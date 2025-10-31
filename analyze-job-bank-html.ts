/**
 * Analyze Job Bank HTML structure
 */

import { readFileSync } from 'fs'
import * as cheerio from 'cheerio'

const html = readFileSync('job-bank-debug.html', 'utf-8')
const $ = cheerio.load(html)

console.log('🔍 ANALYZING JOB BANK HTML STRUCTURE\n')

// Check for articles
const articles = $('article.resultJobItem')
console.log(`Found ${articles.length} articles with class "resultJobItem"\n`)

if (articles.length > 0) {
  console.log('First article structure:')
  const first = articles.first()
  
  // Get all classes
  console.log('\nAll elements with classes:')
  first.find('[class]').each((i, elem) => {
    const classes = $(elem).attr('class')
    const text = $(elem).text().trim().substring(0, 50)
    console.log(`  .${classes}: "${text}"`)
  })
  
  // Try different selectors
  console.log('\n\nTrying different selectors:')
  console.log(`  h3: ${first.find('h3').length} found`)
  console.log(`  h3 text: "${first.find('h3').first().text().trim()}"`)
  console.log(`  a: ${first.find('a').length} found`)
  console.log(`  a text: "${first.find('a').first().text().trim()}"`)
  console.log(`  span: ${first.find('span').length} found`)
  
  // Get full HTML of first article (first 500 chars)
  console.log('\n\nFirst article HTML (first 1000 chars):')
  console.log(first.html()?.substring(0, 1000))
} else {
  console.log('❌ NO ARTICLES FOUND!')
  console.log('\nSearching for any job-related elements...')
  
  $('[class*="job"]').each((i, elem) => {
    if (i < 10) {
      const classes = $(elem).attr('class')
      console.log(`  Found: .${classes}`)
    }
  })
}
