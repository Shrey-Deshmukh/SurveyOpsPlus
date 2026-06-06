# E2E Cheatsheet

Run these commands from the `frontend` directory.

## Start dev server

```bash
npm run test:e2e:expo:start
```

## Build test binaries

```bash
# Android
npm run test:e2e:build:android

# iOS
npm run test:e2e:build:ios
```

## Run all tests

```bash
# Android (boots AVD configured in Detox)
npm run test:e2e:android

# Android (attach to running emulator/device)
npm run test:e2e:android:attached

# iOS
npm run test:e2e:ios
```

## Run one test file

```bash
# Android
npm run test:e2e:android -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js

# Android attached mode
npm run test:e2e:android:attached -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js

# iOS
npm run test:e2e:ios -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js
```

## Run all tests in a folder (recursive)

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/auth"
```

## Run one test by name

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/auth" --testNamePattern="logs in and shows the landing page"
```

## Shortcuts

```bash
npm run test:e2e:android:auth-login
npm run test:e2e:android:auth-login:attached
npm run test:e2e:ios:auth-login
```
