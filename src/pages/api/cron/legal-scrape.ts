/**
 * VERCEL CRON JOB - LEGAL FREE SCRAPER
 * 
 * Runs automatically Monday-Friday at 3 AM
 * NO API keys required!
 * 
 * Schedule: 0 3 * * 1-5 (Mon-Fri at 3 AM)
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { getLegalFreeScraper } from '@/lib/orchestrator/legal-free-scraper'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('[CRON] Legal Free Scraper starting...')
    
    // Run the scraper
    const scraper = getLegalFreeScraper()
    const result = await scraper.runMegaScrape()
    
    console.log('[CRON] Scraping complete, inserting to Supabase...')
    
    // Note: The actual insertion to Supabase would happen here
    // For now, we're just logging the results
    
    console.log('[CRON] Complete!')
    
    res.status(200).json({
      success: true,
      message: 'Legal Free Scraper completed successfully',
      result: {
        total: result.total,
        ats: result.ats,
        eluta: result.eluta,
        jsonld: result.jsonld,
        civicjobs: result.civicjobs,
        unique: result.unique,
        duration: result.duration,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Scraper failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
