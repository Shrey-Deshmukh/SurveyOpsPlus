# How to install iOS build on physical device

## Device setup

1. use an iPhone with iOS 16+ (Developer Mode is required for development builds)
2. connect iPhone to Mac with USB and tap **Trust This Computer**
3. on iPhone enable Developer Mode: Settings > Privacy & Security > Developer Mode
4. restart iPhone when prompted and confirm Developer Mode is ON

## Option A: local build from Mac

1. install Xcode (latest stable) and open it once to finish setup
2. from `frontend/` run: `npx expo install expo-dev-client` (if not already installed)
3. run: `npx expo prebuild` add --clean for the first time
4. run: `npx expo run:ios --device` and select your connected iPhone
5. optional if the server is not started: keep Metro running for logs/hot reload: `npx expo start --dev-client`

## Run over common Wi-Fi after app is installed

1. phone and computer must be on same Wi-Fi
2. start server: `npx expo start --dev-client --host lan`
3. if LAN fails on restricted networks, use: `npx expo start --dev-client --tunnel`

## Common issues

1. **Device not listed in `run:ios --device`**: reconnect USB, unlock iPhone, trust computer, reopen Xcode
2. **Signing/provisioning error**: check Apple ID/team in Xcode signing, and bundle identifier is unique
3. **App installs but cannot open in dev mode**: verify Developer Mode is enabled on iPhone
