const { launchFreshApp, reloadApp } = require('../utils/app.launch');

beforeAll(async () => {
  await launchFreshApp();
});

beforeEach(async () => {
  await reloadApp();
});
