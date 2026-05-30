// tests/stats.test.js — тести для /api/stats (захищені JWT)

const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const createApp  = require('./helpers/app');
const Book       = require('../models/Book');

const app        = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

// Допоміжна функція — генерує валідний токен для тестів
function makeToken(role = 'admin') {
  return jwt.sign({ id: 1, username: 'admin', role }, JWT_SECRET, { expiresIn: '1h' });
}

// ── GET /api/stats ────────────────────────────────────────────────────────────
describe('GET /api/stats', () => {
  beforeEach(() => Book.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });

  it('повертає статистику зі статусом 200 з валідним токеном', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalBooks');
    expect(res.body).toHaveProperty('availableBooks');
    expect(res.body).toHaveProperty('rentedBooks');
    expect(res.body).toHaveProperty('occupancyRate');
    expect(res.body).toHaveProperty('byGenre');
    expect(res.body).toHaveProperty('topRentedBooks');
    expect(res.body).toHaveProperty('activeRentals');
  });

  it('totalBooks = availableBooks + rentedBooks', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    const { totalBooks, availableBooks, rentedBooks } = res.body;
    expect(totalBooks).toBe(availableBooks + rentedBooks);
  });

  it('occupancyRate містить знак відсотку', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.body.occupancyRate).toMatch(/%$/);
  });

  it('byGenre — масив обʼєктів з полями genre/total/available/rented', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(Array.isArray(res.body.byGenre)).toBe(true);
    if (res.body.byGenre.length > 0) {
      const entry = res.body.byGenre[0];
      ['genre', 'total', 'available', 'rented'].forEach((f) => expect(entry).toHaveProperty(f));
    }
  });

  it('topRentedBooks — масив не більше 5 елементів', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(Array.isArray(res.body.topRentedBooks)).toBe(true);
    expect(res.body.topRentedBooks.length).toBeLessThanOrEqual(5);
  });

  it('activeRentals містить тільки орендовані книги з полем daysRented', async () => {
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(Array.isArray(res.body.activeRentals)).toBe(true);
    res.body.activeRentals.forEach((r) => {
      ['bookId', 'rentedBy', 'daysRented'].forEach((f) => expect(r).toHaveProperty(f));
    });
  });

  it('повертає нульову статистику для порожньої бібліотеки', async () => {
    Book.findAll.mockResolvedValueOnce([]);
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.totalBooks).toBe(0);
    expect(res.body.occupancyRate).toBe('0.00%');
    expect(res.body.byGenre).toEqual([]);
    expect(res.body.topRentedBooks).toEqual([]);
    expect(res.body.activeRentals).toEqual([]);
  });
});

// ── GET /api/stats/genres ─────────────────────────────────────────────────────
describe('GET /api/stats/genres', () => {
  beforeEach(() => Book.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).get('/api/stats/genres');
    expect(res.status).toBe(401);
  });

  it('повертає статистику по жанрах зі статусом 200', async () => {
    const res = await request(app)
      .get('/api/stats/genres')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('byGenre');
    expect(Array.isArray(res.body.byGenre)).toBe(true);
  });
});

// ── GET /api/stats/top ────────────────────────────────────────────────────────
describe('GET /api/stats/top', () => {
  beforeEach(() => Book.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).get('/api/stats/top');
    expect(res.status).toBe(401);
  });

  it('повертає топ книг зі статусом 200', async () => {
    const res = await request(app)
      .get('/api/stats/top')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('topBooks');
    expect(Array.isArray(res.body.topBooks)).toBe(true);
  });

  it('передає limit=5 у запит за замовчуванням', async () => {
    await request(app)
      .get('/api/stats/top')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(Book.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 }),
    );
  });

  it('приймає кастомний limit', async () => {
    await request(app)
      .get('/api/stats/top?limit=10')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(Book.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
    );
  });

  it('обмежує limit до максимуму 20', async () => {
    await request(app)
      .get('/api/stats/top?limit=100')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(Book.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
    );
  });
});
