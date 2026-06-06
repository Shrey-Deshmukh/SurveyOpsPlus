# E2E Testing Guide

This folder contains the end-to-end (E2E) testing framework for the app using `Detox` + `Jest`.

The goal is to make E2E runs:

- deterministic (same behavior on all machines),
- extendable (easy to add new user flows),
- and debuggable (clear failure points).

Quick commands are documented in:

- `docs/e2e-cheatsheet.md`

## Stack and Mental Model

E2E in this project is built from three layers:

1. **Expo CLI** starts the dev server (`expo start --dev-client --clear`).
2. **Detox** installs/launches the app and drives UI actions on emulator/simulator.
3. **Jest** runs your test files and reports pass/fail.

`expo start` runs the Metro bundler under the hood, but script naming is Expo-focused for clarity.

## Project Structure

```text
tests/
  readme.md
  how_to_write_tests.md
  e2e/
    jest.config.js
    setup/
      lifecycle.js
    utils/
      app.launch.js
      selectors.js
    screens/
      login.screen.js
      landing.screen.js
    flows/
      auth.flow.js
    user_flow/
      auth/
        login-and-see-landing.e2e.js
```

## Required Packages

These are required in `devDependencies`:

- `detox`
- `jest`

## NPM Scripts (What each one does)

- `test:e2e:expo:start`: start Expo dev server for dev client.
- `test:e2e:dev-server`: alias to `test:e2e:expo:start`.
- `test:e2e:metro`: backward-compatible alias to `test:e2e:expo:start`.
- `test:e2e:build:android`: build app APK and androidTest APK for Detox.
- `test:e2e:android`: run all Android user-flow tests (AVD boot mode).
- `test:e2e:android:attached`: run all Android tests against already running emulator.
- `test:e2e:android:auth-login`: run only auth login test (AVD boot mode).
- `test:e2e:android:auth-login:attached`: run only auth login test (attached mode).
- `test:e2e:build:ios`: build iOS app for Detox.
- `test:e2e:ios`: run all iOS user-flow tests.
- `test:e2e:ios:auth-login`: run only auth login test on iOS.

## Detox Configuration

Main file: `frontend/.detoxrc.js`

Native patch persistence on prebuild:

- `frontend/plugins/withDetoxAndroid.js`
- Registered in `app.json` plugins as `./plugins/withDetoxAndroid`
- Re-applies Detox Android instrumentation wiring after `expo prebuild`

Configured targets:

- iOS simulator config: `ios.sim.debug`
- Android emulator config: `android.emu.debug`
- Android attached device config: `android.att.debug`

Useful overrides:

- `DETOX_IOS_DEVICE`
- `DETOX_ANDROID_AVD`
- `DETOX_ANDROID_DEVICE`

## Prerequisites

Before running tests:

1. iOS: Xcode + simulator installed.
2. Android: SDK + emulator installed.
3. Local app package IDs match config (`app.json` and native app id).
4. You can build native debug app successfully.

## Standard Run Flow

Start the Expo dev server in terminal 1:

```bash
npm run test:e2e:expo:start
```

Build + run tests in terminal 2:

```bash
# Android
npm run test:e2e:build:android
npm run test:e2e:android

# iOS
npx run test:e2e:build:ios
npx run test:e2e:ios
```

## Run a Single Test File

```bash
# Android (AVD boot mode)
npm run test:e2e:android -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js

# Android (attached emulator mode)
npm run test:e2e:android:attached -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js

# iOS
npm run test:e2e:ios -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js
```

## Run All Tests in a Folder (including subfolders)

Use folder path directly:

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/auth"
```

That runs all matching files under that folder recursively.

## Useful Pattern Examples

All auth flows:

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/auth/.*\\.e2e\\.js$"
```

All login-related files anywhere in user flows:

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/.*/.*login.*\\.e2e\\.js$"
```

Auth or projects folders:

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/(auth|projects)/.*\\.e2e\\.js$"
```

Specific test name inside matched files:

```bash
npm run test:e2e:android -- --testPathPatterns="tests/e2e/user_flow/auth" --testNamePattern="logs in and shows the landing page"
```

## Common Android Failure Explanations

### `Failed to find the app binary ... app-debug-androidTest.apk`

Meaning: only app APK exists; instrumentation APK is missing.

Fix: run build first:

```bash
npm run test:e2e:build:android
```

### `No development build (...) is installed`

Meaning: package is not installed on target device, or wrong device is targeted.

Fix: install/build app for same emulator, then rerun.

### `Cannot boot Android Emulator with the name ...`

Meaning: Detox expects AVD name, not adb serial.

Fix: set `DETOX_ANDROID_AVD` correctly, or use attached mode:

```bash
npm run test:e2e:android:attached
```

### `detox: command not found`

Meaning: global Detox CLI not installed.

Fix: use npm scripts or `npx` from `frontend`.

## Test IDs in Current Baseline Flow

- `login-screen`
- `login-submit-button`
- `landing-screen`

## Additional Authoring Guide

For writing/organizing new tests, see:

- `tests/how_to_write_tests.md`
