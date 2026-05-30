// models/Rental.js — окрема модель для зберігання історії оренди

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rental = sequelize.define(
  'Rental',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // FK на книгу — nullable щоб при видаленні книги SET NULL не конфліктував
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'book_id',
    },

    // Знімок даних книги на момент оренди (зберігається назавжди)
    bookTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'book_title',
    },
    bookAuthor: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'book_author',
    },
    bookYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'book_year',
    },
    bookGenre: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'book_genre',
    },

    // Хто орендував
    userName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'user_name',
      validate: { notEmpty: { msg: "Ім'я орендаря не може бути порожнім" } },
    },

    // Коли орендував / повернув
    rentedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'rented_at',
    },
    returnedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: 'returned_at',
    },

    // Скільки днів тривала оренда (заповнюється при поверненні)
    daysRented: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'days_rented',
    },

    // Статус оренди
    status: {
      type: DataTypes.ENUM('active', 'returned'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'rentals',
    timestamps: true,
    underscored: true,
  },
);

module.exports = Rental;
