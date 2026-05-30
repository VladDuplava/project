// routes/rentals.js
// GET /         — публічний (активні оренди)
// GET /history  — тільки авторизовані
// POST /rent    — тільки авторизовані
// POST /return  — тільки авторизовані

const express  = require('express');
const router   = express.Router();
const rentalsController    = require('../controllers/rentalsController');
const { authenticate }     = require('../middleware/auth');

/**
 * @swagger
 * /api/rentals:
 *   get:
 *     summary: Активні оренди (публічний)
 *     tags: [Rentals]
 *     responses:
 *       200:
 *         description: Список активних оренд
 */
router.get('/', rentalsController.listRentals);

/**
 * @swagger
 * /api/rentals/history:
 *   get:
 *     summary: Повна історія оренд (потрібна авторизація)
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, returned]
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Історія оренд
 *       401:
 *         description: Не авторизовано
 */
router.get('/history', authenticate, rentalsController.listHistory);

/**
 * @swagger
 * /api/rentals/history/{id}:
 *   get:
 *     summary: Отримати оренду за ID (потрібна авторизація)
 *     tags: [Rentals]
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
 *         description: Запис оренди
 *       401:
 *         description: Не авторизовано
 *       404:
 *         description: Оренду не знайдено
 */
router.get('/history/:id', authenticate, rentalsController.getRentalById);

/**
 * @swagger
 * /api/rentals/rent:
 *   post:
 *     summary: Орендувати книгу (потрібна авторизація)
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RentInput'
 *     responses:
 *       200:
 *         description: Книгу орендовано
 *       401:
 *         description: Не авторизовано
 *       409:
 *         description: Книга вже орендована
 */
router.post('/rent', authenticate, rentalsController.rentBook);

/**
 * @swagger
 * /api/rentals/return:
 *   post:
 *     summary: Повернути книгу (потрібна авторизація)
 *     tags: [Rentals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReturnInput'
 *     responses:
 *       200:
 *         description: Книгу повернено
 *       401:
 *         description: Не авторизовано
 *       409:
 *         description: Книга не є орендованою
 */
router.post('/return', authenticate, rentalsController.returnBook);

module.exports = router;
