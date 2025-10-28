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

/**
 * TEMPLATE 3: CREATIVE (Asymmetric with Color Accents)
 */
const creativeTemplate: ResumeTemplate = {
  id: 'creative',
  name: 'Creative',
  description: 'Asymmetric layout with bold colors and visual elements',
  bestFor: ['Design', 'Marketing', 'Creative', 'UX/UI', 'Advertising'],
  preview: '/templates/creative-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills, projects } = data;
    
    return `
      <div class="resume-creative">
        <div class="header-creative">
          <h1 class="name-gradient">${personalInfo.fullName}</h1>
          <div class="contact-badges">
            <span class="badge">${personalInfo.email}</span>
            <span class="badge">${personalInfo.phone}</span>
            <span class="badge">${personalInfo.location}</span>
            ${personalInfo.linkedin ? `<span class="badge">LinkedIn</span>` : ''}
          </div>
        </div>
        
        <div class="content-grid">
          <div class="main-column">
            <div class="section-creative">
              <h2 class="section-title-creative">Profile</h2>
              <p class="profile-text">${personalInfo.summary}</p>
            </div>
            
            <div class="section-creative">
              <h2 class="section-title-creative">Experience</h2>
              ${experience.map(exp => `
                <div class="experience-card">
                  <div class="card-header">
                    <h3 class="role">${exp.position}</h3>
                    <span class="period">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div class="company-badge">${exp.company}</div>
                  <ul class="achievements-creative">
                    ${exp.achievements.map(achievement => `
                      <li>${achievement}</li>
                    `).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
            
            ${projects && projects.length > 0 ? `
              <div class="section-creative">
                <h2 class="section-title-creative">Projects</h2>
                ${projects.map(project => `
                  <div class="project-card">
                    <h3 class="project-name">${project.name}</h3>
                    <p class="project-desc">${project.description}</p>
                    <div class="tech-badges">
                      ${project.technologies.map(tech => `
                        <span class="tech-badge">${tech}</span>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="side-column">
            <div class="section-creative">
              <h2 class="section-title-creative">Skills</h2>
              <div class="skill-badges">
                ${skills.technical.map(skill => `
                  <span class="skill-badge-creative">${skill}</span>
                `).join('')}
              </div>
            </div>
            
            <div class="section-creative">
              <h2 class="section-title-creative">Education</h2>
              ${education.map(edu => `
                <div class="education-card">
                  <h3 class="degree-creative">${edu.degree}</h3>
                  <div class="institution-creative">${edu.institution}</div>
                  <div class="year-creative">${edu.graduationDate}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-creative {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
      padding: 2rem;
      min-height: 100vh;
    }
    
    .header-creative {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .name-gradient {
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0 0 0.5rem;
      letter-spacing: -0.5px;
    }
    
    .tagline {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    
    .contact-badges {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .badge {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    
    .content-grid {
      display: grid;
      grid-template-columns: 60% 40%;
      gap: 2rem;
    }
    
    .section-creative {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }
    
    .section-title-creative {
      font-size: 16px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin: -1.5rem -1.5rem 1rem;
    }
    
    .profile-text {
      font-size: 11px;
      line-height: 1.7;
      color: #475569;
      margin: 0;
    }
    
    .experience-card,
    .project-card {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #f1f5f9;
    }
    
    .experience-card:last-child,
    .project-card:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.5rem;
    }
    
    .role,
    .project-name {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    
    .period {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
    }
    
    .company-badge {
      display: inline-block;
      background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    
    .achievements-creative {
      margin: 0;
      padding-left: 1.25rem;
      list-style-type: none;
    }
    
    .achievements-creative li {
      font-size: 10px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 0.5rem;
      position: relative;
    }
    
    .achievements-creative li:before {
      content: "→";
      position: absolute;
      left: -1.25rem;
      color: #3b82f6;
      font-weight: 700;
    }
    
    .project-desc {
      font-size: 10px;
      line-height: 1.6;
      color: #475569;
      margin: 0.5rem 0;
    }
    
    .tech-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }
    
    .tech-badge {
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 600;
    }
    
    .skill-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .skill-badge-creative {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 16px;
      font-size: 10px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
    
    .education-card {
      margin-bottom: 1rem;
    }
    
    .degree-creative {
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }
    
    .institution-creative {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    
    .year-creative {
      font-size: 9px;
      color: #94a3b8;
      font-weight: 600;
    }
    
    @media print {
      .resume-creative {
        background: white;
      }
      .section-creative {
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }
    }
  `
};

/**
 * TEMPLATE 4: TECH-FOCUSED (Developer/Engineer)
 */
const techTemplate: ResumeTemplate = {
  id: 'tech',
  name: 'Tech-Focused',
  description: 'Developer-optimized with tech stack badges and GitHub integration',
  bestFor: ['Software Engineering', 'DevOps', 'Data Science', 'Full-Stack'],
  preview: '/templates/tech-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills, projects } = data;
    
    return `
      <div class="resume-tech">
        <div class="header-tech">
          <h1 class="name-tech">${personalInfo.fullName}</h1>
          <div class="title-tech">Software Engineer</div>
          <div class="links-tech">
            ${personalInfo.email ? `<span class="link-item">📧 ${personalInfo.email}</span>` : ''}
            ${personalInfo.github ? `<span class="link-item">⚡ GitHub</span>` : ''}
            ${personalInfo.linkedin ? `<span class="link-item">💼 LinkedIn</span>` : ''}
            ${personalInfo.website ? `<span class="link-item">🌐 Portfolio</span>` : ''}
          </div>
        </div>
        
        <div class="tech-stack-section">
          <h2 class="section-header-tech">// Tech Stack</h2>
          <div class="tech-stack-grid">
            ${skills.technical.map(skill => {
              const color = getTechColor(skill);
              return `<span class="tech-stack-badge" style="background: ${color}">${skill}</span>`;
            }).join('')}
          </div>
        </div>
        
        <div class="section-tech">
          <h2 class="section-header-tech">// Professional Experience</h2>
          ${experience.map(exp => `
            <div class="job-entry-tech">
              <div class="job-header-tech">
                <div>
                  <h3 class="job-title-tech">${exp.position}</h3>
                  <div class="company-tech">${exp.company} • ${exp.location}</div>
                </div>
                <div class="date-tech">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
              </div>
              ${exp.technologies && exp.technologies.length > 0 ? `
                <div class="tech-used">
                  ${exp.technologies.map(tech => `<code class="tech-tag">${tech}</code>`).join('')}
                </div>
              ` : ''}
              <ul class="achievements-tech">
                ${exp.achievements.map(achievement => `
                  <li><code class="bullet">></code> ${achievement}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        ${projects && projects.length > 0 ? `
          <div class="section-tech">
            <h2 class="section-header-tech">// Projects</h2>
            ${projects.map(project => `
              <div class="project-entry-tech">
                <div class="project-header-tech">
                  <h3 class="project-title-tech">${project.name}</h3>
                  ${project.github ? `<span class="github-link">⚡ GitHub</span>` : ''}
                </div>
                <p class="project-description-tech">${project.description}</p>
                <div class="project-tech-stack">
                  ${project.technologies.map(tech => `<code class="tech-tag">${tech}</code>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="section-tech">
          <h2 class="section-header-tech">// Education</h2>
          ${education.map(edu => `
            <div class="education-entry-tech">
              <h3 class="degree-tech">${edu.degree} in ${edu.field}</h3>
              <div class="institution-tech">${edu.institution} • ${edu.graduationDate}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-tech {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
    }
    
    .header-tech {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .name-tech {
      font-size: 28px;
      font-weight: 800;
      color: #3b82f6;
      margin: 0 0 0.25rem;
      font-family: 'Fira Code', 'Courier New', monospace;
    }
    
    .title-tech {
      font-size: 14px;
      color: #94a3b8;
      font-weight: 500;
      margin-bottom: 1rem;
    }
    
    .links-tech {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    
    .link-item {
      font-size: 10px;
      color: #cbd5e1;
      font-family: 'Fira Code', monospace;
    }
    
    .tech-stack-section {
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      border-left: 4px solid #3b82f6;
    }
    
    .section-header-tech {
      font-size: 14px;
      font-weight: 700;
      color: #3b82f6;
      font-family: 'Fira Code', monospace;
      margin: 0 0 1rem;
    }
    
    .tech-stack-grid {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    
    .tech-stack-badge {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      color: white;
      font-family: 'Fira Code', monospace;
    }
    
    .section-tech {
      margin-bottom: 2rem;
    }
    
    .job-entry-tech,
    .project-entry-tech {
      background: #1e293b;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      border-left: 4px solid #64748b;
    }
    
    .job-header-tech {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    
    .job-title-tech {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.25rem;
    }
    
    .company-tech {
      font-size: 11px;
      color: #94a3b8;
    }
    
    .date-tech {
      font-size: 10px;
      color: #64748b;
      font-family: 'Fira Code', monospace;
    }
    
    .tech-used,
    .project-tech-stack {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    
    .tech-tag {
      background: #334155;
      color: #3b82f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 9px;
      font-family: 'Fira Code', monospace;
      font-weight: 600;
    }
    
    .achievements-tech {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .achievements-tech li {
      font-size: 10px;
      line-height: 1.7;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    
    .bullet {
      color: #3b82f6;
      font-weight: 700;
      margin-right: 0.5rem;
    }
    
    .project-header-tech {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .project-title-tech {
      font-size: 13px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }
    
    .github-link {
      font-size: 10px;
      color: #3b82f6;
      font-family: 'Fira Code', monospace;
    }
    
    .project-description-tech {
      font-size: 10px;
      line-height: 1.6;
      color: #cbd5e1;
      margin: 0 0 0.75rem;
    }
    
    .education-entry-tech {
      background: #1e293b;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    
    .degree-tech {
      font-size: 12px;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.25rem;
    }
    
    .institution-tech {
      font-size: 10px;
      color: #94a3b8;
    }
    
    @media print {
      .resume-tech {
        background: white;
        color: #1e293b;
      }
      .header-tech {
        border-bottom-color: #1e293b;
      }
      .name-tech,
      .section-header-tech {
        color: #1e293b;
      }
      .job-entry-tech,
      .project-entry-tech,
      .education-entry-tech,
      .tech-stack-section {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
    }
  `
};

/**
 * TEMPLATE 5: MINIMAL/ATS (Maximum Compatibility)
 */
const minimalTemplate: ResumeTemplate = {
  id: 'minimal',
  name: 'Minimal/ATS',
  description: 'Plain text format optimized for ATS systems',
  bestFor: ['ATS Systems', 'Government', 'Large Corporations', 'Conservative'],
  preview: '/templates/minimal-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills } = data;
    
    return `
      <div class="resume-minimal">
        <div class="header-minimal">
          <h1 class="name-minimal">${personalInfo.fullName}</h1>
          <div class="contact-minimal">
            ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
            ${personalInfo.linkedin ? ` | ${personalInfo.linkedin}` : ''}
          </div>
        </div>
        
        <div class="section-minimal">
          <h2 class="section-title-minimal">PROFESSIONAL SUMMARY</h2>
          <p class="text-minimal">${personalInfo.summary}</p>
        </div>
        
        <div class="section-minimal">
          <h2 class="section-title-minimal">PROFESSIONAL EXPERIENCE</h2>
          ${experience.map(exp => `
            <div class="entry-minimal">
              <div class="entry-title-minimal">${exp.position}</div>
              <div class="entry-subtitle-minimal">${exp.company}, ${exp.location}</div>
              <div class="entry-date-minimal">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</div>
              <ul class="list-minimal">
                ${exp.achievements.map(achievement => `
                  <li>${achievement}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="section-minimal">
          <h2 class="section-title-minimal">EDUCATION</h2>
          ${education.map(edu => `
            <div class="entry-minimal">
              <div class="entry-title-minimal">${edu.degree}, ${edu.field}</div>
              <div class="entry-subtitle-minimal">${edu.institution}, ${edu.location}</div>
              <div class="entry-date-minimal">${edu.graduationDate}</div>
              ${edu.gpa ? `<div class="text-minimal">GPA: ${edu.gpa}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="section-minimal">
          <h2 class="section-title-minimal">SKILLS</h2>
          <div class="text-minimal">
            <strong>Technical Skills:</strong> ${skills.technical.join(', ')}
          </div>
          ${skills.soft.length > 0 ? `
            <div class="text-minimal">
              <strong>Professional Skills:</strong> ${skills.soft.join(', ')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-minimal {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      font-family: Arial, Helvetica, sans-serif;
      background: white;
      color: #000;
      line-height: 1.5;
    }
    
    .header-minimal {
      margin-bottom: 1.5rem;
    }
    
    .name-minimal {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 0.5rem;
      text-transform: uppercase;
    }
    
    .contact-minimal {
      font-size: 11px;
      margin: 0;
    }
    
    .section-minimal {
      margin-bottom: 1.5rem;
    }
    
    .section-title-minimal {
      font-size: 12px;
      font-weight: 700;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
    }
    
    .entry-minimal {
      margin-bottom: 1rem;
    }
    
    .entry-title-minimal {
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    
    .entry-subtitle-minimal {
      font-size: 11px;
      margin-bottom: 0.25rem;
    }
    
    .entry-date-minimal {
      font-size: 11px;
      margin-bottom: 0.5rem;
    }
    
    .text-minimal {
      font-size: 11px;
      margin: 0 0 0.5rem;
    }
    
    .list-minimal {
      margin: 0.5rem 0 0 1.25rem;
      padding: 0;
      list-style-type: disc;
    }
    
    .list-minimal li {
      font-size: 11px;
      margin-bottom: 0.25rem;
    }
    
    @media print {
      .resume-minimal {
        padding: 0.5in;
      }
    }
  `
};

/**
 * Helper function to get tech-specific colors
 */
function getTechColor(tech: string): string {
  const techLower = tech.toLowerCase();
  const colorMap: Record<string, string> = {
    'react': '#61dafb',
    'vue': '#42b883',
    'angular': '#dd0031',
    'javascript': '#f7df1e',
    'typescript': '#3178c6',
    'python': '#3776ab',
    'java': '#007396',
    'node': '#339933',
    'aws': '#ff9900',
    'docker': '#2496ed',
    'kubernetes': '#326ce5',
    'mongodb': '#47a248',
    'postgresql': '#336791',
    'mysql': '#4479a1',
    'redis': '#dc382d',
    'graphql': '#e10098',
    'git': '#f05032',
    'linux': '#fcc624',
  };
  
  for (const [key, color] of Object.entries(colorMap)) {
    if (techLower.includes(key)) {
      return color;
    }
  }
  
  return '#3b82f6'; // Default blue
}

/**
 * TEMPLATE 6: EXECUTIVE (C-Suite/Director)
 */
const executiveTemplate: ResumeTemplate = {
  id: 'executive',
  name: 'Executive',
  description: 'Premium layout for C-suite and senior leadership',
  bestFor: ['C-Suite', 'VP', 'Director', 'Senior Leadership', 'Board Members'],
  preview: '/templates/executive-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills } = data;
    
    return `
      <div class="resume-executive">
        <div class="header-executive">
          <div class="header-content">
            <h1 class="name-executive">${personalInfo.fullName}</h1>
            <div class="executive-title">Chief Executive Officer | Board Director</div>
            <div class="contact-executive">
              ${personalInfo.email} • ${personalInfo.phone} • ${personalInfo.location}
              ${personalInfo.linkedin ? ` • ${personalInfo.linkedin}` : ''}
            </div>
          </div>
        </div>
        
        <div class="executive-summary-section">
          <h2 class="section-header-executive">EXECUTIVE SUMMARY</h2>
          <p class="executive-summary-text">${personalInfo.summary}</p>
        </div>
        
        <div class="key-achievements-section">
          <h2 class="section-header-executive">KEY ACHIEVEMENTS</h2>
          <div class="achievements-grid">
            ${experience.slice(0, 1).map(exp => 
              exp.achievements.slice(0, 4).map(achievement => {
                const metrics = achievement.match(/\d+[%$MKB]?/g);
                return `
                  <div class="achievement-card">
                    <div class="achievement-metric">${metrics ? metrics[0] : '✓'}</div>
                    <div class="achievement-text">${achievement}</div>
                  </div>
                `;
              }).join('')
            ).join('')}
          </div>
        </div>
        
        <div class="section-executive">
          <h2 class="section-header-executive">EXECUTIVE EXPERIENCE</h2>
          ${experience.map(exp => `
            <div class="executive-entry">
              <div class="executive-entry-header">
                <div>
                  <h3 class="executive-position">${exp.position}</h3>
                  <div class="executive-company">${exp.company}</div>
                </div>
                <div class="executive-dates">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</div>
              </div>
              <div class="leadership-scope">
                <span class="scope-item">P&L: $10M+</span>
                <span class="scope-item">Team: 50+ Direct/Indirect</span>
                <span class="scope-item">Board Reporting</span>
              </div>
              <ul class="executive-achievements">
                ${exp.achievements.map(achievement => `
                  <li>${achievement}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        
        <div class="two-column-section">
          <div class="column">
            <h2 class="section-header-executive">EDUCATION</h2>
            ${education.map(edu => `
              <div class="executive-education">
                <h3 class="executive-degree">${edu.degree}</h3>
                <div class="executive-institution">${edu.institution}</div>
                <div class="executive-year">${edu.graduationDate}</div>
                ${edu.honors && edu.honors.length > 0 ? `
                  <div class="executive-honors">${edu.honors.join(' • ')}</div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="column">
            <h2 class="section-header-executive">PROFESSIONAL AFFILIATIONS</h2>
            <ul class="affiliations-list">
              <li>Board Member, Tech Industry Association</li>
              <li>Advisory Board, Innovation Council</li>
              <li>Member, CEO Roundtable</li>
            </ul>
            
            ${skills.certifications && skills.certifications.length > 0 ? `
              <h2 class="section-header-executive">CERTIFICATIONS</h2>
              <ul class="certifications-list">
                ${skills.certifications.map(cert => `
                  <li>${cert.name} - ${cert.issuer}</li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-executive {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      font-family: 'Garamond', 'Georgia', serif;
      background: white;
      color: #1a1a1a;
    }
    
    .header-executive {
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
      color: white;
      padding: 2rem;
      margin: -0.75in -0.75in 2rem;
      border-bottom: 4px solid #d4af37;
    }
    
    .name-executive {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 0.5rem;
      letter-spacing: 1px;
    }
    
    .executive-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 1rem;
      color: #d4af37;
      letter-spacing: 0.5px;
    }
    
    .contact-executive {
      font-size: 11px;
      opacity: 0.95;
    }
    
    .executive-summary-section {
      background: #f8f9fa;
      padding: 1.5rem;
      border-left: 4px solid #d4af37;
      margin-bottom: 2rem;
    }
    
    .section-header-executive {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1e3a5f;
      margin: 0 0 1rem;
      letter-spacing: 1.5px;
      border-bottom: 2px solid #d4af37;
      padding-bottom: 0.5rem;
    }
    
    .executive-summary-text {
      font-size: 12px;
      line-height: 1.8;
      margin: 0;
      text-align: justify;
    }
    
    .key-achievements-section {
      margin-bottom: 2rem;
    }
    
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .achievement-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #d4af37;
    }
    
    .achievement-metric {
      font-size: 24px;
      font-weight: 700;
      color: #1e3a5f;
      margin-bottom: 0.5rem;
    }
    
    .achievement-text {
      font-size: 10px;
      line-height: 1.5;
      color: #495057;
    }
    
    .section-executive {
      margin-bottom: 2rem;
    }
    
    .executive-entry {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #dee2e6;
    }
    
    .executive-entry:last-child {
      border-bottom: none;
    }
    
    .executive-entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    
    .executive-position {
      font-size: 15px;
      font-weight: 700;
      color: #1e3a5f;
      margin: 0 0 0.25rem;
    }
    
    .executive-company {
      font-size: 13px;
      font-style: italic;
      color: #495057;
    }
    
    .executive-dates {
      font-size: 11px;
      color: #6c757d;
      font-weight: 600;
    }
    
    .leadership-scope {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .scope-item {
      font-size: 10px;
      font-weight: 600;
      color: #1e3a5f;
    }
    
    .executive-achievements {
      margin: 0;
      padding-left: 1.5rem;
      list-style-type: none;
    }
    
    .executive-achievements li {
      font-size: 11px;
      line-height: 1.7;
      margin-bottom: 0.5rem;
      position: relative;
    }
    
    .executive-achievements li:before {
      content: "▸";
      position: absolute;
      left: -1.5rem;
      color: #d4af37;
      font-weight: 700;
    }
    
    .two-column-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    
    .column {
      margin-bottom: 1rem;
    }
    
    .executive-education {
      margin-bottom: 1.5rem;
    }
    
    .executive-degree {
      font-size: 13px;
      font-weight: 700;
      color: #1e3a5f;
      margin: 0 0 0.25rem;
    }
    
    .executive-institution {
      font-size: 11px;
      font-style: italic;
      color: #495057;
      margin-bottom: 0.25rem;
    }
    
    .executive-year {
      font-size: 10px;
      color: #6c757d;
    }
    
    .executive-honors {
      font-size: 10px;
      color: #d4af37;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    
    .affiliations-list,
    .certifications-list {
      margin: 0.5rem 0 0 1.25rem;
      padding: 0;
      list-style-type: disc;
    }
    
    .affiliations-list li,
    .certifications-list li {
      font-size: 10px;
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }
    
    @media print {
      .resume-executive {
        padding: 0.5in;
      }
      .header-executive {
        margin: -0.5in -0.5in 1.5rem;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  `
};

/**
 * TEMPLATE 7: CURRICULUM VITAE (Academic/Research)
 */
const cvTemplate: ResumeTemplate = {
  id: 'cv',
  name: 'Curriculum Vitae',
  description: 'Academic format for research and scholarly positions',
  bestFor: ['Academia', 'Research', 'PhD', 'Medical', 'Scientific'],
  preview: '/templates/cv-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education, skills } = data;
    
    return `
      <div class="resume-cv">
        <div class="header-cv">
          <h1 class="name-cv">${personalInfo.fullName}, Ph.D.</h1>
          <div class="contact-cv">
            ${personalInfo.email} | ${personalInfo.phone} | ${personalInfo.location}
          </div>
          <div class="academic-profiles">
            ${personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin} | ` : ''}
            Google Scholar | ORCID: 0000-0000-0000-0000
          </div>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">1. ACADEMIC APPOINTMENTS</h2>
          ${experience.map((exp, index) => `
            <div class="cv-entry">
              <div class="cv-entry-header">
                <strong>${exp.position}</strong>
                <span class="cv-dates">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div class="cv-institution">${exp.company}, ${exp.location}</div>
              ${index === 0 ? '<div class="cv-note">(Tenure Track)</div>' : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">2. EDUCATION</h2>
          ${education.map(edu => `
            <div class="cv-entry">
              <div class="cv-entry-header">
                <strong>${edu.degree}, ${edu.field}</strong>
                <span class="cv-dates">${edu.graduationDate}</span>
              </div>
              <div class="cv-institution">${edu.institution}, ${edu.location}</div>
              <div class="cv-thesis">Dissertation: "Advanced Research in ${edu.field}"</div>
              ${edu.honors && edu.honors.length > 0 ? `
                <div class="cv-honors">${edu.honors.join(', ')}</div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">3. RESEARCH INTERESTS</h2>
          <ul class="cv-list">
            <li>Computational Methods and Algorithm Development</li>
            <li>Machine Learning Applications in Scientific Research</li>
            <li>Data Analysis and Statistical Modeling</li>
            <li>Interdisciplinary Collaboration and Innovation</li>
          </ul>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">4. PUBLICATIONS</h2>
          
          <h3 class="subsection-cv">Peer-Reviewed Journal Articles</h3>
          <ol class="publications-list">
            <li>
              <strong>${personalInfo.fullName}</strong>, Smith, J., & Johnson, A. (2024). 
              "Advanced Methods in Computational Research." 
              <em>Journal of Advanced Science</em>, 45(3), 123-145. 
              DOI: 10.1234/jas.2024.001
            </li>
            <li>
              Johnson, A., <strong>${personalInfo.fullName}</strong>, & Davis, R. (2023). 
              "Novel Approaches to Data Analysis." 
              <em>International Journal of Research</em>, 32(2), 67-89. 
              DOI: 10.1234/ijr.2023.045
            </li>
          </ol>
          
          <h3 class="subsection-cv">Conference Proceedings</h3>
          <ol class="publications-list" start="3">
            <li>
              <strong>${personalInfo.fullName}</strong> (2024). 
              "Innovative Research Methodologies." 
              <em>Proceedings of the International Conference on Research</em>, 
              pp. 234-245. New York, NY.
            </li>
          </ol>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">5. GRANTS & FUNDING</h2>
          <div class="cv-entry">
            <div class="cv-entry-header">
              <strong>National Science Foundation Grant</strong>
              <span class="cv-dates">2023 – 2026</span>
            </div>
            <div class="cv-grant-details">
              Principal Investigator, $500,000
              <br/>
              "Advanced Research in Computational Methods"
            </div>
          </div>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">6. TEACHING EXPERIENCE</h2>
          <ul class="cv-list">
            <li><strong>Advanced Research Methods</strong> (Graduate Level) – Fall 2023, Spring 2024</li>
            <li><strong>Introduction to Data Science</strong> (Undergraduate) – Fall 2022, Spring 2023</li>
            <li><strong>Statistical Analysis</strong> (Graduate Level) – Spring 2022</li>
          </ul>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">7. CONFERENCE PRESENTATIONS</h2>
          <ul class="cv-list">
            <li>"Recent Advances in Research Methodology" – International Conference, 2024</li>
            <li>"Data-Driven Approaches" – National Symposium, 2023</li>
            <li>"Computational Methods" – Regional Workshop, 2023</li>
          </ul>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">8. PROFESSIONAL SERVICE</h2>
          <ul class="cv-list">
            <li><strong>Reviewer:</strong> Journal of Advanced Science, International Journal of Research</li>
            <li><strong>Committee Member:</strong> Graduate Admissions Committee (2023-Present)</li>
            <li><strong>Organizer:</strong> Annual Research Symposium (2024)</li>
          </ul>
        </div>
        
        <div class="section-cv">
          <h2 class="section-title-cv">9. TECHNICAL SKILLS</h2>
          <div class="cv-skills">
            <strong>Programming:</strong> ${skills.technical.slice(0, 5).join(', ')}
            <br/>
            <strong>Software:</strong> MATLAB, R, SPSS, LaTeX
            <br/>
            <strong>Languages:</strong> ${skills.languages ? skills.languages.map(l => `${l.language} (${l.proficiency})`).join(', ') : 'English (Native)'}
          </div>
        </div>
        
        <div class="cv-footer">
          <em>References available upon request</em>
          <div class="cv-page-number">Page 1 of 1</div>
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-cv {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      font-family: 'Computer Modern', 'Times New Roman', serif;
      background: white;
      color: #000;
      line-height: 1.6;
    }
    
    .header-cv {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #000;
    }
    
    .name-cv {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }
    
    .contact-cv {
      font-size: 11px;
      margin-bottom: 0.25rem;
    }
    
    .academic-profiles {
      font-size: 10px;
      color: #333;
    }
    
    .section-cv {
      margin-bottom: 1.5rem;
    }
    
    .section-title-cv {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 0.75rem;
      border-bottom: 1px solid #000;
      padding-bottom: 0.25rem;
    }
    
    .subsection-cv {
      font-size: 11px;
      font-weight: 700;
      margin: 1rem 0 0.5rem;
    }
    
    .cv-entry {
      margin-bottom: 1rem;
    }
    
    .cv-entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
      font-size: 11px;
    }
    
    .cv-dates {
      font-size: 10px;
      font-weight: normal;
    }
    
    .cv-institution {
      font-size: 11px;
      font-style: italic;
      margin-bottom: 0.25rem;
    }
    
    .cv-thesis {
      font-size: 10px;
      margin-top: 0.25rem;
    }
    
    .cv-note {
      font-size: 10px;
      color: #555;
      margin-top: 0.25rem;
    }
    
    .cv-honors {
      font-size: 10px;
      font-style: italic;
      margin-top: 0.25rem;
    }
    
    .cv-grant-details {
      font-size: 10px;
      line-height: 1.5;
      margin-top: 0.25rem;
    }
    
    .cv-list {
      margin: 0.5rem 0 0 1.5rem;
      padding: 0;
      list-style-type: disc;
    }
    
    .cv-list li {
      font-size: 10px;
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }
    
    .publications-list {
      margin: 0.5rem 0 1rem 1.5rem;
      padding: 0;
    }
    
    .publications-list li {
      font-size: 10px;
      line-height: 1.7;
      margin-bottom: 0.75rem;
      text-indent: -1.5rem;
      padding-left: 1.5rem;
    }
    
    .cv-skills {
      font-size: 10px;
      line-height: 1.8;
    }
    
    .cv-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #000;
      text-align: center;
      font-size: 10px;
    }
    
    .cv-page-number {
      margin-top: 0.5rem;
      font-size: 9px;
      color: #666;
    }
    
    @media print {
      .resume-cv {
        padding: 0.75in;
      }
      
      @page {
        margin: 0.75in;
      }
    }
  `
};

/**
 * TEMPLATE 8: TEAL HORIZONTAL (Clean Single-Column)
 */
const tealHorizontalTemplate: ResumeTemplate = {
  id: 'teal-horizontal',
  name: 'Teal Horizontal',
  description: 'Clean single-column layout with teal accent headers',
  bestFor: ['Technology', 'Business', 'Consulting', 'General'],
  preview: '/templates/teal-horizontal-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, education } = data;
    
    return `
      <div class="resume-teal-horizontal">
        <div class="header-teal">
          <h1 class="name-teal">${personalInfo.fullName}, CTO CareerJSM</h1>
          <div class="contact-line-teal">
            ${personalInfo.location} | ${personalInfo.phone} | 
            <a href="mailto:${personalInfo.email}" class="email-link-teal">${personalInfo.email}</a>
          </div>
          <hr class="divider-teal" />
        </div>
        
        <div class="section-teal">
          <h2 class="section-title-teal">SUMMARY</h2>
          <p class="summary-teal">${personalInfo.summary}</p>
        </div>
        
        <div class="section-teal">
          <h2 class="section-title-teal">EDUCATION</h2>
          ${education.map(edu => `
            <div class="education-entry-teal">
              <div class="education-header-teal">
                <strong>${edu.degree}, ${edu.field}</strong> | <strong>${edu.institution}</strong> | <span>${edu.graduationDate}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="section-teal">
          <h2 class="section-title-teal">EXPERIENCE</h2>
          ${experience.map(exp => `
            <div class="experience-entry-teal">
              <div class="experience-header-teal">
                <strong>${exp.position}</strong> | <strong>${exp.company}</strong> | <span>${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <p class="experience-description-teal">${exp.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-teal-horizontal {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
      color: #000;
      line-height: 1.6;
    }
    
    .header-teal {
      margin-bottom: 1.5rem;
    }
    
    .name-teal {
      font-size: 24px;
      font-weight: 700;
      color: #0d9488;
      margin: 0 0 0.5rem;
    }
    
    .contact-line-teal {
      font-size: 11px;
      color: #333;
      margin-bottom: 0.75rem;
    }
    
    .email-link-teal {
      color: #0d9488;
      text-decoration: none;
    }
    
    .divider-teal {
      border: none;
      border-top: 2px solid #0d9488;
      margin: 0.75rem 0;
    }
    
    .section-teal {
      margin-bottom: 1.5rem;
    }
    
    .section-title-teal {
      font-size: 14px;
      font-weight: 700;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 0.75rem;
    }
    
    .summary-teal {
      font-size: 11px;
      line-height: 1.7;
      color: #333;
      margin: 0;
    }
    
    .education-entry-teal,
    .experience-entry-teal {
      margin-bottom: 1rem;
    }
    
    .education-header-teal,
    .experience-header-teal {
      font-size: 11px;
      margin-bottom: 0.5rem;
    }
    
    .education-header-teal strong,
    .experience-header-teal strong {
      font-weight: 700;
      color: #000;
    }
    
    .experience-description-teal {
      font-size: 11px;
      line-height: 1.6;
      color: #333;
      margin: 0;
    }
    
    @media print {
      .resume-teal-horizontal {
        padding: 0.5in;
      }
    }
  `
};

/**
 * TEMPLATE 9: TWO-COLUMN RED (Sidebar with Red Accents)
 */
const twoColumnRedTemplate: ResumeTemplate = {
  id: 'two-column-red',
  name: 'Two-Column Red',
  description: 'Two-column layout with red accent sidebar',
  bestFor: ['Creative', 'Marketing', 'Design', 'Media'],
  preview: '/templates/two-column-red-preview.png',
  
  generate: (data: ResumeData) => {
    const { personalInfo, experience, skills } = data;
    
    return `
      <div class="resume-two-column-red">
        <div class="header-two-column">
          <h1 class="name-two-column">${personalInfo.fullName}</h1>
          <div class="title-two-column">CTO CareerJSM</div>
          <hr class="divider-two-column" />
        </div>
        
        <div class="content-grid-two-column">
          <div class="sidebar-two-column">
            <div class="section-sidebar">
              <h2 class="section-title-red">CONTACT</h2>
              <div class="contact-item-sidebar">${personalInfo.location}</div>
              <div class="contact-item-sidebar">${personalInfo.phone}</div>
              <div class="contact-item-sidebar">${personalInfo.email}</div>
            </div>
            
            ${skills.languages && skills.languages.length > 0 ? `
              <div class="section-sidebar">
                <h2 class="section-title-blue">LANGUAGES</h2>
                ${skills.languages.map(lang => `
                  <div class="language-item-sidebar">
                    <strong>${lang.language}</strong>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          <div class="main-column-two-column">
            <div class="section-main">
              <h2 class="section-title-red">SUMMARY</h2>
              <p class="summary-two-column">${personalInfo.summary}</p>
            </div>
            
            <div class="section-main">
              <h2 class="section-title-red">EXPERIENCE</h2>
              ${experience.map(exp => `
                <div class="experience-entry-two-column">
                  <div class="experience-header-two-column">
                    <strong class="job-title-blue">${exp.position}</strong>
                    <span class="company-right">${exp.company}</span>
                  </div>
                  <div class="date-line-two-column">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</div>
                  <p class="experience-desc-two-column">${exp.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  css: `
    .resume-two-column-red {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
      color: #000;
    }
    
    .header-two-column {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    .name-two-column {
      font-size: 28px;
      font-weight: 700;
      color: #000;
      margin: 0;
    }
    
    .title-two-column {
      font-size: 16px;
      font-weight: 600;
      color: #000;
      margin: 0.25rem 0 0.75rem;
    }
    
    .divider-two-column {
      border: none;
      border-top: 1px solid #ccc;
      margin: 0.75rem 0;
    }
    
    .content-grid-two-column {
      display: grid;
      grid-template-columns: 30% 70%;
      gap: 2rem;
      border-left: 1px dotted #ccc;
      padding-left: 0;
    }
    
    .sidebar-two-column {
      padding-right: 1.5rem;
    }
    
    .section-sidebar {
      margin-bottom: 1.5rem;
    }
    
    .section-title-red {
      font-size: 12px;
      font-weight: 700;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 0.75rem;
    }
    
    .section-title-blue {
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 0.75rem;
    }
    
    .contact-item-sidebar {
      font-size: 10px;
      color: #333;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }
    
    .language-item-sidebar {
      font-size: 10px;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .main-column-two-column {
      padding-left: 1.5rem;
    }
    
    .section-main {
      margin-bottom: 1.5rem;
    }
    
    .summary-two-column {
      font-size: 11px;
      line-height: 1.7;
      color: #333;
      margin: 0;
    }
    
    .experience-entry-two-column {
      margin-bottom: 1.25rem;
    }
    
    .experience-header-two-column {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
    }
    
    .job-title-blue {
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
    }
    
    .company-right {
      font-size: 11px;
      font-weight: 600;
      color: #000;
    }
    
    .date-line-two-column {
      font-size: 10px;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .experience-desc-two-column {
      font-size: 11px;
      line-height: 1.6;
      color: #333;
      margin: 0;
    }
    
    @media print {
      .resume-two-column-red {
        padding: 0.5in;
      }
    }
  `
};

export const resumeTemplates: Record<string, ResumeTemplate> = {
  modern: modernTemplate,
  professional: professionalTemplate,
  creative: creativeTemplate,
  tech: techTemplate,
  minimal: minimalTemplate,
  executive: executiveTemplate,
  cv: cvTemplate,
  'teal-horizontal': tealHorizontalTemplate,
  'two-column-red': twoColumnRedTemplate,
};

export function getTemplateById(id: string): ResumeTemplate {
  return resumeTemplates[id] || resumeTemplates.modern;
}

export function getAllTemplates(): ResumeTemplate[] {
  return Object.values(resumeTemplates);
}

export function getTemplatesByIndustry(industry: string): ResumeTemplate[] {
  const industryLower = industry.toLowerCase();
  return Object.values(resumeTemplates).filter(template => 
    template.bestFor.some(category => category.toLowerCase().includes(industryLower))
  );
}
