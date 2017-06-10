const chromeLauncher = require('lighthouse/chrome-launcher/chrome-launcher');
const CDP = require('chrome-remote-interface');

exports.launchChrome = async function launchChrome(startingUrl = '') {
  return chromeLauncher.launch({
    startingUrl,
    port: 9222,
    chromeFlags: [
      '--window-size=1280,1024',
      '--disable-gpu',
      '--headless',
    ],
    handleSIGINT: false,
  });
};

exports.createClient = async function createClient() {
  const client = await CDP();
  await client.Page.enable();
  await client.Runtime.enable();
  return client;
};
