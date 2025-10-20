# 🐛 Known Issues - To Fix After Mobile App Store Launch

## **Priority: Post-Launch**

---

## **Issue #1: Onboarding Quiz Loop**

**Reported:** October 19, 2025, 6:41 PM  
**Status:** 🔴 Known Issue - Deferred  
**Priority:** High (post-launch)  
**Severity:** Major - Blocks user access

### **Description:**
Users are getting stuck in an infinite loop with the onboarding quiz questions when loading into the application.

### **User Impact:**
- Users cannot proceed past onboarding
- Prevents access to main application features
- Poor first-time user experience

### **Suspected Cause:**
- Onboarding completion state not being saved properly
- Quiz redirect logic may be checking wrong conditions
- LocalStorage/session state issue
- OnboardingRedirect component logic

### **Files to Investigate:**
1. `src/components/onboarding/OnboardingRedirect.tsx` - Redirect logic
2. `src/app/onboarding/quiz/page.tsx` - Quiz completion handling
3. `src/lib/onboarding-utils.ts` - State management
4. `src/app/layout.tsx` - OnboardingRedirect integration

### **Reproduction Steps:**
1. Load application
2. Complete onboarding quiz
3. Get redirected back to quiz (loop)

### **Temporary Workaround:**
- Clear browser localStorage
- Manually navigate to `/career-finder` or `/dashboard`

### **Fix Plan (After Mobile Launch):**
1. Debug OnboardingRedirect component
2. Check quiz completion state persistence
3. Verify redirect conditions
4. Add better state logging
5. Test with fresh user flow
6. Add escape hatch for stuck users

### **Estimated Fix Time:** 2-3 hours

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
