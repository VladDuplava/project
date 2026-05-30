// tests/controllers/booksController.test.js

const booksController = require('../../controllers/booksController');
const Book = require('../../models/Book');

describe('booksController', () => {
  let req, res, next;

  beforeEach(() => {
    Book.__resetMocks();
    req  = { query: {}, params: {}, body: {}, user: { id: 1, username: 'admin', role: 'admin' } };
    res  = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  // ── listBooks ────────────────────────────────────────────────────────────────
  describe('listBooks', () => {
    it('повертає total та books', async () => {
      await booksController.listBooks(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ total: expect.any(Number), books: expect.any(Array) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('фільтр available=true передається в findAll', async () => {
      req.query.available = 'true';
      await booksController.listBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ available: true }) }),
      );
    });

    it('фільтр available=false передається в findAll', async () => {
      req.query.available = 'false';
      await booksController.listBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ available: false }) }),
      );
    });

    it('фільтр genre передається в findAll (рядок 16)', async () => {
      req.query.genre = 'Поезія';
      await booksController.listBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ genre: expect.anything() }) }),
      );
    });

    it('комбінований фільтр available + genre', async () => {
      req.query.available = 'true';
      req.query.genre     = 'Роман';
      await booksController.listBooks(req, res, next);
      expect(Book.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ available: true, genre: expect.anything() }),
        }),
      );
    });

    it('порожній список — total = 0', async () => {
      Book.findAll.mockResolvedValueOnce([]);
      await booksController.listBooks(req, res, next);
      const payload = res.json.mock.calls[0][0];
      expect(payload.total).toBe(0);
      expect(payload.books).toEqual([]);
    });

    it('передає помилку в next', async () => {
      Book.findAll.mockRejectedValueOnce(new Error('db'));
      await booksController.listBooks(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getBookById ──────────────────────────────────────────────────────────────
  describe('getBookById', () => {
    it('повертає книгу за ID', async () => {
      req.params.id = '1';
      await booksController.getBookById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    });

    it('повертає 404 якщо не знайдено', async () => {
      Book.findByPk.mockResolvedValueOnce(null);
      req.params.id = '404';
      await booksController.getBookById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Книгу не знайдено' });
    });

    it('передає помилку в next', async () => {
      Book.findByPk.mockRejectedValueOnce(new Error('fail'));
      req.params.id = '1';
      await booksController.getBookById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── createBook ───────────────────────────────────────────────────────────────
  describe('createBook', () => {
    it('створює книгу зі статусом 201', async () => {
      req.body = { title: 'Нова', author: 'Автор' };
      await booksController.createBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Книгу успішно додано', book: expect.any(Object) }),
      );
    });

    it('400 без title', async () => {
      req.body = { author: 'A' };
      await booksController.createBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Book.create).not.toHaveBeenCalled();
    });

    it('400 без author', async () => {
      req.body = { title: 'T' };
      await booksController.createBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Book.create).not.toHaveBeenCalled();
    });

    it('400 якщо body порожнє', async () => {
      req.body = {};
      await booksController.createBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('встановлює genre = "Невизначено" якщо не передано', async () => {
      req.body = { title: 'X', author: 'Y' };
      await booksController.createBook(req, res, next);
      expect(Book.create).toHaveBeenCalledWith(
        expect.objectContaining({ genre: 'Невизначено' }),
      );
    });

    it('передає genre якщо передано', async () => {
      req.body = { title: 'X', author: 'Y', genre: 'Роман' };
      await booksController.createBook(req, res, next);
      expect(Book.create).toHaveBeenCalledWith(
        expect.objectContaining({ genre: 'Роман' }),
      );
    });

    it('передає year=null якщо не передано', async () => {
      req.body = { title: 'X', author: 'Y' };
      await booksController.createBook(req, res, next);
      expect(Book.create).toHaveBeenCalledWith(
        expect.objectContaining({ year: null }),
      );
    });

    it('передає помилку в next', async () => {
      Book.create.mockRejectedValueOnce(new Error('fail'));
      req.body = { title: 'X', author: 'Y' };
      await booksController.createBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── updateBook ───────────────────────────────────────────────────────────────
  describe('updateBook', () => {
    it('оновлює книгу (200)', async () => {
      req.params.id = '1';
      req.body      = { title: 'Оновлена' };
      await booksController.updateBook(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Книгу успішно оновлено' }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('оновлює тільки передані поля', async () => {
      req.params.id = '1';
      req.body      = { genre: 'Класика' };
      await booksController.updateBook(req, res, next);
      expect(res.body).not.toHaveProperty('title');
    });

    it('404 якщо книги немає', async () => {
      Book.findByPk.mockResolvedValueOnce(null);
      req.params.id = '999';
      req.body      = { title: 'X' };
      await booksController.updateBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('400 якщо body порожнє', async () => {
      req.params.id = '1';
      req.body      = {};
      await booksController.updateBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Не передано жодного поля для оновлення' });
    });

    it('передає помилку в next', async () => {
      Book.findByPk.mockRejectedValueOnce(new Error('fail'));
      req.params.id = '1';
      req.body      = { title: 'X' };
      await booksController.updateBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── deleteBook ───────────────────────────────────────────────────────────────
  describe('deleteBook', () => {
    it('видаляє доступну книгу (200)', async () => {
      req.params.id = '1';
      await booksController.deleteBook(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Книгу видалено', book: expect.any(Object) }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('404 якщо книги немає', async () => {
      Book.findByPk.mockResolvedValueOnce(null);
      req.params.id = '404';
      await booksController.deleteBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Книгу не знайдено' });
    });

    it('409 для орендованої книги', async () => {
      req.params.id = '2';
      await booksController.deleteBook(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json.mock.calls[0][0].error).toContain('орендована');
    });

    it('передає помилку в next', async () => {
      Book.findByPk.mockRejectedValueOnce(new Error('fail'));
      req.params.id = '1';
      await booksController.deleteBook(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
