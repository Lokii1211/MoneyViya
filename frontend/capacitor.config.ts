import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.viya.app',
  appName: 'Viya',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
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
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#050508',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#050508',
    preferredContentMode: 'mobile',
    scheme: 'Viya',
  },
};

export default config;
