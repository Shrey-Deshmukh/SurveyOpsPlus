const { selectors } = require('../utils/selectors');

class CreateProjectMetadataScreen {
  get root() {
    return element(by.id(selectors.createProjectMetadata.root));
  }

  get scrollView() {
    return element(by.id(selectors.createProjectMetadata.scrollView));
  }

  get containerIdInput() {
    return element(by.id(selectors.createProjectMetadata.containerIdInput));
  }

  get vesselNameInput() {
    return element(by.id(selectors.createProjectMetadata.vesselNameInput));
  }

  get voyageNoInput() {
    return element(by.id(selectors.createProjectMetadata.voyageNoInput));
  }

  get operatorInput() {
    return element(by.id(selectors.createProjectMetadata.operatorInput));
  }

  get portOfLoadingInput() {
    return element(by.id(selectors.createProjectMetadata.portOfLoadingInput));
  }

  get portOfDischargeInput() {
    return element(by.id(selectors.createProjectMetadata.portOfDischargeInput));
  }

  get inspectionDateInput() {
    return element(by.id(selectors.createProjectMetadata.inspectionDateInput));
  }

  get inspectionTimeInput() {
    return element(by.id(selectors.createProjectMetadata.inspectionTimeInput));
  }

  get submitButton() {
    return element(by.id(selectors.createProjectMetadata.submitButton));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await expect(this.submitButton).toBeVisible();
  }

  async fillRequiredMetadata() {
    await this.scrollToElement(this.containerIdInput);
    await this.containerIdInput.replaceText('MSKU1234567');
    await this.scrollToElement(this.vesselNameInput);
    await this.vesselNameInput.replaceText('Maersk Kensington');
    await this.scrollToElement(this.voyageNoInput);
    await this.voyageNoInput.replaceText('304E');
    await this.scrollToElement(this.operatorInput);
    await this.operatorInput.replaceText('MSC');
    await this.scrollToElement(this.portOfLoadingInput);
    await this.portOfLoadingInput.replaceText('Singapore, SG');
    await this.scrollToElement(this.portOfDischargeInput);
    await this.portOfDischargeInput.replaceText('Los Angeles, US');
    await this.scrollToElement(this.inspectionDateInput);
    await this.inspectionDateInput.replaceText('2026-05-04');
    await this.scrollToElement(this.inspectionTimeInput);
    await this.inspectionTimeInput.replaceText('14:30');
  }

  async submitProject() {
    await this.scrollToElement(this.submitButton);
    await this.submitButton.tap();
  }

  async scrollToElement(targetElement) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await expect(targetElement).toBeVisible();
        return;
      } catch (_error) {
        await this.scrollView.scroll(220, 'down');
      }
    }

    await expect(targetElement).toBeVisible();
  }
}

const createProjectMetadataScreen = new CreateProjectMetadataScreen();

module.exports = { createProjectMetadataScreen };
