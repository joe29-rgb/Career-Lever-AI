/**
 * TOP CANADIAN COMPANIES FOR CAREER PAGE SCRAPING
 * 
 * Top 100 Canadian companies with active job postings
 * These are the primary sources for fresh job data
 */

export interface CompanyCareerPage {
  name: string
  careerUrl: string
  industry: string
  location: string
  atsType?: 'greenhouse' | 'lever' | 'workable' | 'smartrecruiters' | 'custom'
}

export const TOP_CANADIAN_COMPANIES: CompanyCareerPage[] = [
  // Tech & Fintech
  { name: 'Shopify', careerUrl: 'https://www.shopify.com/careers', industry: 'Tech', location: 'Toronto', atsType: 'greenhouse' },
  { name: 'Wealthsimple', careerUrl: 'https://www.wealthsimple.com/en-ca/careers', industry: 'Fintech', location: 'Toronto', atsType: 'greenhouse' },
  { name: 'Lightspeed', careerUrl: 'https://www.lightspeedhq.com/careers/', industry: 'Tech', location: 'Montreal', atsType: 'greenhouse' },
  { name: 'Hootsuite', careerUrl: 'https://careers.hootsuite.com/', industry: 'Tech', location: 'Vancouver', atsType: 'greenhouse' },
  { name: 'Ritual', careerUrl: 'https://ritual.co/careers', industry: 'Health Tech', location: 'Toronto', atsType: 'greenhouse' },
  
  // Banks & Financial Services
  { name: 'RBC', careerUrl: 'https://jobs.rbc.com/ca/en', industry: 'Banking', location: 'Toronto', atsType: 'custom' },
  { name: 'TD Bank', careerUrl: 'https://jobs.td.com/', industry: 'Banking', location: 'Toronto', atsType: 'custom' },
  { name: 'BMO', careerUrl: 'https://jobs.bmo.com/ca/en', industry: 'Banking', location: 'Toronto', atsType: 'custom' },
  { name: 'Scotiabank', careerUrl: 'https://jobs.scotiabank.com/', industry: 'Banking', location: 'Toronto', atsType: 'custom' },
  { name: 'CIBC', careerUrl: 'https://cibc.wd3.myworkdayjobs.com/campus', industry: 'Banking', location: 'Toronto', atsType: 'custom' },
  
  // Telecommunications
  { name: 'Bell Canada', careerUrl: 'https://jobs.bell.ca/', industry: 'Telecom', location: 'Montreal', atsType: 'custom' },
  { name: 'Rogers', careerUrl: 'https://jobs.rogers.com/', industry: 'Telecom', location: 'Toronto', atsType: 'custom' },
  { name: 'Telus', careerUrl: 'https://www.telus.com/en/careers', industry: 'Telecom', location: 'Vancouver', atsType: 'custom' },
  { name: 'Shaw Communications', careerUrl: 'https://careers.shaw.ca/', industry: 'Telecom', location: 'Calgary', atsType: 'custom' },
  
  // Retail & E-commerce
  { name: 'Loblaws', careerUrl: 'https://careers.loblaw.ca/', industry: 'Retail', location: 'Toronto', atsType: 'custom' },
  { name: 'Canadian Tire', careerUrl: 'https://jobs.canadiantire.ca/', industry: 'Retail', location: 'Toronto', atsType: 'custom' },
  { name: 'Sobeys', careerUrl: 'https://careers.sobeys.com/', industry: 'Retail', location: 'Halifax', atsType: 'custom' },
  { name: 'Metro', careerUrl: 'https://www.metro.ca/en/careers', industry: 'Retail', location: 'Montreal', atsType: 'custom' },
  
  // Energy & Resources
  { name: 'Suncor', careerUrl: 'https://www.suncor.com/en-ca/careers', industry: 'Energy', location: 'Calgary', atsType: 'custom' },
  { name: 'Enbridge', careerUrl: 'https://www.enbridge.com/careers', industry: 'Energy', location: 'Calgary', atsType: 'custom' },
  { name: 'TC Energy', careerUrl: 'https://www.tcenergy.com/careers/', industry: 'Energy', location: 'Calgary', atsType: 'custom' },
  { name: 'Cenovus', careerUrl: 'https://www.cenovus.com/careers', industry: 'Energy', location: 'Calgary', atsType: 'custom' },
  
  // Manufacturing & Industrial
  { name: 'Magna International', careerUrl: 'https://www.magna.com/careers', industry: 'Manufacturing', location: 'Toronto', atsType: 'custom' },
  { name: 'Bombardier', careerUrl: 'https://careers.bombardier.com/', industry: 'Aerospace', location: 'Montreal', atsType: 'custom' },
  { name: 'CAE', careerUrl: 'https://www.cae.com/careers/', industry: 'Aerospace', location: 'Montreal', atsType: 'custom' },
  
  // Healthcare & Pharma
  { name: 'Apotex', careerUrl: 'https://www.apotex.com/ca/en/careers', industry: 'Pharma', location: 'Toronto', atsType: 'custom' },
  { name: 'Bausch Health', careerUrl: 'https://www.bauschhealth.com/careers', industry: 'Pharma', location: 'Montreal', atsType: 'custom' },
  
  // Insurance
  { name: 'Manulife', careerUrl: 'https://jobs.manulife.com/', industry: 'Insurance', location: 'Toronto', atsType: 'custom' },
  { name: 'Sun Life', careerUrl: 'https://www.sunlife.ca/en/careers/', industry: 'Insurance', location: 'Toronto', atsType: 'custom' },
  { name: 'Great-West Lifeco', careerUrl: 'https://www.greatwestlifeco.com/careers.html', industry: 'Insurance', location: 'Winnipeg', atsType: 'custom' },
  
  // Transportation & Logistics
  { name: 'Air Canada', careerUrl: 'https://jobs.aircanada.com/', industry: 'Airlines', location: 'Montreal', atsType: 'custom' },
  { name: 'WestJet', careerUrl: 'https://www.westjet.com/en-ca/careers', industry: 'Airlines', location: 'Calgary', atsType: 'custom' },
  { name: 'CN Rail', careerUrl: 'https://www.cn.ca/en/careers/', industry: 'Transportation', location: 'Montreal', atsType: 'custom' },
  { name: 'CP Rail', careerUrl: 'https://www.cpr.ca/en/careers', industry: 'Transportation', location: 'Calgary', atsType: 'custom' },
  
  // Real Estate & Construction
  { name: 'Brookfield Asset Management', careerUrl: 'https://www.brookfield.com/careers', industry: 'Real Estate', location: 'Toronto', atsType: 'custom' },
  { name: 'SNC-Lavalin', careerUrl: 'https://www.snclavalin.com/en/careers', industry: 'Engineering', location: 'Montreal', atsType: 'custom' },
  { name: 'EllisDon', careerUrl: 'https://www.ellisdon.com/careers', industry: 'Construction', location: 'Toronto', atsType: 'custom' },
  
  // Media & Entertainment
  { name: 'CBC', careerUrl: 'https://cbc.radio-canada.ca/en/work-with-us', industry: 'Media', location: 'Toronto', atsType: 'custom' },
  { name: 'Corus Entertainment', careerUrl: 'https://www.corusent.com/careers/', industry: 'Media', location: 'Toronto', atsType: 'custom' },
  
  // Professional Services
  { name: 'Deloitte Canada', careerUrl: 'https://www2.deloitte.com/ca/en/pages/careers/articles/careers.html', industry: 'Consulting', location: 'Toronto', atsType: 'custom' },
  { name: 'PwC Canada', careerUrl: 'https://www.pwc.com/ca/en/careers.html', industry: 'Consulting', location: 'Toronto', atsType: 'custom' },
  { name: 'EY Canada', careerUrl: 'https://www.ey.com/en_ca/careers', industry: 'Consulting', location: 'Toronto', atsType: 'custom' },
  { name: 'KPMG Canada', careerUrl: 'https://home.kpmg/ca/en/home/careers.html', industry: 'Consulting', location: 'Toronto', atsType: 'custom' },
  
  // More Tech Companies
  { name: 'OpenText', careerUrl: 'https://www.opentext.com/about/careers', industry: 'Tech', location: 'Waterloo', atsType: 'custom' },
  { name: 'BlackBerry', careerUrl: 'https://www.blackberry.com/us/en/company/careers', industry: 'Tech', location: 'Waterloo', atsType: 'custom' },
  { name: 'CGI', careerUrl: 'https://www.cgi.com/en/careers', industry: 'Tech', location: 'Montreal', atsType: 'custom' },
  { name: 'D2L', careerUrl: 'https://www.d2l.com/careers/', industry: 'EdTech', location: 'Kitchener', atsType: 'custom' },
]

export function getTopCompanies(): CompanyCareerPage[] {
  return TOP_CANADIAN_COMPANIES
}
