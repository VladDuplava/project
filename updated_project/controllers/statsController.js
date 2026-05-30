// controllers/statsController.js

const { fn, col, literal } = require('sequelize');
const Book = require('../models/Book');

async function getOverview(req, res, next) {
  try {
    const allBooks = await Book.findAll();

    const totalBooks     = allBooks.length;
    const rentedBooks    = allBooks.filter((b) => !b.available).length;
    const availableBooks = totalBooks - rentedBooks;
    const occupancyRate  = totalBooks > 0
      ? ((rentedBooks / totalBooks) * 100).toFixed(2) + '%'
      : '0.00%';

    const genreMap = {};
    for (const b of allBooks) {
      const g = b.genre || 'Невизначено';
      if (!genreMap[g]) {
        genreMap[g] = { genre: g, total: 0, available: 0, rented: 0 };
      }
      genreMap[g].total++;
      b.available ? genreMap[g].available++ : genreMap[g].rented++;
    }
    const byGenre = Object.values(genreMap).sort((a, b) => b.total - a.total);

    const topRentedBooks = [...allBooks]
      .sort((a, b) => b.rentCount - a.rentCount)
      .slice(0, 5)
      .map((b) => ({ id: b.id, title: b.title, author: b.author, genre: b.genre, rentCount: b.rentCount }));

    const now = new Date();
    const activeRentals = allBooks
      .filter((b) => !b.available)
      .map((b) => ({
        bookId:     b.id,
        title:      b.title,
        author:     b.author,
        rentedBy:   b.rentedBy,
        rentedAt:   b.rentedAt,
        daysRented: b.rentedAt
          ? Math.floor((now - new Date(b.rentedAt)) / 86400000)
          : null,
      }))
      .sort((a, b) => (b.daysRented || 0) - (a.daysRented || 0));

    res.json({
      totalBooks,
      availableBooks,
      rentedBooks,
      occupancyRate,
      byGenre,
      topRentedBooks,
      activeRentals,
    });
  } catch (err) {
    next(err);
  }
}

async function getGenresStats(req, res, next) {
  try {
    const result = await Book.findAll({
      attributes: [
        'genre',
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal('CASE WHEN available = 1 THEN 1 ELSE 0 END')), 'available'],
        [fn('SUM', literal('CASE WHEN available = 0 THEN 1 ELSE 0 END')), 'rented'],
      ],
      group: ['genre'],
      order: [[literal('total'), 'DESC']],
      raw: true,
    });

    res.json({ byGenre: result });
  } catch (err) {
    next(err);
  }
}

async function getTopBooks(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const topBooks = await Book.findAll({
      attributes: ['id', 'title', 'author', 'genre', 'rentCount', 'available'],
      order: [['rentCount', 'DESC']],
      limit,
    });

    res.json({ topBooks });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverview,
  getGenresStats,
  getTopBooks,
};
