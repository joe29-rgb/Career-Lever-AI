# 📸 App Store Screenshot Guide

## **Overview**

High-quality screenshots are REQUIRED for both Apple App Store and Google Play Store submissions. This guide covers requirements, tools, and best practices.

---

## **iOS Screenshot Requirements**

### **Required Devices & Resolutions**

| Device | Resolution | Orientation | Minimum Required |
|--------|-----------|-------------|------------------|
| **iPhone 6.7"** | 1290 x 2796 | Portrait | 3 screenshots |
| iPhone 6.5" | 1242 x 2688 | Portrait | 3 screenshots |
| **iPad Pro 12.9"** | 2048 x 2732 | Portrait | 2 screenshots |
| iPad Pro 11" | 1668 x 2388 | Portrait | Optional |

### **iOS Screenshot Specifications**
- **Format:** PNG or JPEG
- **Color Space:** RGB
- **Max File Size:** 500 MB per screenshot
- **Transparency:** Not allowed
- **Status Bar:** Can be shown or hidden
- **Localization:** Can provide different screenshots per language

### **iOS Best Practices**
1. **Show actual app UI** - No mockups or marketing graphics
2. **Highlight key features** - Show your best features first
3. **Use text overlays** - Add descriptive text to explain features
4. **Keep it clean** - Remove personal/test data
5. **Show value** - Demonstrate what users can accomplish

---

## **Android Screenshot Requirements**

### **Required Devices & Resolutions**

| Device Type | Minimum Resolution | Aspect Ratio | Required |
|-------------|-------------------|--------------|----------|
| **Phone** | 1080 x 1920 | 16:9 or taller | 2 minimum |
| Tablet | 1600 x 2560 | 16:10 | Optional |
| 7-inch Tablet | 1024 x 1600 | 16:10 | Optional |

### **Android Screenshot Specifications**
- **Format:** PNG or JPEG (PNG recommended)
- **Max File Size:** 8 MB per screenshot
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots
- **Transparency:** Allowed
- **Orientation:** Portrait or landscape

### **Android Best Practices**
1. **Feature Graphic Required** - 1024 x 500 banner image
2. **Show navigation** - Demonstrate how users navigate
3. **Highlight uniqueness** - What makes your app different
4. **Use real content** - Avoid lorem ipsum or placeholder text
5. **Test on multiple devices** - Ensure UI looks good everywhere

---

## **Screenshot Content Strategy**

### **Recommended Screenshot Order**

#### **Screenshot 1: Hero/Main Feature**
- Show the most compelling feature
- Clear value proposition
- Eye-catching design
- Example: "AI-Powered Resume Customization"

#### **Screenshot 2: Core Functionality**
- Demonstrate primary use case
- Show ease of use
- Example: "Track All Your Applications"

#### **Screenshot 3: Key Benefit**
- Highlight unique selling point
- Show results/outcomes
- Example: "Company Research & Insights"

#### **Screenshot 4: Secondary Features**
- Additional functionality
- Example: "Calendar Integration"

#### **Screenshot 5: Social Proof/Results**
- Success metrics
- User testimonials (if allowed)
- Example: "Join 10,000+ Job Seekers"

### **Career Lever AI Suggested Screenshots**

1. **Resume Customization Screen**
   - Show AI-powered resume tailoring
   - Highlight before/after comparison
   - Text: "Customize Your Resume in Seconds"

2. **Job Application Dashboard**
   - Display application tracking
   - Show status indicators
   - Text: "Track Every Application"

3. **Company Research**
   - Show comprehensive company insights
   - Highlight AI-generated research
   - Text: "Deep Company Intelligence"

4. **Career Finder**
   - Show job matching interface
   - Highlight personalized recommendations
   - Text: "Find Your Perfect Role"

5. **Mobile Experience**
   - Show mobile-optimized UI
   - Highlight touch gestures
   - Text: "Seamless Mobile Experience"

---

## **Tools for Creating Screenshots**

### **Option 1: Real Device Screenshots (Recommended)**

#### **iOS - Using Xcode Simulator**
```bash
# Build and run app
npm run mobile:ios

# In Xcode:
# 1. Select device (iPhone 15 Pro Max for 6.7")
# 2. Run app (Cmd + R)
# 3. Navigate to screen
# 4. Take screenshot (Cmd + S)
# 5. Screenshots saved to Desktop
```

#### **Android - Using Android Studio Emulator**
```bash
# Build and run app
npm run mobile:android

# In Android Studio:
# 1. Select device (Pixel 7 Pro)
# 2. Run app
# 3. Navigate to screen
# 4. Click camera icon in emulator toolbar
# 5. Screenshots saved to ~/Desktop
```

### **Option 2: Screenshot Framing Tools**

#### **1. Screely** (Free, Web-based)
- URL: https://screely.com
- Add browser frames and backgrounds
- Export high-res images

#### **2. Mockuuups Studio** (Paid, Professional)
- URL: https://mockuuups.studio
- Device mockups with realistic frames
- Batch processing

#### **3. Figma** (Free, Design Tool)
- Create custom frames
- Add text overlays and annotations
- Export at exact resolutions

#### **4. Shotsnapp** (Free, Web-based)
- URL: https://shotsnapp.com
- Device frames and backgrounds
- Quick and easy

### **Option 3: Screenshot Editing Tools**

#### **For Text Overlays & Annotations:**
- **Figma** - Professional design tool (free)
- **Canva** - Easy-to-use templates (free/paid)
- **Sketch** - Mac-only design tool (paid)
- **Adobe Photoshop** - Advanced editing (paid)

#### **For Batch Processing:**
- **ImageMagick** - Command-line tool (free)
- **Photoshop Actions** - Automate edits (paid)
- **Sketch Plugins** - Batch export (paid)

---

## **Step-by-Step Screenshot Process**

### **Phase 1: Preparation**

1. **Clean Test Data**
   - Remove personal information
   - Use professional sample data
   - Ensure consistent branding

2. **Prepare Test Account**
   - Create account with sample data
   - Add realistic resumes and applications
   - Populate all features

3. **Choose Devices**
   - iOS: iPhone 15 Pro Max (6.7"), iPad Pro 12.9"
   - Android: Pixel 7 Pro, Pixel Tablet

### **Phase 2: Capture**

1. **Build App**
   ```bash
   npm run build:mobile
   npx cap sync
   ```

2. **Open in IDE**
   ```bash
   # iOS
   npm run cap:open:ios
   
   # Android
   npm run cap:open:android
   ```

3. **Run on Simulator/Emulator**
   - Select correct device
   - Run app
   - Wait for full load

4. **Navigate & Capture**
   - Navigate to each key screen
   - Ensure UI is fully loaded
   - Take screenshot (Cmd+S on iOS, camera icon on Android)
   - Repeat for all required screens

### **Phase 3: Edit & Enhance**

1. **Crop & Resize**
   - Ensure exact dimensions
   - Remove status bar if needed
   - Center content

2. **Add Text Overlays** (Optional but Recommended)
   - Use large, readable fonts (40-60pt)
   - High contrast colors
   - Keep text concise (5-7 words max)
   - Position at top or bottom

3. **Add Annotations** (Optional)
   - Highlight key features with arrows
   - Use subtle overlays
   - Don't obscure UI

4. **Optimize File Size**
   - Compress without quality loss
   - Use PNG for UI, JPEG for photos
   - Keep under size limits

### **Phase 4: Organize**

1. **File Naming Convention**
   ```
   ios-iphone67-01-hero.png
   ios-iphone67-02-dashboard.png
   ios-iphone67-03-research.png
   ios-ipad129-01-hero.png
   ios-ipad129-02-dashboard.png
   android-phone-01-hero.png
   android-phone-02-dashboard.png
   ```

2. **Create Folder Structure**
   ```
   screenshots/
   ├── ios/
   │   ├── iphone-67/
   │   │   ├── 01-hero.png
   │   │   ├── 02-dashboard.png
   │   │   └── 03-research.png
   │   └── ipad-129/
   │       ├── 01-hero.png
   │       └── 02-dashboard.png
   └── android/
       ├── phone/
       │   ├── 01-hero.png
       │   └── 02-dashboard.png
       └── tablet/
           └── 01-hero.png
   ```

3. **Verify Specifications**
   - Check dimensions
   - Verify file sizes
   - Test on different displays

---

## **Screenshot Checklist**

### **iOS Checklist**
- [ ] iPhone 6.7" - 3 screenshots (1290 x 2796)
- [ ] iPhone 6.5" - 3 screenshots (1242 x 2688)
- [ ] iPad Pro 12.9" - 2 screenshots (2048 x 2732)
- [ ] All PNG or JPEG format
- [ ] All under 500 MB
- [ ] No transparency
- [ ] No personal data visible
- [ ] Text overlays added (optional)
- [ ] Consistent branding

### **Android Checklist**
- [ ] Phone - 2+ screenshots (1080 x 1920 minimum)
- [ ] Tablet - 2+ screenshots (optional)
- [ ] All PNG or JPEG format
- [ ] All under 8 MB
- [ ] Feature graphic created (1024 x 500)
- [ ] No personal data visible
- [ ] Text overlays added (optional)
- [ ] Consistent branding

### **Content Checklist**
- [ ] Shows actual app UI (no mockups)
- [ ] Highlights key features
- [ ] Demonstrates value proposition
- [ ] Uses professional sample data
- [ ] Text is readable at thumbnail size
- [ ] Consistent visual style
- [ ] Localized if targeting multiple languages

---

## **Common Mistakes to Avoid**

### **❌ Don't:**
1. Use placeholder text (lorem ipsum)
2. Show personal/sensitive information
3. Include outdated UI or branding
4. Use low-resolution images
5. Add excessive text overlays
6. Show error states or bugs
7. Use competitor branding
8. Include misleading content
9. Show incomplete features
10. Use inconsistent styling

### **✅ Do:**
1. Show real, polished UI
2. Use professional sample data
3. Highlight unique features
4. Ensure high resolution
5. Add concise, helpful text
6. Show success states
7. Use your own branding
8. Accurately represent features
9. Show complete workflows
10. Maintain consistent design

---

## **Screenshot Templates**

### **Text Overlay Template (Figma)**

```
Frame: 1290 x 2796 (iPhone 6.7")

Layers:
1. Background: Screenshot image
2. Gradient Overlay: Linear gradient (optional)
   - Top: rgba(0,0,0,0.3)
   - Bottom: transparent
3. Text: Feature headline
   - Font: Inter Bold, 48pt
   - Color: White
   - Position: Top, centered
   - Padding: 80px from top
4. Subtext: Feature description (optional)
   - Font: Inter Regular, 24pt
   - Color: White
   - Position: Below headline
   - Padding: 20px from headline
```

### **Annotation Template**

```
Arrow:
- Stroke: 4px
- Color: #667eea (brand color)
- Style: Solid with arrowhead

Callout Box:
- Background: White with 80% opacity
- Border: 2px solid #667eea
- Corner Radius: 8px
- Padding: 16px
- Shadow: 0 4px 12px rgba(0,0,0,0.1)

Text:
- Font: Inter Medium, 18pt
- Color: #1a1a1a
- Line Height: 1.4
```

---

## **Automation Scripts**

### **Batch Resize (ImageMagick)**
```bash
# Install ImageMagick
brew install imagemagick

# Resize all screenshots to iPhone 6.7"
for file in *.png; do
  convert "$file" -resize 1290x2796 -gravity center -extent 1290x2796 "resized-$file"
done
```

### **Add Text Overlay (ImageMagick)**
```bash
# Add text overlay to screenshot
convert input.png \
  -gravity north \
  -pointsize 48 \
  -fill white \
  -annotate +0+80 "AI-Powered Resume Customization" \
  output.png
```

### **Compress Images**
```bash
# Compress PNG without quality loss
pngquant --quality=80-95 *.png

# Compress JPEG
jpegoptim --max=90 *.jpg
```

---

## **Upload Instructions**

### **iOS - App Store Connect**
1. Log in to App Store Connect
2. Navigate to your app
3. Select version
4. Click "App Store" tab
5. Scroll to "App Previews and Screenshots"
6. Select device type
7. Drag and drop screenshots
8. Reorder as needed
9. Add captions (optional)
10. Save

### **Android - Google Play Console**
1. Log in to Play Console
2. Select your app
3. Navigate to "Store presence" → "Main store listing"
4. Scroll to "Screenshots"
5. Select device type (Phone/Tablet)
6. Upload screenshots
7. Reorder as needed
8. Upload Feature Graphic (1024 x 500)
9. Save

---

## **Resources**

### **Official Guidelines**
- [iOS Screenshot Specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)
- [Android Screenshot Specs](https://support.google.com/googleplay/android-developer/answer/9866151)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)

### **Tools**
- [Screely](https://screely.com) - Free screenshot framing
- [Shotsnapp](https://shotsnapp.com) - Device mockups
- [Figma](https://figma.com) - Design tool
- [Canva](https://canva.com) - Template-based design
- [ImageMagick](https://imagemagick.org) - Command-line image processing

### **Inspiration**
- [App Store Screenshot Examples](https://www.appstorescreenshots.com)
- [Mobbin](https://mobbin.com) - Mobile design patterns
- [Screenlane](https://screenlane.com) - Screenshot gallery

---

## **Next Steps**

After screenshots are ready:
1. ✅ Verify all requirements met
2. ✅ Upload to App Store Connect / Play Console
3. ✅ Add localized versions (if applicable)
4. ✅ Preview on actual devices
5. ✅ Submit for review

**Status:** Ready for screenshot capture  
**Time Required:** 2-4 hours  
**Blocker:** Need app running on simulators/emulators
