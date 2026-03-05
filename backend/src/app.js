import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import router from './routes/index.js';
import { errorHandler } from './middleware/error.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Security ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'ws:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream:
        process.env.NODE_ENV === 'production'
          ? { write: (msg) => process.stdout.write(JSON.stringify({ log: msg.trim() }) + '\n') }
          : process.stdout,
    })
  );
}

// ─── Cookie Parsing ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Input Sanitization ───────────────────────────────────────────────────────
// Recursively trim all string values in req.body (does NOT strip HTML — React + Prisma handle that)
function trimStrings(obj) {
  if (typeof obj === 'string') return obj.trim();
  if (Array.isArray(obj)) return obj.map(trimStrings);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, trimStrings(v)]));
  }
  return obj;
}
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = trimStrings(req.body);
  next();
});

// ─── Static Files ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
const healthPayload = () => ({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
});
app.get('/health',      (_req, res) => res.json(healthPayload()));
app.get('/api/health',  (_req, res) => res.json(healthPayload()));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', router);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
