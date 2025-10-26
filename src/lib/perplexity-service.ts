export class PerplexityService {
  private readonly apiKey: string
  private readonly baseURL = (process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai') + '/chat/completions'
  private readonly defaultModel = process.env.PERPLEXITY_MODEL || 'sonar-pro'
  private static memoryCache: Map<string, { expiresAt: number; value: { content: string; usage?: unknown; cost: number } }> = new Map()
  private static inflightRequests: Map<string, Promise<{ content: string; usage?: unknown; cost: number }>> = new Map()
  private static defaultTtlMs = Number(process.env.PPX_CACHE_TTL_MS || 24*60*60*1000)
  private readonly debug: boolean = process.env.NODE_ENV === 'development' || process.env.PPX_DEBUG === 'true'

  constructor(apiKey?: string) {
    const key = apiKey || process.env.PERPLEXITY_API_KEY
    // Do not throw during construction to avoid build-time failures.
    // Validate at request-time in makeRequest instead.
    this.apiKey = key || ''
    if (this.debug) {
      console.log('🔧 PerplexityService Debug Info:')
      console.log('   API Key:', this.apiKey ? `${this.apiKey.slice(0, 8)}...` : '❌ MISSING')
      console.log('   Base URL:', this.baseURL)
      console.log('   Default Model:', this.defaultModel)
    }
  }

  async makeRequest(
    systemPrompt: string,
    userPrompt: string,
    options: { maxTokens?: number; temperature?: number; model?: string } = {}
  ): Promise<{ content: string; usage?: unknown; cost: number }> {
    if (this.debug) {
      console.log('🚀 Perplexity Request:')
      console.log('   System:', systemPrompt.slice(0, 100) + '...')
      console.log('   User:', userPrompt.slice(0, 100) + '...')
      console.log('   Model:', options.model || this.defaultModel)
    }
    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY missing')
    }
    const key = this.makeCacheKey(systemPrompt, userPrompt, options)
    const cached = PerplexityService.memoryCache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      if (this.debug) console.log('💾 Cache hit for request')
      return cached.value
    }

    const inflight = PerplexityService.inflightRequests.get(key)
    if (inflight) {
      if (this.debug) console.log('🔁 Awaiting existing in-flight request')
      return inflight
    }

    const payload = {
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: Math.min(options.maxTokens || 2000, 8000),
      temperature: Math.max(0, Math.min(2, options.temperature ?? 0.2)),
    }
    if (this.debug) {
      try { console.log('📤 Request payload:', JSON.stringify(payload).slice(0, 400) + '…') } catch {}
    }

    // timeout implemented below via AbortController

    const requestPromise = (async () => {
      const maxRetries = 3
      let lastErr: unknown
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (this.debug) console.log(`🔄 Attempt ${attempt + 1}/${maxRetries}`)
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 600000)
          const res: Response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'CareerLever/1.0'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          })
          clearTimeout(timer)
          if (this.debug) {
            console.log(`📡 Response status: ${res.status} ${res.statusText}`)
            try {
              const headersObject: Record<string, string> = {}
              res.headers.forEach((value, key) => {
                headersObject[key] = value
              })
              console.log('📡 Response headers:', headersObject)
            } catch {}
          }
          if (res.status === 429) {
            const retryAfter = res.headers.get('retry-after')
            const backoff = retryAfter ? parseInt(retryAfter) * 1000 : 400 * Math.pow(2, attempt)
            if (this.debug) console.log(`⏳ Rate limited, waiting ${backoff}ms`)
            await new Promise(r=>setTimeout(r, backoff))
            continue
          }
          if (!res.ok) {
            const errorText = await res.text().catch(()=>'')
            const error = this.handleApiError(res.status, res.statusText, errorText)
            if (this.debug) {
              console.error('❌ API Error:', error.message)
              if (errorText) console.error('❌ Raw response:', errorText.slice(0, 500))
            }
            throw error
          }
          const data: { choices?: Array<{ message?: { content?: string } }>; usage?: unknown } = await res.json()
          if (!data?.choices?.[0]?.message?.content) {
            const err = new Error(`Invalid response structure: ${JSON.stringify(data).slice(0, 400)}`)
            if (this.debug) console.error('❌ Invalid response:', err.message)
            throw err
          }
          const value: { content: string; usage?: unknown; cost: number } = {
            content: data.choices[0].message.content,
            usage: data?.usage,
            cost: this.calculateCost(data?.usage),
          }
          if (this.debug) {
            console.log('✅ Success! Content length:', value.content.length)
            if (value.usage) console.log('📊 Usage:', value.usage)
            console.log('💰 Cost:', value.cost)
          }
          PerplexityService.memoryCache.set(key, { expiresAt: Date.now() + PerplexityService.defaultTtlMs, value })
          return value
        } catch (e: unknown) {
          lastErr = e
          const msg = (e as Error)?.message || String(e)
          if (this.debug) console.error(`❌ Attempt ${attempt + 1} failed:`, msg)
          if (msg.includes('401') || msg.includes('403')) break
          if (attempt === maxRetries - 1) break
          const backoff = 400 * Math.pow(2, attempt)
          if (this.debug) console.log(`⏳ Retrying in ${backoff}ms...`)
          await new Promise(r=>setTimeout(r, backoff))
        }
      }
      throw lastErr || new Error('Perplexity request failed')
    })()

    PerplexityService.inflightRequests.set(key, requestPromise)
    try {
      return await requestPromise
    } finally {
      PerplexityService.inflightRequests.delete(key)
    }
  }

  // Convenience wrapper: choose sonar vs sonar-pro
  async chat(userPrompt: string, options: { model?: 'sonar' | 'sonar-pro'; maxTokens?: number; temperature?: number } = {}) {
    const system = options.model === 'sonar' ? 'You are a fast search assistant.' : 'You are an analytical research assistant.'
    return this.makeRequest(system, userPrompt, { model: options.model || this.defaultModel, maxTokens: options.maxTokens, temperature: options.temperature })
  }

  private calculateCost(usage: unknown): number {
    if (!usage) return 0
    const u = usage as Record<string, unknown>
    const promptTokens = Number((u as Record<string, unknown>).prompt_tokens as number ?? 0)
    const completionTokens = Number((u as Record<string, unknown>).completion_tokens as number ?? 0)
    const inputCost = (promptTokens / 1_000_000) * 3
    const outputCost = (completionTokens / 1_000_000) * 15
    return inputCost + outputCost
  }

  private makeCacheKey(system: string, user: string, options: unknown): string {
    // dynamic import is not allowed in sync context; fall back to require typed as unknown
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cryptoMod: typeof import('crypto') = require('crypto')
    const h = cryptoMod.createHash('sha256').update(system + '\n' + user + '\n' + JSON.stringify(options || {})).digest('hex')
    return `ppx:${h}`
  }

  // Health & validation
  async healthCheck(): Promise<{ status: 'healthy'|'degraded'|'unhealthy'; details: { apiKey: boolean; connectivity: boolean; model: string; cacheSize: number; responseTime?: number; error?: string } }> {
    const details = { apiKey: !!this.apiKey, connectivity: false, model: this.defaultModel, cacheSize: PerplexityService.memoryCache.size }
    if (!this.apiKey) return { status: 'unhealthy', details: { ...details, error: 'Missing API key' } }
    try {
      const started = Date.now()
      const res = await this.makeRequest('You are a health check assistant.', 'Respond with exactly: "OK"', { maxTokens: 10, temperature: 0 })
      const rt = Date.now() - started
      const ok = res.content.trim().toLowerCase().includes('ok')
      return { status: ok && rt < 5000 ? 'healthy' : 'degraded', details: { ...details, connectivity: true, responseTime: rt } }
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'health failed'
      return { status: 'unhealthy', details: { ...details, error: msg } }
    }
  }

  validateApiKey(): boolean {
    if (!this.apiKey) { console.error('❌ PERPLEXITY_API_KEY is missing'); return false }
    if (!this.apiKey.startsWith('pplx-')) { console.error('❌ Invalid API key format - should start with "pplx-"'); return false }
    if (this.apiKey.length < 20) { console.error('❌ API key seems too short'); return false }
    return true
  }

  static getCacheStats() {
    const stats = { totalEntries: this.memoryCache.size, entriesByAge: { fresh: 0, stale: 0 }, totalSize: 0 }
    const now = Date.now()
    this.memoryCache.forEach((entry) => {
      const age = now - (entry.expiresAt - this.defaultTtlMs)
      if (age < this.defaultTtlMs / 2) stats.entriesByAge.fresh++
      else stats.entriesByAge.stale++
      try { stats.totalSize += JSON.stringify(entry.value).length } catch {}
    })
    return stats
  }

  static clearCache(): number { const size = this.memoryCache.size; this.memoryCache.clear(); return size }

  async testRequest(): Promise<void> {
    console.log('🧪 Testing Perplexity API connection...')
    const result = await this.makeRequest('You are a test assistant.', 'Say "Connection successful" if you can read this.', { maxTokens: 50, temperature: 0 })
    console.log('✅ Test successful!')
    console.log('📝 Response:', (result.content || '').slice(0, 400))
    console.log('💰 Cost:', result.cost)
  }

  private handleApiError(status: number, statusText: string, body: string): Error {
    switch (status) {
      case 401: return new Error('Invalid API key - check your PERPLEXITY_API_KEY')
      case 403: return new Error('API access forbidden - check your account status')
      case 429: return new Error('Rate limit exceeded - please wait before making more requests')
      case 500: return new Error('Perplexity server error - please try again later')
      case 503: return new Error('Perplexity service unavailable - please try again later')
      default: return new Error(`Perplexity API error: ${status} ${statusText} - ${body}`)
    }
  }
}


