import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.viya.app',
  appName: 'Viya',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#050508',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050508',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Haptics: {},
    LocalNotifications: {
      smallIcon: 'ic_stat_notify',
      iconColor: '#00B870',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#050508',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#050508',
  },
};

export default config;
