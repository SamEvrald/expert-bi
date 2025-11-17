import request from 'supertest';
import app from '../src/index';
import Database from '../src/config/database';
import fs from 'fs';
import path from 'path';

describe('Expert BI API Tests', () => {
  let authToken: string;
  let userId: number;
  let datasetId: number;

  beforeAll(async () => {
    // Clean test database
    await Database.query('DELETE FROM users WHERE email LIKE "test%@test.com"');
  });

  afterAll(async () => {
    // Cleanup
    if (datasetId) {
      await Database.query('DELETE FROM datasets WHERE id = ?', [datasetId]);
    }
    if (userId) {
      await Database.query('DELETE FROM users WHERE id = ?', [userId]);
    }
  });

  describe('Authentication', () => {
    test('POST /api/auth/register - should register new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'Test123!@#',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      
      authToken = response.body.data.token;
      userId = response.body.data.id;
    });

    test('POST /api/auth/login - should login user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
    });

    test('GET /api/auth/me - should get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email', 'test@test.com');
    });

    test('GET /api/auth/me - should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('Dataset Management', () => {
    test('POST /api/datasets - should upload dataset', async () => {
      const testFile = path.join(__dirname, '../python/test_data/basic_sales.csv');
      
      const response = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile)
        .field('name', 'Test Dataset')
        .field('description', 'Test dataset for automated testing');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      
      datasetId = response.body.data.id;
    }, 30000); // 30 second timeout for upload

    test('GET /api/datasets - should list datasets', async () => {
      const response = await request(app)
        .get('/api/datasets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/datasets/:id - should get single dataset', async () => {
      const response = await request(app)
        .get(`/api/datasets/${datasetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id', datasetId);
      expect(response.body.data).toHaveProperty('name', 'Test Dataset');
    });

    test('GET /api/datasets/:id/preview - should get dataset preview', async () => {
      const response = await request(app)
        .get(`/api/datasets/${datasetId}/preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('columns');
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data.rows.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Type Detection', () => {
    test('POST /api/datasets/:id/detect-types - should detect column types', async () => {
      const response = await request(app)
        .post(`/api/datasets/${datasetId}/detect-types`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('columns');
    }, 30000);

    test('GET /api/datasets/:id/column-types - should get stored column types', async () => {
      const response = await request(app)
        .get(`/api/datasets/${datasetId}/column-types`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    test('GET /api/datasets/:id/chart-suggestions - should get chart suggestions', async () => {
      const response = await request(app)
        .get(`/api/datasets/${datasetId}/chart-suggestions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ xAxis: 'date', yAxis: 'revenue' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Insights', () => {
    test('POST /api/datasets/:id/insights - should generate insights', async () => {
      const response = await request(app)
        .post(`/api/datasets/${datasetId}/insights`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('insights');
    }, 60000); // 60 second timeout for insights

    test('GET /api/datasets/:id/insights - should retrieve insights', async () => {
      const response = await request(app)
        .get(`/api/datasets/${datasetId}/insights`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('GET /api/datasets/:id/analysis - should get comprehensive analysis', async () => {
      const response = await request(app)
        .get(`/api/datasets/${datasetId}/analysis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    }, 60000);
  });

  describe('Error Handling', () => {
    test('Should handle non-existent dataset', async () => {
      const response = await request(app)
        .get('/api/datasets/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('Should handle invalid file upload', async () => {
      const response = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Invalid Dataset');

      expect(response.status).toBe(400);
    });

    test('Should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/datasets');

      expect(response.status).toBe(401);
    });
  });
});