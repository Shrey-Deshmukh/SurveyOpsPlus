const { completeProjectFlowEndToEnd } = require('../flows/project.flow');

describe('Project: Full Lifecycle Journey', () => {
  it('creates project, verifies metadata from Show Metadata button, edits metadata, and confirms updated time changes in list', async () => {
    await completeProjectFlowEndToEnd();
  });
});
