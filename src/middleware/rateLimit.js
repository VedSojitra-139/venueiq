const rateLimit = require('express-rate-limit');

// Tight limit on AI chat — matches Gemini's 15 req/min free tier
const chatLimiter = rateLimit({
  windowMs: 60_000,
  max: 12, // leave 3 req headroom for retries
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment.' },
});

// PNR verification — prevent brute-force enumeration
const pnrLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { error: 'Too many verification attempts. Please try again shortly.' },
});

const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: { error: 'Rate limit exceeded.' },
});

module.exports = { chatLimiter, pnrLimiter, generalLimiter };