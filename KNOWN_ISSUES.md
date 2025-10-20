# 🐛 Known Issues - To Fix After Mobile App Store Launch

## **Priority: Post-Launch**

---

## **Issue #1: Onboarding Quiz Loop** ✅ FIXED

**Reported:** October 19, 2025, 6:41 PM  
**Fixed:** October 20, 2025, 1:04 PM  
**Status:** ✅ RESOLVED  
**Priority:** High  
**Severity:** Major - Blocks user access

### **Description:**
Users are getting stuck in an infinite loop with the onboarding quiz questions when loading into the application.

### **User Impact:**
- Users cannot proceed past onboarding
- Prevents access to main application features
- Poor first-time user experience

### **Root Cause (Identified):**
- JWT callback only checked `onboardingComplete` on first sign-in
- When user completed quiz, session token was never updated
- OnboardingRedirect kept seeing `onboardingComplete: false`
- Created infinite redirect loop to quiz page

### **Files to Investigate:**
1. `src/components/onboarding/OnboardingRedirect.tsx` - Redirect logic
2. `src/app/onboarding/quiz/page.tsx` - Quiz completion handling
3. `src/lib/onboarding-utils.ts` - State management
4. `src/app/layout.tsx` - OnboardingRedirect integration

### **Reproduction Steps:**
1. Load application
2. Complete onboarding quiz
3. Get redirected back to quiz (loop)

### **Fix Applied:**

**1. Updated JWT Callback (`src/lib/auth.ts`):**
```typescript
// Before: Only checked on first sign-in
if (!token.onboardingComplete) {
  // fetch from DB
}

// After: Always refresh on sign-in or session update
if (user || trigger === 'update') {
  const dbUser = await User.findOne({ email })
  token.onboardingComplete = dbUser?.profile?.onboardingComplete || false
}
```

**2. Improved OnboardingRedirect (`src/components/onboarding/OnboardingRedirect.tsx`):**
- Added `useRef` to prevent multiple redirects
- Check for exact `false` value (not just falsy)
- Exclude `/onboarding` and `/auth` paths from redirect
- Added detailed logging for debugging

**Actual Fix Time:** 15 minutes

### **Testing Required:**
- [ ] Fresh user signup
- [ ] Quiz completion
- [ ] State persistence
- [ ] Redirect logic
- [ ] Edge cases

---

## **Current Focus:**

🚀 **Mobile App Store Launch** (Priority 1)
- Generate app icons
- Capture screenshots  
- Device testing
- App store submission

**After launch, we'll fix the onboarding loop issue.**

---

**Last Updated:** October 19, 2025, 6:41 PM  
**Next Review:** After mobile app store submission
