const { loginScreen } = require('../screens/login.screen');
const { landingScreen } = require('../screens/landing.screen');
const { selectors } = require('../utils/selectors');

async function isScreenVisible(testID, timeoutMs) {
  try {
    await waitFor(element(by.id(testID))).toBeVisible().withTimeout(timeoutMs);
    return true;
  } catch (_error) {
    return false;
  }
}

async function loginToApp() {
  // Idempotent login helper:
  // - If already authenticated, stay on landing.
  // - Otherwise complete login from login screen.
  if (await isScreenVisible(selectors.landing.root, 1500)) {
    return;
  }

  const loginVisible = await isScreenVisible(selectors.login.root, 10000);
  if (!loginVisible) {
    throw new Error('Expected login or landing screen, but neither became visible.');
  }

  await loginScreen.submitLogin();
  await landingScreen.expectVisible();
}

module.exports = {
  loginToApp,
};
