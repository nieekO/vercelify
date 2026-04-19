jest.mock('../../services/coolify.service');

import express from 'express';
import request from 'supertest';
import { coolifyGet, coolifyPost } from '../../services/coolify.service';
import servicesRouter from '../../routes/services.routes';

const mockGet = coolifyGet as jest.Mock;
const mockPost = coolifyPost as jest.Mock;

const app = express();
app.use(express.json());
app.use('/services', servicesRouter);

beforeEach(() => {
  mockGet.mockResolvedValue({ uuid: 'svc-1', status: 'running' });
  mockPost.mockResolvedValue({ ok: true });
});

describe('GET /services', () => {
  it('returns all services', async () => {
    mockGet.mockResolvedValue([{ uuid: 'svc-1' }]);
    const res = await request(app).get('/services');
    expect(res.status).toBe(200);
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/services');
    expect(res.status).toBe(500);
  });
});

describe('GET /services/:uuid', () => {
  it('returns service by uuid', async () => {
    const res = await request(app).get('/services/svc-1');
    expect(res.status).toBe(200);
    expect(res.body.uuid).toBe('svc-1');
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/services/bad');
    expect(res.status).toBe(500);
  });
});

describe('POST /services/:uuid/restart', () => {
  it('restarts service', async () => {
    const res = await request(app).post('/services/svc-1/restart');
    expect(res.status).toBe(200);
    expect(mockPost).toHaveBeenCalledWith('/services/svc-1/restart');
  });

  it('returns 500 on error', async () => {
    mockPost.mockRejectedValue(new Error('fail'));
    const res = await request(app).post('/services/bad/restart');
    expect(res.status).toBe(500);
  });
});

describe('POST /services/:uuid/stop', () => {
  it('stops service', async () => {
    const res = await request(app).post('/services/svc-1/stop');
    expect(res.status).toBe(200);
    expect(mockPost).toHaveBeenCalledWith('/services/svc-1/stop');
  });

  it('returns 500 on error', async () => {
    mockPost.mockRejectedValue(new Error('fail'));
    const res = await request(app).post('/services/bad/stop');
    expect(res.status).toBe(500);
  });
});
