# Resume & Cover Letter Template Mapping

## 📊 Current State vs Desired State

### **What You HAVE (7 Resume Templates):**
1. ✅ Modern (Two-Column with Timeline) - Sidebar style
2. ✅ Professional (Traditional Single-Column) - Classic
3. ✅ Creative (Asymmetric with Color) - Colorful badges
4. ✅ Tech-Focused (Developer) - Dark theme with code style
5. ✅ Minimal/ATS (Maximum Compatibility)
6. ✅ Executive (C-Suite/Director)
7. ✅ Curriculum Vitae (Academic/Research)

### **What You WANT (8 Templates from Screenshots):**
1. **Modern/Professional (Teal)** - Screenshot 1 ✅ MATCHES: Modern template
2. **Curriculum Vitae (Traditional)** - Screenshot 2 ✅ MATCHES: CV template
3. **Compact/Center-Aligned** - Screenshot 3 ⚠️ NEEDS UPDATE
4. **Sidebar (Blue)** - Screenshot 4 ✅ MATCHES: Modern template
5. **Minimalist/Serif** - Screenshot 5 ✅ MATCHES: Minimal template
6. **Teal Horizontal** - Screenshot 6 ⚠️ NEEDS NEW
7. **Two-Column Red** - Screenshot 7 ⚠️ NEEDS NEW
8. **Plus 3 more** - Waiting for screenshots

---

## 🎯 Action Items:

### **Phase 1: Update Existing Templates**
- [ ] Rename templates to match screenshot names
- [ ] Update colors to match (Teal, Blue, Red accents)
- [ ] Ensure print styles work (white background)

### **Phase 2: Create Missing Templates**
- [ ] Compact/Center-Aligned (Screenshot 3)
- [ ] Teal Horizontal (Screenshot 6)
- [ ] Two-Column Red (Screenshot 7)
- [ ] 3 more templates (waiting for screenshots)

### **Phase 3: Cover Letter Templates**
You have **14 cover letter templates** but they're NOT mapped to resume templates.

**Current Cover Letter Templates:**
1. Professional & Traditional
2. Modern & Conversational
3. Data-Driven & Metrics
4. Creative & Unique
5. Technical & Engineering
6. Executive & Leadership
7. Career Change
8. Entry-Level
9. Referral-Based
10. Cold Outreach
11. Internal Transfer
12. Freelance/Contract
13. Academic/Research
14. Startup/Entrepreneurial

**What You Need:**
- 2 cover letter templates PER resume template
- Total: 16 cover letter templates (8 resume × 2)
- Match styling (fonts, colors, layout)

---

## 🔧 Recommended Mapping:

### **Resume Template → Cover Letter Variants**

1. **Modern/Professional (Teal)**
   - Cover Letter A: Modern & Conversational
   - Cover Letter B: Professional & Traditional

2. **Curriculum Vitae (Traditional)**
   - Cover Letter A: Academic/Research
   - Cover Letter B: Professional & Traditional

3. **Compact/Center-Aligned**
   - Cover Letter A: Modern & Conversational
   - Cover Letter B: Data-Driven & Metrics

4. **Sidebar (Blue)**
   - Cover Letter A: Technical & Engineering
   - Cover Letter B: Modern & Conversational

5. **Minimalist/Serif**
   - Cover Letter A: Executive & Leadership
   - Cover Letter B: Professional & Traditional

6. **Teal Horizontal**
   - Cover Letter A: Creative & Unique
   - Cover Letter B: Modern & Conversational

7. **Two-Column Red**
   - Cover Letter A: Startup/Entrepreneurial
   - Cover Letter B: Creative & Unique

8. **TBD (Waiting for screenshot)**
   - Cover Letter A: TBD
   - Cover Letter B: TBD

---

## 📝 Implementation Plan:

### **Step 1: Audit Current Templates**
Check which templates match the screenshots:
- ✅ Modern → Screenshot 1, 4
- ✅ CV → Screenshot 2
- ✅ Minimal → Screenshot 5
- ❌ Need to create: Screenshot 3, 6, 7

### **Step 2: Create Missing Templates**
Based on screenshots 3, 6, 7:
- Compact/Center-Aligned
- Teal Horizontal
- Two-Column Red

### **Step 3: Update Cover Letter Mapping**
Create `getCoverLetterVariantsForResume()` function that returns 2 matched templates per resume.

### **Step 4: Update UI**
- Resume Builder: Show 8 template cards
- Resume Optimizer: Show template selection with matched cover letters
- Ensure consistent naming across all UIs

---

## 🐛 Current Issues:

1. **Template Names Don't Match**
   - Code has: "Modern", "Professional", "Creative"
   - Screenshots show: "Teal", "Traditional", "Sidebar"

2. **No Cover Letter Mapping**
   - Cover letters are independent
   - Should be tied to resume template selection

3. **Multiple Resume Builder UIs**
   - `/resume-builder` (old)
   - `/resume-builder-v2` (dark theme)
   - Resume Optimizer modal
   - Need to consolidate

4. **Print Styles**
   - Some templates have dark backgrounds
   - Need `@media print` for all templates
   - Force white background, black text

---

## ✅ Next Steps:

1. **Wait for 3 more screenshots** from user
2. **Create missing templates** (3, 6, 7)
3. **Update template names** to match screenshots
4. **Map cover letters** to resume templates (2 per resume)
5. **Consolidate UIs** into one consistent experience
6. **Test print styles** for all templates

---

**Status**: Waiting for 3 more screenshots to complete template set
**Last Updated**: October 28, 2025
