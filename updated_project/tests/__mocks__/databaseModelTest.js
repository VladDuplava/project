// tests/__mocks__/databaseModelTest.js — Sequelize define для перевірки схеми моделі (без реальної БД)

const define = jest.fn((modelName, attributes, options) => ({
  modelName,
  attributes,
  options,
}));

module.exports = {
  sequelize: { define },
  connectDB: jest.fn(),
};
