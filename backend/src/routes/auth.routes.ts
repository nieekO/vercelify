import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts' },
});

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Password required' });
    return;
  }

  const hash = process.env.DASHBOARD_PASSWORD_HASH!;
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  const token = jwt.sign({ sub: 'admin' }, process.env.JWT_SECRET!, { expiresIn } as jwt.SignOptions);
  const decoded = jwt.decode(token) as { exp: number };

  res.json({ token, expiresAt: new Date(decoded.exp * 1000).toISOString() });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

router.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ valid: false });
    return;
  }
  try {
    jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!);
    res.json({ valid: true });
  } catch {
    res.json({ valid: false });
  }
});

export default router;
