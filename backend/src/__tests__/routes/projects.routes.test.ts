jest.mock('../../services/coolify.service');
jest.mock('../../services/supabase-provision.service');
jest.mock('../../services/projects.service');

import express from 'express';
import request from 'supertest';
import { coolifyPost, coolifyDelete, coolifyGet } from '../../services/coolify.service';
import { provisionSupabase, setAppEnvVars } from '../../services/supabase-provision.service';
import { readProjects, findProject, saveProject, deleteProject } from '../../services/projects.service';
import projectsRouter from '../../routes/projects.routes';

const mockCoolifyPost = coolifyPost as jest.Mock;
const mockCoolifyDelete = coolifyDelete as jest.Mock;
const mockCoolifyGet = coolifyGet as jest.Mock;
const mockProvision = provisionSupabase as jest.Mock;
const mockSetAppEnvVars = setAppEnvVars as jest.Mock;
const mockRead = readProjects as jest.Mock;
const mockFind = findProject as jest.Mock;
const mockSave = saveProject as jest.Mock;
const mockDelete = deleteProject as jest.Mock;

const app = express();
app.use(express.json());
app.use('/projects', projectsRouter);

const FAKE_PROJECT = {
  id: 'test-uuid', name: 'test', environment: 'production', createdAt: '2024-01-01T00:00:00Z',
  coolifyProjectUuid: 'cp', appServiceUuid: 'as', supabaseServiceUuid: 'ss',
  appUrl: 'http://app', supabaseStudioUrl: 'http://studio', supabaseAnonKey: 'anon',
  gitRepo: 'user/test', gitBranch: 'main', buildCommand: 'npm run build',
  outputDir: 'dist', port: 3000, supabaseSchemas: [],
};

beforeEach(() => {
  mockRead.mockReturnValue([FAKE_PROJECT]);
  mockFind.mockReturnValue(FAKE_PROJECT);
  mockSave.mockImplementation(() => {});
  mockDelete.mockReturnValue(true);
  mockCoolifyPost.mockResolvedValue({ uuid: 'new-uuid' });
  mockCoolifyDelete.mockResolvedValue({});
  mockCoolifyGet.mockResolvedValue([]);
  mockProvision.mockResolvedValue({
    serviceUuid: 'svc-uuid', studioUrl: 'http://studio', anonKey: 'anon',
    serviceRoleKey: 'svc', kongUrl: 'http://kong', schemas: ['test'],
  });
  mockSetAppEnvVars.mockResolvedValue(undefined);
});

describe('GET /projects', () => {
  it('returns all projects', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 500 when readProjects throws', async () => {
    mockRead.mockImplementation(() => { throw new Error('fs error'); });
    const res = await request(app).get('/projects');
    expect(res.status).toBe(500);
  });
});

describe('GET /projects/importable', () => {
  it('returns apps not already tracked by Vercelify', async () => {
    const tracked = [FAKE_PROJECT];
    mockRead.mockReturnValue(tracked);
    mockCoolifyGet.mockResolvedValue([
      { uuid: 'as' },          // already tracked → filtered out
      { uuid: 'new-app-uuid' }, // not tracked → included
    ]);
    const res = await request(app).get('/projects/importable');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].uuid).toBe('new-app-uuid');
  });

  it('returns 500 on coolifyGet error', async () => {
    mockCoolifyGet.mockRejectedValue(new Error('api down'));
    const res = await request(app).get('/projects/importable');
    expect(res.status).toBe(500);
  });
});

describe('POST /projects/import', () => {
  it('imports a Coolify app and saves it', async () => {
    const res = await request(app)
      .post('/projects/import')
      .send({ uuid: 'app-uuid', name: 'imported', git_repository: 'https://github.com/user/repo', git_branch: 'main', fqdn: 'myapp.test' });
    expect(res.status).toBe(200);
    expect(res.body.project.name).toBe('imported');
    expect(res.body.project.gitRepo).toBe('user/repo');
    expect(res.body.project.appUrl).toBe('https://myapp.test');
    expect(mockSave).toHaveBeenCalled();
  });

  it('uses https:// prefix for fqdn without protocol', async () => {
    const res = await request(app)
      .post('/projects/import')
      .send({ uuid: 'u', name: 'n', fqdn: 'domain.com' });
    expect(res.body.project.appUrl).toBe('https://domain.com');
  });

  it('keeps existing protocol in fqdn', async () => {
    const res = await request(app)
      .post('/projects/import')
      .send({ uuid: 'u', name: 'n', fqdn: 'http://domain.com' });
    expect(res.body.project.appUrl).toBe('http://domain.com');
  });

  it('handles empty fqdn → empty appUrl', async () => {
    const res = await request(app)
      .post('/projects/import')
      .send({ uuid: 'u', name: 'n' });
    expect(res.body.project.appUrl).toBe('');
  });

  it('returns 400 when uuid is missing', async () => {
    const res = await request(app).post('/projects/import').send({ name: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/projects/import').send({ uuid: 'u' });
    expect(res.status).toBe(400);
  });
});

describe('GET /projects/:id', () => {
  it('returns the found project', async () => {
    const res = await request(app).get('/projects/test-uuid');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('test-uuid');
  });

  it('returns 404 when project not found', async () => {
    mockFind.mockReturnValue(undefined);
    const res = await request(app).get('/projects/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('POST /projects (SSE)', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/projects').send({ name: 'only-name' });
    expect(res.status).toBe(400);
  });

  it('streams SSE events and saves project on success', async () => {
    const res = await request(app)
      .post('/projects')
      .buffer(true)
      .send({
        name: 'myapp', gitRepo: 'user/myapp', gitBranch: 'main',
        environment: 'production', createSupabase: true, port: 3000,
        buildCommand: 'npm run build', outputDir: 'dist',
      });

    expect(res.headers['content-type']).toMatch('text/event-stream');
    expect(res.text).toContain('event: done');
    expect(mockSave).toHaveBeenCalled();
  });

  it('skips supabase when createSupabase is false', async () => {
    const res = await request(app)
      .post('/projects')
      .buffer(true)
      .send({
        name: 'myapp', gitRepo: 'user/myapp', gitBranch: 'main',
        environment: 'production', createSupabase: false,
      });

    expect(res.text).toContain('event: done');
    expect(mockProvision).not.toHaveBeenCalled();
  });

  it('retries with unique name on 422 from Coolify', async () => {
    mockCoolifyPost
      .mockRejectedValueOnce(new Error('Coolify API 422: already exists'))
      .mockResolvedValue({ uuid: 'new-uuid' });

    const res = await request(app)
      .post('/projects')
      .buffer(true)
      .send({ name: 'dup', gitRepo: 'u/r', gitBranch: 'main', environment: 'production', createSupabase: false });

    expect(res.text).toContain('event: done');
    expect(mockCoolifyPost).toHaveBeenCalledTimes(4); // initial fail + retry + application + deploy
  });

  it('streams error event when provisioning fails', async () => {
    mockProvision.mockRejectedValue(new Error('Supabase failed'));

    const res = await request(app)
      .post('/projects')
      .buffer(true)
      .send({ name: 'x', gitRepo: 'u/r', gitBranch: 'main', environment: 'production', createSupabase: true });

    expect(res.text).toContain('event: error');
  });
});

describe('DELETE /projects/:id', () => {
  it('deletes app, supabase service, and project entry', async () => {
    const res = await request(app).delete('/projects/test-uuid');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockCoolifyDelete).toHaveBeenCalledWith('/applications/as');
    expect(mockCoolifyDelete).toHaveBeenCalledWith('/services/ss');
    expect(mockDelete).toHaveBeenCalledWith('test-uuid');
  });

  it('returns 404 when project not found', async () => {
    mockFind.mockReturnValue(undefined);
    const res = await request(app).delete('/projects/missing');
    expect(res.status).toBe(404);
  });

  it('returns 200 even when Coolify deletion throws (errors are swallowed)', async () => {
    mockCoolifyDelete.mockRejectedValue(new Error('delete failed'));
    const res = await request(app).delete('/projects/test-uuid');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 500 when local deleteProject throws', async () => {
    mockDelete.mockImplementation(() => { throw new Error('fs error'); });
    const res = await request(app).delete('/projects/test-uuid');
    expect(res.status).toBe(500);
  });

  it('skips Coolify cleanup for projects with empty service UUIDs', async () => {
    mockFind.mockReturnValue({ ...FAKE_PROJECT, appServiceUuid: '', supabaseServiceUuid: '' });
    const res = await request(app).delete('/projects/test-uuid');
    expect(res.status).toBe(200);
    expect(mockCoolifyDelete).not.toHaveBeenCalled();
  });
});

describe('GET /projects/:id/supabase-keys', () => {
  it('returns anonKey and studioUrl', async () => {
    const res = await request(app).get('/projects/test-uuid/supabase-keys');
    expect(res.status).toBe(200);
    expect(res.body.anonKey).toBe('anon');
    expect(res.body.studioUrl).toBe('http://studio');
  });

  it('returns 404 when project not found', async () => {
    mockFind.mockReturnValue(undefined);
    const res = await request(app).get('/projects/missing/supabase-keys');
    expect(res.status).toBe(404);
  });
});
