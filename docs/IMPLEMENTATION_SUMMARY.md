# BamanaShop mobile implementation status

## Current mobile architecture

BamanaShop has two bare React Native applications:
- `apps/customer`: Customer shopping app.
- `apps/pro`: shared seller and courier app.

Both use the React Native Community CLI, React Navigation, Metro as a build-time JavaScript bundler, Android Gradle projects maintained in Git, and Supabase. Expo SDK, Expo Router, Expo modules, EAS Build and Expo Prebuild are not part of the mobile architecture.

## Existing screens

Customer screens live under `apps/customer/app/` and are registered explicitly from `apps/customer/App.tsx`. Pro seller and courier screens live under `apps/pro/app/` and are registered from `apps/pro/App.tsx`.

## Native modules

- React Navigation provides stack and bottom-tab navigation.
- React Native Image Picker handles gallery and camera selection in Customer.
- React Native Biometrics handles the Customer biometric prompt.
- React Native Keychain persists Supabase auth data on device.
- React Native Config reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the root `.env` file during native builds.
- React Native Vector Icons provides Ionicons glyphs.

## Android build

The native projects are versioned under each mobile application. Use `./BUILD_AND_INSTALL.sh customer dev 1.2.3` or `./BUILD_AND_INSTALL.sh pro beta 1.2.3` for a local build. GitHub Actions exposes the same application/profile/version selectors.

Every profile must contain `assets/index.android.bundle`. DEV keeps Android `debuggable=true` for ADB and Logcat, while React Native developer support remains disabled so the installed APK does not contact Metro. BETA and PRODUCTION are Release builds with Android `debuggable=false`.

## Known validation status

The native project scaffolding and app entry points have been added on the Expo-removal branch. A successful Gradle build, device install, app startup and offline-from-Metro launch are not claimed until GitHub Actions runs and the resulting APK is inspected and executed on an Android emulator/device.
