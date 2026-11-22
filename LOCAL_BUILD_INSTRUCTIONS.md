# Local Android APK Build

This guide builds the Customer Android APK locally. It does not use EAS Build or require an Expo account.

## Prerequisites

- Node.js 20+
- pnpm 12.21.0
- Java 17
- Android SDK with platform 34 and build-tools 34.0.0
- Android platform-tools / ADB (only needed for device installation)

## Build

From the repository root:

```bash
./BUILD_AND_INSTALL.sh beta 1.0.0
```

Arguments:

- Profile: `dev`, `beta`, or `production` (default: `beta`)
- Version: `MAJOR.MINOR.PATCH` (default: `1.0.0`)

The script installs workspace dependencies, runs Expo Prebuild to generate the native Android project, compiles it with Gradle, validates the APK, and installs it through ADB when a device is connected.

The APK is saved in `apk/`.

## GitHub Actions build

1. Open the repository's **Actions** tab.
2. Select **BamanaShop** and click **Run workflow**.
3. Choose the profile: `dev`, `beta`, or `production`.
4. Enter the app version, for example `1.2.3`.
5. Start the run and download the APK from its **Artifacts** section.

GitHub Actions compiles Android locally on its runner using Gradle. Android builds require neither `EXPO_TOKEN` nor `EAS_PROJECT_ID`.

## Build profiles

- `dev`: standalone Gradle release APK with Android debugging enabled.
- `beta`: standalone Gradle release APK with Android debugging disabled.
- `production`: standalone Gradle release APK with Android debugging disabled.

All profiles embed the React Native JavaScript bundle and run without Metro. DEV remains an Android-debuggable build, but it does not use Metro or React Native's development support at runtime.

The Android `versionCode` is calculated from the semantic version, so increase the version when preparing an upgrade.

**Signing note:** the workflow does not provision a private Google Play upload key. The generated APKs are for direct installation and testing; publishing to Google Play requires a persistent Android signing key configured in Gradle.

## Install a downloaded APK

```bash
adb devices
bash ./scripts/install-apk.sh ./BamanaShop-beta-v1.0.0.apk
```

If Android reports a signature conflict with a previously installed build, uninstall the old app first:

```bash
adb uninstall com.bamanashop.customer
```
