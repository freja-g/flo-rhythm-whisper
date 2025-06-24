
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.a03c59a994864d3c86986bdf628475ab',
  appName: 'FloMentor',
  webDir: 'dist',
  server: {
    url: 'https://a03c59a9-9486-4d3c-8698-6bdf628475ab.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
