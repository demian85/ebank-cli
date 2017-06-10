const { launchChrome, createClient } = require('../../common');

module.exports = class Scraper {
  async init() {
    console.log('Loading...');

    this.launcher = await launchChrome('https://myaccount.payoneer.com/Login/Login.aspx');
    this.client = await createClient();
    await this.client.Page.loadEventFired();
    await this.client.Page.loadEventFired(); // FIXME: 2 load events are being fired...
    this.initialized = true;

    console.log('Loaded');
  }

  async finish () {
    await this.client.close();
    this.launcher.kill();
    this.initialized = false;
  }

  async login(credentials) {
    if (!credentials.user || !credentials.password) {
      throw new Error('Invalid credentials');
    }

    if (!this.initialized) {
      await this.init();
    }

    console.log('Logging in...');

    const browserCode = ({ user, password }) => {
      const fillValues = () => {
        document.querySelector('#txtUserName').value = user;
        document.querySelector('#txtUserName').dispatchEvent(new Event('input'));
        document.querySelector('#txtPassword').value = password;
        document.querySelector('#txtPassword').dispatchEvent(new Event('input'));
        document.querySelector('#btLogin').click();
      };
      setTimeout(fillValues, 100);
    };

    return new Promise(async (resolve) => {
      this.client.once('Page.loadEventFired', () => {
        console.log('Logged in successfully');
        this.logged = true;
        resolve();
      });
      this.client.Runtime.evaluate({
        expression: `(${browserCode})(${JSON.stringify(credentials)})`,
        awaitPromise: false,
      });
    });
  }

  async logout() {
    console.log('Logging out...');

    await this.client.Page.navigate({
      url: 'https://myaccount.payoneer.com/mainpage/SetAccount.aspx?ac=0',
    });
    await this.client.Page.loadEventFired();

    console.log('Logged out.');

    this.finish();
  }

  async getBalance() {
    const browserCode = () => {
      return Promise.resolve(document.querySelector('#BalanceTableCell strong').textContent.trim());
    };
    const result = await this.client.Runtime.evaluate({
      expression: `(${browserCode})()`,
      awaitPromise: true,
      returnByValue: true,
    });
    return result.result.value;
  }

  async getTransactions() {
    if (!this.logged) {
      throw new Error('You must be logged in');
    }

    console.log('Fetching transactions...');

    const browserCode = () => {
      const cleanup = (str) => {
        return str.trim().replace(/\s+/g, ' ').replace(/\n/g, '');
      };
      const buildItems = (container) => {
        const rows = Array.from(container.querySelectorAll('tr'));
        return rows.map((row) => {
          return Array.from(row.querySelectorAll('th, td'))
            .map(cell => cleanup(cell.textContent));
        });
      }
      return new Promise((resolve) => {
        new MutationObserver((mutations, observer) => {
          const container = document.querySelector('#gvTranscations');
          if (!container || container.rows.length < 2) {
            return;
          }
          observer.disconnect();
          resolve(buildItems(container))
        }).observe(document.body, {
          childList: true
        });
      });
    };

    return new Promise((resolve) => {
      this.client.once('Page.loadEventFired', async () => {
        const result = await this.client.Runtime.evaluate({
          expression: `(${browserCode})()`,
          awaitPromise: true,
          returnByValue: true,
        });
        resolve(result.result.value);
      });
      this.client.Page.navigate({
        url: 'https://myaccount.payoneer.com/MainPage/Transactions.aspx',
      });
    });
  }
}
