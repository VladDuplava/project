// controllers/booksController.js

const { Op } = require('sequelize');
const Book = require('../models/Book');

async function listBooks(req, res, next) {
  try {
    const { available, genre } = req.query;
    const where = {};

    if (available !== undefined) {
      where.available = available === 'true';
    }

    if (genre) {
      where.genre = { [Op.like]: genre };
    }

    const books = await Book.findAll({ where, order: [['createdAt', 'DESC']] });

    res.json({ total: books.length, books });
  } catch (err) {
    next(err);
  }
}

async function getBookById(req, res, next) {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Книгу не знайдено' });
    }

    res.json(book);
  } catch (err) {
    next(err);
  }
}

async function createBook(req, res, next) {
  try {
    const { title, author, year, genre } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Поля "title" та "author" є обов\'язковими' });
    }

    const book = await Book.create({
      title,
      author,
      year: year || null,
      genre: genre || 'Невизначено',
    });

    res.status(201).json({ message: 'Книгу успішно додано', book });
  } catch (err) {
    next(err);
  }
}

// PUT /api/books/:id — редагувати книгу (виправити помилку при додаванні)
async function updateBook(req, res, next) {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Книгу не знайдено' });
    }

    const { title, author, year, genre } = req.body;

    // Оновлюємо тільки ті поля, що передані в запиті
    const updatedFields = {};
    if (title  !== undefined) updatedFields.title  = title;
    if (author !== undefined) updatedFields.author = author;
    if (year   !== undefined) updatedFields.year   = year;
    if (genre  !== undefined) updatedFields.genre  = genre;

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'Не передано жодного поля для оновлення' });
    }

    await book.update(updatedFields);

    res.json({ message: 'Книгу успішно оновлено', book });
  } catch (err) {
    next(err);
  }
}

async function deleteBook(req, res, next) {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: 'Книгу не знайдено' });
    }

    if (!book.available) {
      return res.status(409).json({
        error: `Не можна видалити книгу — вона орендована "${book.rentedBy}"`,
      });
    }

    await book.destroy();

    res.json({ message: 'Книгу видалено', book });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
