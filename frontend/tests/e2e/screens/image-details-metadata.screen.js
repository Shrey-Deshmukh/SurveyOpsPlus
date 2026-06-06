const { selectors } = require('../utils/selectors');

class ImageDetailsMetadataScreen {
  toTagSlug(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  get root() {
    return element(by.id(selectors.imageDetails.root));
  }

  get backButton() {
    return element(by.id(selectors.imageDetails.backButton));
  }

  get tagInput() {
    return element(by.id(selectors.imageDetails.tagInput));
  }

  get addTagButton() {
    return element(by.id(selectors.imageDetails.addTagButton));
  }

  get saveButton() {
    return element(by.id(selectors.imageDetails.saveButton));
  }

  getTagChip(tag) {
    const slug = this.toTagSlug(tag);
    return element(by.id(`image-details-tag-chip-${slug}`));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await expect(this.tagInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async addTag(tag) {
    await this.tagInput.replaceText(tag);
    await this.addTagButton.tap();
  }

  async expectTagVisible(tag) {
    await expect(this.getTagChip(tag)).toBeVisible();
  }

  async expectTagNotVisible(tag) {
    await expect(this.getTagChip(tag)).not.toExist();
  }

  async saveMetadata() {
    await this.saveButton.tap();
    await this.confirmSaveAlert();
  }

  async goBackToWorkspace() {
    await waitFor(this.backButton).toBeVisible().withTimeout(10000);
    await this.backButton.tap();
  }

  async confirmSaveAlert() {
    const alertButtons = [
      element(by.id('android:id/button1')),
      element(by.text('OK')),
      element(by.text('Ok')),
    ];

    for (const alertButton of alertButtons) {
      try {
        await waitFor(alertButton).toBeVisible().withTimeout(5000);
        await alertButton.tap();
        return;
      } catch (_error) {
        // Try next selector variant.
      }
    }

    throw new Error('Save confirmation alert was not acknowledged. Could not find OK button.');
  }
}

const imageDetailsMetadataScreen = new ImageDetailsMetadataScreen();

module.exports = { imageDetailsMetadataScreen };
