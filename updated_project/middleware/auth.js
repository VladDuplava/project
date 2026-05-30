// middleware/auth.js — JWT верифікація та перевірка ролей

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

// Перевіряє токен — захищає маршрут
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен відсутній. Авторизуйтесь для доступу' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен прострочений. Увійдіть знову' });
    }
    return res.status(401).json({ error: 'Невірний токен' });
  }
}

// Перевіряє що користувач має роль admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ заборонено. Потрібні права адміністратора' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
