// middleware/errorHandler.js — глобальний обробник помилок

function errorHandler(err, req, res, next) {
  console.error(`[Помилка] ${err.message}`);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join('; ') });
  }

  // Mongoose CastError (невірний ObjectId)
  if (err.name === 'CastError') {
    return res.status(404).json({ error: 'Невірний формат ID' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Запис з такими даними вже існує' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Внутрішня помилка сервера',
  });
}

module.exports = errorHandler;
