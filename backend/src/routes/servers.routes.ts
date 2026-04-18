import { Router } from 'express';
import { coolifyGet, coolifyPost, coolifyPatch } from '../services/coolify.service';

const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await coolifyGet('/servers')); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get('/:uuid', async (req, res) => {
  try {
    const [server, resources] = await Promise.all([
      coolifyGet(`/servers/${req.params.uuid}`),
      coolifyGet(`/servers/${req.params.uuid}/resources`).catch(() => []),
    ]);
    res.json({ ...server, resources });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.put('/:uuid', async (req, res) => {
  try { res.json(await coolifyPatch(`/servers/${req.params.uuid}`, req.body)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/:uuid/validate', async (req, res) => {
  try { res.json(await coolifyPost(`/servers/${req.params.uuid}/validate`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
