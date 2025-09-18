export type Locale = 'en' | 'fr'

const en = {
  app: {
    title: 'Career Lever AI',
  },
  jobs: {
    pageTitle: 'Jobs',
    importUrl: 'Import job from URL',
    recommendations: 'Recommendations',
  }
}

const fr = {
  app: {
    title: 'Career Lever AI',
  },
  jobs: {
    pageTitle: 'Emplois',
    importUrl: "Importer l'offre via URL",
    recommendations: 'Recommandations',
  }
}

export const dictionaries: Record<Locale, any> = { en, fr }

export function t(locale: Locale, path: string, fallback?: string): string {
  const parts = path.split('.')
  let cur: any = dictionaries[locale] || dictionaries.en
  for (const p of parts) {
    cur = cur?.[p]
    if (cur === undefined || cur === null) return fallback ?? path
  }
  return typeof cur === 'string' ? cur : fallback ?? path
}


