#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-beta}"
VERSION="${2:-1.0.0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$PROFILE" in
  dev) GRADLE_TASK="assembleDebug"; APK_SOURCE="app/build/outputs/apk/debug/app-debug.apk" ;;
  beta|production) GRADLE_TASK="assembleRelease"; APK_SOURCE="app/build/outputs/apk/release/app-release.apk" ;;
  *)
    echo "Usage: $0 [dev|beta|production] [MAJOR.MINOR.PATCH]" >&2
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

VERSION_CODE="$(node - "$VERSION" <<'NODE'
const value = process.argv[2] ?? "";
const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
if (!match) {
  throw new Error("Version must use MAJOR.MINOR.PATCH, for example 1.2.3.");
}
const [major, minor, patch] = match.slice(1).map(Number);
if (major > 2099 || minor > 999 || patch > 999) {
  throw new Error("Version is outside the supported Android versionCode range.");
}
const code = major * 1000000 + minor * 1000 + patch + 1;
if (!Number.isSafeInteger(code) || code > 2100000000) {
  throw new Error("Calculated Android versionCode exceeds Android's supported maximum.");
}
process.stdout.write(String(code));
NODE
)"

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

echo "APK created: $APK_PATH"

if command -v adb >/dev/null 2>&1 && adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit !found }'; then
  adb install -r "$APK_PATH"
  echo "BamanaShop installed successfully."
else
  echo "No authorized ADB device detected; APK was kept at $APK_PATH."
fi

if [ "$PROFILE" = "dev" ]; then
  echo "Dev APK requires the Metro server: pnpm dev:customer"
fi
