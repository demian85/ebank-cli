// See API docs: https://chromedevtools.github.io/devtools-protocol/

require('dotenv').config()

const fs = require('fs');

const { table } = require('table');
const { ChromeLauncher } = require('lighthouse/lighthouse-cli/chrome-launcher');
const chrome = require('chrome-remote-interface');

let launcher;

async function launchChrome() {
  launcher = new ChromeLauncher({
    port: 9222,
    autoSelectChrome: true, // False to manually select which Chrome install.
    additionalFlags: [
      '--window-size=1280,1024',
      '--disable-gpu',
      '--headless',
    ]
  });

  try {
    await launcher.run();
  } catch (e) {
    await launcher.kill();
    throw e;
  }
}

async function init() {
  await launchChrome();
  const client = await chrome();

  client.on('error', (err) => {
    throw Error('Cannot connect to Chrome: ', err);
  });

  const { Page, Runtime, DOM } = client;

  const stage0 = () => {
    console.log('Loading bbvafrances.com.ar...');
    client.once('Page.loadEventFired', stage1);
    Page.navigate({url: 'https://www.bbvafrances.com.ar/fnetcore/loginClementeApp.html'});
  };

  const stage1 = () => {
    console.log('Loaded');
    // ugly hack because of redirect...
    client.once('Page.loadEventFired', () => {
      client.once('Page.frameDetached', () => {
        client.once('Page.loadEventFired', stage2);
      });
    });
    login(client);
  };

  const stage2 = async () => {
    console.log('Log in successful');
    const { accounts, cards } = await productInfo(client);
    console.log('Accounts:\n');
    console.log(table(accounts));
    console.log('Cards:\n');
    console.log(table(cards));
    //await takeScreenshot(client);
    logout(client);
  };

  await Page.enable();
  await Runtime.enable();
  await DOM.enable();

  stage0();
}

async function login(client) {
  const formValues = {
    dni: process.env.BBVA_DNI,
    user: process.env.BBVA_USER,
    password: process.env.BBVA_PASSWORD,
  };
  const browserCode = ({ dni, user, password }) => {
    return new Promise((resolve, reject) => {
      const fillValues = () => {
        document.querySelector('#documentNumberInput').value = dni;
        document.querySelector('#documentNumberInput').dispatchEvent(new Event('input'));
        document.querySelector('[name="digitalUser"]').value = user;
        document.querySelector('[name="digitalUser"]').dispatchEvent(new Event('input'));
        document.querySelector('[name="digitalKey"]').value = password;
        document.querySelector('[name="digitalKey"]').dispatchEvent(new Event('input'));
        document.querySelector('.btn.btn-success.btn-login-modal').click();
        resolve();
      };
      setTimeout(fillValues, 100);
    });
  };

  return client.Runtime.evaluate({
    expression: `(${browserCode})(${JSON.stringify(formValues)})`,
    awaitPromise: true,
  });
}

async function logout(client) {
  console.log('Logging out...');
  client.once('Page.frameDetached', async () => {
    console.log('Logged out.');
    await client.close();
    launcher.kill(); // Kill Chrome.
  });
  const browserCode = () => {
    document.querySelector('.btn-logout').click();
  };
  return client.Runtime.evaluate({
    expression: `(${browserCode})()`,
  });
}

async function productInfo(client) {
  console.log('Fetching accounts...');
  const browserCode = () => {
    const cleanup = (str) => {
      return str.trim().replace(/\s+/g, ' ').replace(/\n/g, '');
    };
    const buildItems = (container) => {
      const rows = Array.from(container.querySelectorAll('.only-balance table tr')).slice(1);
      return rows.map((row) => {
        return [
          cleanup(row.querySelector('td:nth-child(1) div').textContent),
          cleanup(row.querySelector('td:nth-child(3)').textContent),
        ];
      });
    }
    return new Promise((resolve, reject) => {
      new MutationObserver((mutations, observer) => {
        const containers = document.querySelectorAll('.bbva-tables');
        if (!containers.length) return;
        const accounts = buildItems(containers[0]);
        const cards = buildItems(containers[1]);
        observer.disconnect();
        resolve({ accounts, cards });
      }).observe(document.body, {
        childList: true
      });
    });
  };

  const result = await client.Runtime.evaluate({
    expression: `(${browserCode})()`,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.value;
}

async function takeScreenshot(client) {
  const { data } = await client.Page.captureScreenshot();
  fs.writeFileSync('bbva.png', Buffer.from(data, 'base64'));
}

init();
