import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import adminRoutes from './routes/adminRoutes.js';
import aiClassificationRoutes from './routes/aiClassificationRoutes.js';
import dealRoutes from './routes/dealRoutes.js';

export function createApp() {
  const app = express();
  app.use(cors({
    origin(origin, callback) {
      const allowedOrigins = [
        env.clientUrl,
        'capacitor://localhost',
        'http://localhost',
        'https://localhost',
        'http://localhost:5173',
        'https://salmon-rational-lynx.ngrok-free.app'
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
  }));
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/deals', dealRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin/ai', aiClassificationRoutes);
  app.use((error, _req, res, _next) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || 'Server error' });
  });
  return app;
}
