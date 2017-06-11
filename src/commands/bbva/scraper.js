const fs = require('fs');
const { launchChrome, createClient } = require('../../common');

module.exports = class Scraper {
  async init() {
    console.log('Loading...');

    this.launcher = await launchChrome('https://www.bbvafrances.com.ar/fnetcore/loginClementeApp.html');
    this.client = await createClient();
    await this.client.Page.loadEventFired();
    this.initialized = true;

    console.log('Loaded');
  }

  async finish () {
    await this.client.close();
    this.launcher.kill();
    this.initialized = false;
  }

  async login(credentials) {
    if (!credentials.dni || !credentials.user || !credentials.password) {
      throw new Error('Invalid credentials');
    }

    if (!this.initialized) {
      await this.init();
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

      console.log('Log in...');

      await this.client.Runtime.evaluate({
        expression: `(${browserCode})(${JSON.stringify(credentials)})`,
        awaitPromise: true,
      });
    }

    const waitForSuccess = async () => {
      return new Promise((resolve, reject) => {
        // TODO better error detection
        const timeout = setTimeout(reject, 5000);

        this.client.once('Page.loadEventFired', () => {
          clearTimeout(timeout);

          this.client.once('Page.frameDetached', () => {
            this.client.once('Page.loadEventFired', resolve);
          });
        });
      });
    };

    try {
      await fillFormAndSubmit();
      await waitForSuccess();
      console.log('Success')
      this.logged = true;
    } catch(err) {
      await this.finish();
      console.error(err);
      throw new Error('Log in error')
    }
  }

  async logout() {
    console.log('Logging out...');

    this.client.once('Page.frameDetached', () => {
      console.log('Success');

      this.finish();
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

    console.log('Fetching accounts...\n');

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
