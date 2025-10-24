# LinkedIn OAuth Setup Guide

## Overview
This app now uses **LinkedIn OAuth 2.0** to let users sign in with LinkedIn and automatically import their profile data. This is the official, secure, and legal way to access LinkedIn data.

---

## Setup Steps

### 1. Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **"Create app"**
3. Fill in app details:
   - **App name**: Career Lever AI
   - **LinkedIn Page**: Your company page (or create one)
   - **App logo**: Upload your logo
   - **Legal agreement**: Accept terms

### 2. Configure OAuth Settings
1. In your LinkedIn app, go to **"Auth"** tab
2. Add **Redirect URLs**:
   ```
   http://localhost:3000/api/auth/callback/linkedin
   https://your-domain.com/api/auth/callback/linkedin
   ```
3. Request **OAuth 2.0 scopes**:
   - ✅ `openid` - Basic authentication
   - ✅ `profile` - Basic profile info
   - ✅ `email` - Email address
   - ✅ `w_member_social` - Read/write member profile

### 3. Get Credentials
1. In the **"Auth"** tab, find:
   - **Client ID**
   - **Client Secret**
2. Copy these values

### 4. Add to Environment Variables
Add to your `.env.local` file:

```bash
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

### 5. Verify Setup
1. Restart your dev server
2. Go to Resume Upload or Resume Builder
3. Click "LinkedIn" tab
4. Click "Sign in with LinkedIn"
5. Should redirect to LinkedIn OAuth consent screen

---

## How It Works

### User Flow:
```
1. User clicks "Sign in with LinkedIn"
   ↓
2. Redirected to LinkedIn OAuth consent
   ↓
3. User grants permissions
   ↓
4. Redirected back to app with access token
   ↓
5. App fetches profile data from LinkedIn API
   ↓
6. Profile data auto-populates resume fields
```

### API Endpoints Used:
- `https://api.linkedin.com/v2/me` - Basic profile
- `https://api.linkedin.com/v2/emailAddress` - Email
- `https://api.linkedin.com/v2/positions` - Work experience
- `https://api.linkedin.com/v2/educations` - Education
- `https://api.linkedin.com/v2/skills` - Skills

---

## Data Retrieved

### ✅ What We Get:
- Full name
- Email address
- Profile headline/summary
- Work experience (all jobs)
- Education history
- Skills list
- LinkedIn profile URL

### ❌ What We Don't Get:
- Connections
- Messages
- Posts/activity
- Recommendations
- Endorsements

---

## Security & Privacy

### ✅ Secure:
- OAuth 2.0 standard protocol
- No password sharing
- User explicitly grants permissions
- Access token stored securely in session
- Can revoke access anytime from LinkedIn settings

### ✅ Compliant:
- Official LinkedIn API
- Follows LinkedIn Terms of Service
- GDPR compliant
- User data not shared with third parties

---

## Troubleshooting

### "Failed to sign in with LinkedIn"
- Check Client ID and Secret are correct
- Verify redirect URL matches exactly
- Make sure app is not in "Development" mode (if in production)

### "Failed to fetch LinkedIn profile"
- Check OAuth scopes are approved
- Verify access token is valid
- Check LinkedIn API rate limits

### "No LinkedIn access token found"
- User needs to sign in with LinkedIn first
- Session may have expired - sign in again

---

## Testing

### Development:
```bash
# Make sure env vars are set
echo $LINKEDIN_CLIENT_ID
echo $LINKEDIN_CLIENT_SECRET

# Start dev server
npm run dev

# Test the flow
1. Go to http://localhost:3000/career-finder/resume
2. Click "LinkedIn" tab
3. Click "Sign in with LinkedIn"
4. Grant permissions
5. Verify profile data imports
```

### Production:
1. Add production redirect URL to LinkedIn app
2. Deploy with environment variables
3. Test OAuth flow on production domain

---

## Rate Limits

LinkedIn API rate limits:
- **Development**: 100 requests per day per user
- **Production**: Higher limits (apply for production access)

Our app makes ~5 API calls per import:
- 1 for basic profile
- 1 for email
- 1 for positions
- 1 for education
- 1 for skills

So users can import ~20 times per day in development.

---

## Alternative Methods

If OAuth is not set up or user prefers not to sign in:
1. **PDF Upload** - Download LinkedIn profile as PDF
2. **Text Paste** - Copy/paste LinkedIn profile text
3. **URL Scraping** - Enter LinkedIn URL (uses Perplexity)

---

## Support

For LinkedIn API support:
- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [LinkedIn Developer Forums](https://www.linkedin.com/developers/)
- [OAuth 2.0 Guide](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
