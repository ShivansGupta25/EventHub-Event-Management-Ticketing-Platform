import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { prisma } from './db.js';
import { HttpError, errorHandler } from './lib/errors.js';
import authRoutes from './routes/auth.route.js';
import adminRoutes from './routes/admin.route.js';
import organizerRoutes from './routes/organizer.route.js';
import eventRoutes from './routes/event.route.js';
import bookingRoutes from './routes/booking.route.js';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

app.use('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));

app.get('/api/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ready' } });
  } catch {
    res.status(503).json({
      error: { code: 'NOT_READY', message: 'Not ready.', fields: {} },
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', bookingRoutes);

app.use('/api', () => {
  throw new HttpError(404, 'NOT_FOUND', 'Route not found.');
});

app.use(errorHandler);

export default app;
