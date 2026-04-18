import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { authMiddleware } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
import projectsRoutes from './routes/projects.routes';
import applicationsRoutes from './routes/applications.routes';
import servicesRoutes from './routes/services.routes';
import deploymentsRoutes from './routes/deployments.routes';
import serversRoutes from './routes/servers.routes';
import configRoutes from './routes/config.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 500 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use(express.json());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', apiLimiter, authMiddleware, projectsRoutes);
app.use('/api/applications', apiLimiter, authMiddleware, applicationsRoutes);
app.use('/api/services', apiLimiter, authMiddleware, servicesRoutes);
app.use('/api/deployments', apiLimiter, authMiddleware, deploymentsRoutes);
app.use('/api/servers', apiLimiter, authMiddleware, serversRoutes);
app.use('/api/config', apiLimiter, authMiddleware, configRoutes);

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Vercelify backend running on port ${PORT}`);
});
