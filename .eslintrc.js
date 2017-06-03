module.exports = {
  "extends": "eslint:recommended",
  "parserOptions": {
    ecmaVersion: 8,
  },
  "env": {
    node: true,
    browser: true,
  },
  "rules": {
    "no-use-before-define": 0,
    "func-names": 0,
    "no-console": 0,
    "comma-dangle": 0,
    "no-underscore-dangle": 0,
    "consistent-return": 0,
    "no-cond-assign": 0,
    "no-plusplus": 0,
    "max-len": ["error", 140],
    "newline-per-chained-call": 0,
    "spaced-comment": 0,
    "no-shadow": [
      "error",
      { "builtinGlobals": false, "hoist": "functions", "allow": ["err", "cb", "callback"] }
    ],
    "arrow-body-style": 0,
  },
};
