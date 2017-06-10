const { table } = require('table');
const Scraper = require('./scraper.js');

module.exports = {
  command: 'payoneer',
  describe: 'Interact with your Payoneer account',
  builder: {},
  handler: async function (argv) {
    const scraper = new Scraper();

    if (!process.env.PAYONEER_USER || !process.env.PAYONEER_PASSWORD) {
      throw new Error('Credentials not found. Check your .env file');
    }

    await scraper.login({
      user: process.env.PAYONEER_USER,
      password: process.env.PAYONEER_PASSWORD,
    });

    const balance = await scraper.getBalance();
    const transactions = await scraper.getTransactions();

    console.log('Balance: ', balance);

    console.log('\nTransactions:\n');
    console.log(transactions.length ? table(transactions) : '- No transactions found -\n');

    await scraper.logout();
  }
};
