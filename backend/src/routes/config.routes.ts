import { Router } from 'express';
import { coolifyGet } from '../services/coolify.service';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    coolifyApiUrl: process.env.COOLIFY_API_URL,
    infraServerUuid: process.env.COOLIFY_INFRA_SERVER_UUID,
    appsServerUuid: process.env.COOLIFY_APPS_SERVER_UUID,
  });
});

router.put('/', (_req, res) => {
  res.json({ success: true, message: 'Config updates require server restart' });
});

router.post('/test-connection', async (_req, res) => {
  try {
    const data = await coolifyGet('/version');
    res.json({ success: true, version: data });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
