// app.js — Express-додаток (без прослуховування порту)

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpecs = require('./swagger/config');

const logger        = require('./middleware/logger');
const errorHandler  = require('./middleware/errorHandler');
const authRouter    = require('./routes/auth');
const booksRouter   = require('./routes/books');
const rentalsRouter = require('./routes/rentals');
const statsRouter   = require('./routes/stats');

function buildApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(logger);
  app.use(express.static(path.join(__dirname, 'public'), { index: false }));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customSiteTitle: '📚 Library API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; } .swagger-ui .topbar .download-url-wrapper { display: none; }',
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
  });

  app.use('/api/auth',    authRouter);
  app.use('/api/books',   booksRouter);
  app.use('/api/rentals', rentalsRouter);
  app.use('/api/stats',   statsRouter);

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((req, res) => {
    res.status(404).json({ error: `Маршрут "${req.url}" не знайдено` });
  });

  app.use(errorHandler);

  return app;
}

module.exports = buildApp;
