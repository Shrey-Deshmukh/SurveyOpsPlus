module.exports = {
  rootDir: '../..',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup/lifecycle.js'],
  reporters: ['detox/runners/jest/reporter'],
  testMatch: ['<rootDir>/tests/e2e/user_flow/**/*.e2e.js'],
  maxWorkers: 1,
  testTimeout: 120000,
  verbose: true,
};
