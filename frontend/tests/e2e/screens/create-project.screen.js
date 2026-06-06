const { selectors } = require('../utils/selectors');

class CreateProjectScreen {
  get root() {
    return element(by.id(selectors.createProject.root));
  }

  get nameInput() {
    return element(by.id(selectors.createProject.nameInput));
  }

  get surveyDetailsInput() {
    return element(by.id(selectors.createProject.surveyDetailsInput));
  }

  get instructionsInput() {
    return element(by.id(selectors.createProject.instructionsInput));
  }

  get locationInput() {
    return element(by.id(selectors.createProject.locationInput));
  }

  get scrollView() {
    return element(by.id(selectors.createProject.scrollView));
  }

  get dateInput() {
    return element(by.id(selectors.createProject.dateInput));
  }

  get representingPartyDropdown() {
    return element(by.id(selectors.createProject.representingPartyDropdown));
  }

  get submitButton() {
    return element(by.id(selectors.createProject.submitButton));
  }

  async expectVisible() {
    await waitFor(this.root).toBeVisible().withTimeout(10000);
    await expect(this.nameInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async enterProjectName(projectName) {
    await this.nameInput.replaceText(projectName);
  }

  async fillDetails(details = {}) {
    const {
      surveyDetails = 'E2E survey details',
      instructions = 'E2E instructions for survey team',
      location = 'Singapore Port',
      date = '05/04/2026',
      status = 'In Progress',
      representingParty = 'Shipper',
    } = details;

    await this.scrollToElement(this.surveyDetailsInput, 'down');
    await this.surveyDetailsInput.replaceText(surveyDetails);
    await this.scrollToElement(this.instructionsInput, 'down');
    await this.instructionsInput.replaceText(instructions);
    await this.scrollToElement(this.locationInput, 'down');
    await this.locationInput.clearText();
    await this.locationInput.replaceText(location);

    const statusOptionId = `create-project-status-option-${status
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
    await element(by.id(statusOptionId)).tap();

    await this.scrollToElement(this.dateInput, 'down');
    await this.enterDate(date);
    await this.selectRepresentingParty(representingParty);
  }

  async enterDate(dateValue) {
    await this.dateInput.replaceText(dateValue);
  }

  async selectRepresentingParty(option) {
    const optionId = `create-project-representing-party-option-${option
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
    const optionById = element(by.id(optionId));
    const optionByText = element(by.text(option));
    let opened = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await this.representingPartyDropdown.tap();
        opened = true;
        break;
      } catch (_error) {
        await this.scrollDown();
      }
    }

    if (!opened) {
      await this.representingPartyDropdown.tap();
    }

    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await optionById.tap();
        return;
      } catch (_idError) {
        try {
          await optionByText.tap();
          return;
        } catch (_textError) {
          await this.scrollDown();
          await this.representingPartyDropdown.tap();
        }
      }
    }

    await optionById.tap();
  }

  async scrollToElement(targetElement, direction = 'down') {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await expect(targetElement).toBeVisible();
        return;
      } catch (_error) {
        if (direction === 'down') {
          await this.scrollDown();
        } else {
          await this.scrollUp();
        }
      }
    }

    await expect(targetElement).toBeVisible();
  }

  async submitProject() {
    await this.scrollToElement(this.submitButton, 'down');
    await this.submitButton.tap();
  }

  async scrollDown() {
    await waitFor(this.scrollView).toBeVisible().withTimeout(5000);
    await this.scrollView.scroll(220, 'down');
  }

  async scrollUp() {
    await waitFor(this.scrollView).toBeVisible().withTimeout(5000);
    await this.scrollView.scroll(220, 'up');
  }
}

const createProjectScreen = new CreateProjectScreen();

module.exports = { createProjectScreen };
