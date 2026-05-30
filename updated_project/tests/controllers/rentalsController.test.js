// tests/controllers/rentalsController.test.js

const rentalsController = require('../../controllers/rentalsController');
const Book   = require('../../models/Book');
const Rental = require('../../models/Rental');

describe('rentalsController', () => {
  let req, res, next;

  beforeEach(() => {
    Book.__resetMocks();
    Rental.__resetMocks();
    req  = { body: {}, params: {}, query: {}, user: { id: 1, username: 'admin', role: 'admin' } };
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  // ── listRentals ──────────────────────────────────────────────────────────────
  describe('listRentals', () => {
    it('повертає total та rentals', async () => {
      await rentalsController.listRentals(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ total: expect.any(Number), rentals: expect.any(Array) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('повертає порожній список якщо немає орендованих', async () => {
      Book.findAll.mockResolvedValueOnce([]);
      await rentalsController.listRentals(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ total: 0, rentals: [] });
    });

    it('передає помилку в next (рядок 78)', async () => {
      Book.findAll.mockRejectedValueOnce(new Error('db fail'));
      await rentalsController.listRentals(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── listHistory ──────────────────────────────────────────────────────────────
  describe('listHistory', () => {
    it('admin — повертає всю історію без userName фільтра', async () => {
      await rentalsController.listHistory(req, res, next);
      expect(Rental.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.not.objectContaining({ userName: expect.anything() }) }),
      );
    });

    it('admin — може фільтрувати за userName', async () => {
      req.query.userName = 'Іван Франко';
      await rentalsController.listHistory(req, res, next);
      expect(Rental.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userName: 'Іван Франко' }) }),
      );
    });

    it('admin — може фільтрувати за status', async () => {
      req.query.status = 'returned';
      await rentalsController.listHistory(req, res, next);
      expect(Rental.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'returned' }) }),
      );
    });

    it('admin — не отримує filteredBy у відповіді', async () => {
      await rentalsController.listHistory(req, res, next);
      expect(res.json.mock.calls[0][0]).not.toHaveProperty('filteredBy');
    });

    it('user — where.userName = свій username', async () => {
      req.user = { id: 2, username: 'user1', role: 'user' };
      await rentalsController.listHistory(req, res, next);
      expect(Rental.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userName: 'user1' }) }),
      );
    });

    it('user — query.userName ігнорується (не може підмінити)', async () => {
      req.user           = { id: 2, username: 'user1', role: 'user' };
      req.query.userName = 'admin';
      await rentalsController.listHistory(req, res, next);
      expect(Rental.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userName: 'user1' }) }),
      );
    });

    it('user — отримує filteredBy у відповіді', async () => {
      req.user = { id: 2, username: 'user1', role: 'user' };
      await rentalsController.listHistory(req, res, next);
      expect(res.json.mock.calls[0][0]).toHaveProperty('filteredBy', 'user1');
    });

    it('передає помилку в next (рядок 128)', async () => {
      Rental.findAll.mockRejectedValueOnce(new Error('history fail'));
      await rentalsController.listHistory(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getRentalById ────────────────────────────────────────────────────────────
  describe('getRentalById', () => {
    it('admin бачить будь-яку оренду', async () => {
      req.params.id = '1';
      await rentalsController.getRentalById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
      expect(next).not.toHaveBeenCalled();
    });

    it('user бачить свою оренду (userName співпадає)', async () => {
      req.user      = { id: 2, username: 'Іван Франко', role: 'user' };
      req.params.id = '1'; // rental.userName = 'Іван Франко'
      await rentalsController.getRentalById(req, res, next);
      expect(res.json).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('user отримує 403 для чужої оренди', async () => {
      req.user      = { id: 2, username: 'user1', role: 'user' };
      req.params.id = '1'; // rental.userName = 'Іван Франко'
      await rentalsController.getRentalById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json.mock.calls[0][0].error).toMatch(/не ваша оренда/i);
    });

    it('повертає 404 якщо не знайдено', async () => {
      Rental.findByPk.mockResolvedValueOnce(null);
      req.params.id = '999';
      await rentalsController.getRentalById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('передає помилку в next (рядок 143)', async () => {
      Rental.findByPk.mockRejectedValueOnce(new Error('rental fail'));
      req.params.id = '1';
      await rentalsController.getRentalById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── rentBook ────────────────────────────────────────────────────────────────
  describe('rentBook', () => {
    it('успішно орендує книгу і створює Rental', async () => {
      req.body = { bookId: 1, userName: 'user1' };
      await rentalsController.rentBook(req, res, next);
      expect(Rental.create).toHaveBeenCalledWith(
        expect.objectContaining({ bookId: 1, userName: 'user1', status: 'active' }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('орендовано') }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('400 без bookId', async () => {
      req.body = { userName: 'u' };
      await rentalsController.rentBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Book.findByPk).not.toHaveBeenCalled();
    });

    it('400 без userName', async () => {
      req.body = { bookId: 1 };
      await rentalsController.rentBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('404 якщо книга не існує', async () => {
      Book.findByPk.mockResolvedValueOnce(null);
      req.body = { bookId: 999, userName: 'u' };
      await rentalsController.rentBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Книгу не знайдено' });
    });

    it('409 якщо книга вже орендована', async () => {
      req.body = { bookId: 2, userName: 'u' };
      await rentalsController.rentBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json.mock.calls[0][0].error).toContain('вже орендована');
    });

    it('передає помилку в next', async () => {
      Book.findByPk.mockRejectedValueOnce(new Error('rent fail'));
      req.body = { bookId: 1, userName: 'u' };
      await rentalsController.rentBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── returnBook ──────────────────────────────────────────────────────────────
  describe('returnBook', () => {
    it('admin повертає книгу успішно', async () => {
      req.body = { bookId: 2 };
      await rentalsController.returnBook(req, res, next);
      expect(Rental.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ bookId: 2, status: 'active' }) }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('повернено') }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('user повертає свою книгу (rentedBy = username)', async () => {
      req.user = { id: 2, username: 'Іван Франко', role: 'user' };
      req.body = { bookId: 2 }; // book id=2 rentedBy='Іван Франко'
      await rentalsController.returnBook(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('повернено') }),
      );
    });

    it('user отримує 403 для чужої книги', async () => {
      req.user = { id: 2, username: 'user1', role: 'user' };
      req.body = { bookId: 2 }; // rentedBy='Іван Франко'
      await rentalsController.returnBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json.mock.calls[0][0].error).toMatch(/не орендували/i);
    });

    it('400 без bookId', async () => {
      req.body = {};
      await rentalsController.returnBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Book.findByPk).not.toHaveBeenCalled();
    });

    it('404 якщо книга не існує (рядок 143)', async () => {
      Book.findByPk.mockResolvedValueOnce(null);
      req.body = { bookId: 999 };
      await rentalsController.returnBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Книгу не знайдено' });
    });

    it('409 якщо книга не орендована', async () => {
      req.body = { bookId: 1 }; // available=true
      await rentalsController.returnBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('працює навіть якщо активна оренда не знайдена в Rental (rental=null)', async () => {
      Rental.findOne.mockResolvedValueOnce(null);
      req.body = { bookId: 2 };
      await rentalsController.returnBook(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ rental: null }),
      );
    });

    it('передає помилку в next (рядок 178)', async () => {
      Book.findByPk.mockRejectedValueOnce(new Error('return fail'));
      req.body = { bookId: 2 };
      await rentalsController.returnBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
