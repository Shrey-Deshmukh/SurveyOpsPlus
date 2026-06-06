const { loginToApp } = require('./auth.flow');
const { landingScreen } = require('../screens/landing.screen');
const { createProjectScreen } = require('../screens/create-project.screen');
const { createProjectMetadataScreen } = require('../screens/create-project-metadata.screen');
const { workspaceScreen } = require('../screens/workspace.screen');
const { editProjectMetadataScreen } = require('../screens/edit-project-metadata.screen');

const CREATE_PROJECT_DETAILS = Object.freeze({
  surveyDetails: 'E2E survey details',
  instructions: 'E2E instructions for survey team',
  location: 'Singapore Port',
  date: '05/04/2026',
  status: 'In Progress',
  representingParty: 'Shipper',
});

const INITIAL_METADATA_VALUES = Object.freeze({
  containerId: 'MSKU1234567',
  vesselName: 'Maersk Kensington',
  voyageNo: '304E',
  operator: 'MSC',
  portOfLoading: 'Singapore, SG',
  portOfDischarge: 'Los Angeles, US',
  inspectionDate: '2026-05-04',
  inspectionTime: '14:30',
});

function buildUniqueProjectName() {
  return `E2E Project ${Date.now()}`;
}

function buildUpdatedOperatorValue() {
  return `MSC E2E ${Date.now()}`;
}

function buildUpdatedMetadataValues(editedOperator) {
  return {
    ...INITIAL_METADATA_VALUES,
    operator: editedOperator,
  };
}

async function stepLoginAndOpenCreateProjectScreen() {
  await loginToApp();
  await landingScreen.expectVisible();
  await landingScreen.tapCreateProjectButton();
  await createProjectScreen.expectVisible();
}

async function stepFillCreateProjectForm(projectName) {
  await createProjectScreen.enterProjectName(projectName);
  await createProjectScreen.fillDetails(CREATE_PROJECT_DETAILS);
  await createProjectScreen.submitProject();
}

async function stepFillMetadataFormAndEnterWorkspace() {
  await createProjectMetadataScreen.expectVisible();
  await createProjectMetadataScreen.fillRequiredMetadata();
  await createProjectMetadataScreen.submitProject();
  await workspaceScreen.expectVisible();
}

async function stepOpenMetadataFromWorkspaceAndVerifyValues(expectedMetadataValues) {
  await workspaceScreen.openMetadataEditor();
  await editProjectMetadataScreen.expectVisible();
  await editProjectMetadataScreen.expectMetadataValues(expectedMetadataValues);
  await editProjectMetadataScreen.goBackToWorkspace();
  await workspaceScreen.expectVisible();
}

async function stepGoBackToProjectListAndVerifyProjectVisible(projectName) {
  await workspaceScreen.goBackToLanding();
  await landingScreen.expectVisible();
  await landingScreen.expectProjectVisibleInList(projectName);
}

async function stepOpenProjectFromListAndVerifyWorkspace(projectName) {
  await landingScreen.openProjectFromList(projectName);
  await workspaceScreen.expectVisible();
}

async function stepEditOperatorFromWorkspaceMetadataAndSave(editedOperator) {
  await workspaceScreen.openMetadataEditor();
  await editProjectMetadataScreen.expectVisible();
  await editProjectMetadataScreen.updateOperator(editedOperator);
  await editProjectMetadataScreen.saveChanges();
  await workspaceScreen.expectVisible();
}

async function createProjectFromListToWorkspace(projectName) {
  await stepLoginAndOpenCreateProjectScreen();
  await stepFillCreateProjectForm(projectName);
  await stepFillMetadataFormAndEnterWorkspace();
}

async function createProjectAndVerifyInLandingList() {
  const projectName = buildUniqueProjectName();

  await createProjectFromListToWorkspace(projectName);
  await stepGoBackToProjectListAndVerifyProjectVisible(projectName);
}

async function completeProjectFlowEndToEnd() {
  const projectName = buildUniqueProjectName();
  const editedOperator = buildUpdatedOperatorValue();
  const updatedMetadataValues = buildUpdatedMetadataValues(editedOperator);

  await createProjectFromListToWorkspace(projectName);
  await stepOpenMetadataFromWorkspaceAndVerifyValues(INITIAL_METADATA_VALUES);
  await stepGoBackToProjectListAndVerifyProjectVisible(projectName);

  const updatedAtBeforeEdit = await landingScreen.getUpdatedRawValue(projectName);
  await stepOpenProjectFromListAndVerifyWorkspace(projectName);
  await stepEditOperatorFromWorkspaceMetadataAndSave(editedOperator);
  await stepGoBackToProjectListAndVerifyProjectVisible(projectName);
  await landingScreen.expectUpdatedRawValueChanged(projectName, updatedAtBeforeEdit);

  await stepOpenProjectFromListAndVerifyWorkspace(projectName);
  await stepOpenMetadataFromWorkspaceAndVerifyValues(updatedMetadataValues);
}

module.exports = {
  CREATE_PROJECT_DETAILS,
  INITIAL_METADATA_VALUES,
  buildUniqueProjectName,
  createProjectFromListToWorkspace,
  createProjectAndVerifyInLandingList,
  completeProjectFlowEndToEnd,
};
