// controllers/rentalsController.js

const Book   = require('../models/Book');
const Rental = require('../models/Rental');

// GET /api/rentals — активні оренди (публічний)
async function listRentals(req, res, next) {
  try {
    const rented = await Book.findAll({ where: { available: false } });

    res.json({
      total: rented.length,
      rentals: rented.map((b) => ({
        bookId:   b.id,
        title:    b.title,
        author:   b.author,
        rentedBy: b.rentedBy,
        rentedAt: b.rentedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/rentals/history
// admin — бачить всі оренди (з фільтрами status/userName)
// user  — бачить тільки свої оренди (за req.user.username)
async function listHistory(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.role === 'admin') {
      // Адмін може фільтрувати за будь-яким userName
      if (req.query.userName) where.userName = req.query.userName;
    } else {
      // Звичайний user бачить тільки свої оренди
      where.userName = req.user.username;
    }

    if (status) where.status = status;

    const history = await Rental.findAll({
      where,
      order: [['rentedAt', 'DESC']],
    });

    res.json({
      total: history.length,
      history,
      // Показуємо user що фільтр застосовано
      ...(req.user.role !== 'admin' && { filteredBy: req.user.username }),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/rentals/history/:id
// admin — будь-який запис
// user  — тільки свій (перевіряємо userName)
async function getRentalById(req, res, next) {
  try {
    const rental = await Rental.findByPk(req.params.id);

    if (!rental) {
      return res.status(404).json({ error: 'Оренду не знайдено' });
    }

    // User може бачити тільки свою оренду
    if (req.user.role !== 'admin' && rental.userName !== req.user.username) {
      return res.status(403).json({ error: 'Доступ заборонено. Це не ваша оренда' });
    }

    res.json(rental);
  } catch (err) {
    next(err);
  }
}

// POST /api/rentals/rent — орендувати книгу
async function rentBook(req, res, next) {
  try {
    const { bookId, userName } = req.body;

    if (!bookId || !userName) {
      return res.status(400).json({ error: 'Необхідно вказати "bookId" та "userName"' });
    }

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Книгу не знайдено' });
    }

    if (!book.available) {
      return res.status(409).json({
        error: `Книга вже орендована користувачем "${book.rentedBy}"`,
      });
    }

    const now = new Date();

    await book.update({
      available: false,
      rentedBy:  userName,
      rentedAt:  now,
      rentCount: book.rentCount + 1,
    });

    const rental = await Rental.create({
      bookId:     book.id,
      bookTitle:  book.title,
      bookAuthor: book.author,
      bookYear:   book.year,
      bookGenre:  book.genre,
      userName,
      rentedAt:   now,
      status:     'active',
    });

    res.json({
      message: `Книгу "${book.title}" успішно орендовано`,
      book,
      rental,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/rentals/return — повернути книгу
async function returnBook(req, res, next) {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'Необхідно вказати "bookId"' });
    }

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Книгу не знайдено' });
    }

    if (book.available) {
      return res.status(409).json({ error: 'Ця книга не є орендованою — її не можна повернути' });
    }

    // User може повернути тільки свою книгу
    if (req.user.role !== 'admin' && book.rentedBy !== req.user.username) {
      return res.status(403).json({ error: 'Доступ заборонено. Ви не орендували цю книгу' });
    }

    const previousRenter = book.rentedBy;
    const returnedAt     = new Date();

    const rental = await Rental.findOne({
      where: { bookId, status: 'active' },
      order: [['rentedAt', 'DESC']],
    });

    if (rental) {
      const daysRented = Math.ceil(
        (returnedAt - new Date(rental.rentedAt)) / (1000 * 60 * 60 * 24),
      );
      await rental.update({ returnedAt, daysRented: daysRented || 1, status: 'returned' });
    }

    await book.update({ available: true, rentedBy: null, rentedAt: null });

    res.json({
      message: `Книгу "${book.title}" повернено від "${previousRenter}"`,
      book,
      rental: rental || null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRentals, listHistory, getRentalById, rentBook, returnBook };
