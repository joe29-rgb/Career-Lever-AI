let client: any = null

export async function getRedis() {
  if (client) return client
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    const { createClient } = require('redis')
    client = createClient({ url })
    client.on('error', () => {})
    await client.connect()
    return client
  } catch {
    return null
  }
}

export async function redisGetJSON<T = any>(key: string): Promise<T | undefined> {
  const r = await getRedis()
  if (!r) return undefined
  try {
    const raw = await r.get(key)
    return raw ? JSON.parse(raw) as T : undefined
  } catch {
    return undefined
  }
}

export async function redisSetJSON(key: string, value: any, ttlSec: number) {
  const r = await getRedis()
  if (!r) return
  try { await r.setEx(key, ttlSec, JSON.stringify(value)) } catch {}
}


