# Build Android APKs locally

BamanaShop Customer and Pro are bare React Native applications. Their Android Gradle projects are maintained in `apps/customer/android` and `apps/pro/android`; the build does not generate Android projects.

## Requirements

- Node.js 20+
- pnpm 12.21.0
- JDK 17
- Android SDK Platform 34 and Build Tools 34.0.0
- Android NDK 26.1.10909125
- Gradle 8.7
- ADB (for installation)

## Build and optionally install

From the repository root:

```bash
./BUILD_AND_INSTALL.sh customer dev 1.2.3
./BUILD_AND_INSTALL.sh customer beta 1.2.3
./BUILD_AND_INSTALL.sh pro production 1.2.3
```

Arguments: application (`customer|pro`), profile (`dev|beta|production`), version (SemVer such as `1.2.3`). The script installs dependencies, runs Gradle, verifies the embedded bundle and manifest debuggability, and installs the APK when an authorized ADB device is connected. APKs are saved under `apk/`.

## Supabase configuration

Create a root `.env` file with:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

These are public client credentials. Never put a Supabase service-role key in a mobile app.

## Profiles and Metro

- DEV uses Gradle Debug, keeps Android `debuggable=true`, embeds the JavaScript bundle, and disables React Native developer support.
- BETA and PRODUCTION use Gradle Release and Android `debuggable=false`.
- No installed APK requires a running Metro server. Metro only bundles JavaScript during the APK build.

## ADB

```bash
adb devices
adb install -r ./apk/BamanaShop-customer-dev-v1.2.3.apk
adb logcat -s ReactNativeJS AndroidRuntime
```

All profiles should be signed with the same private keystore when update installation is required. Local builds use the configured keystore when `BAMANASHOP_KEYSTORE_FILE`, `BAMANASHOP_KEYSTORE_PASSWORD`, `BAMANASHOP_KEY_ALIAS` and `BAMANASHOP_KEY_PASSWORD` are exported. Do not commit the keystore or passwords.
