const fs = require('fs');
const { ChromeLauncher } = require('lighthouse/lighthouse-cli/chrome-launcher');
const chrome = require('chrome-remote-interface');


async function launchChrome() {
  const launcher = new ChromeLauncher({
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

  return launcher;
}

module.exports = class Scraper {
  constructor() {

  }

  async init() {
    console.log('Initialising browser...');
    this.launcher = await launchChrome();
    this.client = await chrome();

    this.client.on('error', (err) => {
      throw Error('Cannot connect to Chrome: ', err);
    });

    await this.client.Page.enable();
    await this.client.Runtime.enable();
    await this.client.DOM.enable();

    this.initialized = true;

    console.log('Initialized\n');
  }

  async login(credentials) {
    if (!credentials.dni || !credentials.user || !credentials.password) {
      throw new Error('Invalid credentials');
    }

    if (!this.initialized) {
      await this.init();
    }

    const navigateToLogin = async () => {
      return new Promise(resolve => {
        this.client.once('Page.loadEventFired', resolve);
        this.client.Page.navigate({url: 'https://www.bbvafrances.com.ar/fnetcore/loginClementeApp.html'});
      })
    }

    const fillFormAndSubmit = async () => {
      const browserCode = ({ dni, user, password }) => {
        return new Promise((resolve) => {
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

      return this.client.Runtime.evaluate({
        expression: `(${browserCode})(${JSON.stringify(credentials)})`,
        awaitPromise: true,
      });
    }

    const waitForSuccess = async () => {
      return new Promise((resolve) => {
        this.client.once('Page.loadEventFired', () => {
          this.client.once('Page.frameDetached', () => {
            this.client.once('Page.loadEventFired', resolve);
          });
        });
      });
    };

    console.log('Loading login page...');
    await navigateToLogin();
    console.log('Loaded\n');

    console.log('Log in...');
    await fillFormAndSubmit();

    // TODO handle errors
    await waitForSuccess();

    console.log('Logged in successfully\n');
    this.logged = true;
  }

  async logout() {
    console.log('Logging out...');

    this.client.once('Page.frameDetached', async () => {
      console.log('Logged out.');
      await this.client.close();
      this.launcher.kill(); // Kill Chrome.

      this.initialized = false;
    });

    const browserCode = () => {
      document.querySelector('.btn-logout').click();
    };

    return this.client.Runtime.evaluate({
      expression: `(${browserCode})()`,
    });
  }

  async getProductInfo() {
    if (!this.logged) {
      throw new Error('You must be logged in');
    }

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

      return new Promise((resolve) => {
        new MutationObserver((mutations, observer) => {
          const containers = document.querySelectorAll('.bbva-tables');

          if (!containers.length) {
            return;
          }

          const accounts = buildItems(containers[0]);
          const cards = buildItems(containers[1]);
          observer.disconnect();
          resolve({ accounts, cards });
        }).observe(document.body, {
          childList: true
        });
      });
    };

    const result = await this.client.Runtime.evaluate({
      expression: `(${browserCode})()`,
      awaitPromise: true,
      returnByValue: true,
    });

    return result.result.value;
  }

  async takeScreenshot() {
    const { data } = await this.client.Page.captureScreenshot();
    fs.writeFileSync('bbva.png', Buffer.from(data, 'base64'));
  }
}
