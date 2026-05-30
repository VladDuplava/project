// config/seed.js — початкове заповнення MySQL

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB } = require('./database');
const Book   = require('../models/Book');
const Rental = require('../models/Rental');
const User   = require('../models/User');

const initialBooks = [
  { title: 'Кобзар',               author: 'Тарас Шевченко',       year: 1840, genre: 'Поезія',     available: true,  rentCount: 0 },
  { title: 'Тіні забутих предків', author: 'Михайло Коцюбинський', year: 1911, genre: 'Повість',    available: true,  rentCount: 1 },
  { title: 'Лісова пісня',         author: 'Леся Українка',        year: 1911, genre: 'Драма',      available: false, rentedBy: 'Олена Петренко', rentedAt: new Date('2026-04-10'), rentCount: 3 },
  { title: '1984',                 author: 'Джордж Орвелл',        year: 1949, genre: 'Антиутопія', available: true,  rentCount: 5 },
  { title: 'Майстер і Маргарита', author: 'Михайло Булгаков',      year: 1967, genre: 'Роман',      available: true,  rentCount: 2 },
];

async function seed() {
  await connectDB();

  // ── Users ─────────────────────────────────────────────────────────────────
  const userCount = await User.count();
  if (userCount > 0) {
    console.log(`ℹ️  Користувачі вже є (${userCount} шт.) — пропускаємо`);
  } else {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword  = await bcrypt.hash('user123', 10);

    await User.bulkCreate([
      { username: 'admin', password: adminPassword, role: 'admin' },
      { username: 'user1', password: userPassword,  role: 'user'  },
    ]);
    console.log('✅  Створено користувачів: admin (admin123) / user1 (user123)');
  }

  // ── Books ─────────────────────────────────────────────────────────────────
  const bookCount = await Book.count();
  let books;
  if (bookCount > 0) {
    console.log(`ℹ️  Книги вже є (${bookCount} шт.) — пропускаємо`);
    books = await Book.findAll();
  } else {
    books = await Book.bulkCreate(initialBooks, { returning: true });
    console.log(`✅  Додано ${books.length} початкових книг`);
  }

  // ── Rentals ───────────────────────────────────────────────────────────────
  const rentalCount = await Rental.count();
  if (rentalCount > 0) {
    console.log(`ℹ️  Записи оренди вже є (${rentalCount} шт.) — пропускаємо`);
    process.exit(0);
  }

  const lisovaPisnya = books.find((b) => b.title === 'Лісова пісня');
  const kobzar       = books.find((b) => b.title === 'Кобзар');
  const initialRentals = [];

  if (lisovaPisnya) {
    initialRentals.push({
      bookId: lisovaPisnya.id, bookTitle: lisovaPisnya.title,
      bookAuthor: lisovaPisnya.author, bookYear: lisovaPisnya.year, bookGenre: lisovaPisnya.genre,
      userName: 'Олена Петренко', rentedAt: new Date('2026-04-10T10:00:00Z'),
      returnedAt: null, daysRented: null, status: 'active',
    });
  }

  if (kobzar) {
    initialRentals.push({
      bookId: kobzar.id, bookTitle: kobzar.title,
      bookAuthor: kobzar.author, bookYear: kobzar.year, bookGenre: kobzar.genre,
      userName: 'Іван Франко', rentedAt: new Date('2026-02-01T09:00:00Z'),
      returnedAt: new Date('2026-02-05T09:00:00Z'), daysRented: 4, status: 'returned',
    });
  }

  if (initialRentals.length > 0) {
    await Rental.bulkCreate(initialRentals);
    console.log(`✅  Додано ${initialRentals.length} записів оренди`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌  Seed помилка:', err.message);
  process.exit(1);
});
