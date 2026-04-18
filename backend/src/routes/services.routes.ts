import { Router } from 'express';
import { coolifyGet, coolifyPost } from '../services/coolify.service';

const router = Router();

router.get('/', async (_req, res) => {
  try { res.json(await coolifyGet('/services')); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get('/:uuid', async (req, res) => {
  try { res.json(await coolifyGet(`/services/${req.params.uuid}`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/:uuid/restart', async (req, res) => {
  try { res.json(await coolifyPost(`/services/${req.params.uuid}/restart`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

router.post('/:uuid/stop', async (req, res) => {
  try { res.json(await coolifyPost(`/services/${req.params.uuid}/stop`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
