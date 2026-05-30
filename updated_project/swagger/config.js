// swagger/config.js — OpenAPI 3.0 специфікація

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '📚 Library Rental API',
      version: '2.1.0',
      description:
        'REST API для бібліотечної системи оренди книг.\n\n' +
        '**Автентифікація:** Bearer JWT токен.\n\n' +
        'Спочатку зареєструйтесь або увійдіть через `/api/auth/register` або `/api/auth/login`, ' +
        'отримайте токен і вставте його у кнопку **Authorize 🔒** вгорі.',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Локальний сервер' }],
    tags: [
      { name: 'Auth',       description: 'Реєстрація та вхід' },
      { name: 'Books',      description: 'Керування каталогом книг' },
      { name: 'Rentals',    description: 'Оренда, повернення та історія' },
      { name: 'Statistics', description: 'Статистика бібліотеки' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введіть JWT токен отриманий після login/register',
        },
      },
      schemas: {
        AuthInput: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin', minLength: 3 },
            password: { type: 'string', example: 'secret123', minLength: 6 },
            role:     { type: 'string', enum: ['user', 'admin'], example: 'user' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            token:   { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id:       { type: 'integer' },
                username: { type: 'string'  },
                role:     { type: 'string', enum: ['user', 'admin'] },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:        { type: 'integer', example: 1 },
            username:  { type: 'string',  example: 'admin' },
            role:      { type: 'string',  enum: ['user', 'admin'] },
            createdAt: { type: 'string',  format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            id:        { type: 'integer', example: 1 },
            title:     { type: 'string',  example: 'Кобзар' },
            author:    { type: 'string',  example: 'Тарас Шевченко' },
            year:      { type: 'integer', example: 1840, nullable: true },
            genre:     { type: 'string',  example: 'Поезія' },
            available: { type: 'boolean', example: true },
            rentedBy:  { type: 'string',  nullable: true },
            rentedAt:  { type: 'string',  format: 'date-time', nullable: true },
            rentCount: { type: 'integer', example: 5 },
            createdAt: { type: 'string',  format: 'date-time' },
            updatedAt: { type: 'string',  format: 'date-time' },
          },
        },
        BookInput: {
          type: 'object',
          required: ['title', 'author'],
          properties: {
            title:  { type: 'string',  example: 'Кобзар' },
            author: { type: 'string',  example: 'Тарас Шевченко' },
            year:   { type: 'integer', example: 1840 },
            genre:  { type: 'string',  example: 'Поезія' },
          },
        },
        BookUpdateInput: {
          type: 'object',
          description: 'Будь-яке з полів можна передати окремо',
          properties: {
            title:  { type: 'string'  },
            author: { type: 'string'  },
            year:   { type: 'integer' },
            genre:  { type: 'string'  },
          },
        },
        Rental: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            bookId:     { type: 'integer', nullable: true },
            bookTitle:  { type: 'string'  },
            bookAuthor: { type: 'string'  },
            bookYear:   { type: 'integer', nullable: true },
            bookGenre:  { type: 'string',  nullable: true },
            userName:   { type: 'string'  },
            rentedAt:   { type: 'string',  format: 'date-time' },
            returnedAt: { type: 'string',  format: 'date-time', nullable: true },
            daysRented: { type: 'integer', nullable: true },
            status:     { type: 'string',  enum: ['active', 'returned'] },
            createdAt:  { type: 'string',  format: 'date-time' },
            updatedAt:  { type: 'string',  format: 'date-time' },
          },
        },
        RentInput: {
          type: 'object',
          required: ['bookId', 'userName'],
          properties: {
            bookId:   { type: 'integer', example: 1 },
            userName: { type: 'string',  example: 'Іван Франко' },
          },
        },
        ReturnInput: {
          type: 'object',
          required: ['bookId'],
          properties: {
            bookId: { type: 'integer', example: 1 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        Statistics: {
          type: 'object',
          properties: {
            totalBooks:     { type: 'integer' },
            availableBooks: { type: 'integer' },
            rentedBooks:    { type: 'integer' },
            occupancyRate:  { type: 'string'  },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
