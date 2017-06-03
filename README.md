# BBVA CLI tool

This script connects to your BBVA Home Banking and extracts information about your products.
It currently supports parsing accounts and cards details found in your dashboard.

## Usage
Google Chrome 59 is needed to use headless mode. You could download [Chrome Canary](https://www.google.com/chrome/browser/canary.html) and use it alongside your current Chrome stable version.
```
npm i
```
Create a `.env` file with the following vars:
```
BBVA_DNI=
BBVA_USER=
BBVA_PASSWORD=
```
## Nice to have features
- REPL. Would allow you to interact with your home banking session.
- Transfers
- Payments
- Download credit card extract
- ?
