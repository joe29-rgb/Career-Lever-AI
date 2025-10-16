# Multi-stage Production Dockerfile for Career Lever AI
# Optimized for Next.js 14 with App Router

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with production optimizations
RUN npm ci --only=production --ignore-scripts --prefer-offline

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files (including UI components)
COPY . .

# Explicitly verify critical directories exist
RUN ls -la src/components/ui/ || echo "WARNING: UI components not found"

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install all dependencies (including dev) for build
RUN npm ci

# Build the Next.js application
RUN npm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (Railway will use $PORT env var, typically 8080)
EXPOSE 8080

# Set hostname to accept connections from anywhere
ENV HOSTNAME="0.0.0.0"

# Start the application
# Railway will inject PORT env var, Next.js standalone server will use it automatically
# No Docker HEALTHCHECK - Railway handles healthchecks externally via /api/health
CMD ["node", "server.js"]
