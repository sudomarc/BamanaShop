#!/usr/bin/env bash
set -euo pipefail

APP="${1:-customer}"
PROFILE="${2:-beta}"
VERSION="${3:-1.0.0}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$APP" in
  customer|pro) APP_DIR="$ROOT_DIR/apps/$APP";;
  *)
    echo "Usage: $0 [customer|pro] [dev|beta|production] [1.2.3]" >&2
    exit 2
    ;;
esac

case "$PROFILE" in
  dev) GRADLE_TASK=":app:assembleDebug"; VARIANT="debug"; EXPECTED_DEBUGGABLE="true";;
  beta|production) GRADLE_TASK=":app:assembleRelease"; VARIANT="release"; EXPECTED_DEBUGGABLE="false";;
  *)
    echo "Profile must be dev, beta, or production." >&2
    exit 2
    ;;
esac

for required in pnpm node java gradle adb; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "$required is required and must be available in PATH." >&2
    exit 1
  fi
done

VERSION_CODE="$(node "$ROOT_DIR/scripts/app-version.cjs" "$VERSION")"
if [ ! -f "$ROOT_DIR/.env.mobile" ]; then
  printf 'SUPABASE_URL=%s\nSUPABASE_ANON_KEY=%s\n' "${SUPABASE_URL:-}" "${SUPABASE_ANON_KEY:-}" > "$ROOT_DIR/.env.mobile"
  chmod 600 "$ROOT_DIR/.env.mobile"
fi

cd "$ROOT_DIR"
pnpm install --no-frozen-lockfile --ignore-scripts

cd "$APP_DIR/android"
gradle --no-daemon --stacktrace "$GRADLE_TASK" \
  "-PbamanashopVersionName=$VERSION" \
  "-PbamanashopVersionCode=$VERSION_CODE"

if [ "$VARIANT" = "debug" ]; then
  APK_SOURCE="app/build/outputs/apk/debug/app-debug.apk"
else
  APK_SOURCE="app/build/outputs/apk/release/app-release.apk"
fi

if [ ! -s "$APK_SOURCE" ]; then
  echo "Gradle did not produce the expected APK: $APK_SOURCE" >&2
  exit 1
fi

if ! unzip -Z1 "$APK_SOURCE" | grep -Fxq "assets/index.android.bundle"; then
  echo "The APK does not contain the embedded JavaScript bundle." >&2
  exit 1
fi

ACTUAL_DEBUGGABLE="$(apkanalyzer manifest debuggable "$APK_SOURCE")"
if [ "$ACTUAL_DEBUGGABLE" != "$EXPECTED_DEBUGGABLE" ]; then
  echo "Expected debuggable=$EXPECTED_DEBUGGABLE, got $ACTUAL_DEBUGGABLE." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/apk"
APK_PATH="$ROOT_DIR/apk/BamanaShop-$APP-$PROFILE-v$VERSION.apk"
cp "$APK_SOURCE" "$APK_PATH"
unzip -t "$APK_PATH" >/dev/null

if adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit !found }'; then
  adb install -r "$APK_PATH"
  echo "Installed with ADB: $APK_PATH"
else
  echo "No authorized ADB device detected; APK saved at $APK_PATH"
fi

echo "APK verified: $APK_PATH"
echo "Metro is not needed to run the installed APK."
