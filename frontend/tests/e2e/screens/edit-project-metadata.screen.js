const { selectors } = require('../utils/selectors');

class EditProjectMetadataScreen {
  get root() {
    return element(by.id(selectors.editProjectMetadata.root));
  }

  get backButton() {
    return element(by.id(selectors.editProjectMetadata.backButton));
  }

  get saveButton() {
    return element(by.id(selectors.editProjectMetadata.saveButton));
  }

  get operatorInput() {
    return element(by.id(selectors.editProjectMetadata.operatorInput));
  }

  get containerIdInput() {
    return element(by.id(selectors.editProjectMetadata.containerIdInput));
  }

  get vesselNameInput() {
    return element(by.id(selectors.editProjectMetadata.vesselNameInput));
  }

  get voyageNoInput() {
    return element(by.id(selectors.editProjectMetadata.voyageNoInput));
  }

  get portOfLoadingInput() {
    return element(by.id(selectors.editProjectMetadata.portOfLoadingInput));
  }

  get portOfDischargeInput() {
    return element(by.id(selectors.editProjectMetadata.portOfDischargeInput));
  }

  get inspectionDateInput() {
    return element(by.id(selectors.editProjectMetadata.inspectionDateInput));
  }

  get inspectionTimeInput() {
    return element(by.id(selectors.editProjectMetadata.inspectionTimeInput));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await expect(this.saveButton).toBeVisible();
  }

  async saveChanges() {
    await this.saveButton.tap();
  }

  async updateOperator(value) {
    await waitFor(this.operatorInput).toBeVisible().withTimeout(10000);
    await this.operatorInput.clearText();
    await this.operatorInput.replaceText(value);
  }

  async expectOperatorValue(value) {
    await expect(this.operatorInput).toHaveText(value);
  }

  async expectMetadataValues(values) {
    await expect(this.containerIdInput).toHaveText(values.containerId);
    await expect(this.vesselNameInput).toHaveText(values.vesselName);
    await expect(this.voyageNoInput).toHaveText(values.voyageNo);
    await expect(this.operatorInput).toHaveText(values.operator);
    await expect(this.portOfLoadingInput).toHaveText(values.portOfLoading);
    await expect(this.portOfDischargeInput).toHaveText(values.portOfDischarge);
    await expect(this.inspectionDateInput).toHaveText(values.inspectionDate);
    await expect(this.inspectionTimeInput).toHaveText(values.inspectionTime);
  }

  async goBackToWorkspace() {
    await waitFor(this.backButton).toBeVisible().withTimeout(10000);
    await this.backButton.tap();
  }
}

const editProjectMetadataScreen = new EditProjectMetadataScreen();

module.exports = { editProjectMetadataScreen };
