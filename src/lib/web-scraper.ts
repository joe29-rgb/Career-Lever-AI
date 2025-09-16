import puppeteer, { Browser, Page } from 'puppeteer';
import { CompanyData } from '@/types';

export interface ScrapedCompanyData {
  companyName: string;
  website?: string;
  industry?: string;
  size?: string;
  description?: string;
  culture?: string[];
  benefits?: string[];
  recentNews?: Array<{
    title: string;
    url: string;
    publishedAt: Date;
    summary: string;
  }>;
  glassdoorRating?: number;
  glassdoorReviews?: number;
  linkedinData?: {
    companyPage: string;
    employeeCount?: number;
    followers?: number;
    recentPosts?: Array<{
      content: string;
      postedAt: Date;
      engagement: number;
    }>;
  };
  socialMedia?: {
    twitter?: {
      handle: string;
      followers: number;
      recentTweets: Array<{
        text: string;
        createdAt: Date;
        likes: number;
        retweets: number;
      }>;
    };
    facebook?: {
      pageUrl: string;
      followers: number;
      recentPosts: Array<{
        content: string;
        postedAt: Date;
        reactions: number;
      }>;
    };
    instagram?: {
      handle: string;
      followers: number;
      recentPosts: Array<{
        caption: string;
        postedAt: Date;
        likes: number;
        comments: number;
      }>;
    };
  };
}

export class WebScraperService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeCompanyData(companyName: string, website?: string): Promise<ScrapedCompanyData> {
    if (!this.browser) {
      await this.initialize();
    }

    const data: ScrapedCompanyData = {
      companyName,
      website,
    };

    try {
      // Scrape multiple sources in parallel
      const [glassdoorData, linkedinData, websiteData, newsData] = await Promise.allSettled([
        this.scrapeGlassdoorData(companyName),
        this.scrapeLinkedInData(companyName),
        website ? this.scrapeCompanyWebsite(website) : Promise.resolve(null),
        this.scrapeNewsData(companyName)
      ]);

      // Merge the data
      if (glassdoorData.status === 'fulfilled' && glassdoorData.value) {
        data.glassdoorRating = glassdoorData.value.rating;
        data.glassdoorReviews = glassdoorData.value.reviews;
        data.culture = glassdoorData.value.culture;
        data.benefits = glassdoorData.value.benefits;
      }

      if (linkedinData.status === 'fulfilled' && linkedinData.value) {
        data.linkedinData = linkedinData.value;
        if (!data.industry && linkedinData.value.industry) {
          data.industry = linkedinData.value.industry;
        }
        if (!data.size && linkedinData.value.size) {
          data.size = linkedinData.value.size;
        }
      }

      if (websiteData.status === 'fulfilled' && websiteData.value) {
        data.description = websiteData.value.description;
        if (!data.industry && websiteData.value.industry) {
          data.industry = websiteData.value.industry;
        }
      }

      if (newsData.status === 'fulfilled' && newsData.value) {
        data.recentNews = newsData.value;
      }

      // Generate fallback data if we don't have enough info
      if (!data.culture || data.culture.length === 0) {
        data.culture = this.generateFallbackCulture(companyName);
      }

      if (!data.benefits || data.benefits.length === 0) {
        data.benefits = this.generateFallbackBenefits();
      }

      if (!data.description) {
        data.description = this.generateFallbackDescription(companyName);
      }

    } catch (error) {
      console.error('Error scraping company data:', error);
      // Return basic data with fallbacks
      return {
        companyName,
        website,
        culture: this.generateFallbackCulture(companyName),
        benefits: this.generateFallbackBenefits(),
        description: this.generateFallbackDescription(companyName),
      };
    }

    return data;
  }

  private async scrapeGlassdoorData(companyName: string): Promise<{
    rating?: number;
    reviews?: number;
    culture?: string[];
    benefits?: string[];
  } | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      const searchUrl = `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-reviews-SRCH_KE0,${companyName.length}.htm`;

      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      // Wait for content to load
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        const result: any = {};

        // Get overall rating
        const ratingElement = document.querySelector('[data-test="rating-info"] .css-1cw89uz');
        if (ratingElement) {
          const ratingText = ratingElement.textContent?.trim();
          if (ratingText) {
            const rating = parseFloat(ratingText);
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
              result.rating = rating;
            }
          }
        }

        // Get number of reviews
        const reviewsElement = document.querySelector('[data-test="rating-info"] .css-1cw89uz + span');
        if (reviewsElement) {
          const reviewsText = reviewsElement.textContent?.trim();
          if (reviewsText) {
            const reviewsMatch = reviewsText.match(/([\d,]+)\s*reviews?/i);
            if (reviewsMatch) {
              result.reviews = parseInt(reviewsMatch[1].replace(/,/g, ''));
            }
          }
        }

        // Get company culture insights
        const cultureElements = document.querySelectorAll('.css-1cw89uz');
        const culture: string[] = [];
        cultureElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 10 && text.length < 100) {
            culture.push(text);
          }
        });
        if (culture.length > 0) {
          result.culture = culture.slice(0, 5);
        }

        // Get benefits if available
        const benefitElements = document.querySelectorAll('[data-test*="benefit"], .benefit, .perk');
        const benefits: string[] = [];
        benefitElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 3 && text.length < 50) {
            benefits.push(text);
          }
        });
        if (benefits.length > 0) {
          result.benefits = benefits.slice(0, 8);
        }

        return result;
      });

      return data;
    } catch (error) {
      console.error('Glassdoor scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeLinkedInData(companyName: string): Promise<{
    companyPage: string;
    employeeCount?: number;
    followers?: number;
    industry?: string;
    size?: string;
    recentPosts?: Array<{
      content: string;
      postedAt: Date;
      engagement: number;
    }>;
  } | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      const searchUrl = `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '')}`;

      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      const data = await page.evaluate(() => {
        const result: any = {
          companyPage: window.location.href
        };

        // Get follower count
        const followerSelectors = [
          '.org-top-card-summary-info-list__info-item',
          '[data-test-id="company-followers-count"]',
          '.org-top-card-summary__follower-count'
        ];

        for (const selector of followerSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text) {
              const followerMatch = text.match(/([\d,]+)\s*(?:followers?|people)/i);
              if (followerMatch) {
                result.followers = parseInt(followerMatch[1].replace(/,/g, ''));
                break;
              }
            }
          }
        }

        // Get employee count
        const employeeSelectors = [
          '.org-about-company-module__company-size',
          '[data-test-id="company-employees-count"]',
          '.org-about-company-module__company-staff-count-range'
        ];

        for (const selector of employeeSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text) {
              const employeeMatch = text.match(/([\d,]+)(?:\s*-\s*([\d,]+))?\s*employees?/i);
              if (employeeMatch) {
                result.employeeCount = employeeMatch[2]
                  ? (parseInt(employeeMatch[1].replace(/,/g, '')) + parseInt(employeeMatch[2].replace(/,/g, ''))) / 2
                  : parseInt(employeeMatch[1].replace(/,/g, ''));
                break;
              }
            }
          }
        }

        // Get industry and size info
        const infoElements = document.querySelectorAll('.org-page-details__definition-text, .org-about-company-module__company-size');
        infoElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text) {
            // Try to identify industry
            if (!result.industry && text.length > 3 && text.length < 30) {
              result.industry = text;
            }
            // Try to identify company size
            if (!result.size && text.match(/\d+/)) {
              result.size = text;
            }
          }
        });

        return result;
      });

      return data;
    } catch (error) {
      console.error('LinkedIn scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeCompanyWebsite(website: string): Promise<{
    description?: string;
    industry?: string;
  } | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      await page.goto(website, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      // Wait for content to load
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        const result: any = {};

        // Get meta description
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) {
          const description = descriptionMeta.getAttribute('content')?.trim();
          if (description && description.length > 50) {
            result.description = description;
          }
        }

        // Get about text from common selectors
        if (!result.description) {
          const aboutSelectors = [
            '[class*="about"]',
            '[id*="about"]',
            '.about-us',
            '#about',
            '[class*="mission"]',
            '[class*="company"]'
          ];

          for (const selector of aboutSelectors) {
            const elements = document.querySelectorAll(`${selector} p, ${selector} div`);
            let text = '';

            elements.forEach(el => {
              const content = el.textContent?.trim();
              if (content && content.length > 20) {
                text += content + ' ';
                if (text.length > 500) return;
              }
            });

            if (text.length > 100) {
              result.description = text.substring(0, 500);
              break;
            }
          }
        }

        // Try to infer industry from content
        const bodyText = document.body.textContent || '';
        const industryKeywords = {
          'technology': ['software', 'tech', 'digital', 'app', 'platform', 'saas'],
          'healthcare': ['health', 'medical', 'patient', 'care', 'clinical'],
          'finance': ['financial', 'banking', 'investment', 'wealth', 'capital'],
          'retail': ['retail', 'shopping', 'store', 'product', 'consumer'],
          'consulting': ['consulting', 'advisory', 'strategy', 'management'],
          'education': ['education', 'learning', 'training', 'student', 'academic']
        };

        for (const [industry, keywords] of Object.entries(industryKeywords)) {
          const matches = keywords.filter(keyword =>
            bodyText.toLowerCase().includes(keyword.toLowerCase())
          );
          if (matches.length >= 2) {
            result.industry = industry.charAt(0).toUpperCase() + industry.slice(1);
            break;
          }
        }

        return result;
      });

      return data;
    } catch (error) {
      console.error('Website scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private async scrapeNewsData(companyName: string): Promise<Array<{
    title: string;
    url: string;
    publishedAt: Date;
    summary: string;
  }> | null> {
    if (!this.browser) return null;

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Use Google News search
      const searchQuery = encodeURIComponent(`${companyName} company news`);
      const newsUrl = `https://www.google.com/search?q=${searchQuery}&tbm=nws&tbs=qdr:m`;

      await page.goto(newsUrl, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      const newsData = await page.evaluate(() => {
        const articles: Array<{
          title: string;
          url: string;
          publishedAt: Date;
          summary: string;
        }> = [];

        // Google News selectors
        const newsItems = document.querySelectorAll('[data-ved], .WlydOe');

        newsItems.forEach((item, index) => {
          if (index >= 5) return; // Limit to 5 news items

          const titleElement = item.querySelector('h3, .mCBkyc');
          const linkElement = item.querySelector('a[href]');
          const summaryElement = item.querySelector('.GI74Re, .c0cFT, .s3v9rd');
          const dateElement = item.querySelector('.OSrXXb, .eNg7of, .f');

          if (titleElement && linkElement) {
            const title = titleElement.textContent?.trim();
            const url = linkElement.getAttribute('href');
            const summary = summaryElement?.textContent?.trim() || '';
            const dateText = dateElement?.textContent?.trim();

            if (title && url) {
              articles.push({
                title,
                url: url.startsWith('http') ? url : `https://news.google.com${url}`,
                publishedAt: dateText ? new Date(dateText) : new Date(),
                summary: summary || title
              });
            }
          }
        });

        return articles.filter(article => article.title.length > 10);
      });

      return newsData.length > 0 ? newsData : null;
    } catch (error) {
      console.error('News scraping error:', error);
      return null;
    } finally {
      await page.close();
    }
  }

  private generateFallbackCulture(companyName: string): string[] {
    // Generate generic but positive culture descriptions
    const cultures = [
      'Collaborative and innovative work environment',
      'Focus on employee development and growth',
      'Work-life balance and flexible arrangements',
      'Diverse and inclusive workplace culture',
      'Strong emphasis on teamwork and communication',
      'Commitment to excellence and quality',
      'Supportive leadership and mentorship programs'
    ];

    // Return 3-4 random cultures
    const shuffled = cultures.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }

  private generateFallbackBenefits(): string[] {
    return [
      'Health, dental, and vision insurance',
      '401k matching program',
      'Flexible work arrangements',
      'Professional development budget',
      'Paid time off and holidays',
      'Wellness and fitness programs',
      'Modern office facilities'
    ];
  }

  private generateFallbackDescription(companyName: string): string {
    return `${companyName} is a dynamic organization committed to delivering innovative solutions and exceptional service. We foster a collaborative environment where talented individuals can grow professionally while contributing to meaningful projects that make a positive impact.`;
  }
}

// Export a singleton instance
export const webScraper = new WebScraperService();

