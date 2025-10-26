export interface ContactEmail {
  email: string
  type: 'general' | 'hr' | 'recruiting' | 'sales' | 'support'
  source: string
  confidence: number
  verified?: boolean
}

export interface ContactPhone {
  number: string
  type: 'main' | 'hr' | 'recruiting' | 'sales' | 'support'
  source: string
  extension?: string
}

export interface ContactAddress {
  street?: string
  city: string
  province: string
  postal?: string
  country?: string
  type: 'headquarters' | 'office' | 'branch'
}

export interface ContactSocialMedia {
  linkedin?: string
  twitter?: string
  facebook?: string
  instagram?: string
  youtube?: string
}

export interface CompanyContacts {
  emails: ContactEmail[]
  phones: ContactPhone[]
  addresses: ContactAddress[]
  socialMedia?: ContactSocialMedia
}

export interface ContactResearchRequest {
  companyName: string
  companyWebsite?: string
}

export interface ContactResearchResponse {
  success: boolean
  data: CompanyContacts
  meta: {
    confidence: number
    researchedAt: string
  }
  error?: string
}
