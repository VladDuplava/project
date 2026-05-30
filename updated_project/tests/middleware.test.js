// tests/middleware.test.js

const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const createApp  = require('./helpers/app');
const errorHandler = require('../middleware/errorHandler');

const app        = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

// ── authenticate ──────────────────────────────────────────────────────────────
describe('authenticate middleware', () => {
  it('повертає 401 якщо заголовок Authorization відсутній', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/токен відсутній/i);
  });

  it('повертає 401 якщо формат не Bearer', async () => {
    const res = await request(app).get('/api/stats').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/токен відсутній/i);
  });

  it('повертає 401 якщо токен невірний', async () => {
    const res = await request(app).get('/api/stats').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/невірний токен/i);
  });

  it('повертає 401 якщо токен прострочений', async () => {
    const expired = jwt.sign({ id: 1, role: 'user' }, JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/прострочений/i);
  });

  it('пропускає запит з валідним токеном', async () => {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });

  it('встановлює req.user — /api/auth/me не повертає 401', async () => {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
  });
});

// ── requireAdmin ──────────────────────────────────────────────────────────────
describe('requireAdmin middleware', () => {
  it('повертає 403 якщо роль user', async () => {
    const token = jwt.sign({ id: 2, username: 'user1', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).delete('/api/books/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/адміністратора/i);
  });

  it('повертає 403 якщо немає поля role в токені', async () => {
    const token = jwt.sign({ id: 2, username: 'user1' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).delete('/api/books/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('пропускає admin', async () => {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).delete('/api/books/1').set('Authorization', `Bearer ${token}`);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

// ── errorHandler — юніт-тест напряму ─────────────────────────────────────────
describe('errorHandler middleware (unit)', () => {
  let req, res, next;

  beforeEach(() => {
    req  = {};
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => console.error.mockRestore());

  it('повертає 400 для ValidationError', () => {
    const err = { name: 'ValidationError', message: 'val err', errors: { field: { message: 'поле обовʼязкове' } } };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'поле обовʼязкове' });
  });

  it('повертає 404 для CastError', () => {
    const err = { name: 'CastError', message: 'cast err' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Невірний формат ID' });
  });

  it('повертає 409 для duplicate key (code 11000)', () => {
    const err = { code: 11000, message: 'dup' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Запис з такими даними вже існує' });
  });

  it('повертає 500 для невідомої помилки', () => {
    const err = new Error('щось пішло не так');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'щось пішло не так' });
  });

  it('використовує err.status якщо передано', () => {
    const err = { status: 422, message: 'unprocessable' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('повертає дефолтне повідомлення якщо err.message відсутнє', () => {
    const err = { status: 500 };
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith({ error: 'Внутрішня помилка сервера' });
  });
});

// ── errorHandler — інтеграційний ──────────────────────────────────────────────
describe('errorHandler middleware (integration)', () => {
  it('повертає 404 для невідомого маршруту', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('404 відповідь має json content-type', async () => {
    const res = await request(app).get('/api/totally-unknown');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
