// tests/helpers/app.js — тестовий додаток (мок БД через Jest)

const buildApp = require('../../app');

function createApp() {
  return buildApp();
}

module.exports = createApp;
