import { loginToApp } from "../../flows/auth.flow";
import { landingScreen } from "../../screens/landing.screen";

class AuthLoginUserFlow {
  async loginAndSeeLanding() {
    await loginToApp();
    await landingScreen.expectVisible();
  }
}

class AuthLoginSuite {
  constructor(userFlow = new AuthLoginUserFlow()) {
    this.userFlow = userFlow;
  }

  register() {
    describe("Auth: login", () => {
      this.testLoginAndSeeLanding();
    });
  }

  testLoginAndSeeLanding() {
    it("logs in and shows the landing page", async () => {
      await this.userFlow.loginAndSeeLanding();
    });
  }
}

new AuthLoginSuite().register();

export default {
  AuthLoginSuite,
  AuthLoginUserFlow,
};
