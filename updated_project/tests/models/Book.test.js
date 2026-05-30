// tests/models/Book.test.js — перевизначення моделі Book (Sequelize schema)

describe('models/Book', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  /** Підвантажує модуль моделі та повертає замоканий sequelize з databaseModelTest */
  function loadBookModel() {

    require('../../models/Book');

    return require('../../config/database');
  }

  it('реєструє модель "Book" з таблицею books', () => {
    const { sequelize } = loadBookModel();
    expect(sequelize.define).toHaveBeenCalledTimes(1);
    const [name, attrs, opts] = sequelize.define.mock.calls[0];
    expect(name).toBe('Book');
    expect(opts.tableName).toBe('books');
    expect(opts.timestamps).toBe(true);
    expect(opts.underscored).toBe(true);
    expect(attrs).toBeDefined();
  });

  it('має обовʼязкові поля title та author з валідацією notEmpty', () => {
    const { sequelize } = loadBookModel();
    const [, attrs] = sequelize.define.mock.calls[0];
    expect(attrs.title.allowNull).toBe(false);
    expect(attrs.title.validate).toEqual(
      expect.objectContaining({ notEmpty: { msg: 'Назва книги не може бути порожньою' } }),
    );
    expect(attrs.author.allowNull).toBe(false);
    expect(attrs.author.validate).toEqual(
      expect.objectContaining({ notEmpty: { msg: 'Автор книги не може бути порожнім' } }),
    );
  });

  it('має коректні типи та значення за замовчуванням', () => {
    const { sequelize } = loadBookModel();
    const [, attrs] = sequelize.define.mock.calls[0];
    expect(attrs.id.type.key).toBe('INTEGER');
    expect(attrs.id.primaryKey).toBe(true);
    expect(attrs.id.autoIncrement).toBe(true);
    expect(attrs.year.allowNull).toBe(true);
    expect(attrs.genre.defaultValue).toBe('Невизначено');
    expect(attrs.available.defaultValue).toBe(true);
    expect(attrs.rentCount.defaultValue).toBe(0);
  });

  it('мапить camelCase на snake_case у БД для оренди та лічильника', () => {
    const { sequelize } = loadBookModel();
    const [, attrs] = sequelize.define.mock.calls[0];
    expect(attrs.rentedBy.field).toBe('rented_by');
    expect(attrs.rentedAt.field).toBe('rented_at');
    expect(attrs.rentCount.field).toBe('rent_count');
  });

  it('експортує результат sequelize.define', () => {

    const Book = require('../../models/Book');
    expect(Book).toMatchObject({
      modelName: 'Book',
      attributes: expect.any(Object),
      options: expect.any(Object),
    });
  });
});
