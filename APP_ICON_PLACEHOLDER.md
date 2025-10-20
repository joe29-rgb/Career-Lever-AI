# 📱 App Icon - Placeholder & Production Guide

## **Current Status: Placeholder Icons Active**

The iOS and Android platforms currently have **default Capacitor placeholder icons**. These need to be replaced with Career Lever AI branded icons before app store submission.

---

## **🎨 Design Requirements**

### **Source Icon Specifications:**
- **Size:** 1024x1024 pixels
- **Format:** PNG (no transparency for iOS)
- **Color Space:** RGB
- **Content:** Career Lever AI logo/brand
- **Safe Area:** Keep important content within 90% center
- **Background:** Solid color or gradient (no transparency)

### **Design Guidelines:**
1. **Simple & Recognizable** - Works at small sizes (20x20)
2. **No Text** - Logo/symbol only (app name shows separately)
3. **High Contrast** - Stands out on home screen
4. **Brand Consistent** - Matches Career Lever AI colors
5. **Universal Appeal** - Professional, modern, trustworthy

### **Suggested Design Elements:**
- **Primary:** Briefcase + AI circuit/brain icon
- **Colors:** Purple/blue gradient (#667eea to #764ba2)
- **Style:** Modern, minimal, professional
- **Shape:** Rounded square (iOS handles rounding)

---

## **📋 Required Icon Sizes**

### **iOS (15 sizes):**
```
AppIcon.appiconset/
├── 20x20.png (iPhone Notification)
├── 20x20@2x.png (40x40)
├── 20x20@3x.png (60x60)
├── 29x29.png (iPhone Settings)
├── 29x29@2x.png (58x58)
├── 29x29@3x.png (87x87)
├── 40x40.png (iPhone Spotlight)
├── 40x40@2x.png (80x80)
├── 40x40@3x.png (120x120)
├── 60x60@2x.png (120x120 - iPhone App)
├── 60x60@3x.png (180x180 - iPhone App)
├── 76x76.png (iPad App)
├── 76x76@2x.png (152x152)
├── 83.5x83.5@2x.png (167x167 - iPad Pro)
└── 1024x1024.png (App Store)
```

### **Android (6 densities):**
```
res/
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
├── mipmap-xxxhdpi/ic_launcher.png (192x192)
└── Play Store: 512x512.png
```

---

## **🛠️ Generation Tools**

### **Option 1: AppIcon.co (Recommended)**
**URL:** https://appicon.co  
**Cost:** Free  
**Process:**
1. Upload 1024x1024 source icon
2. Select iOS and Android
3. Download generated packages
4. Extract to respective directories

### **Option 2: Figma Plugin**
**Plugin:** "App Icon Generator"  
**Process:**
1. Design icon in Figma (1024x1024)
2. Run plugin
3. Export all sizes
4. Organize by platform

### **Option 3: Manual (Photoshop/Sketch)**
**Process:**
1. Create 1024x1024 master
2. Resize for each required size
3. Export as PNG
4. Organize in folders

---

## **📂 Installation Locations**

### **iOS:**
```bash
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── Contents.json (already exists)
├── AppIcon-20x20@1x.png
├── AppIcon-20x20@2x.png
├── AppIcon-20x20@3x.png
# ... (all 15 sizes)
└── AppIcon-1024x1024@1x.png
```

### **Android:**
```bash
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png
├── mipmap-hdpi/ic_launcher.png
├── mipmap-xhdpi/ic_launcher.png
├── mipmap-xxhdpi/ic_launcher.png
├── mipmap-xxxhdpi/ic_launcher.png
└── mipmap-xxxhdpi/ic_launcher_round.png
```

---

## **✅ Verification Steps**

### **iOS (Xcode):**
1. Open `ios/App/App.xcodeproj` in Xcode
2. Select App target
3. Go to "General" tab
4. Check "App Icons and Launch Screen"
5. Verify all icon slots filled
6. Build and run on simulator
7. Check home screen icon

### **Android (Android Studio):**
1. Open `android/` in Android Studio
2. Navigate to `res/mipmap-*` folders
3. Verify `ic_launcher.png` in all densities
4. Build and run on emulator
5. Check home screen icon
6. Test on different screen densities

---

## **🎨 Placeholder Icon Creation**

If you need a quick placeholder before final design:

### **Simple Text-Based Icon:**
```
Background: #667eea (purple)
Text: "CL" or "CA"
Font: Bold, white
Size: 1024x1024
```

### **Tools for Quick Placeholder:**
- **Canva:** Use "App Icon" template
- **Figma:** Create 1024x1024 frame
- **Photoshop:** New document, add text/shape
- **Online:** https://icon.kitchen

---

## **🚀 Production Icon Checklist**

Before app store submission:

### **Design:**
- [ ] 1024x1024 source icon created
- [ ] Follows design guidelines
- [ ] Brand consistent
- [ ] Works at small sizes
- [ ] No transparency (iOS)
- [ ] High resolution

### **iOS:**
- [ ] All 15 sizes generated
- [ ] Added to AppIcon.appiconset/
- [ ] Contents.json updated
- [ ] Verified in Xcode
- [ ] Tested on simulator
- [ ] Tested on device

### **Android:**
- [ ] All 6 densities generated
- [ ] Added to mipmap folders
- [ ] Round icon included
- [ ] Verified in Android Studio
- [ ] Tested on emulator
- [ ] Tested on device

### **App Stores:**
- [ ] 1024x1024 for App Store Connect
- [ ] 512x512 for Play Console
- [ ] Feature graphic (1024x500) for Play Store

---

## **📊 Current Icon Status**

### **iOS:**
- **Status:** ⚠️ Default Capacitor placeholder
- **Location:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Action Required:** Replace with branded icons

### **Android:**
- **Status:** ⚠️ Default Capacitor placeholder
- **Location:** `android/app/src/main/res/mipmap-*/`
- **Action Required:** Replace with branded icons

---

## **🎯 Next Steps**

1. **Design Source Icon** (1-2 hours)
   - Create 1024x1024 Career Lever AI icon
   - Follow design guidelines
   - Get approval

2. **Generate All Sizes** (15 minutes)
   - Use AppIcon.co or similar tool
   - Download iOS and Android packages
   - Verify all sizes present

3. **Install Icons** (15 minutes)
   - Replace iOS icons in Xcode
   - Replace Android icons in Android Studio
   - Update Contents.json if needed

4. **Test & Verify** (30 minutes)
   - Build on iOS simulator
   - Build on Android emulator
   - Check home screen appearance
   - Test on physical devices

**Total Time: 2-3 hours**

---

## **💡 Design Inspiration**

### **Similar Apps:**
- LinkedIn (professional blue)
- Indeed (navy blue)
- Glassdoor (green)
- ZipRecruiter (purple)

### **Career Lever AI Suggestion:**
```
Icon Concept:
- Briefcase shape (career/jobs)
- AI circuit pattern inside
- Purple/blue gradient (#667eea → #764ba2)
- Clean, modern, minimal
- Recognizable at any size
```

---

## **📞 Resources**

### **Design Tools:**
- [Figma](https://figma.com) - Free design tool
- [Canva](https://canva.com) - Easy templates
- [AppIcon.co](https://appicon.co) - Icon generator
- [Icon Kitchen](https://icon.kitchen) - Quick placeholders

### **Guidelines:**
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Icon Design](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)

### **Inspiration:**
- [App Icon Gallery](https://www.appiconsgallery.com)
- [Dribbble App Icons](https://dribbble.com/tags/app-icon)

---

**Status:** ⚠️ Placeholder icons active, production icons needed  
**Priority:** HIGH - Required for app store submission  
**Estimated Time:** 2-3 hours with design
