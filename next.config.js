/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n: {
        locales: ['en', 'fr'],
        defaultLocale: 'en',
    },
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
        OPENAI_ASSISTANT_COMPANY_INSIGHTS: process.env.OPENAI_ASSISTANT_COMPANY_INSIGHTS,
        OPENAI_ASSISTANT_COMPANY_SCRAPER: process.env.OPENAI_ASSISTANT_COMPANY_SCRAPER,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME || 'production',
    },
    async headers() {
        return [{
            source: '/(.*)',
            headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
                { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
                { key: 'X-DNS-Prefetch-Control', value: 'off' },
                {
                    key: 'Content-Security-Policy',
                    value: [
                        "default-src 'self'",
                        "script-src 'self' 'unsafe-inline' https:",
                        "style-src 'self' 'unsafe-inline' https:",
                        "img-src 'self' data: blob:",
                        "font-src 'self' data: https:",
                        "connect-src 'self' https: wss:",
                        "frame-src 'self' https://accounts.google.com",
                        "object-src 'none'",
                        "base-uri 'self'",
                        "form-action 'self' https://accounts.google.com https://*.google.com https://*.googleusercontent.com"
                    ].join('; ')
                }
            ]
        }]
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