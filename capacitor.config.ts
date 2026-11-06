import type { CapacitorConfig } from '@capacitor/cli';

const konfigurasiCapacitor: CapacitorConfig = {
  appId: 'com.mezonastudio.app',
  appName: 'Mezona Studio',
  webDir: '.output/public',
  server: {
    // Pada saat pengembangan (dev mode) Android Studio dapat mengarah ke IP lokal komputer
    // Contoh: url: 'http://192.168.1.10:3012', cleartext: true
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default konfigurasiCapacitor;
