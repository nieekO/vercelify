import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import authRouter from '../../routes/auth.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

const SECRET = process.env.JWT_SECRET!;

describe('POST /auth/login', () => {
  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Password required/);
  });

  it('returns 401 for wrong plaintext password', async () => {
    process.env.DASHBOARD_PASSWORD = 'correct-password';
    const res = await request(app).post('/auth/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid password/);
  });

  it('returns token for correct plaintext password (DASHBOARD_PASSWORD)', async () => {
    process.env.DASHBOARD_PASSWORD = 'correct-password';
    const res = await request(app).post('/auth/login').send({ password: 'correct-password' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
    const decoded = jwt.verify(res.body.token, SECRET) as { sub: string };
    expect(decoded.sub).toBe('admin');
  });

  it('uses bcrypt when DASHBOARD_PASSWORD is not set', async () => {
    delete process.env.DASHBOARD_PASSWORD;
    const hash = await bcrypt.hash('my-secret', 10);
    process.env.DASHBOARD_PASSWORD_HASH = hash;

    const res = await request(app).post('/auth/login').send({ password: 'my-secret' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    // restore
    process.env.DASHBOARD_PASSWORD = 'test-password';
    delete process.env.DASHBOARD_PASSWORD_HASH;
  });

  it('returns 401 for wrong bcrypt password', async () => {
    delete process.env.DASHBOARD_PASSWORD;
    const hash = await bcrypt.hash('correct', 10);
    process.env.DASHBOARD_PASSWORD_HASH = hash;

    const res = await request(app).post('/auth/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);

    process.env.DASHBOARD_PASSWORD = 'test-password';
    delete process.env.DASHBOARD_PASSWORD_HASH;
  });

  it('respects JWT_EXPIRES_IN env variable', async () => {
    process.env.DASHBOARD_PASSWORD = 'test-password';
    process.env.JWT_EXPIRES_IN = '1h';
    const res = await request(app).post('/auth/login').send({ password: 'test-password' });
    expect(res.status).toBe(200);
    delete process.env.JWT_EXPIRES_IN;
  });
});

describe('POST /auth/logout', () => {
  it('returns success regardless of auth state', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /auth/verify', () => {
  it('returns valid: false when no Authorization header', async () => {
    const res = await request(app).get('/auth/verify');
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('returns valid: false when Authorization is not Bearer', async () => {
    const res = await request(app).get('/auth/verify').set('Authorization', 'Basic abc');
    expect(res.body.valid).toBe(false);
  });

  it('returns valid: true for a good token', async () => {
    const token = jwt.sign({ sub: 'admin' }, SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/auth/verify').set('Authorization', `Bearer ${token}`);
    expect(res.body.valid).toBe(true);
  });

  it('returns valid: false for an expired token', async () => {
    const token = jwt.sign({ sub: 'admin' }, SECRET, { expiresIn: '-1s' } as jwt.SignOptions);
    const res = await request(app).get('/auth/verify').set('Authorization', `Bearer ${token}`);
    expect(res.body.valid).toBe(false);
  });

  it('returns valid: false for a garbage token', async () => {
    const res = await request(app).get('/auth/verify').set('Authorization', 'Bearer garbage.token.here');
    expect(res.body.valid).toBe(false);
  });
});
