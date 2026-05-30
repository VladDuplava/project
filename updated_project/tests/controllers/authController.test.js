// tests/controllers/authController.test.js — юніт-тести authController

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const authController = require('../../controllers/authController');
const User = require('../../models/User');

describe('authController', () => {
  let req, res, next;

  beforeEach(() => {
    User.__resetMocks();
    req  = { body: {}, params: {}, user: null };
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  // ── register ───────────────────────────────────────────────────────────────
  describe('register', () => {
    it('створює користувача і повертає токен зі статусом 201', async () => {
      User.findOne.mockResolvedValueOnce(null);
      req.body = { username: 'newuser', password: 'password123' };
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: expect.any(String), user: expect.any(Object) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('повертає 400 без username', async () => {
      req.body = { password: 'password123' };
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.create).not.toHaveBeenCalled();
    });

    it('повертає 400 без password', async () => {
      req.body = { username: 'u' };
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('повертає 400 якщо пароль < 6 символів', async () => {
      req.body = { username: 'user', password: '123' };
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.create).not.toHaveBeenCalled();
    });

    it('повертає 409 якщо username зайнятий', async () => {
      req.body = { username: 'admin', password: 'password123' };
      // findOne повертає існуючого (за замовч. мок повертає admin)
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(User.create).not.toHaveBeenCalled();
    });

    it('хешує пароль перед збереженням', async () => {
      User.findOne.mockResolvedValueOnce(null);
      req.body = { username: 'newuser', password: 'plaintext' };
      await authController.register(req, res, next);
      const createCall = User.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('plaintext');
      expect(createCall.password).toMatch(/^\$2[ab]\$/);
    });

    it('передає помилку в next', async () => {
      User.findOne.mockRejectedValueOnce(new Error('db error'));
      req.body = { username: 'u', password: 'password123' };
      await authController.register(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('повертає токен при правильних даних', async () => {
      const hashed = await bcrypt.hash('correctpass', 10);
      User.findOne.mockResolvedValueOnce({ id: 1, username: 'admin', password: hashed, role: 'admin' });
      req.body = { username: 'admin', password: 'correctpass' };
      await authController.login(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: expect.any(String) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('повертає 401 при невірному паролі', async () => {
      const hashed = await bcrypt.hash('correctpass', 10);
      User.findOne.mockResolvedValueOnce({ id: 1, username: 'admin', password: hashed, role: 'admin' });
      req.body = { username: 'admin', password: 'wrongpass' };
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('повертає 401 якщо користувача немає', async () => {
      User.findOne.mockResolvedValueOnce(null);
      req.body = { username: 'nobody', password: 'pass123' };
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('повертає 400 без полів', async () => {
      req.body = {};
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('передає помилку в next', async () => {
      User.findOne.mockRejectedValueOnce(new Error('db error'));
      req.body = { username: 'u', password: 'pass123' };
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  // ── me ─────────────────────────────────────────────────────────────────────
  describe('me', () => {
    it('повертає профіль користувача', async () => {
      req.user = { id: 1 };
      await authController.me(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
      expect(next).not.toHaveBeenCalled();
    });

    it('повертає 404 якщо користувача не знайдено', async () => {
      User.findByPk.mockResolvedValueOnce(null);
      req.user = { id: 999 };
      await authController.me(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('передає помилку в next', async () => {
      User.findByPk.mockRejectedValueOnce(new Error('db error'));
      req.user = { id: 1 };
      await authController.me(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
