import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.careerlever.app',
  appName: 'Career Lever AI',
  webDir: 'out',
  
  server: {
    // Point to Railway backend for all API calls
    url: process.env.NODE_ENV === 'production' 
      ? 'https://job-craft-ai-jobcraftai.up.railway.app'
      : 'http://localhost:3000',
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow navigation to backend and external APIs
    allowNavigation: [
      'job-craft-ai-jobcraftai.up.railway.app',
      'localhost',
      '*.careerlever.com',
      'https://api.perplexity.ai',
      'https://accounts.google.com',
      'https://*.googleusercontent.com'
    ],
    cleartext: false
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
