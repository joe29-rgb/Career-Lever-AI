/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        MONGODB_URI: process.env.MONGODB_URI,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_ASSISTANT_JOB_ANALYSIS: process.env.OPENAI_ASSISTANT_JOB_ANALYSIS,
        OPENAI_ASSISTANT_COVER_LETTER: process.env.OPENAI_ASSISTANT_COVER_LETTER,
        OPENAI_ASSISTANT_RESUME_TAILOR: process.env.OPENAI_ASSISTANT_RESUME_TAILOR,
        OPENAI_ASSISTANT_INTERVIEW_PREP: process.env.OPENAI_ASSISTANT_INTERVIEW_PREP,
        OPENAI_ASSISTANT_SALARY_COACH: process.env.OPENAI_ASSISTANT_SALARY_COACH,
    },
    images: {
        domains: ['localhost'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
}

module.exports = nextConfig