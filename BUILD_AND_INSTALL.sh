#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-beta}"
VERSION="${2:-1.0.0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$PROFILE" in
  dev) GRADLE_TASK="assembleDebug"; APK_SOURCE="app/build/outputs/apk/debug/app-debug.apk" ;;
  beta|production) GRADLE_TASK="assembleRelease"; APK_SOURCE="app/build/outputs/apk/release/app-release.apk" ;;
  *)
    echo "Usage: $0 [dev|beta|production] [1.2.3|1.2.3-beta.1|dev.test-0.1]" >&2
    exit 2
    ;;
esac

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required (version 12.21.0)." >&2
  exit 1
fi
if ! command -v java >/dev/null 2>&1; then
  echo "Java 17 is required to run Gradle." >&2
  exit 1
fi

VERSION_CODE="$(node "$ROOT_DIR/scripts/app-version.cjs" "$VERSION")"

echo "Building BamanaShop Customer: profile=$PROFILE version=$VERSION versionCode=$VERSION_CODE"

cd "$ROOT_DIR"
pnpm install --frozen-lockfile --ignore-scripts

cd "$ROOT_DIR/apps/customer"
CI=1 \
BAMANASHOP_BUILD_PROFILE="$PROFILE" \
BAMANASHOP_VERSION="$VERSION" \
BAMANASHOP_ANDROID_VERSION_CODE="$VERSION_CODE" \
EXPO_NO_TELEMETRY=1 \
  pnpm exec expo prebuild --platform android --clean --no-install

node "$ROOT_DIR/scripts/android-build-profile.cjs" "$PROFILE" "$ROOT_DIR/apps/customer/android/app"
node --test "$ROOT_DIR/scripts/android-build-profile.test.cjs"

cd "$ROOT_DIR/apps/customer/android"
./gradlew --no-daemon --stacktrace ":app:$GRADLE_TASK"

if [ ! -s "$APK_SOURCE" ]; then
  echo "Gradle did not produce the expected APK: $APK_SOURCE" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/apk"
APK_PATH="$ROOT_DIR/apk/BamanaShop-$PROFILE-v$VERSION.apk"
cp "$APK_SOURCE" "$APK_PATH"
unzip -t "$APK_PATH" >/dev/null
if ! unzip -Z1 "$APK_PATH" | grep -Fxq "assets/index.android.bundle"; then
  echo "The APK does not contain the embedded React Native JavaScript bundle." >&2
  exit 1
fi

echo "APK created: $APK_PATH"

if command -v adb >/dev/null 2>&1 && adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit !found }'; then
  adb install -r "$APK_PATH"
  echo "BamanaShop installed successfully."
else
  echo "No authorized ADB device detected; APK was kept at $APK_PATH."
fi

echo "All profiles are standalone APKs; Metro is not required at runtime."
