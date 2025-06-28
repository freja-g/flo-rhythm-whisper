
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.flomentor.app',
  appName: 'FloMentor',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#f472b6',
      showSpinner: false
    },
    Network: {
      statusTap: false
    }
  }
};

export default config;
