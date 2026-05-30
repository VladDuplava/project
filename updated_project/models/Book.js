// models/Book.js — Sequelize модель книги (MySQL)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define(
  'Book',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: 'Назва книги не може бути порожньою' } },
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: 'Автор книги не може бути порожнім' } },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Невизначено',
    },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    rentedBy: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
      field: 'rented_by',
    },
    rentedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: 'rented_at',
    },
    rentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'rent_count',
    },
  },
  {
    tableName: 'books',
    timestamps: true,
    underscored: true,
  },
);

module.exports = Book;
