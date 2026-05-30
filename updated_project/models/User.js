// models/User.js — модель користувача для JWT автентифікації

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Логін не може бути порожнім' },
        len: { args: [3, 50], msg: 'Логін має бути від 3 до 50 символів' },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Пароль не може бути порожнім' },
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  },
);

module.exports = User;
