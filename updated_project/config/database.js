// config/database.js — підключення до MySQL через Sequelize

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'library_rental',
  process.env.DB_USER     || 'root',
  process.env.DB_PASSWORD || '15072007Vlad',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log(
      '✅  MySQL підключено:',
      `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'library_rental'}`,
    );

    await sequelize.sync({ alter: true });
    console.log('✅  Таблиці синхронізовано');
  } catch (err) {
    console.error('❌  Помилка підключення до MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
