jest.mock('../../services/coolify.service');

import express from 'express';
import request from 'supertest';
import { coolifyGet } from '../../services/coolify.service';
import deploymentsRouter from '../../routes/deployments.routes';

const mockGet = coolifyGet as jest.Mock;

const app = express();
app.use(express.json());
app.use('/deployments', deploymentsRouter);

beforeEach(() => {
  mockGet.mockResolvedValue([{ uuid: 'dep-1', status: 'success' }]);
});

describe('GET /deployments', () => {
  it('returns deployments with default limit', async () => {
    const res = await request(app).get('/deployments');
    expect(res.status).toBe(200);
    expect(mockGet).toHaveBeenCalledWith('/deployments?per_page=20');
  });

  it('uses custom limit from query param', async () => {
    const res = await request(app).get('/deployments?limit=5');
    expect(res.status).toBe(200);
    expect(mockGet).toHaveBeenCalledWith('/deployments?per_page=5');
  });

  it('appends app filter when app query param is provided', async () => {
    const res = await request(app).get('/deployments?app=app-uuid');
    expect(res.status).toBe(200);
    expect(mockGet).toHaveBeenCalledWith('/deployments?per_page=20&application_id=app-uuid');
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/deployments');
    expect(res.status).toBe(500);
  });
});

describe('GET /deployments/:uuid', () => {
  it('returns a single deployment', async () => {
    mockGet.mockResolvedValue({ uuid: 'dep-1', status: 'success' });
    const res = await request(app).get('/deployments/dep-1');
    expect(res.status).toBe(200);
    expect(res.body.uuid).toBe('dep-1');
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('not found'));
    const res = await request(app).get('/deployments/bad');
    expect(res.status).toBe(500);
  });
});
