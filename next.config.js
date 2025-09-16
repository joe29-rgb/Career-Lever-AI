/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        MONGODB_URI: process.env.MONGODB_URI,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_ASSISTANT_JOB_ANALYSIS: process.env.OPENAI_ASSISTANT_JOB_ANALYSIS,
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