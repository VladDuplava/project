// tests/models/Rental.test.js — юніт-тести моделі Rental (через мок)

const Rental = require('../../models/Rental');

describe('Rental model (mock)', () => {
  beforeEach(() => Rental.__resetMocks());

  it('findAll повертає всі оренди', async () => {
    const result = await Rental.findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('findAll фільтрує за статусом active', async () => {
    const result = await Rental.findAll({ where: { status: 'active' } });
    result.forEach((r) => expect(r.status).toBe('active'));
  });

  it('findAll фільтрує за статусом returned', async () => {
    const result = await Rental.findAll({ where: { status: 'returned' } });
    result.forEach((r) => expect(r.status).toBe('returned'));
  });

  it('findByPk повертає оренду за існуючим ID', async () => {
    const rental = await Rental.findByPk(1);
    expect(rental).not.toBeNull();
    expect(rental.id).toBe(1);
    expect(rental.bookTitle).toBe('1984');
  });

  it('findByPk повертає null для неіснуючого ID', async () => {
    const rental = await Rental.findByPk(999);
    expect(rental).toBeNull();
  });

  it('findOne знаходить активну оренду за bookId', async () => {
    const rental = await Rental.findOne({ where: { bookId: 2, status: 'active' } });
    expect(rental).not.toBeNull();
    expect(rental.bookId).toBe(2);
    expect(rental.status).toBe('active');
  });

  it('findOne повертає null якщо не знайдено', async () => {
    const rental = await Rental.findOne({ where: { bookId: 999, status: 'active' } });
    expect(rental).toBeNull();
  });

  it('create створює новий запис оренди', async () => {
    const rental = await Rental.create({
      bookId: 3, bookTitle: 'Лісова пісня', bookAuthor: 'Леся Українка',
      bookYear: 1911, bookGenre: 'Драма', userName: 'Новий Орендар',
      rentedAt: new Date(), status: 'active',
    });
    expect(rental.bookId).toBe(3);
    expect(rental.userName).toBe('Новий Орендар');
    expect(rental.status).toBe('active');
    expect(rental).toHaveProperty('id');
  });

  it('update змінює поля оренди', async () => {
    const rental = await Rental.findByPk(1);
    const returnedAt = new Date();
    await rental.update({ returnedAt, daysRented: 3, status: 'returned' });
    expect(rental.status).toBe('returned');
    expect(rental.daysRented).toBe(3);
    expect(rental.returnedAt).toEqual(returnedAt);
  });

  it('кожен запис має обов\'язкові поля', async () => {
    const rentals = await Rental.findAll();
    rentals.forEach((r) => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('bookId');
      expect(r).toHaveProperty('bookTitle');
      expect(r).toHaveProperty('bookAuthor');
      expect(r).toHaveProperty('userName');
      expect(r).toHaveProperty('rentedAt');
      expect(r).toHaveProperty('status');
    });
  });
});
