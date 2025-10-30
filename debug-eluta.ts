/**
 * DEBUG ELUTA PUPPETEER
 * See what HTML we're actually getting
 */

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import * as fs from 'fs'

puppeteer.use(StealthPlugin())

async function debugEluta() {
  console.log('🔍 DEBUGGING ELUTA PUPPETEER\n')
  
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
    ]
  })
  
  const page = await browser.newPage()
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
  
  const url = 'https://www.eluta.ca/search?keywords=software+developer&location=Toronto'
  
  console.log(`Navigating to: ${url}\n`)
  
  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    
    console.log('✅ Page loaded!\n')
    
    // Get the HTML
    const html = await page.content()
    
    // Save to file
    fs.writeFileSync('eluta-debug.html', html)
    console.log('✅ Saved HTML to eluta-debug.html\n')
    
    // Check for common selectors
    const selectors = [
      '.search-result',
      '.job-listing',
      '.job-item',
      '[data-job]',
      '.job-card',
      '.posting',
      'article',
      '.result'
    ]
    
    console.log('🔍 Checking selectors:\n')
    
    for (const selector of selectors) {
      const count = await page.$$(selector)
      console.log(`  ${selector}: ${count.length} elements`)
    }
    
    // Get all class names on the page
    console.log('\n🔍 Looking for job-related classes:\n')
    
    const classes = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*')
      const classSet = new Set<string>()
      
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(c => {
            if (c.includes('job') || c.includes('search') || c.includes('result') || c.includes('posting')) {
              classSet.add(c)
            }
          })
        }
      })
      
      return Array.from(classSet)
    })
    
    console.log('Job-related classes found:')
    classes.forEach(c => console.log(`  .${c}`))
    
    // Take a screenshot
    await page.screenshot({ path: 'eluta-debug.png', fullPage: true })
    console.log('\n✅ Saved screenshot to eluta-debug.png')
    
    console.log('\n📄 First 1000 characters of HTML:')
    console.log(html.substring(0, 1000))
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await browser.close()
  }
}

debugEluta()
