#!/usr/bin/env bash
# Build Android release pour Google Play.
set -euo pipefail

cd "$(dirname "$0")/.."

API_URL="${API_URL:-https://api.printhub.io}"
WS_URL="${WS_URL:-wss://ws.printhub.io}"
BUILD_NAME="${BUILD_NAME:-1.0.0}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"

echo "▶ Build Android release (v${BUILD_NAME}+${BUILD_NUMBER}) → ${API_URL}"

flutter clean
flutter pub get

# APK (sideload / direct)
flutter build apk --release \
  --build-name="${BUILD_NAME}" \
  --build-number="${BUILD_NUMBER}" \
  --dart-define=API_URL="${API_URL}" \
  --dart-define=WS_URL="${WS_URL}"

# Bundle AAB (Google Play)
flutter build appbundle --release \
  --build-name="${BUILD_NAME}" \
  --build-number="${BUILD_NUMBER}" \
  --dart-define=API_URL="${API_URL}" \
  --dart-define=WS_URL="${WS_URL}"

echo "✓ APK : build/app/outputs/flutter-apk/app-release.apk"
echo "✓ AAB : build/app/outputs/bundle/release/app-release.aab"
