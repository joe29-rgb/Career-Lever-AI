/** @type {import('next').NextConfig} */
const nextConfig = {
    // CRITICAL: Use 'export' for Capacitor static builds
    output: 'export',
    
    // Disable image optimization for static export
    images: {
        unoptimized: true,
    },
    
    // Disable trailing slashes for mobile compatibility
    trailingSlash: true,
    
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    swcMinify: true,
    productionBrowserSourceMaps: false,
    
    // React optimizations
    reactStrictMode: true,
    
    // Remove i18n for static export (not supported)
    // i18n config removed for Capacitor builds
    
    env: {
        MONGODB_URI: process.env.MONGODB_URI,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        PERPLEXITY_BASE_URL: process.env.PERPLEXITY_BASE_URL || 'https://api.perplexity.ai',
        PERPLEXITY_MODEL: process.env.PERPLEXITY_MODEL || 'sonar-pro',
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'mobile',
        NEXT_PUBLIC_IS_CAPACITOR: 'true'
    },
    
    // Experimental features for performance
    experimental: {
        // Optimize package imports (tree-shaking)
        optimizePackageImports: [
            '@heroicons/react', 
            'lucide-react',
            '@tanstack/react-query',
            'react-hot-toast',
            'recharts',
            'framer-motion'
        ],
    },
    
    eslint: {
        ignoreDuringBuilds: true,
    },
    
    typescript: {
        ignoreBuildErrors: process.env.DISABLE_TYPECHECK === 'true',
    },
    
    webpack: (config, { isServer, dev }) => {
        // Avoid bundling optional 'canvas' dependency
        config.resolve = config.resolve || {}
        config.resolve.alias = config.resolve.alias || {}
        config.resolve.alias['canvas'] = false
        
        if (isServer) {
            config.externals = config.externals || []
            config.externals.push({ canvas: 'commonjs canvas' })
        }
        
        // Mobile-specific optimizations
        if (!dev) {
            // Bundle splitting for mobile (max 200KB per chunk)
            config.optimization = config.optimization || {}
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    // Vendor chunk
                    vendor: {
                        name: 'vendor',
                        chunks: 'all',
                        test: /node_modules/,
                        priority: 20,
                        maxSize: 200000, // 200KB
                    },
                    // Common chunk
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 10,
                        reuseExistingChunk: true,
                        enforce: true,
                        maxSize: 200000, // 200KB
                    },
                    // React chunk
                    react: {
                        name: 'react',
                        test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                        chunks: 'all',
                        priority: 30,
                    },
                    // UI libraries chunk
                    ui: {
                        name: 'ui',
                        test: /[\\/]node_modules[\\/](framer-motion|lucide-react)[\\/]/,
                        chunks: 'all',
                        priority: 25,
                        maxSize: 200000,
                    }
                }
            }
            
            // Minimize bundle size
            config.optimization.minimize = true
            
            // Remove console logs in production
            if (config.optimization.minimizer) {
                config.optimization.minimizer.forEach(minimizer => {
                    if (minimizer.constructor.name === 'TerserPlugin') {
                        minimizer.options.terserOptions = minimizer.options.terserOptions || {}
                        minimizer.options.terserOptions.compress = minimizer.options.terserOptions.compress || {}
                        minimizer.options.terserOptions.compress.drop_console = true
                    }
                })
            }
        }
        
        return config
    }
}

module.exports = nextConfig
