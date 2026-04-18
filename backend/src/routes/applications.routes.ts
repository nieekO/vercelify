import { Router, Request, Response } from 'express';
import { coolifyGet, coolifyPost, coolifyPatch } from '../services/coolify.service';

const MANAGED_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

const router = Router();

router.get('/:uuid', async (req, res) => {
  try { res.json(await coolifyGet(`/applications/${req.params.uuid}`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/:uuid/deploy', async (req, res) => {
  try { res.json(await coolifyPost(`/applications/${req.params.uuid}/deploy`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/:uuid/restart', async (req, res) => {
  try { res.json(await coolifyPost(`/applications/${req.params.uuid}/restart`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/:uuid/stop', async (req, res) => {
  try { res.json(await coolifyPost(`/applications/${req.params.uuid}/stop`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get('/:uuid/logs', async (req, res) => {
  try { res.json(await coolifyGet(`/applications/${req.params.uuid}/logs`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get('/:uuid/environment', async (req, res) => {
  try {
    const data = await coolifyGet(`/applications/${req.params.uuid}/environment-variables`);
    const vars = Array.isArray(data) ? data : data?.data || [];
    res.json(vars.map((v: { key: string; [k: string]: unknown }) => ({
      ...v,
      value: '••••••••',
      isManaged: MANAGED_KEYS.includes(v.key),
    })));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.put('/:uuid/environment', async (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (MANAGED_KEYS.includes(key)) {
    res.status(403).json({ error: 'This variable is managed automatically by Vercelify' });
    return;
  }
  try { res.json(await coolifyPost(`/applications/${req.params.uuid}/environment-variables`, { key, value })); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.put('/:uuid/settings', async (req, res) => {
  try { res.json(await coolifyPatch(`/applications/${req.params.uuid}`, req.body)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
