# Email System Analysis - Career Lever AI

## Current State: What Exists

### ✅ **Email Composition (Working)**

**Files:**
- `src/app/career-finder/outreach/page.tsx` - Frontend UI
- `src/app/api/contacts/email-outreach/route.ts` - Generates subject/body
- `src/app/api/outreach/send/route.ts` - Sends emails via Resend
- `src/lib/email-service.ts` - Email composition logic
- `src/lib/email-providers/resend-provider.ts` - Resend integration

**What It Does:**
1. ✅ Loads resume, cover letter, job data
2. ✅ Generates personalized email subject
3. ✅ Generates personalized email body with:
   - Hiring manager name (if available)
   - Job title and company
   - Key qualifications from resume
   - Match score
4. ✅ Attaches resume PDF
5. ✅ Attaches cover letter PDF
6. ✅ Sends via Resend using **user's email as FROM**
7. ✅ Sets replyTo to user's email

**Current Email Template:**
```
Subject: Application for [Job Title] - [User Name]

Dear [Hiring Manager Name],

I am writing to express my strong interest in the [Job Title] position at [Company]. 
As [Their Title], I believe you would be the right person to discuss how my 
qualifications align with your team's needs.

KEY QUALIFICATIONS:
• [Skill 1]
• [Skill 2]
• [Skill 3]

My background shows a [X]% alignment with your requirements, particularly in 
[Top Skill] needed for this role.

I have attached my resume and cover letter for your review. I would welcome 
the opportunity to discuss how I can contribute to [Company]'s success.

Thank you for your consideration. I look forward to speaking with you.

Best regards,
[User Name]

---
Resume and cover letter attached
```

---

## ❌ **What's Missing**

### 1. **Gmail/Outlook Integration for Sending**
**Current:** Uses Resend API (requires API key)
**Missing:** Direct Gmail/Outlook OAuth integration

**What You Need:**
- Gmail OAuth setup (already have OAuthToken model)
- Send via user's actual Gmail/Outlook account
- Creates "Career Lever" folder automatically

### 2. **Inbox Response Tracking**
**Current:** Stub exists in `/api/inbox/sync/route.ts` but not functional
**Missing:**
- Poll Gmail/Outlook for responses
- Match responses to sent applications
- Parse response type (interview request, rejection, etc.)

### 3. **Notification Bell Integration**
**Current:** Notification system exists but not wired to email responses
**Files:**
- `src/lib/notification-service.ts` ✅ Exists
- `src/models/Notification.ts` ✅ Exists
- `src/app/api/notifications/` ✅ API routes exist

**Missing:**
- Create notification when email response received
- Show in dashboard notification bell
- Link notification to application

---

## 🔧 **What You Need to Do**

### **Option A: Keep Using Resend (Current - Works Now)**

**Pros:**
- ✅ Already working
- ✅ Uses user's email as FROM
- ✅ No OAuth setup needed
- ✅ Reliable delivery

**Cons:**
- ❌ Cannot read responses automatically
- ❌ No "Career Lever" folder in inbox
- ❌ User must manually check their email for responses

**Your Action:**
1. Nothing - it already works!
2. User sends from their email via Resend
3. Responses go to their normal inbox
4. They manually update application status

---

### **Option B: Add Gmail/Outlook OAuth (Recommended)**

**Pros:**
- ✅ Sends from user's actual Gmail/Outlook
- ✅ Can create "Career Lever" folder
- ✅ Can read responses automatically
- ✅ Can trigger notifications

**Cons:**
- ⚠️ Requires OAuth setup
- ⚠️ More complex implementation

**Your Action:**

#### **Step 1: Set Up Gmail OAuth**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.labels`
4. Add to `.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```

#### **Step 2: Set Up Outlook OAuth**
1. Go to Azure Portal
2. Register app
3. Add permissions:
   - `Mail.Send`
   - `Mail.Read`
   - `MailboxSettings.ReadWrite`
4. Add to `.env`:
   ```
   OUTLOOK_CLIENT_ID=your_client_id
   OUTLOOK_CLIENT_SECRET=your_secret
   ```

#### **Step 3: Update Code**

**A. Create Gmail Send Function:**
```typescript
// src/lib/email-providers/gmail-provider.ts
import { google } from 'googleapis'

export async function sendViaGmail(params: {
  accessToken: string
  to: string
  subject: string
  body: string
  attachments?: Array<{ filename: string; content: string }>
}) {
  const gmail = google.gmail({ version: 'v1' })
  
  // Create email with attachments
  const email = createMimeMessage(params)
  
  // Send
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: Buffer.from(email).toString('base64')
    },
    auth: params.accessToken
  })
  
  // Create "Career Lever" label/folder
  await createCareerLeverLabel(gmail, params.accessToken)
  
  // Add sent email to folder
  await gmail.users.messages.modify({
    userId: 'me',
    id: response.data.id!,
    requestBody: {
      addLabelIds: ['Career Lever']
    }
  })
  
  return response.data
}
```

**B. Create Response Polling:**
```typescript
// src/lib/email-providers/gmail-inbox.ts
export async function pollGmailResponses(accessToken: string, userId: string) {
  const gmail = google.gmail({ version: 'v1' })
  
  // Get emails from last 7 days in Career Lever folder
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'label:Career-Lever newer_than:7d',
    auth: accessToken
  })
  
  const messages = response.data.messages || []
  
  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      auth: accessToken
    })
    
    // Parse email
    const from = getHeader(full.data, 'From')
    const subject = getHeader(full.data, 'Subject')
    const body = getBody(full.data)
    
    // Match to application
    const app = await JobApplication.findOne({
      userId,
      'contact.email': from
    })
    
    if (app) {
      // Create notification
      await NotificationService.createNotification({
        userId,
        type: 'application_update',
        title: 'Email Response Received',
        message: `${app.company} responded to your application`,
        priority: 'high',
        read: false,
        actionUrl: `/applications/${app._id}`,
        metadata: {
          applicationId: app._id,
          from,
          subject
        }
      })
      
      // Update application status
      if (subject.toLowerCase().includes('interview')) {
        app.applicationStatus = 'interviewing'
      } else if (subject.toLowerCase().includes('offer')) {
        app.applicationStatus = 'offer'
      } else if (subject.toLowerCase().includes('reject')) {
        app.applicationStatus = 'rejected'
      }
      
      await app.save()
    }
  }
}
```

**C. Update Send Route:**
```typescript
// src/app/api/outreach/send/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  // Check if user has Gmail OAuth token
  const gmailToken = await OAuthToken.findOne({
    userId: session.user.id,
    provider: 'gmail'
  })
  
  if (gmailToken && gmailToken.accessToken) {
    // Send via Gmail
    const result = await sendViaGmail({
      accessToken: gmailToken.accessToken,
      to: contact.email,
      subject: email.subject,
      body: email.body,
      attachments
    })
    
    return NextResponse.json({ success: true, provider: 'gmail' })
  }
  
  // Fallback to Resend
  const result = await resendProvider.send({
    to: contact.email,
    from: session.user.email,
    subject: email.subject,
    body: email.body,
    attachments
  })
  
  return NextResponse.json({ success: true, provider: 'resend' })
}
```

**D. Create Polling Cron Job:**
```typescript
// src/app/api/cron/poll-inbox/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get all users with Gmail tokens
  const tokens = await OAuthToken.find({ provider: 'gmail' })
  
  for (const token of tokens) {
    try {
      await pollGmailResponses(token.accessToken, token.userId)
    } catch (error) {
      console.error(`Failed to poll for user ${token.userId}:`, error)
    }
  }
  
  return NextResponse.json({ success: true, processed: tokens.length })
}
```

**E. Set Up Railway Cron:**
In Railway dashboard:
1. Add cron job: `0 */6 * * *` (every 6 hours)
2. URL: `https://your-app.railway.app/api/cron/poll-inbox`
3. Headers: `Authorization: Bearer YOUR_CRON_SECRET`

---

## 📊 **Summary**

### **Current Setup (Working Now):**
✅ Sends emails via Resend using user's email
✅ Attaches resume + cover letter PDFs
✅ Personalized subject and body
✅ Hiring manager name if available
❌ Cannot read responses
❌ No automatic notifications
❌ No "Career Lever" folder

### **To Add Gmail/Outlook Integration:**
1. Set up OAuth credentials (Google Cloud + Azure)
2. Create Gmail/Outlook send functions
3. Create inbox polling function
4. Wire to notification system
5. Set up cron job to poll every 6 hours

### **Estimated Time:**
- OAuth setup: 1-2 hours
- Code implementation: 3-4 hours
- Testing: 1-2 hours
- **Total: 5-8 hours**

### **Recommendation:**
**Start with Option A (Resend)** - it works now and users can send emails immediately. Add Gmail/Outlook integration later as an enhancement.

---

## 🔔 **Notification Bell (Already Exists)**

**Location:** Dashboard header (check `src/app/dashboard` components)

**To Wire Email Responses:**
1. When email response detected → Create notification
2. Notification appears in bell
3. Click notification → Go to application page
4. See email thread

**Code Already Exists:**
- ✅ `NotificationService.createNotification()`
- ✅ `NotificationService.getUnreadCount()`
- ✅ `/api/notifications/` routes
- ✅ Notification model

**Just Need:**
- Call `createNotification()` when email response detected
- Type: `'application_update'`
- Priority: `'high'`
- ActionUrl: `/applications/${appId}`
