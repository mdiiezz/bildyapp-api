import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import { join } from 'node:path';
import { config } from './config/index.js';
import { swaggerSpecs } from './config/swagger.js';
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const sanitizeNoSQL = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
        continue;
      }
      if (typeof obj[key] === 'object') sanitizeObject(obj[key]);
    }
    return obj;
  };
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  next();
};

app.use(sanitizeNoSQL);

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'test' ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'Demasiadas peticiones. Inténtalo más tarde.',
    code: 'RATE_LIMIT'
  }
}));

app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

//Prueba Slack
if (config.nodeEnv === 'development') {
  app.get('/debug/error-500', (req, res, next) => {
    next(new Error('Prueba de error 5XX para Slack'));
  });
}
//

app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
