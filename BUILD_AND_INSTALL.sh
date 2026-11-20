#!/bin/bash
set -e
echo "🔨 Building BamanaShop Android APK..."
if ! command -v eas &> /dev/null; then npm install -g eas-cli; fi
eas whoami || eas login
cd apps/customer
BUILD_ID=$(eas build --platform android --profile production --non-interactive --no-wait | grep -o 'builds/[a-f0-9-]*' | cut -d'/' -f2)
if [ -z "$BUILD_ID" ]; then
    eas build --platform android --profile production --non-interactive
    BUILD_ID=$(eas build:list --platform android --limit=1 --json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi
echo "Build ID: $BUILD_ID"
echo "⏳ Waiting for build..."
while true; do
    STATUS=$(eas build:view $BUILD_ID --json 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "Status: $STATUS"
    if [[ "$STATUS" == "finished" ]]; then break; elif [[ "$STATUS" == "errored" ]]; then exit 1; fi
    sleep 30
done
echo "⬇️  Downloading APK..."
mkdir -p ./apk
eas build:download --platform android --id $BUILD_ID --output ./apk
echo "📲 Installing via ADB..."
if ! adb devices | grep -q "device$"; then
    echo "❌ No device connected. APK at ./apk/*.apk"
    exit 1
fi
adb install -r ./apk/*.apk
echo "✅ Done! BamanaShop installed on phone!"
