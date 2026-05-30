// routes/books.js
// GET /        — публічний
// GET /:id     — публічний
// POST /       — тільки admin
// PUT /:id     — тільки авторизовані (user або admin)
// DELETE /:id  — тільки admin

const express  = require('express');
const router   = express.Router();
const booksController              = require('../controllers/booksController');
const { authenticate, requireAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Отримати список усіх книг (публічний)
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список книг
 */
router.get('/', booksController.listBooks);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Отримати книгу за ID (публічний)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Книга знайдена
 *       404:
 *         description: Книгу не знайдено
 */
router.get('/:id', booksController.getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Додати нову книгу (тільки admin)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookInput'
 *     responses:
 *       201:
 *         description: Книгу додано
 *       401:
 *         description: Не авторизовано
 *       403:
 *         description: Потрібні права адміністратора
 */
router.post('/', authenticate, requireAdmin, booksController.createBook);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Редагувати книгу (тільки admin)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookUpdateInput'
 *     responses:
 *       200:
 *         description: Книгу оновлено
 *       401:
 *         description: Не авторизовано
 *       403:
 *         description: Потрібні права адміністратора
 *       404:
 *         description: Книгу не знайдено
 */
router.put('/:id', authenticate, requireAdmin, booksController.updateBook);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Видалити книгу (тільки admin)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Книгу видалено
 *       401:
 *         description: Не авторизовано
 *       403:
 *         description: Потрібні права адміністратора
 *       404:
 *         description: Книгу не знайдено
 */
router.delete('/:id', authenticate, requireAdmin, booksController.deleteBook);

module.exports = router;
