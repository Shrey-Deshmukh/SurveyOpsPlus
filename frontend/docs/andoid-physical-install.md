# How to install android build on physical device

## Device Setup

1. enable developer options
2. turn off the Auto Blocker feature in Settings > Security and Privacy > Auto Blocker
3. turn on USB debugging in dev options
4. on device allow for you system

## Expo build

1. npx expo prebuild
2. npx expo run:android --device #select your device
3. when connected with usb run server for logs: npx expo start --dev-client
