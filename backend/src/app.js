import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import priceRoutes from './routes/prices.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({limit: '50kb'}));
app.use('/api/auth', rateLimit({windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false}));

app.get('/api/health', (_req, res) => res.json({status: 'ok', app: 'PricePulse API'}));
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', priceRoutes);
app.use('/api/admin', adminRoutes);
app.use((_req, _res, next) => { const e = new Error('Route not found.'); e.status = 404; next(e); });

// Express 5 forwards errors from async route handlers automatically.
app.use((err, _req, res, _next) => {
  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) console.error('API error:', err);
  res.status(status).json({error: status >= 500 ? 'Internal server error.' : err.message});
});
export default app;
