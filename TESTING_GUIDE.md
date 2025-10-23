# Testing Guide - Phase 1 Implementation

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure environment variables are set:**
   ```bash
   PERPLEXITY_API_KEY=your_key_here
   RESEND_API_KEY=your_key_here (optional for email testing)
   MONGODB_URI=your_mongodb_uri
   ```

---

## Test 1: Cover Letter Generation (Raw Input Mode)

### Endpoint
```
POST http://localhost:3000/api/cover-letter/generate
```

### Headers
```
Content-Type: application/json
Cookie: next-auth.session-token=<your_session_token>
```

### Request Body
```json
{
  "raw": true,
  "jobTitle": "Senior Software Engineer",
  "companyName": "TechCorp Inc",
  "jobDescription": "We are seeking a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies.",
  "resumeText": "John Doe\nSenior Software Engineer\n\nWORK EXPERIENCE\nSenior Developer, ABC Tech (2020 - Present)\n- Led development of microservices\n\nSoftware Engineer, XYZ Corp (2018 - 2020)\n- Built React applications\n\nEDUCATION\nB.S. Computer Science (2018)",
  "template": "modern",
  "tone": "professional",
  "save": false
}
```

### Expected Response
```json
{
  "success": true,
  "coverLetter": "<generated cover letter text>",
  "keyPoints": [],
  "authenticity": {
    "isValid": true,
    "violations": [],
    "warnings": [],
    "authenticityScore": 0.95
  },
  "wordCount": 350,
  "preview": {
    "html": "<formatted HTML preview>"
  }
}
```

### What to Check
- ✅ Cover letter is generated (not empty)
- ✅ No "decades of experience" or exaggerated claims
- ✅ Authenticity score > 0.8
- ✅ Word count between 300-500
- ✅ Preview HTML is properly formatted
- ✅ Response time < 5 seconds

---

## Test 2: Email Outreach with PDF Attachments

### Endpoint
```
POST http://localhost:3000/api/outreach/send
```

### Request Body
```json
{
  "contact": {
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  "email": {
    "subject": "Application for Senior Software Engineer Position",
    "body": "Dear Jane,\n\nI am writing to express my interest in the Senior Software Engineer position at TechCorp Inc.\n\nBest regards,\nJohn Doe"
  },
  "resumeHTML": "<h1>John Doe</h1><p>Senior Software Engineer with 6 years of experience...</p>",
  "coverLetterHTML": "<p>Dear Hiring Manager,</p><p>I am excited to apply...</p>",
  "send_immediately": true
}
```

### Expected Response (Success)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "message_id": "abc123...",
  "attachments_sent": 2,
  "contact": {
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  "sent_at": "2025-01-15T10:30:00.000Z"
}
```

### Expected Response (No API Key)
```json
{
  "error": "Email service not configured",
  "details": "RESEND_API_KEY environment variable is not set.",
  "mailto_fallback": "mailto:jane.smith@example.com?subject=...",
  "contact_email": "jane.smith@example.com"
}
```

### What to Check
- ✅ Email validation rejects invalid formats
- ✅ Email validation rejects disposable domains
- ✅ PDFs are generated (check console logs for byte sizes)
- ✅ If RESEND_API_KEY is set, email sends successfully
- ✅ If no API key, proper fallback message provided
- ✅ SentEmail record created in database
- ✅ Rate limit enforced (5 per hour)

---

## Test 3: Alert Preferences API

### Get Preferences
```
GET http://localhost:3000/api/alerts/preferences
```

### Expected Response
```json
{
  "preferences": {
    "userId": "user123",
    "enabled": true,
    "channels": {
      "email": true,
      "inApp": true,
      "push": false
    },
    "alertTypes": {
      "newJobMatches": true,
      "applicationUpdates": true,
      "interviewReminders": true,
      "followUpReminders": true,
      "deadlineAlerts": true,
      "responseTimeAlerts": false,
      "networkActivity": false
    },
    "frequency": "realtime",
    "quietHours": {
      "enabled": false,
      "start": "22:00",
      "end": "08:00",
      "timezone": "America/Toronto"
    }
  }
}
```

### Update Preferences
```
PATCH http://localhost:3000/api/alerts/preferences
```

### Request Body
```json
{
  "preferences": {
    "channels": {
      "email": false,
      "inApp": true,
      "push": true
    },
    "quietHours": {
      "enabled": true,
      "start": "23:00",
      "end": "07:00",
      "timezone": "America/New_York"
    }
  }
}
```

### What to Check
- ✅ Default preferences created on first GET
- ✅ Preferences persist across requests
- ✅ PATCH updates only specified fields
- ✅ All fields validated properly

---

## Test 4: PDF Generation Quality

### Manual Test
1. Generate a cover letter via API
2. Extract the `preview.html` from response
3. Save to a file and open in browser
4. Check formatting:
   - ✅ Proper paragraph spacing
   - ✅ Professional font (Georgia/Times New Roman)
   - ✅ Readable line height (1.6)
   - ✅ Template badge visible
   - ✅ No HTML tags visible in text

### PDF Test (if you have the PDF)
1. Generate email with attachments
2. Check PDF files:
   - ✅ Opens in PDF reader
   - ✅ Contains actual text (not just "PDF content")
   - ✅ Proper formatting
   - ✅ File size > 1KB (not empty)

---

## Test 5: Rate Limiting

### Cover Letter Rate Limit
- Endpoint: `/api/cover-letter/generate`
- Limit: 1000 per hour
- Test: Make 1001 requests rapidly
- Expected: 1001st request returns 429 status

### Email Rate Limit
- Endpoint: `/api/outreach/send`
- Limit: 5 per hour
- Test: Make 6 requests rapidly
- Expected: 6th request returns 429 status with message "Maximum 5 emails per hour"

---

## Test 6: Database Logging

### Check SentEmail Collection
```javascript
// In MongoDB shell or Compass
db.sentemails.find({ userId: "your_user_id" }).sort({ sentAt: -1 })
```

### Expected Fields
- ✅ `userId` - User who sent the email
- ✅ `contactEmail` - Recipient email
- ✅ `contactName` - Recipient name
- ✅ `subject` - Email subject
- ✅ `body` - Email body
- ✅ `attachments` - Array with filename and size
- ✅ `status` - "sent" or "failed"
- ✅ `messageId` - Resend message ID (if successful)
- ✅ `error` - Error message (if failed)
- ✅ `sentAt` - Timestamp

---

## Test 7: Error Handling

### Test Invalid Email Format
```json
{
  "contact": {
    "email": "not-an-email"
  }
}
```
**Expected:** 400 error with "Invalid email format"

### Test Disposable Domain
```json
{
  "contact": {
    "email": "test@mailinator.com"
  }
}
```
**Expected:** 400 error with "Invalid email domain"

### Test Missing Required Fields
```json
{
  "raw": true,
  "jobTitle": "Engineer"
  // Missing companyName, resumeText, jobDescription
}
```
**Expected:** 400 error with validation details

---

## Test 8: Integration Test (Full Flow)

### Complete User Journey
1. **Generate Cover Letter**
   - POST `/api/cover-letter/generate` with raw input
   - Save the `coverLetter` text

2. **Generate Resume** (if implemented)
   - POST `/api/resume-builder/generate`
   - Save the resume HTML

3. **Send Email**
   - POST `/api/outreach/send` with both resume and cover letter
   - Check email received (if RESEND_API_KEY configured)

4. **Check Database**
   - Verify `SentEmail` record created
   - Verify attachments logged

5. **Check Alert Preferences**
   - GET `/api/alerts/preferences`
   - Verify defaults created

### Success Criteria
- ✅ All API calls succeed
- ✅ PDFs generated successfully
- ✅ Email sent (or proper fallback provided)
- ✅ Database records created
- ✅ No console errors
- ✅ Response times < 5 seconds

---

## Common Issues & Solutions

### Issue: "Unauthorized" error
**Solution:** Ensure you're logged in and have a valid session cookie

### Issue: "Rate limit exceeded"
**Solution:** Wait 1 hour or restart the server (in-memory rate limit resets)

### Issue: "Email service not configured"
**Solution:** Add `RESEND_API_KEY` to `.env` file, or use the `mailto_fallback` URL

### Issue: PDF generation fails
**Solution:** Check console logs for errors, ensure `pdfkit` is installed

### Issue: "Validation failed"
**Solution:** Check request body matches schema, ensure all required fields present

### Issue: Cover letter has "decades of experience"
**Solution:** This should be fixed! If you see this, report as a bug

---

## Performance Benchmarks

### Expected Response Times
- Cover letter generation: 2-4 seconds
- Email sending: 1-3 seconds
- Alert preferences GET: < 100ms
- Alert preferences PATCH: < 200ms

### Expected PDF Sizes
- Resume PDF: 5-50 KB
- Cover letter PDF: 3-20 KB

### Rate Limit Thresholds
- Cover letter: 1000/hour
- Email sending: 5/hour
- General API: 1000/hour

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Document any bugs found
3. ✅ Proceed to Phase 2 (Resume Generation, Quiz Flow, Calendar)
4. ✅ Consider adding automated tests (Jest, Playwright)

---

**Last Updated:** January 2025  
**Phase:** 1 - Core Infrastructure  
**Status:** Ready for Testing
