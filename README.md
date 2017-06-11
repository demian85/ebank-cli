# Extensible online banking CLI tool

This CLI is extensible and allows you to interact with online banking sites in general.
Check below for implemented services and examples.

## Requirements
- node >= 7.10
- Google Chrome 59 is needed to use headless mode. You can also download [Chrome Canary](https://www.google.com/chrome/browser/canary.html) and use it alongside your current Chrome stable version.

## Usage
A global installation is preferred:
```
npm i -g
```

Now exec `ebank --help` for details on supported commands.

Create a `.env` file in your home folder (with proper permissions!) with the specific vars required for authentication. For example: `ebank bbva` would need the following vars:
```
BBVA_DNI=
BBVA_USER=
BBVA_PASSWORD=
```
Add specific credentials as needed by other commands.

## Implemented services
- [BBVA](https://www.bbvafrances.com.ar/)
- [Payoneer](https://www.payoneer.com)

You are welcome to submit a new online banking command utility :)

## Nice to have features
- Use OS password manager to securely store credentials.
- REPL. Would allow you to interact with your home banking session.
- Transfers
- Payments
- Download credit card extract
- Visa Home

## For developers
See API docs: https://chromedevtools.github.io/devtools-protocol/
