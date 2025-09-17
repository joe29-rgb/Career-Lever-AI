# Career Lever AI - Railway Deployment Guide

## 🚀 Deployment to Railway

This guide will help you deploy Career Lever AI to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **MongoDB Database**: Railway provides managed MongoDB, or you can use MongoDB Atlas
3. **OpenAI API Key**: Get your API key from [OpenAI](https://platform.openai.com/api-keys)

## Step 1: Prepare Your Repository

Make sure your code is committed and pushed to GitHub.

## Step 2: Connect to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your Career Lever AI repository
5. Choose your branch (usually `main`)

## Step 3: Configure Environment Variables

In your Railway project dashboard, go to "Variables" and add these environment variables:

### Required Variables

```bash
# Database (Railway will provide this automatically for Railway-managed DB)
MONGODB_URI=your-mongodb-connection-string

# Authentication (Generate a secure random string)
NEXTAUTH_SECRET=your-secure-random-string-here
NEXTAUTH_URL=https://your-app-name.railway.app

# AI Integration
OPENAI_API_KEY=sk-your-openai-api-key

# Redis (optional but recommended)
REDIS_URL=redis://default:password@host:port

# Puppeteer (Chromium) for PDF export & scraping
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Optional Job Board API Variables

These enable real OAuth integrations with job boards:

```bash
# LinkedIn Talent Solutions API
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# ZipRecruiter API
ZIPRECRUITER_CLIENT_ID=your-ziprecruiter-client-id
ZIPRECRUITER_CLIENT_SECRET=your-ziprecruiter-client-secret

# Monster API
MONSTER_CLIENT_ID=your-monster-client-id
MONSTER_CLIENT_SECRET=your-monster-client-secret

# CareerBuilder API
CAREERBUILDER_CLIENT_ID=your-careerbuilder-client-id
CAREERBUILDER_CLIENT_SECRET=your-careerbuilder-client-secret

# Indeed API (Limited availability)
INDEED_CLIENT_ID=your-indeed-client-id
INDEED_CLIENT_SECRET=your-indeed-client-secret
```

## Step 4: Database Setup

### Option A: Use Railway's Managed Database (Recommended)

1. In your Railway project, click "Add Plugin"
2. Choose "MongoDB"
3. Railway will automatically set the `MONGODB_URI` environment variable

### Option B: Use MongoDB Atlas

1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Set the `MONGODB_URI` environment variable in Railway

## Step 5: Deploy

1. Click "Deploy" in Railway
2. Wait for the build and deployment to complete
3. Your app will be available at `https://your-project-name.railway.app`

If Chromium is missing, ensure Nixpacks includes it via `nixpacks.toml` and the environment variables above are set.

## Step 6: Initial Setup

1. Visit your deployed app
2. Create your first user account
3. Start using Career Lever AI!

## Troubleshooting

### Build Fails

If the build fails, check the Railway logs for errors. Common issues:

1. **Missing environment variables**: Make sure all required variables are set
2. **Database connection issues**: Verify your MongoDB URI is correct
3. **Memory limits**: Railway has memory limits; optimize if needed

### Runtime Errors

1. **Database connection errors**: Check MongoDB connectivity
2. **Authentication issues**: Verify NEXTAUTH_SECRET and NEXTAUTH_URL
3. **API timeouts**: Some operations may need longer timeouts in production

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | Yes | - |
| `NEXTAUTH_URL` | Your app's URL | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `LINKEDIN_CLIENT_ID` | LinkedIn API client ID | No | - |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn API client secret | No | - |

## Performance Optimization

For production use, consider:

1. **Database indexing**: Ensure proper indexes on MongoDB collections
2. **Caching**: Implement Redis for session storage if needed
3. **CDN**: Use Railway's built-in CDN for static assets
4. **Monitoring**: Set up Railway's logging and monitoring

## Security Notes

1. **API Keys**: Never commit API keys to your repository
2. **Environment Variables**: Use Railway's encrypted environment variables
3. **HTTPS**: Railway provides automatic HTTPS certificates
4. **Rate Limiting**: Implement rate limiting for API endpoints in production

## Support

For Railway-specific issues, check:
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

For Career Lever AI issues, refer to the main README.md file.

