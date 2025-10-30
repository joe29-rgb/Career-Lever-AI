/**
 * Mass Download: Edmonton + 160km radius
 * Target: 10,000+ jobs from Adzuna
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { bulkDownloadJobs } from './src/lib/supabase-bulk-download'

async function downloadEdmontonJobs() {
  console.log('🚀 MASS DOWNLOAD: Edmonton + 160km Radius')
  console.log('Target: 10,000+ jobs from Adzuna\n')

  // Edmonton + surrounding cities within 160km
  const locations = [
    'Edmonton, AB',           // Main city
    'St. Albert, AB',         // 19km north
    'Sherwood Park, AB',      // 13km east
    'Spruce Grove, AB',       // 11km west
    'Leduc, AB',              // 33km south
    'Fort Saskatchewan, AB',  // 25km northeast
    'Stony Plain, AB',        // 27km west
    'Beaumont, AB',           // 23km south
    'Devon, AB',              // 35km southwest
    'Morinville, AB',         // 34km north
    'Wetaskiwin, AB',         // 70km south
    'Camrose, AB',            // 90km southeast
    'Drayton Valley, AB',     // 130km southwest
    'Lloydminster, AB',       // 250km east (border city, still relevant)
    'Red Deer, AB'            // 145km south (major city)
  ]

  console.log(`📍 Locations to scrape: ${locations.length}`)
  locations.forEach((loc, i) => console.log(`   ${i + 1}. ${loc}`))
  console.log('')

  const startTime = Date.now()

  try {
    await bulkDownloadJobs(locations)
    
    const duration = Math.round((Date.now() - startTime) / 1000 / 60)
    console.log(`\n✅ COMPLETE! Duration: ${duration} minutes`)
    
  } catch (error) {
    console.error('❌ Download failed:', error)
    process.exit(1)
  }
}

downloadEdmontonJobs()
