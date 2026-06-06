const E2E_PERMISSIONS = {
  camera: 'YES',
  photos: 'YES',
};

async function launchFreshApp() {
  await device.launchApp({
    delete: true,
    newInstance: true,
    permissions: E2E_PERMISSIONS,
  });
}

async function reloadApp() {
  await device.reloadReactNative();
}

module.exports = {
  launchFreshApp,
  reloadApp,
};
