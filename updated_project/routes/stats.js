// routes/stats.js — тільки авторизовані

const express  = require('express');
const router   = express.Router();
const { getOverview, getGenresStats, getTopBooks } = require('../controllers/statsController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Загальна статистика (потрібна авторизація)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика бібліотеки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistics'
 *       401:
 *         description: Не авторизовано
 */
router.get('/', authenticate, getOverview);

/**
 * @swagger
 * /api/stats/genres:
 *   get:
 *     summary: Статистика по жанрах (потрібна авторизація)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Групування по жанрах
 *       401:
 *         description: Не авторизовано
 */
router.get('/genres', authenticate, getGenresStats);

/**
 * @swagger
 * /api/stats/top:
 *   get:
 *     summary: Топ книг за орендами (потрібна авторизація)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Топ книг
 *       401:
 *         description: Не авторизовано
 */
router.get('/top', authenticate, getTopBooks);

module.exports = router;
