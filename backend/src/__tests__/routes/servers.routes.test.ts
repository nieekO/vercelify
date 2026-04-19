jest.mock('../../services/coolify.service');

import express from 'express';
import request from 'supertest';
import { coolifyGet, coolifyPost, coolifyPatch } from '../../services/coolify.service';
import serversRouter from '../../routes/servers.routes';

const mockGet = coolifyGet as jest.Mock;
const mockPost = coolifyPost as jest.Mock;
const mockPatch = coolifyPatch as jest.Mock;

const app = express();
app.use(express.json());
app.use('/servers', serversRouter);

beforeEach(() => {
  mockGet.mockResolvedValue([{ uuid: 'srv-1', name: 'apps-01', is_reachable: true }]);
  mockPost.mockResolvedValue({ ok: true });
  mockPatch.mockResolvedValue({ updated: true });
});

describe('GET /servers', () => {
  it('returns all servers', async () => {
    const res = await request(app).get('/servers');
    expect(res.status).toBe(200);
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/servers');
    expect(res.status).toBe(500);
  });
});

describe('GET /servers/:uuid', () => {
  it('returns server with resources', async () => {
    mockGet
      .mockResolvedValueOnce({ uuid: 'srv-1', name: 'apps-01' })
      .mockResolvedValueOnce([{ type: 'application' }]);
    const res = await request(app).get('/servers/srv-1');
    expect(res.status).toBe(200);
    expect(res.body.resources).toBeDefined();
    expect(res.body.uuid).toBe('srv-1');
  });

  it('returns empty resources when resources endpoint fails', async () => {
    mockGet
      .mockResolvedValueOnce({ uuid: 'srv-1' })
      .mockRejectedValueOnce(new Error('resources unavailable'));
    const res = await request(app).get('/servers/srv-1');
    expect(res.status).toBe(200);
    expect(res.body.resources).toEqual([]);
  });

  it('returns 500 when server fetch itself fails', async () => {
    mockGet.mockRejectedValue(new Error('not found'));
    const res = await request(app).get('/servers/bad');
    expect(res.status).toBe(500);
  });
});

describe('PUT /servers/:uuid', () => {
  it('patches server settings', async () => {
    const res = await request(app).put('/servers/srv-1').send({ name: 'new-name' });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith('/servers/srv-1', { name: 'new-name' });
  });

  it('returns 500 on error', async () => {
    mockPatch.mockRejectedValue(new Error('fail'));
    const res = await request(app).put('/servers/bad').send({});
    expect(res.status).toBe(500);
  });
});

describe('POST /servers/:uuid/validate', () => {
  it('validates server connectivity', async () => {
    const res = await request(app).post('/servers/srv-1/validate');
    expect(res.status).toBe(200);
    expect(mockPost).toHaveBeenCalledWith('/servers/srv-1/validate');
  });

  it('returns 500 on error', async () => {
    mockPost.mockRejectedValue(new Error('fail'));
    const res = await request(app).post('/servers/bad/validate');
    expect(res.status).toBe(500);
  });
});
