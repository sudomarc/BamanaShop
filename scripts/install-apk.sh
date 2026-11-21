#!/usr/bin/env bash
set -euo pipefail

APK_PATH="${1:-}"

if [ -z "$APK_PATH" ] || [ ! -f "$APK_PATH" ]; then
  echo "Usage: $0 <path-to-apk>" >&2
  exit 2
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "ADB is not installed or is not in PATH." >&2
  exit 1
fi

if ! adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit !found }'; then
  echo "No authorized Android device is connected." >&2
  adb devices
  exit 1
fi

adb install -r "$APK_PATH"
echo "Installed: $APK_PATH"
