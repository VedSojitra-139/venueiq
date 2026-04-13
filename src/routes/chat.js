'use strict';
const router = require('express').Router();
const gemini = require('../services/gemini');
const { validate }    = require('../middleware/validate');
const { chatLimiter } = require('../middleware/rateLimit');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

router.post('/chat', verifyToken, chatLimiter, validate('chat'), async (req, res, next) => {
  try {
    const { sessionId, message } = req.body;
    const sid = sessionId ?? req.fan?.pnr ?? req.ip;
    const reply = await gemini.chat(sid, message);
    res.json({ reply });
  } catch (err) {
    // Gemini 429 — degrade gracefully, don't crash
    if (err.message?.includes('429')) {
      logger.warn('Gemini rate limited');
      return res.json({ reply: "I'm a little busy right now — please try again in a moment!" });
    }
    next(err);
  }
});

module.exports = router;