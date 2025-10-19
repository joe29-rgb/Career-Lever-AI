# 📱 Device Testing Checklist - Phase 2

## **Overview**

This comprehensive checklist ensures Career Lever AI works perfectly on real devices before app store submission. Test on physical devices whenever possible.

---

## **Test Devices**

### **iOS Devices (Minimum)**
- [ ] iPhone 15 Pro Max (6.7", iOS 17+)
- [ ] iPhone 14 (6.1", iOS 16+)
- [ ] iPhone SE (4.7", iOS 15+)
- [ ] iPad Pro 12.9" (iPadOS 17+)
- [ ] iPad Air (10.9", iPadOS 16+)

### **Android Devices (Minimum)**
- [ ] Pixel 7 Pro (Android 14)
- [ ] Samsung Galaxy S23 (Android 13)
- [ ] OnePlus 11 (Android 13)
- [ ] Pixel Tablet (Android 14)
- [ ] Samsung Galaxy Tab S8 (Android 13)

### **Emulators/Simulators (Backup)**
- [ ] iOS Simulator (Xcode)
- [ ] Android Emulator (Android Studio)

---

## **1. Installation & Launch Testing**

### **1.1 Installation**
- [ ] App installs successfully from build
- [ ] Installation completes without errors
- [ ] App icon appears on home screen
- [ ] App icon looks sharp (no pixelation)
- [ ] App name displays correctly
- [ ] Installation size is reasonable (<50MB)

### **1.2 First Launch**
- [ ] Splash screen displays correctly
- [ ] Splash screen duration is appropriate (2-3 seconds)
- [ ] App loads without crashing
- [ ] No white screen/blank screen issues
- [ ] Onboarding flow appears (for new users)
- [ ] Loading indicators work properly

### **1.3 Permissions**
- [ ] Permission requests appear at appropriate times
- [ ] Permission dialogs have clear explanations
- [ ] App works with permissions denied
- [ ] App gracefully handles permission changes
- [ ] No unnecessary permission requests

---

## **2. Navigation Testing**

### **2.1 Bottom Navigation (Mobile)**
- [ ] All 5 nav items visible and accessible
- [ ] Active state highlights correctly
- [ ] Tap targets are 44x44px minimum
- [ ] Haptic feedback works on tap
- [ ] Navigation transitions are smooth
- [ ] No lag or stuttering
- [ ] Works in portrait and landscape

### **2.2 Screen Transitions**
- [ ] All screens load quickly (<1 second)
- [ ] Transitions are smooth (60fps)
- [ ] No flickering or flashing
- [ ] Back button works correctly
- [ ] Deep links work (if applicable)
- [ ] Navigation stack is correct

### **2.3 Gestures**
- [ ] Swipe back works (iOS)
- [ ] Pull to refresh works
- [ ] Scroll momentum feels natural
- [ ] Pinch to zoom works (where applicable)
- [ ] Long press actions work
- [ ] No accidental gesture triggers

---

## **3. UI/UX Testing**

### **3.1 Layout & Responsiveness**
- [ ] UI adapts to different screen sizes
- [ ] No content cut off or hidden
- [ ] Text is readable (minimum 16px)
- [ ] Images load and display correctly
- [ ] Icons are sharp and clear
- [ ] Spacing and padding are consistent
- [ ] No overlapping elements

### **3.2 Safe Areas (Notch/Dynamic Island)**
- [ ] Content respects safe areas
- [ ] No content behind notch
- [ ] Status bar area handled correctly
- [ ] Bottom navigation above home indicator
- [ ] Landscape mode safe areas work
- [ ] iPad safe areas work

### **3.3 Touch Targets**
- [ ] All buttons are 44x44px minimum
- [ ] Touch targets don't overlap
- [ ] Buttons respond immediately
- [ ] No accidental taps
- [ ] Swipe areas are clear
- [ ] Drag handles are large enough

### **3.4 Typography**
- [ ] All text is readable
- [ ] Font sizes are appropriate
- [ ] Line heights are comfortable
- [ ] Text doesn't overflow containers
- [ ] Dynamic type works (iOS)
- [ ] Font scaling works (Android)

### **3.5 Colors & Contrast**
- [ ] Colors meet WCAG 2.1 AA standards
- [ ] Text has sufficient contrast
- [ ] Links are distinguishable
- [ ] Focus states are visible
- [ ] Error states are clear
- [ ] Success states are obvious

---

## **4. Functionality Testing**

### **4.1 Authentication**
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Google OAuth works
- [ ] Password reset works
- [ ] Session persists across app restarts
- [ ] Logout works correctly
- [ ] Token refresh works

### **4.2 Onboarding Quiz**
- [ ] Quiz loads correctly
- [ ] All 5 questions display
- [ ] Progress bar updates
- [ ] Slider interactions work
- [ ] Dropdown selections work
- [ ] Multi-select works
- [ ] Validation works
- [ ] Success animation plays
- [ ] Confetti displays
- [ ] Haptic feedback works
- [ ] Data saves correctly
- [ ] Redirects to Career Finder

### **4.3 Career Finder**
- [ ] Job listings load
- [ ] Search works
- [ ] Filters work
- [ ] Job cards display correctly
- [ ] Swipe gestures work
- [ ] Save job works
- [ ] Apply button works
- [ ] Pagination works
- [ ] No duplicate listings

### **4.4 Resume Management**
- [ ] Upload resume works
- [ ] Resume displays correctly
- [ ] Edit resume works
- [ ] Delete resume works
- [ ] Download resume works
- [ ] AI customization works
- [ ] Preview looks correct
- [ ] Multiple resumes supported

### **4.5 Application Tracking**
- [ ] Applications list loads
- [ ] Add application works
- [ ] Edit application works
- [ ] Delete application works
- [ ] Status updates work
- [ ] Sorting works
- [ ] Filtering works
- [ ] Search works

### **4.6 Company Research**
- [ ] Research loads correctly
- [ ] AI insights display
- [ ] Perplexity API works
- [ ] Images load
- [ ] Links work
- [ ] Save research works
- [ ] Share works

### **4.7 Calendar Integration**
- [ ] Google Calendar connects
- [ ] Events sync correctly
- [ ] Add event works
- [ ] Edit event works
- [ ] Delete event works
- [ ] Reminders work
- [ ] Timezone handling correct

---

## **5. Performance Testing**

### **5.1 Load Times**
- [ ] App launches in <3 seconds
- [ ] Screens load in <1 second
- [ ] API calls complete in <2 seconds
- [ ] Images load progressively
- [ ] No blocking operations
- [ ] Lazy loading works

### **5.2 Memory Usage**
- [ ] App uses <200MB RAM (idle)
- [ ] No memory leaks
- [ ] Memory releases after navigation
- [ ] Large lists don't cause issues
- [ ] Image caching works
- [ ] No crashes from memory pressure

### **5.3 Battery Usage**
- [ ] No excessive battery drain
- [ ] Background tasks are minimal
- [ ] Location services used efficiently
- [ ] Network requests are batched
- [ ] No unnecessary wake locks

### **5.4 Network Performance**
- [ ] Works on WiFi
- [ ] Works on 4G/5G
- [ ] Works on slow 3G
- [ ] Offline mode works (if applicable)
- [ ] Network errors handled gracefully
- [ ] Retry logic works
- [ ] Caching works

### **5.5 Animations**
- [ ] All animations run at 60fps
- [ ] No dropped frames
- [ ] Transitions are smooth
- [ ] Loading animations work
- [ ] Success animations work
- [ ] Reduced motion respected

---

## **6. Keyboard & Input Testing**

### **6.1 Keyboard Behavior**
- [ ] Keyboard appears when expected
- [ ] Keyboard doesn't cover input fields
- [ ] Keyboard dismisses correctly
- [ ] Return key works
- [ ] Tab navigation works
- [ ] Auto-correct works
- [ ] Auto-capitalize works

### **6.2 Form Inputs**
- [ ] Text inputs work
- [ ] Email inputs validate
- [ ] Password inputs hide text
- [ ] Number inputs accept numbers only
- [ ] Date pickers work
- [ ] Dropdowns work
- [ ] Checkboxes work
- [ ] Radio buttons work

### **6.3 Input Validation**
- [ ] Required fields validated
- [ ] Email format validated
- [ ] Password strength checked
- [ ] Error messages clear
- [ ] Inline validation works
- [ ] Submit disabled until valid

---

## **7. Accessibility Testing**

### **7.1 Screen Reader (VoiceOver/TalkBack)**
- [ ] All elements have labels
- [ ] Labels are descriptive
- [ ] Navigation order is logical
- [ ] Buttons announce correctly
- [ ] Images have alt text
- [ ] Forms are navigable
- [ ] Errors are announced

### **7.2 Visual Accessibility**
- [ ] Text scales with system settings
- [ ] High contrast mode works
- [ ] Color blind friendly
- [ ] Focus indicators visible
- [ ] Sufficient color contrast
- [ ] No color-only indicators

### **7.3 Motor Accessibility**
- [ ] Large touch targets (44x44px)
- [ ] No time-based interactions
- [ ] Gestures have alternatives
- [ ] No precise gestures required
- [ ] Voice control works (iOS)
- [ ] Switch control works

### **7.4 Cognitive Accessibility**
- [ ] Clear, simple language
- [ ] Consistent navigation
- [ ] Predictable behavior
- [ ] Error messages helpful
- [ ] Undo actions available
- [ ] No flashing content

---

## **8. Orientation & Multitasking**

### **8.1 Orientation Changes**
- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Rotation is smooth
- [ ] Layout adapts correctly
- [ ] No content loss on rotation
- [ ] State persists

### **8.2 Multitasking (iOS)**
- [ ] App switcher works
- [ ] Split view works (iPad)
- [ ] Slide over works (iPad)
- [ ] Picture-in-picture works (if applicable)
- [ ] State restores correctly

### **8.3 Multitasking (Android)**
- [ ] Recent apps works
- [ ] Split screen works
- [ ] Pop-up view works
- [ ] Background tasks work
- [ ] State restores correctly

---

## **9. Error Handling**

### **9.1 Network Errors**
- [ ] No internet error shown
- [ ] Timeout errors handled
- [ ] 404 errors handled
- [ ] 500 errors handled
- [ ] Retry option available
- [ ] Error messages clear

### **9.2 API Errors**
- [ ] Authentication errors handled
- [ ] Rate limit errors handled
- [ ] Validation errors shown
- [ ] Server errors handled
- [ ] Fallback content shown

### **9.3 App Errors**
- [ ] Crashes are caught
- [ ] Error boundaries work
- [ ] Crash reports sent
- [ ] User notified gracefully
- [ ] Recovery options provided

---

## **10. Security Testing**

### **10.1 Data Security**
- [ ] Sensitive data encrypted
- [ ] No data in logs
- [ ] Secure storage used
- [ ] API keys not exposed
- [ ] HTTPS enforced
- [ ] Certificate pinning (if applicable)

### **10.2 Authentication Security**
- [ ] Tokens stored securely
- [ ] Session timeout works
- [ ] Logout clears data
- [ ] Biometric auth works (if applicable)
- [ ] No credentials in memory

### **10.3 Privacy**
- [ ] Privacy policy accessible
- [ ] Data collection disclosed
- [ ] User consent obtained
- [ ] Data export works
- [ ] Data deletion works
- [ ] No tracking without consent

---

## **11. Platform-Specific Testing**

### **11.1 iOS-Specific**
- [ ] Dynamic Island handled (iPhone 14 Pro+)
- [ ] Face ID works
- [ ] Touch ID works
- [ ] 3D Touch works (older devices)
- [ ] Haptic feedback works
- [ ] Siri shortcuts work (if applicable)
- [ ] Widgets work (if applicable)
- [ ] App clips work (if applicable)

### **11.2 Android-Specific**
- [ ] Material Design followed
- [ ] Back button works correctly
- [ ] Home button works
- [ ] Recent apps works
- [ ] Fingerprint auth works
- [ ] Face unlock works
- [ ] Widgets work (if applicable)
- [ ] App shortcuts work

---

## **12. Edge Cases & Stress Testing**

### **12.1 Edge Cases**
- [ ] Empty states display correctly
- [ ] Very long text handled
- [ ] Very large numbers handled
- [ ] Special characters work
- [ ] Emoji support works
- [ ] RTL languages work (if applicable)
- [ ] Airplane mode handled

### **12.2 Stress Testing**
- [ ] 1000+ items in list
- [ ] Rapid button tapping
- [ ] Quick navigation changes
- [ ] Multiple simultaneous requests
- [ ] Low storage space
- [ ] Low battery mode
- [ ] Background app refresh

---

## **13. Compliance Testing**

### **13.1 App Store Guidelines**
- [ ] No prohibited content
- [ ] No misleading features
- [ ] Privacy policy linked
- [ ] Terms of service linked
- [ ] Age rating appropriate
- [ ] In-app purchases disclosed (if applicable)
- [ ] Subscriptions clear (if applicable)

### **13.2 Legal Compliance**
- [ ] GDPR compliant (EU)
- [ ] CCPA compliant (California)
- [ ] COPPA compliant (children)
- [ ] Accessibility compliant (ADA)
- [ ] Data retention policies followed

---

## **14. Final Pre-Submission Checks**

### **14.1 Build Quality**
- [ ] No console errors
- [ ] No console warnings
- [ ] No debug code
- [ ] No test data
- [ ] Version number correct
- [ ] Build number incremented
- [ ] Release notes prepared

### **14.2 Assets**
- [ ] App icon correct
- [ ] Splash screen correct
- [ ] Screenshots ready
- [ ] Feature graphic ready (Android)
- [ ] Promotional images ready
- [ ] App Store description ready

### **14.3 Metadata**
- [ ] App name correct
- [ ] Subtitle/tagline correct
- [ ] Description compelling
- [ ] Keywords optimized
- [ ] Category correct
- [ ] Age rating correct
- [ ] Support URL working
- [ ] Privacy policy URL working

---

## **Issue Tracking Template**

### **Critical Issues (Blocking)**
| Issue | Device | OS | Steps to Reproduce | Status |
|-------|--------|----|--------------------|--------|
| App crashes on launch | iPhone 14 | iOS 17.1 | 1. Open app 2. Crash | 🔴 Open |

### **High Priority Issues**
| Issue | Device | OS | Steps to Reproduce | Status |
|-------|--------|----|--------------------|--------|
| Navigation lag | Pixel 7 | Android 14 | 1. Tap nav item 2. Delay | 🟡 In Progress |

### **Medium Priority Issues**
| Issue | Device | OS | Steps to Reproduce | Status |
|-------|--------|----|--------------------|--------|
| Text overflow | iPad Air | iPadOS 16 | 1. View profile 2. Text cuts off | 🟢 Fixed |

### **Low Priority Issues**
| Issue | Device | OS | Steps to Reproduce | Status |
|-------|--------|----|--------------------|--------|
| Minor UI alignment | Galaxy S23 | Android 13 | 1. View settings 2. Slight misalignment | ⚪ Backlog |

---

## **Testing Report Template**

```markdown
# Device Testing Report - [Date]

## Test Summary
- **Tester:** [Name]
- **Date:** [Date]
- **Build:** [Version]
- **Devices Tested:** [List]

## Results
- **Total Tests:** [Number]
- **Passed:** [Number]
- **Failed:** [Number]
- **Blocked:** [Number]

## Critical Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Sign-Off
- [ ] Ready for submission
- [ ] Needs fixes before submission

**Tester Signature:** _______________
**Date:** _______________
```

---

## **Next Steps**

After completing all tests:
1. ✅ Document all issues
2. ✅ Fix critical and high-priority issues
3. ✅ Retest fixed issues
4. ✅ Get sign-off from QA
5. ✅ Proceed to app store submission

**Status:** Ready for device testing  
**Time Required:** 8-16 hours (comprehensive)  
**Blocker:** Need physical devices or emulators
