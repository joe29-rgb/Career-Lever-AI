/**
 * ENTERPRISE-GRADE RESUME FORMATTERS
 * 7 Professional Templates Based on Exact Specifications
 * 
 * CRITICAL: Personal info appears ONCE at top only - NO DUPLICATION
 */

export interface PersonalInfo {
  name?: string
  email?: string
  phone?: string
  location?: string
}

export interface ResumeData {
  personalInfo: PersonalInfo
  bodyText: string // Resume content WITHOUT personal info
}

/**
 * TEMPLATE 1: MINIMAL/CLASSIC (1000028575.jpg)
 * - Single-column, text-only
 * - Georgia/Times New Roman serif
 * - Black text, white background
 * - Horizontal lines under sections
 * - Perfect for ATS systems
 */
export function formatResumeMinimal(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 1in 0.75in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      color: #000000;
      line-height: 1.4;
      background: #FFFFFF;
    }
    .header-name {
      font-size: 24pt;
      font-weight: bold;
      color: #000000;
      margin-bottom: 4pt;
    }
    .header-contact {
      font-size: 10pt;
      color: #000000;
      margin-bottom: 16pt;
    }
    .section-header {
      font-size: 14pt;
      font-weight: bold;
      color: #000000;
      border-bottom: 2px solid #000000;
      margin-top: 16pt;
      margin-bottom: 8pt;
      padding-bottom: 2pt;
    }
    .job-title {
      font-size: 11pt;
      font-weight: bold;
      color: #000000;
      margin-top: 8pt;
    }
    .job-meta {
      font-size: 11pt;
      color: #000000;
      margin-bottom: 4pt;
    }
    .body-text {
      font-size: 11pt;
      color: #000000;
      line-height: 1.4;
      margin-bottom: 4pt;
    }
    .bullet {
      margin-left: 24pt;
      margin-bottom: 4pt;
    }
  </style>
</head>
<body>
  <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
  <div class="header-contact">${[personalInfo.phone, personalInfo.email, personalInfo.location].filter(Boolean).map(v => escapeHtml(v!)).join(' | ')}</div>
  
  ${formatBodyContent(bodyText)}
</body>
</html>`
}

/**
 * TEMPLATE 2: MODERN/PROFESSIONAL (1000028576.jpg)
 * - Two-column with left sidebar
 * - Montserrat/Source Sans Pro
 * - Red section headers (#E32127)
 * - Blue job titles (#0075FF)
 */
export function formatResumeModern(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Montserrat', 'Source Sans Pro', Arial, sans-serif;
      font-size: 11pt;
      color: #333333;
      background: #FFFFFF;
    }
    .container {
      display: flex;
      gap: 0.25in;
    }
    .header {
      margin-bottom: 16pt;
    }
    .header-name {
      font-size: 32pt;
      font-weight: 700;
      color: #000000;
      letter-spacing: -0.5pt;
      margin-bottom: 4pt;
    }
    .header-subtitle {
      font-size: 18pt;
      font-weight: 400;
      color: #000000;
      margin-bottom: 8pt;
    }
    .header-divider {
      border-bottom: 2pt solid #CCCCCC;
      margin-bottom: 16pt;
    }
    .left-column {
      width: 2.5in;
      flex-shrink: 0;
    }
    .right-column {
      flex: 1;
    }
    .section-header {
      font-size: 12pt;
      font-weight: 700;
      color: #E32127;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-top: 20pt;
      margin-bottom: 8pt;
    }
    .section-header-large {
      font-size: 14pt;
      font-weight: 700;
      color: #E32127;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-top: 24pt;
      margin-bottom: 12pt;
    }
    .job-title {
      font-size: 14pt;
      font-weight: 700;
      color: #0075FF;
      margin-top: 8pt;
    }
    .job-meta {
      font-size: 11pt;
      color: #666666;
      margin-bottom: 6pt;
    }
    .body-text {
      font-size: 11pt;
      color: #333333;
      line-height: 1.5;
      margin-bottom: 6pt;
    }
    .contact-item {
      font-size: 11pt;
      color: #333333;
      margin-bottom: 6pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
    <div class="header-divider"></div>
  </div>
  
  <div class="container">
    <div class="left-column">
      <div class="section-header">CONTACT</div>
      ${personalInfo.phone ? `<div class="contact-item">${escapeHtml(personalInfo.phone)}</div>` : ''}
      ${personalInfo.email ? `<div class="contact-item">${escapeHtml(personalInfo.email)}</div>` : ''}
      ${personalInfo.location ? `<div class="contact-item">${escapeHtml(personalInfo.location)}</div>` : ''}
    </div>
    
    <div class="right-column">
      ${formatBodyContent(bodyText, 'modern')}
    </div>
  </div>
</body>
</html>`
}

/**
 * TEMPLATE 3: EXECUTIVE/SIDEBAR (1000028578.jpg)
 * - Narrow left sidebar with blue vertical divider (#4A90E2)
 * - Arial/Helvetica
 * - Icons before section headers
 * - Compact, corporate aesthetic
 */
export function formatResumeExecutive(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #333333;
      background: #FFFFFF;
    }
    .header-name {
      font-size: 28pt;
      font-weight: 700;
      color: #000000;
      margin-bottom: 2pt;
    }
    .header-subtitle {
      font-size: 16pt;
      font-weight: 400;
      color: #000000;
      margin-bottom: 12pt;
    }
    .container {
      display: flex;
      gap: 0.25in;
      border-left: 3pt solid #4A90E2;
      padding-left: 0;
    }
    .left-column {
      width: 2in;
      flex-shrink: 0;
      padding: 16pt 12pt;
      background: #FFFFFF;
    }
    .right-column {
      flex: 1;
      padding: 16pt;
    }
    .section-header {
      font-size: 12pt;
      font-weight: 700;
      color: #000000;
      margin-top: 24pt;
      margin-bottom: 8pt;
    }
    .section-header:first-child {
      margin-top: 0;
    }
    .job-title {
      font-size: 12pt;
      font-weight: 700;
      color: #000000;
      margin-top: 6pt;
    }
    .job-meta {
      font-size: 10pt;
      color: #666666;
      margin-bottom: 4pt;
    }
    .body-text {
      font-size: 10pt;
      color: #333333;
      line-height: 1.4;
      margin-bottom: 4pt;
    }
    .contact-item {
      font-size: 10pt;
      color: #000000;
      margin-bottom: 6pt;
    }
  </style>
</head>
<body>
  <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
  <div class="header-subtitle">${personalInfo.location || ''}</div>
  
  <div class="container">
    <div class="left-column">
      <div class="section-header">Personal Info</div>
      ${personalInfo.phone ? `<div class="contact-item">${escapeHtml(personalInfo.phone)}</div>` : ''}
      ${personalInfo.email ? `<div class="contact-item">${escapeHtml(personalInfo.email)}</div>` : ''}
    </div>
    
    <div class="right-column">
      ${formatBodyContent(bodyText, 'executive')}
    </div>
  </div>
</body>
</html>`
}

/**
 * TEMPLATE 4: CENTERED/ELEGANT (1000028579.jpg)
 * - Single-column, centered header
 * - Garamond/Libre Baskerville serif
 * - Centered contact info with pipes
 * - Justified body text
 */
export function formatResumeCentered(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.75in 1in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Garamond, 'Libre Baskerville', serif;
      font-size: 11pt;
      color: #333333;
      background: #FFFFFF;
      max-width: 6.5in;
      margin: 0 auto;
    }
    .header-name {
      font-size: 28pt;
      font-weight: 700;
      color: #000000;
      text-align: center;
      margin-bottom: 4pt;
    }
    .header-contact {
      font-size: 11pt;
      color: #000000;
      text-align: center;
      margin-bottom: 20pt;
    }
    .section-header {
      font-size: 16pt;
      font-weight: 700;
      color: #000000;
      margin-top: 20pt;
      margin-bottom: 10pt;
    }
    .job-title {
      font-size: 13pt;
      font-weight: 700;
      color: #000000;
      margin-top: 10pt;
    }
    .job-meta {
      font-size: 11pt;
      font-style: italic;
      color: #666666;
      margin-bottom: 6pt;
    }
    .body-text {
      font-size: 11pt;
      color: #333333;
      line-height: 1.6;
      text-align: justify;
      margin-bottom: 6pt;
    }
  </style>
</head>
<body>
  <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
  <div class="header-contact">${[personalInfo.location, personalInfo.phone, personalInfo.email].filter(Boolean).map(v => escapeHtml(v!)).join(' | ')}</div>
  
  ${formatBodyContent(bodyText, 'centered')}
</body>
</html>`
}

/**
 * TEMPLATE 5: MODERN TWO-TONE (1000028580.jpg)
 * - 0.25" teal accent strip (#00A99D) on left
 * - Lato/Roboto
 * - Teal section headers matching strip
 * - Clean, modern with strategic color
 */
export function formatResumeModernTwoTone(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.75in 0.75in 0.75in 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Lato, Roboto, Arial, sans-serif;
      font-size: 11pt;
      color: #333333;
      background: #FFFFFF;
      border-left: 0.25in solid #00A99D;
      padding-left: 0.5in;
    }
    .header-name {
      font-size: 36pt;
      font-weight: 400;
      color: #000000;
      margin-bottom: 2pt;
    }
    .header-subtitle {
      font-size: 18pt;
      font-weight: 300;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 1pt;
      margin-bottom: 16pt;
    }
    .section-header {
      font-size: 14pt;
      font-weight: 700;
      color: #00A99D;
      margin-top: 20pt;
      margin-bottom: 8pt;
    }
    .contact-label {
      font-size: 10pt;
      font-weight: 700;
      color: #000000;
      display: inline;
    }
    .contact-value {
      font-size: 10pt;
      font-weight: 400;
      color: #333333;
      display: inline;
      margin-left: 4pt;
    }
    .contact-item {
      margin-bottom: 6pt;
    }
    .job-title {
      font-size: 13pt;
      font-weight: 700;
      color: #000000;
      margin-top: 8pt;
    }
    .job-meta {
      font-size: 11pt;
      color: #666666;
      margin-bottom: 5pt;
    }
    .body-text {
      font-size: 11pt;
      color: #333333;
      line-height: 1.5;
      margin-bottom: 5pt;
    }
  </style>
</head>
<body>
  <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
  
  <div class="section-header">Contact</div>
  ${personalInfo.phone ? `<div class="contact-item"><span class="contact-label">Phone:</span><span class="contact-value">${escapeHtml(personalInfo.phone)}</span></div>` : ''}
  ${personalInfo.email ? `<div class="contact-item"><span class="contact-label">Email:</span><span class="contact-value">${escapeHtml(personalInfo.email)}</span></div>` : ''}
  ${personalInfo.location ? `<div class="contact-item"><span class="contact-label">Location:</span><span class="contact-value">${escapeHtml(personalInfo.location)}</span></div>` : ''}
  
  ${formatBodyContent(bodyText, 'modern-two-tone')}
</body>
</html>`
}

/**
 * TEMPLATE 6: CREATIVE/BOLD (1000028581.jpg)
 * - HUGE 42pt name in dark teal (#2C5F7C)
 * - Poppins/Raleway
 * - Uppercase section headers with underlines
 * - Bold, eye-catching design
 */
export function formatResumeCreative(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Poppins, Raleway, Arial, sans-serif;
      font-size: 10.5pt;
      color: #333333;
      background: #FFFFFF;
    }
    .header-name {
      font-size: 42pt;
      font-weight: 700;
      color: #2C5F7C;
      margin-bottom: 0;
    }
    .header-divider {
      border-bottom: 2pt solid #2C5F7C;
      margin-top: 12pt;
      margin-bottom: 12pt;
    }
    .section-header {
      font-size: 12pt;
      font-weight: 700;
      color: #2C5F7C;
      margin-bottom: 4pt;
    }
    .contact-item {
      font-size: 10pt;
      color: #333333;
      margin-bottom: 6pt;
    }
    .section-header-main {
      font-size: 14pt;
      font-weight: 700;
      color: #2C5F7C;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      border-bottom: 1pt solid #CCCCCC;
      padding-bottom: 4pt;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    .job-title {
      font-size: 13pt;
      font-weight: 600;
      color: #000000;
      margin-top: 8pt;
    }
    .job-meta {
      font-size: 10pt;
      color: #666666;
      margin-bottom: 5pt;
    }
    .body-text {
      font-size: 10.5pt;
      color: #333333;
      line-height: 1.5;
      margin-bottom: 5pt;
    }
  </style>
</head>
<body>
  <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
  <div class="header-divider"></div>
  
  <div class="section-header">CONTACT</div>
  ${personalInfo.phone ? `<div class="contact-item">${escapeHtml(personalInfo.phone)}</div>` : ''}
  ${personalInfo.email ? `<div class="contact-item">${escapeHtml(personalInfo.email)}</div>` : ''}
  ${personalInfo.location ? `<div class="contact-item">${escapeHtml(personalInfo.location)}</div>` : ''}
  
  ${formatBodyContent(bodyText, 'creative')}
</body>
</html>`
}

/**
 * TEMPLATE 7: TECHNICAL/COMPACT (1000028582.jpg)
 * - White text on teal section backgrounds (#0A5F7C)
 * - Roboto/Source Sans Pro
 * - Dense, compact layout
 * - Maximum content, minimal whitespace
 */
export function formatResumeTechnical(data: ResumeData): string {
  const { personalInfo, bodyText } = data
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Roboto, 'Source Sans Pro', Arial, sans-serif;
      font-size: 10pt;
      color: #333333;
      background: #FFFFFF;
    }
    .header-name {
      font-size: 32pt;
      font-weight: 700;
      color: #0A5F7C;
      margin-bottom: 2pt;
    }
    .header-subtitle {
      font-size: 14pt;
      font-weight: 400;
      color: #333333;
      margin-bottom: 8pt;
    }
    .header-divider {
      border-bottom: 3pt solid #0A5F7C;
      margin-bottom: 8pt;
    }
    .header-contact {
      font-size: 10pt;
      color: #333333;
      margin-bottom: 12pt;
    }
    .section-header {
      font-size: 13pt;
      font-weight: 700;
      color: #FFFFFF;
      background: #0A5F7C;
      padding: 4pt 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5pt;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    .job-title {
      font-size: 12pt;
      font-weight: 700;
      color: #000000;
      margin-top: 6pt;
    }
    .job-meta {
      font-size: 10pt;
      color: #666666;
      margin-bottom: 4pt;
    }
    .body-text {
      font-size: 10pt;
      color: #333333;
      line-height: 1.4;
      margin-bottom: 4pt;
    }
  </style>
</head>
<body>
  <div class="header-name">${escapeHtml(personalInfo.name || '')}</div>
  <div class="header-divider"></div>
  <div class="header-contact">${[personalInfo.location, personalInfo.phone, personalInfo.email].filter(Boolean).map(v => escapeHtml(v!)).join(' | ')}</div>
  
  ${formatBodyContent(bodyText, 'technical')}
</body>
</html>`
}

/**
 * Helper: Format body content with template-specific styling
 */
function formatBodyContent(text: string, template?: string): string {
  if (!text) return ''
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let html = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Section headers (all caps, short)
    if (line.match(/^[A-Z\s]{3,}$/) && line.length < 50) {
      const headerClass = template === 'creative' ? 'section-header-main' : 'section-header'
      html += `<div class="${headerClass}">${escapeHtml(line)}</div>`
    }
    // Bullet points
    else if (line.startsWith('•') || line.startsWith('-')) {
      html += `<div class="body-text" style="margin-left: 24pt;">${escapeHtml(line)}</div>`
    }
    // Job titles (bold if followed by company)
    else if (i < lines.length - 1 && lines[i + 1].includes('|')) {
      html += `<div class="job-title">${escapeHtml(line)}</div>`
    }
    // Company/location/dates line
    else if (line.includes('|')) {
      html += `<div class="job-meta">${escapeHtml(line)}</div>`
    }
    // Regular text
    else {
      html += `<div class="body-text">${escapeHtml(line)}</div>`
    }
  }
  
  return html
}

/**
 * Helper: Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Main dispatcher function
 */
export function formatResumeAsHTML(
  resumeData: ResumeData,
  template: string = 'minimal'
): string {
  const formatters: Record<string, (data: ResumeData) => string> = {
    'minimal': formatResumeMinimal,
    'modern': formatResumeModern,
    'executive': formatResumeExecutive,
    'centered': formatResumeCentered,
    'modern-two-tone': formatResumeModernTwoTone,
    'creative': formatResumeCreative,
    'technical': formatResumeTechnical,
    // Legacy mappings
    'tech': formatResumeExecutive,
    'professional': formatResumeTechnical
  }
  
  const formatter = formatters[template] || formatResumeMinimal
  return formatter(resumeData)
}
