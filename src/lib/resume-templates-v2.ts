/**
 * Professional Resume Templates V2
 * 
 * 7 distinct, beautifully formatted resume templates:
 * 1. Modern (Two-Column with Timeline)
 * 2. Professional (Traditional Single-Column)
 * 3. Creative (Asymmetric with Color Accents)
 * 4. Tech-Focused (Developer/Engineer)
 * 5. Minimal/ATS (Maximum Compatibility)
 * 6. Executive (C-Suite/Director)
 * 7. Curriculum Vitae (Academic/Research)
 */

export interface ResumeData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    github?: string
    website?: string
    summary: string
  }
  experience: Array<{
    id: string
    company: string
    position: string
    location: string
    startDate: string
    endDate: string
    current: boolean
    description: string
    achievements: string[]
    technologies?: string[]
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    location: string
    graduationDate: string
    gpa?: string
    honors?: string[]
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages?: Array<{ language: string; proficiency: string }>
    certifications?: Array<{ name: string; issuer: string; date: string }>
  }
  projects?: Array<{
    id: string
    name: string
    description: string
    technologies: string[]
    url?: string
    github?: string
  }>
}

export interface ResumeTemplate {
  id: string
  name: string
  description: string
  bestFor: string[]
  preview: string
  generate: (data: ResumeData) => string
  css: string
}

/**
 * TEMPLATE 1: MODERN (Two-Column with Timeline)
 */
const modernTemplate: ResumeTemplate = {
  id: 'modern',
  name: 'Modern',
  description: 'Two-column layout with timeline visualization and progress bars',
  bestFor: ['Technology', 'Startups', 'Creative Industries', 'Mid-Level'],
  preview: '/templates/modern-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills } = data;
    
    return `
      <div class="resume-modern">
        <!-- Left Sidebar -->
        <div class="sidebar">
          <div class="avatar-section">
            <div class="avatar-circle">
              ${personalInfo.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <h1 class="name">${personalInfo.fullName}</h1>
          </div>
          
          <div class="contact-section">
            <h2 class="section-header">CONTACT</h2>
            <div class="contact-item">
              <span class="icon">📧</span>
              <span>${personalInfo.email}</span>
            </div>
            <div class="contact-item">
              <span class="icon">📱</span>
              <span>${personalInfo.phone}</span>
            </div>
            <div class="contact-item">
              <span class="icon">📍</span>
              <span>${personalInfo.location}</span>
            </div>
            ${personalInfo.linkedin ? `
              <div class="contact-item">
                <span class="icon">💼</span>
                <span>${personalInfo.linkedin}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="skills-section">
            <h2 class="section-header">SKILLS</h2>
            ${skills.technical.slice(0, 8).map(skill => `
              <div class="skill-item">
                <div class="skill-name">${skill}</div>
                <div class="skill-bar">
                  <div class="skill-progress" style="width: ${Math.floor(Math.random() * 30) + 70}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
          
          ${skills.languages && skills.languages.length > 0 ? `
            <div class="languages-section">
              <h2 class="section-header">LANGUAGES</h2>
              ${skills.languages.map(lang => `
                <div class="language-item">
                  <span class="language-name">${lang.language}</span>
                  <span class="language-level">${lang.proficiency}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <!-- Right Content -->
        <div class="content">
          <div class="summary-section">
            <h2 class="section-header-main">PROFESSIONAL SUMMARY</h2>
            <p class="summary-text">${personalInfo.summary}</p>
          </div>
          
          <div class="experience-section">
            <h2 class="section-header-main">EXPERIENCE</h2>
            ${experience.map((exp, index) => `
              <div class="experience-item">
                <div class="timeline-dot"></div>
                ${index < experience.length - 1 ? '<div class="timeline-line"></div>' : ''}
                <div class="experience-content">
                  <h3 class="job-title">${exp.position}</h3>
                  <div class="company-info">
                    <span class="company-name">${exp.company}</span>
                    <span class="date-range">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <ul class="achievements">
                    ${exp.achievements.map(achievement => `
                      <li>${achievement}</li>
                    `).join('')}
                  </ul>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="education-section">
            <h2 class="section-header-main">EDUCATION</h2>
            ${education.map(edu => `
              <div class="education-item">
                <h3 class="degree">${edu.degree} in ${edu.field}</h3>
                <div class="institution-info">
                  <span class="institution">${edu.institution}</span>
                  <span class="grad-year">${edu.graduationDate}</span>
                </div>
                ${edu.honors && edu.honors.length > 0 ? `
                  <div class="honors">${edu.honors.join(' • ')}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-modern {
      display: flex;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
    }
    
    .sidebar {
      width: 30%;
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      padding: 2rem 1.5rem;
    }
    
    .avatar-section {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      margin: 0 auto 1rem;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .name {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }
    
    .section-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #3b82f6;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #3b82f6;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      font-size: 10px;
      line-height: 1.4;
    }
    
    .icon {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .skill-item {
      margin-bottom: 1rem;
    }
    
    .skill-name {
      font-size: 10px;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }
    
    .skill-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .skill-progress {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    
    .language-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 10px;
    }
    
    .content {
      width: 70%;
      padding: 2rem 2.5rem;
    }
    
    .section-header-main {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1e293b;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 3px solid #3b82f6;
      letter-spacing: 1px;
    }
    
    .summary-text {
      font-size: 11px;
      line-height: 1.6;
      color: #475569;
      margin: 0;
    }
    
    .experience-item {
      position: relative;
      padding-left: 2rem;
      margin-bottom: 2rem;
    }
    
    .timeline-dot {
      position: absolute;
      left: 0;
      top: 5px;
      width: 10px;
      height: 10px;
      background: #3b82f6;
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    
    .timeline-line {
      position: absolute;
      left: 4.5px;
      top: 15px;
      width: 1px;
      height: calc(100% + 1rem);
      background: linear-gradient(180deg, #3b82f6 0%, #cbd5e1 100%);
    }
    
    .job-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }
    
    .company-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    
    .company-name {
      font-size: 11px;
      font-style: italic;
      color: #64748b;
    }
    
    .date-range {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .achievements {
      margin: 0;
      padding-left: 1.25rem;
      list-style-type: disc;
    }
    
    .achievements li {
      font-size: 10px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    
    .education-item {
      margin-bottom: 1.5rem;
    }
    
    .degree {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }
    
    .institution-info {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      margin-bottom: 0.5rem;
    }
    
    .honors {
      font-size: 9px;
      color: #3b82f6;
      font-weight: 500;
    }
    
    @media print {
      .resume-modern {
        min-height: auto;
      }
      .sidebar {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `
};

/**
 * TEMPLATE 2: PROFESSIONAL (Traditional Single-Column)
 */
const professionalTemplate: ResumeTemplate = {
  id: 'professional',
  name: 'Professional',
  description: 'Traditional single-column layout for corporate environments',
  bestFor: ['Corporate', 'Finance', 'Legal', 'Consulting', 'Executive'],
  preview: '/templates/professional-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills } = data;
    
    return `
      <div class="resume-professional">
        <div class="header">
          <h1 class="name">${personalInfo.fullName}</h1>
          <div class="contact-bar">
            <span>${personalInfo.email}</span>
            <span>•</span>
            <span>${personalInfo.phone}</span>
            <span>•</span>
            <span>${personalInfo.location}</span>
            ${personalInfo.linkedin ? `<span>•</span><span>${personalInfo.linkedin}</span>` : ''}
          </div>
          <hr class="divider" />
        </div>
        
        <div class="section">
          <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
          <p class="summary">${personalInfo.summary}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">PROFESSIONAL EXPERIENCE</h2>
          ${experience.map(exp => `
            <div class="experience-entry">
              <div class="entry-header">
                <h3 class="job-title">${exp.position}</h3>
                <span class="date-range">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div class="company-line">
                <span class="company">${exp.company}</span>
                ${exp.location ? `<span class="location">${exp.location}</span>` : ''}
              </div>
              <ul class="achievements">
                ${exp.achievements.map(achievement => `
                  <li>${achievement}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">EDUCATION</h2>
          ${education.map(edu => `
            <div class="education-entry">
              <div class="entry-header">
                <h3 class="degree">${edu.degree}, ${edu.field}</h3>
                <span class="date-range">${edu.graduationDate}</span>
              </div>
              <div class="institution">${edu.institution}, ${edu.location}</div>
              ${edu.gpa ? `<div class="gpa">GPA: ${edu.gpa}</div>` : ''}
              ${edu.honors && edu.honors.length > 0 ? `
                <div class="honors">${edu.honors.join(', ')}</div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="section">
          <h2 class="section-title">SKILLS & COMPETENCIES</h2>
          <div class="skills-grid">
            <div class="skill-category">
              <strong>Technical:</strong> ${skills.technical.join(', ')}
            </div>
            ${skills.soft.length > 0 ? `
              <div class="skill-category">
                <strong>Professional:</strong> ${skills.soft.join(', ')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-professional {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      font-family: 'Times New Roman', Times, serif;
      background: white;
      color: #000;
      line-height: 1.5;
    }
    
    .header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .name {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 0.5rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .contact-bar {
      font-size: 11px;
      color: #333;
      margin-bottom: 0.75rem;
    }
    
    .contact-bar span {
      margin: 0 0.25rem;
    }
    
    .divider {
      border: none;
      border-top: 2px solid #000;
      margin: 0.75rem 0;
    }
    
    .section {
      margin-bottom: 1.5rem;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 0.75rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid #000;
    }
    
    .summary {
      font-size: 11px;
      margin: 0;
      text-align: justify;
    }
    
    .experience-entry,
    .education-entry {
      margin-bottom: 1.25rem;
    }
    
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
    }
    
    .job-title,
    .degree {
      font-size: 12px;
      font-weight: 700;
      margin: 0;
    }
    
    .date-range {
      font-size: 11px;
      color: #555;
      font-style: italic;
    }
    
    .company-line {
      font-size: 11px;
      color: #555;
      font-style: italic;
      margin-bottom: 0.5rem;
    }
    
    .company,
    .institution {
      font-size: 11px;
      color: #555;
      font-style: italic;
    }
    
    .location {
      margin-left: 0.5rem;
    }
    
    .achievements {
      margin: 0.5rem 0 0 1.25rem;
      padding: 0;
      list-style-type: disc;
    }
    
    .achievements li {
      font-size: 11px;
      margin-bottom: 0.25rem;
      line-height: 1.5;
    }
    
    .gpa,
    .honors {
      font-size: 10px;
      color: #555;
      margin-top: 0.25rem;
    }
    
    .skills-grid {
      font-size: 11px;
    }
    
    .skill-category {
      margin-bottom: 0.5rem;
      line-height: 1.6;
    }
    
    .skill-category strong {
      font-weight: 700;
    }
    
    @media print {
      .resume-professional {
        padding: 0.5in;
      }
    }
  `
};

export const resumeTemplates: Record<string, ResumeTemplate> = {
  modern: modernTemplate,
  professional: professionalTemplate,
  // More templates will be added below
};

export function getTemplateById(id: string): ResumeTemplate {
  return resumeTemplates[id] || resumeTemplates.modern;
}

export function getAllTemplates(): ResumeTemplate[] {
  return Object.values(resumeTemplates);
}
