/**
 * DEBUG LINKEDIN API
 * See what we're actually getting back
 */

import axios from 'axios'

async function debugLinkedIn() {
  console.log('🔍 DEBUGGING LINKEDIN API\n')
  
  const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search'
  
  try {
    const response = await axios.get(url, {
      params: {
        keywords: 'software engineer',
        location: 'Toronto, ON',
        start: 0
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000
    })
    
    console.log('Status:', response.status)
    console.log('Content-Type:', response.headers['content-type'])
    console.log('Data length:', response.data.length)
    console.log('\nFirst 500 characters:')
    console.log(response.data.substring(0, 500))
    console.log('\n...')
    console.log('\nLast 500 characters:')
    console.log(response.data.substring(response.data.length - 500))
    
  } catch (error: any) {
    console.error('Error:', error.message)
    if (error.response) {
      console.log('Status:', error.response.status)
      console.log('Data:', error.response.data)
    }
  }
}

debugLinkedIn()
