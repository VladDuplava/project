// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

const JWT_SECRET  = process.env.JWT_SECRET  || 'library_secret_key';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Поля "username" та "password" є обов\'язковими' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль має бути не менше 6 символів' });
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: `Користувач "${username}" вже існує` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES },
    );

    return res.status(201).json({
      message: `Користувача "${user.username}" успішно зареєстровано`,
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Поля "username" та "password" є обов\'язковими' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Невірний логін або пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Невірний логін або пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES },
    );

    return res.json({
      message: 'Успішний вхід',
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me — поточний користувач (з токена)
async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'createdAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    return res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
