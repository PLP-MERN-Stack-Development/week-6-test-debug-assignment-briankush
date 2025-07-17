const request = require('supertest');
const { app } = require('../../src/server');

describe('Health Endpoint', () => {
  test('should return 200 OK with healthy message', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('API is healthy');
  });
});
