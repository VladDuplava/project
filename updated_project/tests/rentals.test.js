// tests/rentals.test.js

const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const createApp  = require('./helpers/app');
const Book       = require('../models/Book');
const Rental     = require('../models/Rental');

const app        = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

function adminToken() {
  return jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}
function userToken(username = 'user1') {
  return jwt.sign({ id: 2, username, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
}

// ── GET /api/rentals — публічний ──────────────────────────────────────────────
describe('GET /api/rentals', () => {
  beforeEach(() => { Book.__resetMocks(); Rental.__resetMocks(); });

  it('публічний — повертає 200 без токена', async () => {
    const res = await request(app).get('/api/rentals');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.rentals)).toBe(true);
  });

  it('повертає порожній список якщо немає активних оренд', async () => {
    Book.findAll.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/rentals');
    expect(res.body.total).toBe(0);
    expect(res.body.rentals).toEqual([]);
  });
});

// ── GET /api/rentals/history ──────────────────────────────────────────────────
describe('GET /api/rentals/history', () => {
  beforeEach(() => { Book.__resetMocks(); Rental.__resetMocks(); });

  it('повертає 401 без токена', async () => {
    const res = await request(app).get('/api/rentals/history');
    expect(res.status).toBe(401);
  });

  it('admin бачить всю історію', async () => {
    const res = await request(app)
      .get('/api/rentals/history')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.history)).toBe(true);
    // admin не отримує filteredBy
    expect(res.body).not.toHaveProperty('filteredBy');
  });

  it('admin може фільтрувати за userName', async () => {
    await request(app)
      .get('/api/rentals/history?userName=Іван Франко')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(Rental.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userName: 'Іван Франко' }) }),
    );
  });

  it('user бачить тільки свої оренди — Rental.findAll отримує where.userName = username', async () => {
    await request(app)
      .get('/api/rentals/history')
      .set('Authorization', `Bearer ${userToken('user1')}`);
    expect(Rental.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userName: 'user1' }) }),
    );
  });

  it('user отримує filteredBy у відповіді', async () => {
    const res = await request(app)
      .get('/api/rentals/history')
      .set('Authorization', `Bearer ${userToken('user1')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('filteredBy', 'user1');
  });

  it('user не може передати userName іншого користувача — ігнорується', async () => {
    await request(app)
      .get('/api/rentals/history?userName=admin')
      .set('Authorization', `Bearer ${userToken('user1')}`);
    // Незважаючи на query param, where.userName має бути 'user1'
    expect(Rental.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userName: 'user1' }) }),
    );
  });

  it('фільтр за status працює для обох ролей', async () => {
    const res = await request(app)
      .get('/api/rentals/history?status=returned')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(200);
    res.body.history.forEach((r) => expect(r.status).toBe('returned'));
  });
});

// ── GET /api/rentals/history/:id ──────────────────────────────────────────────
describe('GET /api/rentals/history/:id', () => {
  beforeEach(() => { Book.__resetMocks(); Rental.__resetMocks(); });

  it('повертає 401 без токена', async () => {
    const res = await request(app).get('/api/rentals/history/1');
    expect(res.status).toBe(401);
  });

  it('admin бачить будь-яку оренду', async () => {
    const res = await request(app)
      .get('/api/rentals/history/1')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('user бачить свою оренду (userName співпадає)', async () => {
    // Мок повертає rental з userName: 'Іван Франко' (id=1)
    // userToken з username 'Іван Франко'
    const res = await request(app)
      .get('/api/rentals/history/1')
      .set('Authorization', `Bearer ${userToken('Іван Франко')}`);
    expect(res.status).toBe(200);
  });

  it('user отримує 403 при спробі переглянути чужу оренду', async () => {
    // rental id=1 має userName: 'Іван Франко', але токен user1
    const res = await request(app)
      .get('/api/rentals/history/1')
      .set('Authorization', `Bearer ${userToken('user1')}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/не ваша оренда/i);
  });

  it('повертає 404 для неіснуючого ID', async () => {
    Rental.findByPk.mockResolvedValueOnce(null);
    const res = await request(app)
      .get('/api/rentals/history/999')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(404);
  });
});

// ── POST /api/rentals/rent ────────────────────────────────────────────────────
describe('POST /api/rentals/rent', () => {
  beforeEach(() => { Book.__resetMocks(); Rental.__resetMocks(); });

  it('повертає 401 без токена', async () => {
    const res = await request(app).post('/api/rentals/rent').send({ bookId: 1, userName: 'X' });
    expect(res.status).toBe(401);
  });

  it('user успішно орендує книгу', async () => {
    const res = await request(app)
      .post('/api/rentals/rent')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookId: 1, userName: 'user1' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('успішно орендовано');
    expect(res.body).toHaveProperty('rental');
  });

  it('admin може орендувати книгу', async () => {
    const res = await request(app)
      .post('/api/rentals/rent')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ bookId: 1, userName: 'admin' });
    expect(res.status).toBe(200);
  });

  it('повертає 400 якщо bookId відсутній', async () => {
    const res = await request(app)
      .post('/api/rentals/rent')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ userName: 'user1' });
    expect(res.status).toBe(400);
  });

  it('повертає 409 якщо книга вже орендована', async () => {
    const res = await request(app)
      .post('/api/rentals/rent')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ bookId: 2, userName: 'user1' });
    expect(res.status).toBe(409);
  });
});

// ── POST /api/rentals/return ──────────────────────────────────────────────────
describe('POST /api/rentals/return', () => {
  beforeEach(() => { Book.__resetMocks(); Rental.__resetMocks(); });

  it('повертає 401 без токена', async () => {
    const res = await request(app).post('/api/rentals/return').send({ bookId: 2 });
    expect(res.status).toBe(401);
  });

  it('admin може повернути будь-яку книгу', async () => {
    const res = await request(app)
      .post('/api/rentals/return')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ bookId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('повернено');
  });

  it('user повертає свою книгу — rentedBy співпадає з username', async () => {
    // book id=2 має rentedBy: 'Іван Франко' (з мока)
    const res = await request(app)
      .post('/api/rentals/return')
      .set('Authorization', `Bearer ${userToken('Іван Франко')}`)
      .send({ bookId: 2 });
    expect(res.status).toBe(200);
  });

  it('user отримує 403 при спробі повернути чужу книгу', async () => {
    // book id=2 rentedBy='Іван Франко', але токен user1
    const res = await request(app)
      .post('/api/rentals/return')
      .set('Authorization', `Bearer ${userToken('user1')}`)
      .send({ bookId: 2 });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/не орендували/i);
  });

  it('повертає 400 якщо bookId відсутній', async () => {
    const res = await request(app)
      .post('/api/rentals/return')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('повертає 409 якщо книга не орендована', async () => {
    const res = await request(app)
      .post('/api/rentals/return')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ bookId: 1 }); // book id=1 available=true
    expect(res.status).toBe(409);
  });
});
