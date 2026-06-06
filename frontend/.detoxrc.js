const fs = require('fs');
const path = require('path');

const defaultAvdHome = path.join(process.env.HOME ?? '', '.config/.android/avd');
if (!process.env.ANDROID_AVD_HOME && fs.existsSync(defaultAvdHome)) {
  process.env.ANDROID_AVD_HOME = defaultAvdHome;
}

function resolveProjectSlug() {
  const appJsonPath = path.join(__dirname, 'app.json');
  try {
    const raw = fs.readFileSync(appJsonPath, 'utf8');
    const slugMatch = raw.match(/"slug"\s*:\s*"([^"]+)"/);
    return slugMatch ? slugMatch[1] : 'surveyops-frontend';
  } catch {
    return 'surveyops-frontend';
  }
}

function resolveIosProjectName(fallbackName) {
  const iosDir = path.join(__dirname, 'ios');
  try {
    const entries = fs.readdirSync(iosDir);
    const workspace = entries.find((entry) => entry.endsWith('.xcworkspace'));
    if (workspace) {
      return workspace.replace(/\.xcworkspace$/, '');
    }
    const project = entries.find((entry) => entry.endsWith('.xcodeproj'));
    if (project) {
      return project.replace(/\.xcodeproj$/, '');
    }
  } catch {
    // Ignore and fallback to the derived name.
  }
  return fallbackName;
}

const slug = process.env.DETOX_SLUG ?? resolveProjectSlug();
const derivedProjectName = slug.replace(/[^a-zA-Z0-9]/g, '');
const nativeProjectName =
  process.env.DETOX_IOS_PROJECT_NAME ?? resolveIosProjectName(derivedProjectName);
const iosWorkspace = `ios/${nativeProjectName}.xcworkspace`;
const iosScheme = process.env.DETOX_IOS_SCHEME ?? nativeProjectName;

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'tests/e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  artifacts: {
    rootDir: 'artifacts/detox',
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: `ios/build/Build/Products/Debug-iphonesimulator/${nativeProjectName}.app`,
      build:
        `npx expo prebuild --platform ios --non-interactive && ` +
        `xcodebuild -workspace ${iosWorkspace} ` +
        `-scheme ${iosScheme} ` +
        `-configuration Debug -sdk iphonesimulator ` +
        `-derivedDataPath ios/build`,
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      reversePorts: [8081],
      build:
        'export NODE_ENV=test && export CI=1 && ' +
        'cd android && ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: process.env.DETOX_IOS_DEVICE ?? 'iPhone 16',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: process.env.DETOX_ANDROID_AVD ?? 'Android_emu_1',
      },
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: process.env.DETOX_ANDROID_DEVICE ?? 'emulator-5554',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug',
    },
  },
};
