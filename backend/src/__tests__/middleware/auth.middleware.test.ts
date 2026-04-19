import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware';

const SECRET = process.env.JWT_SECRET!;

const app = express();
app.use(express.json());
app.use('/protected', authMiddleware, (_req, res) => res.json({ ok: true }));

function makeToken(payload: object = { sub: 'admin' }, expiresIn = '1h') {
  return jwt.sign(payload, SECRET, { expiresIn } as jwt.SignOptions);
}

describe('authMiddleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('calls next() and attaches user for a valid token', async () => {
    const token = makeToken({ sub: 'admin', iat: 1 });
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 401 for an expired token', async () => {
    const token = makeToken({ sub: 'admin' }, '-1s');
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });

  it('returns 401 for a tampered / invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer this.is.invalid');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });
});
