export type Plan = 'free' | 'pro' | 'company'

export function isAllowed(required: Plan, current: Plan): boolean {
  const order: Plan[] = ['free','pro','company']
  return order.indexOf(current) >= order.indexOf(required)
}

export function clampByPlan<T extends number>(plan: Plan, value: T, freeMax: T, proMax: T): T {
  if (plan === 'company') return value
  if (plan === 'pro') return (value > proMax ? proMax : value) as T
  return (value > freeMax ? freeMax : value) as T
}


