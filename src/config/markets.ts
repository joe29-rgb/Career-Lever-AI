/**
 * Market Configuration for Bulk Job Downloads
 * 
 * Defines which markets and cities to download jobs from
 */

export interface MarketCity {
  name: string
  radius: number // km
  enabled: boolean
}

export interface Market {
  country: string
  countryCode: string
  enabled: boolean
  cities: MarketCity[]
}

export const MARKETS: Record<string, Market> = {
  canada: {
    country: 'Canada',
    countryCode: 'CA',
    enabled: true,
    cities: [
      { name: 'Edmonton, AB', radius: 150, enabled: true }, // TESTING
      { name: 'Calgary, AB', radius: 150, enabled: false },
      { name: 'Vancouver, BC', radius: 100, enabled: false },
      { name: 'Toronto, ON', radius: 100, enabled: false },
      { name: 'Montreal, QC', radius: 100, enabled: false },
      { name: 'Ottawa, ON', radius: 100, enabled: false },
      { name: 'Winnipeg, MB', radius: 150, enabled: false },
      { name: 'Quebec City, QC', radius: 100, enabled: false },
      { name: 'Hamilton, ON', radius: 75, enabled: false },
      { name: 'Kitchener, ON', radius: 75, enabled: false }
    ]
  },
  usa: {
    country: 'United States',
    countryCode: 'US',
    enabled: false, // Launch later
    cities: [
      { name: 'New York, NY', radius: 50, enabled: false },
      { name: 'San Francisco, CA', radius: 50, enabled: false },
      { name: 'Seattle, WA', radius: 50, enabled: false },
      { name: 'Austin, TX', radius: 75, enabled: false },
      { name: 'Boston, MA', radius: 50, enabled: false },
      { name: 'Chicago, IL', radius: 50, enabled: false },
      { name: 'Los Angeles, CA', radius: 75, enabled: false },
      { name: 'Denver, CO', radius: 75, enabled: false },
      { name: 'Portland, OR', radius: 50, enabled: false },
      { name: 'Atlanta, GA', radius: 75, enabled: false }
    ]
  }
}

/**
 * Get all enabled cities across all markets
 */
export function getEnabledCities(): Array<{ city: string; radius: number; country: string; countryCode: string }> {
  const cities: Array<{ city: string; radius: number; country: string; countryCode: string }> = []
  
  for (const market of Object.values(MARKETS)) {
    if (!market.enabled) continue
    
    for (const city of market.cities) {
      if (city.enabled) {
        cities.push({
          city: city.name,
          radius: city.radius,
          country: market.country,
          countryCode: market.countryCode
        })
      }
    }
  }
  
  return cities
}

/**
 * Get cities for a specific market
 */
export function getCitiesForMarket(marketKey: string): MarketCity[] {
  const market = MARKETS[marketKey]
  if (!market || !market.enabled) return []
  
  return market.cities.filter(c => c.enabled)
}

/**
 * Enable/disable a city
 */
export function toggleCity(marketKey: string, cityName: string, enabled: boolean): boolean {
  const market = MARKETS[marketKey]
  if (!market) return false
  
  const city = market.cities.find(c => c.name === cityName)
  if (!city) return false
  
  city.enabled = enabled
  return true
}

/**
 * Enable/disable an entire market
 */
export function toggleMarket(marketKey: string, enabled: boolean): boolean {
  const market = MARKETS[marketKey]
  if (!market) return false
  
  market.enabled = enabled
  return true
}
