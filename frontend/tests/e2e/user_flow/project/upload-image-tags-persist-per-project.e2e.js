import { loginToApp } from "../../flows/auth.flow";
import { landingScreen } from "../../screens/landing.screen";
import { verifyTagPersistenceIsUniquePerProject } from "../../flows/image-tagging.flow";

class ProjectImageTaggingUserFlow {
  async uploadAndPersistTagsPerProject() {
    await loginToApp();
    await landingScreen.expectVisible();
    await verifyTagPersistenceIsUniquePerProject();
  }
}

class ProjectImageTaggingSuite {
  constructor(userFlow = new ProjectImageTaggingUserFlow()) {
    this.userFlow = userFlow;
  }

  register() {
    describe("Project: image upload and tag persistence", () => {
      this.testTagsPersistAndStayUniquePerProject();
    });
  }

  testTagsPersistAndStayUniquePerProject() {
    it("uploads images, saves tags, and keeps tags isolated by project", async () => {
      await this.userFlow.uploadAndPersistTagsPerProject();
    });
  }
}

new ProjectImageTaggingSuite().register();

export default {
  ProjectImageTaggingSuite,
  ProjectImageTaggingUserFlow,
};
