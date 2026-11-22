# Android APK Builds with GitHub Actions

BamanaShop Customer APKs are compiled directly on GitHub Actions runners. The workflow uses Expo Prebuild to generate the native Android project and Gradle to produce the APK. It does not call EAS Build or upload source code to expo.dev.

## Start a build

1. Open **GitHub → sudomarc/BamanaShop → Actions**.
2. Select **BamanaShop**.
3. Click **Run workflow**.
4. Choose a profile:
   - `dev`
   - `beta`
   - `production`
5. Enter a version such as `1.2.3`, `1.2.3-beta.1`, or `dev.test-0.1`.
6. Start the run. When it finishes, download the APK from the run's **Artifacts** section.

No `EXPO_TOKEN` or `EAS_PROJECT_ID` repository secret is required for Android APK builds.

## Versioning

The exact version entered in the workflow is applied to the app's version name. Accepted formats are SemVer (`MAJOR.MINOR.PATCH`, optionally with prerelease/build metadata) and named versions (`LABEL-MAJOR.MINOR`, for example `dev.test-0.1`). Named versions use patch `0` for Android version-code calculation. Android `versionCode` is derived as:

```text
major * 1,000,000 + minor * 1,000 + patch + 1
```

Use higher numeric components for each upgrade. The code is deterministic; different labels with the same numeric components produce the same Android versionCode.

## Profiles

| Profile | Gradle variant | Intended use |
|---|---|---|
| `dev` | `assembleDebug` | Standalone development APK; Android debugging enabled |
| `beta` | `assembleRelease` | Standalone test APK; Android debugging disabled |
| `production` | `assembleRelease` | Standalone release APK; Android debugging disabled |

All three profiles embed the React Native JavaScript bundle and run without Metro. DEV remains an Android Debug variant, but the build config forces the React Native Gradle plugin to bundle JavaScript for Debug and disables React Native's Metro-based developer support in `MainApplication`. The Android manifest remains debuggable for ADB inspection and Logcat. The Customer app uses a local `index.js` entry point matching the Expo SDK 51 Router bootstrap, with `@expo/metro-runtime` declared directly so PNPM can resolve the runtime from the app workspace. Since this app uses Expo SDK 51, `apps/customer/metro.config.js` explicitly watches the monorepo root and lists both app-level and repository-level `node_modules` directories, following Expo's pre-SDK 52 monorepo configuration.

## Install with ADB

After downloading and extracting the artifact:

```bash
adb devices
adb install -r ./BamanaShop-beta-v1.2.3.apk
```

For an APK signed with a different certificate than the version already installed, uninstall the old application first:

```bash
adb uninstall com.bamanashop.customer
```

## Local build

From the repository root:

```bash
./BUILD_AND_INSTALL.sh beta 1.2.3
```

The script generates the Android project, runs Gradle, validates the APK, and installs it if an ADB device is connected.

## Production signing

The workflow currently produces installable APKs using the generated debug signing configuration. It does not configure a private, persistent production signing key. These artifacts are suitable for controlled direct installation/testing, not Google Play publication. Before Play Store release, configure a private Android upload keystore in GitHub Secrets and wire it into the Gradle release signing configuration.
