const { landingScreen } = require('../screens/landing.screen');
const { workspaceScreen } = require('../screens/workspace.screen');
const { imageDetailsMetadataScreen } = require('../screens/image-details-metadata.screen');
const { buildUniqueProjectName, createProjectFromListToWorkspace } = require('./project.flow');

function buildUniqueTag(prefix) {
  return `${prefix}-${Date.now()}`;
}

async function addTaggedImageToCurrentProject(projectName, tag) {
  await workspaceScreen.expectVisible();
  await workspaceScreen.uploadImageForE2E(projectName);
  await workspaceScreen.openFirstImageFromWorkspace();
  await imageDetailsMetadataScreen.expectVisible();
  await imageDetailsMetadataScreen.addTag(tag);
  await imageDetailsMetadataScreen.expectTagVisible(tag);
  await imageDetailsMetadataScreen.saveMetadata();
  await workspaceScreen.expectVisible();
}

async function openProjectFromLanding(projectName) {
  await landingScreen.expectVisible();
  await landingScreen.openProjectFromList(projectName);
  await workspaceScreen.expectVisible();
}

async function createProjectAndAddTaggedImage(tag) {
  const projectName = buildUniqueProjectName();
  await createProjectFromListToWorkspace(projectName);
  await addTaggedImageToCurrentProject(projectName, tag);
  await workspaceScreen.goBackToLanding();
  await landingScreen.expectVisible();
  return projectName;
}

async function verifyProjectShowsExpectedTag(projectName, expectedTag, absentTag) {
  await openProjectFromLanding(projectName);
  await workspaceScreen.openFirstImageFromWorkspace();
  await imageDetailsMetadataScreen.expectVisible();
  await imageDetailsMetadataScreen.expectTagVisible(expectedTag);
  await imageDetailsMetadataScreen.expectTagNotVisible(absentTag);
  await imageDetailsMetadataScreen.goBackToWorkspace();
  await workspaceScreen.goBackToLanding();
}

async function verifyTagPersistenceIsUniquePerProject() {
  const projectATag = buildUniqueTag('e2e-project-a-tag');
  const projectBTag = buildUniqueTag('e2e-project-b-tag');

  const projectAName = await createProjectAndAddTaggedImage(projectATag);
  const projectBName = await createProjectAndAddTaggedImage(projectBTag);

  await verifyProjectShowsExpectedTag(projectAName, projectATag, projectBTag);
  await verifyProjectShowsExpectedTag(projectBName, projectBTag, projectATag);
}

module.exports = {
  verifyTagPersistenceIsUniquePerProject,
};
