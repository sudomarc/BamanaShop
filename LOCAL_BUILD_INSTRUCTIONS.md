# Local EAS Build Instructions

## Prerequisites
- Node.js 20+
- Expo account with EAS access
- EAS CLI installed globally

## Setup
```bash
npm install -g eas-cli
eas login
# OR use: export EXPO_TOKEN="your-token"; eas whoami
```

## Build Android APK
```bash
cd apps/customer
eas build --platform android --profile production --non-interactive
```

## Download Build
```bash
eas build:list --platform android
eas build:download --platform android --id <BUILD_ID> --output ./apk
```

## Install on Phone via ADB
```bash
adb devices
adb install -r ./apk/*.apk
```

## GitHub Actions
```bash
gh workflow run eas-build.yml -f platform=android -f profile=production
```
