# EAS Build Setup & APK Installation Guide

This guide walks you through setting up GitHub Actions for automated EAS builds, downloading the APK, and installing it on your Android phone via ADB.

## Prerequisites

1. **Expo Account** - Create at https://expo.dev
2. **EAS CLI** - `npm install -g eas-cli`
3. **GitHub Repository** - With Actions enabled
4. **Android Phone** - With USB Debugging enabled
5. **ADB** - Installed on your computer

## Step 1: Configure EAS Project

### 1.1 Login to Expo
```bash
eas login
```

### 1.2 Initialize EAS Project (if not done)
```bash
cd apps/customer
eas project:init
```
Record the Expo project UUID returned by the command. This repository resolves `extra.eas.projectId` dynamically from the `EAS_PROJECT_ID` environment variable; do not commit a placeholder project ID in `app.json`.

### 1.3 Verify Configuration
```bash
eas project:info
```

## Step 2: Add GitHub Secrets

Go to your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `EXPO_TOKEN` | Your Expo access token | Get from `eas login` or https://expo.dev/accounts/[account]/settings/access-tokens |
| `EAS_PROJECT_ID` | Expo project UUID | From the EAS project details or the output of `eas project:init`; consumed by the dynamic app config |

### Get EXPO_TOKEN:
```bash
# After eas login, token is stored in ~/.expo/token.json
# Or create a new access token at:
# https://expo.dev/accounts/[your-account]/settings/access-tokens
```

### Get EAS_PROJECT_ID:
```bash
EAS_PROJECT_ID="<project-uuid>" eas project:info
# The UUID is supplied through EAS_PROJECT_ID; it is not hardcoded in app.json.
```

## Step 3: Trigger the Build

### Option A: Via GitHub Actions UI (Recommended)
1. Go to the repository's **Actions** tab.
2. Select **BamanaShop**, then click **Run workflow**.
3. Choose `build-android` for the task and `preview` for the profile.
4. Start the workflow and wait for the EAS cloud build to finish. The workflow now waits for the finished APK, downloads it, validates the archive, and uploads it as a GitHub Actions artifact.

### Option B: Via Git Push
```bash
git add .
git commit -m "trigger eas build"
git push origin main
```

### Option C: Local Build (for testing)
```bash
cd apps/customer
EAS_PROJECT_ID="<project-uuid>" eas build --platform android --profile production
```

## Step 4: Monitor Build Progress

1. **GitHub Actions**: Open the completed `BamanaShop` run and download the `bamanashop-android-preview-<run-number>` artifact from the run's Artifacts section.
2. **EAS Dashboard**: https://expo.dev/accounts/marcopolos-team/projects/bamanashop/builds
3. **Build Logs**: Open the EAS build linked in the build job logs for detailed native build logs.

Build typically takes **10-20 minutes** for Android APK.

## Step 5: Download the APK

### Option A: From GitHub Actions (recommended)
1. Open the completed **BamanaShop** workflow run.
2. In the **Artifacts** section, download `bamanashop-android-<profile>-<run-number>` (for example, `bamanashop-android-preview-42`).
3. Extract the ZIP archive. The `.apk` file is inside.

### Option B: From EAS Dashboard
1. Go to https://expo.dev/accounts/[account]/projects/bamanashop/builds
2. Click on the completed build
3. Click **"Download"** → **"APK"**

### Option C: Using the Download Script
```bash
# Get BUILD_ID from eas build output or EAS dashboard
./scripts/download-and-install-apk.sh <BUILD_ID>
```

### Option D: Manual EAS CLI Download
```bash
eas build:download --build-id <BUILD_ID> --non-interactive
```

## Step 6: Install on Phone via ADB

### 6.1 Enable USB Debugging on Phone
1. **Settings → About Phone** → Tap "Build Number" 7 times
2. **Settings → Developer Options** → Enable "USB Debugging"
3. Connect phone via USB
4. Allow USB debugging prompt on phone

### 6.2 Verify ADB Connection
```bash
adb devices
# Should show your device as "device" (not "unauthorized")
```

### 6.3 Install APK
```bash
# Using the script (downloads + installs)
./scripts/download-and-install-apk.sh <BUILD_ID>

# Or manually:
adb install -r ./apk/bamanashop-android.apk
```

### 6.4 Verify Installation
- App should appear in your app drawer as "BamanaShop"
- Launch and test the app

## Troubleshooting

### Build Fails
| Error | Solution |
|-------|----------|
| `EXPO_TOKEN` invalid | Regenerate token at expo.dev/settings/access-tokens |
| `EAS_PROJECT_ID` missing or invalid | Set the repository secret to the Expo project UUID and rerun the workflow |
| Gradle build failed | Check `eas.json` build config, ensure `buildType: "apk"` for Android |
| Out of memory | Use `preview` profile instead of `production` |

### ADB Issues
| Issue | Solution |
|-------|----------|
| `adb: command not found` | Install Android SDK Platform Tools |
| `device unauthorized` | Allow USB debugging on phone prompt |
| `device not found` | Check USB cable, try different port, restart ADB: `adb kill-server && adb start-server` |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | Uninstall old version first: `adb uninstall com.bamanashop.customer` |

### App Crashes on Launch
1. Check logs: `adb logcat | grep -i bamanashop`
2. Ensure all permissions are granted
3. Check if google-services.json is properly configured for Firebase

## Quick Commands Reference

```bash
# Login to Expo
eas login

# Initialize project
eas project:init

# Build Android APK
eas build --platform android --profile production

# Build without waiting (get BUILD_ID)
eas build --platform android --profile production --no-wait

# Download build
eas build:download --platform android --id <BUILD_ID>

# List builds
eas build:list --platform android

# Install APK via ADB
adb install -r ./apk/bamanashop-android.apk

# Uninstall app
adb uninstall com.bamanashop.customer

# View logs
adb logcat | grep -i bamanashop
```

## Workflow Files Created

| File | Purpose |
|------|---------|
| `.github/workflows/eas-build.yml` | Main build workflow (Android + iOS) |
| `.github/workflows/eas-download-apk.yml` | Download APK from build ID |
| `eas.json` | EAS build configuration |
| `scripts/download-and-install-apk.sh` | Helper script for download + install |

## Next Steps After Installation

1. **Test the app** - Login with phone OTP, browse products, add to cart
2. **Configure Firebase** - Add real google-services.json for push notifications
3. **Set up Supabase** - Add real credentials for backend
4. **Test on multiple devices** - Different Android versions/screen sizes
5. **Submit to Play Store** - Use `eas submit --platform android` when ready