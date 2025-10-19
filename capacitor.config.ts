import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.careerlever.app',
  appName: 'Career Lever AI',
  webDir: 'out',
  
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Allow navigation to backend and external APIs
    allowNavigation: [
      'job-craft-ai-jobcraftai.up.railway.app',
      'localhost',
      '*.careerlever.com',
      'https://api.perplexity.ai',
      'https://accounts.google.com',
      'https://*.googleusercontent.com'
    ],
    // Clear text traffic for development (disable in production)
    cleartext: process.env.NODE_ENV === 'development'
  },
  
  // iOS-specific configuration
  ios: {
    // Automatic content inset for safe areas (notch, Dynamic Island)
    contentInset: 'automatic',
    // Background color (matches app theme)
    backgroundColor: '#ffffff'
  },
  
  // Android-specific configuration
  android: {
    // Background color (matches app theme)
    backgroundColor: '#ffffff',
    // Disable mixed content (HTTPS only)
    allowMixedContent: false,
    // Disable web debugging in production
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
    // Append user agent
    appendUserAgent: 'CareerLeverAI/1.0'
  },
  
  // Plugin configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#667eea',
      splashFullScreen: false,
      splashImmersive: false
    },
    
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    },
    
    StatusBar: {
      style: 'light',
      backgroundColor: '#667eea'
    },
    
    Haptics: {
      // Enable haptic feedback for better UX
    },
    
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
}

export default config
