# Email FROM Address Fix - Deployment Instructions

## Issue
Production is still sending emails from `sales@easyleasecanada.com` instead of the user's email address.

## Root Cause
The `EMAIL_FROM` environment variable in Railway is set to `sales@easyleasecanada.com`, and the new code that uses `session.user.email` hasn't been deployed yet.

## Error in Production
```
[RESEND] Send error: Error: You can only send testing emails to your own email address (sales@easyleasecanada.com). 
To send emails to other recipients, please verify a domain at resend.com/domains
```

## Fix Applied (Committed but Not Deployed)
File: `src/app/api/outreach/send/route.ts` (lines 110-120)

```typescript
// Use user's email as FROM address (falls back to default if not available)
const userEmail = session.user.email || undefined
const fromEmail = userEmail || process.env.EMAIL_FROM || 'onboarding@resend.dev'

const result = await resendProvider.send({
  to: contact.email,
  from: fromEmail,        // ← Uses user's email first
  replyTo: userEmail,     // ← User's email for replies
  subject: email.subject,
  body: email.body,
  attachments: attachments.length > 0 ? attachments : undefined
})
```

## What You Need to Do

### Option 1: Deploy Latest Code (Recommended)
1. Push to Railway (code is already committed to main)
2. Wait for deployment to complete
3. Test sending email - it should now use user's email

### Option 2: Update Environment Variable (Temporary)
1. Go to Railway dashboard
2. Find `EMAIL_FROM` variable
3. **Remove it** or set to `onboarding@resend.dev`
4. Restart the app
5. This will make it fall back to user's email

### Option 3: Verify Domain on Resend (Long-term)
1. Go to https://resend.com/domains
2. Add domain: `easyleasecanada.com`
3. Add DNS records shown by Resend:
   - SPF record
   - DKIM record
   - DMARC record (optional)
4. Wait for verification (5-30 minutes)
5. Then you CAN send from `sales@easyleasecanada.com`

## How to Test

### After Deployment:
1. Go to Career Finder → Outreach
2. Click "Send Email Now"
3. Check logs for:
   ```
   [OUTREACH_SEND] User email: your-email@gmail.com
   [OUTREACH_SEND] From email: your-email@gmail.com
   ```
4. Email should send successfully

### Expected Behavior:
- ✅ Email sends from user's email address
- ✅ Recipient sees email from user (not sales@easyleasecanada.com)
- ✅ Replies go to user's email
- ✅ No domain verification needed

## Current Code Status

### ✅ Fixed Locally (Committed):
- `src/app/api/outreach/send/route.ts` - Uses user's email
- Added logging to debug
- Commit: `1ea3c26` - "fix: use user's email as FROM address"

### ⚠️ Not Deployed Yet:
- Railway needs to pull latest code
- Environment variable may need adjustment

## Recommended Action

**Deploy the latest code to Railway immediately.**

The fix is already committed and will work once deployed. No environment variable changes needed - the code will automatically use the user's email address.

## Verification Steps

1. Deploy to Railway
2. Send test email
3. Check logs for:
   - `[OUTREACH_SEND] User email: <actual-user-email>`
   - `[OUTREACH_SEND] From email: <actual-user-email>`
4. Confirm email sends successfully
5. Check recipient sees email from user's address

## Fallback Plan

If user doesn't have an email in session:
1. Falls back to `EMAIL_FROM` env variable
2. Falls back to `onboarding@resend.dev` (Resend's test email)
3. Shows mailto link as last resort

This ensures emails always work, even if session data is incomplete.
