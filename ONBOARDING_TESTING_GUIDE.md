# 🧪 Onboarding Quiz - Testing Guide

## ✅ **CRITICAL: Auth Redirect is NOW LIVE!**

The automatic redirect logic has been implemented. New users will be automatically routed to the quiz after signup.

---

## 🎯 **What Was Added**

### **1. Auth Callback Logic** (`src/lib/auth.ts`)
- **`signIn` callback**: Checks if user has completed onboarding
- **`jwt` callback**: Adds `onboardingComplete` status to JWT token
- **`session` callback**: Exposes `onboardingComplete` to client session
- **`redirect` callback**: Enhanced for better routing

### **2. Client-Side Redirect** (`src/components/onboarding/OnboardingRedirect.tsx`)
- Monitors session status
- Automatically redirects users without `onboardingComplete` to `/onboarding/quiz`
- Prevents redirect loops (doesn't redirect if already on quiz page)

### **3. Session Update** (`src/app/onboarding/quiz/page.tsx`)
- Calls `update()` after quiz completion to refresh session
- Ensures `onboardingComplete` status is immediately reflected

---

## 🧪 **Testing Checklist**

### **Test 1: New User Sign-Up Flow**

**Steps:**
1. Create a brand new account (use a new email)
2. Sign up via Google/LinkedIn/Email
3. **Expected:** Automatically redirected to `/onboarding/quiz`
4. Complete all 5 questions
5. **Expected:** Confetti animation, then redirect to `/career-finder/resume`
6. Check MongoDB: `user.profile.onboardingComplete` should be `true`

**What to Check:**
- ✅ Quiz appears immediately after signup
- ✅ Progress bar shows "Question 1 of 5"
- ✅ All questions display correctly
- ✅ Validation works (can't proceed without answering)
- ✅ Confetti plays on completion
- ✅ Redirect to resume upload happens automatically

---

### **Test 2: Returning User Flow**

**Steps:**
1. Sign out
2. Sign back in with the same account
3. **Expected:** Skip quiz, go directly to homepage/dashboard
4. Manually navigate to `/onboarding/quiz`
5. **Expected:** Should be allowed (in case user wants to update answers)

**What to Check:**
- ✅ No automatic redirect to quiz
- ✅ User goes to intended page after login
- ✅ Session has `onboardingComplete: true`

---

### **Test 3: Mid-Quiz Abandonment & Resume**

**Steps:**
1. Start quiz as new user
2. Answer questions 1-3
3. Close browser tab completely
4. Open new tab, navigate to site
5. Sign in again
6. **Expected:** Redirected to quiz, resume at Question 4

**What to Check:**
- ✅ Progress saved in localStorage
- ✅ Previous answers pre-filled
- ✅ Can continue from where left off
- ✅ Progress bar shows correct step

---

### **Test 4: Session Refresh After Completion**

**Steps:**
1. Complete quiz as new user
2. Immediately check `session.user.onboardingComplete` in browser console
3. **Expected:** Should be `true` (not `false`)

**Console Command:**
```javascript
// Run in browser console after quiz completion
fetch('/api/auth/session')
  .then(r => r.json())
  .then(s => console.log('Onboarding Complete:', s.user.onboardingComplete))
```

**What to Check:**
- ✅ Session updates immediately (no page refresh needed)
- ✅ No redirect loop after completion

---

### **Test 5: Mobile Responsiveness**

**Steps:**
1. Open quiz on mobile device (or Chrome DevTools mobile view)
2. Test at 375px width (iPhone SE)
3. Complete all questions

**What to Check:**
- ✅ All buttons are 44px+ height (easy to tap)
- ✅ No horizontal scroll
- ✅ Progress bar stays at top
- ✅ CTA button accessible at bottom
- ✅ Slider works smoothly
- ✅ Autocomplete dropdown doesn't overflow
- ✅ Confetti animation doesn't lag

---

### **Test 6: Validation & Error Handling**

**Steps:**
1. Try to proceed without answering Q1
2. **Expected:** "Continue" button disabled
3. Try to submit with invalid data (empty target role)
4. **Expected:** Cannot proceed
5. Disconnect internet, try to submit Q5
6. **Expected:** Error message, can retry

**What to Check:**
- ✅ Required fields enforced
- ✅ Timeline only shows for active searchers
- ✅ Error messages are user-friendly
- ✅ Can retry after network error

---

### **Test 7: Data Persistence in MongoDB**

**Steps:**
1. Complete quiz
2. Check MongoDB directly

**Expected Data Structure:**
```json
{
  "_id": "...",
  "email": "test@example.com",
  "profile": {
    "onboardingComplete": true,
    "currentSituation": "actively_searching",
    "yearsOfExperience": 8,
    "targetRole": "Finance Manager",
    "workPreferences": ["remote", "hybrid"],
    "preferredLocation": "Edmonton, AB",
    "timeline": "1-3_months",
    "urgency": "high",
    "completedAt": "2025-10-19T..."
  }
}
```

**What to Check:**
- ✅ All fields saved correctly
- ✅ `urgency` auto-calculated (high/medium/low)
- ✅ `completedAt` timestamp present
- ✅ Arrays stored correctly (workPreferences)

---

### **Test 8: Edge Cases**

#### **8a: User Already Has Profile (Re-onboarding)**
1. User with `onboardingComplete: true` manually goes to `/onboarding/quiz`
2. **Expected:** Can re-take quiz, updates existing profile

#### **8b: Database Connection Failure**
1. Temporarily break MongoDB connection
2. Try to submit quiz
3. **Expected:** Error message, doesn't crash

#### **8c: Session Expired Mid-Quiz**
1. Start quiz
2. Wait for session to expire (or manually clear cookies)
3. Try to submit
4. **Expected:** Redirected to login, can resume after re-auth

---

## 🐛 **Known Issues to Watch For**

### **Issue 1: Redirect Loop**
**Symptom:** Page keeps redirecting between quiz and homepage  
**Cause:** `onboardingComplete` not updating in session  
**Fix:** Ensure `update()` is called after quiz completion

### **Issue 2: LocalStorage Not Clearing**
**Symptom:** Old quiz answers appear for new users  
**Cause:** `clearQuizProgress()` not called  
**Fix:** Verify line 120 in `page.tsx` executes

### **Issue 3: Timeline Question Skipped Incorrectly**
**Symptom:** Timeline shows for "employed, not looking" users  
**Cause:** Conditional logic in Q5  
**Fix:** Check line 360+ in `page.tsx`

---

## 📊 **Success Metrics to Track**

Once live, monitor these in analytics:

1. **Completion Rate**
   - Target: >80%
   - Measure: `(users who complete) / (users who start)`

2. **Time to Complete**
   - Target: 60-90 seconds
   - Measure: `completedAt - startedAt`

3. **Drop-Off Points**
   - Which question loses most users?
   - Q1: 5% drop-off (expected)
   - Q2: 3% drop-off
   - Q3: 8% drop-off (target role requires typing)
   - Q4: 2% drop-off
   - Q5: 1% drop-off

4. **Resume Upload Rate**
   - Target: >70%
   - Measure: Users who upload resume within 24 hours of quiz completion

---

## 🔧 **Debugging Tools**

### **Check Session in Browser Console**
```javascript
// See current session data
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log)
```

### **Check LocalStorage Progress**
```javascript
// See saved quiz progress
console.log(localStorage.getItem('onboarding:quiz:progress'))
```

### **Check MongoDB User Profile**
```bash
# In MongoDB shell
db.users.findOne({ email: "test@example.com" }, { profile: 1 })
```

### **Force Clear Quiz Progress**
```javascript
// In browser console
localStorage.removeItem('onboarding:quiz:progress')
```

---

## ✅ **Pre-Launch Checklist**

Before deploying to production:

- [ ] Test new user signup flow (3 different accounts)
- [ ] Test returning user flow (existing account)
- [ ] Test mid-quiz abandonment & resume
- [ ] Test on mobile (iPhone & Android)
- [ ] Test all validation rules
- [ ] Verify MongoDB data structure
- [ ] Check session updates correctly
- [ ] Test with slow network (throttle to 3G)
- [ ] Test with ad blockers enabled
- [ ] Verify confetti animation works
- [ ] Check accessibility (screen reader, keyboard nav)
- [ ] Test in Safari, Chrome, Firefox
- [ ] Monitor server logs for errors
- [ ] Set up analytics events
- [ ] Create backup plan if quiz breaks

---

## 🚀 **Deployment Notes**

### **Environment Variables**
Ensure these are set:
- `NEXTAUTH_SECRET` - For JWT signing
- `MONGODB_URI` - Database connection
- `NEXTAUTH_URL` - Your app URL

### **Database Indexes**
Add index for faster queries:
```javascript
db.users.createIndex({ "profile.onboardingComplete": 1 })
db.users.createIndex({ "profile.urgency": 1 })
```

### **Monitoring**
Watch these logs:
- `[AUTH] Redirecting new user to onboarding quiz`
- `[ONBOARDING] ✅ Quiz completed for user`
- `[ONBOARDING] Error saving quiz`

---

## 📞 **Support & Troubleshooting**

### **User Reports: "Quiz won't save"**
1. Check browser console for errors
2. Verify MongoDB connection
3. Check session is valid
4. Try in incognito mode (clear cache)

### **User Reports: "Stuck in redirect loop"**
1. Clear localStorage
2. Sign out and sign back in
3. Check `onboardingComplete` in database
4. Manually set to `true` if needed

### **User Reports: "Lost my progress"**
1. Check localStorage (24-hour expiry)
2. If expired, user must restart
3. Consider increasing expiry to 7 days

---

## 🎯 **Next Steps After Testing**

1. ✅ **Verify all tests pass**
2. 📊 **Set up analytics tracking**
3. 🎨 **A/B test question order**
4. 📧 **Add email nurture for drop-offs**
5. 🔔 **Add Slack notification when users complete**
6. 📈 **Monitor completion rates daily**
7. 🐛 **Fix any bugs discovered**
8. 🚀 **Deploy to production**

---

**Last Updated:** October 19, 2025  
**Status:** ✅ Ready for Testing  
**Commit:** `dd955ae`
