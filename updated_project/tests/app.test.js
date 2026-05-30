// tests/app.test.js — покриття root, docs json і 404 з app.js

const request = require('supertest');
const createApp = require('./helpers/app');

const app = createApp();

describe('app.js routes', () => {
  it('GET /api-docs.json повертає OpenAPI json', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('openapi', '3.0.0');
  });

  it('GET / повертає html сторінку', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<!DOCTYPE html>');
  });

  it('невідомий маршрут повертає 404 з json', async () => {
    const res = await request(app).get('/definitely-not-existing-route');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: expect.stringContaining('не знайдено'),
      }),
    );
  });
});
