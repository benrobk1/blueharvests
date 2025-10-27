# Capacitor Native Mobile App Setup

This project is configured as a native mobile app using Capacitor, giving you full access to device features like camera, notifications, GPS, and more.

## Prerequisites

- **For iOS**: Mac with Xcode installed
- **For Android**: Android Studio installed
- Node.js and npm installed

## Setup Instructions

### 1. Transfer to Your GitHub Repository
Click the "Export to Github" button in Lovable to transfer your project to your own GitHub repository, then clone it locally:

```bash
git clone <your-repo-url>
cd harvest-route-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Native Platforms

For iOS:
```bash
npx cap add ios
npx cap update ios
```

For Android:
```bash
npx cap add android
npx cap update android
```

### 4. Build the Web App
```bash
npm run build
```

### 5. Sync to Native Platform
```bash
npx cap sync
```

**Important**: Run `npx cap sync` after every `git pull` to sync changes to the native platforms.

### 6. Run on Device/Emulator

For Android:
```bash
npx cap run android
```

For iOS (Mac only):
```bash
npx cap run ios
```

## Development Workflow

1. Make changes in Lovable
2. Git pull the latest changes
3. Run `npx cap sync` to sync changes
4. Test on your device/emulator

## Hot Reload

The app is configured to hot-reload from the Lovable sandbox URL. This means you can see changes instantly without rebuilding the native app during development.

## Native Features Available

- 📸 Camera access
- 🔔 Push notifications
- 📍 GPS/Location services
- 📂 File system access
- 🎤 Microphone access
- 📱 Device information
- 🔋 Battery status
- And much more!

## Publishing to App Stores

### iOS App Store
1. Open the project in Xcode: `npx cap open ios`
2. Configure signing & capabilities
3. Archive and upload to App Store Connect

### Google Play Store
1. Open the project in Android Studio: `npx cap open android`
2. Generate signed APK/Bundle
3. Upload to Google Play Console

For detailed publishing guides, visit:
- [iOS Publishing Guide](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Android Publishing Guide](https://capacitorjs.com/docs/android/deploying-to-google-play)

## Need Help?

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Capacitor Blog Post](https://lovable.dev/blog/capacitor-mobile-app-development)
