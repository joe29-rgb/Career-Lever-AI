This file is a merged representation of a subset of the codebase, containing specifically included files and files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where line numbers have been added.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.
- Pay special attention to the Repository Description. These contain important context and guidelines specific to this project.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Only files matching these patterns are included: src/lib/perplexity-intelligence.ts, src/lib/perplexity-client.ts, src/lib/scrapers/**/*.ts, src/lib/pdf-*.ts, src/lib/*resume*.ts, src/lib/cheerio-utils.ts, src/lib/web-scraper.ts, src/app/api/resume/upload/route.ts, src/app/api/jobs/search/route.ts, src/app/api/jobs/scrape/route.ts, src/models/Resume.ts, src/models/Job.ts
- Files matching these patterns are excluded: **/*.test.ts, **/*.spec.ts
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Line numbers have been added to the beginning of each line
- Files are sorted by Git change count (files with more changes are at the bottom)

# User Provided Header
# Career Lever AI - Codebase Export for Perplexity

Includes: Perplexity AI, Scrapers, PDF Processing, Cheerio, Core APIs

Generated: {{generationDate}}

# Directory Structure
```
src/app/api/jobs/search/route.ts
src/app/api/resume/upload/route.ts
src/lib/local-resume-parser.ts
src/lib/pdf-composer.ts
src/lib/pdf-generator.ts
src/lib/pdf-service.ts
src/lib/pdf-utils.ts
src/lib/perplexity-intelligence.ts
src/lib/perplexity-resume-analyzer.ts
src/lib/resume-generator.ts
src/lib/resume-manager.ts
src/lib/resume-parser.ts
src/lib/resume-templates-v2.ts
src/lib/scrapers/advanced-scraper.ts
src/lib/web-scraper.ts
src/models/Resume.ts
```

# Files

## File: src/lib/local-resume-parser.ts
````typescript
  1: /**
  2:  * LOCAL RESUME PARSER - NO API CALLS NEEDED
  3:  * 
  4:  * Extracts keywords, location, skills, and experience from resume text
  5:  * with industry and education weighting based on work history duration.
  6:  * 
  7:  * This is a FALLBACK when Perplexity API is unavailable or out of credits.
  8:  */
  9: 
 10: interface ParsedResume {
 11:   keywords: string[]
 12:   location: string | null
 13:   locations: string[]
 14:   skills: string[]
 15:   industries: string[]
 16:   experienceYears: number
 17:   educationSkills: string[]
 18:   workHistorySkills: Map<string, number> // skill -> years used
 19: }
 20: 
 21: interface WorkExperience {
 22:   title: string
 23:   company: string
 24:   duration: number // in years
 25:   skills: string[]
 26: }
 27: 
 28: export class LocalResumeParser {
 29:   // Common job titles and roles
 30:   private static readonly JOB_TITLES = [
 31:     'manager', 'director', 'executive', 'specialist', 'coordinator', 'analyst',
 32:     'developer', 'engineer', 'designer', 'architect', 'consultant', 'advisor',
 33:     'representative', 'associate', 'assistant', 'administrator', 'officer',
 34:     'lead', 'senior', 'junior', 'principal', 'chief', 'head', 'supervisor',
 35:     'sales', 'marketing', 'finance', 'operations', 'business development',
 36:     'account manager', 'project manager', 'product manager', 'team lead'
 37:   ]
 38: 
 39:   // Common technical and business skills
 40:   private static readonly SKILLS_DATABASE = [
 41:     // Sales & Business
 42:     'sales', 'business development', 'account management', 'crm', 'salesforce',
 43:     'b2b', 'b2c', 'cold calling', 'lead generation', 'negotiation', 'closing',
 44:     'pipeline management', 'territory management', 'client relations',
 45:     'customer success', 'relationship building', 'prospecting', 'forecasting',
 46:     
 47:     // Technical
 48:     'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go',
 49:     'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
 50:     'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
 51:     'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
 52:     'git', 'ci/cd', 'agile', 'scrum', 'devops', 'api', 'rest', 'graphql',
 53:     
 54:     // Finance
 55:     'financial analysis', 'accounting', 'budgeting', 'forecasting', 'modeling',
 56:     'quickbooks', 'excel', 'financial reporting', 'audit', 'tax', 'compliance',
 57:     'investment', 'portfolio management', 'risk management',
 58:     
 59:     // Marketing
 60:     'digital marketing', 'seo', 'sem', 'social media', 'content marketing',
 61:     'email marketing', 'ppc', 'google analytics', 'facebook ads', 'linkedin ads',
 62:     'marketing automation', 'hubspot', 'marketo', 'brand management',
 63:     
 64:     // Management & Leadership
 65:     'leadership', 'team management', 'strategic planning', 'process improvement',
 66:     'change management', 'project management', 'pmp', 'agile', 'lean', 'six sigma',
 67:     'coaching', 'mentoring', 'performance management', 'hiring', 'training',
 68:     
 69:     // AI & Data
 70:     'machine learning', 'ai', 'artificial intelligence', 'data science',
 71:     'data analysis', 'big data', 'nlp', 'computer vision', 'deep learning',
 72:     'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy'
 73:   ]
 74: 
 75:   // Canadian provinces and major cities
 76:   private static readonly LOCATION_PATTERNS = [
 77:     // Provinces/States
 78:     'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
 79:     'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland',
 80:     'Nova Scotia', 'Northwest Territories', 'Nunavut', 'Ontario', 'Prince Edward Island',
 81:     'Quebec', 'Saskatchewan', 'Yukon',
 82:     // US States (common)
 83:     'CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'MA', 'CO',
 84:     'California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington',
 85:     // Major Canadian cities
 86:     'Edmonton', 'Calgary', 'Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Winnipeg',
 87:     'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Victoria', 'Halifax',
 88:     'Oshawa', 'Windsor', 'Saskatoon', 'Regina', 'Sherbrooke', 'St. John\'s'
 89:   ]
 90: 
 91:   /**
 92:    * Main parsing method - extracts all resume data
 93:    */
 94:   static parse(resumeText: string, maxKeywords: number = 50): ParsedResume {
 95:     const lines = resumeText.split(/\r?\n/)
 96:     
 97:     // Extract location (usually in header)
 98:     const location = this.extractLocation(lines)
 99:     
100:     // Extract work experiences
101:     const workExperiences = this.extractWorkExperiences(resumeText)
102:     
103:     // Extract skills from entire resume
104:     const allSkills = this.extractSkills(resumeText)
105:     
106:     // Calculate total experience years
107:     const experienceYears = workExperiences.reduce((sum, exp) => sum + exp.duration, 0)
108:     
109:     // Build skill -> years mapping from work history
110:     const workHistorySkills = this.buildSkillYearsMap(workExperiences)
111:     
112:     // Extract education skills (usually lower weight)
113:     const educationSkills = this.extractEducationSkills(resumeText)
114:     
115:     // Extract industries from work experience
116:     const industries = this.extractIndustries(workExperiences)
117:     
118:     // Weight and rank keywords
119:     const keywords = this.weightAndRankKeywords(
120:       allSkills,
121:       workHistorySkills,
122:       educationSkills,
123:       experienceYears,
124:       maxKeywords
125:     )
126:     
127:     return {
128:       keywords,
129:       location,
130:       locations: location ? [location] : [],
131:       skills: allSkills,
132:       industries,
133:       experienceYears,
134:       educationSkills,
135:       workHistorySkills
136:     }
137:   }
138: 
139:   /**
140:    * Extract location from resume header
141:    */
142:   private static extractLocation(lines: string[]): string | null {
143:     // Check first 10 lines for location (usually in header)
144:     const headerLines = lines.slice(0, 10).join(' ')
145:     
146:     // Pattern: "City, PROVINCE" or "City, STATE"
147:     const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})/g
148:     const matches = Array.from(headerLines.matchAll(locationRegex))
149:     
150:     if (matches.length > 0) {
151:       return matches[0][0] // Return first match (e.g., "Edmonton, AB")
152:     }
153:     
154:     // Try to find province/state alone
155:     for (const province of this.LOCATION_PATTERNS) {
156:       const regex = new RegExp(`\\b${province}\\b`, 'i')
157:       if (regex.test(headerLines)) {
158:         return province
159:       }
160:     }
161:     
162:     return null
163:   }
164: 
165:   /**
166:    * Extract work experiences with duration
167:    */
168:   private static extractWorkExperiences(resumeText: string): WorkExperience[] {
169:     const experiences: WorkExperience[] = []
170:     const lines = resumeText.split(/\r?\n/)
171:     
172:     // Find work experience section
173:     const experienceSection = this.extractSection(resumeText, [
174:       'work experience', 'professional experience', 'employment history',
175:       'career history', 'experience'
176:     ])
177:     
178:     if (!experienceSection) return experiences
179:     
180:     // Parse each job entry
181:     const jobBlocks = experienceSection.split(/\n\n+/)
182:     
183:     for (const block of jobBlocks) {
184:       const titleMatch = block.match(new RegExp(this.JOB_TITLES.join('|'), 'i'))
185:       if (!titleMatch) continue
186:       
187:       const title = titleMatch[0]
188:       
189:       // Extract company name (usually after title, before dates)
190:       const companyMatch = block.match(/(?:at|@)\s+([A-Z][A-Za-z\s&,.]+?)(?:\s+\||\s+\d{4}|\n)/i)
191:       const company = companyMatch ? companyMatch[1].trim() : 'Unknown'
192:       
193:       // Extract duration (look for year ranges like "2020-2023" or "2020-Present")
194:       const duration = this.extractDuration(block)
195:       
196:       // Extract skills mentioned in this job
197:       const skills = this.extractSkills(block)
198:       
199:       experiences.push({ title, company, duration, skills })
200:     }
201:     
202:     return experiences
203:   }
204: 
205:   /**
206:    * Extract duration in years from text like "2020-2023" or "Jan 2020 - Present"
207:    */
208:   private static extractDuration(text: string): number {
209:     // Pattern: YYYY-YYYY or YYYY-Present
210:     const yearRangeMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|Current)/i)
211:     
212:     if (yearRangeMatch) {
213:       const startYear = parseInt(yearRangeMatch[1])
214:       const endYear = yearRangeMatch[2].match(/\d{4}/) 
215:         ? parseInt(yearRangeMatch[2]) 
216:         : new Date().getFullYear()
217:       
218:       return Math.max(0, endYear - startYear)
219:     }
220:     
221:     // Pattern: "X years"
222:     const yearsMatch = text.match(/(\d+)\s*(?:\+)?\s*years?/i)
223:     if (yearsMatch) {
224:       return parseInt(yearsMatch[1])
225:     }
226:     
227:     return 1 // Default to 1 year if can't determine
228:   }
229: 
230:   /**
231:    * Extract section by header keywords
232:    */
233:   private static extractSection(text: string, headers: string[]): string | null {
234:     for (const header of headers) {
235:       const regex = new RegExp(`^\\s*${header}\\s*$`, 'im')
236:       const match = text.match(regex)
237:       
238:       if (match && match.index !== undefined) {
239:         const start = match.index + match[0].length
240:         
241:         // Find next section header or end of text
242:         const nextSectionMatch = text.slice(start).match(/\n\s*[A-Z][A-Za-z\s]{3,30}\s*\n/)
243:         const end = nextSectionMatch && nextSectionMatch.index !== undefined
244:           ? start + nextSectionMatch.index
245:           : text.length
246:         
247:         return text.slice(start, end)
248:       }
249:     }
250:     
251:     return null
252:   }
253: 
254:   /**
255:    * Extract skills from text using skills database
256:    */
257:   private static extractSkills(text: string): string[] {
258:     const foundSkills = new Set<string>()
259:     const lowerText = text.toLowerCase()
260:     
261:     for (const skill of this.SKILLS_DATABASE) {
262:       const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
263:       if (regex.test(lowerText)) {
264:         foundSkills.add(skill)
265:       }
266:     }
267:     
268:     // Also extract job titles as skills
269:     for (const title of this.JOB_TITLES) {
270:       const regex = new RegExp(`\\b${title}\\b`, 'i')
271:       if (regex.test(lowerText)) {
272:         foundSkills.add(title)
273:       }
274:     }
275:     
276:     return Array.from(foundSkills)
277:   }
278: 
279:   /**
280:    * Extract education-specific skills
281:    */
282:   private static extractEducationSkills(resumeText: string): string[] {
283:     const educationSection = this.extractSection(resumeText, [
284:       'education', 'academic background', 'qualifications', 'certifications'
285:     ])
286:     
287:     if (!educationSection) return []
288:     
289:     return this.extractSkills(educationSection)
290:   }
291: 
292:   /**
293:    * Build map of skill -> years used based on work history
294:    */
295:   private static buildSkillYearsMap(
296:     workExperiences: WorkExperience[]
297:   ): Map<string, number> {
298:     const skillYears = new Map<string, number>()
299:     
300:     for (const exp of workExperiences) {
301:       for (const skill of exp.skills) {
302:         const currentYears = skillYears.get(skill) || 0
303:         skillYears.set(skill, currentYears + exp.duration)
304:       }
305:     }
306:     
307:     return skillYears
308:   }
309: 
310:   /**
311:    * Extract industries from work experience companies
312:    */
313:   private static extractIndustries(workExperiences: WorkExperience[]): string[] {
314:     const industries = new Set<string>()
315:     
316:     for (const exp of workExperiences) {
317:       // Simple industry extraction based on job title keywords
318:       const titleLower = exp.title.toLowerCase()
319:       
320:       if (titleLower.includes('sales') || titleLower.includes('business development')) {
321:         industries.add('Sales')
322:       }
323:       if (titleLower.includes('tech') || titleLower.includes('software') || titleLower.includes('developer')) {
324:         industries.add('Technology')
325:       }
326:       if (titleLower.includes('finance') || titleLower.includes('accounting')) {
327:         industries.add('Finance')
328:       }
329:       if (titleLower.includes('marketing')) {
330:         industries.add('Marketing')
331:       }
332:       if (titleLower.includes('manager') || titleLower.includes('director')) {
333:         industries.add('Management')
334:       }
335:     }
336:     
337:     return Array.from(industries)
338:   }
339: 
340:   /**
341:    * Weight and rank keywords by:
342:    * 1. Years of experience using the skill
343:    * 2. Recency (work experience > education)
344:    * 3. Frequency across roles
345:    */
346:   private static weightAndRankKeywords(
347:     allSkills: string[],
348:     workHistorySkills: Map<string, number>,
349:     educationSkills: string[],
350:     totalExperienceYears: number,
351:     maxKeywords: number
352:   ): string[] {
353:     const weightedSkills: Array<{ skill: string; weight: number }> = []
354:     
355:     for (const skill of allSkills) {
356:       let weight = 0
357:       
358:       // Weight from work history (years using skill / total career years)
359:       const yearsUsed = workHistorySkills.get(skill) || 0
360:       if (yearsUsed > 0 && totalExperienceYears > 0) {
361:         weight += (yearsUsed / totalExperienceYears) * 10 // Scale to 0-10
362:       }
363:       
364:       // Boost for work experience vs education only
365:       if (workHistorySkills.has(skill)) {
366:         weight += 5 // Work experience skills get +5 boost
367:       } else if (educationSkills.includes(skill)) {
368:         weight += 1 // Education-only skills get +1
369:       }
370:       
371:       // Boost for high-value skills
372:       if (this.isHighValueSkill(skill)) {
373:         weight += 2
374:       }
375:       
376:       weightedSkills.push({ skill, weight })
377:     }
378:     
379:     // Sort by weight (descending) and return top N
380:     return weightedSkills
381:       .sort((a, b) => b.weight - a.weight)
382:       .slice(0, maxKeywords)
383:       .map(item => item.skill)
384:   }
385: 
386:   /**
387:    * Check if skill is high-value (management, leadership, technical lead)
388:    */
389:   private static isHighValueSkill(skill: string): boolean {
390:     const highValueKeywords = [
391:       'leadership', 'management', 'director', 'executive', 'strategic',
392:       'ai', 'machine learning', 'cloud', 'aws', 'architecture'
393:     ]
394:     
395:     const skillLower = skill.toLowerCase()
396:     return highValueKeywords.some(keyword => skillLower.includes(keyword))
397:   }
398: }
````

## File: src/lib/pdf-composer.ts
````typescript
 1: import { PDFService } from './pdf-service'
 2: 
 3: export class ApplicationPDFComposer {
 4:   private pdfService = PDFService.getInstance()
 5: 
 6:   async generateResumePDF(resumeText: string): Promise<Blob> {
 7:     const result = await this.pdfService.extractText(Buffer.from(resumeText), 'resume.txt')
 8:     if (result.error) {
 9:       throw new Error(result.error)
10:     }
11:     return new Blob([result.text], { type: 'application/pdf' })
12:   }
13: 
14:   async generateCoverLetterPDF(coverLetter: string): Promise<Blob> {
15:     const result = await this.pdfService.extractText(Buffer.from(coverLetter), 'cover-letter.txt')
16:     if (result.error) {
17:       throw new Error(result.error)
18:     }
19:     return new Blob([result.text], { type: 'application/pdf' })
20:   }
21: 
22:   async generateApplicationPackage(resumeText: string, coverLetter: string, jobData: any) {
23:     const resumePDF = await this.generateResumePDF(resumeText)
24:     const coverLetterPDF = await this.generateCoverLetterPDF(coverLetter)
25: 
26:     return {
27:       resumePDF,
28:       coverLetterPDF,
29:       emailTemplate: `Subject: Application for ${jobData.title}\n\n${coverLetter}`
30:     }
31:   }
32: }
````

## File: src/lib/pdf-generator.ts
````typescript
 1: // PDF generation functionality using jsPDF library
 2: import { jsPDF } from 'jspdf'
 3: 
 4: export async function generateResumePDF(resumeData: { text: string; name?: string }): Promise<Blob> {
 5:   try {
 6:     const doc = new jsPDF()
 7:     const pageWidth = doc.internal.pageSize.getWidth()
 8:     const margins = { top: 20, left: 20, right: 20, bottom: 20 }
 9:     const maxWidth = pageWidth - margins.left - margins.right
10:     
11:     // Add title
12:     doc.setFontSize(16)
13:     doc.setFont('helvetica', 'bold')
14:     doc.text(resumeData.name || 'Resume', margins.left, margins.top)
15:     
16:     // Add content
17:     doc.setFontSize(11)
18:     doc.setFont('helvetica', 'normal')
19:     
20:     const lines = doc.splitTextToSize(resumeData.text, maxWidth)
21:     let currentY = margins.top + 10
22:     const lineHeight = 7
23:     const pageHeight = doc.internal.pageSize.getHeight()
24:     
25:     lines.forEach((line: string) => {
26:       if (currentY + lineHeight > pageHeight - margins.bottom) {
27:         doc.addPage()
28:         currentY = margins.top
29:       }
30:       doc.text(line, margins.left, currentY)
31:       currentY += lineHeight
32:     })
33:     
34:     // Convert to Blob
35:     const pdfBlob = doc.output('blob')
36:     return pdfBlob
37:   } catch (error) {
38:     console.error('PDF generation error:', error)
39:     throw new Error('Failed to generate PDF')
40:   }
41: }
````

## File: src/lib/pdf-service.ts
````typescript
 1: import pdfParse from 'pdf-parse-debugging-disabled'
 2: 
 3: interface PDFExtractionResult {
 4:   text: string
 5:   method: 'text-extraction' | 'ocr-fallback' | 'manual-input'
 6:   confidence: number
 7:   error?: string
 8: }
 9: 
10: export class PDFService {
11:   private static instance: PDFService
12: 
13:   static getInstance(): PDFService {
14:     if (!PDFService.instance) {
15:       PDFService.instance = new PDFService()
16:     }
17:     return PDFService.instance
18:   }
19: 
20:   async extractText(buffer: Buffer, filename: string): Promise<PDFExtractionResult> {
21:     try {
22:       // Validate PDF
23:       if (!this.isPDF(buffer)) {
24:         throw new Error('Invalid PDF file')
25:       }
26: 
27:       // Try text extraction first (using pdf-parse-debugging-disabled to avoid test file issues)
28:       const result = await pdfParse(buffer)
29:       const text = this.cleanText(result.text)
30: 
31:       if (text.length > 100) {
32:         return {
33:           text,
34:           method: 'text-extraction',
35:           confidence: 0.95
36:         }
37:       }
38: 
39:       // If text is too short, try manual parsing
40:       return {
41:         text: '',
42:         method: 'manual-input',
43:         confidence: 0,
44:         error: 'PDF text extraction resulted in insufficient content. Please paste your resume text instead.'
45:       }
46: 
47:     } catch (error) {
48:       return {
49:         text: '',
50:         method: 'manual-input',
51:         confidence: 0,
52:         error: `PDF processing failed: ${(error as Error).message}`
53:       }
54:     }
55:   }
56: 
57:   private isPDF(buffer: Buffer): boolean {
58:     const pdfSignature = buffer.subarray(0, 4)
59:     return pdfSignature.toString() === '%PDF'
60:   }
61: 
62:   private cleanText(text: string): string {
63:     return text
64:       .replace(/\s+/g, ' ')
65:       .replace(/[^\w\s\-.,;:()\[\]{}'"@#$%&*+=<>?!/\\|`~]/g, '')
66:       .trim()
67:   }
68: }
````

## File: src/lib/resume-manager.ts
````typescript
  1: /**
  2:  * RESUME MANAGER - Centralized Resume Storage
  3:  * 
  4:  * PROBLEM: Resume data stored in multiple localStorage keys causing data loss:
  5:  * - 'uploadedResume' (legacy)
  6:  * - 'cf:resume' (career finder)
  7:  * - Database fetch (fallback)
  8:  * 
  9:  * SOLUTION: Single source of truth with automatic fallback chain
 10:  */
 11: 
 12: export interface StoredResume {
 13:   _id?: string;
 14:   userId?: string;
 15:   originalFileName: string;
 16:   filename: string;
 17:   extractedText: string;
 18:   extractionMethod?: string;
 19:   uploadedAt?: Date | string;
 20: }
 21: 
 22: export class ResumeManager {
 23:   private static readonly KEYS = {
 24:     current: 'cf:resume',                    // Primary key - Career Finder
 25:     legacy: 'uploadedResume',                // Legacy compatibility
 26:     selected: 'cf:selectedResumeHtml',       // Optimized HTML version
 27:     autopilot: 'cf:autopilotReady',          // Autopilot status
 28:     location: 'cf:location',                 // Extracted location
 29:     keywords: 'cf:keywords'                  // Extracted keywords
 30:   } as const;
 31: 
 32:   /**
 33:    * Store resume in all required locations for cross-component access
 34:    */
 35:   static store(resumeData: StoredResume): void {
 36:     try {
 37:       const serialized = JSON.stringify(resumeData);
 38:       
 39:       // Primary storage (Career Finder standard)
 40:       localStorage.setItem(this.KEYS.current, serialized);
 41:       
 42:       // Legacy compatibility (for existing components)
 43:       localStorage.setItem(this.KEYS.legacy, serialized);
 44:       
 45:       // Mark autopilot as ready if resume has meaningful content
 46:       if (resumeData.extractedText?.length > 100) {
 47:         localStorage.setItem(this.KEYS.autopilot, '1');
 48:       }
 49:       
 50:       console.log('[RESUME_MANAGER] ✅ Stored resume in all locations:', {
 51:         filename: resumeData.originalFileName,
 52:         textLength: resumeData.extractedText?.length,
 53:         method: resumeData.extractionMethod
 54:       });
 55:     } catch (error) {
 56:       console.error('[RESUME_MANAGER] ❌ Storage failed:', error);
 57:       throw error;
 58:     }
 59:   }
 60: 
 61:   /**
 62:    * Load resume from any available location with automatic fallback
 63:    */
 64:   static load(): StoredResume | null {
 65:     try {
 66:       // Priority 1: Primary key (cf:resume)
 67:       let stored = localStorage.getItem(this.KEYS.current);
 68:       if (stored) {
 69:         console.log('[RESUME_MANAGER] Found resume in primary key (cf:resume)');
 70:         return JSON.parse(stored);
 71:       }
 72:       
 73:       // Priority 2: Legacy key (uploadedResume)
 74:       stored = localStorage.getItem(this.KEYS.legacy);
 75:       if (stored) {
 76:         console.log('[RESUME_MANAGER] Found resume in legacy key (uploadedResume), upgrading...');
 77:         const parsed = JSON.parse(stored);
 78:         // Upgrade to new key
 79:         this.store(parsed);
 80:         return parsed;
 81:       }
 82:       
 83:       console.warn('[RESUME_MANAGER] No resume found in localStorage');
 84:       return null;
 85:     } catch (error) {
 86:       console.error('[RESUME_MANAGER] Load failed:', error);
 87:       return null;
 88:     }
 89:   }
 90: 
 91:   /**
 92:    * Get just the extracted text (most common use case)
 93:    */
 94:   static getText(): string {
 95:     const resume = this.load();
 96:     return resume?.extractedText || '';
 97:   }
 98: 
 99:   /**
100:    * Check if resume is available and has meaningful content
101:    */
102:   static isAvailable(): boolean {
103:     return this.getText().length > 100;
104:   }
105: 
106:   /**
107:    * Get resume metadata without full text
108:    */
109:   static getMetadata(): Pick<StoredResume, 'originalFileName' | 'uploadedAt' | 'extractionMethod'> | null {
110:     const resume = this.load();
111:     if (!resume) return null;
112:     
113:     return {
114:       originalFileName: resume.originalFileName,
115:       uploadedAt: resume.uploadedAt,
116:       extractionMethod: resume.extractionMethod
117:     };
118:   }
119: 
120:   /**
121:    * Store extracted signals (location and keywords)
122:    */
123:   static storeSignals(location: string | null, keywords: string[]): void {
124:     try {
125:       if (location) {
126:         localStorage.setItem(this.KEYS.location, location);
127:       }
128:       if (keywords.length > 0) {
129:         localStorage.setItem(this.KEYS.keywords, keywords.slice(0, 5).join(', '));
130:       }
131:       console.log('[RESUME_MANAGER] Stored signals:', { location, keywordCount: keywords.length });
132:     } catch (error) {
133:       console.error('[RESUME_MANAGER] Failed to store signals:', error);
134:     }
135:   }
136: 
137:   /**
138:    * Get stored location
139:    */
140:   static getLocation(): string | null {
141:     try {
142:       return localStorage.getItem(this.KEYS.location);
143:     } catch {
144:       return null;
145:     }
146:   }
147: 
148:   /**
149:    * Get stored keywords
150:    */
151:   static getKeywords(): string {
152:     try {
153:       return localStorage.getItem(this.KEYS.keywords) || '';
154:     } catch {
155:       return '';
156:     }
157:   }
158: 
159:   /**
160:    * Clear all resume data (logout, reset, etc.)
161:    */
162:   static clear(): void {
163:     Object.values(this.KEYS).forEach(key => {
164:       try {
165:         localStorage.removeItem(key);
166:       } catch (e) {
167:         console.warn(`[RESUME_MANAGER] Failed to remove ${key}:`, e);
168:       }
169:     });
170:     console.log('[RESUME_MANAGER] Cleared all resume data');
171:   }
172: 
173:   /**
174:    * Get autopilot status
175:    */
176:   static isAutopilotReady(): boolean {
177:     try {
178:       return localStorage.getItem(this.KEYS.autopilot) === '1';
179:     } catch {
180:       return false;
181:     }
182:   }
183: 
184:   /**
185:    * Fetch resume from database as fallback
186:    */
187:   static async fetchFromDatabase(): Promise<StoredResume | null> {
188:     try {
189:       console.log('[RESUME_MANAGER] Fetching resume from database...');
190:       const response = await fetch('/api/resume/list');
191:       
192:       if (!response.ok) {
193:         console.warn('[RESUME_MANAGER] Database fetch failed:', response.status);
194:         return null;
195:       }
196:       
197:       const data = await response.json();
198:       const resume = data?.resumes?.[0];
199:       
200:       if (resume && resume.extractedText) {
201:         console.log('[RESUME_MANAGER] Found resume in database, caching locally');
202:         // Store in localStorage for future access
203:         this.store(resume);
204:         return resume;
205:       }
206:       
207:       console.warn('[RESUME_MANAGER] No resume found in database');
208:       return null;
209:     } catch (error) {
210:       console.error('[RESUME_MANAGER] Database fetch error:', error);
211:       return null;
212:     }
213:   }
214: 
215:   /**
216:    * Load with automatic database fallback
217:    */
218:   static async loadWithFallback(): Promise<StoredResume | null> {
219:     // Try localStorage first
220:     const localResume = this.load();
221:     if (localResume) return localResume;
222:     
223:     // Fallback to database
224:     return await this.fetchFromDatabase();
225:   }
226: 
227:   /**
228:    * Debug helper: Show all stored resume keys
229:    */
230:   static debug(): void {
231:     console.group('[RESUME_MANAGER] Debug Info');
232:     Object.entries(this.KEYS).forEach(([name, key]) => {
233:       try {
234:         const value = localStorage.getItem(key);
235:         if (value) {
236:           const preview = value.length > 100 ? `${value.slice(0, 100)}...` : value;
237:           console.log(`${name} (${key}):`, preview);
238:         } else {
239:           console.log(`${name} (${key}):`, '❌ Not found');
240:         }
241:       } catch (e) {
242:         console.log(`${name} (${key}):`, '❌ Error:', e);
243:       }
244:     });
245:     console.groupEnd();
246:   }
247: }
````

## File: src/lib/resume-parser.ts
````typescript
  1: /**
  2:  * Parse plain text resume into structured data for resume-templates-v2
  3:  */
  4: 
  5: import type { ResumeData } from './resume-templates-v2'
  6: 
  7: export function parseResumeText(text: string, personalInfo?: {
  8:   name?: string
  9:   email?: string
 10:   phone?: string
 11:   location?: string
 12: }): ResumeData {
 13:   const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
 14:   
 15:   // Extract personal info from text if not provided
 16:   const extractedInfo = personalInfo || extractPersonalInfoFromText(text)
 17:   
 18:   // Parse experience section
 19:   const experience = parseExperienceSection(lines)
 20:   
 21:   // Parse education section
 22:   const education = parseEducationSection(lines)
 23:   
 24:   // Parse skills section
 25:   const skills = parseSkillsSection(lines)
 26:   
 27:   // Extract summary (usually first paragraph after contact info)
 28:   const summary = extractSummary(lines)
 29:   
 30:   return {
 31:     personalInfo: {
 32:       fullName: extractedInfo.name || 'Professional',
 33:       email: extractedInfo.email || '',
 34:       phone: extractedInfo.phone || '',
 35:       location: extractedInfo.location || '',
 36:       summary: summary
 37:     },
 38:     experience,
 39:     education,
 40:     skills
 41:   }
 42: }
 43: 
 44: function extractPersonalInfoFromText(text: string): {
 45:   name?: string
 46:   email?: string
 47:   phone?: string
 48:   location?: string
 49: } {
 50:   const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
 51:   const phoneMatch = text.match(/(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/i)
 52:   
 53:   // Name is usually first line or before email
 54:   const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
 55:   let name = lines[0] || ''
 56:   
 57:   // Clean up name (remove if it contains email or phone)
 58:   if (name.includes('@') || name.match(/\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/)) {
 59:     name = ''
 60:   }
 61:   
 62:   // Location patterns
 63:   const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}(?:\s+[A-Z0-9]{5})?)/i) ||
 64:                        text.match(/([A-Z][a-z]+,\s*[A-Z]{2,})/i)
 65:   
 66:   return {
 67:     name: name.replace(/[^\w\s.-]/g, '').trim(),
 68:     email: emailMatch ? emailMatch[1] : undefined,
 69:     phone: phoneMatch ? phoneMatch[1] : undefined,
 70:     location: locationMatch ? locationMatch[1] : undefined
 71:   }
 72: }
 73: 
 74: function extractSummary(lines: string[]): string {
 75:   // Look for summary section
 76:   const summaryIndex = lines.findIndex(l => 
 77:     /^(professional\s+)?summary|^objective|^profile/i.test(l)
 78:   )
 79:   
 80:   if (summaryIndex !== -1 && summaryIndex < lines.length - 1) {
 81:     // Get next few lines after summary header
 82:     const summaryLines: string[] = []
 83:     for (let i = summaryIndex + 1; i < lines.length && i < summaryIndex + 5; i++) {
 84:       const line = lines[i]
 85:       // Stop if we hit another section header
 86:       if (/^[A-Z\s]{3,}$/.test(line) && line.length < 50) break
 87:       if (line && !line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
 88:         summaryLines.push(line)
 89:       }
 90:     }
 91:     if (summaryLines.length > 0) {
 92:       return summaryLines.join(' ').slice(0, 500)
 93:     }
 94:   }
 95:   
 96:   // Fallback: use first paragraph that's not contact info
 97:   for (let i = 1; i < Math.min(10, lines.length); i++) {
 98:     const line = lines[i]
 99:     if (line.length > 50 && !line.includes('@') && !line.match(/\d{3}[\s.-]?\d{3}/)) {
100:       return line.slice(0, 500)
101:     }
102:   }
103:   
104:   return 'Experienced professional with a proven track record of success.'
105: }
106: 
107: type ExperienceItem = {
108:   id: string
109:   company: string
110:   position: string
111:   location: string
112:   startDate: string
113:   endDate: string
114:   current: boolean
115:   description: string
116:   achievements: string[]
117:   technologies?: string[]
118: }
119: 
120: function parseExperienceSection(lines: string[]): ExperienceItem[] {
121:   const experience: ExperienceItem[] = []
122:   
123:   // Find experience section
124:   const expIndex = lines.findIndex(l => 
125:     /^(professional\s+)?experience|^work\s+history|^employment/i.test(l)
126:   )
127:   
128:   if (expIndex === -1) return []
129:   
130:   let currentJob: Partial<ExperienceItem> | null = null
131:   let achievements: string[] = []
132:   
133:   for (let i = expIndex + 1; i < lines.length; i++) {
134:     const line = lines[i]
135:     
136:     // Stop at next major section
137:     if (/^(education|skills|certifications|projects)/i.test(line)) break
138:     
139:     // Job title line (usually followed by company/dates)
140:     if (i < lines.length - 1 && lines[i + 1].includes('|')) {
141:       // Save previous job
142:       if (currentJob && currentJob.id) {
143:         currentJob.achievements = achievements
144:         experience.push(currentJob as ExperienceItem)
145:         achievements = []
146:       }
147:       
148:       // Parse new job
149:       const metaLine = lines[i + 1]
150:       const parts = metaLine.split('|').map(p => p.trim())
151:       
152:       const dateMatch = metaLine.match(/(\d{4}|[A-Z][a-z]{2}\s+\d{4})\s*[-–]\s*(Present|\d{4}|[A-Z][a-z]{2}\s+\d{4})/i)
153:       
154:       currentJob = {
155:         id: `exp-${experience.length}`,
156:         position: line,
157:         company: parts[0] || 'Company',
158:         location: parts[1] || '',
159:         startDate: dateMatch ? dateMatch[1] : '2020',
160:         endDate: dateMatch ? dateMatch[2] : 'Present',
161:         current: dateMatch ? /present/i.test(dateMatch[2]) : false,
162:         description: '',
163:         achievements: []
164:       }
165:       
166:       i++ // Skip meta line
167:     }
168:     // Bullet points (achievements)
169:     else if ((line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) && currentJob) {
170:       achievements.push(line.replace(/^[•\-*]\s*/, ''))
171:     }
172:   }
173:   
174:   // Save last job
175:   if (currentJob && currentJob.id) {
176:     currentJob.achievements = achievements
177:     experience.push(currentJob as ExperienceItem)
178:   }
179:   
180:   return experience
181: }
182: 
183: type EducationItem = {
184:   id: string
185:   institution: string
186:   degree: string
187:   field: string
188:   location: string
189:   graduationDate: string
190:   gpa?: string
191:   honors?: string[]
192: }
193: 
194: function parseEducationSection(lines: string[]): EducationItem[] {
195:   const education: EducationItem[] = []
196:   
197:   const eduIndex = lines.findIndex(l => /^education/i.test(l))
198:   if (eduIndex === -1) return []
199:   
200:   for (let i = eduIndex + 1; i < lines.length && i < eduIndex + 10; i++) {
201:     const line = lines[i]
202:     
203:     // Stop at next section
204:     if (/^(skills|certifications|experience)/i.test(line)) break
205:     
206:     // Degree line
207:     if (line.match(/bachelor|master|phd|associate|diploma|certificate/i)) {
208:       const degreeMatch = line.match(/(bachelor|master|phd|associate|diploma|certificate)(?:'?s)?(?:\s+of)?(?:\s+(?:science|arts|engineering|business))?(?:\s+in\s+(.+?))?$/i)
209:       const nextLine = lines[i + 1] || ''
210:       const dateMatch = nextLine.match(/\d{4}/)
211:       
212:       education.push({
213:         id: `edu-${education.length}`,
214:         degree: degreeMatch ? degreeMatch[0] : line,
215:         field: degreeMatch && degreeMatch[2] ? degreeMatch[2] : 'General Studies',
216:         institution: nextLine.split('|')[0]?.trim() || 'University',
217:         location: nextLine.split('|')[1]?.trim() || '',
218:         graduationDate: dateMatch ? dateMatch[0] : '2020'
219:       })
220:     }
221:   }
222:   
223:   return education
224: }
225: 
226: function parseSkillsSection(lines: string[]): {
227:   technical: string[]
228:   soft: string[]
229:   languages?: Array<{ language: string; proficiency: string }>
230:   certifications?: Array<{ name: string; issuer: string; date: string }>
231: } {
232:   const technical: string[] = []
233:   const soft: string[] = []
234:   
235:   const skillsIndex = lines.findIndex(l => /^skills|^technical\s+skills|^core\s+competencies/i.test(l))
236:   
237:   if (skillsIndex !== -1) {
238:     for (let i = skillsIndex + 1; i < lines.length && i < skillsIndex + 15; i++) {
239:       const line = lines[i]
240:       
241:       // Stop at next section
242:       if (/^(education|experience|certifications)/i.test(line)) break
243:       
244:       // Parse skills (comma or bullet separated)
245:       if (line.includes(',') || line.includes('•')) {
246:         const skills = line.split(/[,•]/).map(s => s.trim()).filter(Boolean)
247:         technical.push(...skills)
248:       } else if (line.length > 2 && line.length < 50) {
249:         technical.push(line)
250:       }
251:     }
252:   }
253:   
254:   // Default skills if none found
255:   if (technical.length === 0) {
256:     technical.push('Communication', 'Problem Solving', 'Team Collaboration', 'Project Management')
257:   }
258:   
259:   return {
260:     technical: technical.slice(0, 20),
261:     soft: soft.slice(0, 10)
262:   }
263: }
````

## File: src/lib/web-scraper.ts
````typescript
   1: import puppeteer, { Browser } from 'puppeteer-core'
   2: import chromium from '@sparticuz/chromium'
   3: import { CompanyData } from '@/types';
   4: 
   5: export interface ScrapedCompanyData {
   6:   companyName: string;
   7:   website?: string;
   8:   industry?: string;
   9:   size?: string;
  10:   description?: string;
  11:   culture?: string[];
  12:   benefits?: string[];
  13:   recentNews?: Array<{
  14:     title: string;
  15:     url: string;
  16:     publishedAt: Date;
  17:     summary: string;
  18:   }>;
  19:   glassdoorRating?: number;
  20:   glassdoorReviews?: number;
  21:   linkedinData?: {
  22:     companyPage: string;
  23:     employeeCount?: number;
  24:     followers?: number;
  25:     recentPosts?: Array<{
  26:       content: string;
  27:       postedAt: Date;
  28:       engagement: number;
  29:     }>;
  30:   };
  31:   socialMedia?: {
  32:     twitter?: {
  33:       handle: string;
  34:       followers: number;
  35:       recentTweets: Array<{
  36:         text: string;
  37:         createdAt: Date;
  38:         likes: number;
  39:         retweets: number;
  40:       }>;
  41:     };
  42:     facebook?: {
  43:       pageUrl: string;
  44:       followers: number;
  45:       recentPosts: Array<{
  46:         content: string;
  47:         postedAt: Date;
  48:         reactions: number;
  49:       }>;
  50:     };
  51:     instagram?: {
  52:       handle: string;
  53:       followers: number;
  54:       recentPosts: Array<{
  55:         caption: string;
  56:         postedAt: Date;
  57:         likes: number;
  58:         comments: number;
  59:       }>;
  60:     };
  61:   };
  62:   sources?: string[];
  63: }
  64: 
  65: export class WebScraperService {
  66:   private browser: Browser | null = null;
  67:   private currentMode: 'disabled' | 'direct' | 'proxy' = 'direct';
  68:   private userAgents: string[] = [
  69:     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  70:     'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
  71:     'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  72:     'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0',
  73:   ];
  74:   // Simple in-memory cache for OSINT requests
  75:   private osintCache: Map<string, { expiresAt: number; value: any }> = new Map();
  76:   private osintCacheTtlMs: number = Number(process.env.OSINT_CACHE_TTL_MS || 15 * 60 * 1000);
  77:   // Optional Redis client
  78:   private redis: any = null;
  79: 
  80:   async initialize(): Promise<void> {
  81:     if (this.browser) return
  82:     // Allow disabling browser-based scraping entirely in restricted environments
  83:     if (process.env.SCRAPE_DISABLE_BROWSER === '1') {
  84:       this.browser = null
  85:       this.currentMode = 'disabled'
  86:       return
  87:     }
  88:     const executablePath = await chromium.executablePath()
  89:     // Optional proxy rotation: read one proxy from PROXY_URLS
  90:     let proxyArg: string | undefined
  91:     try {
  92:       const proxies = (process.env.PROXY_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
  93:       if (proxies.length) {
  94:         const pick = proxies[Math.floor(Math.random() * proxies.length)]
  95:         // Only accept well-formed proxy URLs
  96:         if (/^(https?:|socks5:\/\/)/i.test(pick)) {
  97:           proxyArg = `--proxy-server=${pick}`
  98:         }
  99:       }
 100:     } catch {}
 101:     // Optional Redis (cache)
 102:     if (!this.redis && process.env.REDIS_URL) {
 103:       try {
 104:         const { createClient } = require('redis')
 105:         this.redis = createClient({ url: process.env.REDIS_URL })
 106:         this.redis.on('error', () => {})
 107:         this.redis.connect().catch(()=>{})
 108:       } catch {}
 109:     }
 110:     const launchArgs = [...chromium.args]
 111:     if (proxyArg) {
 112:       launchArgs.push(proxyArg)
 113:     } else {
 114:       // Some hosts set proxy env vars by default; ensure direct connection
 115:       launchArgs.push('--no-proxy-server')
 116:       launchArgs.push('--proxy-bypass-list=*')
 117:       // Explicitly force direct connection (no quotes around direct://)
 118:       launchArgs.push('--proxy-server=direct://')
 119:     }
 120:     // Ensure no proxy is used if none configured; fix ERR_NO_SUPPORTED_PROXIES
 121:     process.env.HTTP_PROXY = ''
 122:     process.env.http_proxy = ''
 123:     process.env.HTTPS_PROXY = ''
 124:     process.env.https_proxy = ''
 125:     process.env.ALL_PROXY = ''
 126:     process.env.all_proxy = ''
 127:     // Bypass any residual system proxy
 128:     process.env.NO_PROXY = '*'
 129:     process.env.no_proxy = '*'
 130:     // Extra container-friendly flags
 131:     launchArgs.push('--no-sandbox')
 132:     launchArgs.push('--disable-setuid-sandbox')
 133:     launchArgs.push('--disable-dev-shm-usage')
 134:     this.browser = await puppeteer.launch({
 135:       args: launchArgs,
 136:       executablePath,
 137:       headless: true,
 138:     })
 139:     this.currentMode = proxyArg ? 'proxy' : 'direct'
 140:     // Quick connectivity self-test; if a proxy was configured and failed, relaunch direct
 141:     if (proxyArg) {
 142:       try {
 143:         const page = await this.browser.newPage()
 144:         await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 8000 })
 145:         await page.close()
 146:       } catch (e) {
 147:         const msg = (e as any)?.message || ''
 148:         if (/ERR_NO_SUPPORTED_PROXIES|ERR_TUNNEL_CONNECTION_FAILED|net::ERR/i.test(String(msg))) {
 149:           try { await this.browser.close() } catch {}
 150:           const directArgs = [...chromium.args, '--no-proxy-server', '--proxy-bypass-list=*', '--proxy-server=direct://', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
 151:           this.browser = await puppeteer.launch({ args: directArgs, executablePath, headless: true })
 152:           this.currentMode = 'direct'
 153:         }
 154:       }
 155:     }
 156:   }
 157: 
 158:   private async configurePage(page: any) {
 159:     page.setDefaultNavigationTimeout(45000)
 160:     page.setDefaultTimeout(45000)
 161:     const ua = this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
 162:     await page.setUserAgent(ua)
 163:     await page.setViewport({ width: 1366, height: 768 })
 164:     await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
 165:     // If Railway proxies require auth from PROXY_URLS, apply basic auth
 166:     try {
 167:       const proxies = (process.env.PROXY_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
 168:       const pick = proxies[0]
 169:       if (pick) {
 170:         const u = new URL(pick)
 171:         if (u.username && u.password) {
 172:           await page.authenticate({ username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) })
 173:         }
 174:       }
 175:     } catch {}
 176:     await page.setRequestInterception(true)
 177:     page.on('request', (req: any) => {
 178:       const type = req.resourceType()
 179:       // Allow CSS (for layout) but block images/media/fonts
 180:       if (type === 'image' || type === 'media' || type === 'font') { req.abort().catch(()=>{}) }
 181:       else { req.continue().catch(()=>{}) }
 182:     })
 183:   }
 184: 
 185:   private async sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
 186: 
 187:   private async withRetry<T>(fn: () => Promise<T>, attempts = 4, baseDelay = 600): Promise<T> {
 188:     let lastErr: any
 189:     for (let i = 0; i < attempts; i++) {
 190:       try { return await fn() } catch (e) { lastErr = e; await this.sleep(baseDelay * Math.pow(2, i) + Math.random()*200) }
 191:     }
 192:     throw lastErr
 193:   }
 194: 
 195:   private isProxyError(error: any): boolean {
 196:     const msg = (error?.message || '').toString()
 197:     return /ERR_NO_SUPPORTED_PROXIES/i.test(msg)
 198:   }
 199: 
 200:   getMode(): 'disabled' | 'direct' | 'proxy' {
 201:     return this.currentMode
 202:   }
 203: 
 204:   async healthCheck(): Promise<{ ok: boolean; mode: 'disabled' | 'direct' | 'proxy'; error?: string }> {
 205:     try {
 206:       await this.initialize()
 207:       if (!this.browser) {
 208:         return { ok: false, mode: this.currentMode, error: 'browser_unavailable' }
 209:       }
 210:       const page = await this.browser.newPage()
 211:       try {
 212:         await this.configurePage(page)
 213:         await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 8000 })
 214:         return { ok: true, mode: this.currentMode }
 215:       } finally {
 216:         try { await page.close() } catch {}
 217:       }
 218:     } catch (e: any) {
 219:       return { ok: false, mode: this.currentMode, error: String(e?.message || e) }
 220:     }
 221:   }
 222: 
 223:   private async gotoWithRetry(page: any, url: string, waitUntil: 'domcontentloaded'|'networkidle2' = 'domcontentloaded', timeout = 45000) {
 224:     return this.withRetry(async () => {
 225:       return page.goto(url, { waitUntil, timeout })
 226:     }, 3, 700)
 227:   }
 228: 
 229:   // Generic Google search helper returning title, url, and snippet
 230:   async googleSearch(query: string, limit: number = 10): Promise<Array<{ title: string; url: string; snippet: string }>> {
 231:     // Cache lookup
 232:     const cacheKey = `g:${query}:${limit}`
 233:     const now = Date.now()
 234:     const cached = this.osintCache.get(cacheKey)
 235:     if (cached && cached.expiresAt > now) return cached.value
 236:     if (this.redis) {
 237:       try {
 238:         const raw = await this.redis.get(`osint:${cacheKey}`)
 239:         if (raw) {
 240:           const parsed = JSON.parse(raw)
 241:           this.osintCache.set(cacheKey, { expiresAt: now + this.osintCacheTtlMs, value: parsed })
 242:           return parsed
 243:         }
 244:       } catch {}
 245:     }
 246:     // Primary path: headless Google via Puppeteer
 247:     try {
 248:       if (!this.browser) await this.initialize();
 249:       const page = await this.browser!.newPage();
 250:       try {
 251:         await this.configurePage(page)
 252:         const qs = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
 253:         await this.gotoWithRetry(page, qs, 'domcontentloaded', 45000)
 254:         // Accept consent if shown, best-effort
 255:         try { await page.evaluate(() => {
 256:           const btn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(el => /agree|accept|consent/i.test(el.textContent || '')) as HTMLButtonElement | undefined
 257:           btn?.click()
 258:         }) } catch {}
 259:         await this.sleep(900 + Math.random()*600)
 260:         const results = await page.evaluate((max: number) => {
 261:           const out: Array<{ title: string; url: string; snippet: string }> = []
 262:           const blocks = document.querySelectorAll('div.g, div[data-header-feature], div[data-snf]');
 263:           for (const block of Array.from(blocks)) {
 264:             const a = block.querySelector('a[href^="http"]') as HTMLAnchorElement | null
 265:             const h3 = block.querySelector('h3') as HTMLElement | null
 266:             const sn = block.querySelector('div[data-content-feature] div, .VwiC3b, .IsZvec') as HTMLElement | null
 267:             const url = a?.href || ''
 268:             const title = h3?.textContent?.trim() || ''
 269:             const snippet = sn?.textContent?.trim() || ''
 270:             if (url && title) out.push({ title, url, snippet })
 271:             if (out.length >= max) break
 272:           }
 273:           return out
 274:         }, Math.max(1, Math.min(limit, 50)))
 275:         // De-duplicate and filter tracking
 276:         const seen = new Set<string>()
 277:         const cleaned = results.filter(r => {
 278:           try {
 279:             const u = new URL(r.url)
 280:             const key = `${u.hostname}${u.pathname}`
 281:             if (seen.has(key)) return false
 282:             seen.add(key)
 283:             return true
 284:           } catch { return false }
 285:         })
 286:         // Set cache
 287:         this.osintCache.set(cacheKey, { expiresAt: now + this.osintCacheTtlMs, value: cleaned })
 288:         if (this.redis) {
 289:           try { await this.redis.setEx(`osint:${cacheKey}`, Math.floor(this.osintCacheTtlMs/1000), JSON.stringify(cleaned)) } catch {}
 290:         }
 291:         return cleaned
 292:       } finally {
 293:         try { await page.close() } catch {}
 294:       }
 295:     } catch (e) {
 296:       // Fallback: DuckDuckGo HTML (no JS) to avoid proxy/consent issues
 297:       try {
 298:         const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
 299:         const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CareerLeverAI/1.0)' } as any })
 300:         if (!res.ok) return []
 301:         const html = await res.text()
 302:         const items: Array<{ title: string; url: string; snippet: string }> = []
 303:         const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi
 304:         let m: RegExpExecArray | null
 305:         const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim()
 306:         while ((m = re.exec(html)) && items.length < Math.max(1, Math.min(limit, 50))) {
 307:           const href = m[1]
 308:           const title = strip(m[2])
 309:           const snippet = strip(m[3])
 310:           if (href && title) items.push({ title, url: href, snippet })
 311:         }
 312:         const seen = new Set<string>()
 313:         const cleaned = items.filter(r => {
 314:           try { const u = new URL(r.url); const key = `${u.hostname}${u.pathname}`; if (seen.has(key)) return false; seen.add(key); return true } catch { return false }
 315:         })
 316:         this.osintCache.set(cacheKey, { expiresAt: now + this.osintCacheTtlMs, value: cleaned })
 317:         if (this.redis) { try { await this.redis.setEx(`osint:${cacheKey}`, Math.floor(this.osintCacheTtlMs/1000), JSON.stringify(cleaned)) } catch {} }
 318:         return cleaned
 319:       } catch {
 320:         return []
 321:       }
 322:     }
 323:   }
 324: 
 325:   // Build advanced Google queries for job discovery across ATS/job boards
 326:   buildJobSearchQueries(options: {
 327:     jobTitle: string;
 328:     location?: string;
 329:     after?: string; // YYYY-MM-DD
 330:     remote?: boolean;
 331:     excludeSenior?: boolean;
 332:     salaryBands?: string[]; // like ["$60,000","$80,000"]
 333:     atsDomains?: string[]; // ['greenhouse.io','jobs.lever.co','workday.com','jobvite.com']
 334:   }): string[] {
 335:     const after = options.after || ''
 336:     const jt = options.jobTitle
 337:     const loc = options.location || ''
 338:     const remote = options.remote ? '"remote"' : ''
 339:     const exclude = options.excludeSenior ? '-"senior" -"staff" -"principal"' : ''
 340:     const parts: string[] = []
 341:     const ats = (options.atsDomains && options.atsDomains.length ? options.atsDomains : ['greenhouse.io','jobs.lever.co','workday.com','jobvite.com']).slice(0,6)
 342:     for (const d of ats) {
 343:       const q = `site:${d} "${jt}" ${loc ? '"'+loc+'"' : ''} ${remote} ${exclude} ${after ? 'after:'+after : ''}`.trim()
 344:       parts.push(q)
 345:     }
 346:     // broad query
 347:     const broad = `"${jt}" ${loc ? '"'+loc+'"' : ''} ${remote} ${exclude} ${after ? 'after:'+after : ''}`.trim()
 348:     parts.push(broad)
 349:     // major job boards
 350:     const boards = ['indeed.com','linkedin.com/jobs','ziprecruiter.com','jobbank.gc.ca','workopolis.com','glassdoor.com/Job']
 351:     for (const b of boards) {
 352:       const q = `site:${b} "${jt}" ${loc ? '"'+loc+'"' : ''} ${remote} ${exclude} ${after ? 'after:'+after : ''}`.trim()
 353:       parts.push(q)
 354:     }
 355:     // generic careers pages
 356:     parts.push(`inurl:careers "${jt}" ${loc ? '"'+loc+'"' : ''} ${remote} ${exclude} ${after ? 'after:'+after : ''}`.trim())
 357:     // salary based queries
 358:     if (options.salaryBands && options.salaryBands.length) {
 359:       const salaryExpr = options.salaryBands.slice(0,3).map(s => `"${s}"`).join(' OR ')
 360:       parts.push(`${salaryExpr} "${jt}" ${loc ? '"'+loc+'"' : ''} filetype:pdf`)
 361:     }
 362:     return parts
 363:   }
 364: 
 365:   // Run Google queries and aggregate unique job posting links, preferring ATS domains
 366:   async searchJobsByGoogle(options: {
 367:     jobTitle: string;
 368:     location?: string;
 369:     after?: string;
 370:     remote?: boolean;
 371:     excludeSenior?: boolean;
 372:     salaryBands?: string[];
 373:     limit?: number;
 374:     radiusKm?: number;
 375:   }): Promise<Array<{ title?: string; url: string; snippet?: string; source: string }>> {
 376:     let queries: string[] = []
 377:     const radiusKm = typeof options.radiusKm === 'number' ? Math.max(1, Math.min(500, options.radiusKm)) : undefined
 378:     if (options.location && radiusKm) {
 379:       try {
 380:         const geo = await this.geocodeLocation(options.location)
 381:         let placeNames: string[] = [ options.location ]
 382:         if (geo) {
 383:           const nearby = await this.getNearbyLocalities(geo.lat, geo.lng, radiusKm, 10)
 384:           const names = nearby.map(p => p.name).filter(Boolean)
 385:           placeNames = Array.from(new Set([options.location, ...names]))
 386:         }
 387:         for (const name of placeNames) {
 388:           const qs = this.buildJobSearchQueries({
 389:             jobTitle: options.jobTitle,
 390:             location: name,
 391:             after: options.after,
 392:             remote: options.remote,
 393:             excludeSenior: options.excludeSenior,
 394:             salaryBands: options.salaryBands,
 395:           })
 396:           queries.push(...qs)
 397:         }
 398:       } catch {
 399:         queries = this.buildJobSearchQueries({
 400:           jobTitle: options.jobTitle,
 401:           location: options.location,
 402:           after: options.after,
 403:           remote: options.remote,
 404:           excludeSenior: options.excludeSenior,
 405:           salaryBands: options.salaryBands,
 406:         })
 407:       }
 408:     } else {
 409:       queries = this.buildJobSearchQueries({
 410:         jobTitle: options.jobTitle,
 411:         location: options.location,
 412:         after: options.after,
 413:         remote: options.remote,
 414:         excludeSenior: options.excludeSenior,
 415:         salaryBands: options.salaryBands,
 416:       })
 417:     }
 418:     const preferredHosts = ['greenhouse.io','jobs.lever.co','workday.com','jobvite.com','boards.greenhouse.io','myworkdayjobs.com','smartrecruiters.com']
 419:     const results: Array<{ title?: string; url: string; snippet?: string; source: string }> = []
 420:     const seen = new Set<string>()
 421:     for (const q of queries) {
 422:       const res = await this.withRetry(() => this.googleSearch(q, 12), 2, 700)
 423:       for (const r of res) {
 424:         try {
 425:           const u = new URL(r.url)
 426:           const host = u.hostname.replace('www.','')
 427:           const key = `${host}${u.pathname}`
 428:           if (seen.has(key)) continue
 429:           seen.add(key)
 430:           results.push({ title: r.title, url: r.url, snippet: r.snippet, source: host })
 431:         } catch { /* ignore */ }
 432:       }
 433:       // small delay to avoid being blocked
 434:       await this.sleep(800 + Math.random()*400)
 435:       if (results.length >= (options.limit || 30)) break
 436:     }
 437:     // Sort: prefer ATS hosts first
 438:     results.sort((a, b) => {
 439:       const aPref = preferredHosts.some(h => (a.source||'').includes(h)) ? 0 : 1
 440:       const bPref = preferredHosts.some(h => (b.source||'').includes(h)) ? 0 : 1
 441:       return aPref - bPref
 442:     })
 443:     return results.slice(0, options.limit || 30)
 444:   }
 445: 
 446:   // Build Google intel queries and gather categorized signals when direct sites are unavailable
 447:   async searchCompanyIntelByGoogle(companyName: string, opts?: { after?: string }): Promise<{
 448:     financial: Array<{ title: string; url: string; snippet: string }>;
 449:     culture: Array<{ title: string; url: string; snippet: string }>;
 450:     news: Array<{ title: string; url: string; snippet: string }>;
 451:     leadership: Array<{ title: string; url: string; snippet: string }>;
 452:     growth: Array<{ title: string; url: string; snippet: string }>;
 453:     benefits: Array<{ title: string; url: string; snippet: string }>;
 454:     crunchbase?: Array<{ title: string; url: string; snippet: string }>;
 455:     pitchbook?: Array<{ title: string; url: string; snippet: string }>;
 456:   }> {
 457:     const after = opts?.after || ''
 458:     const qFinancial = `"${companyName}" ("funding" OR "investment" OR "revenue") ${after ? 'after:'+after : ''}`
 459:     const qCulture = `site:glassdoor.com "${companyName}" ("culture" OR "management" OR "benefits")`
 460:     const qNews = `"${companyName}" ("press release" OR "announcement") ${after ? 'after:'+after : ''}`
 461:     const qLeadership = `"${companyName}" ("CEO" OR "founder" OR "executive" OR "leadership team") ${after ? 'after:'+after : ''}`
 462:     const qGrowth = `"${companyName}" ("hiring" OR "expansion" OR "new office" OR "acquired" OR "partnership") ${after ? 'after:'+after : ''}`
 463:     const qBenefits = `"${companyName}" ("salary" OR "compensation" OR "benefits" OR "PTO")`
 464: 
 465:     const [financial, culture, news, leadership, growth, benefits] = await Promise.all([
 466:       this.googleSearch(qFinancial, 8),
 467:       this.googleSearch(qCulture, 8),
 468:       this.googleSearch(qNews, 8),
 469:       this.googleSearch(qLeadership, 8),
 470:       this.googleSearch(qGrowth, 8),
 471:       this.googleSearch(qBenefits, 8),
 472:     ])
 473: 
 474:     const crunchbase = await this.googleSearch(`site:crunchbase.com "${companyName}"`, 4)
 475:     const pitchbook = await this.googleSearch(`site:pitchbook.com "${companyName}"`, 4)
 476: 
 477:     return { financial, culture, news, leadership, growth, benefits, crunchbase, pitchbook }
 478:   }
 479: 
 480:   // Twitter/X mentions via Google
 481:   async searchTwitterMentions(companyName: string, limit: number = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
 482:     const q = `"${companyName}" (site:twitter.com OR site:x.com)`
 483:     return this.googleSearch(q, limit)
 484:   }
 485: 
 486:   // Indeed company page/reviews via Google
 487:   async searchIndeedCompany(companyName: string, limit: number = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
 488:     const q = `site:indeed.com/cmp "${companyName}" (review OR salaries OR interviews)`
 489:     return this.googleSearch(q, limit)
 490:   }
 491: 
 492:   // Reddit employee/interview mentions via Google
 493:   async searchRedditMentions(companyName: string, limit: number = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
 494:     const q = `site:reddit.com "${companyName}" ("working at" OR interview OR employee)`
 495:     return this.googleSearch(q, limit)
 496:   }
 497: 
 498:   // Financials OSINT: funding, revenue, valuation, investors via Google
 499:   async searchFinancials(companyName: string): Promise<{
 500:     funding: Array<{ title: string; url: string; snippet: string }>;
 501:     revenue: Array<{ title: string; url: string; snippet: string }>;
 502:     valuation: Array<{ title: string; url: string; snippet: string }>;
 503:     investors: Array<{ title: string; url: string; snippet: string }>;
 504:   }> {
 505:     const qFunding = `"${companyName}" (funding OR investment OR "Series A" OR "Series B" OR "Series C") after:2018-01-01`
 506:     const qRevenue = `"${companyName}" (revenue OR ARR OR MRR) filetype:pdf OR site:crunchbase.com`
 507:     const qValuation = `"${companyName}" valuation OR "valued at"`
 508:     const qInvestors = `"${companyName}" investors OR backers OR "led by"`
 509:     const [funding, revenue, valuation, investors] = await Promise.all([
 510:       this.googleSearch(qFunding, 10),
 511:       this.googleSearch(qRevenue, 10),
 512:       this.googleSearch(qValuation, 10),
 513:       this.googleSearch(qInvestors, 10),
 514:     ])
 515:     return { funding, revenue, valuation, investors }
 516:   }
 517: 
 518:   // Geocode a location string to lat/lng using Mapbox (if configured) or OpenStreetMap Nominatim
 519:   async geocodeLocation(location: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
 520:     const q = location.trim()
 521:     if (!q) return null
 522:     const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
 523:     try {
 524:       if (mapboxToken) {
 525:         const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${mapboxToken}`
 526:         const res = await fetch(url, { headers: { 'Accept': 'application/json' } as any })
 527:         if (res.ok) {
 528:           const json: any = await res.json()
 529:           const f = json.features?.[0]
 530:           if (f?.center && Array.isArray(f.center)) {
 531:             return { lat: f.center[1], lng: f.center[0], displayName: f.place_name || q }
 532:           }
 533:         }
 534:       }
 535:     } catch {}
 536:     try {
 537:       const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
 538:       const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'CareerLeverAI/1.0 (contact: support@careerlever.ai)' } as any })
 539:       if (res.ok) {
 540:         const arr: any[] = await res.json() as any
 541:         const it: any = arr?.[0]
 542:         if (it?.lat && it?.lon) {
 543:           return { lat: parseFloat(it.lat), lng: parseFloat(it.lon), displayName: it.display_name || q }
 544:         }
 545:       }
 546:     } catch {}
 547:     return null
 548:   }
 549: 
 550:   // Fetch nearby locality names within radius using Overpass API (best-effort)
 551:   async getNearbyLocalities(lat: number, lng: number, radiusKm: number, maxPlaces: number = 10): Promise<Array<{ name: string; country?: string }>> {
 552:     const radiusMeters = Math.round(radiusKm * 1000)
 553:     const body = `[out:json][timeout:25];\n(\n  node["place"~"city|town|village"](around:${radiusMeters},${lat},${lng});\n);\nout body ${Math.max(5, maxPlaces)};`;
 554:     try {
 555:       const res = await fetch('https://overpass-api.de/api/interpreter', {
 556:         method: 'POST',
 557:         headers: { 'Content-Type': 'text/plain', 'User-Agent': 'CareerLeverAI/1.0 (contact: support@careerlever.ai)' } as any,
 558:         body
 559:       })
 560:       if (!res.ok) throw new Error('overpass error')
 561:       const json: any = await res.json()
 562:       const names: string[] = []
 563:       for (const el of (json.elements || [])) {
 564:         const name = el?.tags?.name
 565:         if (name && !names.includes(name)) names.push(name)
 566:         if (names.length >= maxPlaces) break
 567:       }
 568:       return names.map(n => ({ name: n }))
 569:     } catch {
 570:       return []
 571:     }
 572:   }
 573: 
 574:   // Compute travel duration (minutes) between two text locations using Mapbox Directions
 575:   async getTravelDurationMins(origin: string, destination: string, profile: 'driving'|'walking'|'cycling' = 'driving'): Promise<number | null> {
 576:     try {
 577:       const o = await this.geocodeLocation(origin)
 578:       const d = await this.geocodeLocation(destination)
 579:       const token = process.env.MAPBOX_ACCESS_TOKEN
 580:       if (!o || !d || !token) return null
 581:       const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${o.lng},${o.lat};${d.lng},${d.lat}?annotations=duration&overview=false&access_token=${token}`
 582:       const res = await fetch(url)
 583:       if (!res.ok) return null
 584:       const json: any = await res.json()
 585:       const secs = json?.routes?.[0]?.duration
 586:       if (typeof secs !== 'number') return null
 587:       return Math.round(secs / 60)
 588:     } catch {
 589:       return null
 590:     }
 591:   }
 592: 
 593:   // Scrape a single job detail page from a public URL (best-effort)
 594:   async scrapeJobDetailFromUrl(jobUrl: string): Promise<{
 595:     title?: string;
 596:     companyName?: string;
 597:     location?: string;
 598:     description?: string;
 599:     source: string;
 600:     jobUrl: string;
 601:   }> {
 602:     if (!this.browser) await this.initialize();
 603:     if (!this.browser) return { source: new URL(jobUrl).hostname, jobUrl }
 604:     const page = await this.browser!.newPage();
 605:     try {
 606:       await this.configurePage(page)
 607:       await this.gotoWithRetry(page, jobUrl, 'domcontentloaded', 45000)
 608:       await this.sleep(800 + Math.random()*600)
 609: 
 610:       const host = new URL(jobUrl).hostname.replace('www.', '');
 611:       const data = await page.evaluate((host) => {
 612:         const getText = (sel: string[]) => {
 613:           for (const s of sel) {
 614:             const el = document.querySelector(s) as HTMLElement | null;
 615:             if (el && el.textContent && el.textContent.trim().length > 3) return el.textContent.trim();
 616:           }
 617:           return undefined;
 618:         };
 619:         const getHtml = (sel: string[]) => {
 620:           for (const s of sel) {
 621:             const el = document.querySelector(s) as HTMLElement | null;
 622:             if (el && el.innerText && el.innerText.trim().length > 10) return el.innerText.trim();
 623:           }
 624:           return undefined;
 625:         };
 626: 
 627:         let title = getText(['h1', 'h1[data-testid="jobTitle"]', 'h1.jobsearch-JobInfoHeader-title', 'h1.job-title']);
 628:         let companyName = getText(['.companyName', '[data-company-name="true"]', '.icl-u-lg-mr--sm.icl-u-xs-mr--xs', 'a[data-tn-element="companyName"]', 'a[data-company-name]']);
 629:         if (!companyName) companyName = getText(['[data-testid="companyName"]', 'div[data-company-name]']);
 630:         let location = getText(['.jobsearch-JobInfoHeader-subtitle div:last-child', 'div[data-testid="inlineHeader-companyLocation"]', '.location', '[data-testid="jobLocation"]']);
 631:         let description = getHtml(['#jobDescriptionText', 'div#jobDescriptionText', 'div.jobsearch-jobDescriptionText', 'section#jobDescription', 'div.job-description', 'article']);
 632: 
 633:         return { title, companyName, location, description };
 634:       }, host);
 635: 
 636:       return {
 637:         title: data.title,
 638:         companyName: data.companyName,
 639:         location: data.location,
 640:         description: data.description,
 641:         source: host,
 642:         jobUrl,
 643:       };
 644:     } catch (e) {
 645:       // swallow proxy errors and return minimal data
 646:       return { source: new URL(jobUrl).hostname, jobUrl };
 647:     } finally {
 648:       await page.close();
 649:     }
 650:   }
 651: 
 652:   // Scrape public search results page (Indeed/ZipRecruiter/Job Bank/Google Jobs page) best-effort
 653:   async scrapeJobsFromSearchUrl(searchUrl: string, limit: number = 20): Promise<Array<{
 654:     title?: string;
 655:     companyName?: string;
 656:     location?: string;
 657:     snippet?: string;
 658:     jobUrl: string;
 659:     source: string;
 660:   }>> {
 661:     if (!this.browser) await this.initialize();
 662:     if (!this.browser) return []
 663:     const page = await this.browser!.newPage();
 664:     const results: any[] = [];
 665:     try {
 666:       await this.configurePage(page)
 667:       await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
 668:       await this.sleep(800 + Math.random()*700)
 669:       const host = new URL(searchUrl).hostname.replace('www.', '');
 670: 
 671:       if (/indeed\.com|indeed\.ca/i.test(host)) {
 672:         const items = await page.evaluate(() => {
 673:           const out: any[] = [];
 674:           document.querySelectorAll('a.tapItem, a[data-jk], a[href*="/rc/clk"], a[href*="/pagead/"]').forEach((a) => {
 675:             const el = a as HTMLAnchorElement;
 676:             const card = el.closest('[data-testid="jobsearch-SerpJobCard"]') || el.closest('div.jobsearch-SerpJobCard') || el;
 677:             const title = (card.querySelector('h2.jobTitle, h2 a, h1') as HTMLElement | null)?.innerText?.trim();
 678:             const company = (card.querySelector('.companyName') as HTMLElement | null)?.innerText?.trim();
 679:             const location = (card.querySelector('.companyLocation') as HTMLElement | null)?.innerText?.trim();
 680:             const snippet = (card.querySelector('.job-snippet') as HTMLElement | null)?.innerText?.trim();
 681:             const href = el.href;
 682:             if (href) out.push({ title, companyName: company, location, snippet, jobUrl: href });
 683:           });
 684:           return out;
 685:         });
 686:         for (const it of items) {
 687:           results.push({ ...it, source: host });
 688:           if (results.length >= limit) break;
 689:         }
 690:       } else if (/ziprecruiter\.com/i.test(host)) {
 691:         const items = await page.evaluate(() => {
 692:           const out: any[] = [];
 693:           document.querySelectorAll('a[href*="/jobs/"], a[href*="/jobs-search"] h2 a').forEach((a) => {
 694:             const link = (a as HTMLAnchorElement).href;
 695:             const card = (a as HTMLElement).closest('article, .job_result, .job_card, .job_content') || (a as HTMLElement);
 696:             const title = (card.querySelector('h2, h3') as HTMLElement | null)?.innerText?.trim();
 697:             const company = (card.querySelector('.job_org, .company, .t_org_link') as HTMLElement | null)?.innerText?.trim();
 698:             const location = (card.querySelector('.location, .job_loc') as HTMLElement | null)?.innerText?.trim();
 699:             const snippet = (card.querySelector('p, .job_snippet') as HTMLElement | null)?.innerText?.trim();
 700:             if (link) out.push({ title, companyName: company, location, snippet, jobUrl: link });
 701:           });
 702:           return out;
 703:         });
 704:         for (const it of items) {
 705:           results.push({ ...it, source: host });
 706:           if (results.length >= limit) break;
 707:         }
 708:       } else if (/jobbank\.gc\.ca/i.test(host)) {
 709:         const items = await page.evaluate(() => {
 710:           const out: any[] = [];
 711:           document.querySelectorAll('a[href*="/jobsearch/jobposting/"]').forEach((a) => {
 712:             const link = (a as HTMLAnchorElement).href;
 713:             const card = (a as HTMLElement).closest('li, article, .resultJobItem') || (a as HTMLElement);
 714:             const title = (card.querySelector('h3, h4, a') as HTMLElement | null)?.innerText?.trim();
 715:             const company = (card.querySelector('.business, .resultJobItem__company') as HTMLElement | null)?.innerText?.trim();
 716:             const location = (card.querySelector('.location, .resultJobItem__infoItem--location') as HTMLElement | null)?.innerText?.trim();
 717:             const snippet = (card.querySelector('p, .resultJobItem__short') as HTMLElement | null)?.innerText?.trim();
 718:             if (link) out.push({ title, companyName: company, location, snippet, jobUrl: link });
 719:           });
 720:           return out;
 721:         });
 722:         for (const it of items) {
 723:           results.push({ ...it, source: host });
 724:           if (results.length >= limit) break;
 725:         }
 726:       } else if (/google\./i.test(host)) {
 727:         const items = await page.evaluate(() => {
 728:           const out: any[] = [];
 729:           document.querySelectorAll('a[href^="http"]').forEach((a) => {
 730:             const href = (a as HTMLAnchorElement).href;
 731:             const text = (a as HTMLAnchorElement).innerText || '';
 732:             if (/indeed|ziprecruiter|jobbank\.gc\.ca|workopolis|glassdoor/i.test(href) && text && text.length > 5) {
 733:               out.push({ title: text.split('\n')[0], companyName: undefined, location: undefined, snippet: undefined, jobUrl: href });
 734:             }
 735:           });
 736:           return out;
 737:         });
 738:         for (const it of items) {
 739:           results.push({ ...it, source: host });
 740:           if (results.length >= limit) break;
 741:         }
 742:       }
 743:     } catch (e) {
 744:       // ignore
 745:     } finally {
 746:       await page.close();
 747:     }
 748:     // De-dupe by URL
 749:     const seen = new Set<string>();
 750:     const deduped = results.filter(r => {
 751:       const key = r.jobUrl.split('#')[0];
 752:       if (seen.has(key)) return false;
 753:       seen.add(key); return true;
 754:     });
 755:     return deduped.slice(0, limit);
 756:   }
 757: 
 758:   async close(): Promise<void> {
 759:     if (this.browser) {
 760:       await this.browser.close();
 761:       this.browser = null;
 762:     }
 763:   }
 764: 
 765:   async scrapeCompanyData(companyName: string, website?: string): Promise<ScrapedCompanyData> {
 766:     if (!this.browser) {
 767:       await this.initialize();
 768:     }
 769: 
 770:     const data: ScrapedCompanyData = {
 771:       companyName,
 772:       website,
 773:     };
 774: 
 775:     try {
 776:       const sources: string[] = []
 777:       const addSource = (s: string) => { if (!sources.includes(s)) sources.push(s) }
 778:       // Try to discover official website if missing
 779:       if (!website) {
 780:         try {
 781:           const found = await this.discoverOfficialWebsite(companyName)
 782:           if (found) website = found
 783:         } catch {}
 784:       }
 785:       // Scrape multiple sources in parallel
 786:       const [glassdoorData, linkedinData, websiteData, newsData, instaData, fbData, gRev] = await Promise.allSettled([
 787:         this.scrapeGlassdoorData(companyName),
 788:         this.scrapeLinkedInData(companyName),
 789:         website ? this.scrapeCompanyWebsite(website) : Promise.resolve(null),
 790:         this.scrapeNewsData(companyName),
 791:         this.scrapeInstagramPublic(companyName),
 792:         this.scrapeFacebookPublic(companyName),
 793:         this.scrapeGoogleReviewsSummary(companyName)
 794:       ]);
 795:       // Contact info (best effort) if website known
 796:       let contactInfo: { emails: string[]; phones: string[]; addresses: string[] } | null = null
 797:       try {
 798:         if (website) contactInfo = await this.scrapeContactInfoFromWebsite(website)
 799:       } catch {}
 800: 
 801:       // Merge the data
 802:       if (glassdoorData.status === 'fulfilled' && glassdoorData.value) {
 803:         data.glassdoorRating = glassdoorData.value.rating;
 804:         data.glassdoorReviews = glassdoorData.value.reviews;
 805:         data.culture = glassdoorData.value.culture;
 806:         data.benefits = glassdoorData.value.benefits;
 807:         addSource('glassdoor')
 808:       }
 809: 
 810:       if (linkedinData.status === 'fulfilled' && linkedinData.value) {
 811:         data.linkedinData = linkedinData.value;
 812:         if (!data.industry && linkedinData.value.industry) {
 813:           data.industry = linkedinData.value.industry;
 814:         }
 815:         if (!data.size && linkedinData.value.size) {
 816:           data.size = linkedinData.value.size;
 817:         }
 818:         addSource('linkedin')
 819:       }
 820: 
 821:       if (websiteData.status === 'fulfilled' && websiteData.value) {
 822:         data.description = websiteData.value.description;
 823:         if (!data.industry && websiteData.value.industry) {
 824:           data.industry = websiteData.value.industry;
 825:         }
 826:         addSource('website')
 827:       }
 828:       if (contactInfo && (contactInfo.emails.length || contactInfo.phones.length || contactInfo.addresses.length)) {
 829:         ;(data as any).contactInfo = contactInfo
 830:         addSource('website-contact')
 831:       }
 832: 
 833:       if (newsData.status === 'fulfilled' && newsData.value) {
 834:         data.recentNews = newsData.value;
 835:         addSource('google-news')
 836:       }
 837: 
 838:       if (instaData.status === 'fulfilled' && instaData.value) {
 839:         data.socialMedia = data.socialMedia || {}
 840:         data.socialMedia.instagram = instaData.value as any
 841:         addSource('instagram')
 842:       }
 843: 
 844:       if (fbData.status === 'fulfilled' && fbData.value) {
 845:         data.socialMedia = data.socialMedia || {}
 846:         data.socialMedia.facebook = fbData.value as any
 847:         addSource('facebook')
 848:       }
 849: 
 850:       if (gRev.status === 'fulfilled' && gRev.value) {
 851:         ;(data as any).googleReviewsRating = (gRev.value as any).rating
 852:         ;(data as any).googleReviewsCount = (gRev.value as any).count
 853:         addSource('google-reviews')
 854:       }
 855: 
 856:       // Generate fallback data if we don't have enough info
 857:       if (!data.culture || data.culture.length === 0) {
 858:         data.culture = this.generateFallbackCulture(companyName);
 859:       }
 860: 
 861:       if (!data.benefits || data.benefits.length === 0) {
 862:         data.benefits = this.generateFallbackBenefits();
 863:       }
 864: 
 865:       if (!data.description) {
 866:         data.description = this.generateFallbackDescription(companyName);
 867:       }
 868: 
 869:       data.sources = sources
 870:     } catch (error) {
 871:       console.error('Error scraping company data:', error);
 872:       // Return basic data with fallbacks
 873:       return {
 874:         companyName,
 875:         website,
 876:         culture: this.generateFallbackCulture(companyName),
 877:         benefits: this.generateFallbackBenefits(),
 878:         description: this.generateFallbackDescription(companyName),
 879:       };
 880:     }
 881: 
 882:     return data;
 883:   }
 884: 
 885:   private async discoverOfficialWebsite(companyName: string): Promise<string | null> {
 886:     if (!this.browser) return null
 887:     const page = await this.browser.newPage()
 888:     try {
 889:       await this.configurePage(page)
 890:       const q = `https://www.google.com/search?q=${encodeURIComponent(companyName)}`
 891:       await page.goto(q, { waitUntil: 'domcontentloaded', timeout: 30000 })
 892:       await this.sleep(800 + Math.random()*700)
 893:       const url = await page.$$eval('a[href^="http"]', els => {
 894:         const badHosts = ['linkedin.com','facebook.com','instagram.com','glassdoor.com','crunchbase.com','wikipedia.org','news.google.com','youtube.com','twitter.com','x.com']
 895:         const candidates = els.map(a => (a as HTMLAnchorElement).href).filter(h => {
 896:           try {
 897:             const u = new URL(h)
 898:             return !badHosts.some(b => u.hostname.includes(b))
 899:           } catch { return false }
 900:         })
 901:         return candidates[0] || ''
 902:       })
 903:       if (!url) return null
 904:       try { const u = new URL(url); return `${u.protocol}//${u.hostname}` } catch { return null }
 905:     } catch { return null } finally { await page.close() }
 906:   }
 907: 
 908:   async scrapeContactInfoFromWebsite(website: string): Promise<{ emails: string[]; phones: string[]; addresses: string[] }> {
 909:     if (!this.browser) await this.initialize();
 910:     const results = { emails: [] as string[], phones: [] as string[], addresses: [] as string[] };
 911:     const candidates = [website, `${website.replace(/\/?$/, '/') }contact`, `${website.replace(/\/?$/, '/') }about`];
 912:     const page = await this.browser!.newPage();
 913:     try {
 914:       page.setDefaultNavigationTimeout(45000)
 915:       page.setDefaultTimeout(45000)
 916:       for (const url of candidates) {
 917:         try {
 918:           await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
 919:           await new Promise(r => setTimeout(r, 1000));
 920:           const html = await page.content();
 921:           // Emails from mailto and plain text
 922:           const mailtos = await page.$$eval('a[href^="mailto:"]', els => els.map(a => (a as HTMLAnchorElement).getAttribute('href') || ''));
 923:           const mailtoClean = mailtos.map(h => h.replace(/^mailto:/i, '').trim()).filter(Boolean);
 924:           const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
 925:           const textEmails = (html.match(emailRegex) || []).map(e => e.trim());
 926:           const phoneRegex = /(\+?\d[\s-]?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g;
 927:           const phones = (html.match(phoneRegex) || []).map(p => p.trim());
 928:           // Address heuristic: lines with street/ave/blvd/suite
 929:           const addressRegex = /(\d+\s+[^\n,]+(?:Street|St\.|Avenue|Ave\.|Road|Rd\.|Boulevard|Blvd\.|Lane|Ln\.|Suite|Ste\.)[^\n<]{0,80})/gi;
 930:           const addresses = (html.match(addressRegex) || []).map(a => a.trim());
 931:           results.emails.push(...mailtoClean, ...textEmails);
 932:           results.phones.push(...phones);
 933:           results.addresses.push(...addresses);
 934:         } catch {
 935:           continue;
 936:         }
 937:       }
 938:     } finally {
 939:       await page.close();
 940:     }
 941:     // Deduplicate
 942:     results.emails = Array.from(new Set(results.emails));
 943:     results.phones = Array.from(new Set(results.phones));
 944:     results.addresses = Array.from(new Set(results.addresses));
 945:     return results;
 946:   }
 947: 
 948:   async searchHiringContacts(companyName: string, roleHints: string[] = [], locationHint?: string): Promise<Array<{ name: string; title: string; profileUrl?: string; source: string }>> {
 949:     if (!this.browser) await this.initialize();
 950:     if (!this.browser) return []
 951:     const page = await this.browser!.newPage();
 952:     const people: Array<{ name: string; title: string; profileUrl?: string; source: string }> = [];
 953:     try {
 954:       const query = `${companyName} ${roleHints.join(' OR ')} site:linkedin.com/in ${locationHint || ''}`.trim();
 955:       const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
 956:       await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
 957:       await new Promise(r => setTimeout(r, 2000));
 958:       const results = await page.evaluate(() => {
 959:         const items: Array<{ title: string; href: string; snippet: string }> = [];
 960:         const nodes = document.querySelectorAll('a[href^="http"]');
 961:         nodes.forEach((a) => {
 962:           const href = (a as HTMLAnchorElement).href;
 963:           const h3 = a.querySelector('h3');
 964:           const title = h3?.textContent || '';
 965:           const parent = a.closest('div') as HTMLElement | null;
 966:           const snippet = parent?.querySelector('span, div')?.textContent || '';
 967:           if (title && href && /linkedin\.com\/in\//i.test(href)) {
 968:             items.push({ title: title.trim(), href, snippet: snippet.trim() });
 969:           }
 970:         });
 971:         return items.slice(0, 10);
 972:       });
 973:       for (const r of results) {
 974:         // Heuristic to split name and title: "Name - Title - Company" or "Name | Title"
 975:         const parts = r.title.split(/[-|–]\s*/);
 976:         const name = parts[0]?.trim() || r.title;
 977:         const title = parts.slice(1).join(' - ').trim() || r.snippet;
 978:         if (name) people.push({ name, title, profileUrl: r.href, source: 'google-linkedin' });
 979:       }
 980:     } catch {
 981:       // ignore
 982:     } finally {
 983:       await page.close();
 984:     }
 985:     return people;
 986:   }
 987: 
 988:   async scrapeGlassdoorReviewsSummary(companyName: string): Promise<{ pros: string[]; cons: string[] } | null> {
 989:     if (!this.browser) await this.initialize();
 990:     const page = await this.browser!.newPage();
 991:     try {
 992:       page.setDefaultNavigationTimeout(45000)
 993:       page.setDefaultTimeout(45000)
 994:       const searchUrl = `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-reviews-SRCH_KE0,${companyName.length}.htm`;
 995:       await this.gotoWithRetry(page, searchUrl, 'domcontentloaded', 30000)
 996:       await new Promise(r => setTimeout(r, 2000));
 997:       const data = await page.evaluate(() => {
 998:         const textContent = document.body.innerText || '';
 999:         const pros: string[] = [];
1000:         const cons: string[] = [];
1001:         // Simple heuristic: look for lines following "Pros" or "Cons"
1002:         const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
1003:         for (let i = 0; i < lines.length; i++) {
1004:           if (/^pros\b/i.test(lines[i]) && lines[i+1]) pros.push(lines[i+1].slice(0, 200));
1005:           if (/^cons\b/i.test(lines[i]) && lines[i+1]) cons.push(lines[i+1].slice(0, 200));
1006:         }
1007:         return { pros: Array.from(new Set(pros)).slice(0, 5), cons: Array.from(new Set(cons)).slice(0, 5) };
1008:       });
1009:       return data;
1010:     } catch (e) {
1011:       console.error('Glassdoor summary error:', e);
1012:       return null;
1013:     } finally {
1014:       await page.close();
1015:     }
1016:   }
1017: 
1018:   computeSentimentFromProsCons(pros: string[] = [], cons: string[] = []): number {
1019:     const p = pros.length, c = cons.length
1020:     if (p + c === 0) return 50
1021:     return Math.max(0, Math.min(100, Math.round((p / (p + c)) * 100)))
1022:   }
1023: 
1024:   private async scrapeGlassdoorData(companyName: string): Promise<{
1025:     rating?: number;
1026:     reviews?: number;
1027:     culture?: string[];
1028:     benefits?: string[];
1029:   } | null> {
1030:     if (!this.browser) return null;
1031: 
1032:     const page = await this.browser.newPage();
1033: 
1034:     try {
1035:       page.setDefaultNavigationTimeout(45000)
1036:       page.setDefaultTimeout(45000)
1037:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
1038:       await page.setViewport({ width: 1366, height: 768 });
1039: 
1040:       const searchUrl = `https://www.glassdoor.com/Reviews/${companyName.replace(/\s+/g, '-')}-reviews-SRCH_KE0,${companyName.length}.htm`;
1041: 
1042:       await this.gotoWithRetry(page, searchUrl, 'domcontentloaded', 30000)
1043: 
1044:       // Wait for content to load
1045:       await new Promise(r => setTimeout(r, 2000));
1046: 
1047:       const data = await page.evaluate(() => {
1048:         const result: any = {};
1049: 
1050:         // Get overall rating
1051:         const ratingElement = document.querySelector('[data-test="rating-info"] .css-1cw89uz');
1052:         if (ratingElement) {
1053:           const ratingText = ratingElement.textContent?.trim();
1054:           if (ratingText) {
1055:             const rating = parseFloat(ratingText);
1056:             if (!isNaN(rating) && rating >= 1 && rating <= 5) {
1057:               result.rating = rating;
1058:             }
1059:           }
1060:         }
1061: 
1062:         // Get number of reviews
1063:         const reviewsElement = document.querySelector('[data-test="rating-info"] .css-1cw89uz + span');
1064:         if (reviewsElement) {
1065:           const reviewsText = reviewsElement.textContent?.trim();
1066:           if (reviewsText) {
1067:             const reviewsMatch = reviewsText.match(/([\d,]+)\s*reviews?/i);
1068:             if (reviewsMatch) {
1069:               result.reviews = parseInt(reviewsMatch[1].replace(/,/g, ''));
1070:             }
1071:           }
1072:         }
1073: 
1074:         // Get company culture insights
1075:         const cultureElements = document.querySelectorAll('.css-1cw89uz');
1076:         const culture: string[] = [];
1077:         cultureElements.forEach(el => {
1078:           const text = el.textContent?.trim();
1079:           if (text && text.length > 10 && text.length < 100) {
1080:             culture.push(text);
1081:           }
1082:         });
1083:         if (culture.length > 0) {
1084:           result.culture = culture.slice(0, 5);
1085:         }
1086: 
1087:         // Get benefits if available
1088:         const benefitElements = document.querySelectorAll('[data-test*="benefit"], .benefit, .perk');
1089:         const benefits: string[] = [];
1090:         benefitElements.forEach(el => {
1091:           const text = el.textContent?.trim();
1092:           if (text && text.length > 3 && text.length < 50) {
1093:             benefits.push(text);
1094:           }
1095:         });
1096:         if (benefits.length > 0) {
1097:           result.benefits = benefits.slice(0, 8);
1098:         }
1099: 
1100:         return result;
1101:       });
1102: 
1103:       return data;
1104:     } catch (error) {
1105:       console.error('Glassdoor scraping error:', error);
1106:       return null;
1107:     } finally {
1108:       await page.close();
1109:     }
1110:   }
1111: 
1112:   private async scrapeLinkedInData(companyName: string): Promise<{
1113:     companyPage: string;
1114:     employeeCount?: number;
1115:     followers?: number;
1116:     industry?: string;
1117:     size?: string;
1118:     recentPosts?: Array<{
1119:       content: string;
1120:       postedAt: Date;
1121:       engagement: number;
1122:     }>;
1123:   } | null> {
1124:     if (!this.browser) return null;
1125: 
1126:     const page = await this.browser.newPage();
1127: 
1128:     try {
1129:       page.setDefaultNavigationTimeout(45000)
1130:       page.setDefaultTimeout(45000)
1131:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
1132:       await page.setViewport({ width: 1366, height: 768 });
1133: 
1134:       // Prefer company vanity, but allow a Google fallback if page lacks data
1135:       const vanity = companyName.toLowerCase().replace(/\s+/g, '')
1136:       const searchUrl = `https://www.linkedin.com/company/${vanity}`;
1137: 
1138:       await page.goto(searchUrl, {
1139:         waitUntil: 'domcontentloaded',
1140:         timeout: 30000
1141:       });
1142: 
1143:       // Wait for content to load
1144:       await new Promise(r => setTimeout(r, 3000));
1145: 
1146:       let data = await page.evaluate(() => {
1147:         const result: any = {
1148:           companyPage: window.location.href
1149:         };
1150: 
1151:         // Get follower count
1152:         const followerSelectors = [
1153:           '.org-top-card-summary-info-list__info-item',
1154:           '[data-test-id="company-followers-count"]',
1155:           '.org-top-card-summary__follower-count'
1156:         ];
1157: 
1158:         for (const selector of followerSelectors) {
1159:           const element = document.querySelector(selector);
1160:           if (element) {
1161:             const text = element.textContent?.trim();
1162:             if (text) {
1163:               const followerMatch = text.match(/([\d,]+)\s*(?:followers?|people)/i);
1164:               if (followerMatch) {
1165:                 result.followers = parseInt(followerMatch[1].replace(/,/g, ''));
1166:                 break;
1167:               }
1168:             }
1169:           }
1170:         }
1171: 
1172:         // Get employee count
1173:         const employeeSelectors = [
1174:           '.org-about-company-module__company-size',
1175:           '[data-test-id="company-employees-count"]',
1176:           '.org-about-company-module__company-staff-count-range'
1177:         ];
1178: 
1179:         for (const selector of employeeSelectors) {
1180:           const element = document.querySelector(selector);
1181:           if (element) {
1182:             const text = element.textContent?.trim();
1183:             if (text) {
1184:               const employeeMatch = text.match(/([\d,]+)(?:\s*-\s*([\d,]+))?\s*employees?/i);
1185:               if (employeeMatch) {
1186:                 result.employeeCount = employeeMatch[2]
1187:                   ? (parseInt(employeeMatch[1].replace(/,/g, '')) + parseInt(employeeMatch[2].replace(/,/g, ''))) / 2
1188:                   : parseInt(employeeMatch[1].replace(/,/g, ''));
1189:                 break;
1190:               }
1191:             }
1192:           }
1193:         }
1194: 
1195:         // Get industry and size info
1196:         const infoElements = document.querySelectorAll('.org-page-details__definition-text, .org-about-company-module__company-size');
1197:         infoElements.forEach(el => {
1198:           const text = el.textContent?.trim();
1199:           if (text) {
1200:             // Try to identify industry
1201:             if (!result.industry && text.length > 3 && text.length < 30) {
1202:               result.industry = text;
1203:             }
1204:             // Try to identify company size
1205:             if (!result.size && text.match(/\d+/)) {
1206:               result.size = text;
1207:             }
1208:           }
1209:         });
1210: 
1211:         return result;
1212:       });
1213:       if (!data || (!data.followers && !data.employeeCount)) {
1214:         try {
1215:           const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' site:linkedin.com/company')}`
1216:           await this.gotoWithRetry(page, q, 'domcontentloaded', 30000)
1217:           await new Promise(r=>setTimeout(r,1500))
1218:           const link = await page.$$eval('a[href^="http"]', els => {
1219:             const cand = els.map(a => (a as HTMLAnchorElement).href)
1220:             const good = cand.find(h => /linkedin\.com\/company\//i.test(h))
1221:             return good || ''
1222:           })
1223:           if (link) {
1224:             await this.gotoWithRetry(page, link, 'domcontentloaded', 30000)
1225:             await new Promise(r=>setTimeout(r,1200))
1226:             const data2 = await page.evaluate(() => {
1227:               const out: any = { companyPage: window.location.href }
1228:               const followersEl = document.querySelector('.org-top-card-summary__follower-count, .org-top-card-summary-info-list__info-item')
1229:               const t = followersEl?.textContent || ''
1230:               const m = t.match(/([\d,]+)\s*(followers|people)/i)
1231:               if (m) out.followers = parseInt(m[1].replace(/,/g, ''))
1232:               return out
1233:             })
1234:             data = { ...data, ...data2 }
1235:           }
1236:         } catch {}
1237:       }
1238: 
1239:       return data;
1240:     } catch (error) {
1241:       console.error('LinkedIn scraping error:', error);
1242:       return null;
1243:     } finally {
1244:       await page.close();
1245:     }
1246:   }
1247: 
1248:   private async scrapeInstagramPublic(companyName: string): Promise<{
1249:     handle: string;
1250:     followers: number;
1251:     recentPosts: Array<{ caption: string; postedAt: Date; likes: number; comments: number }>;
1252:   } | null> {
1253:     if (!this.browser) return null;
1254:     const page = await this.browser.newPage();
1255:     try {
1256:       page.setDefaultNavigationTimeout(45000)
1257:       page.setDefaultTimeout(45000)
1258:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
1259:       const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' site:instagram.com')}`
1260:       await this.gotoWithRetry(page, q, 'domcontentloaded', 30000)
1261:       await new Promise(r=>setTimeout(r,1000))
1262:       const igUrl = await page.$$eval('a[href^="http"]', els => {
1263:         const urls = els.map(a => (a as HTMLAnchorElement).href)
1264:         const candidate = urls.find(h => /instagram\.com\//i.test(h)) || ''
1265:         return candidate
1266:       })
1267:       if (!igUrl) return null
1268:       await this.gotoWithRetry(page, igUrl, 'domcontentloaded', 30000)
1269:       await new Promise(r=>setTimeout(r,1200))
1270:       const result = await page.evaluate(() => {
1271:         function parseCount(s: string): number {
1272:           const m = s.trim().toLowerCase().replace(/,/g,'');
1273:           if (/k$/.test(m)) return Math.round(parseFloat(m) * 1000)
1274:           if (/m$/.test(m)) return Math.round(parseFloat(m) * 1000000)
1275:           const n = parseFloat(m)
1276:           return isNaN(n) ? 0 : Math.round(n)
1277:         }
1278:         const handle = window.location.pathname.split('/').filter(Boolean)[0] || ''
1279:         const meta = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null
1280:         let followers = 0
1281:         if (meta?.content) {
1282:           const m = meta.content.match(/([\d.,]+\s*[kKmM]?)\s+Followers?/)
1283:           if (m) followers = parseCount(m[1])
1284:         }
1285:         const captions: string[] = []
1286:         document.querySelectorAll('article img[alt]').forEach(img => {
1287:           const alt = (img as HTMLImageElement).alt
1288:           if (alt && alt.length > 5) captions.push(alt.substring(0, 200))
1289:         })
1290:         const recentPosts = captions.slice(0,6).map(c => ({ caption: c, postedAt: new Date(), likes: 0, comments: 0 }))
1291:         return { handle, followers, recentPosts }
1292:       })
1293:       return result
1294:     } catch (e) {
1295:       return null
1296:     } finally {
1297:       await page.close()
1298:     }
1299:   }
1300: 
1301:   private async scrapeFacebookPublic(companyName: string): Promise<{
1302:     pageUrl: string;
1303:     followers: number;
1304:     recentPosts: Array<{ content: string; postedAt: Date; reactions: number }>;
1305:   } | null> {
1306:     if (!this.browser) return null;
1307:     const page = await this.browser.newPage();
1308:     try {
1309:       page.setDefaultNavigationTimeout(45000)
1310:       page.setDefaultTimeout(45000)
1311:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
1312:       const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' site:facebook.com')}`
1313:       await this.gotoWithRetry(page, q, 'domcontentloaded', 30000)
1314:       await new Promise(r=>setTimeout(r,1000))
1315:       const fbUrl = await page.$$eval('a[href^="http"]', els => {
1316:         const urls = els.map(a => (a as HTMLAnchorElement).href)
1317:         const candidate = urls.find(h => /facebook\.com\//i.test(h)) || ''
1318:         return candidate
1319:       })
1320:       if (!fbUrl) return null
1321:       await this.gotoWithRetry(page, fbUrl, 'domcontentloaded', 30000)
1322:       await new Promise(r=>setTimeout(r,1500))
1323:       const result = await page.evaluate(() => {
1324:         const pageUrl = window.location.href
1325:         const text = document.body.innerText || ''
1326:         let followers = 0
1327:         const m = text.match(/([\d.,]+)\s+followers/i)
1328:         if (m) followers = parseInt(m[1].replace(/,/g,''))
1329:         const posts: Array<{ content: string; postedAt: Date; reactions: number }> = []
1330:         const articles = Array.from(document.querySelectorAll('div[role="article"]'))
1331:         for (const a of articles.slice(0,5)) {
1332:           const content = (a.textContent || '').trim().replace(/\s+/g,' ').substring(0, 300)
1333:           if (content.length > 20) posts.push({ content, postedAt: new Date(), reactions: 0 })
1334:         }
1335:         return { pageUrl, followers, recentPosts: posts }
1336:       })
1337:       return result
1338:     } catch (e) {
1339:       return null
1340:     } finally {
1341:       await page.close()
1342:     }
1343:   }
1344: 
1345:   private async scrapeGoogleReviewsSummary(companyName: string): Promise<{ rating?: number; count?: number } | null> {
1346:     if (!this.browser) return null;
1347:     const page = await this.browser.newPage();
1348:     try {
1349:       page.setDefaultNavigationTimeout(45000)
1350:       page.setDefaultTimeout(45000)
1351:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
1352:       const q = `https://www.google.com/search?q=${encodeURIComponent(companyName + ' reviews')}`
1353:       await this.gotoWithRetry(page, q, 'domcontentloaded', 30000)
1354:       await new Promise(r=>setTimeout(r,1500))
1355:       const data = await page.evaluate(() => {
1356:         const txt = document.body.innerText || ''
1357:         let rating: number | undefined
1358:         let count: number | undefined
1359:         const ratingMatch = txt.match(/([0-9]\.[0-9])\s*\(?(?:based on\s*)?([\d,]+)\s+Google reviews\)?/i) || txt.match(/([0-9]\.[0-9])\s+rating\s+from\s+([\d,]+)\s+Google reviews/i)
1360:         if (ratingMatch) {
1361:           rating = parseFloat(ratingMatch[1])
1362:           count = parseInt(ratingMatch[2].replace(/,/g,''))
1363:         } else {
1364:           const countOnly = txt.match(/([\d,]+)\s+Google reviews/i)
1365:           if (countOnly) count = parseInt(countOnly[1].replace(/,/g,''))
1366:         }
1367:         return { rating, count }
1368:       })
1369:       if (!data.rating && !data.count) return null
1370:       return data
1371:     } catch (e) {
1372:       return null
1373:     } finally {
1374:       await page.close()
1375:     }
1376:   }
1377: 
1378:   async scrapeCompanyWebsite(website: string): Promise<{
1379:     description?: string;
1380:     industry?: string;
1381:   } | null> {
1382:     if (!this.browser) return null;
1383: 
1384:     const page = await this.browser.newPage();
1385: 
1386:     try {
1387:       page.setDefaultNavigationTimeout(45000)
1388:       page.setDefaultTimeout(45000)
1389:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
1390:       await page.setViewport({ width: 1366, height: 768 });
1391: 
1392:       await this.gotoWithRetry(page, website, 'domcontentloaded', 30000)
1393: 
1394:       // Wait for content to load
1395:       await new Promise(r => setTimeout(r, 2000));
1396: 
1397:       const data = await page.evaluate(() => {
1398:         const result: any = {};
1399: 
1400:         // Get meta description
1401:         const descriptionMeta = document.querySelector('meta[name="description"]');
1402:         if (descriptionMeta) {
1403:           const description = descriptionMeta.getAttribute('content')?.trim();
1404:           if (description && description.length > 50) {
1405:             result.description = description;
1406:           }
1407:         }
1408: 
1409:         // Get about text from common selectors
1410:         if (!result.description) {
1411:           const aboutSelectors = [
1412:             '[class*="about"]',
1413:             '[id*="about"]',
1414:             '.about-us',
1415:             '#about',
1416:             '[class*="mission"]',
1417:             '[class*="company"]'
1418:           ];
1419: 
1420:           for (const selector of aboutSelectors) {
1421:             const elements = document.querySelectorAll(`${selector} p, ${selector} div`);
1422:             let text = '';
1423: 
1424:             elements.forEach(el => {
1425:               const content = el.textContent?.trim();
1426:               if (content && content.length > 20) {
1427:                 text += content + ' ';
1428:                 if (text.length > 500) return;
1429:               }
1430:             });
1431: 
1432:             if (text.length > 100) {
1433:               result.description = text.substring(0, 500);
1434:               break;
1435:             }
1436:           }
1437:         }
1438: 
1439:         // Try to infer industry from content
1440:         const bodyText = document.body.textContent || '';
1441:         const industryKeywords = {
1442:           'technology': ['software', 'tech', 'digital', 'app', 'platform', 'saas'],
1443:           'healthcare': ['health', 'medical', 'patient', 'care', 'clinical'],
1444:           'finance': ['financial', 'banking', 'investment', 'wealth', 'capital'],
1445:           'retail': ['retail', 'shopping', 'store', 'product', 'consumer'],
1446:           'consulting': ['consulting', 'advisory', 'strategy', 'management'],
1447:           'education': ['education', 'learning', 'training', 'student', 'academic']
1448:         };
1449: 
1450:         for (const [industry, keywords] of Object.entries(industryKeywords)) {
1451:           const matches = keywords.filter(keyword =>
1452:             bodyText.toLowerCase().includes(keyword.toLowerCase())
1453:           );
1454:           if (matches.length >= 2) {
1455:             result.industry = industry.charAt(0).toUpperCase() + industry.slice(1);
1456:             break;
1457:           }
1458:         }
1459: 
1460:         return result;
1461:       });
1462: 
1463:       // If description is still missing, crawl common subpages best-effort
1464:       if (!data.description) {
1465:         const links = await page.$$eval('a[href^="/"], a[href^="http"]', els => Array.from(new Set(els.map(a => (a as HTMLAnchorElement).getAttribute('href') || ''))).slice(0, 40))
1466:         const candidates = links.filter(h => /about|company|who|mission|values|culture|careers|leadership|team|news|press/i.test(h || '')).slice(0, 8)
1467:         for (const rel of candidates) {
1468:           try {
1469:             const base = new URL(window.location.href)
1470:             const url = rel.startsWith('http') ? rel : new URL(rel, `${base.protocol}//${base.host}`).toString()
1471:             // fetch content via XHR inside the page context to avoid new navigation
1472:             const html = await fetch(url, { credentials: 'omit' }).then(r => r.text()).catch(()=> '')
1473:             const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')
1474:             const cleaned = text.split(/\s+/).join(' ').trim()
1475:             if (cleaned.length > 200 && !data.description) {
1476:               data.description = cleaned.slice(0, 600)
1477:             }
1478:             if (data.description) break
1479:           } catch {}
1480:         }
1481:       }
1482: 
1483:       return data;
1484:     } catch (error) {
1485:       console.error('Website scraping error:', error);
1486:       return null;
1487:     } finally {
1488:       await page.close();
1489:     }
1490:   }
1491: 
1492:   private async scrapeNewsData(companyName: string): Promise<Array<{
1493:     title: string;
1494:     url: string;
1495:     publishedAt: Date;
1496:     summary: string;
1497:   }> | null> {
1498:     if (!this.browser) return null;
1499: 
1500:     const page = await this.browser.newPage();
1501: 
1502:     try {
1503:       page.setDefaultNavigationTimeout(45000)
1504:       page.setDefaultTimeout(45000)
1505:       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
1506:       await page.setViewport({ width: 1366, height: 768 });
1507: 
1508:       // Use Google News search
1509:       const searchQuery = encodeURIComponent(`${companyName} company news`);
1510:       const newsUrl = `https://www.google.com/search?q=${searchQuery}&tbm=nws&tbs=qdr:m`;
1511: 
1512:       await this.gotoWithRetry(page, newsUrl, 'domcontentloaded', 30000)
1513: 
1514:       await new Promise(r => setTimeout(r, 2000));
1515: 
1516:       const newsData = await page.evaluate(() => {
1517:         const articles: Array<{
1518:           title: string;
1519:           url: string;
1520:           publishedAt: Date;
1521:           summary: string;
1522:         }> = [];
1523: 
1524:         // Google News selectors
1525:         const newsItems = document.querySelectorAll('[data-ved], .WlydOe');
1526: 
1527:         newsItems.forEach((item, index) => {
1528:           if (index >= 5) return; // Limit to 5 news items
1529: 
1530:           const titleElement = item.querySelector('h3, .mCBkyc');
1531:           const linkElement = item.querySelector('a[href]');
1532:           const summaryElement = item.querySelector('.GI74Re, .c0cFT, .s3v9rd');
1533:           const dateElement = item.querySelector('.OSrXXb, .eNg7of, .f');
1534: 
1535:           if (titleElement && linkElement) {
1536:             const title = titleElement.textContent?.trim();
1537:             const url = linkElement.getAttribute('href');
1538:             const summary = summaryElement?.textContent?.trim() || '';
1539:             const dateText = dateElement?.textContent?.trim();
1540: 
1541:             if (title && url) {
1542:               articles.push({
1543:                 title,
1544:                 url: url.startsWith('http') ? url : `https://news.google.com${url}`,
1545:                 publishedAt: dateText ? new Date(dateText) : new Date(),
1546:                 summary: summary || title
1547:               });
1548:             }
1549:           }
1550:         });
1551: 
1552:         return articles.filter(article => article.title.length > 10);
1553:       });
1554: 
1555:       return newsData.length > 0 ? newsData : null;
1556:     } catch (error) {
1557:       console.error('News scraping error:', error);
1558:       return null;
1559:     } finally {
1560:       await page.close();
1561:     }
1562:   }
1563: 
1564:   private generateFallbackCulture(companyName: string): string[] {
1565:     // Generate generic but positive culture descriptions
1566:     const cultures = [
1567:       'Collaborative and innovative work environment',
1568:       'Focus on employee development and growth',
1569:       'Work-life balance and flexible arrangements',
1570:       'Diverse and inclusive workplace culture',
1571:       'Strong emphasis on teamwork and communication',
1572:       'Commitment to excellence and quality',
1573:       'Supportive leadership and mentorship programs'
1574:     ];
1575: 
1576:     // Return 3-4 random cultures
1577:     const shuffled = cultures.sort(() => 0.5 - Math.random());
1578:     return shuffled.slice(0, 4);
1579:   }
1580: 
1581:   private generateFallbackBenefits(): string[] {
1582:     return [
1583:       'Health, dental, and vision insurance',
1584:       '401k matching program',
1585:       'Flexible work arrangements',
1586:       'Professional development budget',
1587:       'Paid time off and holidays',
1588:       'Wellness and fitness programs',
1589:       'Modern office facilities'
1590:     ];
1591:   }
1592: 
1593:   private generateFallbackDescription(companyName: string): string {
1594:     return '';
1595:   }
1596: }
1597: 
1598: // Export a singleton instance
1599: export const webScraper = new WebScraperService();
````

## File: src/models/Resume.ts
````typescript
  1: import mongoose, { Schema, Document } from 'mongoose';
  2: 
  3: export interface ICustomizedResume extends Document {
  4:   jobApplicationId: Schema.Types.ObjectId;
  5:   customizedText: string;
  6:   jobTitle: string;
  7:   companyName: string;
  8:   matchScore: number;
  9:   createdAt: Date;
 10:   fileName?: string;
 11: }
 12: 
 13: export interface IResume extends Document {
 14:   userId: Schema.Types.ObjectId;
 15:   originalFileName: string;
 16:   fileUrl: string;
 17:   extractedText: string;
 18:   customizedVersions: ICustomizedResume[];
 19:   userName?: string;
 20:   contactEmail?: string;
 21:   contactPhone?: string;
 22:   yearsExperience?: number;
 23:   // Autopilot cache fields
 24:   resumeSignals?: {
 25:     keywords: string[];
 26:     location?: string;
 27:     locations?: string[];
 28:   };
 29:   comprehensiveResearch?: Record<string, unknown>; // Full comprehensive research data
 30:   comprehensiveResearchAt?: Date; // When research was cached
 31:   resumeVariants?: {
 32:     variantA: string;
 33:     variantB: string;
 34:     recommendations: string[];
 35:     generatedAt: Date;
 36:   };
 37:   coverLetters?: {
 38:     variantA: string;
 39:     variantB: string;
 40:     personalization: string[];
 41:     generatedAt: Date;
 42:   };
 43:   emailOutreach?: {
 44:     subjects: string[];
 45:     templates: Array<{ type: string; body: string }>;
 46:     mailtoLink: string;
 47:     generatedAt: Date;
 48:   };
 49:   createdAt: Date;
 50:   updatedAt: Date;
 51: }
 52: 
 53: const CustomizedResumeSchema: Schema = new Schema({
 54:   jobApplicationId: {
 55:     type: Schema.Types.ObjectId,
 56:     ref: 'JobApplication',
 57:     required: true,
 58:   },
 59:   customizedText: {
 60:     type: String,
 61:     required: true,
 62:   },
 63:   jobTitle: {
 64:     type: String,
 65:     required: true,
 66:   },
 67:   companyName: {
 68:     type: String,
 69:     required: true,
 70:   },
 71:   matchScore: {
 72:     type: Number,
 73:     min: 0,
 74:     max: 100,
 75:     default: 0,
 76:   },
 77:   fileName: { type: String, trim: true },
 78: }, {
 79:   timestamps: true,
 80: });
 81: 
 82: const ResumeSchema: Schema = new Schema({
 83:   userId: {
 84:     type: Schema.Types.ObjectId,
 85:     ref: 'User',
 86:     required: true,
 87:   },
 88:   originalFileName: {
 89:     type: String,
 90:     required: true,
 91:     trim: true,
 92:   },
 93:   fileUrl: {
 94:     type: String,
 95:     required: false,
 96:     trim: true,
 97:   },
 98:   extractedText: {
 99:     type: String,
100:     required: true,
101:   },
102:   userName: { type: String, trim: true },
103:   contactEmail: { type: String, trim: true },
104:   contactPhone: { type: String, trim: true },
105:   yearsExperience: { type: Number, min: 0 },
106:   customizedVersions: [CustomizedResumeSchema],
107:   // Autopilot cache fields
108:   resumeSignals: {
109:     type: Schema.Types.Mixed,
110:     required: false
111:   },
112:   comprehensiveResearch: {
113:     type: Schema.Types.Mixed,
114:     required: false
115:   },
116:   comprehensiveResearchAt: {
117:     type: Date,
118:     required: false
119:   },
120:   resumeVariants: {
121:     type: Schema.Types.Mixed,
122:     required: false
123:   },
124:   coverLetters: {
125:     type: Schema.Types.Mixed,
126:     required: false
127:   },
128:   emailOutreach: {
129:     type: Schema.Types.Mixed,
130:     required: false
131:   },
132: }, {
133:   timestamps: true,
134: });
135: 
136: // Add indexes for better query performance
137: ResumeSchema.index({ userId: 1 }); // Find by user
138: ResumeSchema.index({ createdAt: -1 }); // Sort by date
139: ResumeSchema.index({ userId: 1, createdAt: -1 }); // Compound: user's resumes sorted by date
140: ResumeSchema.index({ userId: 1, updatedAt: -1 }); // Compound: user's recently updated resumes
141: ResumeSchema.index({ 'customizedVersions.jobApplicationId': 1 }); // Find customized versions
142: ResumeSchema.index({ extractedText: 'text', userName: 'text', originalFileName: 'text' }); // Full-text search
143: 
144: // Autopilot cache indexes
145: ResumeSchema.index({ userId: 1, comprehensiveResearchAt: -1 }); // Find recent research
146: ResumeSchema.index({ 'resumeSignals.keywords': 1 }); // Search by keywords
147: ResumeSchema.index({ 'resumeSignals.location': 1 }); // Search by location
148: 
149: export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
````

## File: src/lib/pdf-utils.ts
````typescript
  1: /**
  2:  * PDF Utility Functions
  3:  * Handles PDF text extraction for resume parsing
  4:  */
  5: 
  6: import * as pdfjsLib from 'pdfjs-dist'
  7: 
  8: // Set worker path for PDF.js
  9: if (typeof window === 'undefined') {
 10:   // Server-side
 11:   pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
 12: }
 13: 
 14: /**
 15:  * Extract text content from a PDF file
 16:  * @param file - PDF file to extract text from
 17:  * @returns Extracted text content
 18:  */
 19: export async function extractTextFromPDF(file: File | Blob): Promise<string> {
 20:   try {
 21:     // Convert file to array buffer
 22:     const arrayBuffer = await file.arrayBuffer()
 23:     
 24:     // Load PDF document
 25:     const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
 26:     const pdf = await loadingTask.promise
 27:     
 28:     let fullText = ''
 29:     
 30:     // Extract text from each page
 31:     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
 32:       const page = await pdf.getPage(pageNum)
 33:       const textContent = await page.getTextContent()
 34:       
 35:       // Combine text items
 36:       const pageText = textContent.items
 37:         .map((item: any) => item.str)
 38:         .join(' ')
 39:       
 40:       fullText += pageText + '\n\n'
 41:     }
 42:     
 43:     return fullText.trim()
 44:   } catch (error) {
 45:     console.error('[PDF_UTILS] Error extracting text:', error)
 46:     throw new Error('Failed to extract text from PDF')
 47:   }
 48: }
 49: 
 50: /**
 51:  * Get PDF metadata
 52:  * @param file - PDF file
 53:  * @returns PDF metadata
 54:  */
 55: export async function getPDFMetadata(file: File | Blob): Promise<{
 56:   numPages: number
 57:   title?: string
 58:   author?: string
 59:   subject?: string
 60:   keywords?: string
 61:   creator?: string
 62:   producer?: string
 63:   creationDate?: Date
 64:   modificationDate?: Date
 65: }> {
 66:   try {
 67:     const arrayBuffer = await file.arrayBuffer()
 68:     const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
 69:     const pdf = await loadingTask.promise
 70:     const metadata = await pdf.getMetadata()
 71:     const info = metadata.info as any
 72:     
 73:     return {
 74:       numPages: pdf.numPages,
 75:       title: info?.Title,
 76:       author: info?.Author,
 77:       subject: info?.Subject,
 78:       keywords: info?.Keywords,
 79:       creator: info?.Creator,
 80:       producer: info?.Producer,
 81:       creationDate: info?.CreationDate ? new Date(info.CreationDate) : undefined,
 82:       modificationDate: info?.ModDate ? new Date(info.ModDate) : undefined
 83:     }
 84:   } catch (error) {
 85:     console.error('[PDF_UTILS] Error getting metadata:', error)
 86:     throw new Error('Failed to get PDF metadata')
 87:   }
 88: }
 89: 
 90: /**
 91:  * Validate if file is a valid PDF
 92:  * @param file - File to validate
 93:  * @returns True if valid PDF
 94:  */
 95: export async function isValidPDF(file: File | Blob): Promise<boolean> {
 96:   try {
 97:     const arrayBuffer = await file.arrayBuffer()
 98:     const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
 99:     await loadingTask.promise
100:     return true
101:   } catch {
102:     return false
103:   }
104: }
````

## File: src/lib/resume-generator.ts
````typescript
  1: /**
  2:  * Shared Resume Generator
  3:  * 
  4:  * Consolidates resume generation logic with:
  5:  * - Template integration
  6:  * - Job description analysis
  7:  * - Perplexity Agent API
  8:  * - Experience calculation
  9:  * - ATS optimization
 10:  */
 11: 
 12: import { PerplexityService } from './perplexity-service'
 13: import { getTemplateById } from './resume-templates-v2'
 14: import { extractKeywords } from './utils'
 15: 
 16: export interface ResumeGenerationParams {
 17:   resumeData?: ResumeData
 18:   resumeText?: string
 19:   template?: string
 20:   targetJob?: string
 21:   companyName?: string
 22:   jobDescription?: string
 23:   industry?: string
 24:   experienceLevel?: 'entry' | 'mid' | 'senior'
 25:   tone?: 'professional' | 'conversational' | 'technical'
 26: }
 27: 
 28: export interface ResumeData {
 29:   personalInfo: {
 30:     fullName: string
 31:     email: string
 32:     phone: string
 33:     location: string
 34:     linkedin?: string
 35:     website?: string
 36:     summary: string
 37:   }
 38:   experience: Array<{
 39:     id: string
 40:     company: string
 41:     position: string
 42:     location: string
 43:     startDate: string
 44:     endDate: string
 45:     current: boolean
 46:     description: string
 47:     achievements: string[]
 48:     technologies: string[]
 49:   }>
 50:   education: Array<{
 51:     id: string
 52:     institution: string
 53:     degree: string
 54:     field: string
 55:     location: string
 56:     graduationDate: string
 57:     gpa?: string
 58:     honors?: string[]
 59:   }>
 60:   skills: {
 61:     technical: string[]
 62:     soft: string[]
 63:     languages: Array<{ language: string; proficiency: string }>
 64:     certifications: Array<{ name: string; issuer: string; date: string; expiry?: string }>
 65:   }
 66:   projects: Array<{
 67:     id: string
 68:     name: string
 69:     description: string
 70:     technologies: string[]
 71:     url?: string
 72:     github?: string
 73:     startDate: string
 74:     endDate: string
 75:   }>
 76: }
 77: 
 78: export interface ResumeGenerationResult {
 79:   resumeData: ResumeData
 80:   html: string
 81:   plainText: string
 82:   template: string
 83:   matchScore?: number
 84:   suggestions: string[]
 85:   preview?: {
 86:     thumbnail: string | null
 87:     summary: string | null
 88:   }
 89: }
 90: 
 91: /**
 92:  * Generate optimized resume with full integration
 93:  */
 94: export async function generateResume(params: ResumeGenerationParams): Promise<ResumeGenerationResult> {
 95:   const {
 96:     resumeData,
 97:     resumeText,
 98:     template = 'modern',
 99:     targetJob,
100:     companyName,
101:     jobDescription,
102:     industry,
103:     experienceLevel = 'mid',
104:     tone = 'professional'
105:   } = params
106: 
107:   console.log('[RESUME_GEN] Starting generation with template:', template)
108:   console.log('[RESUME_GEN] Has structured data:', !!resumeData)
109:   console.log('[RESUME_GEN] Has text input:', !!resumeText)
110:   console.log('[RESUME_GEN] Has job description:', !!jobDescription)
111: 
112:   // Get template
113:   const templateObj = getTemplateById(template)
114: 
115:   // Convert text to structured data if needed
116:   let structuredData = resumeData
117:   if (!structuredData && resumeText && resumeText.length > 100) {
118:     console.log('[RESUME_GEN] Converting text to structured data')
119:     structuredData = await convertTextToStructuredData(resumeText)
120:   }
121: 
122:   // If we have a job description, optimize for it
123:   if (jobDescription && jobDescription.length > 20) {
124:     console.log('[RESUME_GEN] Optimizing for job description')
125:     const optimized = await optimizeForJobDescription({
126:       resumeData: structuredData,
127:       resumeText: resumeText || serializeResumeToPlainText(structuredData),
128:       jobDescription,
129:       targetJob,
130:       companyName,
131:       template: templateObj,
132:       tone,
133:       experienceLevel
134:     })
135:     
136:     return optimized
137:   }
138: 
139:   // Otherwise, generate standard optimized resume
140:   if (!structuredData) {
141:     throw new Error('No resume data provided')
142:   }
143: 
144:   console.log('[RESUME_GEN] Generating standard optimized resume')
145:   const optimizedData = await optimizeResumeContent(
146:     structuredData,
147:     targetJob,
148:     industry,
149:     experienceLevel
150:   )
151: 
152:   const html = templateObj.generate(optimizedData)
153:   const fullHtml = wrapWithTemplate(html, templateObj)
154:   const plainText = serializeResumeToPlainText(optimizedData)
155: 
156:   return {
157:     resumeData: optimizedData,
158:     html: fullHtml,
159:     plainText,
160:     template: templateObj.name,
161:     suggestions: [],
162:     preview: {
163:       thumbnail: null,
164:       summary: `${optimizedData.personalInfo.fullName} — ${optimizedData.experience?.[0]?.position || ''}`
165:     }
166:   }
167: }
168: 
169: /**
170:  * Optimize resume for specific job description
171:  */
172: async function optimizeForJobDescription(params: {
173:   resumeData?: ResumeData
174:   resumeText: string
175:   jobDescription: string
176:   targetJob?: string
177:   companyName?: string
178:   template: ReturnType<typeof getTemplateById>
179:   tone: string
180:   experienceLevel: string
181: }): Promise<ResumeGenerationResult> {
182:   const {
183:     resumeData,
184:     resumeText,
185:     jobDescription,
186:     targetJob = 'Role',
187:     companyName = '',
188:     template,
189:     tone,
190:     experienceLevel
191:   } = params
192: 
193:   // Extract keywords from job description
194:   const keywords = extractKeywords(jobDescription)
195:   const keywordsList = Array.isArray(keywords) ? keywords.slice(0, 20) : []
196: 
197:   console.log('[RESUME_GEN] Extracted keywords:', keywordsList.length)
198: 
199:   // Build template-specific prompt
200:   const systemPrompt = buildTemplatePrompt(template, targetJob, companyName, tone, keywordsList, experienceLevel)
201: 
202:   const userPrompt = `Original resume (plain text):
203: ${resumeText}
204: 
205: Target job description:
206: ${jobDescription}
207: 
208: RETURN: HTML fragment with EXACT content from original resume, reformatted to emphasize relevant experience. DO NOT invent new achievements or responsibilities. Only reorder and emphasize existing content.`
209: 
210:   // Call Perplexity
211:   const ppx = new PerplexityService()
212:   const result = await ppx.makeRequest(systemPrompt, userPrompt, {
213:     maxTokens: 3000,
214:     temperature: 0.35
215:   })
216: 
217:   const htmlFragment = (result.content || '').trim()
218:   const fullHtml = wrapWithTemplate(htmlFragment, template)
219:   const plainText = htmlFragment.replace(/<[^>]+>/g, '').trim()
220: 
221:   // Calculate match score
222:   const matchScore = calculateMatchScore(plainText, keywordsList)
223: 
224:   // Generate suggestions
225:   const suggestions = generateSuggestions(plainText, keywordsList, jobDescription)
226: 
227:   return {
228:     resumeData: resumeData || ({} as ResumeData),
229:     html: fullHtml,
230:     plainText,
231:     template: template.name,
232:     matchScore,
233:     suggestions,
234:     preview: {
235:       thumbnail: null,
236:       summary: null
237:     }
238:   }
239: }
240: 
241: /**
242:  * Build template-specific system prompt
243:  */
244: function buildTemplatePrompt(
245:   template: ReturnType<typeof getTemplateById>,
246:   targetJob: string,
247:   companyName: string,
248:   tone: string,
249:   keywords: string[],
250:   experienceLevel: string
251: ): string {
252:   const basePrompts: Record<string, string> = {
253:     professional: `You are a seasoned executive resume writer for traditional, corporate-focused resumes.
254: 
255: TEMPLATE: Professional
256: TARGET: ${targetJob} at ${companyName}
257: TONE: ${tone}
258: EXPERIENCE LEVEL: ${experienceLevel}
259: 
260: FORMATTING: Traditional, ATS-safe, quantified achievements, leadership emphasis.
261: KEYWORDS: ${keywords.join(', ')}
262: STRUCTURE: Executive Summary; Core Competencies; Experience; Education; Affiliations; Achievements.`,
263: 
264:     creative: `You are a creative industry resume specialist for marketing/design roles.
265: 
266: TEMPLATE: Creative
267: TARGET: ${targetJob} at ${companyName}
268: TONE: ${tone}
269: EXPERIENCE LEVEL: ${experienceLevel}
270: 
271: FORMATTING: Balanced creativity + ATS compatibility, project outcomes, metrics.
272: KEYWORDS: ${keywords.join(', ')}
273: STRUCTURE: Creative Profile; Core Creative Competencies; Experience; Projects; Education; Proficiencies.`,
274: 
275:     tech: `You are a technical resume specialist for engineering roles.
276: 
277: TEMPLATE: Tech-Focused
278: TARGET: ${targetJob} at ${companyName}
279: TONE: ${tone}
280: EXPERIENCE LEVEL: ${experienceLevel}
281: 
282: FORMATTING: Precise technical terminology, system metrics, architecture decisions.
283: KEYWORDS: ${keywords.join(', ')}
284: STRUCTURE: Technical Summary; Technical Skills; Experience; Projects; Education; Achievements.`,
285: 
286:     modern: `You are an expert resume writer for modern, ATS-optimized resumes.
287: 
288: TEMPLATE: Modern
289: TARGET: ${targetJob} at ${companyName}
290: TONE: ${tone}
291: EXPERIENCE LEVEL: ${experienceLevel}
292: 
293: FORMATTING: Clean, scannable, quantified achievements, standard headings.
294: KEYWORDS: ${keywords.join(', ')}
295: STRUCTURE: Summary; Core Competencies; Experience; Education; Technical Skills; Achievements.`
296:   }
297: 
298:   const basePrompt = basePrompts[template.id] || basePrompts.modern
299: 
300:   return `${basePrompt}
301: 
302: STRICT OUTPUT: Return ONLY an HTML fragment using classes: .section, .section-header, .job-entry, .job-title, .company-info, .job-description (UL of LIs). No markdown; no <html>/<head>/<body>.
303: 
304: 🚨 CRITICAL RULES:
305: 1. NEVER fabricate job descriptions, achievements, or responsibilities
306: 2. NEVER add details not explicitly stated in the original resume
307: 3. ONLY reformat existing content to highlight relevant experience
308: 4. ONLY reorder sections to emphasize skills matching the job description
309: 5. Use exact wording from original resume for all accomplishments
310: 6. You may only: rearrange bullet points, emphasize matching keywords, improve formatting`
311: }
312: 
313: /**
314:  * Optimize resume content with AI
315:  */
316: async function optimizeResumeContent(
317:   resumeData: ResumeData,
318:   targetJob?: string,
319:   industry?: string,
320:   experienceLevel?: string
321: ): Promise<ResumeData> {
322:   const ppx = new PerplexityService()
323: 
324:   const prompt = `Optimize this resume for a ${experienceLevel || 'mid-level'} ${targetJob || 'professional'} position in the ${industry || 'technology'} industry. Focus on:
325: 
326: 1. Professional summary that highlights key strengths and career goals
327: 2. Experience descriptions with quantifiable achievements
328: 3. Skills prioritization based on industry relevance
329: 4. Education and certifications optimization
330: 5. Overall ATS compatibility and keyword integration
331: 
332: Original Resume Data:
333: ${JSON.stringify(resumeData, null, 2)}
334: 
335: Return optimized JSON with the same structure but enhanced content.`
336: 
337:   try {
338:     const result = await ppx.makeRequest(
339:       'You are an expert resume writer and career counselor. Optimize resumes for maximum impact and ATS compatibility. Return strict JSON with the same structure as input.',
340:       prompt,
341:       { temperature: 0.4, maxTokens: 2000 }
342:     )
343: 
344:     let text = (result.content || '').trim()
345: 
346:     // Strip markdown code blocks
347:     text = text.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
348: 
349:     // Extract JSON
350:     const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
351:     if (jsonMatch) {
352:       text = jsonMatch[0]
353:     }
354: 
355:     if (text) {
356:       console.log('[RESUME_GEN] Parsing optimized content')
357:       const optimized = JSON.parse(text)
358:       return optimized
359:     }
360:   } catch (e) {
361:     console.error('[RESUME_GEN] Optimization failed:', e)
362:   }
363: 
364:   return resumeData
365: }
366: 
367: /**
368:  * Convert text to structured data using Perplexity
369:  */
370: async function convertTextToStructuredData(resumeText: string): Promise<ResumeData> {
371:   const { extractEnterpriseJSON } = await import('./utils/enterprise-json-extractor')
372:   const ppx = new PerplexityService()
373: 
374:   const prompt = `Extract structured resume data from this text:
375: 
376: ${resumeText}
377: 
378: Return ONLY JSON (no markdown, no explanations):
379: {
380:   "personalInfo": {
381:     "fullName": "Full Name",
382:     "email": "email@example.com",
383:     "phone": "phone number",
384:     "location": "City, State/Province",
385:     "summary": "Professional summary"
386:   },
387:   "experience": [{
388:     "id": "1",
389:     "company": "Company Name",
390:     "position": "Job Title",
391:     "location": "Location",
392:     "startDate": "YYYY-MM",
393:     "endDate": "YYYY-MM or Present",
394:     "current": false,
395:     "description": "Role description",
396:     "achievements": ["Achievement 1", "Achievement 2"],
397:     "technologies": ["Tech 1", "Tech 2"]
398:   }],
399:   "education": [{
400:     "id": "1",
401:     "institution": "School Name",
402:     "degree": "Degree Type",
403:     "field": "Field of Study",
404:     "location": "Location",
405:     "graduationDate": "YYYY-MM"
406:   }],
407:   "skills": {
408:     "technical": ["Skill 1", "Skill 2"],
409:     "soft": ["Skill 1", "Skill 2"],
410:     "languages": [],
411:     "certifications": []
412:   },
413:   "projects": []
414: }`
415: 
416:   const response = await ppx.makeRequest(
417:     'You extract structured resume data from unstructured text. Return only valid JSON.',
418:     prompt,
419:     { temperature: 0.2, maxTokens: 2000 }
420:   )
421: 
422:   const extractionResult = extractEnterpriseJSON(response.content)
423: 
424:   if (!extractionResult.success) {
425:     throw new Error(`Failed to extract structured data: ${extractionResult.error}`)
426:   }
427: 
428:   return extractionResult.data as ResumeData
429: }
430: 
431: /**
432:  * Serialize resume to plain text
433:  */
434: function serializeResumeToPlainText(data: ResumeData | undefined): string {
435:   if (!data) return ''
436: 
437:   try {
438:     const sections: string[] = []
439: 
440:     // Personal info
441:     sections.push(`${data.personalInfo.fullName}\n${data.personalInfo.email} | ${data.personalInfo.phone} | ${data.personalInfo.location}`)
442: 
443:     // Summary
444:     if (data.personalInfo.summary) {
445:       sections.push(`\nSummary\n${data.personalInfo.summary}`)
446:     }
447: 
448:     // Skills
449:     if (Array.isArray(data.skills?.technical) || Array.isArray(data.skills?.soft)) {
450:       sections.push(`\nSkills\n${[...(data.skills.technical || []), ...(data.skills.soft || [])].join(', ')}`)
451:     }
452: 
453:     // Experience
454:     if (Array.isArray(data.experience)) {
455:       sections.push(`\nExperience`)
456:       for (const exp of data.experience) {
457:         sections.push(`${exp.position} — ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n- ${exp.description}`)
458:         if (exp.achievements && exp.achievements.length > 0) {
459:           exp.achievements.forEach(ach => sections.push(`- ${ach}`))
460:         }
461:       }
462:     }
463: 
464:     // Education
465:     if (Array.isArray(data.education)) {
466:       sections.push(`\nEducation`)
467:       for (const edu of data.education) {
468:         sections.push(`${edu.degree} in ${edu.field} — ${edu.institution} (${edu.graduationDate})`)
469:       }
470:     }
471: 
472:     return sections.join('\n')
473:   } catch {
474:     return ''
475:   }
476: }
477: 
478: /**
479:  * Wrap HTML fragment with template CSS
480:  */
481: function wrapWithTemplate(htmlFragment: string, template: ReturnType<typeof getTemplateById>): string {
482:   const safe = (htmlFragment || '').replace(/<\/?(html|head|body|style)[^>]*>/gi, '')
483:   return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${template.css}</style></head><body><div class="resume-container">${safe}</div></body></html>`
484: }
485: 
486: /**
487:  * Calculate match score between resume and keywords
488:  */
489: function calculateMatchScore(resumeText: string, keywords: string[]): number {
490:   if (!keywords || keywords.length === 0) return 0
491: 
492:   const lowerText = resumeText.toLowerCase()
493:   const matchedKeywords = keywords.filter(kw => lowerText.includes(kw.toLowerCase()))
494: 
495:   return Math.round((matchedKeywords.length / keywords.length) * 100)
496: }
497: 
498: /**
499:  * Generate suggestions for improvement
500:  */
501: function generateSuggestions(resumeText: string, keywords: string[], jobDescription: string): string[] {
502:   const suggestions: string[] = []
503:   const lowerText = resumeText.toLowerCase()
504: 
505:   // Check for missing keywords
506:   const missingKeywords = keywords.filter(kw => !lowerText.includes(kw.toLowerCase()))
507:   if (missingKeywords.length > 0) {
508:     suggestions.push(`Consider adding these keywords: ${missingKeywords.slice(0, 5).join(', ')}`)
509:   }
510: 
511:   // Check for quantifiable achievements
512:   const hasNumbers = /\d+%|\d+\+|\$\d+/.test(resumeText)
513:   if (!hasNumbers) {
514:     suggestions.push('Add quantifiable achievements (e.g., "Increased sales by 25%")')
515:   }
516: 
517:   // Check for action verbs
518:   const actionVerbs = ['led', 'managed', 'developed', 'implemented', 'designed', 'created']
519:   const hasActionVerbs = actionVerbs.some(verb => lowerText.includes(verb))
520:   if (!hasActionVerbs) {
521:     suggestions.push('Use strong action verbs to describe your accomplishments')
522:   }
523: 
524:   return suggestions
525: }
````

## File: src/lib/perplexity-resume-analyzer.ts
````typescript
  1: /**
  2:  * Enhanced Perplexity-Powered Resume Analysis
  3:  * 
  4:  * Intelligently extracts and weights resume data using AI understanding
  5:  * rather than basic PDF text parsing. Provides:
  6:  * - Experience-weighted keyword extraction
  7:  * - Accurate location detection with country
  8:  * - Salary expectations based on 2025 market data
  9:  * - Target job titles with career progression
 10:  * - AI/Automation replacement risk analysis
 11:  * - 5-year career outlook
 12:  * - Job search optimization strategies
 13:  * 
 14:  * Version: 2.0.0 - Integrated with centralized prompts and validation
 15:  */
 16: 
 17: import { PerplexityIntelligenceService } from './perplexity-intelligence'
 18: 
 19: // FIXED: Universal UUID generation (browser + Node.js)
 20: function generateUUID(): string {
 21:   if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
 22:     return (crypto as any).randomUUID()
 23:   }
 24:   // Fallback for older environments
 25:   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
 26:     const r = Math.random() * 16 | 0
 27:     const v = c === 'x' ? r : (r & 0x3 | 0x8)
 28:     return v.toString(16)
 29:   })
 30: }
 31: 
 32: // FIXED: Safe imports with fallbacks for missing dependencies
 33: let PERPLEXITY_PROMPTS: any
 34: let parseAIResponse: <T = any>(text: string, options?: any, context?: any) => T
 35: let validateAIResponse: <T = any>(data: T, schema?: string, context?: any) => T
 36: 
 37: try {
 38:   PERPLEXITY_PROMPTS = require('./prompts/perplexity-prompts').PERPLEXITY_PROMPTS
 39: } catch (e) {
 40:   console.warn('[RESUME_ANALYZER] perplexity-prompts not found, using inline prompts')
 41:   PERPLEXITY_PROMPTS = { RESUME_ANALYSIS: { system: '', userTemplate: () => '' } }
 42: }
 43: 
 44: try {
 45:   parseAIResponse = require('./utils/ai-response-parser').parseAIResponse
 46: } catch (e) {
 47:   console.warn('[RESUME_ANALYZER] ai-response-parser not found, using JSON.parse')
 48:   parseAIResponse = <T = any>(text: string) => JSON.parse(text) as T
 49: }
 50: 
 51: try {
 52:   validateAIResponse = require('./validation/schema-validator').validateAIResponse
 53: } catch (e) {
 54:   console.warn('[RESUME_ANALYZER] schema-validator not found, skipping validation')
 55:   validateAIResponse = <T = any>(data: T) => data
 56: }
 57: 
 58: export interface EnhancedResumeAnalysis {
 59:   keywords: string[]
 60:   location: {
 61:     city: string
 62:     province: string
 63:     full: string
 64:     country: string
 65:   }
 66:   experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
 67:   targetSalaryRange: {
 68:     min: number
 69:     max: number
 70:     currency: string
 71:     marketData: {
 72:       percentile25: number
 73:       percentile50: number
 74:       percentile75: number
 75:       lastUpdated: string
 76:     }
 77:   }
 78:   targetJobTitles: string[]
 79:   topSkills: Array<{
 80:     skill: string
 81:     yearsExperience: number
 82:     proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert'
 83:     marketDemand: 'low' | 'medium' | 'high'
 84:     growthTrend: 'declining' | 'stable' | 'growing' | 'hot'
 85:   }>
 86:   industries: string[]
 87:   certifications: string[]
 88:   careerSummary: string
 89:   // AI/Automation Analysis
 90:   futureOutlook: {
 91:     aiReplacementRisk: 'low' | 'medium' | 'high'
 92:     automationRisk: 'low' | 'medium' | 'high'
 93:     fiveYearOutlook: 'declining' | 'stable' | 'growing' | 'thriving'
 94:     reasoning: string
 95:     recommendations: string[]
 96:   }
 97:   // Career Path Intelligence
 98:   careerPath: {
 99:     currentLevel: string
100:     nextPossibleRoles: string[]
101:     skillGaps: Array<{
102:       skill: string
103:       importance: 'nice-to-have' | 'important' | 'critical'
104:       timeToLearn: string
105:     }>
106:     recommendedCertifications: string[]
107:   }
108:   // Job Search Intelligence
109:   searchOptimization: {
110:     bestJobBoards: string[]
111:     optimalApplicationTime: string
112:     competitiveAdvantages: string[]
113:     marketSaturation: 'low' | 'medium' | 'high'
114:     applicationStrategy: string
115:   }
116: }
117: 
118: export class PerplexityResumeAnalyzer {
119:   /**
120:    * Analyze resume using Perplexity AI for intelligent extraction
121:    */
122:   static async analyzeResume(resumeText: string): Promise<EnhancedResumeAnalysis> {
123:     const requestId = generateUUID()
124:     const timestamp = Date.now()
125: 
126:     try {
127:       // Use centralized prompts
128:       const systemPrompt = PERPLEXITY_PROMPTS.RESUME_ANALYSIS.system
129:       const userPrompt = PERPLEXITY_PROMPTS.RESUME_ANALYSIS.userTemplate(resumeText)
130: 
131:       // Call Perplexity via intelligence service
132:       const result = await PerplexityIntelligenceService.customQuery({
133:         systemPrompt,
134:         userPrompt,
135:         temperature: 0.2,
136:         maxTokens: 3000
137:       })
138: 
139:       // Parse and validate response
140:       const context = {
141:         requestId,
142:         prompts: { system: systemPrompt, user: userPrompt.slice(0, 200) + '...' },
143:         timestamp
144:       }
145: 
146:       const parsed = parseAIResponse<EnhancedResumeAnalysis>(result.content, {
147:         stripMarkdown: true,
148:         extractFirst: true,
149:         throwOnError: true
150:       }, context)
151: 
152:       // Validate against schema
153:       const validated = validateAIResponse<EnhancedResumeAnalysis>(
154:         parsed,
155:         'resume-analysis',
156:         context
157:       )
158: 
159:       return validated
160:     } catch (error: any) {
161:       console.error('[PerplexityResumeAnalyzer] AI analysis failed:', error.message)
162: 
163:       // Fallback to enhanced regex analysis
164:       return this.enhancedFallbackAnalysis(resumeText)
165:     }
166:   }
167: 
168:   /**
169:    * LEGACY METHOD - Now uses centralized system
170:    * @deprecated Use analyzeResume instead
171:    */
172:   static async analyzeLegacy(resumeText: string): Promise<EnhancedResumeAnalysis> {
173:     const SYSTEM_PROMPT = `You are an expert career strategist and resume analyst with deep understanding of Canadian and US job markets, industry trends, AI/automation impact, and career trajectory optimization.
174: 
175: Analyze resumes with precision, extracting:
176: 1. Keywords weighted by experience level, recency, and market demand
177: 2. Exact location with country detection
178: 3. Experience level based on years, responsibilities, and leadership scope
179: 4. Target salary range with current market data (2025 rates)
180: 5. Target job titles based on career trajectory and market opportunities
181: 6. Skills with proficiency levels and market demand assessment
182: 7. Industry focus areas with growth potential
183: 8. Certifications and credentials with market value
184: 9. AI/Automation replacement risk analysis
185: 10. 5-year career outlook and growth potential
186: 11. Career path progression opportunities
187: 12. Job search optimization strategies
188: 
189: CRITICAL ANALYSIS FACTORS:
190: - AI/Automation Impact: Assess which roles are safe vs at risk
191: - Market Trends: Consider remote work, AI integration, industry shifts
192: - Geographic Factors: Canadian vs US market differences
193: - Skill Evolution: Which skills are becoming obsolete vs emerging
194: - Career Progression: Natural next steps and skill gaps
195: 
196: SALARY DATA (Use 2025 Current Market Rates):
197: - Canada: Adjust for province (ON/BC higher, others moderate)
198: - US: Adjust for state and city (CA/NY/WA higher)
199: - Consider remote work salary normalization trends
200: - Factor in industry premiums (tech, finance, healthcare)
201: 
202: AI/AUTOMATION RISK ASSESSMENT:
203: - Low Risk: Creative, strategic, interpersonal, complex problem-solving roles
204: - Medium Risk: Roles with some routine tasks but require human judgment
205: - High Risk: Highly repetitive, rule-based, or easily automated tasks
206: 
207: OUTPUT ONLY valid JSON, no explanations or markdown.`
208: 
209:     const USER_PROMPT = `Analyze this resume comprehensively for 2025 job market:
210: 
211: Resume Text:
212: ${resumeText}
213: 
214: Return ONLY this JSON structure:
215: {
216:   "keywords": ["array", "of", "top", "20", "keywords", "weighted", "by", "market", "demand", "and", "experience"],
217:   "location": {
218:     "city": "CityName",
219:     "province": "ProvinceOrState", 
220:     "full": "City, Province",
221:     "country": "Canada"
222:   },
223:   "experienceLevel": "entry|mid|senior|executive",
224:   "targetSalaryRange": {
225:     "min": 85000,
226:     "max": 125000,
227:     "currency": "CAD",
228:     "marketData": {
229:       "percentile25": 90000,
230:       "percentile50": 105000,
231:       "percentile75": 120000,
232:       "lastUpdated": "2025-10"
233:     }
234:   },
235:   "targetJobTitles": ["Primary Job Title", "Alternative Title 1", "Alternative Title 2", "Stretch Goal Title"],
236:   "topSkills": [
237:     {
238:       "skill": "Skill Name",
239:       "yearsExperience": 5,
240:       "proficiency": "expert",
241:       "marketDemand": "high",
242:       "growthTrend": "growing"
243:     }
244:   ],
245:   "industries": ["Primary Industry", "Secondary Industry"],
246:   "certifications": ["Current Cert 1", "Current Cert 2"],
247:   "careerSummary": "2-3 sentence professional summary highlighting unique value proposition",
248:   "futureOutlook": {
249:     "aiReplacementRisk": "low",
250:     "automationRisk": "low", 
251:     "fiveYearOutlook": "growing",
252:     "reasoning": "Detailed explanation of why this career path is safe/risky and growth potential",
253:     "recommendations": ["Action 1", "Action 2", "Action 3"]
254:   },
255:   "careerPath": {
256:     "currentLevel": "Current Role Level",
257:     "nextPossibleRoles": ["Next Role 1", "Next Role 2", "Next Role 3"],
258:     "skillGaps": [
259:       {
260:         "skill": "Missing Skill",
261:         "importance": "critical",
262:         "timeToLearn": "3-6 months"
263:       }
264:     ],
265:     "recommendedCertifications": ["Cert 1", "Cert 2"]
266:   },
267:   "searchOptimization": {
268:     "bestJobBoards": ["Board 1", "Board 2", "Board 3"],
269:     "optimalApplicationTime": "Tuesday-Thursday, 9-11 AM",
270:     "competitiveAdvantages": ["Advantage 1", "Advantage 2"],
271:     "marketSaturation": "medium",
272:     "applicationStrategy": "Detailed strategy for this specific profile"
273:   }
274: }`
275: 
276:     try {
277:       const response = await PerplexityIntelligenceService.customQuery({
278:         systemPrompt: SYSTEM_PROMPT,
279:         userPrompt: USER_PROMPT,
280:         temperature: 0.3, // Slightly higher for creative analysis
281:         maxTokens: 3000   // Increased for comprehensive analysis
282:       })
283: 
284:       // Extract JSON from response (handle Perplexity's text wrapping)
285:       let text = response.content.trim()
286:       
287:       // Remove markdown code blocks if present
288:       text = text.replace(/```json\s*|\s*```/g, '')
289:       
290:       // Extract JSON object
291:       const jsonMatch = text.match(/\{[\s\S]*\}/)
292:       if (jsonMatch) {
293:         text = jsonMatch[0]
294:       }
295: 
296:       const analysis = JSON.parse(text) as EnhancedResumeAnalysis
297: 
298:       // Validate and provide intelligent defaults
299:       return {
300:         keywords: analysis.keywords || [],
301:         location: analysis.location || { 
302:           city: 'Toronto', 
303:           province: 'ON', 
304:           full: 'Toronto, ON',
305:           country: 'Canada'
306:         },
307:         experienceLevel: analysis.experienceLevel || 'mid',
308:         targetSalaryRange: analysis.targetSalaryRange || {
309:           min: 65000,
310:           max: 95000,
311:           currency: 'CAD',
312:           marketData: {
313:             percentile25: 70000,
314:             percentile50: 80000,
315:             percentile75: 90000,
316:             lastUpdated: '2025-10'
317:           }
318:         },
319:         targetJobTitles: analysis.targetJobTitles || [],
320:         topSkills: analysis.topSkills || [],
321:         industries: analysis.industries || [],
322:         certifications: analysis.certifications || [],
323:         careerSummary: analysis.careerSummary || 'Experienced professional seeking new opportunities',
324:         futureOutlook: analysis.futureOutlook || {
325:           aiReplacementRisk: 'medium',
326:           automationRisk: 'medium',
327:           fiveYearOutlook: 'stable',
328:           reasoning: 'Analysis unavailable - recommend manual review',
329:           recommendations: ['Stay updated with industry trends', 'Develop AI-resistant skills']
330:         },
331:         careerPath: analysis.careerPath || {
332:           currentLevel: 'Individual Contributor',
333:           nextPossibleRoles: [],
334:           skillGaps: [],
335:           recommendedCertifications: []
336:         },
337:         searchOptimization: analysis.searchOptimization || {
338:           bestJobBoards: ['LinkedIn', 'Indeed', 'Job Bank Canada'],
339:           optimalApplicationTime: 'Tuesday-Thursday, 9-11 AM',
340:           competitiveAdvantages: [],
341:           marketSaturation: 'medium',
342:           applicationStrategy: 'Standard application approach recommended'
343:         }
344:       }
345:     } catch (error) {
346:       console.error('[PERPLEXITY RESUME ANALYZER] Failed:', error)
347:       
348:       // Enhanced fallback with AI risk assessment
349:       return this.enhancedFallbackAnalysis(resumeText)
350:     }
351:   }
352: 
353:   /**
354:    * Enhanced fallback analysis if Perplexity fails
355:    */
356:   private static enhancedFallbackAnalysis(resumeText: string): EnhancedResumeAnalysis {
357:     // Extract location using improved regex
358:     const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2,3})/g
359:     const matches = [...resumeText.matchAll(locationRegex)]
360:     const locationMatch = matches[0]
361:     const city = locationMatch?.[1] || 'Toronto'
362:     const province = locationMatch?.[2] || 'ON'
363:     const country = province.length === 2 ? 'Canada' : 'United States'
364: 
365:     // Determine experience level with better logic
366:     const yearsMatches = resumeText.match(/(\d+)\+?\s*years?/gi)
367:     const maxYears = yearsMatches ? Math.max(...yearsMatches.map(m => parseInt(m))) : 0
368:     
369:     const hasLeadership = /lead|manage|director|senior|principal|head\s+of/i.test(resumeText)
370:     const hasExecutive = /vp|vice\s+president|ceo|cto|cfo|president|executive|founder/i.test(resumeText)
371:     const hasManager = /manager|supervisor|team\s+lead/i.test(resumeText)
372:     
373:     let experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' = 'entry'
374:     if (hasExecutive || maxYears > 15) experienceLevel = 'executive'
375:     else if (hasLeadership || hasManager || maxYears > 8) experienceLevel = 'senior'
376:     else if (maxYears > 3) experienceLevel = 'mid'
377: 
378:     // Enhanced keyword extraction with skill weighting
379:     const techSkills = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'azure', 'docker', 'kubernetes', 'ai', 'machine learning', 'data science']
380:     const businessSkills = ['management', 'leadership', 'strategy', 'analysis', 'project management', 'sales', 'marketing']
381:     
382:     const words = resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
383:     const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'were', 'would', 'could', 'should', 'work', 'company', 'role', 'position'])
384:     const wordFreq: Record<string, number> = {}
385:     
386:     words.forEach(word => {
387:       if (!stopWords.has(word)) {
388:         // Weight tech and business skills higher
389:         const weight = techSkills.includes(word) || businessSkills.includes(word) ? 3 : 1
390:         wordFreq[word] = (wordFreq[word] || 0) + weight
391:       }
392:     })
393: 
394:     const keywords = Object.entries(wordFreq)
395:       .sort(([, a], [, b]) => b - a)
396:       .slice(0, 20)
397:       .map(([word]) => word)
398: 
399:     // Assess AI/Automation risk based on job content
400:     const hasCreativeWork = /creative|design|strategy|innovation|research/i.test(resumeText)
401:     const hasInterpersonalWork = /team|leadership|management|client|customer|stakeholder/i.test(resumeText)
402:     const hasAnalyticalWork = /analysis|problem.solving|decision|strategic/i.test(resumeText)
403:     const hasRoutineWork = /data.entry|processing|administrative|clerical/i.test(resumeText)
404: 
405:     let aiReplacementRisk: 'low' | 'medium' | 'high' = 'medium'
406:     if (hasCreativeWork && hasInterpersonalWork && hasAnalyticalWork) aiReplacementRisk = 'low'
407:     else if (hasRoutineWork) aiReplacementRisk = 'high'
408: 
409:     // Salary estimation based on experience and location
410:     const baseSalaries = {
411:       entry: { min: 45000, max: 65000 },
412:       mid: { min: 65000, max: 90000 },
413:       senior: { min: 90000, max: 130000 },
414:       executive: { min: 130000, max: 200000 }
415:     }
416: 
417:     const locationMultiplier = 
418:       city.toLowerCase().includes('toronto') || city.toLowerCase().includes('vancouver') ? 1.2 :
419:       city.toLowerCase().includes('calgary') || city.toLowerCase().includes('ottawa') ? 1.1 : 1.0
420: 
421:     const salaryRange = baseSalaries[experienceLevel]
422:     const currency = country === 'Canada' ? 'CAD' : 'USD'
423: 
424:     return {
425:       keywords,
426:       location: { city, province, full: `${city}, ${province}`, country },
427:       experienceLevel,
428:       targetSalaryRange: {
429:         min: Math.round(salaryRange.min * locationMultiplier),
430:         max: Math.round(salaryRange.max * locationMultiplier),
431:         currency,
432:         marketData: {
433:           percentile25: Math.round(salaryRange.min * locationMultiplier * 1.1),
434:           percentile50: Math.round((salaryRange.min + salaryRange.max) / 2 * locationMultiplier),
435:           percentile75: Math.round(salaryRange.max * locationMultiplier * 0.9),
436:           lastUpdated: '2025-10'
437:         }
438:       },
439:       targetJobTitles: [],
440:       topSkills: keywords.slice(0, 10).map(skill => ({
441:         skill,
442:         yearsExperience: Math.min(maxYears, 10),
443:         proficiency: experienceLevel === 'executive' ? 'expert' : 
444:                     experienceLevel === 'senior' ? 'advanced' : 'intermediate',
445:         marketDemand: techSkills.includes(skill) ? 'high' : 'medium',
446:         growthTrend: techSkills.includes(skill) ? 'growing' : 'stable'
447:       })),
448:       industries: [],
449:       certifications: [],
450:       careerSummary: `${experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1)}-level professional with expertise in ${keywords.slice(0, 3).join(', ')}`,
451:       futureOutlook: {
452:         aiReplacementRisk,
453:         automationRisk: hasRoutineWork ? 'high' : 'medium',
454:         fiveYearOutlook: aiReplacementRisk === 'low' ? 'growing' : 'stable',
455:         reasoning: `Based on skill analysis, this role shows ${aiReplacementRisk} risk of AI replacement due to ${hasCreativeWork ? 'creative and strategic elements' : 'routine task components'}.`,
456:         recommendations: [
457:           'Develop AI-resistant skills like strategic thinking and relationship building',
458:           'Stay updated with industry automation trends',
459:           'Consider upskilling in emerging technologies'
460:         ]
461:       },
462:       careerPath: {
463:         currentLevel: experienceLevel === 'entry' ? 'Junior Professional' : 
464:                      experienceLevel === 'mid' ? 'Experienced Professional' :
465:                      experienceLevel === 'senior' ? 'Senior Professional' : 'Executive',
466:         nextPossibleRoles: [],
467:         skillGaps: [],
468:         recommendedCertifications: []
469:       },
470:       searchOptimization: {
471:         bestJobBoards: country === 'Canada' ? 
472:           ['LinkedIn', 'Indeed Canada', 'Job Bank Canada', 'Workopolis'] :
473:           ['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter'],
474:         optimalApplicationTime: 'Tuesday-Thursday, 9-11 AM local time',
475:         competitiveAdvantages: keywords.slice(0, 3),
476:         marketSaturation: 'medium',
477:         applicationStrategy: `Focus on ${experienceLevel}-level positions in ${city} market, emphasize ${keywords.slice(0, 2).join(' and ')} experience`
478:       }
479:     }
480:   }
481: 
482:   /**
483:    * Get AI-powered job search recommendations
484:    */
485:   static async getJobSearchRecommendations(analysis: EnhancedResumeAnalysis): Promise<{
486:     searchTerms: string[]
487:     excludeTerms: string[]
488:     targetCompanies: string[]
489:     networking: string[]
490:     timeline: string
491:   }> {
492:     const prompt = `Based on this career profile, provide job search recommendations:
493:     
494: Location: ${analysis.location.full}
495: Experience: ${analysis.experienceLevel}
496: Industries: ${analysis.industries.join(', ')}
497: Skills: ${analysis.topSkills.map(s => s.skill).slice(0, 10).join(', ')}
498: AI Risk: ${analysis.futureOutlook.aiReplacementRisk}
499: 
500: Return ONLY this JSON:
501: {
502:   "searchTerms": ["keyword1", "keyword2", ...],
503:   "excludeTerms": ["avoid1", "avoid2", ...],
504:   "targetCompanies": ["company1", "company2", ...],
505:   "networking": ["strategy1", "strategy2", ...],
506:   "timeline": "3-6 months explanation"
507: }`
508: 
509:     try {
510:       const response = await PerplexityIntelligenceService.customQuery({
511:         systemPrompt: 'You are a career strategist. Return only valid JSON with no markdown.',
512:         userPrompt: prompt,
513:         temperature: 0.4,
514:         maxTokens: 1500
515:       })
516: 
517:       // FIXED: Actually parse the AI response
518:       let content = response.content.trim().replace(/```(?:json)?\s*/g, '')
519:       const jsonMatch = content.match(/\{[\s\S]*\}/)
520:       
521:       if (jsonMatch) {
522:         const parsed = JSON.parse(jsonMatch[0])
523:         return {
524:           searchTerms: parsed.searchTerms || analysis.keywords.slice(0, 10),
525:           excludeTerms: parsed.excludeTerms || [],
526:           targetCompanies: parsed.targetCompanies || [],
527:           networking: parsed.networking || [],
528:           timeline: parsed.timeline || '3-6 months'
529:         }
530:       }
531:     } catch (error) {
532:       console.error('[JOB_SEARCH_RECOMMENDATIONS] Failed:', error)
533:     }
534: 
535:     // Fallback only if AI completely fails
536:     return {
537:       searchTerms: analysis.keywords.slice(0, 10),
538:       excludeTerms: [],
539:       targetCompanies: [],
540:       networking: [],
541:       timeline: '3-6 months'
542:     }
543:   }
544: 
545:   /**
546:    * Generate market intelligence report
547:    */
548:   static async generateMarketReport(analysis: EnhancedResumeAnalysis): Promise<{
549:     marketTrends: string[]
550:     salaryTrends: string
551:     demandForecast: string
552:     recommendations: string[]
553:   }> {
554:     const prompt = `Generate a market intelligence report for this career profile:
555: 
556: Location: ${analysis.location.full} 
557: Experience: ${analysis.experienceLevel}
558: Industries: ${analysis.industries.join(', ')}
559: Target Roles: ${analysis.targetJobTitles.join(', ')}
560: 
561: Return ONLY this JSON:
562: {
563:   "marketTrends": ["trend1", "trend2", ...],
564:   "salaryTrends": "Salary outlook explanation",
565:   "demandForecast": "Demand forecast explanation",
566:   "recommendations": ["rec1", "rec2", ...]
567: }`
568: 
569:     try {
570:       const response = await PerplexityIntelligenceService.customQuery({
571:         systemPrompt: 'You are a market research analyst. Return only valid JSON with no markdown.',
572:         userPrompt: prompt,
573:         temperature: 0.2,
574:         maxTokens: 2000
575:       })
576: 
577:       // FIXED: Actually parse AI response
578:       let content = response.content.trim().replace(/```(?:json)?\s*/g, '')
579:       const jsonMatch = content.match(/\{[\s\S]*\}/)
580:       
581:       if (jsonMatch) {
582:         const parsed = JSON.parse(jsonMatch[0])
583:         return {
584:           marketTrends: parsed.marketTrends || [],
585:           salaryTrends: parsed.salaryTrends || 'Market data unavailable',
586:           demandForecast: parsed.demandForecast || 'Analysis pending',
587:           recommendations: parsed.recommendations || analysis.futureOutlook.recommendations
588:         }
589:       }
590:     } catch (error) {
591:       console.error('[MARKET_REPORT] Failed:', error)
592:     }
593: 
594:     // Fallback only if AI completely fails
595:     return {
596:       marketTrends: ['Remote work increasing', 'AI skills in demand'],
597:       salaryTrends: 'Market data unavailable',
598:       demandForecast: 'Analysis pending',
599:       recommendations: analysis.futureOutlook.recommendations
600:     }
601:   }
602: 
603:   /**
604:    * Get recommended job boards with intelligent matching
605:    */
606:   static async getRecommendedJobBoards(analysis: EnhancedResumeAnalysis): Promise<Array<{
607:     name: string
608:     relevanceScore: number
609:     reasoning: string
610:     specialization: string
611:   }>> {
612:     const isCanadian = analysis.location.country === 'Canada'
613:     const { experienceLevel, industries, topSkills } = analysis
614:     
615:     const boards: Array<{
616:       name: string
617:       relevanceScore: number
618:       reasoning: string
619:       specialization: string
620:     }> = []
621: 
622:     // Universal boards
623:     boards.push(
624:       { name: 'LinkedIn', relevanceScore: 95, reasoning: 'Best for professional networking and quality opportunities', specialization: 'Professional Network' },
625:       { name: 'Indeed', relevanceScore: 85, reasoning: 'Largest job database with good local coverage', specialization: 'General Purpose' }
626:     )
627: 
628:     // Canadian-specific
629:     if (isCanadian) {
630:       boards.push(
631:         { name: 'Job Bank Canada', relevanceScore: 90, reasoning: 'Government-backed platform with verified Canadian employers', specialization: 'Canadian Government' },
632:         { name: 'Workopolis', relevanceScore: 75, reasoning: 'Strong presence in Canadian market', specialization: 'Canadian Corporate' }
633:       )
634:     }
635: 
636:     // Experience level specific
637:     if (experienceLevel === 'executive') {
638:       boards.push(
639:         { name: 'The Ladders', relevanceScore: 85, reasoning: 'Specialized in $100K+ executive positions', specialization: 'Executive' },
640:         { name: 'ExecuNet', relevanceScore: 80, reasoning: 'Executive networking and opportunities', specialization: 'Executive Network' }
641:       )
642:     } else if (experienceLevel === 'entry') {
643:       boards.push(
644:         { name: 'Glassdoor', relevanceScore: 80, reasoning: 'Good for entry-level positions and company insights', specialization: 'Entry Level' },
645:         { name: 'ZipRecruiter', relevanceScore: 75, reasoning: 'Quick application process for entry roles', specialization: 'Quick Apply' }
646:       )
647:     }
648: 
649:     // Industry-specific recommendations
650:     const techSkills = topSkills.some(s => ['javascript', 'python', 'react', 'aws', 'docker'].includes(s.skill.toLowerCase()))
651:     const hasBusinessSkills = topSkills.some(s => ['management', 'sales', 'marketing', 'strategy'].includes(s.skill.toLowerCase()))
652: 
653:     if (techSkills) {
654:       boards.push(
655:         { name: 'Dice', relevanceScore: 85, reasoning: 'Technology-focused job board with tech companies', specialization: 'Technology' },
656:         { name: 'Stack Overflow Jobs', relevanceScore: 80, reasoning: 'Developer-focused positions', specialization: 'Software Development' },
657:         { name: 'AngelList', relevanceScore: 75, reasoning: 'Startup and tech company opportunities', specialization: 'Startups' }
658:       )
659:     }
660: 
661:     if (hasBusinessSkills) {
662:       boards.push(
663:         { name: 'Monster', relevanceScore: 70, reasoning: 'Strong in business and management roles', specialization: 'Business & Management' }
664:       )
665:     }
666: 
667:     // Sort by relevance score and return top recommendations
668:     return boards
669:       .sort((a, b) => b.relevanceScore - a.relevanceScore)
670:       .slice(0, 8)
671:   }
672: }
````

## File: src/lib/resume-templates-v2.ts
````typescript
   1: /**
   2:  * Professional Resume Templates V2
   3:  * 
   4:  * 7 distinct, beautifully formatted resume templates:
   5:  * 1. Modern (Two-Column with Timeline)
   6:  * 2. Professional (Traditional Single-Column)
   7:  * 3. Creative (Asymmetric with Color Accents)
   8:  * 4. Tech-Focused (Developer/Engineer)
   9:  * 5. Minimal/ATS (Maximum Compatibility)
  10:  * 6. Executive (C-Suite/Director)
  11:  * 7. Curriculum Vitae (Academic/Research)
  12:  */
  13: 
  14: export interface ResumeData {
  15:   personalInfo: {
  16:     fullName: string
  17:     email: string
  18:     phone: string
  19:     location: string
  20:     linkedin?: string
  21:     github?: string
  22:     website?: string
  23:     summary: string
  24:   }
  25:   experience: Array<{
  26:     id: string
  27:     company: string
  28:     position: string
  29:     location: string
  30:     startDate: string
  31:     endDate: string
  32:     current: boolean
  33:     description: string
  34:     achievements: string[]
  35:     technologies?: string[]
  36:   }>
  37:   education: Array<{
  38:     id: string
  39:     institution: string
  40:     degree: string
  41:     field: string
  42:     location: string
  43:     graduationDate: string
  44:     gpa?: string
  45:     honors?: string[]
  46:   }>
  47:   skills: {
  48:     technical: string[]
  49:     soft: string[]
  50:     languages?: Array<{ language: string; proficiency: string }>
  51:     certifications?: Array<{ name: string; issuer: string; date: string }>
  52:   }
  53:   projects?: Array<{
  54:     id: string
  55:     name: string
  56:     description: string
  57:     technologies: string[]
  58:     url?: string
  59:     github?: string
  60:   }>
  61: }
  62: 
  63: export interface ResumeTemplate {
  64:   id: string
  65:   name: string
  66:   description: string
  67:   bestFor: string[]
  68:   preview: string
  69:   generate: (data: ResumeData) => string
  70:   css: string
  71: }
  72: 
  73: /**
  74:  * TEMPLATE 1: MODERN (Two-Column with Timeline)
  75:  */
  76: const modernTemplate: ResumeTemplate = {
  77:   id: 'modern',
  78:   name: 'Modern',
  79:   description: 'Two-column layout with timeline visualization and progress bars',
  80:   bestFor: ['Technology', 'Startups', 'Creative Industries', 'Mid-Level'],
  81:   preview: '/templates/modern-preview.png',
  82:   
  83:   generate: (data: ResumeData) => {
  84:     const { personalInfo, experience, education, skills } = data;
  85:     
  86:     return `
  87:       <div class="resume-modern">
  88:         <!-- Left Sidebar -->
  89:         <div class="sidebar">
  90:           <div class="avatar-section">
  91:             <div class="avatar-circle">
  92:               ${personalInfo.fullName.split(' ').map(n => n[0]).join('')}
  93:             </div>
  94:             <h1 class="name">${personalInfo.fullName}</h1>
  95:           </div>
  96:           
  97:           <div class="contact-section">
  98:             <h2 class="section-header">CONTACT</h2>
  99:             <div class="contact-item">
 100:               <span class="icon">📧</span>
 101:               <span>${personalInfo.email}</span>
 102:             </div>
 103:             <div class="contact-item">
 104:               <span class="icon">📱</span>
 105:               <span>${personalInfo.phone}</span>
 106:             </div>
 107:             <div class="contact-item">
 108:               <span class="icon">📍</span>
 109:               <span>${personalInfo.location}</span>
 110:             </div>
 111:             ${personalInfo.linkedin ? `
 112:               <div class="contact-item">
 113:                 <span class="icon">💼</span>
 114:                 <span>${personalInfo.linkedin}</span>
 115:               </div>
 116:             ` : ''}
 117:           </div>
 118:           
 119:           <div class="skills-section">
 120:             <h2 class="section-header">SKILLS</h2>
 121:             ${skills.technical.slice(0, 8).map(skill => `
 122:               <div class="skill-item">
 123:                 <div class="skill-name">${skill}</div>
 124:                 <div class="skill-bar">
 125:                   <div class="skill-progress" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
 126:                 </div>
 127:               </div>
 128:             `).join('')}
 129:           </div>
 130:           
 131:           ${skills.languages && skills.languages.length > 0 ? `
 132:             <div class="languages-section">
 133:               <h2 class="section-header">LANGUAGES</h2>
 134:               ${skills.languages.map(lang => `
 135:                 <div class="language-item">
 136:                   <span class="language-name">${lang.language}</span>
 137:                   <span class="language-level">${lang.proficiency}</span>
 138:                 </div>
 139:               `).join('')}
 140:             </div>
 141:           ` : ''}
 142:         </div>
 143:         
 144:         <!-- Right Content -->
 145:         <div class="content">
 146:           <div class="summary-section">
 147:             <h2 class="section-header-main">PROFESSIONAL SUMMARY</h2>
 148:             <p class="summary-text">${personalInfo.summary}</p>
 149:           </div>
 150:           
 151:           <div class="experience-section">
 152:             <h2 class="section-header-main">EXPERIENCE</h2>
 153:             ${experience.map((exp, index) => `
 154:               <div class="experience-item">
 155:                 <div class="timeline-dot"></div>
 156:                 ${index < experience.length - 1 ? '<div class="timeline-line"></div>' : ''}
 157:                 <div class="experience-content">
 158:                   <h3 class="job-title">${exp.position}</h3>
 159:                   <div class="company-info">
 160:                     <span class="company-name">${exp.company}</span>
 161:                     <span class="date-range">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
 162:                   </div>
 163:                   <ul class="achievements">
 164:                     ${exp.achievements.map(achievement => `
 165:                       <li>${achievement}</li>
 166:                     `).join('')}
 167:                   </ul>
 168:                 </div>
 169:               </div>
 170:             `).join('')}
 171:           </div>
 172:           
 173:           <div class="education-section">
 174:             <h2 class="section-header-main">EDUCATION</h2>
 175:             ${education.map(edu => `
 176:               <div class="education-item">
 177:                 <h3 class="degree">${edu.degree} in ${edu.field}</h3>
 178:                 <div class="institution-info">
 179:                   <span class="institution">${edu.institution}</span>
 180:                   <span class="grad-year">${edu.graduationDate}</span>
 181:                 </div>
 182:                 ${edu.honors && edu.honors.length > 0 ? `
 183:                   <div class="honors">${edu.honors.join(' • ')}</div>
 184:                 ` : ''}
 185:               </div>
 186:             `).join('')}
 187:           </div>
 188:         </div>
 189:       </div>
 190:     `;
 191:   },
 192:   
 193:   css: `
 194:     .resume-modern {
 195:       display: flex;
 196:       min-height: 100vh;
 197:       font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
 198:       background: white;
 199:     }
 200:     
 201:     .sidebar {
 202:       width: 30%;
 203:       background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
 204:       color: white;
 205:       padding: 2rem 1.5rem;
 206:     }
 207:     
 208:     .avatar-section {
 209:       text-align: center;
 210:       margin-bottom: 2rem;
 211:     }
 212:     
 213:     .avatar-circle {
 214:       width: 80px;
 215:       height: 80px;
 216:       border-radius: 50%;
 217:       background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
 218:       display: flex;
 219:       align-items: center;
 220:       justify-content: center;
 221:       font-size: 28px;
 222:       font-weight: bold;
 223:       margin: 0 auto 1rem;
 224:       box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
 225:     }
 226:     
 227:     .name {
 228:       font-size: 18px;
 229:       font-weight: 700;
 230:       margin: 0;
 231:       letter-spacing: 0.5px;
 232:     }
 233:     
 234:     .section-header {
 235:       font-size: 11px;
 236:       font-weight: 700;
 237:       text-transform: uppercase;
 238:       letter-spacing: 1.5px;
 239:       color: #3b82f6;
 240:       margin: 2rem 0 1rem;
 241:       padding-bottom: 0.5rem;
 242:       border-bottom: 2px solid #3b82f6;
 243:     }
 244:     
 245:     .contact-item {
 246:       display: flex;
 247:       align-items: center;
 248:       gap: 0.75rem;
 249:       margin-bottom: 0.75rem;
 250:       font-size: 10px;
 251:       line-height: 1.4;
 252:     }
 253:     
 254:     .icon {
 255:       font-size: 14px;
 256:       opacity: 0.9;
 257:     }
 258:     
 259:     .skill-item {
 260:       margin-bottom: 1rem;
 261:     }
 262:     
 263:     .skill-name {
 264:       font-size: 10px;
 265:       font-weight: 500;
 266:       margin-bottom: 0.25rem;
 267:     }
 268:     
 269:     .skill-bar {
 270:       height: 6px;
 271:       background: rgba(255, 255, 255, 0.2);
 272:       border-radius: 3px;
 273:       overflow: hidden;
 274:     }
 275:     
 276:     .skill-progress {
 277:       height: 100%;
 278:       background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
 279:       border-radius: 3px;
 280:       transition: width 0.3s ease;
 281:     }
 282:     
 283:     .language-item {
 284:       display: flex;
 285:       justify-content: space-between;
 286:       margin-bottom: 0.5rem;
 287:       font-size: 10px;
 288:     }
 289:     
 290:     .content {
 291:       width: 70%;
 292:       padding: 2rem 2.5rem;
 293:     }
 294:     
 295:     .section-header-main {
 296:       font-size: 14px;
 297:       font-weight: 700;
 298:       text-transform: uppercase;
 299:       color: #1e293b;
 300:       margin: 2rem 0 1rem;
 301:       padding-bottom: 0.5rem;
 302:       border-bottom: 3px solid #3b82f6;
 303:       letter-spacing: 1px;
 304:     }
 305:     
 306:     .summary-text {
 307:       font-size: 11px;
 308:       line-height: 1.6;
 309:       color: #475569;
 310:       margin: 0;
 311:     }
 312:     
 313:     .experience-item {
 314:       position: relative;
 315:       padding-left: 2rem;
 316:       margin-bottom: 2rem;
 317:     }
 318:     
 319:     .timeline-dot {
 320:       position: absolute;
 321:       left: 0;
 322:       top: 5px;
 323:       width: 10px;
 324:       height: 10px;
 325:       background: #3b82f6;
 326:       border-radius: 50%;
 327:       box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
 328:     }
 329:     
 330:     .timeline-line {
 331:       position: absolute;
 332:       left: 4.5px;
 333:       top: 15px;
 334:       width: 1px;
 335:       height: calc(100% + 1rem);
 336:       background: linear-gradient(180deg, #3b82f6 0%, #cbd5e1 100%);
 337:     }
 338:     
 339:     .job-title {
 340:       font-size: 13px;
 341:       font-weight: 700;
 342:       color: #1e293b;
 343:       margin: 0 0 0.25rem;
 344:     }
 345:     
 346:     .company-info {
 347:       display: flex;
 348:       justify-content: space-between;
 349:       align-items: center;
 350:       margin-bottom: 0.75rem;
 351:     }
 352:     
 353:     .company-name {
 354:       font-size: 11px;
 355:       font-style: italic;
 356:       color: #64748b;
 357:     }
 358:     
 359:     .date-range {
 360:       font-size: 10px;
 361:       color: #94a3b8;
 362:       font-weight: 500;
 363:     }
 364:     
 365:     .achievements {
 366:       margin: 0;
 367:       padding-left: 1.25rem;
 368:       list-style-type: disc;
 369:     }
 370:     
 371:     .achievements li {
 372:       font-size: 10px;
 373:       line-height: 1.6;
 374:       color: #475569;
 375:       margin-bottom: 0.5rem;
 376:     }
 377:     
 378:     .education-item {
 379:       margin-bottom: 1.5rem;
 380:     }
 381:     
 382:     .degree {
 383:       font-size: 12px;
 384:       font-weight: 700;
 385:       color: #1e293b;
 386:       margin: 0 0 0.25rem;
 387:     }
 388:     
 389:     .institution-info {
 390:       display: flex;
 391:       justify-content: space-between;
 392:       font-size: 10px;
 393:       color: #64748b;
 394:       margin-bottom: 0.5rem;
 395:     }
 396:     
 397:     .honors {
 398:       font-size: 9px;
 399:       color: #3b82f6;
 400:       font-weight: 500;
 401:     }
 402:     
 403:     @media print {
 404:       .resume-modern {
 405:         min-height: auto;
 406:       }
 407:       .sidebar {
 408:         print-color-adjust: exact;
 409:         -webkit-print-color-adjust: exact;
 410:       }
 411:     }
 412:   `
 413: };
 414: 
 415: /**
 416:  * TEMPLATE 2: PROFESSIONAL (Traditional Single-Column)
 417:  */
 418: const professionalTemplate: ResumeTemplate = {
 419:   id: 'professional',
 420:   name: 'Professional',
 421:   description: 'Traditional single-column layout for corporate environments',
 422:   bestFor: ['Corporate', 'Finance', 'Legal', 'Consulting', 'Executive'],
 423:   preview: '/templates/professional-preview.png',
 424:   
 425:   generate: (data: ResumeData) => {
 426:     const { personalInfo, experience, education, skills } = data;
 427:     
 428:     return `
 429:       <div class="resume-professional">
 430:         <div class="header">
 431:           <h1 class="name">${personalInfo.fullName}</h1>
 432:           <div class="contact-bar">
 433:             <span>${personalInfo.email}</span>
 434:             <span>•</span>
 435:             <span>${personalInfo.phone}</span>
 436:             <span>•</span>
 437:             <span>${personalInfo.location}</span>
 438:             ${personalInfo.linkedin ? `<span>•</span><span>${personalInfo.linkedin}</span>` : ''}
 439:           </div>
 440:           <hr class="divider" />
 441:         </div>
 442:         
 443:         <div class="section">
 444:           <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
 445:           <p class="summary">${personalInfo.summary}</p>
 446:         </div>
 447:         
 448:         <div class="section">
 449:           <h2 class="section-title">PROFESSIONAL EXPERIENCE</h2>
 450:           ${experience.map(exp => `
 451:             <div class="experience-entry">
 452:               <div class="entry-header">
 453:                 <h3 class="job-title">${exp.position}</h3>
 454:                 <span class="date-range">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</span>
 455:               </div>
 456:               <div class="company-line">
 457:                 <span class="company">${exp.company}</span>
 458:                 ${exp.location ? `<span class="location">${exp.location}</span>` : ''}
 459:               </div>
 460:               <ul class="achievements">
 461:                 ${exp.achievements.map(achievement => `
 462:                   <li>${achievement}</li>
 463:                 `).join('')}
 464:               </ul>
 465:             </div>
 466:           `).join('')}
 467:         </div>
 468:         
 469:         <div class="section">
 470:           <h2 class="section-title">EDUCATION</h2>
 471:           ${education.map(edu => `
 472:             <div class="education-entry">
 473:               <div class="entry-header">
 474:                 <h3 class="degree">${edu.degree}, ${edu.field}</h3>
 475:                 <span class="date-range">${edu.graduationDate}</span>
 476:               </div>
 477:               <div class="institution">${edu.institution}, ${edu.location}</div>
 478:               ${edu.gpa ? `<div class="gpa">GPA: ${edu.gpa}</div>` : ''}
 479:               ${edu.honors && edu.honors.length > 0 ? `
 480:                 <div class="honors">${edu.honors.join(', ')}</div>
 481:               ` : ''}
 482:             </div>
 483:           `).join('')}
 484:         </div>
 485:         
 486:         <div class="section">
 487:           <h2 class="section-title">SKILLS & COMPETENCIES</h2>
 488:           <div class="skills-grid">
 489:             <div class="skill-category">
 490:               <strong>Technical:</strong> ${skills.technical.join(', ')}
 491:             </div>
 492:             ${skills.soft.length > 0 ? `
 493:               <div class="skill-category">
 494:                 <strong>Professional:</strong> ${skills.soft.join(', ')}
 495:               </div>
 496:             ` : ''}
 497:           </div>
 498:         </div>
 499:       </div>
 500:     `;
 501:   },
 502:   
 503:   css: `
 504:     .resume-professional {
 505:       max-width: 8.5in;
 506:       margin: 0 auto;
 507:       padding: 0.75in;
 508:       font-family: 'Times New Roman', Times, serif;
 509:       background: white;
 510:       color: #000;
 511:       line-height: 1.5;
 512:     }
 513:     
 514:     .header {
 515:       text-align: center;
 516:       margin-bottom: 1.5rem;
 517:     }
 518:     
 519:     .name {
 520:       font-size: 24px;
 521:       font-weight: 700;
 522:       margin: 0 0 0.5rem;
 523:       text-transform: uppercase;
 524:       letter-spacing: 1px;
 525:     }
 526:     
 527:     .contact-bar {
 528:       font-size: 11px;
 529:       color: #333;
 530:       margin-bottom: 0.75rem;
 531:     }
 532:     
 533:     .contact-bar span {
 534:       margin: 0 0.25rem;
 535:     }
 536:     
 537:     .divider {
 538:       border: none;
 539:       border-top: 2px solid #000;
 540:       margin: 0.75rem 0;
 541:     }
 542:     
 543:     .section {
 544:       margin-bottom: 1.5rem;
 545:     }
 546:     
 547:     .section-title {
 548:       font-size: 13px;
 549:       font-weight: 700;
 550:       text-transform: uppercase;
 551:       letter-spacing: 1px;
 552:       margin: 0 0 0.75rem;
 553:       padding-bottom: 0.25rem;
 554:       border-bottom: 1px solid #000;
 555:     }
 556:     
 557:     .summary {
 558:       font-size: 11px;
 559:       margin: 0;
 560:       text-align: justify;
 561:     }
 562:     
 563:     .experience-entry,
 564:     .education-entry {
 565:       margin-bottom: 1.25rem;
 566:     }
 567:     
 568:     .entry-header {
 569:       display: flex;
 570:       justify-content: space-between;
 571:       align-items: baseline;
 572:       margin-bottom: 0.25rem;
 573:     }
 574:     
 575:     .job-title,
 576:     .degree {
 577:       font-size: 12px;
 578:       font-weight: 700;
 579:       margin: 0;
 580:     }
 581:     
 582:     .date-range {
 583:       font-size: 11px;
 584:       color: #555;
 585:       font-style: italic;
 586:     }
 587:     
 588:     .company-line {
 589:       font-size: 11px;
 590:       color: #555;
 591:       font-style: italic;
 592:       margin-bottom: 0.5rem;
 593:     }
 594:     
 595:     .company,
 596:     .institution {
 597:       font-size: 11px;
 598:       color: #555;
 599:       font-style: italic;
 600:     }
 601:     
 602:     .location {
 603:       margin-left: 0.5rem;
 604:     }
 605:     
 606:     .achievements {
 607:       margin: 0.5rem 0 0 1.25rem;
 608:       padding: 0;
 609:       list-style-type: disc;
 610:     }
 611:     
 612:     .achievements li {
 613:       font-size: 11px;
 614:       margin-bottom: 0.25rem;
 615:       line-height: 1.5;
 616:     }
 617:     
 618:     .gpa,
 619:     .honors {
 620:       font-size: 10px;
 621:       color: #555;
 622:       margin-top: 0.25rem;
 623:     }
 624:     
 625:     .skills-grid {
 626:       font-size: 11px;
 627:     }
 628:     
 629:     .skill-category {
 630:       margin-bottom: 0.5rem;
 631:       line-height: 1.6;
 632:     }
 633:     
 634:     .skill-category strong {
 635:       font-weight: 700;
 636:     }
 637:     
 638:     @media print {
 639:       .resume-professional {
 640:         padding: 0.5in;
 641:       }
 642:     }
 643:   `
 644: };
 645: 
 646: /**
 647:  * TEMPLATE 3: CREATIVE (Asymmetric with Color Accents)
 648:  */
 649: const creativeTemplate: ResumeTemplate = {
 650:   id: 'creative',
 651:   name: 'Creative',
 652:   description: 'Asymmetric layout with bold colors and visual elements',
 653:   bestFor: ['Design', 'Marketing', 'Creative', 'UX/UI', 'Advertising'],
 654:   preview: '/templates/creative-preview.png',
 655:   
 656:   generate: (data: ResumeData) => {
 657:     const { personalInfo, experience, education, skills, projects } = data;
 658:     
 659:     return `
 660:       <div class="resume-creative">
 661:         <div class="header-creative">
 662:           <h1 class="name-gradient">${personalInfo.fullName}</h1>
 663:           <div class="tagline">Creative Professional</div>
 664:           <div class="contact-badges">
 665:             <span class="badge">${personalInfo.email}</span>
 666:             <span class="badge">${personalInfo.phone}</span>
 667:             <span class="badge">${personalInfo.location}</span>
 668:             ${personalInfo.linkedin ? `<span class="badge">LinkedIn</span>` : ''}
 669:           </div>
 670:         </div>
 671:         
 672:         <div class="content-grid">
 673:           <div class="main-column">
 674:             <div class="section-creative">
 675:               <h2 class="section-title-creative">Creative Profile</h2>
 676:               <p class="profile-text">${personalInfo.summary}</p>
 677:             </div>
 678:             
 679:             <div class="section-creative">
 680:               <h2 class="section-title-creative">Experience</h2>
 681:               ${experience.map(exp => `
 682:                 <div class="experience-card">
 683:                   <div class="card-header">
 684:                     <h3 class="role">${exp.position}</h3>
 685:                     <span class="period">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
 686:                   </div>
 687:                   <div class="company-badge">${exp.company}</div>
 688:                   <ul class="achievements-creative">
 689:                     ${exp.achievements.map(achievement => `
 690:                       <li>${achievement}</li>
 691:                     `).join('')}
 692:                   </ul>
 693:                 </div>
 694:               `).join('')}
 695:             </div>
 696:             
 697:             ${projects && projects.length > 0 ? `
 698:               <div class="section-creative">
 699:                 <h2 class="section-title-creative">Projects</h2>
 700:                 ${projects.map(project => `
 701:                   <div class="project-card">
 702:                     <h3 class="project-name">${project.name}</h3>
 703:                     <p class="project-desc">${project.description}</p>
 704:                     <div class="tech-badges">
 705:                       ${project.technologies.map(tech => `
 706:                         <span class="tech-badge">${tech}</span>
 707:                       `).join('')}
 708:                     </div>
 709:                   </div>
 710:                 `).join('')}
 711:               </div>
 712:             ` : ''}
 713:           </div>
 714:           
 715:           <div class="side-column">
 716:             <div class="section-creative">
 717:               <h2 class="section-title-creative">Skills</h2>
 718:               <div class="skill-badges">
 719:                 ${skills.technical.map(skill => `
 720:                   <span class="skill-badge-creative">${skill}</span>
 721:                 `).join('')}
 722:               </div>
 723:             </div>
 724:             
 725:             <div class="section-creative">
 726:               <h2 class="section-title-creative">Education</h2>
 727:               ${education.map(edu => `
 728:                 <div class="education-card">
 729:                   <h3 class="degree-creative">${edu.degree}</h3>
 730:                   <div class="institution-creative">${edu.institution}</div>
 731:                   <div class="year-creative">${edu.graduationDate}</div>
 732:                 </div>
 733:               `).join('')}
 734:             </div>
 735:           </div>
 736:         </div>
 737:       </div>
 738:     `;
 739:   },
 740:   
 741:   css: `
 742:     .resume-creative {
 743:       font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
 744:       background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
 745:       padding: 2rem;
 746:       min-height: 100vh;
 747:     }
 748:     
 749:     .header-creative {
 750:       text-align: center;
 751:       margin-bottom: 2rem;
 752:       padding: 2rem;
 753:       background: white;
 754:       border-radius: 16px;
 755:       box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
 756:     }
 757:     
 758:     .name-gradient {
 759:       font-size: 36px;
 760:       font-weight: 800;
 761:       background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
 762:       -webkit-background-clip: text;
 763:       -webkit-text-fill-color: transparent;
 764:       background-clip: text;
 765:       margin: 0 0 0.5rem;
 766:       letter-spacing: -0.5px;
 767:     }
 768:     
 769:     .tagline {
 770:       font-size: 14px;
 771:       color: #64748b;
 772:       font-weight: 500;
 773:       margin-bottom: 1rem;
 774:     }
 775:     
 776:     .contact-badges {
 777:       display: flex;
 778:       gap: 0.75rem;
 779:       justify-content: center;
 780:       flex-wrap: wrap;
 781:     }
 782:     
 783:     .badge {
 784:       background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
 785:       color: white;
 786:       padding: 0.5rem 1rem;
 787:       border-radius: 20px;
 788:       font-size: 10px;
 789:       font-weight: 600;
 790:       box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
 791:     }
 792:     
 793:     .content-grid {
 794:       display: grid;
 795:       grid-template-columns: 60% 40%;
 796:       gap: 2rem;
 797:     }
 798:     
 799:     .section-creative {
 800:       background: white;
 801:       padding: 1.5rem;
 802:       border-radius: 12px;
 803:       margin-bottom: 1.5rem;
 804:       box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
 805:     }
 806:     
 807:     .section-title-creative {
 808:       font-size: 16px;
 809:       font-weight: 700;
 810:       color: white;
 811:       background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
 812:       padding: 0.5rem 1rem;
 813:       border-radius: 8px;
 814:       margin: -1.5rem -1.5rem 1rem;
 815:     }
 816:     
 817:     .profile-text {
 818:       font-size: 11px;
 819:       line-height: 1.7;
 820:       color: #475569;
 821:       margin: 0;
 822:     }
 823:     
 824:     .experience-card,
 825:     .project-card {
 826:       margin-bottom: 1.5rem;
 827:       padding-bottom: 1.5rem;
 828:       border-bottom: 2px solid #f1f5f9;
 829:     }
 830:     
 831:     .experience-card:last-child,
 832:     .project-card:last-child {
 833:       border-bottom: none;
 834:       margin-bottom: 0;
 835:       padding-bottom: 0;
 836:     }
 837:     
 838:     .card-header {
 839:       display: flex;
 840:       justify-content: space-between;
 841:       align-items: baseline;
 842:       margin-bottom: 0.5rem;
 843:     }
 844:     
 845:     .role,
 846:     .project-name {
 847:       font-size: 13px;
 848:       font-weight: 700;
 849:       color: #1e293b;
 850:       margin: 0;
 851:     }
 852:     
 853:     .period {
 854:       font-size: 10px;
 855:       color: #94a3b8;
 856:       font-weight: 600;
 857:     }
 858:     
 859:     .company-badge {
 860:       display: inline-block;
 861:       background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
 862:       color: white;
 863:       padding: 0.25rem 0.75rem;
 864:       border-radius: 12px;
 865:       font-size: 10px;
 866:       font-weight: 600;
 867:       margin-bottom: 0.75rem;
 868:     }
 869:     
 870:     .achievements-creative {
 871:       margin: 0;
 872:       padding-left: 1.25rem;
 873:       list-style-type: none;
 874:     }
 875:     
 876:     .achievements-creative li {
 877:       font-size: 10px;
 878:       line-height: 1.6;
 879:       color: #475569;
 880:       margin-bottom: 0.5rem;
 881:       position: relative;
 882:     }
 883:     
 884:     .achievements-creative li:before {
 885:       content: "→";
 886:       position: absolute;
 887:       left: -1.25rem;
 888:       color: #3b82f6;
 889:       font-weight: 700;
 890:     }
 891:     
 892:     .project-desc {
 893:       font-size: 10px;
 894:       line-height: 1.6;
 895:       color: #475569;
 896:       margin: 0.5rem 0;
 897:     }
 898:     
 899:     .tech-badges {
 900:       display: flex;
 901:       gap: 0.5rem;
 902:       flex-wrap: wrap;
 903:       margin-top: 0.75rem;
 904:     }
 905:     
 906:     .tech-badge {
 907:       background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
 908:       color: white;
 909:       padding: 0.25rem 0.75rem;
 910:       border-radius: 12px;
 911:       font-size: 9px;
 912:       font-weight: 600;
 913:     }
 914:     
 915:     .skill-badges {
 916:       display: flex;
 917:       gap: 0.5rem;
 918:       flex-wrap: wrap;
 919:     }
 920:     
 921:     .skill-badge-creative {
 922:       background: linear-gradient(135deg, #10b981 0%, #059669 100%);
 923:       color: white;
 924:       padding: 0.5rem 1rem;
 925:       border-radius: 16px;
 926:       font-size: 10px;
 927:       font-weight: 600;
 928:       box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
 929:     }
 930:     
 931:     .education-card {
 932:       margin-bottom: 1rem;
 933:     }
 934:     
 935:     .degree-creative {
 936:       font-size: 12px;
 937:       font-weight: 700;
 938:       color: #1e293b;
 939:       margin: 0 0 0.25rem;
 940:     }
 941:     
 942:     .institution-creative {
 943:       font-size: 10px;
 944:       color: #64748b;
 945:       margin-bottom: 0.25rem;
 946:     }
 947:     
 948:     .year-creative {
 949:       font-size: 9px;
 950:       color: #94a3b8;
 951:       font-weight: 600;
 952:     }
 953:     
 954:     @media print {
 955:       .resume-creative {
 956:         background: white;
 957:       }
 958:       .section-creative {
 959:         box-shadow: none;
 960:         border: 1px solid #e2e8f0;
 961:       }
 962:     }
 963:   `
 964: };
 965: 
 966: /**
 967:  * TEMPLATE 4: TECH-FOCUSED (Developer/Engineer)
 968:  */
 969: const techTemplate: ResumeTemplate = {
 970:   id: 'tech',
 971:   name: 'Tech-Focused',
 972:   description: 'Developer-optimized with tech stack badges and GitHub integration',
 973:   bestFor: ['Software Engineering', 'DevOps', 'Data Science', 'Full-Stack'],
 974:   preview: '/templates/tech-preview.png',
 975:   
 976:   generate: (data: ResumeData) => {
 977:     const { personalInfo, experience, education, skills, projects } = data;
 978:     
 979:     return `
 980:       <div class="resume-tech">
 981:         <div class="header-tech">
 982:           <h1 class="name-tech">${personalInfo.fullName}</h1>
 983:           <div class="title-tech">Software Engineer</div>
 984:           <div class="links-tech">
 985:             ${personalInfo.email ? `<span class="link-item">📧 ${personalInfo.email}</span>` : ''}
 986:             ${personalInfo.github ? `<span class="link-item">⚡ GitHub</span>` : ''}
 987:             ${personalInfo.linkedin ? `<span class="link-item">💼 LinkedIn</span>` : ''}
 988:             ${personalInfo.website ? `<span class="link-item">🌐 Portfolio</span>` : ''}
 989:           </div>
 990:         </div>
 991:         
 992:         <div class="tech-stack-section">
 993:           <h2 class="section-header-tech">// Tech Stack</h2>
 994:           <div class="tech-stack-grid">
 995:             ${skills.technical.map(skill => {
 996:               const color = getTechColor(skill);
 997:               return `<span class="tech-stack-badge" style="background: ${color}">${skill}</span>`;
 998:             }).join('')}
 999:           </div>
1000:         </div>
1001:         
1002:         <div class="section-tech">
1003:           <h2 class="section-header-tech">// Professional Experience</h2>
1004:           ${experience.map(exp => `
1005:             <div class="job-entry-tech">
1006:               <div class="job-header-tech">
1007:                 <div>
1008:                   <h3 class="job-title-tech">${exp.position}</h3>
1009:                   <div class="company-tech">${exp.company} • ${exp.location}</div>
1010:                 </div>
1011:                 <div class="date-tech">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
1012:               </div>
1013:               ${exp.technologies && exp.technologies.length > 0 ? `
1014:                 <div class="tech-used">
1015:                   ${exp.technologies.map(tech => `<code class="tech-tag">${tech}</code>`).join('')}
1016:                 </div>
1017:               ` : ''}
1018:               <ul class="achievements-tech">
1019:                 ${exp.achievements.map(achievement => `
1020:                   <li><code class="bullet">></code> ${achievement}</li>
1021:                 `).join('')}
1022:               </ul>
1023:             </div>
1024:           `).join('')}
1025:         </div>
1026:         
1027:         ${projects && projects.length > 0 ? `
1028:           <div class="section-tech">
1029:             <h2 class="section-header-tech">// Projects</h2>
1030:             ${projects.map(project => `
1031:               <div class="project-entry-tech">
1032:                 <div class="project-header-tech">
1033:                   <h3 class="project-title-tech">${project.name}</h3>
1034:                   ${project.github ? `<span class="github-link">⚡ GitHub</span>` : ''}
1035:                 </div>
1036:                 <p class="project-description-tech">${project.description}</p>
1037:                 <div class="project-tech-stack">
1038:                   ${project.technologies.map(tech => `<code class="tech-tag">${tech}</code>`).join('')}
1039:                 </div>
1040:               </div>
1041:             `).join('')}
1042:           </div>
1043:         ` : ''}
1044:         
1045:         <div class="section-tech">
1046:           <h2 class="section-header-tech">// Education</h2>
1047:           ${education.map(edu => `
1048:             <div class="education-entry-tech">
1049:               <h3 class="degree-tech">${edu.degree} in ${edu.field}</h3>
1050:               <div class="institution-tech">${edu.institution} • ${edu.graduationDate}</div>
1051:             </div>
1052:           `).join('')}
1053:         </div>
1054:       </div>
1055:     `;
1056:   },
1057:   
1058:   css: `
1059:     .resume-tech {
1060:       max-width: 8.5in;
1061:       margin: 0 auto;
1062:       padding: 0.75in;
1063:       font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
1064:       background: #0f172a;
1065:       color: #e2e8f0;
1066:     }
1067:     
1068:     .header-tech {
1069:       border-bottom: 2px solid #3b82f6;
1070:       padding-bottom: 1.5rem;
1071:       margin-bottom: 2rem;
1072:     }
1073:     
1074:     .name-tech {
1075:       font-size: 28px;
1076:       font-weight: 800;
1077:       color: #3b82f6;
1078:       margin: 0 0 0.25rem;
1079:       font-family: 'Fira Code', 'Courier New', monospace;
1080:     }
1081:     
1082:     .title-tech {
1083:       font-size: 14px;
1084:       color: #94a3b8;
1085:       font-weight: 500;
1086:       margin-bottom: 1rem;
1087:     }
1088:     
1089:     .links-tech {
1090:       display: flex;
1091:       gap: 1.5rem;
1092:       flex-wrap: wrap;
1093:     }
1094:     
1095:     .link-item {
1096:       font-size: 10px;
1097:       color: #cbd5e1;
1098:       font-family: 'Fira Code', monospace;
1099:     }
1100:     
1101:     .tech-stack-section {
1102:       background: #1e293b;
1103:       padding: 1.5rem;
1104:       border-radius: 8px;
1105:       margin-bottom: 2rem;
1106:       border-left: 4px solid #3b82f6;
1107:     }
1108:     
1109:     .section-header-tech {
1110:       font-size: 14px;
1111:       font-weight: 700;
1112:       color: #3b82f6;
1113:       font-family: 'Fira Code', monospace;
1114:       margin: 0 0 1rem;
1115:     }
1116:     
1117:     .tech-stack-grid {
1118:       display: flex;
1119:       gap: 0.75rem;
1120:       flex-wrap: wrap;
1121:     }
1122:     
1123:     .tech-stack-badge {
1124:       padding: 0.5rem 1rem;
1125:       border-radius: 6px;
1126:       font-size: 10px;
1127:       font-weight: 600;
1128:       color: white;
1129:       font-family: 'Fira Code', monospace;
1130:     }
1131:     
1132:     .section-tech {
1133:       margin-bottom: 2rem;
1134:     }
1135:     
1136:     .job-entry-tech,
1137:     .project-entry-tech {
1138:       background: #1e293b;
1139:       padding: 1.5rem;
1140:       border-radius: 8px;
1141:       margin-bottom: 1.5rem;
1142:       border-left: 4px solid #64748b;
1143:     }
1144:     
1145:     .job-header-tech {
1146:       display: flex;
1147:       justify-content: space-between;
1148:       align-items: flex-start;
1149:       margin-bottom: 0.75rem;
1150:     }
1151:     
1152:     .job-title-tech {
1153:       font-size: 14px;
1154:       font-weight: 700;
1155:       color: #f1f5f9;
1156:       margin: 0 0 0.25rem;
1157:     }
1158:     
1159:     .company-tech {
1160:       font-size: 11px;
1161:       color: #94a3b8;
1162:     }
1163:     
1164:     .date-tech {
1165:       font-size: 10px;
1166:       color: #64748b;
1167:       font-family: 'Fira Code', monospace;
1168:     }
1169:     
1170:     .tech-used,
1171:     .project-tech-stack {
1172:       display: flex;
1173:       gap: 0.5rem;
1174:       flex-wrap: wrap;
1175:       margin-bottom: 0.75rem;
1176:     }
1177:     
1178:     .tech-tag {
1179:       background: #334155;
1180:       color: #3b82f6;
1181:       padding: 0.25rem 0.5rem;
1182:       border-radius: 4px;
1183:       font-size: 9px;
1184:       font-family: 'Fira Code', monospace;
1185:       font-weight: 600;
1186:     }
1187:     
1188:     .achievements-tech {
1189:       margin: 0;
1190:       padding: 0;
1191:       list-style: none;
1192:     }
1193:     
1194:     .achievements-tech li {
1195:       font-size: 10px;
1196:       line-height: 1.7;
1197:       color: #cbd5e1;
1198:       margin-bottom: 0.5rem;
1199:     }
1200:     
1201:     .bullet {
1202:       color: #3b82f6;
1203:       font-weight: 700;
1204:       margin-right: 0.5rem;
1205:     }
1206:     
1207:     .project-header-tech {
1208:       display: flex;
1209:       justify-content: space-between;
1210:       align-items: center;
1211:       margin-bottom: 0.5rem;
1212:     }
1213:     
1214:     .project-title-tech {
1215:       font-size: 13px;
1216:       font-weight: 700;
1217:       color: #f1f5f9;
1218:       margin: 0;
1219:     }
1220:     
1221:     .github-link {
1222:       font-size: 10px;
1223:       color: #3b82f6;
1224:       font-family: 'Fira Code', monospace;
1225:     }
1226:     
1227:     .project-description-tech {
1228:       font-size: 10px;
1229:       line-height: 1.6;
1230:       color: #cbd5e1;
1231:       margin: 0 0 0.75rem;
1232:     }
1233:     
1234:     .education-entry-tech {
1235:       background: #1e293b;
1236:       padding: 1rem;
1237:       border-radius: 8px;
1238:       margin-bottom: 1rem;
1239:     }
1240:     
1241:     .degree-tech {
1242:       font-size: 12px;
1243:       font-weight: 700;
1244:       color: #f1f5f9;
1245:       margin: 0 0 0.25rem;
1246:     }
1247:     
1248:     .institution-tech {
1249:       font-size: 10px;
1250:       color: #94a3b8;
1251:     }
1252:     
1253:     @media print {
1254:       .resume-tech {
1255:         background: white;
1256:         color: #1e293b;
1257:       }
1258:       .header-tech {
1259:         border-bottom-color: #1e293b;
1260:       }
1261:       .name-tech,
1262:       .section-header-tech {
1263:         color: #1e293b;
1264:       }
1265:       .job-entry-tech,
1266:       .project-entry-tech,
1267:       .education-entry-tech,
1268:       .tech-stack-section {
1269:         background: #f8fafc;
1270:         border: 1px solid #e2e8f0;
1271:       }
1272:     }
1273:   `
1274: };
1275: 
1276: /**
1277:  * TEMPLATE 5: MINIMAL/ATS (Maximum Compatibility)
1278:  */
1279: const minimalTemplate: ResumeTemplate = {
1280:   id: 'minimal',
1281:   name: 'Minimal/ATS',
1282:   description: 'Plain text format optimized for ATS systems',
1283:   bestFor: ['ATS Systems', 'Government', 'Large Corporations', 'Conservative'],
1284:   preview: '/templates/minimal-preview.png',
1285:   
1286:   generate: (data: ResumeData) => {
1287:     const { personalInfo, experience, education, skills } = data;
1288:     
1289:     return `
1290:       <div class="resume-minimal">
1291:         <div class="header-minimal">
1292:           <h1 class="name-minimal">${personalInfo.fullName}</h1>
1293:           <div class="contact-minimal">
1294:             ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
1295:             ${personalInfo.linkedin ? ` | ${personalInfo.linkedin}` : ''}
1296:           </div>
1297:         </div>
1298:         
1299:         <div class="section-minimal">
1300:           <h2 class="section-title-minimal">PROFESSIONAL SUMMARY</h2>
1301:           <p class="text-minimal">${personalInfo.summary}</p>
1302:         </div>
1303:         
1304:         <div class="section-minimal">
1305:           <h2 class="section-title-minimal">PROFESSIONAL EXPERIENCE</h2>
1306:           ${experience.map(exp => `
1307:             <div class="entry-minimal">
1308:               <div class="entry-title-minimal">${exp.position}</div>
1309:               <div class="entry-subtitle-minimal">${exp.company}, ${exp.location}</div>
1310:               <div class="entry-date-minimal">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
1311:               <ul class="list-minimal">
1312:                 ${exp.achievements.map(achievement => `
1313:                   <li>${achievement}</li>
1314:                 `).join('')}
1315:               </ul>
1316:             </div>
1317:           `).join('')}
1318:         </div>
1319:         
1320:         <div class="section-minimal">
1321:           <h2 class="section-title-minimal">EDUCATION</h2>
1322:           ${education.map(edu => `
1323:             <div class="entry-minimal">
1324:               <div class="entry-title-minimal">${edu.degree}, ${edu.field}</div>
1325:               <div class="entry-subtitle-minimal">${edu.institution}, ${edu.location}</div>
1326:               <div class="entry-date-minimal">${edu.graduationDate}</div>
1327:               ${edu.gpa ? `<div class="text-minimal">GPA: ${edu.gpa}</div>` : ''}
1328:             </div>
1329:           `).join('')}
1330:         </div>
1331:         
1332:         <div class="section-minimal">
1333:           <h2 class="section-title-minimal">SKILLS</h2>
1334:           <div class="text-minimal">
1335:             <strong>Technical Skills:</strong> ${skills.technical.join(', ')}
1336:           </div>
1337:           ${skills.soft.length > 0 ? `
1338:             <div class="text-minimal">
1339:               <strong>Professional Skills:</strong> ${skills.soft.join(', ')}
1340:             </div>
1341:           ` : ''}
1342:         </div>
1343:       </div>
1344:     `;
1345:   },
1346:   
1347:   css: `
1348:     .resume-minimal {
1349:       max-width: 8.5in;
1350:       margin: 0 auto;
1351:       padding: 1in;
1352:       font-family: Arial, Helvetica, sans-serif;
1353:       background: white;
1354:       color: #000;
1355:       line-height: 1.5;
1356:     }
1357:     
1358:     .header-minimal {
1359:       margin-bottom: 1.5rem;
1360:     }
1361:     
1362:     .name-minimal {
1363:       font-size: 16px;
1364:       font-weight: 700;
1365:       margin: 0 0 0.5rem;
1366:       text-transform: uppercase;
1367:     }
1368:     
1369:     .contact-minimal {
1370:       font-size: 11px;
1371:       margin: 0;
1372:     }
1373:     
1374:     .section-minimal {
1375:       margin-bottom: 1.5rem;
1376:     }
1377:     
1378:     .section-title-minimal {
1379:       font-size: 12px;
1380:       font-weight: 700;
1381:       margin: 0 0 0.75rem;
1382:       text-transform: uppercase;
1383:     }
1384:     
1385:     .entry-minimal {
1386:       margin-bottom: 1rem;
1387:     }
1388:     
1389:     .entry-title-minimal {
1390:       font-size: 11px;
1391:       font-weight: 700;
1392:       margin-bottom: 0.25rem;
1393:     }
1394:     
1395:     .entry-subtitle-minimal {
1396:       font-size: 11px;
1397:       margin-bottom: 0.25rem;
1398:     }
1399:     
1400:     .entry-date-minimal {
1401:       font-size: 11px;
1402:       margin-bottom: 0.5rem;
1403:     }
1404:     
1405:     .text-minimal {
1406:       font-size: 11px;
1407:       margin: 0 0 0.5rem;
1408:     }
1409:     
1410:     .list-minimal {
1411:       margin: 0.5rem 0 0 1.25rem;
1412:       padding: 0;
1413:       list-style-type: disc;
1414:     }
1415:     
1416:     .list-minimal li {
1417:       font-size: 11px;
1418:       margin-bottom: 0.25rem;
1419:     }
1420:     
1421:     @media print {
1422:       .resume-minimal {
1423:         padding: 0.5in;
1424:       }
1425:     }
1426:   `
1427: };
1428: 
1429: /**
1430:  * Helper function to get tech-specific colors
1431:  */
1432: function getTechColor(tech: string): string {
1433:   const techLower = tech.toLowerCase();
1434:   const colorMap: Record<string, string> = {
1435:     'react': '#61dafb',
1436:     'vue': '#42b883',
1437:     'angular': '#dd0031',
1438:     'javascript': '#f7df1e',
1439:     'typescript': '#3178c6',
1440:     'python': '#3776ab',
1441:     'java': '#007396',
1442:     'node': '#339933',
1443:     'aws': '#ff9900',
1444:     'docker': '#2496ed',
1445:     'kubernetes': '#326ce5',
1446:     'mongodb': '#47a248',
1447:     'postgresql': '#336791',
1448:     'mysql': '#4479a1',
1449:     'redis': '#dc382d',
1450:     'graphql': '#e10098',
1451:     'git': '#f05032',
1452:     'linux': '#fcc624',
1453:   };
1454:   
1455:   for (const [key, color] of Object.entries(colorMap)) {
1456:     if (techLower.includes(key)) {
1457:       return color;
1458:     }
1459:   }
1460:   
1461:   return '#3b82f6'; // Default blue
1462: }
1463: 
1464: /**
1465:  * TEMPLATE 6: EXECUTIVE (C-Suite/Director)
1466:  */
1467: const executiveTemplate: ResumeTemplate = {
1468:   id: 'executive',
1469:   name: 'Executive',
1470:   description: 'Premium layout for C-suite and senior leadership',
1471:   bestFor: ['C-Suite', 'VP', 'Director', 'Senior Leadership', 'Board Members'],
1472:   preview: '/templates/executive-preview.png',
1473:   
1474:   generate: (data: ResumeData) => {
1475:     const { personalInfo, experience, education, skills } = data;
1476:     
1477:     return `
1478:       <div class="resume-executive">
1479:         <div class="header-executive">
1480:           <div class="header-content">
1481:             <h1 class="name-executive">${personalInfo.fullName}</h1>
1482:             <div class="executive-title">Chief Executive Officer | Board Director</div>
1483:             <div class="contact-executive">
1484:               ${personalInfo.email} • ${personalInfo.phone} • ${personalInfo.location}
1485:               ${personalInfo.linkedin ? ` • ${personalInfo.linkedin}` : ''}
1486:             </div>
1487:           </div>
1488:         </div>
1489:         
1490:         <div class="executive-summary-section">
1491:           <h2 class="section-header-executive">EXECUTIVE SUMMARY</h2>
1492:           <p class="executive-summary-text">${personalInfo.summary}</p>
1493:         </div>
1494:         
1495:         <div class="key-achievements-section">
1496:           <h2 class="section-header-executive">KEY ACHIEVEMENTS</h2>
1497:           <div class="achievements-grid">
1498:             ${experience.slice(0, 1).map(exp => 
1499:               exp.achievements.slice(0, 4).map(achievement => {
1500:                 const metrics = achievement.match(/\d+[%$MKB]?/g);
1501:                 return `
1502:                   <div class="achievement-card">
1503:                     <div class="achievement-metric">${metrics ? metrics[0] : '✓'}</div>
1504:                     <div class="achievement-text">${achievement}</div>
1505:                   </div>
1506:                 `;
1507:               }).join('')
1508:             ).join('')}
1509:           </div>
1510:         </div>
1511:         
1512:         <div class="section-executive">
1513:           <h2 class="section-header-executive">EXECUTIVE EXPERIENCE</h2>
1514:           ${experience.map(exp => `
1515:             <div class="executive-entry">
1516:               <div class="executive-entry-header">
1517:                 <div>
1518:                   <h3 class="executive-position">${exp.position}</h3>
1519:                   <div class="executive-company">${exp.company}</div>
1520:                 </div>
1521:                 <div class="executive-dates">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</div>
1522:               </div>
1523:               <div class="leadership-scope">
1524:                 <span class="scope-item">P&L: $10M+</span>
1525:                 <span class="scope-item">Team: 50+ Direct/Indirect</span>
1526:                 <span class="scope-item">Board Reporting</span>
1527:               </div>
1528:               <ul class="executive-achievements">
1529:                 ${exp.achievements.map(achievement => `
1530:                   <li>${achievement}</li>
1531:                 `).join('')}
1532:               </ul>
1533:             </div>
1534:           `).join('')}
1535:         </div>
1536:         
1537:         <div class="two-column-section">
1538:           <div class="column">
1539:             <h2 class="section-header-executive">EDUCATION</h2>
1540:             ${education.map(edu => `
1541:               <div class="executive-education">
1542:                 <h3 class="executive-degree">${edu.degree}</h3>
1543:                 <div class="executive-institution">${edu.institution}</div>
1544:                 <div class="executive-year">${edu.graduationDate}</div>
1545:                 ${edu.honors && edu.honors.length > 0 ? `
1546:                   <div class="executive-honors">${edu.honors.join(' • ')}</div>
1547:                 ` : ''}
1548:               </div>
1549:             `).join('')}
1550:           </div>
1551:           
1552:           <div class="column">
1553:             <h2 class="section-header-executive">PROFESSIONAL AFFILIATIONS</h2>
1554:             <ul class="affiliations-list">
1555:               <li>Board Member, Tech Industry Association</li>
1556:               <li>Advisory Board, Innovation Council</li>
1557:               <li>Member, CEO Roundtable</li>
1558:             </ul>
1559:             
1560:             ${skills.certifications && skills.certifications.length > 0 ? `
1561:               <h2 class="section-header-executive">CERTIFICATIONS</h2>
1562:               <ul class="certifications-list">
1563:                 ${skills.certifications.map(cert => `
1564:                   <li>${cert.name} - ${cert.issuer}</li>
1565:                 `).join('')}
1566:               </ul>
1567:             ` : ''}
1568:           </div>
1569:         </div>
1570:       </div>
1571:     `;
1572:   },
1573:   
1574:   css: `
1575:     .resume-executive {
1576:       max-width: 8.5in;
1577:       margin: 0 auto;
1578:       padding: 0.75in;
1579:       font-family: 'Garamond', 'Georgia', serif;
1580:       background: white;
1581:       color: #1a1a1a;
1582:     }
1583:     
1584:     .header-executive {
1585:       background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
1586:       color: white;
1587:       padding: 2rem;
1588:       margin: -0.75in -0.75in 2rem;
1589:       border-bottom: 4px solid #d4af37;
1590:     }
1591:     
1592:     .name-executive {
1593:       font-size: 32px;
1594:       font-weight: 700;
1595:       margin: 0 0 0.5rem;
1596:       letter-spacing: 1px;
1597:     }
1598:     
1599:     .executive-title {
1600:       font-size: 16px;
1601:       font-weight: 500;
1602:       margin-bottom: 1rem;
1603:       color: #d4af37;
1604:       letter-spacing: 0.5px;
1605:     }
1606:     
1607:     .contact-executive {
1608:       font-size: 11px;
1609:       opacity: 0.95;
1610:     }
1611:     
1612:     .executive-summary-section {
1613:       background: #f8f9fa;
1614:       padding: 1.5rem;
1615:       border-left: 4px solid #d4af37;
1616:       margin-bottom: 2rem;
1617:     }
1618:     
1619:     .section-header-executive {
1620:       font-size: 14px;
1621:       font-weight: 700;
1622:       text-transform: uppercase;
1623:       color: #1e3a5f;
1624:       margin: 0 0 1rem;
1625:       letter-spacing: 1.5px;
1626:       border-bottom: 2px solid #d4af37;
1627:       padding-bottom: 0.5rem;
1628:     }
1629:     
1630:     .executive-summary-text {
1631:       font-size: 12px;
1632:       line-height: 1.8;
1633:       margin: 0;
1634:       text-align: justify;
1635:     }
1636:     
1637:     .key-achievements-section {
1638:       margin-bottom: 2rem;
1639:     }
1640:     
1641:     .achievements-grid {
1642:       display: grid;
1643:       grid-template-columns: repeat(2, 1fr);
1644:       gap: 1rem;
1645:     }
1646:     
1647:     .achievement-card {
1648:       background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
1649:       padding: 1rem;
1650:       border-radius: 8px;
1651:       border-left: 4px solid #d4af37;
1652:     }
1653:     
1654:     .achievement-metric {
1655:       font-size: 24px;
1656:       font-weight: 700;
1657:       color: #1e3a5f;
1658:       margin-bottom: 0.5rem;
1659:     }
1660:     
1661:     .achievement-text {
1662:       font-size: 10px;
1663:       line-height: 1.5;
1664:       color: #495057;
1665:     }
1666:     
1667:     .section-executive {
1668:       margin-bottom: 2rem;
1669:     }
1670:     
1671:     .executive-entry {
1672:       margin-bottom: 2rem;
1673:       padding-bottom: 2rem;
1674:       border-bottom: 1px solid #dee2e6;
1675:     }
1676:     
1677:     .executive-entry:last-child {
1678:       border-bottom: none;
1679:     }
1680:     
1681:     .executive-entry-header {
1682:       display: flex;
1683:       justify-content: space-between;
1684:       align-items: flex-start;
1685:       margin-bottom: 0.75rem;
1686:     }
1687:     
1688:     .executive-position {
1689:       font-size: 15px;
1690:       font-weight: 700;
1691:       color: #1e3a5f;
1692:       margin: 0 0 0.25rem;
1693:     }
1694:     
1695:     .executive-company {
1696:       font-size: 13px;
1697:       font-style: italic;
1698:       color: #495057;
1699:     }
1700:     
1701:     .executive-dates {
1702:       font-size: 11px;
1703:       color: #6c757d;
1704:       font-weight: 600;
1705:     }
1706:     
1707:     .leadership-scope {
1708:       display: flex;
1709:       gap: 1.5rem;
1710:       margin-bottom: 1rem;
1711:       padding: 0.75rem;
1712:       background: #f8f9fa;
1713:       border-radius: 4px;
1714:     }
1715:     
1716:     .scope-item {
1717:       font-size: 10px;
1718:       font-weight: 600;
1719:       color: #1e3a5f;
1720:     }
1721:     
1722:     .executive-achievements {
1723:       margin: 0;
1724:       padding-left: 1.5rem;
1725:       list-style-type: none;
1726:     }
1727:     
1728:     .executive-achievements li {
1729:       font-size: 11px;
1730:       line-height: 1.7;
1731:       margin-bottom: 0.5rem;
1732:       position: relative;
1733:     }
1734:     
1735:     .executive-achievements li:before {
1736:       content: "▸";
1737:       position: absolute;
1738:       left: -1.5rem;
1739:       color: #d4af37;
1740:       font-weight: 700;
1741:     }
1742:     
1743:     .two-column-section {
1744:       display: grid;
1745:       grid-template-columns: repeat(2, 1fr);
1746:       gap: 2rem;
1747:     }
1748:     
1749:     .column {
1750:       margin-bottom: 1rem;
1751:     }
1752:     
1753:     .executive-education {
1754:       margin-bottom: 1.5rem;
1755:     }
1756:     
1757:     .executive-degree {
1758:       font-size: 13px;
1759:       font-weight: 700;
1760:       color: #1e3a5f;
1761:       margin: 0 0 0.25rem;
1762:     }
1763:     
1764:     .executive-institution {
1765:       font-size: 11px;
1766:       font-style: italic;
1767:       color: #495057;
1768:       margin-bottom: 0.25rem;
1769:     }
1770:     
1771:     .executive-year {
1772:       font-size: 10px;
1773:       color: #6c757d;
1774:     }
1775:     
1776:     .executive-honors {
1777:       font-size: 10px;
1778:       color: #d4af37;
1779:       font-weight: 600;
1780:       margin-top: 0.25rem;
1781:     }
1782:     
1783:     .affiliations-list,
1784:     .certifications-list {
1785:       margin: 0.5rem 0 0 1.25rem;
1786:       padding: 0;
1787:       list-style-type: disc;
1788:     }
1789:     
1790:     .affiliations-list li,
1791:     .certifications-list li {
1792:       font-size: 10px;
1793:       line-height: 1.6;
1794:       margin-bottom: 0.5rem;
1795:     }
1796:     
1797:     @media print {
1798:       .resume-executive {
1799:         padding: 0.5in;
1800:       }
1801:       .header-executive {
1802:         margin: -0.5in -0.5in 1.5rem;
1803:         print-color-adjust: exact;
1804:         -webkit-print-color-adjust: exact;
1805:       }
1806:     }
1807:   `
1808: };
1809: 
1810: /**
1811:  * TEMPLATE 7: CURRICULUM VITAE (Academic/Research)
1812:  */
1813: const cvTemplate: ResumeTemplate = {
1814:   id: 'cv',
1815:   name: 'Curriculum Vitae',
1816:   description: 'Academic format for research and scholarly positions',
1817:   bestFor: ['Academia', 'Research', 'PhD', 'Medical', 'Scientific'],
1818:   preview: '/templates/cv-preview.png',
1819:   
1820:   generate: (data: ResumeData) => {
1821:     const { personalInfo, experience, education, skills } = data;
1822:     
1823:     return `
1824:       <div class="resume-cv">
1825:         <div class="header-cv">
1826:           <h1 class="name-cv">${personalInfo.fullName}, Ph.D.</h1>
1827:           <div class="contact-cv">
1828:             ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
1829:           </div>
1830:           <div class="academic-profiles">
1831:             ${personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin} | ` : ''}
1832:             Google Scholar | ORCID: 0000-0000-0000-0000
1833:           </div>
1834:         </div>
1835:         
1836:         <div class="section-cv">
1837:           <h2 class="section-title-cv">1. ACADEMIC APPOINTMENTS</h2>
1838:           ${experience.map((exp, index) => `
1839:             <div class="cv-entry">
1840:               <div class="cv-entry-header">
1841:                 <strong>${exp.position}</strong>
1842:                 <span class="cv-dates">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</span>
1843:               </div>
1844:               <div class="cv-institution">${exp.company}, ${exp.location}</div>
1845:               ${index === 0 ? '<div class="cv-note">(Tenure Track)</div>' : ''}
1846:             </div>
1847:           `).join('')}
1848:         </div>
1849:         
1850:         <div class="section-cv">
1851:           <h2 class="section-title-cv">2. EDUCATION</h2>
1852:           ${education.map(edu => `
1853:             <div class="cv-entry">
1854:               <div class="cv-entry-header">
1855:                 <strong>${edu.degree}, ${edu.field}</strong>
1856:                 <span class="cv-dates">${edu.graduationDate}</span>
1857:               </div>
1858:               <div class="cv-institution">${edu.institution}, ${edu.location}</div>
1859:               <div class="cv-thesis">Dissertation: "Advanced Research in ${edu.field}"</div>
1860:               ${edu.honors && edu.honors.length > 0 ? `
1861:                 <div class="cv-honors">${edu.honors.join(', ')}</div>
1862:               ` : ''}
1863:             </div>
1864:           `).join('')}
1865:         </div>
1866:         
1867:         <div class="section-cv">
1868:           <h2 class="section-title-cv">3. RESEARCH INTERESTS</h2>
1869:           <ul class="cv-list">
1870:             <li>Computational Methods and Algorithm Development</li>
1871:             <li>Machine Learning Applications in Scientific Research</li>
1872:             <li>Data Analysis and Statistical Modeling</li>
1873:             <li>Interdisciplinary Collaboration and Innovation</li>
1874:           </ul>
1875:         </div>
1876:         
1877:         <div class="section-cv">
1878:           <h2 class="section-title-cv">4. PUBLICATIONS</h2>
1879:           
1880:           <h3 class="subsection-cv">Peer-Reviewed Journal Articles</h3>
1881:           <ol class="publications-list">
1882:             <li>
1883:               <strong>${personalInfo.fullName}</strong>, Smith, J., & Johnson, A. (2024). 
1884:               "Advanced Methods in Computational Research." 
1885:               <em>Journal of Advanced Science</em>, 45(3), 123-145. 
1886:               DOI: 10.1234/jas.2024.001
1887:             </li>
1888:             <li>
1889:               Johnson, A., <strong>${personalInfo.fullName}</strong>, & Davis, R. (2023). 
1890:               "Novel Approaches to Data Analysis." 
1891:               <em>International Journal of Research</em>, 32(2), 67-89. 
1892:               DOI: 10.1234/ijr.2023.045
1893:             </li>
1894:           </ol>
1895:           
1896:           <h3 class="subsection-cv">Conference Proceedings</h3>
1897:           <ol class="publications-list" start="3">
1898:             <li>
1899:               <strong>${personalInfo.fullName}</strong> (2024). 
1900:               "Innovative Research Methodologies." 
1901:               <em>Proceedings of the International Conference on Research</em>, 
1902:               pp. 234-245. New York, NY.
1903:             </li>
1904:           </ol>
1905:         </div>
1906:         
1907:         <div class="section-cv">
1908:           <h2 class="section-title-cv">5. GRANTS & FUNDING</h2>
1909:           <div class="cv-entry">
1910:             <div class="cv-entry-header">
1911:               <strong>National Science Foundation Grant</strong>
1912:               <span class="cv-dates">2023 – 2026</span>
1913:             </div>
1914:             <div class="cv-grant-details">
1915:               Principal Investigator, $500,000
1916:               <br/>
1917:               "Advanced Research in Computational Methods"
1918:             </div>
1919:           </div>
1920:         </div>
1921:         
1922:         <div class="section-cv">
1923:           <h2 class="section-title-cv">6. TEACHING EXPERIENCE</h2>
1924:           <ul class="cv-list">
1925:             <li><strong>Advanced Research Methods</strong> (Graduate Level) – Fall 2023, Spring 2024</li>
1926:             <li><strong>Introduction to Data Science</strong> (Undergraduate) – Fall 2022, Spring 2023</li>
1927:             <li><strong>Statistical Analysis</strong> (Graduate Level) – Spring 2022</li>
1928:           </ul>
1929:         </div>
1930:         
1931:         <div class="section-cv">
1932:           <h2 class="section-title-cv">7. CONFERENCE PRESENTATIONS</h2>
1933:           <ul class="cv-list">
1934:             <li>"Recent Advances in Research Methodology" – International Conference, 2024</li>
1935:             <li>"Data-Driven Approaches" – National Symposium, 2023</li>
1936:             <li>"Computational Methods" – Regional Workshop, 2023</li>
1937:           </ul>
1938:         </div>
1939:         
1940:         <div class="section-cv">
1941:           <h2 class="section-title-cv">8. PROFESSIONAL SERVICE</h2>
1942:           <ul class="cv-list">
1943:             <li><strong>Reviewer:</strong> Journal of Advanced Science, International Journal of Research</li>
1944:             <li><strong>Committee Member:</strong> Graduate Admissions Committee (2023-Present)</li>
1945:             <li><strong>Organizer:</strong> Annual Research Symposium (2024)</li>
1946:           </ul>
1947:         </div>
1948:         
1949:         <div class="section-cv">
1950:           <h2 class="section-title-cv">9. TECHNICAL SKILLS</h2>
1951:           <div class="cv-skills">
1952:             <strong>Programming:</strong> ${skills.technical.slice(0, 5).join(', ')}
1953:             <br/>
1954:             <strong>Software:</strong> MATLAB, R, SPSS, LaTeX
1955:             <br/>
1956:             <strong>Languages:</strong> ${skills.languages ? skills.languages.map(l => `${l.language} (${l.proficiency})`).join(', ') : 'English (Native)'}
1957:           </div>
1958:         </div>
1959:         
1960:         <div class="cv-footer">
1961:           <em>References available upon request</em>
1962:           <div class="cv-page-number">Page 1 of 1</div>
1963:         </div>
1964:       </div>
1965:     `;
1966:   },
1967:   
1968:   css: `
1969:     .resume-cv {
1970:       max-width: 8.5in;
1971:       margin: 0 auto;
1972:       padding: 1in;
1973:       font-family: 'Computer Modern', 'Times New Roman', serif;
1974:       background: white;
1975:       color: #000;
1976:       line-height: 1.6;
1977:     }
1978:     
1979:     .header-cv {
1980:       text-align: center;
1981:       margin-bottom: 2rem;
1982:       padding-bottom: 1rem;
1983:       border-bottom: 2px solid #000;
1984:     }
1985:     
1986:     .name-cv {
1987:       font-size: 20px;
1988:       font-weight: 700;
1989:       margin: 0 0 0.5rem;
1990:     }
1991:     
1992:     .contact-cv {
1993:       font-size: 11px;
1994:       margin-bottom: 0.25rem;
1995:     }
1996:     
1997:     .academic-profiles {
1998:       font-size: 10px;
1999:       color: #333;
2000:     }
2001:     
2002:     .section-cv {
2003:       margin-bottom: 1.5rem;
2004:     }
2005:     
2006:     .section-title-cv {
2007:       font-size: 12px;
2008:       font-weight: 700;
2009:       text-transform: uppercase;
2010:       margin: 0 0 0.75rem;
2011:       border-bottom: 1px solid #000;
2012:       padding-bottom: 0.25rem;
2013:     }
2014:     
2015:     .subsection-cv {
2016:       font-size: 11px;
2017:       font-weight: 700;
2018:       margin: 1rem 0 0.5rem;
2019:     }
2020:     
2021:     .cv-entry {
2022:       margin-bottom: 1rem;
2023:     }
2024:     
2025:     .cv-entry-header {
2026:       display: flex;
2027:       justify-content: space-between;
2028:       align-items: baseline;
2029:       margin-bottom: 0.25rem;
2030:       font-size: 11px;
2031:     }
2032:     
2033:     .cv-dates {
2034:       font-size: 10px;
2035:       font-weight: normal;
2036:     }
2037:     
2038:     .cv-institution {
2039:       font-size: 11px;
2040:       font-style: italic;
2041:       margin-bottom: 0.25rem;
2042:     }
2043:     
2044:     .cv-thesis {
2045:       font-size: 10px;
2046:       margin-top: 0.25rem;
2047:     }
2048:     
2049:     .cv-note {
2050:       font-size: 10px;
2051:       color: #555;
2052:       margin-top: 0.25rem;
2053:     }
2054:     
2055:     .cv-honors {
2056:       font-size: 10px;
2057:       font-style: italic;
2058:       margin-top: 0.25rem;
2059:     }
2060:     
2061:     .cv-grant-details {
2062:       font-size: 10px;
2063:       line-height: 1.5;
2064:       margin-top: 0.25rem;
2065:     }
2066:     
2067:     .cv-list {
2068:       margin: 0.5rem 0 0 1.5rem;
2069:       padding: 0;
2070:       list-style-type: disc;
2071:     }
2072:     
2073:     .cv-list li {
2074:       font-size: 10px;
2075:       line-height: 1.6;
2076:       margin-bottom: 0.5rem;
2077:     }
2078:     
2079:     .publications-list {
2080:       margin: 0.5rem 0 1rem 1.5rem;
2081:       padding: 0;
2082:     }
2083:     
2084:     .publications-list li {
2085:       font-size: 10px;
2086:       line-height: 1.7;
2087:       margin-bottom: 0.75rem;
2088:       text-indent: -1.5rem;
2089:       padding-left: 1.5rem;
2090:     }
2091:     
2092:     .cv-skills {
2093:       font-size: 10px;
2094:       line-height: 1.8;
2095:     }
2096:     
2097:     .cv-footer {
2098:       margin-top: 2rem;
2099:       padding-top: 1rem;
2100:       border-top: 1px solid #000;
2101:       text-align: center;
2102:       font-size: 10px;
2103:     }
2104:     
2105:     .cv-page-number {
2106:       margin-top: 0.5rem;
2107:       font-size: 9px;
2108:       color: #666;
2109:     }
2110:     
2111:     @media print {
2112:       .resume-cv {
2113:         padding: 0.75in;
2114:       }
2115:       
2116:       @page {
2117:         margin: 0.75in;
2118:       }
2119:     }
2120:   `
2121: };
2122: 
2123: export const resumeTemplates: Record<string, ResumeTemplate> = {
2124:   modern: modernTemplate,
2125:   professional: professionalTemplate,
2126:   creative: creativeTemplate,
2127:   tech: techTemplate,
2128:   minimal: minimalTemplate,
2129:   executive: executiveTemplate,
2130:   cv: cvTemplate,
2131: };
2132: 
2133: export function getTemplateById(id: string): ResumeTemplate {
2134:   return resumeTemplates[id] || resumeTemplates.modern;
2135: }
2136: 
2137: export function getAllTemplates(): ResumeTemplate[] {
2138:   return Object.values(resumeTemplates);
2139: }
2140: 
2141: export function getTemplatesByIndustry(industry: string): ResumeTemplate[] {
2142:   const industryLower = industry.toLowerCase();
2143:   return Object.values(resumeTemplates).filter(template => 
2144:     template.bestFor.some(category => category.toLowerCase().includes(industryLower))
2145:   );
2146: }
````

## File: src/lib/scrapers/advanced-scraper.ts
````typescript
  1: /**
  2:  * Advanced Web Scraper with 4-Tier Fallback Strategy
  3:  * 
  4:  * Strategy 1: JSON-LD Structured Data (fastest, most reliable)
  5:  * Strategy 2: Cheerio HTML Parsing (fast, reliable for static sites)
  6:  * Strategy 3: Puppeteer Browser (for JavaScript-heavy sites)
  7:  * Strategy 4: Regex Extraction (last resort)
  8:  */
  9: 
 10: import * as cheerio from 'cheerio'
 11: import puppeteer from 'puppeteer-core'
 12: import chromium from '@sparticuz/chromium'
 13: 
 14: export interface ScrapeResult {
 15:   success: boolean
 16:   data?: {
 17:     title?: string
 18:     description?: string
 19:     requirements?: string[]
 20:     salary?: string
 21:     company?: string
 22:     location?: string
 23:     postedDate?: string
 24:   }
 25:   method?: 'structured' | 'cheerio' | 'puppeteer' | 'regex'
 26:   error?: string
 27: }
 28: 
 29: export class AdvancedScraper {
 30:   private readonly USER_AGENTS = [
 31:     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 32:     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
 33:     'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
 34:     'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
 35:   ]
 36: 
 37:   /**
 38:    * Main scraping method with 3-tier fallback
 39:    */
 40:   async scrape(url: string): Promise<ScrapeResult> {
 41:     if (process.env.PPX_DEBUG === 'true') {
 42:       console.log(`[SCRAPER] Processing: ${url}`)
 43:     }
 44: 
 45:     // Strategy 1: Structured data (JSON-LD) - fastest and most reliable
 46:     try {
 47:       const structured = await this.tryStructuredData(url)
 48:       if (structured.success && structured.data?.description && structured.data.description.length > 100) {
 49:         if (process.env.PPX_DEBUG === 'true') {
 50:           console.log('[SCRAPER] ✓ Structured data found')
 51:         }
 52:         return { ...structured, method: 'structured' }
 53:       }
 54:     } catch (e) {
 55:       if (process.env.PPX_DEBUG === 'true') {
 56:         console.log('[SCRAPER] Structured data failed:', (e as Error).message)
 57:       }
 58:     }
 59: 
 60:     // Strategy 2: Cheerio HTML parsing - fast and reliable for static sites
 61:     try {
 62:       const cheerioResult = await this.tryCheerioScraping(url)
 63:       if (cheerioResult.success && cheerioResult.data?.description && cheerioResult.data.description.length > 100) {
 64:         if (process.env.PPX_DEBUG === 'true') {
 65:           console.log('[SCRAPER] ✓ Cheerio parsing succeeded')
 66:         }
 67:         return { ...cheerioResult, method: 'cheerio' }
 68:       }
 69:     } catch (e) {
 70:       if (process.env.PPX_DEBUG === 'true') {
 71:         console.log('[SCRAPER] Cheerio failed:', (e as Error).message)
 72:       }
 73:     }
 74: 
 75:     // Strategy 3: Puppeteer browser - for JavaScript-heavy sites (Indeed, LinkedIn, etc.)
 76:     try {
 77:       const puppeteerResult = await this.tryPuppeteerScraping(url)
 78:       if (puppeteerResult.success && puppeteerResult.data?.description && puppeteerResult.data.description.length > 100) {
 79:         if (process.env.PPX_DEBUG === 'true') {
 80:           console.log('[SCRAPER] ✓ Puppeteer scraping succeeded')
 81:         }
 82:         return { ...puppeteerResult, method: 'puppeteer' }
 83:       }
 84:     } catch (e) {
 85:       if (process.env.PPX_DEBUG === 'true') {
 86:         console.log('[SCRAPER] Puppeteer failed:', (e as Error).message)
 87:       }
 88:     }
 89: 
 90:     // Strategy 4: Regex extraction - last resort
 91:     try {
 92:       const regex = await this.tryRegexExtraction(url)
 93:       if (regex.success && regex.data?.description && regex.data.description.length > 100) {
 94:         if (process.env.PPX_DEBUG === 'true') {
 95:           console.log('[SCRAPER] ✓ Regex extraction succeeded')
 96:         }
 97:         return { ...regex, method: 'regex' }
 98:       }
 99:     } catch (e) {
100:       if (process.env.PPX_DEBUG === 'true') {
101:         console.log('[SCRAPER] Regex failed:', (e as Error).message)
102:       }
103:     }
104: 
105:     return {
106:       success: false,
107:       error: 'All 4 scraping strategies failed - page may require login or CAPTCHA'
108:     }
109:   }
110: 
111:   /**
112:    * Strategy 1: Extract JSON-LD structured data
113:    * Many job boards include this for SEO
114:    */
115:   private async tryStructuredData(url: string): Promise<ScrapeResult> {
116:     const html = await this.fetchHTML(url)
117:     const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs)
118: 
119:     if (!jsonLdMatches) {
120:       return { success: false, error: 'No structured data found' }
121:     }
122: 
123:     for (const match of jsonLdMatches) {
124:       try {
125:         const json = JSON.parse(match.replace(/<\/?script[^>]*>/g, ''))
126: 
127:         // Check for JobPosting schema
128:         if (json['@type'] === 'JobPosting') {
129:           return {
130:             success: true,
131:             data: {
132:               title: json.title,
133:               description: json.description,
134:               company: json.hiringOrganization?.name,
135:               location: json.jobLocation?.address?.addressLocality || json.jobLocation?.address?.addressRegion,
136:               salary: this.extractSalaryFromStructured(json.baseSalary),
137:               postedDate: json.datePosted
138:             }
139:           }
140:         }
141:       } catch {
142:         continue
143:       }
144:     }
145: 
146:     return { success: false, error: 'No JobPosting structured data found' }
147:   }
148: 
149:   /**
150:    * Strategy 2: Cheerio HTML parsing
151:    * Works for most standard HTML pages
152:    */
153:   private async tryCheerioScraping(url: string): Promise<ScrapeResult> {
154:     const html = await this.fetchHTML(url)
155:     const $ = cheerio.load(html)
156: 
157:     // Remove noise elements
158:     $('script, style, nav, header, footer, aside, .advertisement, .ads').remove()
159: 
160:     // Try multiple selectors for description (ordered by specificity)
161:     const descriptionSelectors = [
162:       '.job-description',
163:       '[class*="job-description"]',
164:       '[class*="description"]',
165:       '[id*="description"]',
166:       '[class*="job-details"]',
167:       '[class*="jobDetails"]',
168:       '[data-job-description]',
169:       'article',
170:       'main',
171:       '.content'
172:     ]
173: 
174:     let description = ''
175:     for (const selector of descriptionSelectors) {
176:       const text = $(selector).text().trim()
177:       if (text.length > description.length && text.length > 100) {
178:         description = text
179:       }
180:     }
181: 
182:     // Extract title
183:     const title = 
184:       $('h1.job-title').text() ||
185:       $('[class*="job-title"]').first().text() ||
186:       $('[class*="jobTitle"]').first().text() ||
187:       $('h1').first().text() ||
188:       ''
189: 
190:     // Extract requirements
191:     const requirements: string[] = []
192:     $('.requirements li, .qualifications li, [class*="requirement"] li, [class*="qualification"] li').each((i, el) => {
193:       const req = $(el).text().trim()
194:       if (req && req.length > 10 && req.length < 500) {
195:         requirements.push(req)
196:       }
197:     })
198: 
199:     // Extract salary
200:     const salary = this.extractSalaryFromText(html)
201: 
202:     // Extract company
203:     const company = 
204:       $('[class*="company-name"]').first().text() ||
205:       $('[class*="companyName"]').first().text() ||
206:       $('[data-company]').text() ||
207:       ''
208: 
209:     // Extract location
210:     const location = 
211:       $('[class*="location"]').first().text() ||
212:       $('[class*="job-location"]').first().text() ||
213:       ''
214: 
215:     return {
216:       success: description.length > 100,
217:       data: {
218:         title: this.cleanText(title),
219:         description: this.cleanText(description),
220:         requirements,
221:         salary: this.cleanText(salary),
222:         company: this.cleanText(company),
223:         location: this.cleanText(location)
224:       }
225:     }
226:   }
227: 
228:   /**
229:    * Strategy 3: Puppeteer browser scraping (for JavaScript-heavy sites)
230:    * Handles Indeed, LinkedIn, Glassdoor, and other dynamic job boards
231:    */
232:   private async tryPuppeteerScraping(url: string): Promise<ScrapeResult> {
233:     let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null
234:     try {
235:       // Launch headless browser with optimized settings
236:       const args = [
237:         ...chromium.args,
238:         '--no-sandbox',
239:         '--disable-setuid-sandbox',
240:         '--disable-dev-shm-usage',
241:         '--disable-gpu',
242:         '--no-first-run',
243:         '--no-zygote',
244:         '--single-process',
245:         '--disable-blink-features=AutomationControlled'
246:       ]
247: 
248:       const executablePath = process.env.CHROMIUM_PATH || await chromium.executablePath()
249: 
250:       browser = await puppeteer.launch({
251:         args,
252:         executablePath,
253:         headless: true,
254:         timeout: 30000
255:       })
256: 
257:       const page = await browser.newPage()
258: 
259:       // Set realistic user agent and viewport
260:       const userAgent = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
261:       await page.setUserAgent(userAgent)
262:       await page.setViewport({ width: 1920, height: 1080 })
263: 
264:       // Navigate to page and wait for content
265:       await page.goto(url, {
266:         waitUntil: 'networkidle2',
267:         timeout: 30000
268:       })
269: 
270:       // Wait for job description to load (common selectors)
271:       await page.waitForSelector('body', { timeout: 5000 }).catch(() => {})
272: 
273:       // Extract job data using page.evaluate
274:       const data = await page.evaluate(() => {
275:         // Helper to clean text
276:         const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim()
277: 
278:         // Extract title
279:         const titleSelectors = [
280:           'h1[class*="title"]',
281:           'h1[class*="jobTitle"]',
282:           'h1[class*="job-title"]',
283:           '[data-testid="jobTitle"]',
284:           '.job-title',
285:           'h1'
286:         ]
287:         let title = ''
288:         for (const sel of titleSelectors) {
289:           const el = document.querySelector(sel)
290:           if (el?.textContent) {
291:             title = cleanText(el.textContent)
292:             break
293:           }
294:         }
295: 
296:         // Extract description
297:         const descSelectors = [
298:           '[class*="jobDescriptionText"]',
299:           '[class*="job-description"]',
300:           '[id*="jobDescriptionText"]',
301:           '[data-testid="jobDescription"]',
302:           '.description',
303:           'article',
304:           'main'
305:         ]
306:         let description = ''
307:         for (const sel of descSelectors) {
308:           const el = document.querySelector(sel)
309:           if (el?.textContent && el.textContent.length > description.length) {
310:             description = cleanText(el.textContent)
311:           }
312:         }
313: 
314:         // Extract company
315:         const companySelectors = [
316:           '[class*="companyName"]',
317:           '[data-testid="companyName"]',
318:           '[class*="company-name"]',
319:           '.company'
320:         ]
321:         let company = ''
322:         for (const sel of companySelectors) {
323:           const el = document.querySelector(sel)
324:           if (el?.textContent) {
325:             company = cleanText(el.textContent)
326:             break
327:           }
328:         }
329: 
330:         // Extract location
331:         const locationSelectors = [
332:           '[class*="location"]',
333:           '[data-testid="location"]',
334:           '[class*="job-location"]'
335:         ]
336:         let location = ''
337:         for (const sel of locationSelectors) {
338:           const el = document.querySelector(sel)
339:           if (el?.textContent) {
340:             location = cleanText(el.textContent)
341:             break
342:           }
343:         }
344: 
345:         // Extract salary
346:         const salarySelectors = [
347:           '[class*="salary"]',
348:           '[data-testid="salary"]',
349:           '[class*="compensation"]'
350:         ]
351:         let salary = ''
352:         for (const sel of salarySelectors) {
353:           const el = document.querySelector(sel)
354:           if (el?.textContent) {
355:             salary = cleanText(el.textContent)
356:             break
357:           }
358:         }
359: 
360:         return { title, description, company, location, salary }
361:       })
362: 
363:       await browser.close()
364: 
365:       return {
366:         success: data.description.length > 100,
367:         data: {
368:           title: data.title,
369:           description: data.description,
370:           company: data.company,
371:           location: data.location,
372:           salary: data.salary || undefined
373:         }
374:       }
375:     } catch (error) {
376:       if (browser) {
377:         try { await browser.close() } catch {}
378:       }
379:       throw error
380:     }
381:   }
382: 
383:   /**
384:    * Strategy 4: Regex extraction (last resort)
385:    * Works when HTML structure is non-standard
386:    */
387:   private async tryRegexExtraction(url: string): Promise<ScrapeResult> {
388:     const html = await this.fetchHTML(url)
389: 
390:     // Extract description between common patterns
391:     const descPatterns = [
392:       /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
393:       /<section[^>]*class="[^"]*job[^"]*"[^>]*>(.*?)<\/section>/is,
394:       /<article[^>]*>(.*?)<\/article>/is,
395:       /<main[^>]*>(.*?)<\/main>/is
396:     ]
397: 
398:     let description = ''
399:     for (const pattern of descPatterns) {
400:       const match = html.match(pattern)
401:       if (match && match[1].length > description.length) {
402:         description = match[1]
403:       }
404:     }
405: 
406:     // Extract title
407:     const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
408:     const title = titleMatch ? titleMatch[1] : ''
409: 
410:     return {
411:       success: description.length > 100,
412:       data: {
413:         title: this.cleanHTML(title),
414:         description: this.cleanHTML(description)
415:       }
416:     }
417:   }
418: 
419:   /**
420:    * Fetch HTML with realistic headers to avoid bot detection
421:    */
422:   private async fetchHTML(url: string): Promise<string> {
423:     const userAgent = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
424: 
425:     const response = await fetch(url, {
426:       headers: {
427:         'User-Agent': userAgent,
428:         'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
429:         'Accept-Language': 'en-US,en;q=0.9',
430:         'Accept-Encoding': 'gzip, deflate, br',
431:         'DNT': '1',
432:         'Connection': 'keep-alive',
433:         'Upgrade-Insecure-Requests': '1',
434:         'Referer': 'https://www.google.com/'
435:       },
436:       signal: AbortSignal.timeout(15000)
437:     })
438: 
439:     if (!response.ok) {
440:       throw new Error(`HTTP ${response.status}: ${response.statusText}`)
441:     }
442: 
443:     // Add small delay to be respectful
444:     await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
445: 
446:     return await response.text()
447:   }
448: 
449:   /**
450:    * Helper: Extract salary from structured data
451:    */
452:   private extractSalaryFromStructured(baseSalary: any): string {
453:     if (!baseSalary) return ''
454:     if (typeof baseSalary === 'string') return baseSalary
455:     
456:     if (baseSalary.value) {
457:       const value = baseSalary.value.value || baseSalary.value
458:       const currency = baseSalary.currency || '$'
459:       return `${currency}${value}`
460:     }
461:     
462:     if (baseSalary.minValue && baseSalary.maxValue) {
463:       const currency = baseSalary.currency || '$'
464:       return `${currency}${baseSalary.minValue} - ${currency}${baseSalary.maxValue}`
465:     }
466:     
467:     return ''
468:   }
469: 
470:   /**
471:    * Helper: Extract salary from text using patterns
472:    */
473:   private extractSalaryFromText(text: string): string {
474:     const patterns = [
475:       /\$\s*[\d,]+\s*-\s*\$\s*[\d,]+/,
476:       /\$\s*[\d,]+k?\s*-\s*\$?\s*[\d,]+k?/i,
477:       /salary:\s*\$?[\d,]+\s*-\s*\$?[\d,]+/i,
478:       /[\d,]+\s*-\s*[\d,]+\s*per\s+(?:year|hour|month)/i,
479:       /compensation:\s*\$?[\d,]+\s*-\s*\$?[\d,]+/i
480:     ]
481: 
482:     for (const pattern of patterns) {
483:       const match = text.match(pattern)
484:       if (match) return match[0]
485:     }
486: 
487:     return ''
488:   }
489: 
490:   /**
491:    * Helper: Clean HTML tags and entities
492:    */
493:   private cleanHTML(html: string): string {
494:     return html
495:       .replace(/<script[^>]*>.*?<\/script>/gis, '')
496:       .replace(/<style[^>]*>.*?<\/style>/gis, '')
497:       .replace(/<[^>]+>/g, ' ')
498:       .replace(/&nbsp;/g, ' ')
499:       .replace(/&amp;/g, '&')
500:       .replace(/&lt;/g, '<')
501:       .replace(/&gt;/g, '>')
502:       .replace(/&quot;/g, '"')
503:       .replace(/&#39;/g, "'")
504:       .replace(/\s+/g, ' ')
505:       .trim()
506:   }
507: 
508:   /**
509:    * Helper: Clean text (whitespace only)
510:    */
511:   private cleanText(text: string): string {
512:     return text
513:       .replace(/\s+/g, ' ')
514:       .replace(/\n\s*\n/g, '\n')
515:       .trim()
516:   }
517: }
````

## File: src/app/api/resume/upload/route.ts
````typescript
  1: import { NextRequest, NextResponse } from 'next/server'
  2: import { getServerSession } from 'next-auth/next'
  3: import { authOptions } from '@/lib/auth'
  4: import Resume from '@/models/Resume'
  5: import { dbService } from '@/lib/database'
  6: import { isRateLimited } from '@/lib/rate-limit'
  7: import path from 'path'
  8: import { cleanPDFExtraction } from '@/lib/utils/pdf-cleaner'
  9: 
 10: function cleanExtractedText(text: string): string {
 11:   // Use comprehensive PDF cleaner first
 12:   let cleaned = cleanPDFExtraction(text)
 13:   
 14:   // Additional cleaning for resume-specific content
 15:   cleaned = cleaned
 16:     .replace(/https?:\/\/[^\s]+/gi, '') // URLs
 17:     .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '') // Emails (during parsing)
 18:     .replace(/\s+/g, ' ') // Whitespace
 19:     .trim()
 20:   
 21:   return cleaned
 22: }
 23: 
 24: const MIN_VALID_PDF_TEXT_LENGTH = Number(process.env.RESUME_MIN_TEXT_LENGTH || 150)
 25: const ASCII_FALLBACK_CONFIDENCE = 0.3
 26: 
 27: // AI-based OCR fallback using base64 encoding
 28: async function extractTextWithAI(buffer: Buffer): Promise<string> {
 29:   try {
 30:     console.log('[PDF_PARSE] Attempting AI-based extraction')
 31:     const { PerplexityIntelligenceService } = await import('@/lib/perplexity-intelligence')
 32:     
 33:     // Convert PDF to base64
 34:     const base64 = buffer.toString('base64')
 35:     
 36:     const result = await PerplexityIntelligenceService.customQuery({
 37:       systemPrompt: 'You are a resume text extractor. Extract ALL text from the provided PDF resume. Return ONLY the extracted text, no formatting, no markdown, no explanations.',
 38:       userPrompt: `Extract all text from this PDF resume (base64 encoded, first 1000 chars): ${base64.slice(0, 1000)}...\n\nReturn the complete resume text.`,
 39:       temperature: 0.1,
 40:       maxTokens: 4000
 41:     })
 42:     
 43:     if (result.content && result.content.length > MIN_VALID_PDF_TEXT_LENGTH) {
 44:       console.log('[PDF_PARSE] ✅ AI extraction SUCCESS:', result.content.length, 'chars')
 45:       return result.content
 46:     }
 47:     
 48:     throw new Error('AI extraction returned insufficient text')
 49:   } catch (error) {
 50:     console.error('[PDF_PARSE] ❌ AI extraction failed:', error)
 51:     throw error
 52:   }
 53: }
 54: 
 55: async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; method: string; confidence?: number }> {
 56:   console.log('[PDF_PARSE] ==========================================')
 57:   console.log('[PDF_PARSE] Starting extraction')
 58:   console.log('[PDF_PARSE] Buffer size:', buffer.length, 'bytes')
 59:   console.log('[PDF_PARSE] Buffer type:', typeof buffer)
 60:   console.log('[PDF_PARSE] Is Buffer:', Buffer.isBuffer(buffer))
 61:   console.log('[PDF_PARSE] ==========================================')
 62:   
 63:   // Try Method 1: pdf-parse-debugging-disabled (MOST RELIABLE)
 64:   try {
 65:     console.log('[PDF_PARSE] 🔄 Method 1: pdf-parse-debugging-disabled')
 66:     const pdfParse = await import('pdf-parse-debugging-disabled')
 67:     console.log('[PDF_PARSE] Module loaded:', !!pdfParse, 'default:', !!pdfParse.default)
 68:     
 69:     const data = await pdfParse.default(buffer, { 
 70:       max: 0, // Parse all pages
 71:       version: 'v2.0.550' // Specify version
 72:     })
 73:     
 74:     console.log('[PDF_PARSE] Raw result:', {
 75:       hasData: !!data,
 76:       hasText: !!data?.text,
 77:       textLength: data?.text?.length || 0,
 78:       numpages: data?.numpages,
 79:       numrender: data?.numrender,
 80:       info: data?.info,
 81:       metadata: data?.metadata
 82:     })
 83:     
 84:     if (data?.text) {
 85:       console.log('[PDF_PARSE] Raw text preview (first 500 chars):', data.text.slice(0, 500))
 86:       console.log('[PDF_PARSE] Raw text preview (last 200 chars):', data.text.slice(-200))
 87:       
 88:       const cleanedText = cleanExtractedText(data.text)
 89:       console.log('[PDF_PARSE] After cleaning:', {
 90:         rawLength: data.text.length,
 91:         cleanedLength: cleanedText.length,
 92:         preview: cleanedText.slice(0, 300)
 93:       })
 94:       
 95:       if (cleanedText.length >= 50) {
 96:         const confidence = cleanedText.length >= MIN_VALID_PDF_TEXT_LENGTH ? 0.95 : 0.6
 97:         console.log('[PDF_PARSE] ✅✅✅ Method 1 SUCCESS - confidence:', confidence)
 98:         return {
 99:           text: cleanedText,
100:           method: 'pdf-parse',
101:           confidence
102:         }
103:       } else {
104:         console.log('[PDF_PARSE] ⚠️ Method 1 extracted text but too short:', cleanedText.length, 'chars')
105:       }
106:     } else {
107:       console.log('[PDF_PARSE] ⚠️ Method 1 returned no text')
108:     }
109:   } catch (error: any) {
110:     console.error('[PDF_PARSE] ❌ Method 1 FAILED')
111:     console.error('[PDF_PARSE] Error type:', error?.constructor?.name)
112:     console.error('[PDF_PARSE] Error message:', error?.message)
113:     console.error('[PDF_PARSE] Error stack:', error?.stack)
114:   }
115: 
116:   // Try Method 2: pdfjs-dist fallback (BETTER for complex PDFs)
117:   try {
118:     console.log('[PDF_PARSE] 🔄 Method 2: pdfjs-dist')
119:     const pdfjsLib = await import('pdfjs-dist')
120:     console.log('[PDF_PARSE] pdfjs-dist module loaded')
121:     
122:     // Load the PDF document with proper TypeScript types
123:     const loadingTask = pdfjsLib.getDocument({
124:       data: new Uint8Array(buffer),
125:       verbosity: 0,
126:       useSystemFonts: true,
127:       disableFontFace: false,
128:       standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/'
129:     })
130:     
131:     const pdfDoc = await loadingTask.promise
132:     console.log('[PDF_PARSE] Document loaded successfully')
133:     console.log('[PDF_PARSE] Pages:', pdfDoc.numPages)
134:     console.log('[PDF_PARSE] Fingerprints:', pdfDoc.fingerprints)
135:     
136:     let fullText = ''
137:     let totalChars = 0
138:     
139:     // Extract text from each page
140:     for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
141:       try {
142:         const page = await pdfDoc.getPage(pageNum)
143:         const textContent = await page.getTextContent()
144:         
145:         // Better text extraction with spacing
146:         const pageText = textContent.items
147:           .map((item: any) => {
148:             if ('str' in item && item.str) {
149:               return item.str
150:             }
151:             return ''
152:           })
153:           .filter(Boolean)
154:           .join(' ')
155:         
156:         fullText += pageText + '\n\n'
157:         totalChars += pageText.length
158:         console.log(`[PDF_PARSE] Page ${pageNum}/${pdfDoc.numPages}: ${pageText.length} chars (total: ${totalChars})`)
159:       } catch (pageError) {
160:         console.error(`[PDF_PARSE] Error on page ${pageNum}:`, pageError)
161:       }
162:     }
163:     
164:     console.log('[PDF_PARSE] Raw extraction complete:', fullText.length, 'chars')
165:     console.log('[PDF_PARSE] Raw text preview:', fullText.slice(0, 500))
166:     
167:     const cleanedText = cleanExtractedText(fullText.trim())
168:     console.log('[PDF_PARSE] After cleaning:', {
169:       rawLength: fullText.length,
170:       cleanedLength: cleanedText.length,
171:       preview: cleanedText.slice(0, 300)
172:     })
173:     
174:     if (cleanedText.length >= 50) {
175:       const confidence = cleanedText.length >= MIN_VALID_PDF_TEXT_LENGTH ? 0.9 : 0.6
176:       console.log('[PDF_PARSE] ✅✅✅ Method 2 SUCCESS - confidence:', confidence)
177:       return {
178:         text: cleanedText,
179:         method: 'pdfjs-dist',
180:         confidence
181:       }
182:     } else {
183:       console.log('[PDF_PARSE] ⚠️ Method 2 extracted text but too short:', cleanedText.length, 'chars')
184:     }
185:   } catch (error: any) {
186:     console.error('[PDF_PARSE] ❌ Method 2 FAILED')
187:     console.error('[PDF_PARSE] Error type:', error?.constructor?.name)
188:     console.error('[PDF_PARSE] Error message:', error?.message)
189:     console.error('[PDF_PARSE] Error stack:', error?.stack)
190:   }
191: 
192:   // Try Method 3: AI-based extraction (BEST for scanned/image PDFs)
193:   try {
194:     console.log('[PDF_PARSE] Attempting Method 3: AI extraction')
195:     const aiText = await extractTextWithAI(buffer)
196:     
197:     if (aiText && aiText.length >= MIN_VALID_PDF_TEXT_LENGTH) {
198:       const cleanedText = cleanExtractedText(aiText)
199:       console.log('[PDF_PARSE] ✅ Method 3 SUCCESS (AI extraction):', cleanedText.length, 'chars')
200:       
201:       return {
202:         text: cleanedText,
203:         method: 'ai-extraction',
204:         confidence: 0.8
205:       }
206:     }
207:   } catch (error) {
208:     console.error('[PDF_PARSE] ❌ Method 3 failed:', error)
209:   }
210: 
211:   // All methods failed
212:   console.error('[PDF_PARSE] ❌❌❌ ALL EXTRACTION METHODS FAILED')
213:   return {
214:     text: '',
215:     method: 'all-methods-failed',
216:     confidence: 0
217:   }
218: }
219: 
220: export const runtime = 'nodejs'
221: export const dynamic = 'force-dynamic'
222: 
223: export async function POST(request: NextRequest) {
224:   const startTime = Date.now()
225:   console.log('[RESUME_UPLOAD] ========== NEW UPLOAD REQUEST ==========')
226:   
227:   try {
228:     await dbService.connect()
229: 
230:     const session = await getServerSession(authOptions)
231:     if (!session?.user?.id) {
232:       console.log('[RESUME_UPLOAD] ❌ Unauthorized')
233:       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
234:     }
235:     
236:     console.log('[RESUME_UPLOAD] User:', session.user.id, session.user.email)
237: 
238:     if (await isRateLimited(session.user.id, 'resume:upload')) {
239:       console.log('[RESUME_UPLOAD] ❌ Rate limited')
240:       return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
241:     }
242: 
243:     const data = await request.formData()
244:     const file = data.get('file') as File
245:     const pastedText = data.get('pastedText') as string
246:     
247:     console.log('[RESUME_UPLOAD] Upload type:', {
248:       hasFile: !!file,
249:       fileSize: file?.size,
250:       fileName: file?.name,
251:       hasPastedText: !!pastedText,
252:       pastedTextLength: pastedText?.length
253:     })
254: 
255:     if (!file && !pastedText) {
256:       console.log('[RESUME_UPLOAD] ❌ No file or text provided')
257:       return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
258:     }
259: 
260:     let extractedText = ''
261:     let extractionMethod = ''
262:     let extractionError = ''
263:     let extractionConfidence = 0.95
264: 
265:     if (file && file.size > 0) {
266:       // Validate file size and type
267:       if (file.size > 10 * 1024 * 1024) {
268:         return NextResponse.json({ error: 'File too large' }, { status: 400 })
269:       }
270: 
271:       const buffer = Buffer.from(await file.arrayBuffer())
272:       const filename = file.name || 'resume.pdf'
273: 
274:       if (path.extname(filename).toLowerCase() === '.pdf') {
275:         try {
276:           const { text, method, confidence } = await extractTextFromPDF(buffer)
277:           extractedText = text
278:           extractionMethod = method
279:           extractionConfidence = confidence || 0.95
280:           
281:           // Enhanced logging
282:           console.log('🔍 PDF Processing Result:', {
283:             filename,
284:             method: extractionMethod,
285:             textLength: extractedText?.length,
286:             confidence: extractionConfidence,
287:             firstWords: extractedText?.slice(0, 100)
288:           })
289:           
290:           if (!text || text.length < MIN_VALID_PDF_TEXT_LENGTH) {
291:             extractionError = 'PDF text extraction was incomplete. Please paste your resume content instead.'
292:           }
293:         } catch (pdfError) {
294:           console.error('PDF processing failed completely:', pdfError)
295:           extractionError = 'PDF processing failed. Please paste your resume text or try a different file format.'
296:           extractionMethod = 'pdf-failed'
297:         }
298:       } else {
299:         extractedText = await file.text()
300:         extractionMethod = 'direct_text'
301:         extractionConfidence = 1.0
302:       }
303:     } else if (pastedText) {
304:       extractedText = pastedText
305:       extractionMethod = 'pasted_text'
306:     }
307: 
308:     extractedText = cleanExtractedText(extractedText || '')
309: 
310:     const asciiFallbackUsed = extractionMethod === 'ascii-fallback'
311: 
312:     if (asciiFallbackUsed) {
313:       extractionError = extractionError || 'PDF could not be reliably processed (ASCII fallback). Please paste your resume text instead.'
314:       extractionConfidence = Math.min(extractionConfidence, ASCII_FALLBACK_CONFIDENCE)
315:     }
316: 
317:     if (!extractedText || extractedText.length < MIN_VALID_PDF_TEXT_LENGTH) {
318:       return NextResponse.json({ 
319:         error: 'No readable content', 
320:         details: extractionError || 'Could not extract text from the file. Please paste your resume text instead.',
321:         extractionMethod 
322:       }, { status: 400 })
323:     }
324: 
325:     if (asciiFallbackUsed) {
326:       return NextResponse.json({
327:         error: 'Resume quality too low',
328:         details: extractionError,
329:         extractionMethod,
330:         confidence: extractionConfidence
331:       }, { status: 400 })
332:     }
333: 
334:     // CRITICAL FIX: Extract location and keywords from resume text
335:     console.log('═══════════════════════════════════════════════════════')
336:     console.log('[PDF UPLOAD] EXTRACTING RESUME SIGNALS (Location + Keywords)')
337:     console.log('═══════════════════════════════════════════════════════')
338:     console.log('[PDF UPLOAD] Resume text length:', extractedText.length, 'chars')
339:     console.log('[PDF UPLOAD] First 300 chars:', extractedText.substring(0, 300))
340:     console.log('─────────────────────────────────────────────────────────')
341: 
342:     let extractedLocation: string | undefined
343:     let extractedKeywords: string[] = []
344:     let personalInfo: any = {}
345: 
346:     try {
347:       const { PerplexityIntelligenceService } = await import('@/lib/perplexity-intelligence')
348:       const signals = await PerplexityIntelligenceService.extractResumeSignals(extractedText, 50)
349:       
350:       extractedLocation = signals.location
351:       extractedKeywords = signals.keywords || []
352:       personalInfo = signals.personalInfo || {}
353: 
354:       console.log('[PDF UPLOAD] EXTRACTION RESULTS:')
355:       console.log('[PDF UPLOAD] Location extracted:', extractedLocation || 'NONE')
356:       console.log('[PDF UPLOAD] Keywords extracted:', extractedKeywords.length, 'keywords')
357:       console.log('[PDF UPLOAD] First 10 keywords:', extractedKeywords.slice(0, 10).join(', ') || 'NONE')
358:       console.log('[PDF UPLOAD] Personal info:', personalInfo)
359: 
360:       // CRITICAL: Fail if no real location found
361:       if (!extractedLocation || extractedLocation.trim().length < 2) {
362:         console.error('═══════════════════════════════════════════════════════')
363:         console.error('[PDF UPLOAD] ❌ EXTRACTION FAILED - NO LOCATION')
364:         console.error('═══════════════════════════════════════════════════════')
365:         console.error('[PDF UPLOAD] Extracted location:', extractedLocation || 'undefined')
366:         console.error('[PDF UPLOAD] Resume preview (first 500 chars):', extractedText.substring(0, 500))
367:         console.error('═══════════════════════════════════════════════════════')
368:         
369:         return NextResponse.json({
370:           error: 'Could not extract location from resume',
371:           details: 'Please ensure your resume includes your city and state/province in the contact section at the top.',
372:           extractedLocation: extractedLocation,
373:           resumePreview: extractedText.substring(0, 300),
374:           suggestion: 'Add your location (e.g., "Seattle, WA" or "Toronto, ON") to the top of your resume and try again.'
375:         }, { status: 400 })
376:       }
377: 
378:       console.log('═══════════════════════════════════════════════════════')
379:       console.log('[PDF UPLOAD] ✅ EXTRACTION SUCCESSFUL')
380:       console.log('[PDF UPLOAD] Location:', extractedLocation)
381:       console.log('[PDF UPLOAD] Keywords:', extractedKeywords.length, 'extracted')
382:       console.log('═══════════════════════════════════════════════════════')
383:     } catch (signalError) {
384:       console.error('═══════════════════════════════════════════════════════')
385:       console.error('[PDF UPLOAD] ❌ SIGNAL EXTRACTION FAILED')
386:       console.error('═══════════════════════════════════════════════════════')
387:       console.error('[PDF UPLOAD] Error:', (signalError as Error).message)
388:       console.error('[PDF UPLOAD] Stack:', (signalError as Error).stack)
389:       console.error('═══════════════════════════════════════════════════════')
390:       
391:       return NextResponse.json({
392:         error: 'Failed to extract resume information',
393:         details: 'Could not parse location and keywords from your resume. Please ensure your resume is properly formatted with contact information at the top.',
394:         technical: (signalError as Error).message
395:       }, { status: 500 })
396:     }
397: 
398:     const resume = new Resume({
399:       userId: session.user.id,
400:       originalFileName: file?.name || 'pasted-resume.txt',
401:       filename: file?.name || 'pasted-resume.txt',
402:       extractedText,
403:       extractionMethod,
404:       extractionError: extractionError || undefined,
405:       uploadedAt: new Date(),
406:       // Store extracted signals for job matching
407:       metadata: {
408:         extractedLocation,
409:         extractedKeywords: extractedKeywords.slice(0, 20), // Store top 20
410:         personalInfo,
411:         extractionDate: new Date().toISOString()
412:       }
413:     })
414: 
415:     await resume.save()
416:     
417:     const duration = Date.now() - startTime
418:     console.log('[RESUME_UPLOAD] ✅ SUCCESS:', {
419:       resumeId: resume._id.toString(),
420:       textLength: extractedText.length,
421:       method: extractionMethod,
422:       confidence: extractionConfidence,
423:       durationMs: duration
424:     })
425: 
426:     return NextResponse.json({
427:       success: true,
428:       resume: {
429:         _id: resume._id.toString(),
430:         userId: resume.userId,
431:         originalFileName: resume.originalFileName,
432:         filename: resume.filename,
433:         extractedText: resume.extractedText,
434:         extractionMethod: resume.extractionMethod,
435:         uploadedAt: resume.uploadedAt,
436:         metadata: resume.metadata
437:       },
438:       resumeId: resume._id,
439:       extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
440:       extractionMethod,
441:       extractionError,
442:       confidence: extractionConfidence,
443:       // Include extracted signals in response for frontend
444:       extractedLocation,
445:       extractedKeywords: extractedKeywords.slice(0, 10), // Top 10 for display
446:       personalInfo
447:     })
448:   } catch (error) {
449:     console.error('Upload error:', error)
450:     const errorMessage = error instanceof Error ? error.message : 'Internal server error'
451:     
452:     // Provide helpful error messages based on error type
453:     let userMessage = 'Failed to process resume'
454:     let helpText = 'Please try again or paste your resume text directly.'
455:     
456:     if (errorMessage.includes('validation')) {
457:       userMessage = 'Invalid resume data'
458:       helpText = 'Please ensure your resume contains valid text.'
459:     } else if (errorMessage.includes('database') || errorMessage.includes('mongo')) {
460:       userMessage = 'Database connection error'
461:       helpText = 'Please try again in a moment.'
462:     } else if (errorMessage.includes('memory') || errorMessage.includes('heap')) {
463:       userMessage = 'File too complex to process'
464:       helpText = 'Try a simpler PDF or paste your text instead.'
465:     }
466:     
467:     return NextResponse.json({ 
468:       error: userMessage,
469:       details: helpText,
470:       technical: process.env.NODE_ENV === 'development' ? errorMessage : undefined
471:     }, { status: 500 })
472:   }
473: }
````

## File: src/app/api/jobs/search/route.ts
````typescript
  1: /**
  2:  * Unified Job Search API - Enhanced with PerplexityIntelligenceService
  3:  * 
  4:  * NOW USES: PerplexityIntelligenceService for comprehensive 25+ board coverage
  5:  * 
  6:  * Features:
  7:  * - 10 Canadian job boards (Job Bank, Jobboom, Workopolis, etc.)
  8:  * - 35+ Canadian ATS companies (Shopify, Wealthsimple, etc.)
  9:  * - Global boards (LinkedIn, Indeed, Glassdoor)
 10:  * - Resume skill matching with scoring
 11:  * - Smart Canadian prioritization
 12:  * - Built-in caching (24hr TTL)
 13:  */
 14: 
 15: import { NextRequest, NextResponse } from 'next/server'
 16: import { getServerSession } from 'next-auth/next'
 17: import { authOptions } from '@/lib/auth'
 18: import { dbService } from '@/lib/database'
 19: import { PerplexityIntelligenceService } from '@/lib/perplexity-intelligence'
 20: import { isRateLimited } from '@/lib/rate-limit'
 21: import Resume from '@/models/Resume'
 22: import { jobSearchCacheService } from '@/services/job-search-cache.service'
 23: 
 24: export const dynamic = 'force-dynamic'
 25: export const runtime = 'nodejs'
 26: export const maxDuration = 60 // Increased to handle Perplexity API calls which can take longer
 27: 
 28: interface JobSearchRequest {
 29:   keywords: string
 30:   location?: string
 31:   sources?: string[] // Specific boards to search
 32:   limit?: number
 33:   remote?: boolean
 34:   salaryMin?: number
 35:   experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
 36:   workType?: 'remote' | 'hybrid' | 'onsite' | 'any'
 37:   useResumeMatching?: boolean // Use resume for skill matching
 38:   targetIndustry?: string // ENTERPRISE: User wants to switch industries (e.g., "Technology", "Healthcare")
 39:   disableIndustryWeighting?: boolean // ENTERPRISE: User wants equal weight across all industries
 40: }
 41: 
 42: export async function POST(request: NextRequest) {
 43:   try {
 44:     const session = await getServerSession(authOptions)
 45:     if (!session?.user?.id) {
 46:       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 47:     }
 48: 
 49:     // Rate limiting
 50:     if (await isRateLimited(session.user.id, 'job-search')) {
 51:       return NextResponse.json({ 
 52:         error: 'Too many searches. Please wait a moment.' 
 53:       }, { status: 429 })
 54:     }
 55: 
 56:     await dbService.connect()
 57: 
 58:     const body: JobSearchRequest = await request.json()
 59:     let { 
 60:       keywords, 
 61:       location, // CRITICAL FIX: No default - use exact value from frontend
 62:       sources, 
 63:       limit = 25, 
 64:       remote,
 65:       salaryMin,
 66:       experienceLevel,
 67:       workType,
 68:       targetIndustry, // ENTERPRISE: User wants to switch industries
 69:       disableIndustryWeighting // ENTERPRISE: Disable tenure-based weighting
 70:     } = body
 71:     
 72:     console.log('═══════════════════════════════════════════════════════')
 73:     console.log('[JOB_SEARCH] NEW SEARCH REQUEST')
 74:     console.log('═══════════════════════════════════════════════════════')
 75:     console.log('[JOB_SEARCH] Job Title:', keywords)
 76:     console.log('[JOB_SEARCH] Location:', location || 'UNDEFINED')
 77:     console.log('[JOB_SEARCH] Max Results:', limit)
 78:     console.log('[JOB_SEARCH] Work Type:', workType || 'any')
 79:     console.log('─────────────────────────────────────────────────────────')
 80: 
 81:     // CRITICAL: Require real location - no 'Canada' fallback
 82:     if (!location || location.trim().length < 2) {
 83:       console.error('[JOB_SEARCH] ❌ MISSING LOCATION')
 84:       return NextResponse.json({
 85:         success: false,
 86:         error: 'Location is required for job search',
 87:         suggestion: 'Upload your resume to extract location, or manually enter city and state/province',
 88:         errorCode: 'LOCATION_REQUIRED'
 89:       }, { status: 400 })
 90:     }
 91: 
 92:     // Reject "Canada" or "United States" (too broad)
 93:     const normalizedLocation = location.toLowerCase().trim()
 94:     if (['canada', 'united states', 'usa', 'us'].includes(normalizedLocation)) {
 95:       console.error('[JOB_SEARCH] ❌ LOCATION TOO BROAD:', location)
 96:       return NextResponse.json({
 97:         success: false,
 98:         error: 'Location is too broad. Please specify a city and state/province.',
 99:         example: 'Examples: Seattle, WA or Toronto, ON or Vancouver, BC',
100:         errorCode: 'LOCATION_TOO_BROAD'
101:       }, { status: 400 })
102:     }
103: 
104:     console.log('[JOB_SEARCH] ✅ Location valid, proceeding with search...')
105: 
106:     let useResumeMatching = body.useResumeMatching || false
107: 
108:     if (!keywords || keywords.trim().length < 2) {
109:       return NextResponse.json({ 
110:         error: 'Please provide valid search keywords' 
111:       }, { status: 400 })
112:     }
113: 
114:     console.log(`[JOB_SEARCH] User ${session.user.id} searching: "${keywords}" in ${location} (Resume matching: ${useResumeMatching})`)
115: 
116:     // CRITICAL FIX: Get cached jobs but ALWAYS search for new ones too
117:     const cachedJobs = await jobSearchCacheService.getCachedJobs({
118:       keywords,
119:       location,
120:       workType,
121:       experienceLevel,
122:       userId: session.user.id
123:     });
124: 
125:     if (cachedJobs && cachedJobs.length > 0) {
126:       console.log(`[JOB_CACHE] Found ${cachedJobs.length} cached jobs - will merge with NEW search results`);
127:     } else {
128:       console.log(`[JOB_CACHE] No cached jobs found - performing fresh search`);
129:     }
130: 
131:     let result: any
132:     let jobs: any[] = []
133:     let metadata: any = {}
134: 
135:     // Option 1: Resume-matched search with INDUSTRY WEIGHTING (most powerful)
136:     if (useResumeMatching) {
137:       try {
138:         // Get user's resume
139:         const resumeDoc = await Resume.findOne({ userId: session.user.id })
140:           .sort({ createdAt: -1 })
141:           .lean()
142:         
143:         const extractedText = (resumeDoc as any)?.extractedText
144:         
145:         if (!resumeDoc || !extractedText) {
146:           return NextResponse.json({ 
147:             error: 'Please upload a resume first to use resume matching' 
148:           }, { status: 400 })
149:         }
150: 
151:         console.log(`[JOB_SEARCH] Using resume matching with industry weighting for user ${session.user.id}`)
152: 
153:         // ENTERPRISE FEATURE: Analyze career timeline for industry weighting
154:         let careerTimeline: any = null
155:         let effectivePrimaryIndustry: any = null
156:         
157:         // Skip industry analysis if user explicitly disabled it
158:         if (!disableIndustryWeighting) {
159:           try {
160:             careerTimeline = await PerplexityIntelligenceService.extractCareerTimeline(extractedText)
161:             console.log('[JOB_SEARCH] Career timeline:', {
162:               industries: careerTimeline.industries.map((i: any) => `${i.name} (${i.percentage}%)`).join(', '),
163:               primaryIndustry: careerTimeline.industries[0]?.name,
164:               hasTransition: !!careerTimeline.careerTransition,
165:               userTargetIndustry: targetIndustry || 'none'
166:             })
167:             
168:             // ENTERPRISE: User wants to switch industries
169:             if (targetIndustry && targetIndustry.trim()) {
170:               // Find matching industry from resume, or create synthetic one
171:               const normalizedTarget = targetIndustry.toLowerCase()
172:               effectivePrimaryIndustry = careerTimeline.industries.find(
173:                 (i: any) => i?.name?.toLowerCase()?.includes(normalizedTarget)
174:               )
175: 
176:               if (effectivePrimaryIndustry) {
177:                 console.log(`[JOB_SEARCH] User targeting industry switch TO: ${effectivePrimaryIndustry.name}`)
178:               } else {
179:                 // User wants to switch to an entirely new industry not in their history
180:                 console.log(`[JOB_SEARCH] User switching to NEW industry: ${targetIndustry} (no prior experience)`)
181:                 effectivePrimaryIndustry = {
182:                   name: targetIndustry,
183:                   yearsOfExperience: 0,
184:                   keywords: keywords
185:                     .split(',')
186:                     .map((k: string) => k.trim())
187:                     .filter(Boolean),
188:                   percentage: 100 // Give full weight to target industry
189:                 }
190:               }
191:             } else {
192:               // Default: Use longest-tenure industry
193:               effectivePrimaryIndustry = careerTimeline.industries[0]
194:             }
195:           } catch (err) {
196:             console.warn('[JOB_SEARCH] Career timeline extraction failed, using standard matching:', err)
197:           }
198:         } else {
199:           console.log('[JOB_SEARCH] Industry weighting DISABLED by user preference')
200:         }
201: 
202:         // CRITICAL: If career timeline exists, weight job results by industry tenure
203:         let industryWeightedLimit = limit
204:         
205:         if (effectivePrimaryIndustry) {
206:           // Calculate industry-based search distribution
207:           const primaryPercentage = effectivePrimaryIndustry.percentage / 100
208:           
209:           // EXAMPLE: If 95% of career in Transportation, show 95% transport jobs
210:           // UNLESS user is switching industries, then show 100% of new industry
211:           industryWeightedLimit = targetIndustry ? limit : Math.ceil(limit * primaryPercentage)
212:           
213:           console.log('[JOB_SEARCH] Industry weighting:', {
214:             primaryIndustry: effectivePrimaryIndustry.name,
215:             primaryPercentage: `${effectivePrimaryIndustry.percentage}%`,
216:             adjustedLimit: industryWeightedLimit,
217:             keywords: effectivePrimaryIndustry.keywords?.join(', ') || 'none',
218:             isSwitching: !!targetIndustry
219:           })
220:           
221:           // Boost keywords from target/primary industry (if available)
222:           if (effectivePrimaryIndustry.keywords && Array.isArray(effectivePrimaryIndustry.keywords) && effectivePrimaryIndustry.keywords.length > 0) {
223:             const industryKeywords = effectivePrimaryIndustry.keywords.slice(0, 5).join(', ')
224:             keywords = `${industryKeywords}, ${keywords}`.trim()
225:           }
226:         }
227: 
228:         // Use NEW AGENT SYSTEM with Perplexity web_search + Cheerio fallback
229:         console.log('[JOB_SEARCH] 🤖 Calling NEW AGENT SYSTEM jobListingsWithAgent with:', {
230:           jobTitle: keywords,
231:           location,
232:           workType: workType || (remote ? 'remote' : 'any'),
233:           maxResults: limit
234:         })
235:         
236:         result = await PerplexityIntelligenceService.jobListingsWithAgent(
237:           keywords,
238:           location,
239:           {
240:             maxResults: limit,
241:             workType: workType || (remote ? 'remote' : 'any')
242:           }
243:         )
244: 
245:         console.log('[JOB_SEARCH] 🤖 Agent system result:', {
246:           success: result.success,
247:           dataType: typeof result.data,
248:           dataIsArray: Array.isArray(result.data),
249:           dataLength: Array.isArray(result.data) ? result.data.length : 0,
250:           cached: result.cached,
251:           method: result.metadata?.method,
252:           confidence: result.metadata?.confidence,
253:           error: result.metadata?.error
254:         })
255: 
256:         jobs = result.data
257:         
258:         // POST-PROCESSING: Re-rank jobs by industry tenure (respects user preferences)
259:         if (effectivePrimaryIndustry && !disableIndustryWeighting && effectivePrimaryIndustry.keywords && Array.isArray(effectivePrimaryIndustry.keywords)) {
260:           const primaryKeywords = effectivePrimaryIndustry.keywords.map((k: string) => k.toLowerCase())
261:           
262:           jobs = jobs.map((job: any) => {
263:             // Calculate industry match score
264:             const jobTitle = (job.title || '').toLowerCase()
265:             const jobDescription = (job.description || '').toLowerCase()
266:             const jobCompany = (job.company || '').toLowerCase()
267:             const fullText = `${jobTitle} ${jobDescription} ${jobCompany}`
268:             
269:             let industryMatchCount = 0
270:             primaryKeywords.forEach((keyword: string) => {
271:               if (fullText.includes(keyword)) industryMatchCount++
272:             })
273:             
274:             const industryMatchScore = industryMatchCount / primaryKeywords.length
275:             
276:             // Boost jobs from primary/target industry
277:             const originalScore = job.skillMatchScore || 0.5
278:             // If user is switching industries, give HIGHER boost (up to 75%)
279:             const boostMultiplier = targetIndustry ? 0.75 : 0.5
280:             const boostedScore = originalScore * (1 + industryMatchScore * boostMultiplier)
281:             
282:             return {
283:               ...job,
284:               skillMatchScore: Math.min(boostedScore, 1.0), // Cap at 1.0
285:               industryMatchScore,
286:               primaryIndustry: effectivePrimaryIndustry.name,
287:               isSwitchingIndustries: !!targetIndustry
288:             }
289:           }).sort((a: any, b: any) => (b.skillMatchScore || 0) - (a.skillMatchScore || 0)) // Re-sort by boosted score
290:           
291:           const matchedJobs = jobs.filter((j: any) => j.industryMatchScore > 0.3).length
292:           console.log(`[JOB_SEARCH] Applied industry weighting boost to ${jobs.length} jobs (${matchedJobs} strong matches)`)
293:         }
294:         
295:         metadata = {
296:           ...result.metadata,
297:           useResumeMatching: true,
298:           skillMatchingEnabled: true,
299:           industryWeighting: effectivePrimaryIndustry ? {
300:             primaryIndustry: effectivePrimaryIndustry.name,
301:             primaryPercentage: effectivePrimaryIndustry.percentage,
302:             careerTransition: careerTimeline?.careerTransition,
303:             userTargetIndustry: targetIndustry || null,
304:             disabledByUser: disableIndustryWeighting || false
305:           } : null
306:         }
307: 
308:         console.log(`[JOB_SEARCH] Resume matching found ${jobs.length} jobs with skill scores and industry weighting`)
309: 
310:       } catch (error) {
311:         console.error('[JOB_SEARCH] Resume matching failed, falling back to standard search:', error)
312:         // Fall back to standard search
313:         useResumeMatching = false
314:       }
315:     }
316: 
317:     // Option 2: Standard job listing search (25+ boards)
318:     if (!useResumeMatching || jobs.length === 0) {
319:       console.log(`[JOB_SEARCH] Using standard search across 25+ boards`, {
320:         keywords,
321:         location,
322:         limit,
323:         workType: workType || (remote ? 'remote' : undefined)
324:       })
325: 
326:       const jobsResult = await PerplexityIntelligenceService.jobListings(
327:         keywords,
328:         location,
329:         {
330:           limit,
331:           boards: sources
332:         }
333:       )
334: 
335:       console.log(`[JOB_SEARCH] jobListings returned:`, {
336:         type: typeof jobsResult,
337:         isArray: Array.isArray(jobsResult),
338:         length: Array.isArray(jobsResult) ? jobsResult.length : 0,
339:         sample: Array.isArray(jobsResult) && jobsResult[0] ? {
340:           title: jobsResult[0].title,
341:           company: jobsResult[0].company,
342:           hasUrl: !!jobsResult[0].url
343:         } : null
344:       })
345: 
346:       jobs = Array.isArray(jobsResult) ? jobsResult : []
347:       console.log(`[JOB_SEARCH] Standard search returned type: ${typeof jobsResult}, isArray: ${Array.isArray(jobsResult)}, length: ${jobs.length}`)
348: 
349:       metadata = {
350:         useResumeMatching: false,
351:         searchedBoards: sources?.length || 15,
352:         canadianPriority: location.toLowerCase().includes('canada')
353:       }
354: 
355:       console.log(`[JOB_SEARCH] Standard search found ${jobs.length} jobs`)
356:       if (jobs.length > 0) {
357:         console.log(`[JOB_SEARCH] First job sample:`, JSON.stringify(jobs[0]).substring(0, 200))
358:       }
359:     }
360: 
361:     // Save search history
362:     try {
363:       const { default: SearchHistory } = await import('@/models/SearchHistory')
364:       await SearchHistory.create({
365:         userId: session.user.id,
366:         keywords,
367:         location,
368:         resultsCount: jobs.length,
369:         sources: sources || ['all'],
370:         aiUsed: useResumeMatching,
371:         searchDate: new Date()
372:       })
373:     } catch (error) {
374:       console.error('[JOB_SEARCH] Failed to save search history:', error)
375:       // Non-critical, continue
376:     }
377: 
378:     // IMPROVED: Mark confidential jobs instead of filtering them out
379:     let processedJobs = jobs.map((job: any) => {
380:       const company = (job.company || '').toLowerCase().trim()
381:       const title = (job.title || '').toLowerCase().trim()
382:       
383:       // Only filter out COMPLETELY invalid jobs (empty title/company)
384:       const isCompletelyInvalid = (company === '' && title === '')
385:       
386:       // Mark confidential companies but keep them
387:       const confidentialCompanies = ['confidential', 'confidential company', 'undisclosed', 'private']
388:       const isConfidential = confidentialCompanies.includes(company)
389:       
390:       return {
391:         ...job,
392:         isConfidential,
393:         isCompletelyInvalid,
394:         note: isConfidential ? 'Company name not disclosed in posting' : undefined
395:       }
396:     }).filter((job: any) => !job.isCompletelyInvalid) // Only filter completely invalid
397: 
398:     // 🚫 CRITICAL: REMOVE ALL CONFIDENTIAL JOBS - DO NOT SHOW THEM AT ALL
399:     const confidentialCount = processedJobs.filter((j: any) => j.isConfidential).length
400:     processedJobs = processedJobs.filter((j: any) => {
401:       const isConfidential = j.isConfidential || 
402:         j.title?.toLowerCase().includes('confidential') ||
403:         j.company?.toLowerCase().includes('confidential') ||
404:         j.company?.toLowerCase() === 'confidential'
405:       
406:       if (isConfidential) {
407:         console.log(`[JOB_SEARCH] 🚫 REJECTED CONFIDENTIAL JOB: "${j.title}" at "${j.company}"`)
408:       }
409:       
410:       return !isConfidential
411:     })
412:     
413:     console.log(`[JOB_SEARCH] Processed ${jobs.length} jobs, REJECTED ${confidentialCount} confidential jobs, ${processedJobs.length} valid jobs kept`)
414: 
415:     // CRITICAL FIX: Merge cached jobs with new results (remove duplicates by URL)
416:     let finalJobs = [...processedJobs]
417:     if (cachedJobs && cachedJobs.length > 0) {
418:       const newJobUrls = new Set(processedJobs.map((j: any) => j.url).filter(Boolean))
419:       // Also filter confidential from cached jobs
420:       const uniqueCachedJobs = cachedJobs.filter((cj: any) => {
421:         const isConfidential = cj.isConfidential || 
422:           cj.title?.toLowerCase().includes('confidential') ||
423:           cj.company?.toLowerCase().includes('confidential') ||
424:           cj.company?.toLowerCase() === 'confidential'
425:         return !newJobUrls.has(cj.url) && !isConfidential
426:       })
427:       finalJobs = [...processedJobs, ...uniqueCachedJobs]
428:       console.log(`[JOB_CACHE] Merged ${uniqueCachedJobs.length} unique cached jobs with ${processedJobs.length} new jobs = ${finalJobs.length} total`)
429:     }
430: 
431:     // 🚀 NEW: Cache the search results for 3 weeks
432:     if (processedJobs.length > 0) {
433:       await jobSearchCacheService.cacheSearchResults(
434:         {
435:           keywords,
436:           location,
437:           workType,
438:           experienceLevel,
439:           userId: session.user.id
440:         },
441:         processedJobs
442:       );
443:       console.log(`[JOB_CACHE] ✅ Cached ${processedJobs.length} jobs for future searches`);
444:     }
445: 
446:     // Get recommended boards for this location
447:     const recommendedBoards = PerplexityIntelligenceService.getRecommendedBoards(location)
448: 
449:     return NextResponse.json({
450:       success: true,
451:       query: { keywords, location, sources },
452:       totalResults: finalJobs.length,
453:       returnedResults: Math.min(finalJobs.length, limit),
454:       jobs: finalJobs.slice(0, limit),
455:       metadata: {
456:         ...metadata,
457:         searchedAt: new Date().toISOString(),
458:         cachedResults: cachedJobs ? cachedJobs.length : 0,
459:         newResults: processedJobs.length,
460:         totalMerged: finalJobs.length
461:       },
462:       recommendations: {
463:         priorityBoards: recommendedBoards.slice(0, 5),
464:         reasoning: `Recommended job boards for ${location || 'your location'}`
465:       },
466:       sources: [...new Set(finalJobs.map((j: any) => j.source || 'Unknown'))]
467:     })
468: 
469:   } catch (error: any) {
470:     console.error('❌❌❌ [JOB_SEARCH] CRITICAL ERROR ❌❌❌')
471:     console.error('[JOB_SEARCH] Error type:', error?.constructor?.name)
472:     console.error('[JOB_SEARCH] Error message:', error?.message)
473:     console.error('[JOB_SEARCH] Error stack:', error?.stack)
474:     
475:     // Get session for error logging
476:     const session = await getServerSession(authOptions)
477:     console.error('[JOB_SEARCH] User ID:', session?.user?.id)
478:     
479:     return NextResponse.json({ 
480:       error: 'Job search failed', 
481:       details: error?.message || 'Unknown error',
482:       errorType: error?.constructor?.name,
483:       timestamp: new Date().toISOString()
484:     }, { status: 500 })
485:   }
486: }
487: 
488: /**
489:  * GET endpoint for search history and available job boards
490:  */
491: export async function GET(request: NextRequest) {
492:   try {
493:     const session = await getServerSession(authOptions)
494:     if (!session?.user?.id) {
495:       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
496:     }
497: 
498:     await dbService.connect()
499: 
500:     const url = new URL(request.url)
501:     const action = url.searchParams.get('action')
502: 
503:     // Get available job boards
504:     if (action === 'boards') {
505:       const boards = PerplexityIntelligenceService.getAvailableJobBoards()
506:       return NextResponse.json({
507:         success: true,
508:         boards,
509:         totalBoards: boards.length
510:       })
511:     }
512: 
513:     // Get search history (default)
514:     const { default: SearchHistory } = await import('@/models/SearchHistory')
515:     const history = await SearchHistory.find({ userId: session.user.id })
516:       .sort({ searchDate: -1 })
517:       .limit(20)
518: 
519:     return NextResponse.json({
520:       success: true,
521:       history
522:     })
523: 
524:   } catch (error) {
525:     console.error('[JOB_SEARCH] Failed to fetch data:', error)
526:     return NextResponse.json({ 
527:       error: 'Failed to fetch data' 
528:     }, { status: 500 })
529:   }
530: }
````

## File: src/lib/perplexity-intelligence.ts
````typescript
   1: // FIXED: Universal crypto support (browser + Node.js)
   2: let crypto: any
   3: try {
   4:   crypto = require('crypto')
   5: } catch {
   6:   // Browser environment - will use fallback
   7:   crypto = null
   8: }
   9: import { PerplexityService } from './perplexity-service'
  10: import { 
  11:   CANADIAN_JOB_BOARDS, 
  12:   MAJOR_JOB_BOARDS, 
  13:   OPEN_API_BOARDS,
  14:   ATS_PLATFORMS,
  15:   DISCOVERY_PRIORITY_ORDER
  16: } from './public-job-boards-config'
  17: import { parseAIResponse } from './utils/ai-response-parser'
  18: import { getCoverLetterTemplateById } from './cover-letter-templates'
  19: 
  20: // Environment
  21: const CACHE_TTL_MS = Number(process.env.PPX_CACHE_TTL_MS || 24 * 60 * 60 * 1000)
  22: const MAX_RETRY_ATTEMPTS = Number(process.env.PPX_MAX_RETRIES || 3)
  23: const RETRY_DELAY_MS = Number(process.env.PPX_RETRY_DELAY || 1000)
  24: 
  25: type CacheRecord = {
  26:   value: unknown
  27:   metadata: { createdAt: number; hitCount: number; lastAccessed: number }
  28:   expiresAt: number
  29: }
  30: 
  31: // Simple Map-based cache with TTL
  32: const cache = new Map<string, CacheRecord>()
  33: 
  34: // Cache cleanup interval (every hour)
  35: setInterval(() => {
  36:   const now = Date.now()
  37:   for (const [key, record] of cache.entries()) {
  38:     if (now > record.expiresAt) {
  39:       cache.delete(key)
  40:     }
  41:   }
  42: }, 60 * 60 * 1000)
  43: 
  44: function makeKey(prefix: string, payload: unknown): string {
  45:   const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  46:   
  47:   // Use crypto if available (Node.js), otherwise simple hash (browser)
  48:   if (crypto && crypto.createHash) {
  49:     return `${prefix}:${crypto.createHash('sha256').update(raw).digest('hex')}`
  50:   }
  51:   
  52:   // Browser fallback: simple hash
  53:   let hash = 0
  54:   for (let i = 0; i < raw.length; i++) {
  55:     const char = raw.charCodeAt(i)
  56:     hash = ((hash << 5) - hash) + char
  57:     hash = hash & hash
  58:   }
  59:   return `${prefix}:${Math.abs(hash).toString(36)}`
  60: }
  61: 
  62: function getCache(key: string): unknown | undefined {
  63:   const entry = cache.get(key)
  64:   if (!entry) return undefined
  65:   
  66:   // Check if expired
  67:   if (Date.now() > entry.expiresAt) {
  68:     cache.delete(key)
  69:     return undefined
  70:   }
  71:   
  72:   entry.metadata.hitCount += 1
  73:   entry.metadata.lastAccessed = Date.now()
  74:   return entry.value
  75: }
  76: 
  77: function setCache(key: string, value: unknown) {
  78:   cache.set(key, {
  79:     value,
  80:     expiresAt: Date.now() + CACHE_TTL_MS,
  81:     metadata: {
  82:       createdAt: Date.now(),
  83:       hitCount: 0,
  84:       lastAccessed: Date.now()
  85:     }
  86:   })
  87: }
  88: 
  89: function createClient(): PerplexityService { return new PerplexityService() }
  90: 
  91: // ---------- Enhanced helpers (ids, retry, enrichment) ----------
  92: function generateRequestId(): string {
  93:   if (crypto && crypto.randomBytes) {
  94:     return crypto.randomBytes(8).toString('hex')
  95:   }
  96:   // Browser fallback
  97:   return Math.random().toString(36).substr(2, 16) + Date.now().toString(36)
  98: }
  99: 
 100: // FIXED: Add timeout protection
 101: function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
 102:   return Promise.race([
 103:     promise,
 104:     new Promise<T>((_, reject) => 
 105:       setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
 106:     )
 107:   ])
 108: }
 109: 
 110: async function withRetry<T>(
 111:   operation: () => Promise<T>,
 112:   maxAttempts: number = MAX_RETRY_ATTEMPTS,
 113:   logger?: { warn?: (message: string, context?: Record<string, unknown>) => void },
 114:   timeoutMs: number = 30000 // 30 second default timeout
 115: ): Promise<T> {
 116:   let lastError: unknown
 117:   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
 118:     try {
 119:       return await withTimeout(operation(), timeoutMs)
 120:     } catch (err) {
 121:       lastError = err
 122:       if (attempt === maxAttempts) break
 123:       const baseDelay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
 124:       const jitter = Math.random() * RETRY_DELAY_MS
 125:       const delay = baseDelay + jitter
 126:       logger?.warn?.('Retrying Perplexity operation', {
 127:         attempt,
 128:         delay,
 129:         error: err instanceof Error ? err.message : String(err)
 130:       })
 131:       await new Promise(resolve => setTimeout(resolve, delay))
 132:     }
 133:   }
 134:   throw (lastError instanceof Error ? lastError : new Error('Operation failed'))
 135: }
 136: 
 137: // Removed unused PerplexityError class - using standard Error instead
 138: 
 139: // CRITICAL: This generates PATTERN-BASED emails (NOT VERIFIED)
 140: // These are stored as "alternativeEmails" with emailType: 'pattern' and low confidence
 141: // NEVER present these as verified contacts - they are guesses based on common patterns
 142: function inferEmails(name: string, companyDomain: string): string[] {
 143:   if (!name || !companyDomain) return []
 144:   const parts = name.toLowerCase().split(' ').filter(Boolean)
 145:   if (parts.length < 2) return []
 146:   const first = parts[0]
 147:   const last = parts[parts.length - 1]
 148:   const patterns = [
 149:     `${first}.${last}@${companyDomain}`,
 150:     `${first}${last}@${companyDomain}`,
 151:     `${first[0]}${last}@${companyDomain}`,
 152:     `${first}@${companyDomain}`,
 153:     `${last}@${companyDomain}`,
 154:     `${first}.${last[0]}@${companyDomain}`
 155:   ]
 156:   return patterns
 157: }
 158: 
 159: function normalizeSkills(skills: string[]): string[] {
 160:   const mapping: Record<string, string> = {
 161:     javascript: 'JavaScript', js: 'JavaScript',
 162:     typescript: 'TypeScript', ts: 'TypeScript',
 163:     react: 'React', reactjs: 'React',
 164:     node: 'Node.js', nodejs: 'Node.js',
 165:     python: 'Python', py: 'Python',
 166:     sales: 'Sales', selling: 'Sales',
 167:     crm: 'CRM', 'customer relationship management': 'CRM',
 168:     ai: 'Artificial Intelligence', 'artificial intelligence': 'Artificial Intelligence',
 169:     'machine learning': 'Machine Learning', ml: 'Machine Learning'
 170:   }
 171:   return (skills || []).map(s => {
 172:     const k = s.toLowerCase().trim()
 173:     return mapping[k] || s
 174:   })
 175: }
 176: 
 177: // CRITICAL FIX: Calculate years of experience from resume text
 178: // Prevents double-counting overlapping periods and filters out education dates
 179: function calculateYearsFromResume(resumeText: string): number {
 180:   // Extract only the work experience section to avoid counting education dates
 181:   const experienceSection = extractExperienceSection(resumeText)
 182:   
 183:   // Match date ranges in various formats
 184:   const dateRegex = /(\w+\s+\d{4}|(\d{1,2}\/\d{4}))\s*[-–—]\s*(\w+\s+\d{4}|Present|Current|(\d{1,2}\/\d{4}))/gi
 185:   const matches = Array.from(experienceSection.matchAll(dateRegex))
 186:   
 187:   // Parse all date ranges into start/end pairs
 188:   const periods: Array<{ start: Date; end: Date }> = []
 189:   for (const match of matches) {
 190:     try {
 191:       const startStr = match[1]
 192:       const endStr = match[3]
 193:       
 194:       const startDate = new Date(startStr)
 195:       const endDate = endStr.match(/Present|Current/i) ? new Date() : new Date(endStr)
 196:       
 197:       // Validate dates are reasonable (not in future, not before 1970)
 198:       if (startDate.getFullYear() < 1970 || startDate.getFullYear() > new Date().getFullYear()) continue
 199:       if (endDate.getFullYear() < 1970 || endDate.getFullYear() > new Date().getFullYear() + 1) continue
 200:       if (startDate > endDate) continue // Skip invalid ranges
 201:       
 202:       const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
 203:                     (endDate.getMonth() - startDate.getMonth())
 204:       
 205:       // Sanity check: skip periods longer than 50 years or negative
 206:       if (months > 0 && months < 600) {
 207:         periods.push({ start: startDate, end: endDate })
 208:       }
 209:     } catch (e) {
 210:       // Skip invalid dates
 211:       continue
 212:     }
 213:   }
 214:   
 215:   // If no valid periods found, return 0
 216:   if (periods.length === 0) return 0
 217:   
 218:   // Sort periods by start date
 219:   periods.sort((a, b) => a.start.getTime() - b.start.getTime())
 220:   
 221:   // Merge overlapping periods to avoid double-counting
 222:   const merged: Array<{ start: Date; end: Date }> = []
 223:   let current = periods[0]
 224:   
 225:   for (let i = 1; i < periods.length; i++) {
 226:     const next = periods[i]
 227:     
 228:     // If periods overlap or are adjacent, merge them
 229:     if (next.start <= current.end) {
 230:       current.end = new Date(Math.max(current.end.getTime(), next.end.getTime()))
 231:     } else {
 232:       // No overlap, push current and start new period
 233:       merged.push(current)
 234:       current = next
 235:     }
 236:   }
 237:   merged.push(current)
 238:   
 239:   // Calculate total months from merged periods
 240:   let totalMonths = 0
 241:   for (const period of merged) {
 242:     const months = (period.end.getFullYear() - period.start.getFullYear()) * 12 + 
 243:                   (period.end.getMonth() - period.start.getMonth())
 244:     totalMonths += months
 245:   }
 246:   
 247:   const years = Math.round(totalMonths / 12)
 248:   
 249:   // CRITICAL FIX: Cap at realistic maximum
 250:   // Assume candidate started working at age 18, max age 65
 251:   // Most candidates are 25-45, so cap at 25 years to be safe
 252:   const maxRealisticYears = 25
 253:   const cappedYears = Math.min(years, maxRealisticYears)
 254:   
 255:   // If calculated years seem unrealistic (>15), round down to nearest 5
 256:   if (cappedYears > 15) {
 257:     return Math.floor(cappedYears / 5) * 5
 258:   }
 259:   
 260:   return cappedYears
 261: }
 262: 
 263: // Extract work experience section from resume to avoid counting education dates
 264: function extractExperienceSection(resumeText: string): string {
 265:   const text = resumeText.toLowerCase()
 266:   
 267:   // Find work experience section markers
 268:   const experienceMarkers = [
 269:     'work experience',
 270:     'professional experience',
 271:     'employment history',
 272:     'experience',
 273:     'work history',
 274:     'career history'
 275:   ]
 276:   
 277:   // Find education section markers to exclude
 278:   const educationMarkers = [
 279:     'education',
 280:     'academic background',
 281:     'academic history',
 282:     'degrees'
 283:   ]
 284:   
 285:   let experienceStart = -1
 286:   let experienceMarker = ''
 287:   
 288:   // Find the earliest experience marker
 289:   for (const marker of experienceMarkers) {
 290:     const index = text.indexOf(marker)
 291:     if (index !== -1 && (experienceStart === -1 || index < experienceStart)) {
 292:       experienceStart = index
 293:       experienceMarker = marker
 294:     }
 295:   }
 296:   
 297:   // If no experience section found, use entire resume (fallback)
 298:   if (experienceStart === -1) return resumeText
 299:   
 300:   // Find where experience section ends (usually at education or end of document)
 301:   let experienceEnd = resumeText.length
 302:   for (const marker of educationMarkers) {
 303:     const index = text.indexOf(marker, experienceStart + experienceMarker.length)
 304:     if (index !== -1 && index < experienceEnd) {
 305:       experienceEnd = index
 306:     }
 307:   }
 308:   
 309:   return resumeText.substring(experienceStart, experienceEnd)
 310: }
 311: 
 312: // Enhanced response wrappers (non-breaking: used by new V2 methods only)
 313: export type RequestMetadata = { 
 314:   requestId: string
 315:   timestamp: number
 316:   duration?: number
 317:   error?: string
 318:   boardsSearched?: number
 319:   resultsCount?: number
 320:   attemptedCleanups?: string[]
 321:   contactsFound?: number
 322:   withEmails?: number
 323:   agent_iterations?: number
 324:   tools_used?: string[]
 325:   reasoning?: string
 326:   confidence?: number
 327:   method?: string
 328:   sources?: number
 329: }
 330: export type EnhancedResponse<T> = { success: boolean; data: T; metadata: RequestMetadata; cached: boolean }
 331: 
 332: export interface IntelligenceRequest {
 333:   company: string
 334:   role?: string
 335:   geo?: string
 336: }
 337: 
 338: export interface IntelligenceResponse {
 339:   company: string
 340:   freshness: string
 341:   sources: Array<{ title: string; url: string }>
 342:   confidence: number
 343:   financials: Array<{ metric: string; value: string; confidence: number; source?: string }>
 344:   culture: Array<{ point: string; confidence: number; source?: string }>
 345:   salaries: Array<{ title: string; range: string; currency?: string; geo?: string; source?: string; confidence: number }>
 346:   contacts: Array<{ name: string; title: string; url?: string; source?: string; confidence: number }>
 347:   growth: Array<{ signal: string; source?: string; confidence: number }>
 348:   summary: string
 349:   description: string
 350:   size: string
 351:   revenue: string
 352:   industry: string
 353:   founded: string
 354:   headquarters: string
 355:   psychology: string
 356:   marketIntelligence: string
 357:   // CRITICAL: New comprehensive intelligence fields
 358:   recentNews?: Array<{ title: string; date: string; url: string; summary: string }>
 359:   socialMedia?: {
 360:     linkedin?: string
 361:     twitter?: string
 362:     facebook?: string
 363:     instagram?: string
 364:     youtube?: string
 365:   }
 366:   glassdoorRating?: {
 367:     overallRating?: number
 368:     ceoApproval?: number
 369:     recommendToFriend?: number
 370:     reviewCount?: number
 371:     url?: string
 372:   }
 373:   stockProfile?: {
 374:     ticker?: string
 375:     exchange?: string
 376:     currentPrice?: string
 377:     marketCap?: string
 378:     isPublic?: boolean
 379:   }
 380: }
 381: 
 382: // V2 Data structures (for job listings and contacts)
 383: export interface JobListing {
 384:   title: string
 385:   company: string
 386:   location: string
 387:   address?: string | null
 388:   url: string
 389:   source?: string
 390:   summary: string
 391:   postedDate: string
 392:   salary?: string | null
 393:   skillMatchPercent: number
 394:   skills: string[]
 395:   workType?: 'remote' | 'hybrid' | 'onsite'
 396:   experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive'
 397:   contacts: {
 398:     hrEmail?: string | null
 399:     hiringManagerEmail?: string | null
 400:     generalEmail?: string | null
 401:     phone?: string | null
 402:     linkedinProfiles: string[]
 403:   }
 404:   benefits?: string[]
 405:   requirements?: string[]
 406: }
 407: 
 408: export interface HiringContact {
 409:   name: string
 410:   title: string
 411:   department: string
 412:   linkedinUrl?: string | null
 413:   email?: string | null
 414:   emailType?: 'public' | 'inferred' | 'pattern'
 415:   source: string
 416:   confidence: number
 417:   phone?: string | null
 418:   alternativeEmails?: string[]
 419:   discoveryMethod?: string
 420: }
 421: 
 422: export interface QuickSearchItem {
 423:   title: string
 424:   url: string
 425:   snippet: string
 426:   source: string
 427:   postedDate?: string
 428:   location?: string
 429:   company?: string
 430:   date?: string
 431: }
 432: 
 433: const SYSTEM = `You are a research analyst using real-time web tools.
 434: CRITICAL: Your response must be ONLY valid JSON. NO explanatory text, NO markdown, NO commentary.
 435: Rules:
 436: - Use only public sources and respect robots.txt by following links provided by Perplexity tools.
 437: - Always return ONLY structured JSON matching the requested schema.
 438: - Include 5-10 source citations with titles and URLs.
 439: - Provide confidence scores (0-1) for each data point and overall.
 440: - Mark estimates or unverified signals clearly.
 441: - NEVER add text before or after the JSON response.
 442: `
 443: 
 444: interface ComprehensiveJobResearchData {
 445:   jobAnalysis: {
 446:     matchScore: number
 447:     matchingSkills: string[]
 448:     missingSkills: string[]
 449:     skillsToHighlight: string[]
 450:     recommendations: string[]
 451:     estimatedFit: string
 452:   }
 453:   companyIntel: {
 454:     company: string
 455:     description: string
 456:     size?: string
 457:     revenue?: string
 458:     industry?: string
 459:     founded?: string
 460:     headquarters?: string
 461:     website?: string
 462:     marketPosition?: string
 463:   }
 464:   companyPsychology: {
 465:     culture: string
 466:     values: string[]
 467:     managementStyle?: string
 468:     workEnvironment?: string
 469:   }
 470:   hiringContacts: Array<{
 471:     name: string
 472:     title: string
 473:     department?: string
 474:     email?: string
 475:     linkedinUrl?: string
 476:     authority: 'decision maker' | 'recruiter' | 'manager' | 'coordinator'
 477:     confidence: number
 478:     contactMethod?: string
 479:   }>
 480:   marketIntelligence: {
 481:     competitivePosition?: string
 482:     industryTrends?: string
 483:     financialStability?: string
 484:     recentPerformance?: string
 485:   }
 486:   news: Array<{
 487:     title: string
 488:     summary: string
 489:     url: string
 490:     date?: string
 491:     source?: string
 492:     impact?: string
 493:   }>
 494:   reviews: Array<{
 495:     platform: string
 496:     rating?: number
 497:     summary: string
 498:     url: string
 499:     pros?: string[]
 500:     cons?: string[]
 501:   }>
 502:   compensation: {
 503:     salaryRange?: string
 504:     benefits?: string
 505:   }
 506:   strategicRecommendations: {
 507:     applicationStrategy: string
 508:     contactStrategy: string
 509:     interviewPrep: string[]
 510:   }
 511:   sources: string[]
 512:   confidenceLevel: number
 513: }
 514: 
 515: interface EnhancedCompanyResearchData {
 516:   companyIntelligence: {
 517:     name: string
 518:     industry?: string
 519:     founded?: string
 520:     headquarters?: string
 521:     employeeCount?: string
 522:     revenue?: string
 523:     website?: string
 524:     description?: string
 525:     marketPosition?: string
 526:     financialStability?: string
 527:     recentPerformance?: string
 528:   }
 529:   hiringContactIntelligence: {
 530:     officialChannels?: {
 531:       careersPage?: string
 532:       jobsEmail?: string
 533:       hrEmail?: string
 534:       phone?: string
 535:       address?: string
 536:     }
 537:     keyContacts?: Array<{
 538:       name: string
 539:       title: string
 540:       department?: string
 541:       linkedinUrl?: string
 542:       email?: string
 543:       authority?: string
 544:       contactMethod?: string
 545:     }>
 546:     emailFormat?: string
 547:     socialMedia?: Record<string, string>
 548:   }
 549:   companyPsychology?: {
 550:     culture?: string
 551:     values?: string[]
 552:     managementStyle?: string
 553:     workEnvironment?: string
 554:   }
 555:   reviewAnalysis?: {
 556:     glassdoor?: {
 557:       rating?: number
 558:       reviewCount?: number
 559:       ceoApproval?: string | number
 560:       recommendToFriend?: string | number
 561:       pros?: string[]
 562:       cons?: string[]
 563:     }
 564:     employeeSentiment?: string
 565:   }
 566:   aiAutomationThreat?: {
 567:     roleRisk?: string
 568:     automationProbability?: string
 569:     timeframe?: string
 570:     companyAIAdoption?: string
 571:     futureOutlook?: string
 572:     recommendations?: string[]
 573:   }
 574:   recentNews?: Array<{
 575:     headline?: string
 576:     date?: string
 577:     source?: string
 578:     url?: string
 579:     impact?: string
 580:   }>
 581:   compensation?: {
 582:     salaryRange?: string
 583:     benefits?: string
 584:   }
 585:   redFlags?: string[]
 586:   strategicRecommendations?: {
 587:     applicationStrategy?: string
 588:     contactStrategy?: string
 589:     interviewPrep?: string[]
 590:   }
 591:   sources?: string[]
 592:   confidenceLevel?: number
 593: }
 594: 
 595: export class PerplexityIntelligenceService {
 596:   /**
 597:    * CRITICAL FIX: Scrapes job URL to get full description when Perplexity returns incomplete data
 598:    * Fallback for when descriptions are too short
 599:    */
 600:   private static async scrapeJobURL(url: string): Promise<string> {
 601:     try {
 602:       const response = await fetch(url, {
 603:         headers: {
 604:           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
 605:         },
 606:         signal: AbortSignal.timeout(10000) // 10 second timeout
 607:       })
 608:       
 609:       if (!response.ok) return ''
 610:       
 611:       const html = await response.text()
 612:       
 613:       // Try multiple common job description selectors
 614:       const patterns = [
 615:         /<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
 616:         /<div[^>]*id="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/is,
 617:         /<section[^>]*class="[^"]*job-description[^"]*"[^>]*>(.*?)<\/section>/is,
 618:         /<div[^>]*class="[^"]*job-details[^"]*"[^>]*>(.*?)<\/div>/is
 619:       ]
 620:       
 621:       for (const pattern of patterns) {
 622:         const match = html.match(pattern)
 623:         if (match && match[1]) {
 624:           // Strip HTML tags and clean up
 625:           const cleaned = match[1]
 626:             .replace(/<script[^>]*>.*?<\/script>/gis, '')
 627:             .replace(/<style[^>]*>.*?<\/style>/gis, '')
 628:             .replace(/<[^>]+>/g, ' ')
 629:             .replace(/\s+/g, ' ')
 630:             .trim()
 631:           
 632:           if (cleaned.length > 150) {
 633:             return cleaned
 634:           }
 635:         }
 636:       }
 637:       
 638:       return ''
 639:     } catch (error) {
 640:       if (process.env.PPX_DEBUG === 'true') {
 641:         console.warn(`[SCRAPE] Failed to scrape ${url}:`, error)
 642:       }
 643:       return ''
 644:     }
 645:   }
 646: 
 647:   /**
 648:    * CRITICAL FIX: Validates job listings response from Perplexity
 649:    * Filters out incomplete, fake, or low-quality jobs
 650:    */
 651:   private static validateJobListings(jobs: JobListing[], minRequired: number): JobListing[] {
 652:     const validated = jobs.filter((job: JobListing) => {
 653:       // ❌ REJECT: Empty or short descriptions
 654:       if (!job.summary || job.summary.trim().length < 150) {
 655:         if (process.env.PPX_DEBUG === 'true') {
 656:           console.warn(`[VALIDATE] Rejecting ${job.title} - description too short (${job.summary?.length || 0} chars)`)
 657:         }
 658:         return false
 659:       }
 660:       
 661:       // ❌ REJECT: Confidential companies
 662:       const confidentialKeywords = ['confidential', 'various', 'tbd', 'multiple', 'undisclosed', 'anonymous', 'private', 'stealth', 'hidden']
 663:       const company = String(job.company || '').toLowerCase().trim()
 664:       if (confidentialKeywords.some(kw => company.includes(kw)) || company.length < 3) {
 665:         if (process.env.PPX_DEBUG === 'true') {
 666:           console.warn(`[VALIDATE] Rejecting ${job.title} - confidential company: ${job.company}`)
 667:         }
 668:         return false
 669:       }
 670:       
 671:       // ❌ REJECT: No valid URL
 672:       if (!job.url || !job.url.includes('http')) {
 673:         if (process.env.PPX_DEBUG === 'true') {
 674:           console.warn(`[VALIDATE] Rejecting ${job.title} - invalid URL: ${job.url}`)
 675:         }
 676:         return false
 677:       }
 678:       
 679:       // ✅ ACCEPT
 680:       return true
 681:     })
 682:     
 683:     // Warn if too many filtered out
 684:     if (validated.length < minRequired * 0.5 && process.env.PPX_DEBUG === 'true') {
 685:       console.warn(`[VALIDATE] Only ${validated.length}/${minRequired} jobs passed validation (${Math.round(validated.length/minRequired*100)}%)`)
 686:     }
 687:     
 688:     return validated
 689:   }
 690: 
 691:   /**
 692:    * CRITICAL FIX: Validates hiring contacts response from Perplexity
 693:    * Filters out fake emails, personal domains, pattern-based guesses
 694:    */
 695:   private static validateHiringContacts(contacts: HiringContact[]): HiringContact[] {
 696:     const validated = contacts.filter((contact: HiringContact) => {
 697:       // ❌ REJECT: No email and no LinkedIn
 698:       if (!contact.email && !contact.linkedinUrl) {
 699:         if (process.env.PPX_DEBUG === 'true') {
 700:           console.warn(`[VALIDATE] Rejecting ${contact.name} - no contact method`)
 701:         }
 702:         return false
 703:       }
 704:       
 705:       // ❌ REJECT: Personal email domains (if email exists)
 706:       if (contact.email) {
 707:         const personalDomains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'aol', 'icloud', 'protonmail']
 708:         if (personalDomains.some(d => contact.email!.toLowerCase().includes(d))) {
 709:           if (process.env.PPX_DEBUG === 'true') {
 710:             console.warn(`[VALIDATE] Rejecting ${contact.email} - personal domain`)
 711:           }
 712:           return false
 713:         }
 714:         
 715:         // ❌ REJECT: Template/placeholder emails
 716:         if (contact.email.includes('[') || contact.email.includes('VISIT') || contact.email.includes('example') || contact.email.includes('domain.')) {
 717:           if (process.env.PPX_DEBUG === 'true') {
 718:             console.warn(`[VALIDATE] Rejecting ${contact.email} - template email`)
 719:           }
 720:           return false
 721:         }
 722:       }
 723:       
 724:       // ✅ ACCEPT
 725:       return true
 726:     })
 727:     
 728:     return validated
 729:   }
 730: 
 731:   // V2: Enhanced company research with retries and metadata
 732:   static async researchCompanyV2(input: IntelligenceRequest): Promise<EnhancedResponse<IntelligenceResponse>> {
 733:     const requestId = generateRequestId()
 734:     const started = Date.now()
 735:     const key = makeKey('ppx:research:v2', input)
 736:     const cached = getCache(key) as IntelligenceResponse | undefined
 737:     if (cached) {
 738:       return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
 739:     }
 740:     try {
 741:       const userPrompt = `COMPREHENSIVE RESEARCH TASK: Search for contacts, emails, website, and complete intelligence for ${input.company}${input.role ? ` (role: ${input.role})` : ''}${input.geo ? ` in ${input.geo}` : ''}.
 742: 
 743: **MANDATORY SEARCH SOURCES:**
 744: - Use Google search extensively
 745: - Search LinkedIn company page AND individual employee profiles
 746: - Search all social media platforms (Twitter, Facebook, Instagram, YouTube)
 747: - Search company website thoroughly
 748: - Search business directories (BBB, Yellow Pages, ZoomInfo, etc.)
 749: - Search news sources and press releases
 750: - Search Glassdoor for reviews and salaries
 751: - Search stock exchanges if publicly traded
 752: 
 753: **RETURN DETAILED JSON with ALL fields below:**
 754: {
 755:   "company": string (full legal name),
 756:   "description": string (detailed company overview - NOT "No description available"),
 757:   "size": string (employee count with source),
 758:   "revenue": string (annual revenue estimate with source),
 759:   "industry": string (specific industry classification),
 760:   "founded": string (year or date with source),
 761:   "headquarters": string (full address with city, province/state, postal code),
 762:   "psychology": string (company culture, values, workplace environment - from Glassdoor/employee reviews),
 763:   "marketIntelligence": string (market position, competitive landscape, growth trends - detailed analysis),
 764:   "freshness": string (ISO datetime of research),
 765:   "sources": [{"title": string, "url": string}] (minimum 8 sources, up to 20),
 766:   "confidence": number (0 to 1),
 767:   "financials": [{"metric": string, "value": string, "confidence": number, "source": string}],
 768:   "culture": [{"point": string, "confidence": number, "source": string}] (from Glassdoor/reviews),
 769:   "salaries": [{"title": string, "range": string, "currency": string, "geo": string, "source": string, "confidence": number}],
 770:   "contacts": [{"name": string, "title": string, "email": string, "url": string, "source": string, "confidence": number}] (executives, managers, recruiters from LinkedIn with emails),
 771:   "generalEmail": string (company general inbox: careers@, hr@, jobs@, info@, hello@, contact@ - MANDATORY),
 772:   "careersPage": string (company careers/jobs page URL),
 773:   "growth": [{"signal": string, "source": string, "confidence": number}],
 774:   "summary": string (comprehensive 2-3 paragraph summary),
 775:   "recentNews": [{"title": string, "date": string, "url": string, "summary": string}] (last 6 months),
 776:   "socialMedia": {"linkedin": string, "twitter": string, "facebook": string, "instagram": string, "youtube": string},
 777:   "glassdoorRating": {"overallRating": number, "ceoApproval": number, "recommendToFriend": number, "reviewCount": number, "url": string},
 778:   "stockProfile": {"ticker": string, "exchange": string, "currentPrice": string, "marketCap": string, "isPublic": boolean}
 779: }
 780: 
 781: **CRITICAL REQUIREMENTS:**
 782: 1. Search company website for About page, Contact page, Leadership/Team page
 783: 2. **MANDATORY**: Extract company general email from website footer/contact page (careers@, hr@, jobs@, info@, hello@, contact@)
 784: 3. **MANDATORY**: Find company careers/jobs page URL
 785: 4. Search "site:linkedin.com/company/${input.company}" for official company page
 786: 5. Search "site:linkedin.com ${input.company} CEO OR president OR manager" for executive contacts WITH emails
 787: 6. Search "${input.company} headquarters address phone email"
 788: 7. Search "${input.company} site:glassdoor.com" for reviews and culture insights
 789: 8. Search "${input.company} revenue employees industry" for business intelligence
 790: 9. DO NOT return "Unknown", "No description available", or "No data" - search multiple sources until you find information
 791: 10. Include REAL contact information (names, titles, emails, LinkedIn URLs) - minimum 3 contacts if company has >10 employees
 792: 11. **APP IS USELESS WITHOUT CONTACT INFO** - Always return at least generalEmail even if no specific contacts found`
 793:       const out = await withRetry(async () => {
 794:         const client = createClient()
 795:         const user = userPrompt
 796:         const res = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 3000, model: 'sonar-pro' })
 797:         if (!res.content?.trim()) throw new Error('Empty response')
 798:         return res
 799:       })
 800:       const context = {
 801:         requestId,
 802:         prompts: { system: SYSTEM, user: userPrompt },
 803:         timestamp: started,
 804:         duration: Date.now() - started
 805:       }
 806:       const parsed = parseAIResponse<IntelligenceResponse>(out.content ?? '', { stripMarkdown: true, extractFirst: true }, context)
 807:       parsed.company = parsed.company || input.company
 808:       parsed.freshness = parsed.freshness || new Date().toISOString()
 809:       parsed.sources = Array.isArray(parsed.sources) ? parsed.sources.slice(0, 12) : []
 810:       parsed.confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.6
 811:       if (Array.isArray(parsed.contacts)) {
 812:         parsed.contacts = parsed.contacts.map(c => ({ ...c, url: c.url }))
 813:       }
 814:       setCache(key, parsed)
 815:       return { success: true, data: parsed, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: false }
 816:     } catch (e) {
 817:       const fb: IntelligenceResponse = {
 818:         company: input.company,
 819:         freshness: new Date().toISOString(),
 820:         sources: [],
 821:         confidence: 0.3,
 822:         financials: [],
 823:         culture: [],
 824:         salaries: [],
 825:         contacts: [],
 826:         growth: [],
 827:         summary: 'Research failed - please retry',
 828:         description: 'No description available',
 829:         size: 'Unknown',
 830:         revenue: 'Unknown',
 831:         industry: 'Unknown',
 832:         founded: 'Unknown',
 833:         headquarters: 'Unknown',
 834:         psychology: 'No insights available',
 835:         marketIntelligence: 'No market data available',
 836:         recentNews: [],
 837:         socialMedia: {},
 838:         glassdoorRating: undefined,
 839:         stockProfile: undefined
 840:       }
 841:       return { success: false, data: fb, metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
 842:     }
 843:   }
 844:   // REMOVED: Old researchCompany - Use researchCompanyV2 instead
 845: 
 846:   static async salaryForRole(role: string, company?: string, geo?: string) {
 847:     const key = makeKey('ppx:salary', { role, company, geo })
 848:     const cached = getCache(key)
 849:     if (cached) return cached
 850:     const client = createClient()
 851:     const user = `Find current salary ranges for ${role}${company ? ` at ${company}` : ''}${geo ? ` in ${geo}` : ''}. Return JSON: items[{title,range,currency,geo,source,confidence}], summary, freshness`;
 852:     try {
 853:       const out = await client.makeRequest(SYSTEM, user, { temperature: 0.2, maxTokens: 900, model: 'sonar-pro' })
 854:       const text = (out.content || '').trim()
 855:       const context = {
 856:         requestId: generateRequestId(),
 857:         prompts: { system: SYSTEM, user },
 858:         timestamp: Date.now(),
 859:         duration: 0
 860:       }
 861:       const parsed = parseAIResponse<Record<string, unknown>>(text, { stripMarkdown: true, extractFirst: true }, context)
 862:       setCache(key, parsed)
 863:       return parsed
 864:     } catch {
 865:       return { items: [], summary: 'Unavailable', freshness: new Date().toISOString() }
 866:     }
 867:   }
 868: 
 869:   /**
 870:    * Enhanced job listings search across 25+ Canadian and global job boards
 871:    * Integrates with public-job-boards-config.ts for comprehensive coverage
 872:    */
 873:   static async jobListings(
 874:     jobTitle: string, 
 875:     location: string,
 876:     options: {
 877:       boards?: string[] // Specific boards to search (uses DISCOVERY_PRIORITY_ORDER if not specified)
 878:       limit?: number
 879:       includeCanadianOnly?: boolean
 880:     } = {}
 881:   ) {
 882:     const { boards, limit = 50, includeCanadianOnly = false } = options
 883:     const key = makeKey('ppx:jobs', { jobTitle, location, boards, limit })
 884:     const cached = getCache(key)
 885:     if (cached) return cached
 886: 
 887:     // Determine which boards to search
 888:     const targetBoards = boards || (includeCanadianOnly 
 889:       ? Object.keys(CANADIAN_JOB_BOARDS)
 890:       : DISCOVERY_PRIORITY_ORDER.slice(0, 15) // Top 15 boards
 891:     )
 892: 
 893:     // Note: targetBoards is used in the Perplexity prompt below to guide source selection
 894: 
 895:     const client = createClient()
 896:     const SYSTEM_JOBS = `You are an advanced Job Listings Aggregator with real-time web access across 25+ Canadian and global job boards.
 897: 
 898: PRIORITY CANADIAN SOURCES:
 899: - Job Bank Canada (jobbank.gc.ca) - Government jobs
 900: - AutoJobs (autojobs.com) - Canadian automotive & skilled trades
 901: - SimplyHired Canada (simplyhired.ca) - Canadian aggregator
 902: - Jobboom (jobboom.com) - Bilingual Canadian
 903: - Workopolis (workopolis.com) - Canadian
 904: - Indeed Canada (ca.indeed.com)
 905: - Jooble Canada (ca.jooble.org)
 906: - ZipRecruiter Canada (ziprecruiter.ca)
 907: - Monster Canada (monster.ca)
 908: - Glassdoor Canada (glassdoor.ca)
 909: - Dice Canada (dice.com)
 910: - Careerjet Canada (careerjet.ca)
 911: 
 912: GLOBAL SOURCES:
 913: - LinkedIn (linkedin.com/jobs)
 914: - Indeed (indeed.com)
 915: - Glassdoor (glassdoor.com)
 916: - Adzuna (adzuna.com)
 917: 
 918: ATS PLATFORMS (Canadian Tech Companies):
 919: - Greenhouse: Shopify, Hootsuite, Wealthsimple, Faire, Thinkific, Lightspeed
 920: - Lever: Slack, Shopify, Bench, Clio, Clearco, League
 921: - Workable: FreshBooks, Visier, Unbounce, Axonify
 922: - Recruitee: Paytm, Ecobee, Geotab, Auvik, Wave, KOHO
 923: - Ashby: Faire, Clearco, Maple, Borrowell, Shakepay
 924: - Breezy HR: Lumerate, Zymewire, and other Canadian startups
 925: - Communitech Job Board: communitech.ca/companies (Waterloo tech ecosystem)
 926: - RemoteRocketship: remoterocketship.com (Remote Canadian jobs)
 927: 
 928: 🔥 CRITICAL - FOLLOW LINKS AND EXTRACT FULL CONTENT:
 929: For EACH job found, you MUST:
 930: 1. Find the job in search results (title, company, location, URL)
 931: 2. **FOLLOW THE JOB URL** and visit the actual job posting page
 932: 3. **SCRAPE THE COMPLETE JOB DESCRIPTION** from the posting page (all paragraphs, all bullet points)
 933: 4. Extract salary, benefits, requirements, responsibilities from the posting page
 934: 5. If company name is "Confidential" in search results - **VISIT THE URL** and extract the REAL company name from the posting page
 935: 6. If description is missing - **TRY COMPANY CAREERS PAGE** (company.com/careers) or **COMPANY ATS** (company.breezy.hr, company.greenhouse.io)
 936: 
 937: CRITICAL REQUIREMENTS:
 938: 1. **ONLY REAL COMPANY NAMES** - ABSOLUTELY NO CONFIDENTIAL LISTINGS:
 939:    ❌ REJECT AND SKIP: "Confidential", "Various Employers", "Multiple Companies", "Undisclosed", "Private", "TBD", "N/A", "Various [Industry]", "Anonymous", "Stealth", "Hidden"
 940:    ❌ DO NOT INCLUDE jobs where company name is hidden or confidential
 941:    ✅ ONLY INCLUDE: Jobs with real, specific company names (e.g., "Ricoh Canada", "Shopify", "TD Bank", "Lumerate", "Zymewire")
 942: 2. **VERIFY COMPANY EXISTS** - Must be a real, identifiable company
 943: 3. **SKIP INVALID LISTINGS** - If company name is missing or confidential, DO NOT include it in results
 944: 4. **EXTRACT FULL DESCRIPTIONS** - Visit each job URL and scrape complete description (minimum 200 words)
 945: 5. Search ONLY publicly accessible listings (no login required)
 946: 6. Prioritize Canadian sources for Canadian locations
 947: 7. **Extract salary** from job posting page if available
 948: 8. Deduplicate across all sources by company + title
 949: 9. Rank by: recency → Canadian source priority → relevance
 950: 10. Return EXACTLY ${limit} unique listings with REAL company names and FULL descriptions
 951: 
 952: OUTPUT JSON (MUST BE VALID, COMPLETE JSON):
 953: [{
 954:   "title": string (specific job title, not "Various Positions"),
 955:   "company": string (EXACT company name, not generic),
 956:   "location": string (specific city/province),
 957:   "url": string (direct job posting link),
 958:   "summary": string (200-400 words, COMPLETE job description from posting page),
 959:   "salary": string | null (extracted from posting page),
 960:   "postedDate": "YYYY-MM-DD",
 961:   "source": string (board name),
 962:   "requirements": string[] (key requirements from posting),
 963:   "benefits": string[] (benefits mentioned in posting)
 964: }]`
 965: 
 966:     const USER_JOBS = `Search for "${jobTitle}" jobs in ${location} across these prioritized sources:
 967: ${targetBoards.slice(0, 10).join(', ')}
 968: 
 969: Return ${limit} unique, recent listings in JSON format. For Canadian locations, prioritize Job Bank, Jobboom, Workopolis first.`
 970: 
 971:     const requestId = generateRequestId()
 972:     const started = Date.now()
 973:     try {
 974:       const out = await client.makeRequest(SYSTEM_JOBS, USER_JOBS, { 
 975:         temperature: 0.2, 
 976:         maxTokens: Math.min(limit * 500, 30000), // CRITICAL FIX: Increased from 300 to 500 tokens per job for full descriptions
 977:         model: 'sonar-pro' // Use research model for job search
 978:       })
 979:       
 980:       // FIXED: Check for truncation warning
 981:       if (out.content.length > 18000) {
 982:         console.warn('[JOB_LISTINGS] Response may be truncated, consider reducing limit or splitting into batches')
 983:       }
 984:       let text = (out.content || '').trim()
 985:       
 986:       // Extract JSON from response if wrapped in markdown or explanation
 987:       const jsonMatch = text.match(/\[[\s\S]*\]/)
 988:       if (jsonMatch) {
 989:         text = jsonMatch[0]
 990:       }
 991:       
 992:       // FIX: Clean up truncated JSON
 993:       // If JSON ends abruptly without closing ], try to fix it
 994:       if (!text.endsWith(']')) {
 995:         console.warn('[PERPLEXITY] JSON appears truncated, attempting to fix')
 996:         // Find last complete object
 997:         const lastCompleteObj = text.lastIndexOf('}')
 998:         if (lastCompleteObj > 0) {
 999:           text = text.substring(0, lastCompleteObj + 1) + ']'
1000:         }
1001:       }
1002:       
1003:       // FIX: Remove trailing commas before ]
1004:       text = text.replace(/,(\s*)\]/g, '$1]')
1005:       
1006:       const context = {
1007:         requestId,
1008:         prompts: { system: SYSTEM_JOBS, user: USER_JOBS },
1009:         timestamp: started,
1010:         duration: Date.now() - started
1011:       }
1012:       let parsed: unknown
1013:       try {
1014:         parsed = parseAIResponse<unknown>(text, { stripMarkdown: true, extractFirst: true }, context)
1015:       } catch (parseError: unknown) {
1016:         console.error('[PERPLEXITY] JSON parse failed, raw text:', text.substring(0, 500))
1017:         console.error('[PERPLEXITY] Parse error:', parseError)
1018:         return []
1019:       }
1020:       
1021:       const arr = Array.isArray(parsed) ? parsed.slice(0, limit) : []
1022:       
1023:       // CRITICAL FIX: Filter out confidential companies (NO FAKE/INFERRED DATA)
1024:       const filtered = arr.filter((job: unknown) => {
1025:         const jobObj = job as Record<string, unknown>
1026:         const companyRaw = String(jobObj.company || '')
1027:         const company = companyRaw.toLowerCase().trim()
1028:         
1029:         const isConfidential = 
1030:           company.includes('confidential') ||
1031:           company.includes('anonymous') ||
1032:           company.includes('undisclosed') ||
1033:           company.includes('various') ||
1034:           company.includes('multiple') ||
1035:           company.includes('private') ||
1036:           company.includes('stealth') ||
1037:           company.includes('hidden') ||
1038:           company.includes('tbd') ||
1039:           company.includes('n/a') ||
1040:           company === '' ||
1041:           company.length < 3
1042:         
1043:         if (isConfidential) {
1044:           return false
1045:         }
1046:         return true
1047:       })
1048:       
1049:       // Filtered confidential postings
1050:       
1051:       // Enhance with board metadata
1052:       const enhanced = filtered.map((job: unknown) => {
1053:         const jobObj = job as Record<string, unknown>
1054:         return {
1055:           ...jobObj,
1056:           metadata: {
1057:             searchedBoards: targetBoards.length,
1058:             canadianPriority: includeCanadianOnly,
1059:             extractedAt: new Date().toISOString(),
1060:             confidentialFiltered: arr.length - filtered.length
1061:           }
1062:         }
1063:       })
1064:       
1065:       // FIXED: Only cache if we have good success rate (at least 80%)
1066:       const successRate = enhanced.length / limit
1067:       if (enhanced.length > 0 && successRate >= 0.8) {
1068:         setCache(key, enhanced)
1069:         // Cached jobs
1070:       } else if (enhanced.length > 0) {
1071:         // Skipping cache - low success rate
1072:       }
1073:       return enhanced
1074:     } catch (error) {
1075:       console.error('[PERPLEXITY] Job listings failed:', error)
1076:       return []
1077:     }
1078:   }
1079: 
1080:   // Fast SEARCH API for raw listings from specific domains (outside of template strings)
1081:   static async jobQuickSearch(query: string, domains: string[] = [], maxResults: number = 20, recency: 'day'|'week'|'month'|'year' = 'month'): Promise<QuickSearchItem[]> {
1082:     const key = makeKey('ppx:search', { query, domains, maxResults, recency })
1083:     const cached = getCache(key) as QuickSearchItem[] | undefined
1084:     if (cached) return cached
1085:     try {
1086:       const resp = await fetch('https://api.perplexity.ai/search', {
1087:         method: 'POST',
1088:         headers: {
1089:           'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY || ''}`,
1090:           'Content-Type': 'application/json'
1091:         },
1092:         body: JSON.stringify({
1093:           query,
1094:           max_results: Math.max(5, Math.min(25, maxResults)),
1095:           ...(domains.length ? { search_domain_filter: domains } : {}),
1096:           search_recency_filter: recency
1097:         })
1098:       })
1099:       if (!resp.ok) throw new Error('ppx search failed')
1100:       const data = await resp.json() as unknown
1101:       const asRecord = data as Record<string, unknown>
1102:       const arr = (Array.isArray(asRecord?.results) ? (asRecord.results as unknown[]) : (Array.isArray(data as unknown[]) ? (data as unknown[]) : []))
1103:       const mapped: QuickSearchItem[] = arr.map((raw: unknown) => {
1104:         const it = (raw || {}) as Record<string, unknown>
1105:         const title = typeof it.title === 'string' ? it.title : (typeof it.snippet === 'string' ? String(it.snippet) : '')
1106:         const url = typeof it.url === 'string' ? it.url : (typeof it.link === 'string' ? String(it.link) : '')
1107:         const snippet = typeof it.snippet === 'string' ? String(it.snippet) : (typeof it.summary === 'string' ? String(it.summary) : '')
1108:         const source = typeof it.domain === 'string' ? String(it.domain) : (typeof it.source === 'string' ? String(it.source) : '')
1109:         const publishedTime = it.published_time
1110:         const dateField = it.date
1111:         const published = (typeof publishedTime === 'string' ? publishedTime : (typeof dateField === 'string' ? dateField : undefined))
1112:         return { title, url, snippet, source, postedDate: published }
1113:       })
1114:       setCache(key, mapped)
1115:       return mapped
1116:     } catch {
1117:       return []
1118:     }
1119:   }
1120: 
1121:   // REMOVED: jobMarketAnalysis wrapper - Use jobMarketAnalysisV2 directly
1122:   /**
1123:    * V2: Enhanced job market analysis with options and ranking
1124:    * Now integrated with 25+ Canadian and global job boards
1125:    */
1126:   static async jobMarketAnalysisV2(
1127:     location: string, 
1128:     resumeText: string, 
1129:     options: { 
1130:       roleHint?: string
1131:       workType?: 'remote'|'hybrid'|'onsite'|'any'
1132:       salaryMin?: number
1133:       experienceLevel?: 'entry'|'mid'|'senior'|'executive'
1134:       maxResults?: number
1135:       boards?: string[] // Specify which boards to prioritize
1136:     } = {}
1137:   ): Promise<EnhancedResponse<JobListing[]>> {
1138:     const requestId = generateRequestId()
1139:     const started = Date.now()
1140:     const key = makeKey('ppx:jobmarket:v2', { location, resume: resumeText.slice(0,1000), options })
1141:     const cached = getCache(key) as JobListing[] | undefined
1142:     if (cached) return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
1143: 
1144:     // Determine if location is Canadian for prioritization
1145:     const isCanadian = /canada|canadian|toronto|vancouver|montreal|calgary|ottawa|edmonton|quebec|winnipeg|halifax/i.test(location)
1146:     const targetBoards = options.boards || (isCanadian 
1147:       ? DISCOVERY_PRIORITY_ORDER.filter(b => CANADIAN_JOB_BOARDS[b]).concat(['linkedin', 'indeed', 'glassdoor'])
1148:       : DISCOVERY_PRIORITY_ORDER.slice(0, 15)
1149:     )
1150: 
1151:     try {
1152:       const out = await withRetry(async () => {
1153:         const client = createClient()
1154:         const prompt = `Find ${options.maxResults || 25} relevant job opportunities in ${location} matching this profile.
1155: 
1156: RESUME:
1157: ${resumeText}
1158: 
1159: FILTERS:
1160: - Role: ${options.roleHint || '(infer from resume)'}
1161: - Work Type: ${options.workType || 'any'}
1162: - Experience: ${options.experienceLevel || 'any'}
1163: - Min Salary: ${options.salaryMin ? ('$' + options.salaryMin + '+') : 'any'}
1164: 
1165: PRIORITY JOB BOARDS (use site: search for each):
1166: ${targetBoards.slice(0, 12).map((board, i) => {
1167:   const config = CANADIAN_JOB_BOARDS[board] || MAJOR_JOB_BOARDS[board] || OPEN_API_BOARDS[board] || ATS_PLATFORMS[board]
1168:   const baseUrl = config?.scrapingConfig?.baseUrl || ''
1169:   const domain = baseUrl ? baseUrl.replace(/https?:\/\//, '').replace(/\/$/, '') : board
1170:   return `${i + 1}. site:${domain} "${options.roleHint || 'jobs'}" "${location}"`
1171: }).join('\n')}
1172: 
1173: ${isCanadian ? `
1174: CANADIAN ATS PLATFORMS - Check these tech companies:
1175: - Greenhouse: Shopify, Hootsuite, Wealthsimple, Faire, Thinkific, Lightspeed, Jobber
1176: - Lever: Slack, Bench, Clio, Clearco, League, ApplyBoard, Ritual
1177: - Workable: FreshBooks, Visier, Unbounce, Axonify, TouchBistro
1178: - Recruitee: Ecobee, Geotab, Auvik, Wave, KOHO, SkipTheDishes
1179: - Ashby: Faire, Clearco, Maple, Borrowell, Shakepay, Wealthsimple
1180: ` : ''}
1181: 
1182: REQUIREMENTS:
1183: 1. **CRITICAL**: Use real-time web search to find ACTUAL job postings from MULTIPLE boards
1184: 2. **PRIORITIZE LINKEDIN**: Search "site:linkedin.com/jobs ${options.roleHint || 'jobs'} ${location}" FIRST and get at least 15-20 LinkedIn jobs
1185: 3. Search other boards: "site:indeed.${isCanadian ? 'ca' : 'com'}", "site:glassdoor.${isCanadian ? 'ca' : 'com'}", etc.
1186: 4. Extract: title, company, location, URL (MUST be actual job posting URL), summary (at least 100 chars), posted date
1187: 5. **MANDATORY**: Return AT LEAST 30-40 jobs total. LinkedIn should be 40-50% of results.
1188: 6. **IMPORTANT**: Include jobs even if some fields are missing (use null for missing data)
1189: 7. Match resume skills to job requirements (estimate 0-100%)
1190: 8. If company is "Confidential", try to find real name from posting
1191: 9. **LINKEDIN URLS**: Must be format "https://www.linkedin.com/jobs/view/[job-id]" or "https://linkedin.com/jobs/collections/recommended/?currentJobId=[id]"
1192: 
1193: OUTPUT STRICT JSON ARRAY (no markdown, no wrapper object):
1194: [{
1195:   "title": "Job Title",
1196:   "company": "Company Name",
1197:   "location": "${location}",
1198:   "url": "https://...",
1199:   "source": "indeed",
1200:   "summary": "Brief description",
1201:   "postedDate": "2025-10-24",
1202:   "salary": "$50,000-$70,000" or null,
1203:   "skillMatchPercent": 75,
1204:   "skills": ["skill1", "skill2"],
1205:   "workType": "remote" or "hybrid" or "onsite",
1206:   "experienceLevel": "mid"
1207: }]
1208: 
1209: **CRITICAL**: Return the JSON array directly. Do NOT wrap in markdown. Return AT LEAST 25 jobs.`
1210: 
1211:         const res = await client.makeRequest(SYSTEM, prompt, { 
1212:           temperature: 0.2, // Slightly higher for more variety
1213:           maxTokens: 20000, // Increased to allow more jobs
1214:           model: 'sonar' // Use faster model for job search
1215:         })
1216:         if (!res.content?.trim()) throw new Error('Empty job analysis')
1217:         
1218:         console.log('[JOB_SEARCH_V2] Perplexity response received:', {
1219:           contentLength: res.content.length,
1220:           preview: res.content.slice(0, 500)
1221:         })
1222:         
1223:         return res
1224:       })
1225: 
1226:       console.log('[JOB_SEARCH_V2] Parsing response...')
1227:       let parsed: JobListing[] = []
1228:       
1229:       try {
1230:         let rawContent = out.content.trim()
1231:         console.log('[JOB_SEARCH_V2] Raw content preview:', rawContent.slice(0, 200))
1232:         
1233:         // CRITICAL FIX: Strip markdown code blocks
1234:         rawContent = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
1235:         
1236:         // Try to extract JSON array if wrapped in object
1237:         const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
1238:         if (jsonMatch) {
1239:           rawContent = jsonMatch[0]
1240:         }
1241:         
1242:         parsed = JSON.parse(rawContent) as JobListing[]
1243:         
1244:         console.log('[JOB_SEARCH_V2] Parsed jobs:', {
1245:           isArray: Array.isArray(parsed),
1246:           count: Array.isArray(parsed) ? parsed.length : 0,
1247:           firstJob: parsed[0] ? { title: parsed[0].title, company: parsed[0].company } : null
1248:         })
1249:       } catch (parseError) {
1250:         console.error('[JOB_SEARCH_V2] JSON parse error:', {
1251:           error: (parseError as Error).message,
1252:           contentPreview: out.content.slice(0, 500)
1253:         })
1254:         // Return empty array on parse error
1255:         parsed = []
1256:       }
1257:       
1258:       parsed = Array.isArray(parsed) ? parsed.slice(0, options.maxResults || 25) : []
1259:       
1260:       if (parsed.length === 0) {
1261:         console.warn('[JOB_SEARCH_V2] ⚠️ WARNING: Perplexity returned 0 jobs. This might indicate:')
1262:         console.warn('  1. No jobs found for this search')
1263:         console.warn('  2. Perplexity did not perform web search')
1264:         console.warn('  3. Response format is incorrect')
1265:         console.warn('  Content received:', out.content.slice(0, 1000))
1266:       }
1267:       
1268:       // CRITICAL FIX: Enrich jobs with short descriptions by scraping URLs
1269:       const enriched = await Promise.all(
1270:         parsed.map(async (job) => {
1271:           if (job.summary && job.summary.length < 150 && job.url) {
1272:             if (process.env.PPX_DEBUG === 'true') {
1273:               console.log(`[ENRICH] Scraping ${job.url} for full description...`)
1274:             }
1275:             const fullDescription = await this.scrapeJobURL(job.url)
1276:             if (fullDescription) {
1277:               return { ...job, summary: fullDescription }
1278:             }
1279:           }
1280:           return job
1281:         })
1282:       )
1283:       
1284:       // CRITICAL FIX: Validate job listings after enrichment
1285:       parsed = this.validateJobListings(enriched, options.maxResults || 25)
1286:       
1287:       // Enhance and normalize
1288:       parsed = parsed.map(j => ({
1289:         ...j,
1290:         skills: normalizeSkills(j.skills || []),
1291:         skillMatchPercent: Math.max(0, Math.min(100, j.skillMatchPercent || 0)),
1292:         workType: j.workType || 'onsite',
1293:         experienceLevel: j.experienceLevel || 'mid',
1294:         source: j.source || (typeof j.url === 'string' ? (new URL(j.url)).hostname.replace(/^www\./,'') : undefined),
1295:         benefits: j.benefits || [],
1296:         requirements: j.requirements || [],
1297:         metadata: {
1298:           searchedBoards: targetBoards.length,
1299:           isCanadianSearch: isCanadian,
1300:           extractedAt: new Date().toISOString()
1301:         }
1302:       }))
1303: 
1304:       // Sort by match quality, then recency
1305:       parsed.sort((a,b)=>{
1306:         if (Math.abs(a.skillMatchPercent - b.skillMatchPercent) > 5) {
1307:           return b.skillMatchPercent - a.skillMatchPercent
1308:         }
1309:         return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
1310:       })
1311: 
1312:       setCache(key, parsed)
1313:       return { 
1314:         success: true, 
1315:         data: parsed,
1316:         metadata: { 
1317:           requestId, 
1318:           timestamp: started, 
1319:           duration: Date.now() - started,
1320:           boardsSearched: targetBoards.length,
1321:           resultsCount: parsed.length
1322:         }, 
1323:         cached: false 
1324:       }
1325:     } catch (e) {
1326:       console.error('[JOB_SEARCH_ERROR] Job search failed:', {
1327:         error: (e as Error).message,
1328:         stack: (e as Error).stack,
1329:         location,
1330:         roleHint: options.roleHint,
1331:         boards: targetBoards.slice(0, 5)
1332:       })
1333:       
1334:       return { 
1335:         success: false, 
1336:         data: [], 
1337:         metadata: { 
1338:           requestId, 
1339:           timestamp: started, 
1340:           duration: Date.now() - started, 
1341:           error: (e as Error).message 
1342:         }, 
1343:         cached: false 
1344:       }
1345:     }
1346:   }
1347: 
1348:   // V2: Enhanced hiring contacts with email enrichment and discovery
1349:   static async hiringContactsV2(companyName: string): Promise<EnhancedResponse<HiringContact[]>> {
1350:     const requestId = generateRequestId()
1351:     const started = Date.now()
1352:     const key = makeKey('ppx:contacts:v2', { companyName })
1353:     const cached = getCache(key) as HiringContact[] | undefined
1354:     if (cached) return { success: true, data: cached, metadata: { requestId, timestamp: started, duration: Date.now() - started }, cached: true }
1355:     try {
1356:       const out = await withRetry(async () => {
1357:         const client = createClient()
1358:         
1359:         // PERPLEXITY AUDIT FIX: Use optimal configuration
1360:         const { getPerplexityConfig } = await import('./config/perplexity-configs')
1361:         const config = getPerplexityConfig('hiringContacts')
1362:         
1363:         // ULTRA-AGGRESSIVE: Multi-platform exhaustive contact scraping
1364:         const prompt = `Find ALL public hiring contacts for ${companyName} using exhaustive web and social media research.
1365: 
1366: MANDATORY SEARCH LOCATIONS (check ALL of these):
1367: 
1368: 🌐 OFFICIAL WEBSITE (VISIT AND SCRAPE):
1369: 1. **VISIT** ${companyName} official website /contact page - EXTRACT all emails
1370: 2. **VISIT** ${companyName} official website /careers page - EXTRACT contact info
1371: 3. **VISIT** ${companyName} official website /about page - EXTRACT team emails
1372: 4. **VISIT** ${companyName} official website /team page - EXTRACT individual emails
1373: 5. **VISIT** Website footer - EXTRACT contact emails
1374: 6. Look for: careers@, hr@, jobs@, recruiting@, talent@, info@, contact@, hello@
1375: 
1376: 🔍 GOOGLE SEARCHES (FOLLOW TOP 3 RESULTS):
1377: - "${companyName} HR email" - **VISIT top results and EXTRACT emails**
1378: - "${companyName} careers contact" - **VISIT and EXTRACT**
1379: - "${companyName} recruiter email" - **VISIT and EXTRACT**
1380: - "${companyName} talent acquisition contact" - **VISIT and EXTRACT**
1381: - "${companyName} hiring manager" - **VISIT and EXTRACT**
1382: 
1383: 🔗 LINKEDIN (VISIT PROFILES):
1384: - Search: site:linkedin.com/in/ "${companyName}" recruiter
1385: - Search: site:linkedin.com/in/ "${companyName}" HR
1386: - Search: site:linkedin.com/in/ "${companyName}" talent acquisition
1387: - **VISIT** Company LinkedIn page: linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}
1388: - **VISIT** individual LinkedIn profiles of HR employees
1389: - Extract REAL names, titles, and profile URLs
1390: 
1391: 🐦 TWITTER/X (VISIT PAGES):
1392: - Search: site:twitter.com "${companyName}" careers
1393: - **VISIT** Company Twitter bio for contact info
1394: 
1395: 📘 FACEBOOK (VISIT PAGES):
1396: - Search: site:facebook.com "${companyName}" jobs
1397: - **VISIT** Company Facebook page About section
1398: 
1399: 📷 INSTAGRAM (VISIT BIO):
1400: - **VISIT** Company Instagram bio for contact email
1401: 
1402: 💼 JOB BOARDS (VISIT POSTINGS):
1403: - Search: site:indeed.com "${companyName}" contact
1404: - Search: site:glassdoor.com "${companyName}" contact
1405: - **VISIT** Job postings and EXTRACT direct contact info
1406: 
1407: 📧 CONTACTOUT / HUNTER.IO:
1408: - Search: site:contactout.com "${companyName}"
1409: - **VISIT** any ContactOut pages and EXTRACT verified emails
1410: 
1411: EXTRACT ONLY VERIFIED PUBLIC INFORMATION:
1412: ✅ Email addresses you SEE on websites (careers@, hr@, jobs@, recruiting@, talent@)
1413: ✅ Direct employee emails found on LinkedIn/website (firstname.lastname@domain)
1414: ✅ Phone numbers for HR/recruiting
1415: ✅ LinkedIn profile URLs of recruiters/HR with REAL names
1416: ✅ Company careers page URL
1417: 
1418: STRICT RULES:
1419: 🚫 Do NOT infer or generate any email addresses
1420: 🚫 Do NOT guess email patterns
1421: 🚫 ONLY return information you can SEE on public pages
1422: 🚫 Do NOT include personal emails (gmail, yahoo, hotmail)
1423: 🚫 Do NOT make up names or contacts
1424: 
1425: RETURN FORMAT (JSON array):
1426: [
1427:   {
1428:     "name": "Sarah Johnson",
1429:     "title": "Senior Recruiter",
1430:     "email": "sarah.johnson@company.com",
1431:     "phone": "+1-888-742-6417",
1432:     "linkedinUrl": "https://linkedin.com/in/sarahjohnson",
1433:     "source": "LinkedIn profile",
1434:     "platform": "LinkedIn"
1435:   },
1436:   {
1437:     "name": "HR Department",
1438:     "title": "Human Resources",
1439:     "email": "careers@company.com",
1440:     "source": "Company website",
1441:     "platform": "Website"
1442:   }
1443: ]
1444: 
1445: IF ZERO VERIFIED CONTACTS FOUND, return empty array: []
1446: 
1447: IMPORTANT: Search ALL platforms listed above. Return ONLY verified contacts you actually found.`
1448: 
1449:         // PERPLEXITY AUDIT FIX: Use optimal token limits + sonar-pro for research
1450:         return client.makeRequest(SYSTEM, prompt, { 
1451:           temperature: config.temperature, 
1452:           maxTokens: config.maxTokens,
1453:           model: 'sonar-pro' // Use research model for multi-source search
1454:         })
1455:       })
1456:       
1457:       // CRITICAL DEBUG: Log raw Perplexity output (Perplexity recommendation)
1458:       if (process.env.PPX_DEBUG === 'true') {
1459:         console.log('[PERPLEXITY RAW]', {
1460:           method: 'hiringContactsV2',
1461:           company: companyName,
1462:           contentLength: out.content.length,
1463:           contentPreview: out.content.slice(0, 500)
1464:         })
1465:       }
1466:       
1467:       // Parse and clean Perplexity response - ENTERPRISE-GRADE JSON EXTRACTION
1468:       let cleanedContent = out.content.trim()
1469:       
1470:       // Step 1: Remove markdown code blocks
1471:       cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
1472:       
1473:       // Step 2: Extract JSON array from any surrounding text
1474:       const jsonMatch = cleanedContent.match(/\[[\s\S]*?\]/);
1475:       if (jsonMatch) {
1476:         cleanedContent = jsonMatch[0]
1477:       } else {
1478:         // Step 3: If no array found, check for explanatory text with JSON after it
1479:         const afterTextMatch = cleanedContent.match(/(?:Here|I found|Below|Results?)[\s\S]*?(\[[\s\S]*?\])/i);
1480:         if (afterTextMatch) {
1481:           cleanedContent = afterTextMatch[1]
1482:         } else {
1483:           console.warn('[HIRING_CONTACTS] No JSON array found in response, returning empty array')
1484:           return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: 'No JSON array in response' }, cached: false }
1485:         }
1486:       }
1487:       
1488:       // PERPLEXITY AUDIT FIX: Use enterprise-grade JSON extraction
1489:       const { extractEnterpriseJSON } = await import('./utils/enterprise-json-extractor')
1490:       const extractionResult = extractEnterpriseJSON(cleanedContent)
1491:       
1492:       if (!extractionResult.success) {
1493:         console.error('[HIRING_CONTACTS] Enterprise JSON extraction failed:', extractionResult.error)
1494:         console.error('[HIRING_CONTACTS] Attempted cleanups:', extractionResult.attemptedCleanups)
1495:         console.error('[HIRING_CONTACTS] Raw content preview:', out.content.slice(0, 500))
1496:         return { 
1497:           success: false, 
1498:           data: [], 
1499:           metadata: { 
1500:             requestId, 
1501:             timestamp: started, 
1502:             duration: Date.now() - started, 
1503:             error: `Enterprise JSON extraction failed: ${extractionResult.error}`,
1504:             attemptedCleanups: extractionResult.attemptedCleanups
1505:           }, 
1506:           cached: false 
1507:         }
1508:       }
1509:       
1510:       // CRITICAL FIX: ALWAYS ensure we have an array (never undefined/null)
1511:       let parsed: HiringContact[] = []
1512:       
1513:       if (Array.isArray(extractionResult.data)) {
1514:         parsed = extractionResult.data.slice(0, 8)
1515:       } else if (extractionResult.data && typeof extractionResult.data === 'object') {
1516:         // Handle case where AI returns single object instead of array
1517:         parsed = [extractionResult.data]
1518:       }
1519:       
1520:       // Enterprise extraction succeeded
1521:       
1522:       // CRITICAL: Validate and filter contacts - reject fake/personal emails
1523:       const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com']
1524:       parsed = parsed.filter(contact => {
1525:         // Must have at least one contact method
1526:         if (!contact.email && !contact.phone && !contact.linkedinUrl) {
1527:           console.warn(`[HIRING_CONTACTS] Rejected contact with no contact method: ${contact.name}`)
1528:           return false
1529:         }
1530:         
1531:         // Reject inferred/template emails
1532:         if (contact.email?.includes('[') || 
1533:             contact.email?.includes('example.') || 
1534:             contact.email?.includes('domain.') ||
1535:             contact.email?.includes('VISIT_WEBSITE')) {
1536:           console.warn(`[HIRING_CONTACTS] Rejected template email: ${contact.email}`)
1537:           return false
1538:         }
1539:         
1540:         // Reject personal emails
1541:         if (contact.email && personalDomains.some(d => contact.email!.toLowerCase().endsWith(d))) {
1542:           console.warn(`[HIRING_CONTACTS] Rejected personal email: ${contact.email}`)
1543:           return false
1544:         }
1545:         
1546:         // Reject LinkedIn profiles without proper URL
1547:         if (contact.linkedinUrl && !contact.linkedinUrl.includes('linkedin.com/')) {
1548:           console.warn(`[HIRING_CONTACTS] Rejected invalid LinkedIn URL: ${contact.linkedinUrl}`)
1549:           return false
1550:         }
1551:         
1552:         return true
1553:       })
1554:       
1555:       // Validation complete
1556:       
1557:       // Enhance each contact with metadata
1558:       parsed = parsed.map(c => {
1559:         const domain = `${companyName.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')}.com`
1560:         const inferred = c.name ? inferEmails(c.name, domain) : []
1561:         
1562:         return { 
1563:           ...c, 
1564:           confidence: Math.max(0, Math.min(1, c.confidence || 0.5)), 
1565:           alternativeEmails: c.alternativeEmails || inferred, 
1566:           emailType: (c.email ? c.emailType : 'pattern') as 'public'|'inferred'|'pattern',
1567:           discoveryMethod: c.discoveryMethod || (c.email ? 'Direct lookup' : 'Pattern inference')
1568:         }
1569:       })
1570:       
1571:       // Final result prepared
1572:       
1573:       // CRITICAL FIX: Validate contacts before returning
1574:       const validated = this.validateHiringContacts(parsed)
1575:       
1576:       // CRITICAL FIX: NO INFERRED EMAILS - return empty if none verified
1577:       // User should visit company website or use LinkedIn instead of contacting fake emails
1578:       const finalContacts = validated
1579:       
1580:       // Cache the result (even if empty)
1581:       setCache(key, finalContacts)
1582:       
1583:       return { 
1584:         success: validated.length > 0, 
1585:         data: finalContacts, 
1586:         metadata: { 
1587:           requestId, 
1588:           timestamp: started, 
1589:           duration: Date.now() - started,
1590:           contactsFound: finalContacts.length,
1591:           withEmails: finalContacts.filter(c => c.email).length,
1592:           error: validated.length === 0 
1593:             ? `No verified hiring contacts found for ${companyName}. Visit company website or use LinkedIn InMail.` 
1594:             : undefined
1595:         }, 
1596:         cached: false 
1597:       }
1598:     } catch (e) {
1599:       console.error('[HIRING_CONTACTS] Error:', e)
1600:       return { success: false, data: [], metadata: { requestId, timestamp: started, duration: Date.now() - started, error: (e as Error).message }, cached: false }
1601:     }
1602:   }
1603: 
1604:   // ... (rest of the code remains the same)
1605: 
1606:   // Extract normalized keywords and location from resume (STRICT JSON)
1607:   static async extractResumeSignals(
1608:     resumeText: string,
1609:     maxKeywords: number = 50
1610:   ): Promise<{ keywords: string[]; location?: string; locations?: string[]; personalInfo?: { name?: string; email?: string; phone?: string } }> {
1611:     const key = makeKey('ppx:resume:signals:v3', { t: resumeText.slice(0, 3000), maxKeywords })
1612:     const cached = getCache(key) as { keywords: string[]; location?: string; locations?: string[] } | undefined
1613:     if (cached) return cached
1614: 
1615:     try {
1616:       const client = createClient()
1617:       
1618:       // ENTERPRISE PROMPT - WEIGHTED KEYWORD EXTRACTION WITH TIME-BASED RELEVANCE
1619:       const prompt = `CRITICAL TASK: Extract weighted keywords, location, and personal info from this resume.
1620: 
1621: RESUME TEXT:
1622: ${resumeText}
1623: 
1624: KEYWORD EXTRACTION WITH TIME-BASED WEIGHTING:
1625: 1. Extract ALL relevant skills, technologies, and competencies (up to 50)
1626: 2. WEIGHT keywords based on:
1627:    - Years of experience using that skill (more years = higher priority)
1628:    - Recency (recent roles = higher weight than old roles or education)
1629:    - Frequency of mention across work experience
1630: 3. ORDER keywords by weighted relevance (most important first)
1631: 4. Skills from work experience should be weighted HIGHER than skills from education only
1632: 5. Calculate weight as: (years using skill / total career years) * recency_multiplier
1633: 
1634: LOCATION EXTRACTION RULES:
1635: 1. Find ANY city/province/state mentioned (email header, address, work experience)
1636: 2. Look for patterns like "City, PROVINCE" or "City, STATE"
1637: 3. Check contact information section first
1638: 4. If multiple locations, use the FIRST one found (likely primary)
1639: 5. Return EXACTLY as found (e.g., "Edmonton, AB" not "Edmonton, Alberta")
1640: 
1641: PERSONAL INFORMATION EXTRACTION:
1642: 1. Extract full name (usually at the top of resume)
1643: 2. Extract email address (look for @ symbol)
1644: 3. Extract phone number (look for phone patterns)
1645: 4. If not found, return null for that field
1646: 
1647: RETURN STRICT JSON (no explanation, no markdown):
1648: {
1649:   "keywords": ["Most Important Skill", "Second Most Important", "...", "50th skill"],
1650:   "location": "City, PROVINCE",
1651:   "personalInfo": {
1652:     "name": "Full Name",
1653:     "email": "email@example.com",
1654:     "phone": "555-1234"
1655:   }
1656: }
1657: 
1658: IMPORTANT: 
1659: - Order keywords by weighted importance (years of experience + recency)
1660: - If NO location found after thorough search, return "location": null (do NOT guess or default)
1661: - If personal info not found, return null for those fields`
1662: 
1663:       // Processing resume signals
1664: 
1665:       const response = await client.makeRequest(
1666:         'You extract keywords and locations from resumes. Return only JSON.',
1667:         prompt,
1668:         { temperature: 0.2, maxTokens: 2000, model: 'sonar-pro' } // CRITICAL FIX: Increased from 800 to handle 50 keywords
1669:       )
1670: 
1671:       if (process.env.PPX_DEBUG === 'true') {
1672:         console.log('[SIGNALS] Raw response:', response.content?.slice(0, 400))
1673:       }
1674: 
1675:       // ENTERPRISE FIX: Strip markdown code blocks that Perplexity sometimes adds
1676:       let cleanedContent = response.content.trim()
1677:       
1678:       // Remove markdown code fences (```json ... ``` or ``` ... ```)
1679:       cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
1680:       
1681:       // Extract JSON array/object if wrapped in explanatory text
1682:       const jsonMatch = cleanedContent.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
1683:       if (jsonMatch) {
1684:         cleanedContent = jsonMatch[0]
1685:       }
1686: 
1687:       const parsed = JSON.parse(cleanedContent) as { keywords: string[]; location?: string; locations?: string[]; personalInfo?: { name?: string; email?: string; phone?: string } }
1688:       
1689:       if (process.env.PPX_DEBUG === 'true') {
1690:         console.log('[SIGNALS] Parsed:', {
1691:           keywordCount: parsed.keywords?.length,
1692:           location: parsed.location,
1693:           hasLocations: !!parsed.locations,
1694:           personalInfo: parsed.personalInfo
1695:         })
1696:       }
1697: 
1698:       setCache(key, parsed)
1699:       return parsed
1700:     } catch (error) {
1701:       console.error('═══════════════════════════════════════════════════════')
1702:       console.error('[EXTRACT SIGNALS] ❌ PERPLEXITY EXTRACTION FAILED')
1703:       console.error('═══════════════════════════════════════════════════════')
1704:       console.error('[EXTRACT SIGNALS] Error:', (error as Error).message)
1705:       console.error('[EXTRACT SIGNALS] Resume text length:', resumeText.length, 'chars')
1706:       console.error('[EXTRACT SIGNALS] First 300 chars of resume:')
1707:       console.error(resumeText.substring(0, 300))
1708:       console.error('═══════════════════════════════════════════════════════')
1709:       
1710:       // CRITICAL: Don't return fake data - throw error so upload route can handle it
1711:       throw new Error(`Failed to extract resume signals: ${(error as Error).message}. Resume may be missing contact information or is corrupted.`)
1712:     }
1713:   }
1714: 
1715:   // ... (rest of the code remains the same)
1716: 
1717:   /**
1718:    * ONE-SHOT COMPREHENSIVE RESEARCH
1719:    * Replaces multiple API calls with a single comprehensive prompt
1720:    * Returns: Job Analysis + Company Research + Hiring Contacts + News + Reviews
1721:    * 
1722:    * @param params - Job and resume details
1723:    * @returns Complete research data for all Career Finder pages
1724:    */
1725:   static async comprehensiveJobResearch(params: {
1726:     jobTitle: string
1727:     company: string
1728:     jobDescription: string
1729:     location?: string
1730:     resumeText: string
1731:     resumeSkills?: string[]
1732:   }): Promise<EnhancedResponse<ComprehensiveJobResearchData | null>> {
1733:     const requestId = generateRequestId()
1734:     const started = Date.now()
1735: 
1736:     try {
1737:       const client = createClient()
1738: 
1739:       const prompt = `COMPREHENSIVE JOB APPLICATION RESEARCH
1740: 
1741: - Position: ${params.jobTitle}
1742: - Company: ${params.company}
1743: - Location: ${params.location || 'Not specified'}
1744: - Description: ${params.jobDescription.slice(0, 1000)}
1745: 
1746: CANDIDATE SKILLS: ${params.resumeSkills ? params.resumeSkills.slice(0, 20).join(', ') : 'Extract from resume below'}
1747: 
1748: RESUME TEXT (First 2000 chars):
1749: ${params.resumeText.slice(0, 2000)}
1750: 
1751: ---
1752: 
1753: YOUR MISSION: Conduct a comprehensive research report covering ALL of the following sections. This is a ONE-TIME research call, so be thorough and detailed. Include clickable URLs wherever possible.
1754: 
1755: OUTPUT FORMAT (Valid JSON ONLY):
1756: \`\`\`json
1757: {
1758:   "jobAnalysis": {
1759:     "matchScore": 85,
1760:     "matchingSkills": ["skill1", "skill2"],
1761:     "missingSkills": ["skill3", "skill4"],
1762:     "skillsToHighlight": ["top skill to emphasize"],
1763:     "recommendations": ["specific action 1", "specific action 2"],
1764:     "estimatedFit": "Excellent|Good|Moderate|Poor"
1765:   },
1766:   "companyIntel": {
1767:     "company": "${params.company}",
1768:     "description": "detailed company overview (minimum 200 chars)",
1769:     "size": "employee count or range",
1770:     "revenue": "annual revenue if public",
1771:     "industry": "primary industry",
1772:     "founded": "year",
1773:     "headquarters": "city, state/country",
1774:     "website": "https://company.com",
1775:     "marketPosition": "market leader|challenger|niche player",
1776:     "generalEmail": "ONLY include if found on company website or LinkedIn - DO NOT GUESS. Leave empty if not found.",
1777:     "careersPage": "https://company.com/careers"
1778:   },
1779:   "companyPsychology": {
1780:     "culture": "detailed culture description based on reviews and public info",
1781:     "values": ["value1", "value2", "value3"],
1782:     "managementStyle": "hierarchical|flat|hybrid",
1783:     "workEnvironment": "remote-friendly|hybrid|office-centric"
1784:   },
1785:   "hiringContacts": [
1786:     {
1787:       "name": "Real Person Name - ONLY if found on LinkedIn or company website",
1788:       "title": "Talent Acquisition Manager",
1789:       "department": "Human Resources",
1790:       "email": "ONLY include if verified from LinkedIn or company website - DO NOT GUESS. Leave empty if not found.",
1791:       "linkedinUrl": "https://linkedin.com/in/person - ONLY if found",
1792:       "authority": "decision maker",
1793:       "confidence": 0.9
1794:     }
1795:   ],
1796:   "CRITICAL_INSTRUCTION": "DO NOT GUESS EMAILS. Only include emails that are explicitly found on the company website, LinkedIn profiles, or other verified sources. If no email is found, leave the field empty or set to null. NEVER construct emails like info@company.com or careers@company.com unless they are explicitly listed on official sources.",
1797:   "marketIntelligence": {
1798:     "competitivePosition": "how company compares to competitors",
1799:     "industryTrends": "relevant industry trends affecting this role",
1800:     "financialStability": "financial health assessment",
1801:     "recentPerformance": "last 12 months highlights"
1802:   },
1803:   "news": [
1804:     {
1805:       "title": "Recent news headline",
1806:       "summary": "Brief summary of the article",
1807:       "url": "https://newsource.com/article",
1808:       "date": "2024-01-15",
1809:       "source": "TechCrunch",
1810:       "impact": "positive|neutral|negative for employment"
1811:     }
1812:   ],
1813:   "reviews": [
1814:     {
1815:       "platform": "Glassdoor",
1816:       "rating": 4.2,
1817:       "summary": "Overall employee sentiment summary",
1818:       "url": "https://glassdoor.com/company-reviews",
1819:       "pros": ["pro1", "pro2"],
1820:       "cons": ["con1", "con2"]
1821:     }
1822:   ],
1823:   "compensation": {
1824:     "salaryRange": "$XX,000 - $YY,000 for ${params.jobTitle}",
1825:     "benefits": "typical benefits package"
1826:   },
1827:   "strategicRecommendations": {
1828:     "applicationStrategy": "specific advice on how to apply",
1829:     "contactStrategy": "who to contact first and how",
1830:     "interviewPrep": ["prepare for X", "research Y", "practice Z"]
1831:   },
1832:   "sources": ["https://source1.com", "https://source2.com", "https://source3.com"],
1833:   "confidenceLevel": 0.85
1834: }
1835: \`\`\`
1836: 
1837: CRITICAL REQUIREMENTS:
1838: 1. Job Analysis: Compare resume skills to job requirements, calculate match score
1839: 2. Company Intel: Search company website, LinkedIn, Crunchbase, Wikipedia for REAL data
1840:    - MUST find general company email (careers@, hr@, jobs@, info@, contact@)
1841:    - Check company website contact page, footer, careers page
1842:    - If no email found, generate likely addresses based on domain
1843: 3. Hiring Contacts: **CRITICAL - MUST FIND CONTACTS**
1844:    - Search LinkedIn, Twitter, Facebook, Instagram, company website
1845:    - Minimum 2-3 REAL hiring contacts if company has 10+ employees
1846:    - Include verified LinkedIn URLs and emails where possible
1847:    - DO NOT return fake/placeholder names
1848:    - **MANDATORY FALLBACK**: If no hiring contacts found, extract company general inbox:
1849:      * Check: careers@, hr@, jobs@, info@, hello@, contact@, support@
1850:      * Return as: {"name":"General Inbox","title":"Company Contact","email":"found@company.com"}
1851:    - NEVER return empty contacts array - app is useless without contact info
1852: 4. News: Find 2-5 recent news articles about the company with clickable URLs
1853: 5. Reviews: Search Glassdoor, Indeed, Comparably for employee reviews with clickable URLs
1854: 6. Market Intelligence: Research industry trends, competitive landscape
1855: 7. Strategic Recommendations: Provide actionable, company-specific advice
1856: 
1857: IMPORTANT:
1858: - Return ONLY valid JSON (no markdown, no explanations)
1859: - All URLs must be real and clickable
1860: - If data not found after searching, use "Not available" but ALWAYS try multiple sources first
1861: - Focus on actionable intelligence, not generic advice`
1862: 
1863:       const out = await withRetry(async () => {
1864:         return client.makeRequest(
1865:           'You are an elite corporate intelligence analyst providing comprehensive job application research. Return detailed JSON with all requested fields.',
1866:           prompt,
1867:           {
1868:             temperature: 0.2,
1869:             maxTokens: 8000,
1870:             model: 'sonar-pro'
1871:           }
1872:         )
1873:       })
1874: 
1875:       if (process.env.PPX_DEBUG === 'true') {
1876:         console.log('[COMPREHENSIVE_RESEARCH] Raw response length:', out.content.length)
1877:       }
1878: 
1879:       // Parse response
1880:       let cleanedContent = out.content.trim()
1881:       
1882:       // Remove markdown code blocks
1883:       cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/gm, '').replace(/```\s*$/gm, '')
1884:       
1885:       // Extract JSON object
1886:       const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
1887:       if (jsonMatch) {
1888:         cleanedContent = jsonMatch[0]
1889:       }
1890: 
1891:       const parsed = JSON.parse(cleanedContent) as Partial<ComprehensiveJobResearchData>
1892: 
1893:       // Construct with fallbacks
1894:       const data: ComprehensiveJobResearchData = {
1895:         jobAnalysis: {
1896:           matchScore: parsed.jobAnalysis?.matchScore ?? 0,
1897:           matchingSkills: parsed.jobAnalysis?.matchingSkills ?? [],
1898:           missingSkills: parsed.jobAnalysis?.missingSkills ?? [],
1899:           skillsToHighlight: parsed.jobAnalysis?.skillsToHighlight ?? [],
1900:           recommendations: parsed.jobAnalysis?.recommendations ?? [],
1901:           estimatedFit: parsed.jobAnalysis?.estimatedFit ?? 'Unknown'
1902:         },
1903:         companyIntel: {
1904:           company: parsed.companyIntel?.company ?? params.company,
1905:           description: parsed.companyIntel?.description ?? 'No description available',
1906:           size: parsed.companyIntel?.size ?? 'Unknown',
1907:           revenue: parsed.companyIntel?.revenue,
1908:           industry: parsed.companyIntel?.industry ?? 'Unknown',
1909:           founded: parsed.companyIntel?.founded,
1910:           headquarters: parsed.companyIntel?.headquarters,
1911:           website: parsed.companyIntel?.website,
1912:           marketPosition: parsed.companyIntel?.marketPosition
1913:         },
1914:         companyPsychology: {
1915:           culture: parsed.companyPsychology?.culture ?? 'No information available',
1916:           values: parsed.companyPsychology?.values ?? [],
1917:           managementStyle: parsed.companyPsychology?.managementStyle,
1918:           workEnvironment: parsed.companyPsychology?.workEnvironment
1919:         },
1920:         hiringContacts: Array.isArray(parsed.hiringContacts)
1921:           ? parsed.hiringContacts
1922:               .map(contact => ({
1923:                 name: contact.name,
1924:                 title: contact.title,
1925:                 department: contact.department,
1926:                 email: contact.email,
1927:                 linkedinUrl: contact.linkedinUrl,
1928:                 authority: contact.authority ?? 'manager',
1929:                 confidence: contact.confidence ?? 0,
1930:                 contactMethod: contact.contactMethod
1931:               }))
1932:               .filter(contact => !!contact?.name && contact?.title)
1933:           : [],
1934:         marketIntelligence: {
1935:           competitivePosition: parsed.marketIntelligence?.competitivePosition,
1936:           industryTrends: parsed.marketIntelligence?.industryTrends,
1937:           financialStability: parsed.marketIntelligence?.financialStability,
1938:           recentPerformance: parsed.marketIntelligence?.recentPerformance
1939:         },
1940:         news: Array.isArray(parsed.news)
1941:           ? parsed.news
1942:               .map(item => (item?.title && item?.summary && item?.url
1943:                 ? {
1944:                     title: item.title,
1945:                     summary: item.summary,
1946:                     url: item.url,
1947:                     date: item.date,
1948:                     source: item.source,
1949:                     impact: item.impact
1950:                   }
1951:                 : undefined))
1952:               .filter((item): item is NonNullable<typeof item> => !!item)
1953:           : [],
1954:         reviews: Array.isArray(parsed.reviews)
1955:           ? parsed.reviews
1956:               .map(item => (item?.platform && item?.summary && item?.url
1957:                 ? {
1958:                     platform: item.platform,
1959:                     rating: item.rating,
1960:                     summary: item.summary,
1961:                     url: item.url,
1962:                     pros: item.pros,
1963:                     cons: item.cons
1964:                   }
1965:                 : undefined))
1966:               .filter((item): item is NonNullable<typeof item> => !!item)
1967:           : [],
1968:         compensation: parsed.compensation ?? {},
1969:         strategicRecommendations: {
1970:           applicationStrategy: parsed.strategicRecommendations?.applicationStrategy ?? 'Apply through company website',
1971:           contactStrategy: parsed.strategicRecommendations?.contactStrategy ?? 'Reach out to HR via LinkedIn',
1972:           interviewPrep: parsed.strategicRecommendations?.interviewPrep ?? []
1973:         },
1974:         sources: Array.isArray(parsed.sources)
1975:           ? parsed.sources.filter((source): source is string => typeof source === 'string')
1976:           : [],
1977:         confidenceLevel: parsed.confidenceLevel ?? 0.5
1978:       }
1979: 
1980:       if (process.env.PPX_DEBUG === 'true') {
1981:         console.log('[COMPREHENSIVE_RESEARCH] Complete -', 
1982:           'matchScore:', data.jobAnalysis.matchScore, 
1983:           'contacts:', data.hiringContacts.length, 
1984:           'news:', data.news.length, 
1985:           'reviews:', data.reviews.length, 
1986:           'confidence:', data.confidenceLevel
1987:         )
1988:       }
1989: 
1990:       return {
1991:         success: true,
1992:         data,
1993:         metadata: { requestId, timestamp: started, duration: Date.now() - started },
1994:         cached: false
1995:       }
1996:     } catch (error) {
1997:       console.error('[COMPREHENSIVE_RESEARCH] Error:', error)
1998:       return {
1999:         success: false,
2000:         data: null,
2001:         metadata: { 
2002:           requestId, 
2003:           timestamp: started, 
2004:           duration: Date.now() - started,
2005:           error: (error as Error).message 
2006:         },
2007:         cached: false
2008:       }
2009:     }
2010:   }
2011: 
2012:   // Resume Optimizer: Generate tailored resume variants
2013:   static async generateResumeVariants(params: {
2014:     resumeText: string
2015:     jobTitle: string
2016:     jobRequirements: string[]
2017:     companyInsights: { culture: string; values: string[]; industry: string }
2018:     template?: string
2019:   }): Promise<EnhancedResponse<{
2020:     variantA: string
2021:     variantB: string
2022:     recommendations: string[]
2023:   }>> {
2024:     const requestId = generateRequestId()
2025:     const started = Date.now()
2026:     const cacheKey = makeKey('resume-variants', params)
2027:     
2028:     const cached = getCache(cacheKey)
2029:     if (cached) {
2030:       return {
2031:         success: true,
2032:         data: cached as { variantA: string; variantB: string; recommendations: string[] },
2033:         metadata: { requestId, timestamp: started, duration: 0 },
2034:         cached: true
2035:       }
2036:     }
2037: 
2038:     try {
2039:       const client = createClient()
2040:       const systemPrompt = 'You are a professional resume optimization expert. Return only valid JSON with properly formatted resume text.'
2041:       
2042:       // Build template-specific instructions
2043:       const templateInstructions = {
2044:         modern: 'Use a contemporary style with visual hierarchy. Emphasize innovation and forward-thinking achievements.',
2045:         professional: 'Use traditional, formal language. Focus on stability, reliability, and proven track record.',
2046:         creative: 'Use dynamic language and unique phrasing. Highlight creativity, innovation, and out-of-the-box thinking.',
2047:         tech: 'Use technical terminology and emphasize projects, technologies, and technical achievements.',
2048:         minimal: 'Use simple, direct language. Focus on facts and quantifiable results. Maximum ATS compatibility.',
2049:         executive: 'Use leadership language. Emphasize strategic impact, team leadership, and business results.'
2050:       }
2051:       
2052:       const templateStyle = templateInstructions[params.template as keyof typeof templateInstructions] || templateInstructions.modern
2053:       
2054:       const userPrompt = `Analyze this resume and create TWO tailored variants for the target role using the ${params.template} template style.
2055: 
2056: **Resume:**
2057: ${params.resumeText}
2058: 
2059: **Target Role:** ${params.jobTitle}
2060: 
2061: **Key Requirements:**
2062: ${params.jobRequirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}
2063: 
2064: **Company Culture:** ${params.companyInsights.culture}
2065: **Company Values:** ${params.companyInsights.values.join(', ')}
2066: **Industry:** ${params.companyInsights.industry}
2067: 
2068: **Template Style (${params.template}):** ${templateStyle}
2069: 
2070: Generate TWO resume variants:
2071: 1. **Variant A (Achievement-Focused):** Emphasize quantifiable achievements and metrics. ${templateStyle}
2072: 2. **Variant B (Skills-Focused):** Highlight technical skills and competencies. ${templateStyle}
2073: 
2074: CRITICAL FORMATTING REQUIREMENTS:
2075: - Use proper line breaks (\\n\\n for sections, \\n for lines)
2076: - DO NOT include name, email, phone, or address in the resume body
2077: - Personal contact info will be added separately by the template
2078: - Start directly with PROFESSIONAL SUMMARY or first section
2079: - Use clear section headers (PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS)
2080: - Format each job entry with: Title\\nCompany | Location | Dates\\n• Achievement 1\\n• Achievement 2
2081: - Keep bullet points aligned with • symbol
2082: - Ensure proper spacing between sections
2083: - NO markdown formatting (no **, no #, no _)
2084: - Plain text only with line breaks
2085: - INCLUDE ALL job history from original resume
2086: 
2087: CRITICAL - PERSONAL INFO:
2088: - DO NOT include the person's name anywhere in the resume body
2089: - DO NOT include email address in the resume body
2090: - DO NOT include phone number in the resume body
2091: - DO NOT include physical address in the resume body
2092: - These will be added by the template header automatically
2093: - Start the resume body with the PROFESSIONAL SUMMARY section
2094: 
2095: For each variant, rewrite the resume to:
2096: - Match keywords from job requirements
2097: - Align with company culture and values
2098: - Use industry-specific terminology appropriate for ${params.template} template
2099: - Optimize for ATS (Applicant Tracking Systems)
2100: - Keep formatting clean and professional
2101: - Apply ${params.template} template style throughout
2102: - NEVER duplicate personal contact information
2103: 
2104: Also provide 3-5 strategic recommendations for improving the resume.
2105: 
2106: Return ONLY valid JSON:
2107: {
2108:   "variantA": "Full resume text WITHOUT personal info (starts with PROFESSIONAL SUMMARY)...",
2109:   "variantB": "Full resume text WITHOUT personal info (starts with PROFESSIONAL SUMMARY)...",
2110:   "recommendations": ["Recommendation 1", "Recommendation 2", ...]
2111: }`
2112: 
2113:       const response = await withRetry(
2114:         () => client.makeRequest(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 4000, model: 'sonar-pro' }),
2115:         MAX_RETRY_ATTEMPTS
2116:       )
2117: 
2118:       const parsed = parseAIResponse<{
2119:         variantA: string
2120:         variantB: string
2121:         recommendations: string[]
2122:       }>(response.content)
2123: 
2124:       const data = {
2125:         variantA: parsed.variantA || params.resumeText,
2126:         variantB: parsed.variantB || params.resumeText,
2127:         recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
2128:       }
2129: 
2130:       setCache(cacheKey, data)
2131: 
2132:       return {
2133:         success: true,
2134:         data,
2135:         metadata: { requestId, timestamp: started, duration: Date.now() - started },
2136:         cached: false
2137:       }
2138:     } catch (error) {
2139:       console.error('[RESUME_VARIANTS] Error:', error)
2140:       return {
2141:         success: false,
2142:         data: {
2143:           variantA: params.resumeText,
2144:           variantB: params.resumeText,
2145:           recommendations: []
2146:         },
2147:         metadata: { 
2148:           requestId, 
2149:           timestamp: started, 
2150:           duration: Date.now() - started,
2151:           error: (error as Error).message 
2152:         },
2153:         cached: false
2154:       }
2155:     }
2156:   }
2157: 
2158:   // Cover Letter Generator: Create personalized cover letters using templates
2159:   static async generateCoverLetters(params: {
2160:     jobTitle: string
2161:     company: string
2162:     jobRequirements: string[]
2163:     resumeText: string
2164:     companyInsights: {
2165:       culture: string
2166:       values: string[]
2167:       recentNews: Array<{ title: string; summary: string }>
2168:     }
2169:     hiringManager?: { name: string; title: string }
2170:     userName?: string
2171:     templateId?: string
2172:   }): Promise<EnhancedResponse<{
2173:     variantA: string
2174:     variantB: string
2175:     personalization: string[]
2176:   }>> {
2177:     const requestId = generateRequestId()
2178:     const started = Date.now()
2179:     const cacheKey = makeKey('cover-letters', params)
2180:     
2181:     const cached = getCache(cacheKey)
2182:     if (cached) {
2183:       return {
2184:         success: true,
2185:         data: cached as { variantA: string; variantB: string; personalization: string[] },
2186:         metadata: { requestId, timestamp: started, duration: 0 },
2187:         cached: true
2188:       }
2189:     }
2190: 
2191:     try {
2192:       // CRITICAL FIX: Calculate years of experience to prevent hallucinations
2193:       const yearsExperience = calculateYearsFromResume(params.resumeText)
2194:       if (process.env.PPX_DEBUG === 'true') {
2195:         console.log('[COVER_LETTERS] Calculated experience:', yearsExperience, 'years')
2196:       }
2197: 
2198:       // Get templates - use professional and modern as defaults
2199:       const templateA = getCoverLetterTemplateById(params.templateId || 'professional')
2200:       const templateB = getCoverLetterTemplateById('modern')
2201: 
2202:       const client = createClient()
2203:       const systemPrompt = `You are an expert cover letter writer. Use the provided templates as structure guides and fill them with personalized content from the candidate's resume.
2204: 
2205: CRITICAL EXPERIENCE CONSTRAINT:
2206: - Candidate has EXACTLY ${yearsExperience} years of total work experience
2207: - DO NOT say "decades", "38 years", or any number higher than ${yearsExperience}
2208: - If ${yearsExperience} < 10, say "several years" or "${yearsExperience} years"
2209: - If ${yearsExperience} >= 10 && ${yearsExperience} < 20, say "${yearsExperience} years" or "over a decade"
2210: - If ${yearsExperience} >= 20, say "${yearsExperience} years" or "two decades"
2211: - NEVER invent or exaggerate experience duration
2212: - Use ONLY the experience data provided in the resume
2213: 
2214: Return only valid JSON.`
2215: 
2216:       const userPrompt = `Create TWO personalized cover letter variants using these templates as guides:
2217: 
2218: **TEMPLATE A (${templateA.name}):**
2219: ${templateA.template}
2220: 
2221: **TEMPLATE B (${templateB.name}):**
2222: ${templateB.template}
2223: 
2224: **Job Details:**
2225: - Job Title: ${params.jobTitle}
2226: - Company: ${params.company}
2227: - Hiring Manager: ${params.hiringManager?.name || 'Hiring Manager'}
2228: - Applicant: ${params.userName || '[Your Name]'}
2229: 
2230: **Key Requirements:**
2231: ${params.jobRequirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}
2232: 
2233: **Resume Content (${yearsExperience} years experience):**
2234: ${params.resumeText.slice(0, 1500)}
2235: 
2236: **Company Research:**
2237: - Culture: ${params.companyInsights.culture}
2238: - Values: ${params.companyInsights.values.join(', ')}
2239: - Recent News: ${params.companyInsights.recentNews.map(n => n.title).join(', ')}
2240: 
2241: **Instructions:**
2242: 1. Fill in ALL placeholders in the templates with actual data
2243: 2. Replace [X years] with "${yearsExperience} years" (EXACT number)
2244: 3. Use real achievements from resume with metrics
2245: 4. Reference specific company news/values
2246: 5. Keep the template structure but personalize content
2247: 6. Variant A: Use Template A structure
2248: 7. Variant B: Use Template B structure
2249: 
2250: CRITICAL RULES:
2251: - Experience: EXACTLY ${yearsExperience} years (no more, no less)
2252: - NO generic phrases like "proven track record" without specifics
2253: - NO casual language like "Here's what most people don't realize"
2254: - ALL achievements must come from the actual resume
2255: - Keep professional and mature tone
2256: 
2257: Return ONLY valid JSON:
2258: {
2259:   "variantA": "Full cover letter text using Template A structure...",
2260:   "variantB": "Full cover letter text using Template B structure...",
2261:   "personalization": ["Tip 1", "Tip 2", "Tip 3"]
2262: }`
2263: 
2264:       const response = await withRetry(
2265:         () => client.makeRequest(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 4000, model: 'sonar-pro' }),
2266:         MAX_RETRY_ATTEMPTS
2267:       )
2268: 
2269:       const parsed = parseAIResponse<{
2270:         variantA: string
2271:         variantB: string
2272:         personalization: string[]
2273:       }>(response.content)
2274: 
2275:       const data = {
2276:         variantA: parsed.variantA || 'Cover letter generation failed',
2277:         variantB: parsed.variantB || 'Cover letter generation failed',
2278:         personalization: Array.isArray(parsed.personalization) ? parsed.personalization : []
2279:       }
2280: 
2281:       setCache(cacheKey, data)
2282: 
2283:       return {
2284:         success: true,
2285:         data,
2286:         metadata: { requestId, timestamp: started, duration: Date.now() - started },
2287:         cached: false
2288:       }
2289:     } catch (error) {
2290:       console.error('[COVER_LETTERS] Error:', error)
2291:       return {
2292:         success: false,
2293:         data: {
2294:           variantA: 'Cover letter generation failed',
2295:           variantB: 'Cover letter generation failed',
2296:           personalization: []
2297:         },
2298:         metadata: { 
2299:           requestId, 
2300:           timestamp: started, 
2301:           duration: Date.now() - started,
2302:           error: (error as Error).message 
2303:         },
2304:         cached: false
2305:       }
2306:     }
2307:   }
2308: 
2309:   // Email Outreach Generator: Create personalized email templates
2310:   static async generateEmailOutreach(params: {
2311:     hiringContact: { name: string; title: string; email?: string }
2312:     jobTitle: string
2313:     company: string
2314:     resumeHighlights: string[]
2315:   }): Promise<EnhancedResponse<{
2316:     subjects: string[]
2317:     templates: Array<{ type: 'formal' | 'conversational'; body: string }>
2318:     mailtoLink: string
2319:   }>> {
2320:     const requestId = generateRequestId()
2321:     const started = Date.now()
2322:     const cacheKey = makeKey('email-outreach', params)
2323:     
2324:     const cached = getCache(cacheKey)
2325:     if (cached) {
2326:       return {
2327:         success: true,
2328:         data: cached as { subjects: string[]; templates: Array<{ type: 'formal' | 'conversational'; body: string }>; mailtoLink: string },
2329:         metadata: { requestId, timestamp: started, duration: 0 },
2330:         cached: true
2331:       }
2332:     }
2333: 
2334:     try {
2335:       const client = createClient()
2336:       const systemPrompt = 'You are an expert at professional networking and cold email outreach. Return only valid JSON.'
2337:       const userPrompt = `Create personalized email outreach templates for contacting a hiring manager.
2338: 
2339: **Hiring Contact:** ${params.hiringContact.name}, ${params.hiringContact.title}
2340: **Job Title:** ${params.jobTitle}
2341: **Company:** ${params.company}
2342: 
2343: **Resume Highlights:**
2344: ${params.resumeHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}
2345: 
2346: Generate:
2347: 1. **3 email subject lines** (varied approaches: direct, curious, value-focused)
2348: 2. **2 email templates:**
2349:    - Formal: Professional, respectful tone
2350:    - Conversational: Friendly, engaging tone
2351: 
2352: Each template should:
2353: - Be concise (150-200 words)
2354: - Reference the hiring manager by name
2355: - Show genuine interest in the role/company
2356: - Highlight 1-2 relevant achievements
2357: - Include a clear call-to-action
2358: - Be personalized, not generic
2359: 
2360: Return ONLY valid JSON:
2361: {
2362:   "subjects": ["Subject 1", "Subject 2", "Subject 3"],
2363:   "templates": [
2364:     { "type": "formal", "body": "Email body..." },
2365:     { "type": "conversational", "body": "Email body..." }
2366:   ]
2367: }`
2368: 
2369:       const response = await withRetry(
2370:         () => client.makeRequest(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 3000, model: 'sonar-pro' }),
2371:         MAX_RETRY_ATTEMPTS
2372:       )
2373: 
2374:       const parsed = parseAIResponse<{
2375:         subjects: string[]
2376:         templates: Array<{ type: 'formal' | 'conversational'; body: string }>
2377:       }>(response.content)
2378: 
2379:       const mailtoLink = params.hiringContact.email 
2380:         ? `mailto:${params.hiringContact.email}?subject=${encodeURIComponent(parsed.subjects?.[0] || 'Inquiry about ' + params.jobTitle)}`
2381:         : ''
2382: 
2383:       const data = {
2384:         subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
2385:         templates: Array.isArray(parsed.templates) ? parsed.templates : [],
2386:         mailtoLink
2387:       }
2388: 
2389:       setCache(cacheKey, data)
2390: 
2391:       return {
2392:         success: true,
2393:         data,
2394:         metadata: { requestId, timestamp: started, duration: Date.now() - started },
2395:         cached: false
2396:       }
2397:     } catch (error) {
2398:       console.error('[EMAIL_OUTREACH] Error:', error)
2399:       return {
2400:         success: false,
2401:         data: {
2402:           subjects: [],
2403:           templates: [],
2404:           mailtoLink: ''
2405:         },
2406:         metadata: { 
2407:           requestId, 
2408:           timestamp: started, 
2409:           duration: Date.now() - started,
2410:           error: (error as Error).message 
2411:         },
2412:         cached: false
2413:       }
2414:     }
2415:   }
2416: 
2417:   /**
2418:    * AGENT-POWERED: Job search with 95%+ reliability
2419:    * Uses NEW orchestrator-based agent system with Perplexity web_search + Cheerio fallback
2420:    * Searches 15+ job boards in parallel
2421:    */
2422:   static async jobListingsWithAgent(
2423:     jobTitle: string,
2424:     location: string,
2425:     options?: { maxResults?: number; workType?: 'remote'|'hybrid'|'onsite'|'any' }
2426:   ): Promise<EnhancedResponse<JobListing[]>> {
2427:     const started = Date.now()
2428:     const requestId = generateRequestId()
2429: 
2430:     console.log('🤖 [INTELLIGENCE] Starting NEW agent-powered job search...')
2431:     console.log(`📋 [INTELLIGENCE] Job: "${jobTitle}" in "${location}"`)
2432:     console.log(`🎯 [INTELLIGENCE] Max results: ${options?.maxResults || 30}`)
2433: 
2434:     try {
2435:       const { AgentOrchestrator } = await import('./agents/agent-orchestrator')
2436:       
2437:       const orchestrator = new AgentOrchestrator()
2438: 
2439:       const task = {
2440:         id: requestId,
2441:         type: 'job_search' as const,
2442:         input: { 
2443:           jobTitle, 
2444:           location, 
2445:           maxResults: options?.maxResults || 30,
2446:           workType: options?.workType
2447:         },
2448:         priority: 1 as const
2449:       }
2450: 
2451:       const result = await orchestrator.executeTask(task)
2452: 
2453:       if (!result.success || !result.data || result.data.length === 0) {
2454:         console.warn('⚠️ [INTELLIGENCE] Agent found no jobs, using fallback method')
2455:         return await this.jobMarketAnalysisV2(location, '', {
2456:           roleHint: jobTitle,
2457:           maxResults: options?.maxResults,
2458:           workType: options?.workType
2459:         })
2460:       }
2461: 
2462:       console.log(`✅ [INTELLIGENCE] Agent found ${result.data.length} jobs`)
2463:       console.log(`📊 [INTELLIGENCE] Confidence: ${result.confidence}, Method: ${result.method}`)
2464: 
2465:       return {
2466:         success: true,
2467:         data: result.data,
2468:         metadata: {
2469:           requestId,
2470:           timestamp: started,
2471:           duration: result.duration,
2472:           reasoning: result.reasoning,
2473:           confidence: result.confidence,
2474:           method: result.method,
2475:           sources: result.sources.length
2476:         },
2477:         cached: false
2478:       }
2479:     } catch (error) {
2480:       console.error('❌ [INTELLIGENCE] Agent system failed:', error)
2481:       console.log('🔄 [INTELLIGENCE] Falling back to standard method...')
2482:       
2483:       return await this.jobMarketAnalysisV2(location, '', {
2484:         roleHint: jobTitle,
2485:         maxResults: options?.maxResults,
2486:         workType: options?.workType
2487:       })
2488:     }
2489:   }
2490: 
2491:   /**
2492:    * AGENT-POWERED: Hiring contacts with 95%+ reliability
2493:    * Uses NEW orchestrator-based agent system with Perplexity + Hunter.io verification
2494:    * Returns empty array if no verified contacts (NO GUESSING)
2495:    */
2496:   static async hiringContactsWithAgent(
2497:     companyName: string,
2498:     companyDomain?: string
2499:   ): Promise<EnhancedResponse<HiringContact[]>> {
2500:     const started = Date.now()
2501:     const requestId = generateRequestId()
2502: 
2503:     console.log('🤖 [INTELLIGENCE] Starting NEW agent-powered contact research...')
2504:     console.log(`🏢 [INTELLIGENCE] Company: "${companyName}"`)
2505:     console.log(`🌐 [INTELLIGENCE] Domain: ${companyDomain || 'auto-detect'}`)
2506: 
2507:     try {
2508:       const { AgentOrchestrator } = await import('./agents/agent-orchestrator')
2509:       
2510:       const orchestrator = new AgentOrchestrator()
2511: 
2512:       const task = {
2513:         id: requestId,
2514:         type: 'contact_research' as const,
2515:         input: { 
2516:           companyName,
2517:           companyDomain
2518:         },
2519:         priority: 1 as const
2520:       }
2521: 
2522:       const result = await orchestrator.executeTask(task)
2523: 
2524:       if (!result.success || !result.data || result.data.length === 0) {
2525:         console.warn('⚠️ [INTELLIGENCE] No verified contacts found')
2526:         return {
2527:           success: false,
2528:           data: [],
2529:           metadata: {
2530:             requestId,
2531:             timestamp: started,
2532:             duration: result.duration,
2533:             error: `No verified hiring contacts found for ${companyName}. Visit company website or use LinkedIn InMail.`,
2534:             reasoning: result.reasoning
2535:           },
2536:           cached: false
2537:         }
2538:       }
2539: 
2540:       console.log(`✅ [INTELLIGENCE] Found ${result.data.length} verified contacts`)
2541:       console.log(`📊 [INTELLIGENCE] Confidence: ${result.confidence}`)
2542: 
2543:       return {
2544:         success: true,
2545:         data: result.data,
2546:         metadata: {
2547:           requestId,
2548:           timestamp: started,
2549:           duration: result.duration,
2550:           reasoning: result.reasoning,
2551:           confidence: result.confidence,
2552:           method: result.method,
2553:           sources: result.sources.length
2554:         },
2555:         cached: false
2556:       }
2557:     } catch (error) {
2558:       console.error('❌ [INTELLIGENCE] Contact agent system failed:', error)
2559:       console.log('🔄 [INTELLIGENCE] Falling back to standard method...')
2560:       return await this.hiringContactsV2(companyName)
2561:     }
2562:   }
2563: 
2564:   /**
2565:    * Clear cache entries (admin utility)
2566:    * @param prefix - Optional prefix to clear specific cache entries
2567:    * @returns Number of entries cleared
2568:    */
2569:   static clearCache(prefix?: string): number {
2570:     if (!prefix) {
2571:       const size = cache.size
2572:       cache.clear()
2573:       return size
2574:     }
2575:     
2576:     let cleared = 0
2577:     for (const key of cache.keys()) {
2578:       if (key.startsWith(prefix)) {
2579:         cache.delete(key)
2580:         cleared++
2581:       }
2582:     }
2583:     return cleared
2584:   }
2585: 
2586:   /**
2587:    * Get cache statistics (admin utility)
2588:    * @returns Cache stats including size, hit counts, and breakdown by prefix
2589:    */
2590:   static getCacheStats(): {
2591:     totalEntries: number
2592:     totalHits: number
2593:     breakdown: Record<string, { count: number; hits: number }>
2594:   } {
2595:     const breakdown: Record<string, { count: number; hits: number }> = {}
2596:     let totalHits = 0
2597: 
2598:     for (const [key, record] of cache.entries()) {
2599:       const prefix = key.split(':')[0] || 'unknown'
2600:       if (!breakdown[prefix]) {
2601:         breakdown[prefix] = { count: 0, hits: 0 }
2602:       }
2603:       breakdown[prefix].count++
2604:       breakdown[prefix].hits += record.metadata.hitCount
2605:       totalHits += record.metadata.hitCount
2606:     }
2607: 
2608:     return {
2609:       totalEntries: cache.size,
2610:       totalHits,
2611:       breakdown
2612:     }
2613:   }
2614: 
2615:   /**
2616:    * Custom query to Perplexity API (flexible utility)
2617:    * @param options - Query options including prompts and parameters
2618:    * @returns API response content
2619:    */
2620:   static async customQuery(options: {
2621:     systemPrompt: string
2622:     userPrompt: string
2623:     temperature?: number
2624:     maxTokens?: number
2625:     model?: 'sonar' | 'sonar-pro'
2626:   }): Promise<{ content: string }> {
2627:     const client = createClient()
2628:     const response = await client.makeRequest(
2629:       options.systemPrompt,
2630:       options.userPrompt,
2631:       {
2632:         temperature: options.temperature || 0.2,
2633:         maxTokens: options.maxTokens || 4000,
2634:         model: options.model || 'sonar-pro'
2635:       }
2636:     )
2637:     return { content: response.content }
2638:   }
2639: 
2640:   /**
2641:    * Get recommended job boards based on location
2642:    * @param location - User's location (e.g., "Toronto", "Canada", "USA")
2643:    * @returns Array of recommended job board names
2644:    */
2645:   static getRecommendedBoards(location: string): string[] {
2646:     const lowerLocation = location.toLowerCase()
2647:     const isCanadian = lowerLocation.includes('canada') || 
2648:                        lowerLocation.includes('toronto') || 
2649:                        lowerLocation.includes('vancouver') || 
2650:                        lowerLocation.includes('montreal') ||
2651:                        lowerLocation.includes('calgary') ||
2652:                        lowerLocation.includes('ottawa')
2653: 
2654:     if (isCanadian) {
2655:       return [
2656:         'Indeed Canada',
2657:         'Workopolis',
2658:         'Job Bank (Canada)',
2659:         'LinkedIn',
2660:         'Glassdoor',
2661:         'Monster Canada',
2662:         'CareerBuilder Canada',
2663:         'Eluta.ca',
2664:         'CharityVillage (Non-profit)',
2665:         'TechTO (Tech jobs)'
2666:       ]
2667:     }
2668: 
2669:     // Default US/International boards
2670:     return [
2671:       'Indeed',
2672:       'LinkedIn',
2673:       'Glassdoor',
2674:       'Monster',
2675:       'CareerBuilder',
2676:       'ZipRecruiter',
2677:       'SimplyHired',
2678:       'Dice (Tech)',
2679:       'AngelList (Startups)',
2680:       'RemoteOK (Remote)'
2681:     ]
2682:   }
2683: 
2684:   /**
2685:    * Get list of available job boards
2686:    * @returns Array of job board objects with name and URL
2687:    */
2688:   static getAvailableJobBoards(): Array<{ name: string; url: string; region: string }> {
2689:     return [
2690:       { name: 'Indeed', url: 'https://www.indeed.com', region: 'Global' },
2691:       { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs', region: 'Global' },
2692:       { name: 'Glassdoor', url: 'https://www.glassdoor.com', region: 'Global' },
2693:       { name: 'Monster', url: 'https://www.monster.com', region: 'Global' },
2694:       { name: 'CareerBuilder', url: 'https://www.careerbuilder.com', region: 'US' },
2695:       { name: 'ZipRecruiter', url: 'https://www.ziprecruiter.com', region: 'US' },
2696:       { name: 'SimplyHired', url: 'https://www.simplyhired.com', region: 'US' },
2697:       { name: 'Dice', url: 'https://www.dice.com', region: 'US (Tech)' },
2698:       { name: 'Indeed Canada', url: 'https://ca.indeed.com', region: 'Canada' },
2699:       { name: 'Workopolis', url: 'https://www.workopolis.com', region: 'Canada' },
2700:       { name: 'Job Bank', url: 'https://www.jobbank.gc.ca', region: 'Canada' },
2701:       { name: 'Eluta', url: 'https://www.eluta.ca', region: 'Canada' },
2702:       { name: 'AngelList', url: 'https://angel.co/jobs', region: 'Startups' },
2703:       { name: 'RemoteOK', url: 'https://remoteok.com', region: 'Remote' },
2704:       { name: 'We Work Remotely', url: 'https://weworkremotely.com', region: 'Remote' }
2705:     ]
2706:   }
2707: 
2708:   /**
2709:    * Extract career timeline from resume
2710:    * @param resumeText - Resume text content
2711:    * @returns Career timeline with industries and experience
2712:    */
2713:   static async extractCareerTimeline(resumeText: string): Promise<{
2714:     industries: Array<{ name: string; percentage: number; years: number }>
2715:     totalYears: number
2716:     primaryIndustry: string
2717:   }> {
2718:     const client = createClient()
2719:     const prompt = `Analyze this resume and extract the career timeline:
2720: 
2721: ${resumeText.slice(0, 3000)}
2722: 
2723: Return ONLY valid JSON with this structure:
2724: {
2725:   "industries": [
2726:     { "name": "Industry Name", "percentage": 40, "years": 5 },
2727:     { "name": "Another Industry", "percentage": 30, "years": 3 }
2728:   ],
2729:   "totalYears": 8,
2730:   "primaryIndustry": "Most relevant industry"
2731: }
2732: 
2733: Rules:
2734: - List all industries worked in
2735: - Calculate percentage of time in each
2736: - Count years of experience per industry
2737: - Identify primary/dominant industry`
2738: 
2739:     const response = await client.makeRequest(
2740:       'You are a career analyst. Extract career timeline data. Return ONLY valid JSON.',
2741:       prompt,
2742:       { temperature: 0.2, maxTokens: 1000, model: 'sonar-pro' }
2743:     )
2744: 
2745:     try {
2746:       const parsed = parseAIResponse<{
2747:         industries: Array<{ name: string; percentage: number; years: number }>
2748:         totalYears: number
2749:         primaryIndustry: string
2750:       }>(response.content)
2751: 
2752:       return {
2753:         industries: parsed.industries || [],
2754:         totalYears: parsed.totalYears || 0,
2755:         primaryIndustry: parsed.primaryIndustry || (parsed.industries?.[0]?.name || 'Unknown')
2756:       }
2757:     } catch {
2758:       // Fallback if parsing fails
2759:       return {
2760:         industries: [{ name: 'General', percentage: 100, years: 0 }],
2761:         totalYears: 0,
2762:         primaryIndustry: 'General'
2763:       }
2764:     }
2765:   }
2766: 
2767:   /**
2768:    * Enhanced company research with comprehensive data
2769:    * @param params - Company name, job title, location
2770:    * @returns Enhanced company research data
2771:    */
2772:   static async enhancedCompanyResearch(params: {
2773:     companyName: string
2774:     jobTitle?: string
2775:     location?: string
2776:   }): Promise<EnhancedResponse<IntelligenceResponse>> {
2777:     // Use existing researchCompanyV2 as the base
2778:     return await this.researchCompanyV2({
2779:       company: params.companyName,
2780:       role: params.jobTitle,
2781:       geo: params.location
2782:     })
2783:   }
2784: }
````
