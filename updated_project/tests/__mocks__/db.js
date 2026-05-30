// tests/__mocks__/db.js
module.exports = {
  connectDB: jest.fn().mockResolvedValue(undefined),
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(undefined),
    sync:         jest.fn().mockResolvedValue(undefined),
    define:       jest.fn(),
  },
};
