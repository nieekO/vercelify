jest.mock('../../services/coolify.service');

import express from 'express';
import request from 'supertest';
import { coolifyGet } from '../../services/coolify.service';
import configRouter from '../../routes/config.routes';

const mockGet = coolifyGet as jest.Mock;

const app = express();
app.use(express.json());
app.use('/config', configRouter);

beforeEach(() => {
  mockGet.mockResolvedValue({ version: '4.0.0' });
});

describe('GET /config', () => {
  it('returns current config values from env', async () => {
    const res = await request(app).get('/config');
    expect(res.status).toBe(200);
    expect(res.body.coolifyApiUrl).toBe(process.env.COOLIFY_API_URL);
    expect(res.body.infraServerUuid).toBe(process.env.COOLIFY_INFRA_SERVER_UUID);
    expect(res.body.appsServerUuid).toBe(process.env.COOLIFY_APPS_SERVER_UUID);
  });
});

describe('PUT /config', () => {
  it('returns success with restart message', async () => {
    const res = await request(app).put('/config').send({ some: 'value' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/restart/);
  });
});

describe('POST /config/test-connection', () => {
  it('returns success with version data', async () => {
    const res = await request(app).post('/config/test-connection');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toEqual({ version: '4.0.0' });
  });

  it('returns 500 with failure when Coolify unreachable', async () => {
    mockGet.mockRejectedValue(new Error('Connection refused'));
    const res = await request(app).post('/config/test-connection');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Connection refused/);
  });
});
