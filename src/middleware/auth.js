
// ── src/middleware/auth.js ───────────────────────────────────
const jwt = require('jsonwebtoken');
const { AuthError } = require('../utils/errors');

const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return next(new AuthError('Missing or malformed Authorization header'));
  try {
    req.fan = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
};

// Ops dashboard: simple password check via header X-Ops-Key
const verifyOps = (req, res, next) => {
  if (req.headers['x-ops-key'] !== process.env.OPS_PASSWORD)
    return next(new AuthError('Invalid ops key'));
  next();
};

module.exports = { verifyToken, verifyOps };