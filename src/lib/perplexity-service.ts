export class PerplexityService {
  private readonly apiKey: string
  private readonly baseURL = (process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai') + '/chat/completions'
  private readonly defaultModel = process.env.PERPLEXITY_MODEL || 'sonar-pro'
  private static memoryCache: Map<string, { expiresAt: number; value: any }> = new Map()
  private static defaultTtlMs = Number(process.env.PPX_CACHE_TTL_MS || 24*60*60*1000)

  constructor(apiKey?: string) {
    const key = apiKey || process.env.PERPLEXITY_API_KEY
    if (!key) throw new Error('PERPLEXITY_API_KEY missing')
    this.apiKey = key
  }

  async makeRequest(
    systemPrompt: string,
    userPrompt: string,
    options: { maxTokens?: number; temperature?: number; model?: string } = {}
  ): Promise<{ content: string; usage?: any; cost: number }> {
    const key = this.makeCacheKey(systemPrompt, userPrompt, options)
    const cached = PerplexityService.memoryCache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const payload = {
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.2,
    }

    const doFetch = async () => fetch(this.baseURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const maxRetries = 3
    let lastErr: any
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await doFetch()
        if (res.status === 429) {
          const backoff = 400 * Math.pow(2, attempt)
          await new Promise(r=>setTimeout(r, backoff))
          continue
        }
        if (!res.ok) {
          throw new Error(`Perplexity API error: ${res.status} ${res.statusText}`)
        }
        const data = await res.json()
        const value = {
          content: data?.choices?.[0]?.message?.content || '',
          usage: data?.usage,
          cost: this.calculateCost(data?.usage),
        }
        PerplexityService.memoryCache.set(key, { expiresAt: Date.now() + PerplexityService.defaultTtlMs, value })
        return value
      } catch (e: any) {
        lastErr = e
        if (attempt === maxRetries - 1) break
        const backoff = 400 * Math.pow(2, attempt)
        await new Promise(r=>setTimeout(r, backoff))
      }
    }
    throw lastErr || new Error('Perplexity request failed')
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0
    const inputCost = (Number(usage.prompt_tokens || 0) / 1_000_000) * 3
    const outputCost = (Number(usage.completion_tokens || 0) / 1_000_000) * 15
    return inputCost + outputCost
  }

  private makeCacheKey(system: string, user: string, options: any): string {
    const cryptoMod = require('crypto') as typeof import('crypto')
    const h = cryptoMod.createHash('sha256').update(system + '\n' + user + '\n' + JSON.stringify(options || {})).digest('hex')
    return `ppx:${h}`
  }
}


