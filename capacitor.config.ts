import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.morrowmere.game',
  appName: 'MORROWMERE',
  webDir: 'dist',
  server: {
    hostname: 'morrowmere.local',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
