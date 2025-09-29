export class PerplexityService {
  private readonly apiKey: string
  private readonly baseURL = (process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai') + '/chat/completions'
  private readonly defaultModel = process.env.PERPLEXITY_MODEL || 'sonar-pro'

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
    const res = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature ?? 0.2,
      }),
    })
    if (!res.ok) {
      throw new Error(`Perplexity API error: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    return {
      content: data?.choices?.[0]?.message?.content || '',
      usage: data?.usage,
      cost: this.calculateCost(data?.usage),
    }
  }

  private calculateCost(usage: any): number {
    if (!usage) return 0
    const inputCost = (Number(usage.prompt_tokens || 0) / 1_000_000) * 3
    const outputCost = (Number(usage.completion_tokens || 0) / 1_000_000) * 15
    return inputCost + outputCost
  }
}


