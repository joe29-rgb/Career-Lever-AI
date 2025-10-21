/**
 * Professional Cover Letter Templates
 * 14 distinct templates for different industries and situations
 */

export interface CoverLetterTemplate {
  id: string
  name: string
  description: string
  bestFor: string[]
  tone: 'formal' | 'conversational' | 'creative' | 'technical' | 'executive'
  template: string
}

export const coverLetterTemplates: CoverLetterTemplate[] = [
  {
    id: 'professional',
    name: 'Professional & Traditional',
    description: 'Classic business letter format with formal tone',
    bestFor: ['Finance', 'Legal', 'Corporate', 'Healthcare', 'Government'],
    tone: 'formal',
    template: `[Your Name]
[Your Email] | [Your Phone] | [Your Location]

[Date]

[Hiring Manager Name]
[Company Name]
[Company Address]

Dear [Hiring Manager Name],

I am writing to express my strong interest in the [Job Title] position at [Company Name]. With [X years] of experience in [Industry/Field], I have developed a proven track record of [Key Achievement 1] and [Key Achievement 2], which align perfectly with the requirements outlined in your job posting.

Throughout my career at [Previous Company], I successfully [Specific Achievement with Metrics]. My expertise in [Skill 1], [Skill 2], and [Skill 3] has consistently enabled me to deliver results that exceed organizational objectives. I am particularly drawn to [Company Name]'s commitment to [Company Value/Mission], and I am confident that my background in [Relevant Experience] would make me a valuable addition to your team.

I would welcome the opportunity to discuss how my qualifications align with your needs. Thank you for your consideration, and I look forward to speaking with you soon.

Sincerely,
[Your Name]`
  },
  {
    id: 'modern',
    name: 'Modern & Conversational',
    description: 'Friendly, approachable tone with bullet points',
    bestFor: ['Tech', 'Startups', 'Marketing', 'Design', 'SaaS'],
    tone: 'conversational',
    template: `Hi [Hiring Manager Name],

I'm excited to apply for the [Job Title] role at [Company Name]—I've been following your work in [Industry/Product] and I'm impressed by how you're [Specific Company Achievement].

Here's what I bring to the table:
• [X years] driving [Key Result] in [Field]
• Hands-on experience with [Technology/Tool/Skill]
• A track record of [Quantifiable Achievement]

At [Previous Company], I [Specific Project/Achievement]. What excites me most about [Company Name] is [Specific Aspect of Company], and I see a great opportunity to contribute to [Team Goal/Project].

I'd love to chat about how my background in [Skill Area] can help [Company Name] achieve [Specific Goal]. Thanks for considering my application!

Best,
[Your Name]`
  },
  {
    id: 'metrics',
    name: 'Data-Driven & Metrics-Focused',
    description: 'Numbers-heavy format emphasizing quantifiable results',
    bestFor: ['Analytics', 'Sales', 'Operations', 'Executive', 'Consulting'],
    tone: 'formal',
    template: `Dear [Hiring Manager Name],

As a results-oriented [Job Title/Professional] with [X years] of experience delivering measurable impact, I am eager to bring my expertise to [Company Name] as your next [Job Title].

Here's what I've accomplished:
→ Increased [Metric] by [X%] within [Timeframe]
→ Reduced [Cost/Time/Error] by [X%] through [Initiative]
→ Led [Project] resulting in $[Amount] in [Revenue/Savings]

My approach combines [Skill 1] with [Skill 2] to drive [Outcome]. At [Previous Company], I built [System/Process] that [Result with Numbers]. I'm confident I can replicate this success at [Company Name] by [Specific Strategy Related to Job].

I'd be thrilled to discuss how my data-driven approach can contribute to [Company Name]'s growth objectives.

Best regards,
[Your Name]`
  },
  {
    id: 'creative',
    name: 'Creative & Unique',
    description: 'Storytelling approach with personality and flair',
    bestFor: ['Creative Industries', 'Media', 'Arts', 'Agencies', 'Entertainment'],
    tone: 'creative',
    template: `[Hiring Manager Name],

Let me paint you a picture.

Imagine: [Brief Scenario Related to Job/Company]. That's exactly the kind of challenge I thrive on, and why I'm reaching out about the [Job Title] position at [Company Name].

I've spent [X years] bringing ideas to life through [Medium/Skill], including:
🎨 [Project 1] - [Achievement]
🎨 [Project 2] - [Achievement]
🎨 [Project 3] - [Achievement]

What draws me to [Company Name] is your [Specific Quality/Work], especially [Recent Project]. I believe my blend of [Skill 1] and [Skill 2] would be a natural fit for your team's vision.

I'd love to show you my portfolio and discuss how I can help [Company Name] continue creating work that [Impact/Vision].

Let's create something amazing together.

[Your Name]
[Portfolio Link]`
  },
  {
    id: 'entry-level',
    name: 'Entry-Level & Enthusiastic',
    description: 'Energetic tone highlighting education and potential',
    bestFor: ['Recent Graduates', 'Career Changers', 'First Jobs', 'Internships'],
    tone: 'conversational',
    template: `Dear [Hiring Manager Name],

I am excited to apply for the [Job Title] position at [Company Name]. As a recent [Degree] graduate from [University] with a passion for [Field/Industry], I am eager to contribute my skills and enthusiasm to your team.

During my time at [University/Previous Experience], I:
• Completed [Relevant Project/Coursework] in [Subject]
• Developed proficiency in [Skill 1], [Skill 2], and [Skill 3]
• [Internship/Volunteer Experience] where I [Achievement]

What excites me most about [Company Name] is [Specific Company Aspect]. I am impressed by your commitment to [Value/Mission], and I am confident that my dedication to [Skill/Value] would make me a strong addition to your team.

I am eager to learn from experienced professionals and contribute my fresh perspective to [Department/Team]. Thank you for considering my application—I look forward to the opportunity to discuss how I can grow with [Company Name].

Sincerely,
[Your Name]`
  },
  {
    id: 'technical',
    name: 'Technical & Detailed',
    description: 'Tech stack focused with specific technical achievements',
    bestFor: ['Engineering', 'DevOps', 'IT', 'Data Science', 'Software Development'],
    tone: 'technical',
    template: `[Hiring Manager Name],

I'm applying for the [Job Title] position at [Company Name] because your tech stack and product challenges align perfectly with my expertise.

**Technical Background:**
- [X years] working with [Technology/Framework/Language]
- Architected [System/Feature] handling [Scale/Metric]
- Proficient in [Tool 1], [Tool 2], [Tool 3]

**Recent Achievement:**
At [Previous Company], I [Specific Technical Project]. This resulted in [Quantifiable Improvement: X% faster, Y% reduction, etc.]. I achieved this by [Technical Approach/Methodology].

I'm particularly interested in [Company Name]'s work on [Specific Technology/Product] and see opportunities to contribute to [Technical Challenge Mentioned in Job Description].

I've attached my GitHub profile showcasing [Relevant Projects]. I'd be happy to discuss my technical approach and how it aligns with your engineering goals.

Best regards,
[Your Name]
[GitHub/Portfolio Link]`
  },
  {
    id: 'executive',
    name: 'Leadership & Executive',
    description: 'Strategic vision and leadership impact for senior roles',
    bestFor: ['Director', 'VP', 'C-Suite', 'Senior Management', 'Board'],
    tone: 'executive',
    template: `[Board Member/Executive Name],

In today's competitive landscape, [Company Name] needs a [Job Title] who can [Key Challenge from Job Description]. I bring [X years] of proven leadership in driving [Outcome] across [Industry/Function].

**Leadership Impact:**
→ Scaled [Department/Organization] from [Starting Point] to [End Point]
→ Increased [Key Metric] by [X%] while reducing [Cost/Risk]
→ Built and mentored teams of [Number]+ high-performing professionals

At [Previous Company], I spearheaded [Strategic Initiative] that positioned the organization for [Result]. My approach combines strategic vision with operational excellence to deliver sustainable growth.

[Company Name]'s focus on [Strategic Priority] resonates with my expertise in [Relevant Leadership Experience]. I'm confident I can drive [Specific Outcome] while fostering a culture of [Value/Priority].

I welcome the opportunity to discuss how my leadership can accelerate [Company Name]'s strategic objectives.

Respectfully,
[Your Name]`
  },
  {
    id: 'career-pivot',
    name: 'Career Pivot & Transferable Skills',
    description: 'Emphasizes transferable skills for career changers',
    bestFor: ['Career Changers', 'Industry Switchers', 'Pivoting Professionals'],
    tone: 'conversational',
    template: `Dear [Hiring Manager Name],

While my background is in [Previous Industry/Role], I'm reaching out about the [Job Title] position because I've built a strong foundation of transferable skills that directly apply to this role.

**Transferable Skills:**
✓ [Skill 1] - Demonstrated through [Example from Previous Career]
✓ [Skill 2] - Applied in [Context] with [Result]
✓ [Skill 3] - Proven ability to [Relevant Achievement]

My experience in [Previous Field] taught me [Key Lesson/Skill] that is directly applicable to [New Field]. For example, at [Previous Company], I [Achievement that Shows Transferable Value].

I'm making this career transition because [Genuine Reason Related to Company/Industry], and I'm drawn to [Company Name]'s [Specific Aspect]. I've been actively building relevant skills through [Courses/Projects/Certifications], including [Specific Example].

I'm confident that my unique perspective from [Previous Industry] combined with my commitment to [New Industry] would bring fresh value to your team.

Thank you for considering my application.

Best regards,
[Your Name]`
  },
  {
    id: 'internal',
    name: 'Internal Promotion/Transfer',
    description: 'For current employees seeking new internal roles',
    bestFor: ['Internal Transfers', 'Promotions', 'Department Changes'],
    tone: 'formal',
    template: `Dear [Hiring Manager Name],

I am writing to express my interest in the [New Job Title] position within [Department/Team]. Having worked at [Company Name] for [X years] in my current role as [Current Position], I have gained valuable insights into our organization and am excited about the opportunity to contribute in a new capacity.

**Relevant Accomplishments in Current Role:**
• [Achievement 1 relevant to new position]
• [Achievement 2 showing readiness for promotion]
• [Cross-functional project demonstrating new skills]

My time in [Current Department] has given me a deep understanding of [Relevant Process/System/Challenge]. I've also had the opportunity to collaborate with [New Department/Team] on [Project], which solidified my interest in this role and demonstrated my ability to [Relevant Skill].

I'm confident that my institutional knowledge, combined with my passion for [New Focus Area], would enable me to hit the ground running and deliver immediate value to the team.

I would appreciate the opportunity to discuss how my experience at [Company Name] has prepared me for this next step in my career.

Thank you for your consideration.

Sincerely,
[Your Name]`
  },
  {
    id: 'remote',
    name: 'Remote Work Focused',
    description: 'Highlights remote work experience and self-management',
    bestFor: ['Distributed Teams', 'Remote-First Companies', 'Work From Home'],
    tone: 'conversational',
    template: `Hi [Hiring Manager Name],

I'm thrilled to apply for the remote [Job Title] position at [Company Name]. As someone who has worked remotely for [X years], I've mastered the art of delivering results without a traditional office environment.

**Remote Work Excellence:**
→ Managed [Project/Team] across [Number] time zones
→ Maintained [Metric] productivity using [Tools/Methods]
→ Built strong virtual relationships with [Stakeholder Group]

At [Previous Remote Company], I [Achievement that Required Strong Remote Skills]. My toolkit includes [Communication Tools], [Project Management Tools], and [Collaboration Tools], which I use to ensure seamless collaboration and accountability.

What excites me about [Company Name] is your [Remote Culture Aspect/Value]. I believe my self-directed work style and proven ability to [Remote-Specific Skill] would make me a valuable addition to your distributed team.

I'm available for a video call at your convenience to discuss how I can contribute to [Company Name]'s success.

Best,
[Your Name]
[Time Zone]`
  },
  {
    id: 'problem-solver',
    name: 'Problem-Solver & Initiative-Driven',
    description: 'Leads with solutions to company challenges',
    bestFor: ['Product Management', 'Consulting', 'Strategy', 'Business Development'],
    tone: 'conversational',
    template: `Dear [Hiring Manager Name],

[Company Name] is facing [Specific Challenge from Research/Job Description]. I believe I have the solution.

During my [X years] in [Field], I've made a career out of solving complex problems:

**Challenge:** [Previous Company Challenge]
**Solution:** [Your Approach]
**Result:** [Quantifiable Outcome]

I've studied [Company Name]'s position in [Market/Industry] and noticed [Observation]. My experience with [Relevant Skill/Project] uniquely positions me to help address this through [Proposed Strategy/Approach].

At [Previous Company], I identified a similar challenge around [Issue] and implemented [Solution], which led to [Result with Metrics]. I'm confident I can bring this same problem-solving approach to [Company Name].

I'd welcome the chance to discuss my ideas for [Specific Challenge/Goal] and explore how my strategic thinking aligns with your team's objectives.

Looking forward to connecting.

Best regards,
[Your Name]`
  },
  {
    id: 'referral',
    name: 'Referral-Based',
    description: 'Leverages internal connection for warm introduction',
    bestFor: ['Referrals', 'Networking', 'Internal Connections'],
    tone: 'conversational',
    template: `Dear [Hiring Manager Name],

[Referral Name], [Referral Job Title], suggested I reach out regarding the [Job Title] opening at [Company Name]. After learning more about the role and your team's work on [Project/Initiative], I'm convinced this is the perfect opportunity for me.

[Referral Name] and I worked together at [Previous Company/Context], where I [Relevant Achievement/Project]. They mentioned that [Company Name] is seeking someone who can [Key Job Requirement], which aligns perfectly with my experience in [Relevant Skill/Background].

**Why I'm a Strong Fit:**
• [X years] of experience in [Relevant Field]
• Proven track record of [Key Achievement]
• Expertise in [Skill 1], [Skill 2], [Skill 3]

At [Previous Company], I [Specific Achievement Related to Job]. I'm particularly excited about [Company Name]'s focus on [Specific Aspect] and would love to bring my expertise in [Area] to your team.

[Referral Name] speaks highly of the collaborative culture at [Company Name], and I'm eager to contribute to that environment. I'd appreciate the opportunity to discuss how my background aligns with your needs.

Thank you for your consideration.

Best regards,
[Your Name]`
  },
  {
    id: 'freelance-to-fulltime',
    name: 'Freelance/Contract to Full-Time',
    description: 'For contractors seeking permanent positions',
    bestFor: ['Contractors', 'Freelancers', 'Contract-to-Hire'],
    tone: 'conversational',
    template: `Hi [Hiring Manager Name],

As a freelance [Job Title] who has had the pleasure of working with [Company Name] on [Project/Contract], I'm reaching out to express my interest in the full-time [Job Title] position.

**During My Time Working With Your Team:**
✓ Delivered [Project 1] - [Result]
✓ Collaborated with [Team/Department] on [Initiative]
✓ Received positive feedback on [Specific Skill/Quality]

This experience has given me valuable insights into [Company Name]'s culture, workflows, and goals. I've seen firsthand how [Team/Department] operates and where I can add long-term value.

My freelance work across [Number] clients in [Industry] has strengthened my ability to [Key Skill], but what I'm most excited about is the opportunity to commit fully to [Company Name]'s mission around [Company Value/Goal].

I'm confident that transitioning from contractor to full-time team member would allow me to deepen my impact and contribute to [Specific Team Goal/Company Initiative].

I'd love to discuss how we can make this transition official.

Best,
[Your Name]`
  },
  {
    id: 'ats-optimized',
    name: 'Short & Direct (ATS-Optimized)',
    description: 'Concise format optimized for ATS parsing',
    bestFor: ['Volume Applications', 'ATS-Heavy Industries', 'Large Corporations'],
    tone: 'formal',
    template: `[Hiring Manager Name]

[Job Title] Position - [Company Name]

I am applying for the [Job Title] role advertised on [Job Board/Company Website]. With [X years] of experience in [Industry/Field] and expertise in [Skill 1], [Skill 2], and [Skill 3], I am confident in my ability to contribute immediately to your team.

Key qualifications:
- [X years] experience in [Relevant Area]
- Proficient in [Technology/Tool/Skill mentioned in job description]
- Proven track record: [Quantifiable Achievement]
- [Certification/Degree] in [Relevant Field]

At [Previous Company], I [Specific Achievement with Metrics relevant to job requirements]. I am excited about the opportunity to bring this same level of results to [Company Name].

I have attached my resume for your review. I am available for an interview at your earliest convenience.

Thank you for your consideration.

[Your Name]
[Your Email]
[Your Phone]`
  }
]

/**
 * Get template by ID
 */
export function getCoverLetterTemplateById(id: string): CoverLetterTemplate {
  const template = coverLetterTemplates.find(t => t.id === id)
  if (!template) {
    return coverLetterTemplates[0] // Default to professional
  }
  return template
}

/**
 * Get all templates
 */
export function getAllCoverLetterTemplates(): CoverLetterTemplate[] {
  return coverLetterTemplates
}

/**
 * Get templates by industry/situation
 */
export function getCoverLetterTemplatesByCategory(category: string): CoverLetterTemplate[] {
  return coverLetterTemplates.filter(t => 
    t.bestFor.some(bf => bf.toLowerCase().includes(category.toLowerCase()))
  )
}

/**
 * Suggest template based on resume template
 */
export function suggestCoverLetterTemplate(resumeTemplateId: string): CoverLetterTemplate {
  const mapping: Record<string, string> = {
    'modern': 'modern',
    'professional': 'professional',
    'creative': 'creative',
    'tech': 'technical',
    'minimal': 'ats-optimized',
    'executive': 'executive',
    'cv': 'professional'
  }
  
  const templateId = mapping[resumeTemplateId] || 'professional'
  return getCoverLetterTemplateById(templateId)
}
