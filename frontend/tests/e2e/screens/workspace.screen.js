const { selectors } = require('../utils/selectors');

class WorkspaceScreen {
  get root() {
    return element(by.id(selectors.workspace.root));
  }

  get backButton() {
    return element(by.id(selectors.workspace.backButton));
  }

  get showMetadataButton() {
    return element(by.id(selectors.workspace.showMetadataButton));
  }

  get uploadImagesButton() {
    return element(by.id(selectors.workspace.uploadImagesButton));
  }

  get firstImageThumbnail() {
    return element(by.id(selectors.workspace.firstImageThumbnail));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await expect(this.backButton).toBeVisible();
  }

  async openMetadataEditor() {
    await waitFor(this.showMetadataButton).toBeVisible().withTimeout(10000);
    await this.showMetadataButton.tap();
  }

  async goBackToLanding() {
    await this.backButton.tap();
  }

  async uploadImageForE2E(projectName) {
    const encodedProjectName = encodeURIComponent(projectName);
    await device.openURL({
      url: `surveyopsplus.frontend:///e2e/seed-image?projectName=${encodedProjectName}`,
    });
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await waitFor(this.firstImageThumbnail).toBeVisible().withTimeout(10000);
  }

  async openFirstImageFromWorkspace() {
    await waitFor(this.firstImageThumbnail).toBeVisible().withTimeout(10000);
    await this.firstImageThumbnail.tap();
  }
}

const workspaceScreen = new WorkspaceScreen();

module.exports = { workspaceScreen };
