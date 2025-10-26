export function isFeatureEnabled(name: string): boolean {
  const raw = (process.env.FEATURE_FLAGS || '').toLowerCase()
  if (!raw) return false
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  return parts.includes(name.toLowerCase())
}


