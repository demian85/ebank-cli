// See API docs: https://chromedevtools.github.io/devtools-protocol/

require('dotenv').config()

const { table } = require('table');
const Scraper = require('./src/scraper.js');

async function init() {
  const scraper = new Scraper();

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

  //await scraper.takeScreenshot();
  await scraper.logout();
}

init();
