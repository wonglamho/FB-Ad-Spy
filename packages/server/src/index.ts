import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { adsRouter } from './routes/ads';
import { monitorsRouter } from './routes/monitors';
import { collectionsRouter } from './routes/collections';
import { savedAdsRouter } from './routes/savedAds';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { startScheduler } from './jobs/scheduler';
import { prisma } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/ads', adsRouter);
app.use('/api/monitors', monitorsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/saved-ads', savedAdsRouter);

// Error handler
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    // Start background jobs
    startScheduler();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
