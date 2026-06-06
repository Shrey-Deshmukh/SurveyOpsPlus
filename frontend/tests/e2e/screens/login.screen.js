const { selectors } = require('../utils/selectors');

class LoginScreen {
  get root() {
    return element(by.id(selectors.login.root));
  }

  get submitButton() {
    return element(by.id(selectors.login.submitButton));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await expect(this.submitButton).toBeVisible();
  }

  async submitLogin() {
    await this.submitButton.tap();
  }
}

const loginScreen = new LoginScreen();

module.exports = { loginScreen };
