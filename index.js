#!/usr/bin/env node

require('dotenv').config({
  path: require('path').join(require('os').homedir(), '.env')
});

require('yargs')
  .command(require('./src/commands/bbva'))
  .command(require('./src/commands/payoneer'))
  .demandCommand()
  .help()
  .argv;
