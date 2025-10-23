/**
 * Quick test script for cover letter generation
 * Run with: node test-cover-letter.js
 */

const testPayload = {
  raw: true,
  jobTitle: "Senior Software Engineer",
  companyName: "TechCorp Inc",
  jobDescription: "We are seeking a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies. The ideal candidate will lead technical initiatives and mentor junior developers.",
  resumeText: `John Doe
Senior Software Engineer
john.doe@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Experienced software engineer with 6 years of full-stack development experience specializing in React, Node.js, and AWS cloud services.

WORK EXPERIENCE

Senior Developer, ABC Tech (2020 - Present)
- Led development of microservices architecture serving 1M+ users
- Mentored team of 5 junior developers
- Implemented CI/CD pipelines reducing deployment time by 60%

Software Engineer, XYZ Corp (2018 - 2020)
- Built React applications with 99.9% uptime
- Developed RESTful APIs using Node.js and Express
- Collaborated with cross-functional teams

EDUCATION
B.S. Computer Science, State University (2018)

SKILLS
JavaScript, TypeScript, React, Node.js, AWS, Docker, Kubernetes`,
  template: "modern",
  tone: "professional",
  save: false
}

console.log('Testing Cover Letter Generation API')
console.log('====================================\n')
console.log('Payload:', JSON.stringify(testPayload, null, 2))
console.log('\n⚠️  Note: This requires authentication. Use Postman or browser with active session.')
console.log('\nEndpoint: POST http://localhost:3000/api/cover-letter/generate')
console.log('\nExpected Response:')
console.log('- success: true')
console.log('- coverLetter: <generated text>')
console.log('- authenticity: { isValid: true, authenticityScore: 0.9+ }')
console.log('- wordCount: 300-500')
console.log('- preview: { html: <formatted HTML> }')
console.log('\n✅ If you see these fields, the API is working correctly!')
