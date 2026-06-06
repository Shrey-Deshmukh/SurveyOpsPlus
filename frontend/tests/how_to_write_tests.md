# How To Write E2E Tests

This guide explains the exact steps to add a new Detox test and run only that test.

## Core pattern

Each test uses this structure:

1. **Utils**: shared launch helpers and selectors (`tests/e2e/utils`)
2. **Screens**: page objects with actions/assertions (`tests/e2e/screens`)
3. **Flows**: reusable user journeys (`tests/e2e/flows`)
4. **User Flow**: test scenarios (`tests/e2e/user_flow/<use-case>/*.e2e.js`)

## Step-by-step: adding a new test

### 1) Add or confirm `testID`s in app UI

In React Native components, add stable `testID` props to elements you interact with or assert.

Example:

- `testID="save-button"`
- `testID="profile-screen"`

### 2) Add selector constants

Create or update `tests/e2e/utils/selectors.js` so all tests use one source of truth.

### 3) Add/extend a screen object

Create or update a file in `tests/e2e/screens`.

A screen object should provide:

- element getters (`element(by.id(...))`)
- interaction helpers (`tap`, `typeText`, etc.)
- assertion helpers (`expectVisible`)

### 4) Add/extend a flow

Create or update a file in `tests/e2e/flows` for reusable sequences (login, onboarding, navigation).

### 5) Create a user-flow test in a use-case folder

Put tests in use-case directories:

- `tests/e2e/user_flow/auth`
- `tests/e2e/user_flow/projects`
- `tests/e2e/user_flow/settings`

Spec file naming convention:

- `*.e2e.js`
- Example: `tests/e2e/user_flow/auth/login-error-state.e2e.js`

### 6) Keep test files focused

`tests/e2e/setup/lifecycle.js` already applies:

- `beforeAll`: fresh app launch
- `beforeEach`: RN reload

So test files should focus only on scenario actions and assertions.

### 7) Use a class-based suite

Keep auth tests class-based so the suite can expose test methods clearly:

- One class for reusable steps (for example: `AuthLoginUserFlow`)
- One class that registers `describe`/`it` blocks (for example: `AuthLoginSuite`)
- One method per test case to make suite/individual execution explicit

Use `--testPathPatterns` to run a file or `--testNamePattern` to run one test method name.

## Running a specific test

### Option A: direct command with path filter

From `frontend`:

```bash
npx detox test -c android.emu.debug -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js
```

Use `ios.sim.debug` for iOS.

If an emulator is already running and visible in `adb devices`, use attached mode:

```bash
npx detox test -c android.att.debug -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js
```

### Option B: npm script (recommended)

From `frontend`:

```bash
npm run test:e2e:android:auth-login
```

### Option C: run one test case by name

```bash
npm run test:e2e:android -- --testPathPatterns=tests/e2e/user_flow/auth/login-and-see-landing.e2e.js --testNamePattern="logs in and shows the landing page"
```

## Running all tests

Keep Expo dev server running in one terminal:

```bash
npm run test:e2e:expo:start
```

Then in another terminal:

```bash
# Android
npm run test:e2e:build:android
npm run test:e2e:android

# iOS
npm run test:e2e:build:ios
npm run test:e2e:ios
```

## Minimal spec template

```js
describe('Feature: scenario', () => {
  it('does something visible for the user', async () => {
    // arrange
    // act
    // assert
  });
});
```
