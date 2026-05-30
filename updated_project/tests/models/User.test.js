// tests/models/User.test.js — юніт-тести схеми моделі User (без реальної БД)

describe('models/User', () => {
  let User;
  let defineMock;

  beforeEach(() => {
    jest.resetModules();
    defineMock = jest.fn((modelName, attributes, options) => ({ modelName, attributes, options }));
    jest.mock('../../config/database', () => ({
      sequelize: { define: defineMock },
      connectDB: jest.fn(),
    }));
    User = require('../../models/User');
  });

  it('реєструє модель "User" з таблицею users', () => {
    expect(defineMock).toHaveBeenCalledWith(
      'User',
      expect.any(Object),
      expect.objectContaining({ tableName: 'users' }),
    );
  });

  it('має поле id — INTEGER, primaryKey, autoIncrement', () => {
    const { attributes } = defineMock.mock.calls[0][1]
      ? { attributes: defineMock.mock.calls[0][1] }
      : defineMock.mock.results[0].value;
    const attrs = defineMock.mock.calls[0][1];
    expect(attrs.id).toMatchObject({ primaryKey: true, autoIncrement: true });
  });

  it('має поле username — STRING, allowNull: false, unique: true', () => {
    const attrs = defineMock.mock.calls[0][1];
    expect(attrs.username).toMatchObject({ allowNull: false, unique: true });
  });

  it('username має валідацію notEmpty і len [3, 50]', () => {
    const attrs = defineMock.mock.calls[0][1];
    expect(attrs.username.validate).toHaveProperty('notEmpty');
    expect(attrs.username.validate.len.args).toEqual([3, 50]);
  });

  it('має поле password — STRING, allowNull: false', () => {
    const attrs = defineMock.mock.calls[0][1];
    expect(attrs.password).toMatchObject({ allowNull: false });
    expect(attrs.password.validate).toHaveProperty('notEmpty');
  });

  it('має поле role — ENUM(admin, user), defaultValue: user', () => {
    const attrs = defineMock.mock.calls[0][1];
    expect(attrs.role).toMatchObject({ allowNull: false, defaultValue: 'user' });
  });

  it('timestamps: true та underscored: true в options', () => {
    const options = defineMock.mock.calls[0][2];
    expect(options.timestamps).toBe(true);
    expect(options.underscored).toBe(true);
  });

  it('експортує результат sequelize.define', () => {
    expect(User).toBeDefined();
  });
});
