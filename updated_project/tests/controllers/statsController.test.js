// tests/controllers/statsController.test.js

const statsController = require('../../controllers/statsController');
const Book = require('../../models/Book');

describe('statsController', () => {
  let req, res, next;

  beforeEach(() => {
    Book.__resetMocks();
    req  = { query: {} };
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  // ── getOverview ──────────────────────────────────────────────────────────────
  describe('getOverview', () => {
    it('повертає коректні підсумки', async () => {
      await statsController.getOverview(req, res, next);
      const payload = res.json.mock.calls[0][0];
      expect(payload.totalBooks).toBe(payload.availableBooks + payload.rentedBooks);
      expect(payload.occupancyRate).toMatch(/%$/);
      expect(Array.isArray(payload.byGenre)).toBe(true);
      expect(Array.isArray(payload.topRentedBooks)).toBe(true);
      expect(Array.isArray(payload.activeRentals)).toBe(true);
      expect(next).not.toHaveBeenCalled();
    });

    it('нульова статистика для порожньої бібліотеки', async () => {
      Book.findAll.mockResolvedValueOnce([]);
      await statsController.getOverview(req, res, next);
      const p = res.json.mock.calls[0][0];
      expect(p.totalBooks).toBe(0);
      expect(p.occupancyRate).toBe('0.00%');
      expect(p.byGenre).toEqual([]);
      expect(p.topRentedBooks).toEqual([]);
      expect(p.activeRentals).toEqual([]);
    });

    it('activeRentals.daysRented = null якщо rentedAt відсутній (рядок 46)', async () => {
      // Книга без rentedAt — перевіряє гілку `rentedAt ? ... : null`
      Book.findAll.mockResolvedValueOnce([{
        id: 5, title: 'Без дати', author: 'Автор', genre: 'Роман',
        available: false, rentedBy: 'Тест', rentedAt: null, rentCount: 1,
      }]);
      await statsController.getOverview(req, res, next);
      const p = res.json.mock.calls[0][0];
      expect(p.activeRentals[0].daysRented).toBeNull();
    });

    it('byGenre групує правильно', async () => {
      Book.findAll.mockResolvedValueOnce([
        { id: 1, title: 'A', author: 'X', genre: 'Поезія', available: true,  rentedBy: null, rentedAt: null, rentCount: 0 },
        { id: 2, title: 'B', author: 'Y', genre: 'Поезія', available: false, rentedBy: 'U', rentedAt: new Date(), rentCount: 1 },
        { id: 3, title: 'C', author: 'Z', genre: 'Роман',  available: true,  rentedBy: null, rentedAt: null, rentCount: 2 },
      ]);
      await statsController.getOverview(req, res, next);
      const { byGenre } = res.json.mock.calls[0][0];
      const poeziya = byGenre.find((g) => g.genre === 'Поезія');
      expect(poeziya).toBeDefined();
      expect(poeziya.total).toBe(2);
      expect(poeziya.available).toBe(1);
      expect(poeziya.rented).toBe(1);
    });

    it('жанр "Невизначено" для книг без genre', async () => {
      Book.findAll.mockResolvedValueOnce([
        { id: 1, title: 'A', author: 'X', genre: null, available: true, rentedBy: null, rentedAt: null, rentCount: 0 },
      ]);
      await statsController.getOverview(req, res, next);
      const { byGenre } = res.json.mock.calls[0][0];
      expect(byGenre[0].genre).toBe('Невизначено');
    });

    it('topRentedBooks обмежений 5 елементами', async () => {
      const books = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1, title: `Book ${i}`, author: 'A', genre: 'G',
        available: true, rentedBy: null, rentedAt: null, rentCount: 10 - i,
      }));
      Book.findAll.mockResolvedValueOnce(books);
      await statsController.getOverview(req, res, next);
      expect(res.json.mock.calls[0][0].topRentedBooks).toHaveLength(5);
    });

    it('передає помилку в next', async () => {
      Book.findAll.mockRejectedValueOnce(new Error('overview fail'));
      await statsController.getOverview(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getGenresStats ───────────────────────────────────────────────────────────
  describe('getGenresStats', () => {
    it('повертає byGenre масив', async () => {
      const aggregated = [{ genre: 'Поезія', total: 2, available: 1, rented: 1 }];
      Book.findAll.mockResolvedValueOnce(aggregated);
      await statsController.getGenresStats(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ byGenre: aggregated });
      expect(next).not.toHaveBeenCalled();
    });

    it('передає помилку в next', async () => {
      Book.findAll.mockRejectedValueOnce(new Error('genres fail'));
      await statsController.getGenresStats(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getTopBooks ──────────────────────────────────────────────────────────────
  describe('getTopBooks', () => {
    it('дефолтний limit = 5', async () => {
      await statsController.getTopBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
      expect(next).not.toHaveBeenCalled();
    });

    it('кастомний limit = 10', async () => {
      req.query.limit = '10';
      await statsController.getTopBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
    });

    it('обмежує limit до 20 при limit=999', async () => {
      req.query.limit = '999';
      await statsController.getTopBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
    });

    it('повертає { topBooks: [...] }', async () => {
      await statsController.getTopBooks(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ topBooks: expect.any(Array) }),
      );
    });

    it('передає помилку в next', async () => {
      Book.findAll.mockRejectedValueOnce(new Error('top fail'));
      await statsController.getTopBooks(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
