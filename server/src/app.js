import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import zoneRoutes from './routes/zone.routes.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import needRoutes from './routes/need.routes.js';
import offerRoutes from './routes/offer.routes.js';
import matchRoutes from './routes/match.routes.js';
import collaborationRoutes from './routes/collaboration.routes.js';
import moderationRoutes from './routes/moderation.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Helmet HTTP security headers
  app.use(helmet());

  // CORS configuration allowing credentials for cookies
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin || origin === allowedOrigin || origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }
        callback(new Error('Blocked by CORS policy'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request size limits and body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Cookie parsing for HttpOnly auth cookies
  app.use(cookieParser());

  // Basic rate limiter (200 requests per 15 minutes)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });
  app.use('/api', limiter);

  // Safe request logging (no passwords or credentials logged)
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      service: 'DropZone API',
      version: '2.0.0',
      status: 'running',
      concept: 'Need-to-Action Network',
      theme: 'SAMARTHA Hackathon | Where Indian Ingenuity Meets AI',
    });
  });

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/zones', zoneRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/needs', needRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/matches', matchRoutes);
  app.use('/api/collaborations', collaborationRoutes);
  app.use('/api/moderation', moderationRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // 404 & Centralized Error Handlers
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
