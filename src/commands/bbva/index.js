const { table } = require('table');
const Scraper = require('./scraper.js');

module.exports = {
  command: 'bbva',
  describe: 'BBVA Home Banking utility',
  builder: {},
  handler: async function (argv) {
    const scraper = new Scraper();

    if (!process.env.BBVA_DNI || !process.env.BBVA_USER || !process.env.BBVA_PASSWORD) {
      throw new Error('Credentials not found. Check your .env file');
    }

    await scraper.login({
      dni: process.env.BBVA_DNI,
      user: process.env.BBVA_USER,
      password: process.env.BBVA_PASSWORD,
    });

    const { accounts, cards } = await scraper.getProductInfo();

    console.log('Accounts:\n');
    console.log(accounts.length ? table(accounts) : '- No accounts found -\n');

    console.log('Cards:\n');
    console.log(cards.length ? table(cards) : '- No cards found -\n');

    await scraper.logout();
  }
};
