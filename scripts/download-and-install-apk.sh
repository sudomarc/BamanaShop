#!/bin/bash
# Download and install BamanaShop APK from EAS build
# Usage: ./scripts/download-and-install-apk.sh <BUILD_ID> [android|ios]

set -e

BUILD_ID="${1}"
PLATFORM="${2:-android}"

if [ -z "$BUILD_ID" ]; then
    echo "Usage: $0 <BUILD_ID> [android|ios]"
    echo ""
    echo "Get BUILD_ID from:\n  eas build --platform android --profile production --no-wait"
    echo "Or from the EAS dashboard: https://expo.dev/accounts/[account]/projects/bamanashop/builds"
    exit 1
fi

echo "🔍 Downloading EAS build artifact..."
echo "   Build ID: $BUILD_ID"
echo "   Platform: $PLATFORM"

# Login to Expo (requires EXPO_TOKEN env var or run eas login first)
if [ -n "$EXPO_TOKEN" ]; then
    echo "🔐 Logging in with EXPO_TOKEN..."
    eas login --token "$EXPO_TOKEN"
fi

# Download the APK
echo "📥 Downloading APK..."
eas build:download --platform "$PLATFORM" --id "$BUILD_ID" --output ./apk

# Find the APK file
APK_FILE=$(find ./apk -name "*.apk" | head -n 1)

if [ -z "$APK_FILE" ]; then
    echo "❌ No APK file found in ./apk/"
    exit 1
fi

echo "✅ APK downloaded: $APK_FILE"

# Check if ADB is available and device is connected
if ! command -v adb &> /dev/null; then
    echo "⚠️  ADB not found in PATH. Install ADB to install on device."
    echo "   APK location: $APK_FILE"
    exit 0
fi

echo "📱 Checking for connected devices..."
ADB_DEVICES=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)

if [ "$ADB_DEVICES" -eq 0 ]; then
    echo "⚠️  No Android device connected via ADB."
    echo "   APK location: $APK_FILE"
    echo "   Run: adb install $APK_FILE"
    exit 0
fi

echo "📲 Installing APK on device..."
adb install -r "$APK_FILE"

echo "✅ Installation complete!"
echo "   App should now be available on your device."