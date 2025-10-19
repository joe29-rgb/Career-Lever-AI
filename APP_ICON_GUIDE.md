# 📱 App Icon Generation Guide

## **Required Icons Overview**

### **iOS Requirements (15 sizes)**
| Size | Resolution | Usage |
|------|-----------|--------|
| 1024x1024 | @1x | App Store |
| 180x180 | @3x | iPhone Pro Max |
| 167x167 | @2x | iPad Pro |
| 152x152 | @2x | iPad, iPad mini |
| 120x120 | @2x/@3x | iPhone |
| 87x87 | @3x | iPhone Settings |
| 80x80 | @2x | iPad Settings |
| 76x76 | @1x | iPad |
| 60x60 | @2x | iPhone Notification |
| 58x58 | @2x | iPad Settings |
| 40x40 | @1x/@2x | iPad Spotlight |
| 29x29 | @1x/@2x/@3x | Settings |
| 20x20 | @1x/@2x/@3x | Notification |

### **Android Requirements (6 densities)**
| Density | Resolution | Usage |
|---------|-----------|--------|
| xxxhdpi | 192x192 | Highest density |
| xxhdpi | 144x144 | Extra high density |
| xhdpi | 96x96 | High density |
| hdpi | 72x72 | Medium high density |
| mdpi | 48x48 | Medium density |
| Play Store | 512x512 | Google Play listing |

---

## **Step 1: Design Source Icon**

### **Design Requirements:**
- **Size:** 1024x1024px minimum
- **Format:** PNG with transparency OR solid background
- **Safe Area:** Keep important elements within 80% center
- **Corners:** Design as square (iOS rounds automatically)
- **Background:** Solid color or gradient (avoid transparency for Android)

### **Design Tips:**
1. **Simple & Recognizable:** Icon should be clear at 40x40px
2. **No Text:** Avoid small text (illegible at small sizes)
3. **High Contrast:** Works in light/dark mode
4. **Brand Colors:** Use your primary brand colors
5. **Unique Shape:** Distinguishable from competitors

### **Career Lever AI Suggestions:**
- **Symbol:** Briefcase, ladder, or upward arrow
- **Colors:** Purple gradient (#667eea → #764ba2)
- **Style:** Modern, professional, tech-forward
- **Mood:** Empowering, growth-oriented

---

## **Step 2: Generate Icons**

### **Option A: Online Generator (Recommended)**

#### **1. AppIcon.co** (Free, Best Quality)
1. Go to https://appicon.co
2. Upload your 1024x1024 source image
3. Select "iOS" and "Android"
4. Click "Generate"
5. Download both packages

#### **2. MakeAppIcon** (Free, Fast)
1. Go to https://makeappicon.com
2. Upload source image
3. Download iOS and Android sets

#### **3. AppIconizer** (Free, Simple)
1. Go to https://appicon.build
2. Upload image
3. Select platforms
4. Download

### **Option B: Manual Generation (Photoshop/Figma)**

#### **Photoshop Script:**
```javascript
// Save as generate-icons.jsx
var sizes = [1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20];
var doc = app.activeDocument;
for (var i = 0; i < sizes.length; i++) {
    var size = sizes[i];
    var newDoc = doc.duplicate();
    newDoc.resizeImage(size, size);
    newDoc.saveAs(new File("~/Desktop/icon-" + size + ".png"));
    newDoc.close(SaveOptions.DONOTSAVECHANGES);
}
```

#### **Figma Export:**
1. Create 1024x1024 frame
2. Design icon
3. Select frame → Export
4. Add multiple export sizes
5. Export all at once

---

## **Step 3: Add Icons to iOS**

### **File Structure:**
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── Contents.json
├── AppIcon-20x20@1x.png
├── AppIcon-20x20@2x.png
├── AppIcon-20x20@3x.png
├── AppIcon-29x29@1x.png
├── AppIcon-29x29@2x.png
├── AppIcon-29x29@3x.png
├── AppIcon-40x40@1x.png
├── AppIcon-40x40@2x.png
├── AppIcon-40x40@3x.png
├── AppIcon-60x60@2x.png
├── AppIcon-60x60@3x.png
├── AppIcon-76x76@1x.png
├── AppIcon-76x76@2x.png
├── AppIcon-83.5x83.5@2x.png
└── AppIcon-1024x1024@1x.png
```

### **Contents.json:**
```json
{
  "images": [
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "AppIcon-20x20@2x.png",
      "scale": "2x"
    },
    {
      "size": "20x20",
      "idiom": "iphone",
      "filename": "AppIcon-20x20@3x.png",
      "scale": "3x"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "filename": "AppIcon-29x29@2x.png",
      "scale": "2x"
    },
    {
      "size": "29x29",
      "idiom": "iphone",
      "filename": "AppIcon-29x29@3x.png",
      "scale": "3x"
    },
    {
      "size": "40x40",
      "idiom": "iphone",
      "filename": "AppIcon-40x40@2x.png",
      "scale": "2x"
    },
    {
      "size": "40x40",
      "idiom": "iphone",
      "filename": "AppIcon-40x40@3x.png",
      "scale": "3x"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "filename": "AppIcon-60x60@2x.png",
      "scale": "2x"
    },
    {
      "size": "60x60",
      "idiom": "iphone",
      "filename": "AppIcon-60x60@3x.png",
      "scale": "3x"
    },
    {
      "size": "20x20",
      "idiom": "ipad",
      "filename": "AppIcon-20x20@1x.png",
      "scale": "1x"
    },
    {
      "size": "20x20",
      "idiom": "ipad",
      "filename": "AppIcon-20x20@2x.png",
      "scale": "2x"
    },
    {
      "size": "29x29",
      "idiom": "ipad",
      "filename": "AppIcon-29x29@1x.png",
      "scale": "1x"
    },
    {
      "size": "29x29",
      "idiom": "ipad",
      "filename": "AppIcon-29x29@2x.png",
      "scale": "2x"
    },
    {
      "size": "40x40",
      "idiom": "ipad",
      "filename": "AppIcon-40x40@1x.png",
      "scale": "1x"
    },
    {
      "size": "40x40",
      "idiom": "ipad",
      "filename": "AppIcon-40x40@2x.png",
      "scale": "2x"
    },
    {
      "size": "76x76",
      "idiom": "ipad",
      "filename": "AppIcon-76x76@1x.png",
      "scale": "1x"
    },
    {
      "size": "76x76",
      "idiom": "ipad",
      "filename": "AppIcon-76x76@2x.png",
      "scale": "2x"
    },
    {
      "size": "83.5x83.5",
      "idiom": "ipad",
      "filename": "AppIcon-83.5x83.5@2x.png",
      "scale": "2x"
    },
    {
      "size": "1024x1024",
      "idiom": "ios-marketing",
      "filename": "AppIcon-1024x1024@1x.png",
      "scale": "1x"
    }
  ],
  "info": {
    "version": 1,
    "author": "xcode"
  }
}
```

---

## **Step 4: Add Icons to Android**

### **File Structure:**
```
android/app/src/main/res/
├── mipmap-mdpi/
│   └── ic_launcher.png (48x48)
├── mipmap-hdpi/
│   └── ic_launcher.png (72x72)
├── mipmap-xhdpi/
│   └── ic_launcher.png (96x96)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (144x144)
├── mipmap-xxxhdpi/
│   └── ic_launcher.png (192x192)
└── mipmap-xxxhdpi/
    └── ic_launcher_round.png (192x192, rounded)
```

### **Adaptive Icons (Android 8.0+):**
```
android/app/src/main/res/
├── mipmap-anydpi-v26/
│   └── ic_launcher.xml
├── drawable/
│   ├── ic_launcher_background.xml
│   └── ic_launcher_foreground.xml
```

### **ic_launcher.xml:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

---

## **Step 5: Verify Icons**

### **iOS Verification:**
1. Open Xcode: `npm run cap:open:ios`
2. Navigate to `App → Assets.xcassets → AppIcon`
3. Verify all slots filled (no warnings)
4. Build and run on simulator
5. Check Home Screen icon appearance

### **Android Verification:**
1. Open Android Studio: `npm run cap:open:android`
2. Navigate to `res → mipmap-*`
3. Verify all density folders have icons
4. Build and run on emulator
5. Check Home Screen and App Drawer

### **Checklist:**
- [ ] All iOS sizes present (15 icons)
- [ ] All Android densities present (6 icons)
- [ ] 1024x1024 for App Store
- [ ] 512x512 for Play Store
- [ ] No transparency issues
- [ ] Icons look sharp at all sizes
- [ ] Rounded corners applied correctly
- [ ] Safe area respected (no cut-off elements)

---

## **Step 6: App Store Assets**

### **iOS App Store:**
- **Icon:** 1024x1024 PNG (no alpha channel)
- **Location:** Upload directly in App Store Connect
- **Requirements:** 
  - RGB color space
  - No rounded corners (Apple applies)
  - No transparency

### **Google Play Store:**
- **Icon:** 512x512 PNG (32-bit with alpha)
- **Location:** Upload in Play Console
- **Requirements:**
  - Full bleed (no padding)
  - Can have transparency
  - Square (Google applies shape)

### **Feature Graphic (Android):**
- **Size:** 1024x500 PNG
- **Usage:** Play Store listing header
- **Design:** Showcase app features/branding

---

## **Common Issues & Fixes**

### **Issue: "Missing required icon sizes"**
**Fix:** Regenerate all sizes, ensure Contents.json matches filenames

### **Issue: "Icon has alpha channel"**
**Fix:** Flatten to white/colored background in Photoshop

### **Issue: "Icon appears blurry"**
**Fix:** Use PNG, not JPEG. Ensure source is high-res.

### **Issue: "Rounded corners cut off design"**
**Fix:** Keep important elements in 80% safe area

### **Issue: "Android adaptive icon looks wrong"**
**Fix:** Separate foreground/background layers, test all shapes

---

## **Quick Start Commands**

```bash
# After generating icons:

# Copy iOS icons
cp -r ~/Downloads/ios-icons/* ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Copy Android icons
cp ~/Downloads/android-icons/mipmap-mdpi/ic_launcher.png android/app/src/main/res/mipmap-mdpi/
cp ~/Downloads/android-icons/mipmap-hdpi/ic_launcher.png android/app/src/main/res/mipmap-hdpi/
cp ~/Downloads/android-icons/mipmap-xhdpi/ic_launcher.png android/app/src/main/res/mipmap-xhdpi/
cp ~/Downloads/android-icons/mipmap-xxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxhdpi/
cp ~/Downloads/android-icons/mipmap-xxxhdpi/ic_launcher.png android/app/src/main/res/mipmap-xxxhdpi/

# Sync changes
npx cap sync

# Open in IDEs to verify
npm run cap:open:ios
npm run cap:open:android
```

---

## **Resources**

- **Icon Generators:**
  - https://appicon.co (Best quality)
  - https://makeappicon.com (Fast)
  - https://appicon.build (Simple)
  
- **Design Tools:**
  - Figma (Free, web-based)
  - Adobe Photoshop (Professional)
  - Sketch (Mac only)
  - Canva (Beginner-friendly)

- **Guidelines:**
  - [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
  - [Android Icon Design](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
  - [Material Design Icons](https://material.io/design/iconography)

---

## **Next Steps**

After icons are added:
1. ✅ Verify in Xcode/Android Studio
2. ✅ Test on real devices
3. ✅ Take screenshots for stores
4. ✅ Prepare store listings
5. ✅ Submit for review

**Status:** Ready for icon generation  
**Time Required:** 30-60 minutes  
**Blocker:** Need source icon design
