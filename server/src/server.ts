import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import path from 'path';

// Security & Config
import { helmetConfig, apiLimiter, corsOptions, trustProxy } from './config/security';
import logger from './config/logger';

// Routes
import authRoutes from './routes/authRoutes';
import reportRoutes from './routes/reportRoutes';
import templateRoutes from './routes/templateRoutes';
import adminRoutes from './routes/adminRoutes';
import processingProfileRoutes from './routes/processingProfileRoutes';
import campaignRoutes from './routes/campaignRoutes';
import agentRoutes from './routes/agentRoutes';
import comparisonRoutes from './routes/comparisonRoutes';
import scheduledReportRoutes from './routes/scheduledReportRoutes';
import reportDesignerRoutes from './routes/reportDesignerRoutes';
import formulaRoutes from './routes/formulaRoutes';
import kpiRoutes from './routes/kpiRoutes';
import teamRoutes from './routes/teamRoutes';
import settingsRoutes from './routes/settingsRoutes';
import storageRoutes from './routes/storageRoutes';
import activityRoutes from './routes/activityRoutes';
import { logRoutes, verifyRequiredRoutes } from './utils/routeTest';

// Services
import { MonitoringService } from './services/MonitoringService';
import prisma from './config/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const monitoringService = new MonitoringService(prisma);

// Trust proxy
if (trustProxy) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmetConfig);
app.use(compression());

// CORS
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting for API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profiles', processingProfileRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/scheduled-reports', scheduledReportRoutes);
app.use('/api/report-designer', reportDesignerRoutes);
app.use('/api/formulas', formulaRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/activity', activityRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const health = await monitoringService.getSystemHealth();
    res.json({
      status: 'success',
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MIS Report Extractor API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      reports: '/api/reports',
      dashboard: '/api/dashboard',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.url,
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, url: req.url, method: req.method });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await prisma.$disconnect();
    logger.info('Database connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✓ Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
      logger.info(`📊 Health check: GET /api/health`);
      
      // Log all registered routes in development
      if (process.env.NODE_ENV === 'development') {
        logRoutes(app);
        const verification = verifyRequiredRoutes(app);
        
        if (!verification.allFound) {
          logger.warn('⚠️  Some required routes are missing!');
        } else {
          logger.info('✅ All required routes are registered');
        }
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
