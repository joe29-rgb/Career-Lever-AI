import puppeteer, { Browser } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { CompanyData } from '@/types';

export interface ScrapedCompanyData {
  companyName: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  culture?: string[];
  benefits?: string[];
  recentNews?: Array<{
    title: string;
    url: string;
    publishedAt: Date;
    summary: string;
  }>;
  glassdoorRating?: number;
  glassdoorReviews?: number;
  linkedinData?: {
    companyPage: string;
    employeeCount?: number;
    followers?: number;
    recentPosts?: Array<{
      content: string;
      postedAt: Date;
      engagement: number;
    }>;
  };
  socialMedia?: {
    twitter?: {
      handle: string;
      followers: number;
      recentTweets: Array<{
        text: string;
        createdAt: Date;
        likes: number;
        retweets: number;
      }>;
    };
    facebook?: {
      pageUrl: string;
      followers: number;
      recentPosts: Array<{
        content: string;
        postedAt: Date;
        reactions: number;
      }>;
    };
    instagram?: {
      handle: string;
      followers: number;
      recentPosts: Array<{
        caption: string;
        postedAt: Date;
        likes: number;
        comments: number;
      }>;
    };
  };
  sources?: string[];
}

export class WebScraperService {
  private browser: Browser | null = null;
  private userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0',
  ];
  // Simple in-memory cache for OSINT requests
  private osintCache: Map<string, { expiresAt: number; value: any }> = new Map();
  private osintCacheTtlMs: number = Number(process.env.OSINT_CACHE_TTL_MS || 15 * 60 * 1000);
  // Optional Redis client
  private redis: any = null;

  async initialize(): Promise<void> {
    if (this.browser) return
    const executablePath = await chromium.executablePath()
    // Optional proxy rotation: read one proxy from PROXY_URLS
    let proxyArg: string | undefined
    try {
      const proxies = (process.env.PROXY_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
      if (proxies.length) {
        const pick = proxies[Math.floor(Math.random() * proxies.length)]
        proxyArg = `--proxy-server=${pick}`
      }
    } catch {}
    // Optional Redis (cache)
    if (!this.redis && process.env.REDIS_URL) {
      try {
        const { createClient } = require('redis')
        this.redis = createClient({ url: process.env.REDIS_URL })
        this.redis.on('error', () => {})
        this.redis.connect().catch(()=>{})
      } catch {}
    }
    const launchArgs = [...chromium.args]
    if (proxyArg) {
      launchArgs.push(proxyArg)
    } else {
      // Some hosts set proxy env vars by default; ensure direct connection
      launchArgs.push('--no-proxy-server')
      launchArgs.push('--proxy-bypass-list=*')
    }
    this.browser = await puppeteer.launch({
      args: launchArgs,
      executablePath,
      headless: true,
    })
  }

  private async configurePage(page: any) {
    page.setDefaultNavigationTimeout(45000)
    page.setDefaultTimeout(45000)
    const ua = this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
    await page.setUserAgent(ua)
    await page.setViewport({ width: 1366, height: 768 })
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
    await page.setRequestInterception(true)
    page.on('request', (req: any) => {
      const type = req.resourceType()
      if (type === 'image' || type === 'media' || type === 'font' || type === 'stylesheet') {
        req.abort().catch(()=>{})
      } else {
        req.continue().catch(()=>{})
      }
    })
  }

  private async sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 500): Promise<T> {
    let lastErr: any
    for (let i = 0; i < attempts; i++) {
      try { return await fn() } catch (e) { lastErr = e; await this.sleep(baseDelay * Math.pow(2, i) + Math.random()*200) }
    }
    throw lastErr
  }

  // Generic Google search helper returning title, url, and snippet
  async googleSearch(query: string, limit: number = 10): Promise<Array<{ title: string; url: string; snippet: string }>> {
    // Cache lookup
    const cacheKey = `g:${query}:${limit}`
    const now = Date.now()
    const cached = this.osintCache.get(cacheKey)
    if (cached && cached.expiresAt > now) return cached.value
    if (this.redis) {
      try {
        const raw = await this.redis.get(`osint:${cacheKey}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          this.osintCache.set(cacheKey, { expiresAt: now + this.osintCacheTtlMs, value: parsed })
          return parsed
        }
      } catch {}
    }
    if (!this.browser) await this.initialize();
    const page = await this.browser!.newPage();
    try {
      await this.configurePage(page)
      const qs = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
      await page.goto(qs, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await this.sleep(900 + Math.random()*600)
      const results = await page.evaluate((max: number) => {
        const out: Array<{ title: string; url: string; snippet: string }> = []
        const blocks = document.querySelectorAll('div.g, div[data-header-feature], div[data-snf]');
        for (const block of Array.from(blocks)) {
          const a = block.querySelector('a[href^="http"]') as HTMLAnchorElement | null
          const h3 = block.querySelector('h3') as HTMLElement | null
          const sn = block.querySelector('div[data-content-feature] div, .VwiC3b, .IsZvec') as HTMLElement | null
          const url = a?.href || ''
          const title = h3?.textContent?.trim() || ''
          const snippet = sn?.textContent?.trim() || ''
          if (url && title) out.push({ title, url, snippet })
          if (out.length >= max) break
        }
        return out
      }, Math.max(1, Math.min(limit, 50)))
      // De-duplicate and filter tracking
      const seen = new Set<string>()
      const cleaned = results.filter(r => {
        try {
          const u = new URL(r.url)
          const key = `${u.hostname}${u.pathname}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        } catch { return false }
      })
      // Set cache
      this.osintCache.set(cacheKey, { expiresAt: now + this.osintCacheTtlMs, value: cleaned })
      if (this.redis) {
        try { await this.redis.setEx(`osint:${cacheKey}`, Math.floor(this.osintCacheTtlMs/1000), JSON.stringify(cleaned)) } catch {}
      }
      return cleaned
    } catch (e) {
      return []
    } finally {
      await page.close()
    }
  }

  // Build advanced Google queries for job discovery across ATS/job boards
  buildJobSearchQueries(options: {
    jobTitle: string;
    location?: string;
    after?: string; // YYYY-MM-DD
    remote?: boolean;
    excludeSenior?: boolean;
    salaryBands?: string[]; // like ["$60,000","$80,000"]
    atsDomains?: string[]; // ['greenhouse.io','jobs.lever.co','workday.com','jobvite.com']
  }): string[] {
    const after = options.after || ''
    const jt = options.jobTitle
    const loc = options.location || ''
    const remote = options.remote ? '"remote"' : ''
    const exclude = options.excludeSenior ? '-"senior" -"staff" -"principal"' : ''
    const parts: string[] = []
    const ats = (options.atsDomains && options.atsDomains.length ? options.atsDomains : ['greenhouse.io','jobs.lever.co','workday.com','jobvite.com']).slice(0,6)
    for (const d of ats) {
      const q = `site:${d} "${jt}" ${loc ? '"'+loc+'"' : ''} ${remote} ${exclude} ${after ? 'after:'+after : ''}`.trim()
      parts.push(q)
    }
    // broad query
    const broad = `"${jt}" ${loc ? '"'+loc+'"' : ''} ${remote} ${exclude} ${after ? 'after:'+after : ''}`.trim()
    parts.push(broad)
    // salary based queries
    if (options.salaryBands && options.salaryBands.length) {
      const salaryExpr = options.salaryBands.slice(0,3).map(s => `"${s}"`).join(' OR ')
      parts.push(`${salaryExpr} "${jt}" ${loc ? '"'+loc+'"' : ''} filetype:pdf`)
    }
    return parts
  }

  // Run Google queries and aggregate unique job posting links, preferring ATS domains
  async searchJobsByGoogle(options: {
    jobTitle: string;
    location?: string;
    after?: string;
    remote?: boolean;
    excludeSenior?: boolean;
    salaryBands?: string[];
    limit?: number;
    radiusKm?: number;
  }): Promise<Array<{ title?: string; url: string; snippet?: string; source: string }>> {
    let queries: string[] = []
    const radiusKm = typeof options.radiusKm === 'number' ? Math.max(1, Math.min(500, options.radiusKm)) : undefined
    if (options.location && radiusKm) {
      try {
        const geo = await this.geocodeLocation(options.location)
        let placeNames: string[] = [ options.location ]
        if (geo) {
          const nearby = await this.getNearbyLocalities(geo.lat, geo.lng, radiusKm, 10)
          const names = nearby.map(p => p.name).filter(Boolean)
          placeNames = Array.from(new Set([options.location, ...names]))
        }
        for (const name of placeNames) {
          const qs = this.buildJobSearchQueries({
            jobTitle: options.jobTitle,
            location: name,
            after: options.after,
            remote: options.remote,
            excludeSenior: options.excludeSenior,
            salaryBands: options.salaryBands,
          })
          queries.push(...qs)
        }
      } catch {
        queries = this.buildJobSearchQueries({
          jobTitle: options.jobTitle,
          location: options.location,
          after: options.after,
          remote: options.remote,
          excludeSenior: options.excludeSenior,
          salaryBands: options.salaryBands,
        })
      }
    } else {
      queries = this.buildJobSearchQueries({
        jobTitle: options.jobTitle,
        location: options.location,
        after: options.after,
        remote: options.remote,
        excludeSenior: options.excludeSenior,
        salaryBands: options.salaryBands,
      })
    }
    const preferredHosts = ['greenhouse.io','jobs.lever.co','workday.com','jobvite.com','boards.greenhouse.io','myworkdayjobs.com','smartrecruiters.com']
    const results: Array<{ title?: string; url: string; snippet?: string; source: string }> = []
    const seen = new Set<string>()
    for (const q of queries) {
      const res = await this.withRetry(() => this.googleSearch(q, 12), 2, 700)
      for (const r of res) {
        try {
          const u = new URL(r.url)
          const host = u.hostname.replace('www.','')
          const key = `${host}${u.pathname}`
          if (seen.has(key)) continue
          seen.add(key)
          results.push({ title: r.title, url: r.url, snippet: r.snippet, source: host })
        } catch { /* ignore */ }
      }
      // small delay to avoid being blocked
      await this.sleep(800 + Math.random()*400)
      if (results.length >= (options.limit || 30)) break
    }
    // Sort: prefer ATS hosts first
    results.sort((a, b) => {
      const aPref = preferredHosts.some(h => (a.source||'').includes(h)) ? 0 : 1
      const bPref = preferredHosts.some(h => (b.source||'').includes(h)) ? 0 : 1
      return aPref - bPref
    })
    return results.slice(0, options.limit || 30)
  }

  // Build Google intel queries and gather categorized signals when direct sites are unavailable
  async searchCompanyIntelByGoogle(companyName: string, opts?: { after?: string }): Promise<{
    financial: Array<{ title: string; url: string; snippet: string }>;
    culture: Array<{ title: string; url: string; snippet: string }>;
    news: Array<{ title: string; url: string; snippet: string }>;
    leadership: Array<{ title: string; url: string; snippet: string }>;
    growth: Array<{ title: string; url: string; snippet: string }>;
    benefits: Array<{ title: string; url: string; snippet: string }>;
  }> {
    const after = opts?.after || ''
    const qFinancial = `"${companyName}" ("funding" OR "investment" OR "revenue") ${after ? 'after:'+after : ''}`
    const qCulture = `site:glassdoor.com "${companyName}" ("culture" OR "management" OR "benefits")`
    const qNews = `"${companyName}" ("press release" OR "announcement") ${after ? 'after:'+after : ''}`
    const qLeadership = `"${companyName}" ("CEO" OR "founder" OR "executive" OR "leadership team") ${after ? 'after:'+after : ''}`
    const qGrowth = `"${companyName}" ("hiring" OR "expansion" OR "new office" OR "acquired" OR "partnership") ${after ? 'after:'+after : ''}`
    const qBenefits = `"${companyName}" ("salary" OR "compensation" OR "benefits" OR "PTO")`

    const [financial, culture, news, leadership, growth, benefits] = await Promise.all([
      this.googleSearch(qFinancial, 8),
      this.googleSearch(qCulture, 8),
      this.googleSearch(qNews, 8),
      this.googleSearch(qLeadership, 8),
      this.googleSearch(qGrowth, 8),
      this.googleSearch(qBenefits, 8),
    ])

    return { financial, culture, news, leadership, growth, benefits }
  }

  // Twitter/X mentions via Google
  async searchTwitterMentions(companyName: string, limit: number = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
    const q = `"${companyName}" (site:twitter.com OR site:x.com)`
    return this.googleSearch(q, limit)
  }

  // Indeed company page/reviews via Google
  async searchIndeedCompany(companyName: string, limit: number = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
    const q = `site:indeed.com/cmp "${companyName}" (review OR salaries OR interviews)`
    return this.googleSearch(q, limit)
  }

  // Reddit employee/interview mentions via Google
  async searchRedditMentions(companyName: string, limit: number = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
    const q = `site:reddit.com "${companyName}" ("working at" OR interview OR employee)`
    return this.googleSearch(q, limit)
  }

  // Financials OSINT: funding, revenue, valuation, investors via Google
  async searchFinancials(companyName: string): Promise<{
    funding: Array<{ title: string; url: string; snippet: string }>;
    revenue: Array<{ title: string; url: string; snippet: string }>;
    valuation: Array<{ title: string; url: string; snippet: string }>;
    investors: Array<{ title: string; url: string; snippet: string }>;
  }> {
    const qFunding = `"${companyName}" (funding OR investment OR "Series A" OR "Series B" OR "Series C") after:2018-01-01`
    const qRevenue = `"${companyName}" (revenue OR ARR OR MRR) filetype:pdf OR site:crunchbase.com`
    const qValuation = `"${companyName}" valuation OR "valued at"`
    const qInvestors = `"${companyName}" investors OR backers OR "led by"`
    const [funding, revenue, valuation, investors] = await Promise.all([
      this.googleSearch(qFunding, 10),
      this.googleSearch(qRevenue, 10),
      this.googleSearch(qValuation, 10),
      this.googleSearch(qInvestors, 10),
    ])
    return { funding, revenue, valuation, investors }
  }

  // Geocode a location string to lat/lng using Mapbox (if configured) or OpenStreetMap Nominatim
  async geocodeLocation(location: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
    const q = location.trim()
    if (!q) return null
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
    try {
      if (mapboxToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${mapboxToken}`
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } as any })
        if (res.ok) {
          const json: any = await res.json()
          const f = json.features?.[0]
          if (f?.center && Array.isArray(f.center)) {
            return { lat: f.center[1], lng: f.center[0], displayName: f.place_name || q }
          }
        }
      }
    } catch {}
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'CareerLeverAI/1.0 (contact: support@careerlever.ai)' } as any })
      if (res.ok) {
        const arr: any[] = await res.json() as any
        const it: any = arr?.[0]
        if (it?.lat && it?.lon) {
          return { lat: parseFloat(it.lat), lng: parseFloat(it.lon), displayName: it.display_name || q }
        }
      }
    } catch {}
    return null
  }

  // Fetch nearby locality names within radius using Overpass API (best-effort)
  async getNearbyLocalities(lat: number, lng: number, radiusKm: number, maxPlaces: number = 10): Promise<Array<{ name: string; country?: string }>> {
    const radiusMeters = Math.round(radiusKm * 1000)
    const body = `[out:json][timeout:25];\n(\n  node["place"~"city|town|village"](around:${radiusMeters},${lat},${lng});\n);\nout body ${Math.max(5, maxPlaces)};`;
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', 'User-Agent': 'CareerLeverAI/1.0 (contact: support@careerlever.ai)' } as any,
        body
      })
      if (!res.ok) throw new Error('overpass error')
      const json: any = await res.json()
      const names: string[] = []
      for (const el of (json.elements || [])) {
        const name = el?.tags?.name
        if (name && !names.includes(name)) names.push(name)
        if (names.length >= maxPlaces) break
      }
      return names.map(n => ({ name: n }))
    } catch {
      return []
    }
  }

  // Scrape a single job detail page from a public URL (best-effort)
  async scrapeJobDetailFromUrl(jobUrl: string): Promise<{
    title?: string;
    companyName?: string;
    location?: string;
    description?: string;
    source: string;
    jobUrl: string;
  }> {
    if (!this.browser) await this.initialize();
    const page = await this.browser!.newPage();
    try {
      await this.configurePage(page)
      await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await this.sleep(800 + Math.random()*600)

      const host = new URL(jobUrl).hostname.replace('www.', '');
      const data = await page.evaluate((host) => {
        const getText = (sel: string[]) => {
          for (const s of sel) {
            const el = document.querySelector(s) as HTMLElement | null;
            if (el && el.textContent && el.textContent.trim().length > 3) return el.textContent.trim();
          }
          return undefined;
        };
        const getHtml = (sel: string[]) => {
          for (const s of sel) {
            const el = document.querySelector(s) as HTMLElement | null;
            if (el && el.innerText && el.innerText.trim().length > 10) return el.innerText.trim();
          }
          return undefined;
        };

        let title = getText(['h1', 'h1[data-testid="jobTitle"]', 'h1.jobsearch-JobInfoHeader-title', 'h1.job-title']);
        let companyName = getText(['.companyName', '[data-company-name="true"]', '.icl-u-lg-mr--sm.icl-u-xs-mr--xs', 'a[data-tn-element="companyName"]', 'a[data-company-name]']);
        if (!companyName) companyName = getText(['[data-testid="companyName"]', 'div[data-company-name]']);
        let location = getText(['.jobsearch-JobInfoHeader-subtitle div:last-child', 'div[data-testid="inlineHeader-companyLocation"]', '.location', '[data-testid="jobLocation"]']);
        let description = getHtml(['#jobDescriptionText', 'div#jobDescriptionText', 'div.jobsearch-jobDescriptionText', 'section#jobDescription', 'div.job-description', 'article']);

        return { title, companyName, location, description };
      }, host);

      return {
        title: data.title,
        companyName: data.companyName,
        location: data.location,
        description: data.description,
        source: host,
        jobUrl,
      };
    } catch (e) {
      return { source: new URL(jobUrl).hostname, jobUrl };
    } finally {
      await page.close();
    }
  }

  // Scrape public search results page (Indeed/ZipRecruiter/Job Bank/Google Jobs page) best-effort
  async scrapeJobsFromSearchUrl(searchUrl: string, limit: number = 20): Promise<Array<{
    title?: string;
    companyName?: string;
    location?: string;
    snippet?: string;
    jobUrl: string;
    source: string;
  }>> {
    if (!this.browser) await this.initialize();
    const page = await this.browser!.newPage();
    const results: any[] = [];
    try {
      await this.configurePage(page)
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await this.sleep(800 + Math.random()*700)
      const host = new URL(searchUrl).hostname.replace('www.', '');

      if (/indeed\.com|indeed\.ca/i.test(host)) {
        const items = await page.evaluate(() => {
          const out: any[] = [];
          document.querySelectorAll('a.tapItem, a[data-jk], a[href*="/rc/clk"], a[href*="/pagead/"]').forEach((a) => {
            const el = a as HTMLAnchorElement;
            const card = el.closest('[data-testid="jobsearch-SerpJobCard"]') || el.closest('div.jobsearch-SerpJobCard') || el;
            const title = (card.querySelector('h2.jobTitle, h2 a, h1') as HTMLElement | null)?.innerText?.trim();
            const company = (card.querySelector('.companyName') as HTMLElement | null)?.innerText?.trim();
            const location = (card.querySelector('.companyLocation') as HTMLElement | null)?.innerText?.trim();
            const snippet = (card.querySelector('.job-snippet') as HTMLElement | null)?.innerText?.trim();
            const href = el.href;
            if (href) out.push({ title, companyName: company, location, snippet, jobUrl: href });
          });
          return out;
        });
        for (const it of items) {
          results.push({ ...it, source: host });
          if (results.length >= limit) break;
        }
      } else if (/ziprecruiter\.com/i.test(host)) {
        const items = await page.evaluate(() => {
          const out: any[] = [];
          document.querySelectorAll('a[href*="/jobs/"], a[href*="/jobs-search"] h2 a').forEach((a) => {
            const link = (a as HTMLAnchorElement).href;
            const card = (a as HTMLElement).closest('article, .job_result, .job_card, .job_content') || (a as HTMLElement);
            const title = (card.querySelector('h2, h3') as HTMLElement | null)?.innerText?.trim();
            const company = (card.querySelector('.job_org, .company, .t_org_link') as HTMLElement | null)?.innerText?.trim();
            const location = (card.querySelector('.location, .job_loc') as HTMLElement | null)?.innerText?.trim();
            const snippet = (card.querySelector('p, .job_snippet') as HTMLElement | null)?.innerText?.trim();
            if (link) out.push({ title, companyName: company, location, snippet, jobUrl: link });
          });
          return out;
        });
        for (const it of items) {
          results.push({ ...it, source: host });
          if (results.length >= limit) break;
        }
      } else if (/jobbank\.gc\.ca/i.test(host)) {
        const items = await page.evaluate(() => {
          const out: any[] = [];
          document.querySelectorAll('a[href*="/jobsearch/jobposting/"]').forEach((a) => {
            const link = (a as HTMLAnchorElement).href;
            const card = (a as HTMLElement).closest('li, article, .resultJobItem') || (a as HTMLElement);
            const title = (card.querySelector('h3, h4, a') as HTMLElement | null)?.innerText?.trim();
            const company = (card.querySelector('.business, .resultJobItem__company') as HTMLElement | null)?.innerText?.trim();
            const location = (card.querySelector('.location, .resultJobItem__infoItem--location') as HTMLElement | null)?.innerText?.trim();
            const snippet = (card.querySelector('p, .resultJobItem__short') as HTMLElement | null)?.innerText?.trim();
            if (link) out.push({ title, companyName: company, location, snippet, jobUrl: link });
          });
          return out;
        });
        for (const it of items) {
          results.push({ ...it, source: host });
          if (results.length >= limit) break;
        }
      } else if (/google\./i.test(host)) {
        const items = await page.evaluate(() => {
          const out: any[] = [];
          document.querySelectorAll('a[href^="http"]').forEach((a) => {
            const href = (a as HTMLAnchorElement).href;
            const text = (a as HTMLAnchorElement).innerText || '';
            if (/indeed|ziprecruiter|jobbank\.gc\.ca|workopolis|glassdoor/i.test(href) && text && text.length > 5) {
              out.push({ title: text.split('\n')[0], companyName: undefined, location: undefined, snippet: undefined, jobUrl: href });
            }
          });
          return out;
        });
        for (const it of items) {
          results.push({ ...it, source: host });
          if (results.length >= limit) break;
        }
      }
    } catch (e) {
      // ignore
    } finally {
      await page.close();
    }
    // De-dupe by URL
    const seen = new Set<string>();
    const deduped = results.filter(r => {
      const key = r.jobUrl.split('#')[0];
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    return deduped.slice(0, limit);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeCompanyData(companyName: string, website?: string): Promise<ScrapedCompanyData> {
    if (!this.browser) {
      await this.initialize();
    }

    const data: ScrapedCompanyData = {
      companyName,
      website,
    };

    try {
      const sources: string[] = []
      const addSource = (s: string) => { if (!sources.includes(s)) sources.push(s) }
      // Try to discover official website if missing
      if (!website) {
        try {
          const found = await this.discoverOfficialWebsite(companyName)
          if (found) website = found
        } catch {}
      }
      // Scrape multiple sources in parallel
      const [glassdoorData, linkedinData, websiteData, newsData, instaData, fbData, gRev] = await Promise.allSettled([
        this.scrapeGlassdoorData(companyName),
        this.scrapeLinkedInData(companyName),
        website ? this.scrapeCompanyWebsite(website) : Promise.resolve(null),
        this.scrapeNewsData(companyName),
        this.scrapeInstagramPublic(companyName),
        this.scrapeFacebookPublic(companyName),
        this.scrapeGoogleReviewsSummary(companyName)
      ]);

      // Merge the data
      if (glassdoorData.status === 'fulfilled' && glassdoorData.value) {
        data.glassdoorRating = glassdoorData.value.rating;
        data.glassdoorReviews = glassdoorData.value.reviews;
        data.culture = glassdoorData.value.culture;
        data.benefits = glassdoorData.value.benefits;
        addSource('glassdoor')
      }

      if (linkedinData.status === 'fulfilled' && linkedinData.value) {
        data.linkedinData = linkedinData.value;
        if (!data.industry && linkedinData.value.industry) {
          data.industry = linkedinData.value.industry;
        }
        if (!data.size && linkedinData.value.size) {
          data.size = linkedinData.value.size;
        }
        addSource('linkedin')
      }

      if (websiteData.status === 'fulfilled' && websiteData.value) {
        data.description = websiteData.value.description;
        if (!data.industry && websiteData.value.industry) {
          data.industry = websiteData.value.industry;
        }
        addSource('website')
      }

      if (newsData.status === 'fulfilled' && newsData.value) {
        data.recentNews = newsData.value;
        addSource('google-news')
      }

      if (instaData.status === 'fulfilled' && instaData.value) {
        data.socialMedia = data.socialMedia || {}
        data.socialMedia.instagram = instaData.value as any
        addSource('instagram')
      }

      if (fbData.status === 'fulfilled' && fbData.value) {
        data.socialMedia = data.socialMedia || {}
        data.socialMedia.facebook = fbData.value as any
        addSource('facebook')
      }

      if (gRev.status === 'fulfilled' && gRev.value) {
        ;(data as any).googleReviewsRating = (gRev.value as any).rating
        ;(data as any).googleReviewsCount = (gRev.value as any).count
        addSource('google-reviews')
      }

      // Generate fallback data if we don't have enough info
      if (!data.culture || data.culture.length === 0) {
        data.culture = this.generateFallbackCulture(companyName);
      }

      if (!data.benefits || data.benefits.length === 0) {
        data.benefits = this.generateFallbackBenefits();
      }

      if (!data.description) {
        data.description = this.generateFallbackDescription(companyName);
      }

      data.sources = sources
    } catch (error) {
      console.error('Error scraping company data:', error);
      // Return basic data with fallbacks
      return {
        companyName,
        website,
        culture: this.generateFallbackCulture(companyName),
        benefits: this.generateFallbackBenefits(),
        description: this.generateFallbackDescription(companyName),
      };
    }

    return data;
  }

  private async discoverOfficialWebsite(companyName: string): Promise<string | null> {
    if (!this.browser) return null
    const page = await this.browser.newPage()
    try {
      await this.configurePage(page)
      const q = `https://www.google.com/search?q=${encodeURIComponent(companyName)}`
      await page.goto(q, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.sleep(800 + Math.random()*700)
      const url = await page.$$eval('a[href^="http"]', els => {
        const badHosts = ['linkedin.com','facebook.com','instagram.com','glassdoor.com','crunchbase.com','wikipedia.org','news.google.com','youtube.com','twitter.com','x.com']
        const candidates = els.map(a => (a as HTMLAnchorElement).href).filter(h => {
          try {
            const u = new URL(h)
            return !badHosts.some(b => u.hostname.includes(b))
          } catch { return false }
        })
        return candidates[0] || ''
      })
      if (!url) return null
      try { const u = new URL(url); return `${u.protocol}//${u.hostname}` } catch { return null }
    } catch { return null } finally { await page.close() }
  }

  async scrapeContactInfoFromWebsite(website: string): Promise<{ emails: string[]; phones: string[]; addresses: string[] }> {
    if (!this.browser) await this.initialize();
    const results = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] };
    const candidates = [website, `${website.replace(/\/?$/, '/') }contact`, `${website.replace(/\/?$/, '/') }about`];
    const page = await this.browser!.newPage();
    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      for (const url of candidates) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(r => setTimeout(r, 1000));
          const html = await page.content();
          // Emails from mailto and plain text
          const mailtos = await page.$$eval('a[href^="mailto:"]', els => els.map(a => (a as HTMLAnchorElement).getAttribute('href') || ''));
          const mailtoClean = mailtos.map(h => h.replace(/^mailto:/i, '').trim()).filter(Boolean);
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const textEmails = (html.match(emailRegex) || []).map(e => e.trim());
          const phoneRegex = /(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g;
          const phones = (html.match(phoneRegex) || []).map(p => p.trim());
          // Address heuristic: lines with street/ave/blvd/suite
          const addressRegex = /(\d+\s+[^\n,]+(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|Lane|Ln\.|Suite|Ste\.)[^\n<]{0,80})/gi;
          const addresses = (html.match(addressRegex) || []).map(a => a.trim());
          results.emails.push(...mailtoClean, ...textEmails);
          results.phones.push(...phones);
          results.addresses.push(...addresses);
        } catch {
          continue;
        }
      }
    } finally {
      await page.close();
    }
    // Deduplicate
    results.emails = Array.from(new Set(results.emails));
    results.phones = Array.from(new Set(results.phones));
    results.addresses = Array.from(new Set(results.addresses));
    return results;
  }

  async searchHiringContacts(companyName: string, roleHints: string[] = [], locationHint?: string): Promise<Array<{ name: string; title: string; profileUrl?: string; source: string }>> {
    if (!this.browser) await this.initialize();
    const page = await this.browser!.newPage();
    const people: Array<{ name: string; title: string; profileUrl?: string; source: string }> = [];
    try {
      const query = `${companyName} ${roleHints.join(' OR ')} site:linkedin.com/in ${locationHint || ''}`.trim();
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      const results = await page.evaluate(() => {
        const items: Array<{ title: string; href: string; snippet: string }> = [];
        const nodes = document.querySelectorAll('a[href^="http"]');
        nodes.forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          const h3 = a.querySelector('h3');
          const title = h3?.textContent || '';
          const parent = a.closest('div') as HTMLElement | null;
          const snippet = parent?.querySelector('span, div')?.textContent || '';
          if (title && href && /linkedin\.com\/in\//i.test(href)) {
            items.push({ title: title.trim(), href, snippet: snippet.trim() });
          }
        });
        return items.slice(0, 10);
      });
      for (const r of results) {
        // Heuristic to split name and title: "Name - Title - Company" or "Name | Title"
        const parts = r.title.split(/[-|–]\s*/);
        const name = parts[0]?.trim() || r.title;
        const title = parts.slice(1).join(' - ').trim() || r.snippet;
        if (name) people.push({ name, title, profileUrl: r.href, source: 'google-linkedin' });
      }
    } catch {
      // ignore
    } finally {
      await page.close();
    }
    return people;
  }

  async scrapeGlassdoorReviewsSummary(companyName: string): Promise<{ pros: string[]; cons: string[] } | null> {
    if (!this.browser) await this.initialize();
    const page = await this.browser!.newPage();
    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      const searchUrl = `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-reviews-SRCH_KE0,${companyName.length}.htm`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));
      const data = await page.evaluate(() => {
        const textContent = document.body.innerText || '';
        const pros: string[] = [];
        const cons: string[] = [];
        // Simple heuristic: look for lines following "Pros" or "Cons"
        const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
        for (let i = 0; i < lines.length; i++) {
          if (/^pros\b/i.test(lines[i]) && lines[i+1]) pros.push(lines[i+1].slice(0, 200));
          if (/^cons\b/i.test(lines[i]) && lines[i+1]) cons.push(lines[i+1].slice(0, 200));
        }
        return { pros: Array.from(new Set(pros)).slice(0, 5), cons: Array.from(new Set(cons)).slice(0, 5) };
      });
      return data;
    } catch (e) {
      console.error('Glassdoor summary error:', e);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeGlassdoorData(companyName: string): Promise<{
    rating?: number;
    reviews?: number;
    culture?: string[];
    benefits?: string[];
  } | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      const searchUrl = `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-reviews-SRCH_KE0,${companyName.length}.htm`;

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for content to load
      await new Promise(r => setTimeout(r, 2000));

      const data = await page.evaluate(() => {
        const result: any = {};

        // Get overall rating
        const ratingElement = document.querySelector('[data-test="rating-info"] .css-1cw89uz');
        if (ratingElement) {
          const ratingText = ratingElement.textContent?.trim();
          if (ratingText) {
            const rating = parseFloat(ratingText);
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
              result.rating = rating;
            }
          }
        }

        // Get number of reviews
        const reviewsElement = document.querySelector('[data-test="rating-info"] .css-1cw89uz + span');
        if (reviewsElement) {
          const reviewsText = reviewsElement.textContent?.trim();
          if (reviewsText) {
            const reviewsMatch = reviewsText.match(/([\d,]+)\s*reviews?/i);
            if (reviewsMatch) {
              result.reviews = parseInt(reviewsMatch[1].replace(/,/g, ''));
            }
          }
        }

        // Get company culture insights
        const cultureElements = document.querySelectorAll('.css-1cw89uz');
        const culture: string[] = [];
        cultureElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 10 && text.length < 100) {
            culture.push(text);
          }
        });
        if (culture.length > 0) {
          result.culture = culture.slice(0, 5);
        }

        // Get benefits if available
        const benefitElements = document.querySelectorAll('[data-test*="benefit"], .benefit, .perk');
        const benefits: string[] = [];
        benefitElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 3 && text.length < 50) {
            benefits.push(text);
          }
        });
        if (benefits.length > 0) {
          result.benefits = benefits.slice(0, 8);
        }

        return result;
      });

      return data;
    } catch (error) {
      console.error('Glassdoor scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeLinkedInData(companyName: string): Promise<{
    companyPage: string;
    employeeCount?: number;
    followers?: number;
    industry?: string;
    size?: string;
    recentPosts?: Array<{
      content: string;
      postedAt: Date;
      engagement: number;
    }>;
  } | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Prefer company vanity, but allow a Google fallback if page lacks data
      const vanity = companyName.toLowerCase().replace(/\s+/g, '')
      const searchUrl = `https://www.linkedin.com/company/${vanity}`;

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for content to load
      await new Promise(r => setTimeout(r, 3000));

      let data = await page.evaluate(() => {
        const result: any = {
          companyPage: window.location.href
        };

        // Get follower count
        const followerSelectors = [
          '.org-top-card-summary-info-list__info-item',
          '[data-test-id="company-followers-count"]',
          '.org-top-card-summary__follower-count'
        ];

        for (const selector of followerSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text) {
              const followerMatch = text.match(/([\d,]+)\s*(?:followers?|people)/i);
              if (followerMatch) {
                result.followers = parseInt(followerMatch[1].replace(/,/g, ''));
                break;
              }
            }
          }
        }

        // Get employee count
        const employeeSelectors = [
          '.org-about-company-module__company-size',
          '[data-test-id="company-employees-count"]',
          '.org-about-company-module__company-staff-count-range'
        ];

        for (const selector of employeeSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text) {
              const employeeMatch = text.match(/([\d,]+)(?:\s*-\s*([\d,]+))?\s*employees?/i);
              if (employeeMatch) {
                result.employeeCount = employeeMatch[2]
                  ? (parseInt(employeeMatch[1].replace(/,/g, '')) + parseInt(employeeMatch[2].replace(/,/g, ''))) / 2
                  : parseInt(employeeMatch[1].replace(/,/g, ''));
                break;
              }
            }
          }
        }

        // Get industry and size info
        const infoElements = document.querySelectorAll('.org-page-details__definition-text, .org-about-company-module__company-size');
        infoElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text) {
            // Try to identify industry
            if (!result.industry && text.length > 3 && text.length < 30) {
              result.industry = text;
            }
            // Try to identify company size
            if (!result.size && text.match(/\d+/)) {
              result.size = text;
            }
          }
        });

        return result;
      });
      if (!data || (!data.followers && !data.employeeCount)) {
        try {
          const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' site:linkedin.com/company')}`
          await page.goto(q, { waitUntil: 'domcontentloaded', timeout: 30000 })
          await new Promise(r=>setTimeout(r,1500))
          const link = await page.$$eval('a[href^="http"]', els => {
            const cand = els.map(a => (a as HTMLAnchorElement).href)
            const good = cand.find(h => /linkedin\.com\/company\//i.test(h))
            return good || ''
          })
          if (link) {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 })
            await new Promise(r=>setTimeout(r,1200))
            const data2 = await page.evaluate(() => {
              const out: any = { companyPage: window.location.href }
              const followersEl = document.querySelector('.org-top-card-summary__follower-count, .org-top-card-summary-info-list__info-item')
              const t = followersEl?.textContent || ''
              const m = t.match(/([\d,]+)\s*(followers|people)/i)
              if (m) out.followers = parseInt(m[1].replace(/,/g, ''))
              return out
            })
            data = { ...data, ...data2 }
          }
        } catch {}
      }

      return data;
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeInstagramPublic(companyName: string): Promise<{
    handle: string;
    followers: number;
    recentPosts: Array<{ caption: string; postedAt: Date; likes: number; comments: number }>;
  } | null> {
    if (!this.browser) return null;
    const page = await this.browser.newPage();
    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' site:instagram.com')}`
      await page.goto(q, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r=>setTimeout(r,1000))
      const igUrl = await page.$$eval('a[href^="http"]', els => {
        const urls = els.map(a => (a as HTMLAnchorElement).href)
        const candidate = urls.find(h => /instagram\.com\//i.test(h)) || ''
        return candidate
      })
      if (!igUrl) return null
      await page.goto(igUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r=>setTimeout(r,1200))
      const result = await page.evaluate(() => {
        function parseCount(s: string): number {
          const m = s.trim().toLowerCase().replace(/,/g,'');
          if (/k$/.test(m)) return Math.round(parseFloat(m) * 1000)
          if (/m$/.test(m)) return Math.round(parseFloat(m) * 1000000)
          const n = parseFloat(m)
          return isNaN(n) ? 0 : Math.round(n)
        }
        const handle = window.location.pathname.split('/').filter(Boolean)[0] || ''
        const meta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
        let followers = 0
        if (meta?.content) {
          const m = meta.content.match(/([\d.,]+\s*[kKmM]?)\s+Followers?/)
          if (m) followers = parseCount(m[1])
        }
        const captions: string[] = []
        document.querySelectorAll('article img[alt]').forEach(img => {
          const alt = (img as HTMLImageElement).alt
          if (alt && alt.length > 5) captions.push(alt.substring(0, 200))
        })
        const recentPosts = captions.slice(0,6).map(c => ({ caption: c, postedAt: new Date(), likes: 0, comments: 0 }))
        return { handle, followers, recentPosts }
      })
      return result
    } catch (e) {
      return null
    } finally {
      await page.close()
    }
  }

  private async scrapeFacebookPublic(companyName: string): Promise<{
    pageUrl: string;
    followers: number;
    recentPosts: Array<{ content: string; postedAt: Date; reactions: number }>;
  } | null> {
    if (!this.browser) return null;
    const page = await this.browser.newPage();
    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' site:facebook.com')}`
      await page.goto(q, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r=>setTimeout(r,1000))
      const fbUrl = await page.$$eval('a[href^="http"]', els => {
        const urls = els.map(a => (a as HTMLAnchorElement).href)
        const candidate = urls.find(h => /facebook\.com\//i.test(h)) || ''
        return candidate
      })
      if (!fbUrl) return null
      await page.goto(fbUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r=>setTimeout(r,1500))
      const result = await page.evaluate(() => {
        const pageUrl = window.location.href
        const text = document.body.innerText || ''
        let followers = 0
        const m = text.match(/([\d.,]+)\s+followers/i)
        if (m) followers = parseInt(m[1].replace(/,/g,''))
        const posts: Array<{ content: string; postedAt: Date; reactions: number }> = []
        const articles = Array.from(document.querySelectorAll('div[role="article"]'))
        for (const a of articles.slice(0,5)) {
          const content = (a.textContent || '').trim().replace(/\s+/g,' ').substring(0, 300)
          if (content.length > 20) posts.push({ content, postedAt: new Date(), reactions: 0 })
        }
        return { pageUrl, followers, recentPosts: posts }
      })
      return result
    } catch (e) {
      return null
    } finally {
      await page.close()
    }
  }

  private async scrapeGoogleReviewsSummary(companyName: string): Promise<{ rating?: number; count?: number } | null> {
    if (!this.browser) return null;
    const page = await this.browser.newPage();
    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' reviews')}`
      await page.goto(q, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await new Promise(r=>setTimeout(r,1500))
      const data = await page.evaluate(() => {
        const txt = document.body.innerText || ''
        let rating: number | undefined
        let count: number | undefined
        const ratingMatch = txt.match(/([0-9]\.[0-9])\s*\(?(?:based on\s*)?([\d,]+)\s+Google reviews\)?/i) || txt.match(/([0-9]\.[0-9])\s+rating\s+from\s+([\d,]+)\s+Google reviews/i)
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1])
          count = parseInt(ratingMatch[2].replace(/,/g,''))
        } else {
          const countOnly = txt.match(/([\d,]+)\s+Google reviews/i)
          if (countOnly) count = parseInt(countOnly[1].replace(/,/g,''))
        }
        return { rating, count }
      })
      if (!data.rating && !data.count) return null
      return data
    } catch (e) {
      return null
    } finally {
      await page.close()
    }
  }

  private async scrapeCompanyWebsite(website: string): Promise<{
    description?: string;
    industry?: string;
  } | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      await page.goto(website, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for content to load
      await new Promise(r => setTimeout(r, 2000));

      const data = await page.evaluate(() => {
        const result: any = {};

        // Get meta description
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) {
          const description = descriptionMeta.getAttribute('content')?.trim();
          if (description && description.length > 50) {
            result.description = description;
          }
        }

        // Get about text from common selectors
        if (!result.description) {
          const aboutSelectors = [
            '[class*="about"]',
            '[id*="about"]',
            '.about-us',
            '#about',
            '[class*="mission"]',
            '[class*="company"]'
          ];

          for (const selector of aboutSelectors) {
            const elements = document.querySelectorAll(`${selector} p, ${selector} div`);
            let text = '';

            elements.forEach(el => {
              const content = el.textContent?.trim();
              if (content && content.length > 20) {
                text += content + ' ';
                if (text.length > 500) return;
              }
            });

            if (text.length > 100) {
              result.description = text.substring(0, 500);
              break;
            }
          }
        }

        // Try to infer industry from content
        const bodyText = document.body.textContent || '';
        const industryKeywords = {
          'technology': ['software', 'tech', 'digital', 'app', 'platform', 'saas'],
          'healthcare': ['health', 'medical', 'patient', 'care', 'clinical'],
          'finance': ['financial', 'banking', 'investment', 'wealth', 'capital'],
          'retail': ['retail', 'shopping', 'store', 'product', 'consumer'],
          'consulting': ['consulting', 'advisory', 'strategy', 'management'],
          'education': ['education', 'learning', 'training', 'student', 'academic']
        };

        for (const [industry, keywords] of Object.entries(industryKeywords)) {
          const matches = keywords.filter(keyword =>
            bodyText.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matches.length >= 2) {
            result.industry = industry.charAt(0).toUpperCase() + industry.slice(1);
            break;
          }
        }

        return result;
      });

      return data;
    } catch (error) {
      console.error('Website scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeNewsData(companyName: string): Promise<Array<{
    title: string;
    url: string;
    publishedAt: Date;
    summary: string;
  }> | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      page.setDefaultNavigationTimeout(45000)
      page.setDefaultTimeout(45000)
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Use Google News search
      const searchQuery = encodeURIComponent(`${companyName} company news`);
      const newsUrl = `https://www.google.com/search?q=${searchQuery}&tbm=nws&tbs=qdr:m`;

      await page.goto(newsUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 2000));

      const newsData = await page.evaluate(() => {
        const articles: Array<{
          title: string;
          url: string;
          publishedAt: Date;
          summary: string;
        }> = [];

        // Google News selectors
        const newsItems = document.querySelectorAll('[data-ved], .WlydOe');

        newsItems.forEach((item, index) => {
          if (index >= 5) return; // Limit to 5 news items

          const titleElement = item.querySelector('h3, .mCBkyc');
          const linkElement = item.querySelector('a[href]');
          const summaryElement = item.querySelector('.GI74Re, .c0cFT, .s3v9rd');
          const dateElement = item.querySelector('.OSrXXb, .eNg7of, .f');

          if (titleElement && linkElement) {
            const title = titleElement.textContent?.trim();
            const url = linkElement.getAttribute('href');
            const summary = summaryElement?.textContent?.trim() || '';
            const dateText = dateElement?.textContent?.trim();

            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `https://news.google.com${url}`,
                publishedAt: dateText ? new Date(dateText) : new Date(),
                summary: summary || title
              });
            }
          }
        });

        return articles.filter(article => article.title.length > 10);
      });

      return newsData.length > 0 ? newsData : null;
    } catch (error) {
      console.error('News scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private generateFallbackCulture(companyName: string): string[] {
    // Generate generic but positive culture descriptions
    const cultures = [
      'Collaborative and innovative work environment',
      'Focus on employee development and growth',
      'Work-life balance and flexible arrangements',
      'Diverse and inclusive workplace culture',
      'Strong emphasis on teamwork and communication',
      'Commitment to excellence and quality',
      'Supportive leadership and mentorship programs'
    ];

    // Return 3-4 random cultures
    const shuffled = cultures.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }

  private generateFallbackBenefits(): string[] {
    return [
      'Health, dental, and vision insurance',
      '401k matching program',
      'Flexible work arrangements',
      'Professional development budget',
      'Paid time off and holidays',
      'Wellness and fitness programs',
      'Modern office facilities'
    ];
  }

  private generateFallbackDescription(companyName: string): string {
    return `${companyName} is a dynamic organization committed to delivering innovative solutions and exceptional service. We foster a collaborative environment where talented individuals can grow professionally while contributing to meaningful projects that make a positive impact.`;
  }
}

// Export a singleton instance
export const webScraper = new WebScraperService();

