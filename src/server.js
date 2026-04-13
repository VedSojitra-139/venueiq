'use strict';
require('dotenv').config();
const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const helmet     = require('helmet');
const cors       = require('cors');
const density    = require('./services/density');
const { generalLimiter } = require('./middleware/rateLimit');
const { AppError }       = require('./utils/errors');
const logger     = require('./utils/logger');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

// ── Security headers (Benchmark: Security) ──────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"], // needed for inline JS in HTML files
      styleSrc:   ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'wss:', 'ws:'],
      imgSrc:     ["'self'", 'data:'],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://YOUR_FIREBASE_URL.web.app']
    : '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '16kb' })); // prevent payload bombs
app.use(generalLimiter);
app.use(express.static('public', {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

// ── Routes ───────────────────────────────────────────────────
app.use('/api', require('./routes/tickets'));
app.use('/api', require('./routes/routing'));
app.use('/api', require('./routes/zones'));
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/admin'));

// Health check — required by Cloud Run
app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Centralised error handler ────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.statusCode ?? 500;
  const code   = err.code       ?? 'INTERNAL_ERROR';
  if (!err.isOperational) logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(status).json({ error: err.message, code });
});

// ── WebSocket — broadcast density updates every 10s ──────────
wss.on('connection', (ws, req) => {
  logger.info('ws client connected', { ip: req.socket.remoteAddress });
  ws.send(JSON.stringify({ type: 'init', zones: density.getAll() }));
  ws.on('error', (e) => logger.error('ws error', { message: e.message }));
});

const broadcast = (data) => {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
};

const broadcastTimer = setInterval(
  () => broadcast({ type: 'zone_update', zones: density.getAll() }),
  10_000
);

density.startSimulator();

// ── Graceful shutdown (Cloud Run sends SIGTERM before kill) ──
const shutdown = () => {
  logger.info('shutting down');
  clearInterval(broadcastTimer);
  wss.close(() => server.close(() => process.exit(0)));
  setTimeout(() => process.exit(1), 5000); // force exit safety net
};
process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);

const PORT = parseInt(process.env.PORT ?? '3000', 10);
server.listen(PORT, () => logger.info(`VenueIQ running`, { port: PORT, env: process.env.NODE_ENV }));

module.exports = { app, server }; // export for tests