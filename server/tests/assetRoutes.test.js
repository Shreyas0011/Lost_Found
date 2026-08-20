const request = require('supertest');
const jwt = require('jsonwebtoken');
const express = require('express');
const assetRoutes = require('../routes/assetRoutes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/assets', assetRoutes);
app.use(errorHandler);

const secret = process.env.JWT_SECRET || 'lostfound_jwt_secret_change_in_production';

const studentToken = jwt.sign(
  { id: '11111111-1111-1111-1111-111111111111', name: 'Test Student', role: 'student' },
  secret,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { id: '88888888-8888-8888-8888-888888888888', username: 'admin', role: 'admin' },
  secret,
  { expiresIn: '1h' }
);

describe('Asset API Routes Integration Tests', () => {
  let createdAssetId;
  const pngMagicBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 213, 196, 203]);

  test('POST /api/assets uploads file asset and returns 201', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('file', pngMagicBuffer, { filename: 'sample.png', contentType: 'image/png' })
      .field('entityType', 'item')
      .field('entityId', 'lf-100');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('active');

    createdAssetId = res.body.data.id;
  });

  test('POST /api/assets returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('No file provided');
  });

  test('POST /api/assets/upload-url returns 200 with pre-signed URL', async () => {
    const res = await request(app)
      .post('/api/assets/upload-url')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        originalFilename: 'proof.pdf',
        mimeType: 'application/pdf',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uploadUrl).toBeDefined();
    expect(res.body.data.assetId).toBeDefined();
  });

  test('GET /api/assets returns paginated asset listing', async () => {
    const res = await request(app)
      .get('/api/assets?page=1&limit=10')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(10);
  });

  test('GET /api/assets/:id returns 200 for existing asset', async () => {
    const res = await request(app)
      .get(`/api/assets/${createdAssetId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdAssetId);
    expect(res.body.data.url).toBeDefined();
  });

  test('GET /api/assets/:id returns 404 for non-existent asset ID', async () => {
    const res = await request(app)
      .get('/api/assets/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('not found');
  });

  test('DELETE /api/assets/:id allows admin to delete asset', async () => {
    const res = await request(app)
      .delete(`/api/assets/${createdAssetId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
