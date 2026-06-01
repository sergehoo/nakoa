#!/usr/bin/env bash
# Build iOS release pour App Store / TestFlight.
set -euo pipefail

cd "$(dirname "$0")/.."

API_URL="${API_URL:-https://api.printhub.io}"
WS_URL="${WS_URL:-wss://ws.printhub.io}"
BUILD_NAME="${BUILD_NAME:-1.0.0}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"

echo "▶ Build iOS release (v${BUILD_NAME}+${BUILD_NUMBER}) → ${API_URL}"

flutter clean
flutter pub get
cd ios && pod install --repo-update && cd ..

flutter build ipa --release \
  --build-name="${BUILD_NAME}" \
  --build-number="${BUILD_NUMBER}" \
  --dart-define=API_URL="${API_URL}" \
  --dart-define=WS_URL="${WS_URL}" \
  --export-options-plist=ios/ExportOptions.plist

echo "✓ IPA : build/ios/ipa/printhub.ipa"
echo "▶ Pour upload TestFlight :"
echo "   xcrun altool --upload-app -f build/ios/ipa/printhub.ipa -t ios -u YOUR_APPLE_ID --apiKey \$KEY_ID"
