// middleware/logger.js — логування запитів

function logger(req, res, next) {
  const now = new Date().toLocaleTimeString('uk-UA');
  console.log(`[${now}] ${req.method} ${req.url}`);
  next();
}

module.exports = logger;
