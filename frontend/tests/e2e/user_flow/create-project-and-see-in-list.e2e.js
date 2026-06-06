const { createProjectAndVerifyInLandingList } = require('../flows/project.flow');

describe('Project: Create Journey', () => {
  it('creates a project across forms and shows it in the project list', async () => {
    await createProjectAndVerifyInLandingList();
  });
});
