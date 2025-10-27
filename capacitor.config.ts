import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eeae09cef16e41faa46e2dadc2102e6c',
  appName: 'harvest-route-hub',
  webDir: 'dist',
  server: {
    url: 'https://eeae09ce-f16e-41fa-a46e-2dadc2102e6c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  }
};

export default config;
