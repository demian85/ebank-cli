# Online banking CLI tool

This CLI is extensible and allows you to interact with online banking sites in general.
Check below for implemented services and examples.

## Usage
Google Chrome 59 is needed to use headless mode. You could download [Chrome Canary](https://www.google.com/chrome/browser/canary.html) and use it alongside your current Chrome stable version.

A global installation is preferred:
```
npm i -g
```

Now exec `ebank --help` for details on supported commands.

Create a `.env` file in the root folder (with proper permissions!) with the specific vars required for authentication. For example: `ebank bbva` would need the following vars:
```
BBVA_DNI=
BBVA_USER=
BBVA_PASSWORD=
```
Add specific credentials as needed by other commands.

## Implemented services
- BBVA
- Payoneer

You are welcome to submit a new online banking command utility.

## Nice to have features
- REPL. Would allow you to interact with your home banking session.
- Transfers
- Payments
- Download credit card extract
- ?

## For developers
See API docs: https://chromedevtools.github.io/devtools-protocol/
