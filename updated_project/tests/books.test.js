// tests/books.test.js

const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const createApp  = require('./helpers/app');
const Book       = require('../models/Book');

const app        = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

function makeToken(role = 'user', username = 'user1') {
  return jwt.sign({ id: role === 'admin' ? 1 : 2, username, role }, JWT_SECRET, { expiresIn: '1h' });
}
const adminToken = () => makeToken('admin', 'admin');
const userToken  = () => makeToken('user',  'user1');

// ── GET /api/books — публічний ─────────────────────────────────────────────
describe('GET /api/books', () => {
  beforeEach(() => Book.__resetMocks());

  it('публічний — повертає 200 без токена', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
  });

  it('передає фільтр available=true', async () => {
    await request(app).get('/api/books?available=true');
    expect(Book.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ available: true }) }),
    );
  });

  it('повертає порожній список', async () => {
    Book.findAll.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/books');
    expect(res.body.total).toBe(0);
  });
});

// ── GET /api/books/:id — публічний ────────────────────────────────────────
describe('GET /api/books/:id', () => {
  beforeEach(() => Book.__resetMocks());

  it('публічний — повертає 200 без токена', async () => {
    const res = await request(app).get('/api/books/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('повертає 404 для неіснуючого ID', async () => {
    Book.findByPk.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/books/999');
    expect(res.status).toBe(404);
  });
});

// ── POST /api/books — тільки admin ────────────────────────────────────────
describe('POST /api/books', () => {
  beforeEach(() => Book.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).post('/api/books').send({ title: 'X', author: 'Y' });
    expect(res.status).toBe(401);
    expect(Book.create).not.toHaveBeenCalled();
  });

  it('повертає 403 якщо роль user', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: 'X', author: 'Y' });
    expect(res.status).toBe(403);
    expect(Book.create).not.toHaveBeenCalled();
  });

  it('admin може додати книгу (201)', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Нова книга', author: 'Автор', year: 2024, genre: 'Роман' });
    expect(res.status).toBe(201);
    expect(res.body.book).toHaveProperty('title', 'Нова книга');
  });

  it('admin: 400 якщо відсутній title', async () => {
    const res = await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ author: 'Автор' });
    expect(res.status).toBe(400);
    expect(Book.create).not.toHaveBeenCalled();
  });

  it('admin: встановлює жанр "Невизначено" якщо genre не передано', async () => {
    await request(app)
      .post('/api/books')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Книга', author: 'Автор' });
    expect(Book.create).toHaveBeenCalledWith(
      expect.objectContaining({ genre: 'Невизначено' }),
    );
  });
});

// ── PUT /api/books/:id — тільки admin ────────────────────────────────────
describe('PUT /api/books/:id', () => {
  beforeEach(() => Book.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).put('/api/books/1').send({ title: 'X' });
    expect(res.status).toBe(401);
  });

  it('повертає 403 якщо роль user', async () => {
    const res = await request(app)
      .put('/api/books/1')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ title: 'X' });
    expect(res.status).toBe(403);
  });

  it('admin оновлює книгу (200)', async () => {
    const res = await request(app)
      .put('/api/books/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'Кобзар (нове видання)', year: 2024 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Книгу успішно оновлено');
  });

  it('admin: 404 для неіснуючого ID', async () => {
    Book.findByPk.mockResolvedValueOnce(null);
    const res = await request(app)
      .put('/api/books/999')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('admin: 400 якщо body порожнє', async () => {
    const res = await request(app)
      .put('/api/books/1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/books/:id — тільки admin ─────────────────────────────────
describe('DELETE /api/books/:id', () => {
  beforeEach(() => Book.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).delete('/api/books/1');
    expect(res.status).toBe(401);
  });

  it('повертає 403 якщо роль user', async () => {
    const res = await request(app)
      .delete('/api/books/1')
      .set('Authorization', `Bearer ${userToken()}`);
    expect(res.status).toBe(403);
    expect(Book.findByPk).not.toHaveBeenCalled();
  });

  it('admin видаляє книгу (200)', async () => {
    const res = await request(app)
      .delete('/api/books/1')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('admin: 404 якщо книги немає', async () => {
    Book.findByPk.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/books/999')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(404);
  });

  it('admin: 409 при спробі видалити орендовану книгу', async () => {
    const res = await request(app)
      .delete('/api/books/2')
      .set('Authorization', `Bearer ${adminToken()}`);
    expect(res.status).toBe(409);
  });
});
