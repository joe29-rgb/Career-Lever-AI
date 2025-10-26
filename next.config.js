/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker deployment
    output: 'standalone',
    
    // Performance optimizations
    compress: true, // Enable gzip compression
    poweredByHeader: false, // Remove X-Powered-By header
    
    // Enable SWC minification (faster than Terser)
    swcMinify: true,
    
    // Optimize production builds
    productionBrowserSourceMaps: false, // Disable source maps in prod
    
    // React optimizations
    reactStrictMode: true,
    
    i18n: {
        locales: ['en', 'fr'],
        defaultLocale: 'en',
    },
    env: {
        MONGODB_URI: process.env.MONGODB_URI,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        // OPENAI_API_KEY is deprecated; retaining only if legacy routes remain
        // OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        PERPLEXITY_BASE_URL: process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai',
        PERPLEXITY_MODEL: process.env.PERPLEXITY_MODEL || 'sonar-pro',
        // OpenAI assistant IDs deprecated after Perplexity migration
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
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdnjs.cloudflare.com",
                        "worker-src 'self' blob:",
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
        formats: ['image/avif', 'image/webp'], // Modern image formats
        minimumCacheTTL: 60, // Cache images for 60 seconds
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    
    // Experimental features for performance
    experimental: {
        // Optimize package imports (tree-shaking)
        optimizePackageImports: [
            '@heroicons/react', 
            'lucide-react',
            '@tanstack/react-query',
            'react-hot-toast',
            'recharts'
        ],
        // Disable CSS optimization to avoid critters dependency issue
        // optimizeCss: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Allow disabling type-check during build via env to avoid OOM on small builders
        ignoreBuildErrors: process.env.DISABLE_TYPECHECK === 'true',
    },
    webpack: (config, { isServer }) => {
        // Avoid bundling optional 'canvas' dependency required by pdfjs in Node builds
        config.resolve = config.resolve || {}
        config.resolve.alias = config.resolve.alias || {}
        config.resolve.alias['canvas'] = false
        if (isServer) {
            config.externals = config.externals || []
                // Mark canvas as external in server to prevent resolution errors
            config.externals.push({ canvas: 'commonjs canvas' })
        }
        return config
    }
}

module.exports = nextConfig