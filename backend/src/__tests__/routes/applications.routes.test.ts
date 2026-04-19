jest.mock('../../services/coolify.service');

import express from 'express';
import request from 'supertest';
import { coolifyGet, coolifyPost, coolifyPatch } from '../../services/coolify.service';
import applicationsRouter from '../../routes/applications.routes';

const mockGet = coolifyGet as jest.Mock;
const mockPost = coolifyPost as jest.Mock;
const mockPatch = coolifyPatch as jest.Mock;

const app = express();
app.use(express.json());
app.use('/applications', applicationsRouter);

beforeEach(() => {
  mockGet.mockResolvedValue({ uuid: 'app-1', status: 'running' });
  mockPost.mockResolvedValue({ started: true });
  mockPatch.mockResolvedValue({ updated: true });
});

describe('GET /applications/:uuid', () => {
  it('returns application data', async () => {
    const res = await request(app).get('/applications/app-1');
    expect(res.status).toBe(200);
    expect(res.body.uuid).toBe('app-1');
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('not found'));
    const res = await request(app).get('/applications/bad');
    expect(res.status).toBe(500);
  });
});

describe('POST /applications/:uuid/deploy', () => {
  it('triggers deployment', async () => {
    const res = await request(app).post('/applications/app-1/deploy');
    expect(res.status).toBe(200);
    expect(mockPost).toHaveBeenCalledWith('/applications/app-1/deploy');
  });

  it('returns 500 on error', async () => {
    mockPost.mockRejectedValue(new Error('deploy failed'));
    const res = await request(app).post('/applications/bad/deploy');
    expect(res.status).toBe(500);
  });
});

describe('POST /applications/:uuid/restart', () => {
  it('restarts application', async () => {
    const res = await request(app).post('/applications/app-1/restart');
    expect(res.status).toBe(200);
  });

  it('returns 500 on error', async () => {
    mockPost.mockRejectedValue(new Error('fail'));
    const res = await request(app).post('/applications/bad/restart');
    expect(res.status).toBe(500);
  });
});

describe('POST /applications/:uuid/stop', () => {
  it('stops application', async () => {
    const res = await request(app).post('/applications/app-1/stop');
    expect(res.status).toBe(200);
  });

  it('returns 500 on error', async () => {
    mockPost.mockRejectedValue(new Error('fail'));
    const res = await request(app).post('/applications/bad/stop');
    expect(res.status).toBe(500);
  });
});

describe('GET /applications/:uuid/logs', () => {
  it('returns logs', async () => {
    mockGet.mockResolvedValue([{ line: 'log line 1' }]);
    const res = await request(app).get('/applications/app-1/logs');
    expect(res.status).toBe(200);
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/applications/bad/logs');
    expect(res.status).toBe(500);
  });
});

describe('GET /applications/:uuid/environment', () => {
  it('returns masked env vars from array response', async () => {
    mockGet.mockResolvedValue([
      { key: 'MY_VAR', value: 'secret' },
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'http://kong' },
    ]);
    const res = await request(app).get('/applications/app-1/environment');
    expect(res.status).toBe(200);
    const supabaseVar = res.body.find((v: { key: string }) => v.key === 'NEXT_PUBLIC_SUPABASE_URL');
    expect(supabaseVar.isManaged).toBe(true);
    expect(supabaseVar.value).toBe('••••••••');
    const myVar = res.body.find((v: { key: string }) => v.key === 'MY_VAR');
    expect(myVar.isManaged).toBe(false);
  });

  it('handles paginated data response', async () => {
    mockGet.mockResolvedValue({ data: [{ key: 'PORT', value: '3000' }] });
    const res = await request(app).get('/applications/app-1/environment');
    expect(res.body).toHaveLength(1);
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const res = await request(app).get('/applications/bad/environment');
    expect(res.status).toBe(500);
  });
});

describe('PUT /applications/:uuid/environment', () => {
  it('saves a new env var', async () => {
    mockPost.mockResolvedValue({ saved: true });
    const res = await request(app)
      .put('/applications/app-1/environment')
      .send({ key: 'MY_VAR', value: 'hello' });
    expect(res.status).toBe(200);
  });

  it('returns 403 when trying to set a managed key', async () => {
    const res = await request(app)
      .put('/applications/app-1/environment')
      .send({ key: 'NEXT_PUBLIC_SUPABASE_URL', value: 'hack' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/managed automatically/);
  });

  it('returns 500 on coolify error', async () => {
    mockPost.mockRejectedValue(new Error('fail'));
    const res = await request(app)
      .put('/applications/app-1/environment')
      .send({ key: 'CUSTOM_VAR', value: 'val' });
    expect(res.status).toBe(500);
  });
});

describe('PUT /applications/:uuid/settings', () => {
  it('patches application settings', async () => {
    const res = await request(app)
      .put('/applications/app-1/settings')
      .send({ git_branch: 'develop' });
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith('/applications/app-1', { git_branch: 'develop' });
  });

  it('returns 500 on error', async () => {
    mockPatch.mockRejectedValue(new Error('fail'));
    const res = await request(app)
      .put('/applications/bad/settings')
      .send({});
    expect(res.status).toBe(500);
  });
});
