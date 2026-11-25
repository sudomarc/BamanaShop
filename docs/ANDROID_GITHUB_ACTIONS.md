# Android APK builds

Customer and Pro are bare React Native applications. The Android projects are checked into `apps/customer/android` and `apps/pro/android`; GitHub Actions does not generate them.

## Build from GitHub Actions

Open **Actions → Android APK → Run workflow** and select:
- Application: `customer` or `pro`
- Profile: `dev`, `beta` or `production`
- Version: for example `1.2.3` or `1.2.3-beta.1`

The artifact contains one APK for the selected application.

## One-time signing setup

All profiles use the same private Android keystore so that a later APK can replace the installed APK with `adb install -r`. Do not commit the keystore or its passwords.

Create a keystore locally:

```bash
keytool -genkeypair -v -keystore bamanashop-upload.jks -storetype JKS -alias bamanashop -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 bamanashop-upload.jks > bamanashop-upload.base64
```

Add these GitHub Actions repository secrets:
- `BAMANASHOP_ANDROID_KEYSTORE_BASE64`: contents of `bamanashop-upload.base64`
- `BAMANASHOP_ANDROID_KEYSTORE_PASSWORD`
- `BAMANASHOP_ANDROID_KEY_ALIAS`: normally `bamanashop`
- `BAMANASHOP_ANDROID_KEY_PASSWORD`

Keep a secure backup of the keystore. Losing it prevents signing future updates with the same certificate. Never share the keystore or passwords.

## Profiles

| Profile | Gradle task | Android debuggable | JS bundled | Metro at runtime |
|---|---|---:|---:|---:|
| DEV | `:app:assembleDebug` | true | yes | no |
| BETA | `:app:assembleRelease` | false | yes | no |
| PRODUCTION | `:app:assembleRelease` | false | yes | no |

DEV keeps the Android debug flag for ADB and Logcat. React Native developer support is disabled in `MainApplication`, and the Gradle plugin bundles JavaScript for the Debug variant. Metro is only used as the build-time bundler; it is not started by the installed APK.

## Install and inspect with ADB

```bash
adb devices
adb install -r ./BamanaShop-customer-dev-v1.2.3.apk
adb logcat -s ReactNativeJS AndroidRuntime
```

Package IDs:
- Customer: `com.bamanashop.customer`
- Pro: `com.bamanashop.pro`

If the signing certificate differs from the installed build, Android refuses the update. Uninstall only as a last resort because it clears the app's local data.

## Local build

Install JDK 17, Android SDK Platform 34, Build Tools 34.0.0, NDK 26.1.10909125 and Gradle 8.7. From the repository root:

```bash
pnpm install
cd apps/customer/android
gradle :app:assembleDebug -PbamanashopVersionName=dev.1.0 -PbamanashopVersionCode=1000001
```

For BETA/PRODUCTION use `:app:assembleRelease`. Export the same signing environment variables used by CI to sign with the same keystore.

## Mobile backend configuration

The workflow now includes the current project's **public mobile configuration** as defaults, so Customer and Pro builds can run without manually creating GitHub variables. Repository secrets or variables can still override these defaults for another Supabase environment. To configure a different project, set these GitHub Actions values (Settings → Secrets and variables → Actions):

- `SUPABASE_URL`: the HTTPS URL of the intended Supabase project.
- `SUPABASE_ANON_KEY`: that project's publishable key or legacy anon key. This is a public client key; it must never be replaced with a service-role key.

The workflow validates that the resolved URL is HTTPS and refuses to build if the configuration is empty. The built-in anon key is a public client credential intended for mobile apps; RLS and backend authorization remain the security boundary. Never use a service-role key in this workflow or an APK.

The DEV profile may use Android's debug signing key when the persistent keystore is not configured. BETA and PRODUCTION fail unless all four signing secrets above are present and the keystore alias can be validated. The same persistent keystore must be retained for future updates to install over existing builds.

The workflow's artifact validation confirms that the APK contains the JavaScript bundle and checks its package ID, debuggable flag, signature structure and ZIP integrity. It does not replace installing the APK on a physical device and exercising the app without Metro.
