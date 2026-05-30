// tests/__mocks__/Rental.js — мок Sequelize моделі Rental

const mockRentals = [
  {
    id: 1,
    bookId: 2,
    bookTitle: '1984',
    bookAuthor: 'Джордж Орвелл',
    bookYear: 1949,
    bookGenre: 'Антиутопія',
    userName: 'Іван Франко',
    rentedAt: new Date('2026-04-20T10:00:00Z'),
    returnedAt: null,
    daysRented: null,
    status: 'active',
    createdAt: new Date('2026-04-20T10:00:00Z'),
    updatedAt: new Date('2026-04-20T10:00:00Z'),
  },
  {
    id: 2,
    bookId: 1,
    bookTitle: 'Кобзар',
    bookAuthor: 'Тарас Шевченко',
    bookYear: 1840,
    bookGenre: 'Поезія',
    userName: 'Леся Українка',
    rentedAt: new Date('2026-03-01T09:00:00Z'),
    returnedAt: new Date('2026-03-05T09:00:00Z'),
    daysRented: 4,
    status: 'returned',
    createdAt: new Date('2026-03-01T09:00:00Z'),
    updatedAt: new Date('2026-03-05T09:00:00Z'),
  },
];

function makeRentalInstance(data) {
  return {
    ...data,
    update: jest.fn(function (fields) {
      Object.assign(this, fields);
      return Promise.resolve(this);
    }),
    destroy: jest.fn().mockResolvedValue(1),
  };
}

const Rental = {
  findAll: jest.fn(({ where } = {}) => {
    let result = mockRentals.map(makeRentalInstance);
    if (where) {
      if (where.status)    result = result.filter((r) => r.status === where.status);
      if (where.userName)  result = result.filter((r) => r.userName === where.userName);
    }
    return Promise.resolve(result);
  }),

  findByPk: jest.fn((id) => {
    const rental = mockRentals.find((r) => r.id === Number(id));
    return Promise.resolve(rental ? makeRentalInstance(rental) : null);
  }),

  findOne: jest.fn(({ where } = {}) => {
    const rental = mockRentals.find((r) => {
      if (where.bookId && r.bookId !== where.bookId) return false;
      if (where.status && r.status !== where.status) return false;
      return true;
    });
    return Promise.resolve(rental ? makeRentalInstance(rental) : null);
  }),

  create: jest.fn((data) => {
    const rental = makeRentalInstance({
      id: 99,
      bookId:     data.bookId,
      bookTitle:  data.bookTitle,
      bookAuthor: data.bookAuthor,
      bookYear:   data.bookYear   || null,
      bookGenre:  data.bookGenre  || null,
      userName:   data.userName,
      rentedAt:   data.rentedAt   || new Date(),
      returnedAt: null,
      daysRented: null,
      status:     'active',
      createdAt:  new Date(),
      updatedAt:  new Date(),
    });
    return Promise.resolve(rental);
  }),

  count: jest.fn().mockResolvedValue(2),
};

Rental.__resetMocks = () => {
  Rental.findAll.mockClear();
  Rental.findByPk.mockClear();
  Rental.findOne.mockClear();
  Rental.create.mockClear();
  Rental.count.mockClear();
};

module.exports = Rental;
