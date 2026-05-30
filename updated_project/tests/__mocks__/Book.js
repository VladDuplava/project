// tests/__mocks__/Book.js — мок Sequelize моделі Book

const mockBooks = [
  {
    id: 1,
    title: 'Кобзар',
    author: 'Тарас Шевченко',
    year: 1840,
    genre: 'Поезія',
    available: true,
    rentedBy: null,
    rentedAt: null,
    rentCount: 2,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 2,
    title: '1984',
    author: 'Джордж Орвелл',
    year: 1949,
    genre: 'Антиутопія',
    available: false,
    rentedBy: 'Іван Франко',
    rentedAt: new Date('2026-04-20'),
    rentCount: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-04-20'),
  },
  {
    id: 3,
    title: 'Лісова пісня',
    author: 'Леся Українка',
    year: 1911,
    genre: 'Драма',
    available: true,
    rentedBy: null,
    rentedAt: null,
    rentCount: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
];

// Фабрика — повертає свіжу копію книги з методами update/destroy
function makeBookInstance(data) {
  return {
    ...data,
    update: jest.fn(function (fields) {
      Object.assign(this, fields);
      return Promise.resolve(this);
    }),
    destroy: jest.fn().mockResolvedValue(1),
  };
}

const Book = {
  // --- query methods ---
  findAll: jest.fn(({ where } = {}) => {
    let result = mockBooks.map(makeBookInstance);
    if (where) {
      if (where.available !== undefined) {
        result = result.filter((b) => b.available === where.available);
      }
      if (where.genre) result = result.filter((b) => b.genre === where.genre);
    }
    return Promise.resolve(result);
  }),

  findByPk: jest.fn((id) => {
    const book = mockBooks.find((b) => b.id === Number(id));
    return Promise.resolve(book ? makeBookInstance(book) : null);
  }),

  create: jest.fn((data) => {
    const book = makeBookInstance({
      id: 99,
      title: data.title,
      author: data.author,
      year: data.year || null,
      genre: data.genre || 'Невизначено',
      available: true,
      rentedBy: null,
      rentedAt: null,
      rentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return Promise.resolve(book);
  }),

  count: jest.fn().mockResolvedValue(3),

  // --- aggregate (stats/genres) ---
  findAll_aggregate: jest.fn(),
};

// Дозволяємо тестам скидати стан моку
Book.__resetMocks = () => {
  Book.findAll.mockClear();
  Book.findByPk.mockClear();
  Book.create.mockClear();
  Book.count.mockClear();
};

module.exports = Book;
