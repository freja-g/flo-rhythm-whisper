import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a03c59a994864d3c86986bdf628475ab',
  appName: 'flomentor',
  webDir: 'dist',
  server: {
    url: 'https://a03c59a9-9486-4d3c-8698-6bdf628475ab.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;