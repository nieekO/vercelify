import { Router } from 'express';
import { coolifyGet } from '../services/coolify.service';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const app = req.query.app ? `&application_id=${req.query.app}` : '';
    res.json(await coolifyGet(`/deployments?per_page=${limit}${app}`));
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

router.get('/:uuid', async (req, res) => {
  try { res.json(await coolifyGet(`/deployments/${req.params.uuid}`)); }
  catch (err) { res.status(500).json({ error: String(err) }); }
});

export default router;
