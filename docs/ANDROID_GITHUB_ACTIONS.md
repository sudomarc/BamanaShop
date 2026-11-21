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
5. Enter a version in `MAJOR.MINOR.PATCH` format, for example `1.2.3`.
6. Start the run. When it finishes, download the APK from the run's **Artifacts** section.

No `EXPO_TOKEN` or `EAS_PROJECT_ID` repository secret is required for Android APK builds.

## Versioning

The version entered in the workflow is applied to the app's version name. Android `versionCode` is derived as:

```text
major * 1,000,000 + minor * 1,000 + patch + 1
```

Use a higher semantic version for each upgrade. This keeps the Android version code deterministic and increasing.

## Profiles

| Profile | Gradle variant | Intended use |
|---|---|---|
| `dev` | `assembleDebug` | Development; requires Metro to serve the JavaScript bundle |
| `beta` | `assembleRelease` | Release build for testing |
| `production` | `assembleRelease` | Release build |

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

The current workflow produces installable APKs for direct distribution and testing. It does not configure a private, persistent Google Play upload key. Before publishing to Google Play, configure a private Android signing keystore and wire it into the Gradle release signing configuration.
