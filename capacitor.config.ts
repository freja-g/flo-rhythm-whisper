
import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.a03c59a994864d3c86986bdf628475ab',
  appName: 'flo-rhythm-whisper',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      releaseType: 'AAB'
    }
  }
};

export default config;
