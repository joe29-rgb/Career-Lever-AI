/**
 * Enterprise Company Research Service
 * 
 * Centralized company data management with:
 * - CRUD operations with caching
 * - Data enrichment and validation
 * - Cache expiration handling
 * - Error handling and logging
 */

import { Types } from 'mongoose'
import CompanyData, { ICompanyData, ICompanyNews } from '@/models/CompanyData'
import { dbService } from '@/lib/database'
import { dbLogger, logger } from '@/lib/logger'
import { InputValidator } from '@/lib/validation'

export interface CreateCompanyDataDTO {
  companyName: string
  website?: string
  industry?: string
  size?: string
  description?: string
  culture?: string[]
  benefits?: string[]
  recentNews?: Array<{
    title: string
    url: string
    publishedAt: Date
    summary: string
  }>
  glassdoorRating?: number
  glassdoorReviews?: number
  hiringContacts?: Array<{
    name: string
    title: string
    profileUrl?: string
    source: string
  }>
  contactInfo?: {
    emails: string[]
    phones: string[]
    addresses: string[]
  }
  googleReviewsRating?: number
  googleReviewsCount?: number
  cacheExpiryDays?: number
}

export interface UpdateCompanyDataDTO {
  website?: string
  industry?: string
  size?: string
  description?: string
  culture?: string[]
  benefits?: string[]
  recentNews?: Array<{
    title: string
    url: string
    publishedAt: Date
    summary: string
  }>
  glassdoorRating?: number
  glassdoorReviews?: number
  hiringContacts?: Array<{
    name: string
    title: string
    profileUrl?: string
    source: string
  }>
  contactInfo?: {
    emails: string[]
    phones: string[]
    addresses: string[]
  }
  googleReviewsRating?: number
  googleReviewsCount?: number
}

export interface CompanySearchOptions {
  limit?: number
  skip?: number
  industry?: string
  includeExpired?: boolean
}

class CompanyService {
  private static instance: CompanyService

  private constructor() {}

  static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService()
    }
    return CompanyService.instance
  }

  /**
   * Create or update company data (upsert)
   */
  async upsertCompanyData(data: CreateCompanyDataDTO): Promise<ICompanyData> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      // Validate input
      this.validateCompanyData(data)

      // Sanitize inputs
      const sanitizedData: any = {
        companyName: InputValidator.sanitizeText(data.companyName),
        website: data.website ? InputValidator.sanitizeText(data.website) : undefined,
        industry: data.industry ? InputValidator.sanitizeText(data.industry) : undefined,
        size: data.size ? InputValidator.sanitizeText(data.size) : undefined,
        description: data.description ? InputValidator.sanitizeText(data.description, 50000) : undefined,
        culture: data.culture?.map(c => InputValidator.sanitizeText(c)),
        benefits: data.benefits?.map(b => InputValidator.sanitizeText(b)),
        glassdoorRating: data.glassdoorRating,
        glassdoorReviews: data.glassdoorReviews,
        googleReviewsRating: data.googleReviewsRating,
        googleReviewsCount: data.googleReviewsCount,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + (data.cacheExpiryDays || 7) * 24 * 60 * 60 * 1000)
      }

      // Sanitize news
      if (data.recentNews) {
        sanitizedData.recentNews = data.recentNews.map(news => ({
          title: InputValidator.sanitizeText(news.title),
          url: InputValidator.sanitizeText(news.url),
          publishedAt: news.publishedAt,
          summary: InputValidator.sanitizeText(news.summary, 10000)
        }))
      }

      // Sanitize hiring contacts
      if (data.hiringContacts) {
        sanitizedData.hiringContacts = data.hiringContacts.map(contact => ({
          name: InputValidator.sanitizeText(contact.name),
          title: InputValidator.sanitizeText(contact.title),
          profileUrl: contact.profileUrl ? InputValidator.sanitizeText(contact.profileUrl) : undefined,
          source: InputValidator.sanitizeText(contact.source)
        }))
      }

      // Sanitize contact info
      if (data.contactInfo) {
        sanitizedData.contactInfo = {
          emails: data.contactInfo.emails.map(e => InputValidator.sanitizeText(e)),
          phones: data.contactInfo.phones.map(p => InputValidator.sanitizeText(p)),
          addresses: data.contactInfo.addresses.map(a => InputValidator.sanitizeText(a))
        }
      }

      // Upsert (update if exists, create if not)
      const company = await CompanyData.findOneAndUpdate(
        { companyName: sanitizedData.companyName },
        { $set: sanitizedData },
        { new: true, upsert: true, runValidators: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('UPSERT', 'CompanyData', duration)
      logger.info('Company data upserted successfully', {
        companyId: company._id,
        companyName: data.companyName,
        duration
      })

      return company
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('UPSERT', 'CompanyData', error as Error)
      logger.error('Failed to upsert company data', {
        companyName: data.companyName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      })
      throw error
    }
  }

  /**
   * Get company data by ID
   */
  async getCompanyById(companyId: string): Promise<ICompanyData | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(companyId)) {
        throw new Error('Invalid company ID format')
      }

      const company = await CompanyData.findById(companyId).lean<ICompanyData>().exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_BY_ID', 'CompanyData', duration)

      // Check if cached data is expired
      if (company && new Date() > new Date(company.expiresAt)) {
        logger.warn('Retrieved company data is expired', {
          companyId,
          companyName: company.companyName,
          expiresAt: company.expiresAt
        })
      }

      return company
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_BY_ID', 'CompanyData', error as Error)
      throw error
    }
  }

  /**
   * Get company data by name
   */
  async getCompanyByName(companyName: string, includeExpired = false): Promise<ICompanyData | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      const query: any = { 
        companyName: new RegExp(`^${companyName}$`, 'i') 
      }

      // Optionally filter out expired data
      if (!includeExpired) {
        query.expiresAt = { $gt: new Date() }
      }

      const company = await CompanyData.findOne(query).lean<ICompanyData>().exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_BY_NAME', 'CompanyData', duration)

      if (!company) {
        logger.debug('Company not found in cache', { companyName })
      }

      return company
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_BY_NAME', 'CompanyData', error as Error)
      throw error
    }
  }

  /**
   * Search companies by various criteria
   */
  async searchCompanies(
    searchTerm: string,
    options: CompanySearchOptions = {}
  ): Promise<ICompanyData[]> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      const {
        limit = 50,
        skip = 0,
        industry,
        includeExpired = false
      } = options

      const searchRegex = new RegExp(searchTerm, 'i')
      const query: any = {
        $or: [
          { companyName: searchRegex },
          { industry: searchRegex },
          { description: searchRegex }
        ]
      }

      if (industry) {
        query.industry = new RegExp(industry, 'i')
      }

      if (!includeExpired) {
        query.expiresAt = { $gt: new Date() }
      }

      const companies = await CompanyData.find(query)
        .sort({ cachedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ICompanyData[]>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('SEARCH', 'CompanyData', duration)
      logger.debug(`Found ${companies.length} companies matching search`, {
        searchTerm,
        count: companies.length,
        duration
      })

      return companies
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('SEARCH', 'CompanyData', error as Error)
      throw error
    }
  }

  /**
   * Update company data
   */
  async updateCompanyData(
    companyId: string,
    data: UpdateCompanyDataDTO
  ): Promise<ICompanyData | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(companyId)) {
        throw new Error('Invalid company ID format')
      }

      // Sanitize inputs
      const updateData: any = {}

      if (data.website) {
        if (!InputValidator.validateURL(data.website)) {
          throw new Error('Invalid website URL format')
        }
        updateData.website = InputValidator.sanitizeText(data.website)
      }
      if (data.industry) {
        updateData.industry = InputValidator.sanitizeText(data.industry)
      }
      if (data.size) {
        updateData.size = InputValidator.sanitizeText(data.size)
      }
      if (data.description) {
        updateData.description = InputValidator.sanitizeText(data.description, 50000)
      }
      if (data.culture) {
        updateData.culture = data.culture.map(c => InputValidator.sanitizeText(c))
      }
      if (data.benefits) {
        updateData.benefits = data.benefits.map(b => InputValidator.sanitizeText(b))
      }
      if (data.glassdoorRating !== undefined) {
        updateData.glassdoorRating = data.glassdoorRating
      }
      if (data.glassdoorReviews !== undefined) {
        updateData.glassdoorReviews = data.glassdoorReviews
      }
      if (data.googleReviewsRating !== undefined) {
        updateData.googleReviewsRating = data.googleReviewsRating
      }
      if (data.googleReviewsCount !== undefined) {
        updateData.googleReviewsCount = data.googleReviewsCount
      }

      if (data.recentNews) {
        updateData.recentNews = data.recentNews.map(news => ({
          title: InputValidator.sanitizeText(news.title),
          url: InputValidator.sanitizeText(news.url),
          publishedAt: news.publishedAt,
          summary: InputValidator.sanitizeText(news.summary, 10000)
        }))
      }

      if (data.hiringContacts) {
        updateData.hiringContacts = data.hiringContacts.map(contact => ({
          name: InputValidator.sanitizeText(contact.name),
          title: InputValidator.sanitizeText(contact.title),
          profileUrl: contact.profileUrl ? InputValidator.sanitizeText(contact.profileUrl) : undefined,
          source: InputValidator.sanitizeText(contact.source)
        }))
      }

      if (data.contactInfo) {
        updateData.contactInfo = {
          emails: data.contactInfo.emails.map(e => InputValidator.sanitizeText(e)),
          phones: data.contactInfo.phones.map(p => InputValidator.sanitizeText(p)),
          addresses: data.contactInfo.addresses.map(a => InputValidator.sanitizeText(a))
        }
      }

      // Update cache timestamp
      updateData.cachedAt = new Date()

      const company = await CompanyData.findByIdAndUpdate(
        companyId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('UPDATE', 'CompanyData', duration)
      logger.info('Company data updated successfully', {
        companyId,
        duration
      })

      return company
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('UPDATE', 'CompanyData', error as Error)
      logger.error('Failed to update company data', {
        companyId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Delete company data
   */
  async deleteCompanyData(companyId: string): Promise<boolean> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(companyId)) {
        throw new Error('Invalid company ID format')
      }

      const result = await CompanyData.findByIdAndDelete(companyId).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('DELETE', 'CompanyData', duration)
      logger.info('Company data deleted successfully', {
        companyId,
        duration
      })

      return !!result
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('DELETE', 'CompanyData', error as Error)
      logger.error('Failed to delete company data', {
        companyId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Refresh cache expiry for a company
   */
  async refreshCache(companyId: string, expiryDays = 7): Promise<ICompanyData | null> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      if (!Types.ObjectId.isValid(companyId)) {
        throw new Error('Invalid company ID format')
      }

      const company = await CompanyData.findByIdAndUpdate(
        companyId,
        {
          $set: {
            cachedAt: new Date(),
            expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
          }
        },
        { new: true }
      ).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('REFRESH_CACHE', 'CompanyData', duration)
      logger.info('Company cache refreshed', {
        companyId,
        expiryDays,
        duration
      })

      return company
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('REFRESH_CACHE', 'CompanyData', error as Error)
      throw error
    }
  }

  /**
   * Get all expired company data
   */
  async getExpiredCompanies(limit = 100): Promise<ICompanyData[]> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      const companies = await CompanyData.find({
        expiresAt: { $lt: new Date() }
      })
        .sort({ expiresAt: 1 })
        .limit(limit)
        .lean<ICompanyData[]>()
        .exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('FIND_EXPIRED', 'CompanyData', duration)
      logger.debug(`Found ${companies.length} expired companies`, {
        count: companies.length,
        duration
      })

      return companies
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('FIND_EXPIRED', 'CompanyData', error as Error)
      throw error
    }
  }

  /**
   * Check if company data is cached and fresh
   */
  async isCachedAndFresh(companyName: string): Promise<boolean> {
    const startTime = Date.now()

    try {
      const company = await this.getCompanyByName(companyName, false)
      
      const duration = Date.now() - startTime
      logger.debug('Cache freshness check', {
        companyName,
        isFresh: !!company,
        duration
      })

      return !!company
    } catch (error) {
      logger.error('Failed to check cache freshness', {
        companyName,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Count total companies in database
   */
  async countCompanies(includeExpired = false): Promise<number> {
    const startTime = Date.now()

    try {
      await dbService.connect()

      const query = includeExpired ? {} : { expiresAt: { $gt: new Date() } }
      const count = await CompanyData.countDocuments(query).exec()

      const duration = Date.now() - startTime
      dbLogger.dbQuery('COUNT', 'CompanyData', duration)

      return count
    } catch (error) {
      const duration = Date.now() - startTime
      dbLogger.dbError('COUNT', 'CompanyData', error as Error)
      throw error
    }
  }

  /**
   * Validate company data
   */
  private validateCompanyData(data: CreateCompanyDataDTO): void {
    if (!data.companyName || data.companyName.trim().length === 0) {
      throw new Error('companyName is required')
    }

    if (data.website && !InputValidator.validateURL(data.website)) {
      throw new Error('Invalid website URL format')
    }

    if (data.glassdoorRating !== undefined && (data.glassdoorRating < 1 || data.glassdoorRating > 5)) {
      throw new Error('glassdoorRating must be between 1 and 5')
    }

    if (data.googleReviewsRating !== undefined && (data.googleReviewsRating < 1 || data.googleReviewsRating > 5)) {
      throw new Error('googleReviewsRating must be between 1 and 5')
    }

    if (data.contactInfo?.emails) {
      for (const email of data.contactInfo.emails) {
        if (!InputValidator.validateEmail(email)) {
          throw new Error(`Invalid email format: ${email}`)
        }
      }
    }
  }
}

// Export singleton instance
export const companyService = CompanyService.getInstance()

