import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { readProjects, findProject, saveProject, deleteProject } from '../services/projects.service';
import { provisionSupabase, setAppEnvVars } from '../services/supabase-provision.service';
import { coolifyGet, coolifyPost, coolifyDelete } from '../services/coolify.service';
import { CreateProjectRequest, VercelifyProject } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    res.json(readProjects());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/importable', async (_req: Request, res: Response) => {
  try {
    const existing = readProjects();
    const existingUuids = new Set(existing.map(p => p.appServiceUuid).filter(Boolean));
    const data = await coolifyGet('/applications');
    const apps: Array<{ uuid: string }> = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data || [];
    res.json(apps.filter(app => !existingUuids.has(app.uuid)));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/import', (req: Request, res: Response) => {
  const app = req.body as {
    uuid?: string; name?: string; git_repository?: string;
    git_branch?: string; project_uuid?: string; fqdn?: string;
  };
  if (!app.uuid || !app.name) {
    res.status(400).json({ error: 'uuid and name are required' });
    return;
  }
  const rawFqdn = app.fqdn || '';
  const appUrl = rawFqdn ? (rawFqdn.startsWith('http') ? rawFqdn : `https://${rawFqdn}`) : '';
  const project: VercelifyProject = {
    id: randomUUID(),
    name: app.name,
    environment: 'production',
    createdAt: new Date().toISOString(),
    coolifyProjectUuid: app.project_uuid || '',
    appServiceUuid: app.uuid,
    supabaseServiceUuid: '',
    appUrl,
    supabaseStudioUrl: '',
    supabaseAnonKey: '',
    gitRepo: (app.git_repository || '').replace('https://github.com/', ''),
    gitBranch: app.git_branch || 'main',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    port: 3000,
    supabaseSchemas: [],
  };
  saveProject(project);
  res.json({ project });
});

router.get('/:id', (req: Request, res: Response) => {
  const project = findProject(req.params['id'] as string);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  res.json(project);
});

router.post('/', async (req: Request, res: Response) => {
  const body: CreateProjectRequest = req.body;
  if (!body.name || !body.gitRepo || !body.gitBranch) {
    res.status(400).json({ error: 'name, gitRepo, gitBranch are required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (event: string, data: unknown) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    send('status', { step: 1, message: 'Creating Coolify project...' });

    // Retry with timestamp suffix if name already exists in Coolify (422)
    let coolifyProject: { uuid: string };
    try {
      coolifyProject = await coolifyPost('/projects', {
        name: body.name,
        description: `Managed by Vercelify — ${body.environment}`,
      });
    } catch (err) {
      if (String(err).includes('422')) {
        const uniqueName = `${body.name}-${Date.now().toString(36)}`;
        coolifyProject = await coolifyPost('/projects', {
          name: uniqueName,
          description: `Managed by Vercelify — ${body.environment}`,
        });
      } else { throw err; }
    }
    const coolifyProjectUuid: string = coolifyProject.uuid;

    send('status', { step: 2, message: 'Connecting GitHub repository...' });

    const appResult = await coolifyPost('/applications', {
      project_uuid: coolifyProjectUuid,
      server_uuid: process.env.COOLIFY_APPS_SERVER_UUID,
      environment_name: 'production',
      git_repository: `https://github.com/${body.gitRepo}`,
      git_branch: body.gitBranch,
      build_pack: 'dockerfile',
      name: body.name,
      ports_exposes: String(body.port || 3000),
      instant_deploy: false,
    });
    const appServiceUuid: string = appResult.uuid;

    let supabaseServiceUuid = '';
    let studioUrl = '';
    let anonKey = '';
    let serviceRoleKey = '';
    let kongUrl = '';
    let supabaseSchemas: string[] = [];

    if (body.createSupabase !== false) {
      send('status', { step: 3, message: 'Deploying Supabase instance...' });
      const supabase = await provisionSupabase(body.name, body.environment, (msg) =>
        send('status', { step: 3, message: msg })
      );
      supabaseServiceUuid = supabase.serviceUuid;
      studioUrl = supabase.studioUrl;
      anonKey = supabase.anonKey;
      serviceRoleKey = supabase.serviceRoleKey;
      kongUrl = supabase.kongUrl;
      supabaseSchemas = supabase.schemas;

      send('status', { step: 4, message: 'Configuring environment variables...' });
      await setAppEnvVars(appServiceUuid, kongUrl, anonKey, serviceRoleKey);
    }

    send('status', { step: 5, message: 'Starting app deployment...' });
    await coolifyPost(`/applications/${appServiceUuid}/deploy`).catch(() => null);

    const project: VercelifyProject = {
      id: randomUUID(),
      name: body.name,
      environment: body.environment,
      createdAt: new Date().toISOString(),
      coolifyProjectUuid,
      appServiceUuid,
      supabaseServiceUuid,
      appUrl: `http://178.104.195.24`,
      supabaseStudioUrl: studioUrl,
      supabaseAnonKey: anonKey,
      gitRepo: body.gitRepo,
      gitBranch: body.gitBranch,
      buildCommand: body.buildCommand || 'npm run build',
      outputDir: body.outputDir || 'dist',
      port: body.port || 3000,
      supabaseSchemas,
    };

    saveProject(project);
    send('done', { project });
    res.end();
  } catch (err) {
    send('error', { message: String(err) });
    res.end();
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const project = findProject(id);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }

  try {
    if (project.appServiceUuid)
      await coolifyDelete(`/applications/${project.appServiceUuid}`).catch(() => null);
    if (project.supabaseServiceUuid)
      await coolifyDelete(`/services/${project.supabaseServiceUuid}`).catch(() => null);
    deleteProject(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id/supabase-keys', (req: Request, res: Response) => {
  const project = findProject(req.params['id'] as string);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  res.json({ anonKey: project.supabaseAnonKey, studioUrl: project.supabaseStudioUrl });
});

export default router;
