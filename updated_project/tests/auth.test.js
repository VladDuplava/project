// tests/auth.test.js — інтеграційні тести для /api/auth

const request    = require('supertest');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const createApp  = require('./helpers/app');
const User       = require('../models/User');

const app        = createApp();
const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

// ── POST /api/auth/register ───────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => User.__resetMocks());

  it('реєструє нового користувача зі статусом 201 і повертає токен', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('username', 'newuser');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('токен можна верифікувати з правильним секретом', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'password123' });
    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded).toHaveProperty('username', 'newuser');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('id');
  });

  it('повертає 400 якщо відсутній username', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'password123' });
    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('повертає 400 якщо відсутній password', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'u' });
    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('повертає 400 якщо пароль коротше 6 символів', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'u', password: '123' });
    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('повертає 409 якщо username вже зайнятий', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'admin', password: 'password123' });
    expect(res.status).toBe(409);
    expect(User.create).not.toHaveBeenCalled();
  });

  it('за замовчуванням надає роль user', async () => {
    User.findOne.mockResolvedValueOnce(null);
    await request(app).post('/api/auth/register').send({ username: 'newuser', password: 'password123' });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'user' }));
  });

  it('дозволяє реєстрацію з роллю admin', async () => {
    User.findOne.mockResolvedValueOnce(null);
    await request(app).post('/api/auth/register').send({ username: 'newadmin', password: 'password123', role: 'admin' });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => User.__resetMocks());

  it('повертає токен при правильних даних', async () => {
    const hashed = await bcrypt.hash('correctpassword', 10);
    User.findOne.mockResolvedValueOnce({ id: 1, username: 'admin', password: hashed, role: 'admin' });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'correctpassword' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('role', 'admin');
  });

  it('токен містить id, username, role', async () => {
    const hashed = await bcrypt.hash('correctpassword', 10);
    User.findOne.mockResolvedValueOnce({ id: 1, username: 'admin', password: hashed, role: 'admin' });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'correctpassword' });
    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded).toHaveProperty('id', 1);
    expect(decoded).toHaveProperty('username', 'admin');
    expect(decoded).toHaveProperty('role', 'admin');
  });

  it('повертає 401 при невірному паролі', async () => {
    const hashed = await bcrypt.hash('correctpassword', 10);
    User.findOne.mockResolvedValueOnce({ id: 1, username: 'admin', password: hashed, role: 'admin' });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('повертає 401 якщо користувача не існує', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'pass123' });
    expect(res.status).toBe(401);
  });

  it('повертає 400 якщо відсутні поля', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('не повертає пароль у відповіді', async () => {
    const hashed = await bcrypt.hash('correctpassword', 10);
    User.findOne.mockResolvedValueOnce({ id: 1, username: 'admin', password: hashed, role: 'admin' });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'correctpassword' });
    expect(res.body.user).not.toHaveProperty('password');
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  beforeEach(() => User.__resetMocks());

  it('повертає 401 без токена', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('повертає 401 з невірним токеном', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('повертає 401 з прострочений токеном', async () => {
    const expired = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/прострочений/i);
  });

  it('повертає дані користувача з валідним токеном', async () => {
    const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  it('повертає 404 якщо юзер з токена не існує в БД', async () => {
    User.findByPk.mockResolvedValueOnce(null);
    const token = jwt.sign({ id: 999, username: 'ghost', role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
