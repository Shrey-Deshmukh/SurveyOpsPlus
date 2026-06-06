const { selectors } = require('../utils/selectors');

class LandingScreen {
  toProjectNameSlug(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  get root() {
    return element(by.id(selectors.landing.root));
  }

  get createProjectButton() {
    return element(by.id(selectors.landing.createProjectButton));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
  }

  async tapCreateProjectButton() {
    await waitFor(this.createProjectButton).toBeVisible().withTimeout(10000);
    await this.createProjectButton.tap();
  }

  async expectProjectVisibleInList(projectName) {
    await waitFor(element(by.text(projectName)))
      .toBeVisible()
      .withTimeout(10000);
  }

  async openProjectFromList(projectName) {
    const projectNameElement = element(by.text(projectName));
    await waitFor(projectNameElement).toBeVisible().withTimeout(10000);
    await projectNameElement.tap();
  }

  getUpdatedLabelElement(projectName) {
    const slug = this.toProjectNameSlug(projectName);
    return element(by.id(`project-card-updated-${slug}`));
  }

  async getUpdatedRawValue(projectName) {
    const updatedLabel = this.getUpdatedLabelElement(projectName);
    await waitFor(updatedLabel).toBeVisible().withTimeout(10000);
    const attributes = await updatedLabel.getAttributes();
    const label = typeof attributes.label === 'string' ? attributes.label : '';
    return label.replace('updated-at-raw:', '');
  }

  async expectUpdatedRawValueChanged(projectName, previousRawValue) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const currentRawValue = await this.getUpdatedRawValue(projectName);
      if (currentRawValue && currentRawValue !== previousRawValue) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const finalRawValue = await this.getUpdatedRawValue(projectName);
    expect(finalRawValue).not.toEqual(previousRawValue);
  }
}

const landingScreen = new LandingScreen();

module.exports = { landingScreen };
