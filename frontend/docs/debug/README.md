# Debugging tips

## Android

1. Requires java 17, switch to it when compiling the project

### Nuke cache and saved packages

```bash
rm -rf node_modules package-lock.json yarn.lock

./gradlew --stop
./gradlew --status
# somtimes only delete affected cache: rm -rf ~/.gradle/caches/8.14.3
rm -rf ~/.gradle/caches

# install
npm install

# rebuild
npx expo prebuild --clean --platform android

# run android app
 npx expo run:android
```

## Manual development build
If it still says “no development build”
```bash
adb" -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
npm run test:e2e:expo:start
npx expo run:android
```

