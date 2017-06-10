#!/usr/bin/env node

require('dotenv').config();

require('yargs')
  .command(require('./src/commands/bbva'))
  .command(require('./src/commands/payoneer'))
  .demandCommand()
  .help()
  .argv;
