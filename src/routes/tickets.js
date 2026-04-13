'use strict';
const router   = require('express').Router();
const jwt      = require('jsonwebtoken');
const mock     = require('../data/mock-tickets');
const density  = require('../services/density');
const { validate }    = require('../middleware/validate');
const { pnrLimiter }  = require('../middleware/rateLimit');
const { NotFoundError } = require('../utils/errors');
const logger   = require('../utils/logger');
// MOCK: replace mock.lookup() with Firestore when MOCK=false:
// const db = require('../services/firestore');
// const snap = await db.collection('tickets').where('pnr','==',pnr).where('phone','==',phone).limit(1).get();
// const ticket = snap.empty ? null : snap.docs[0].data();

router.post('/verify-pnr', pnrLimiter, validate('verifyPNR'), async (req, res, next) => {
  try {
    const { pnr, phone } = req.body;
    const ticket = mock.lookup(pnr, phone);
    if (!ticket) throw new NotFoundError('Ticket not found — check your PNR and phone number.');

    density.checkin(ticket.gate, ticket.stand); // passive crowd sensor

    const token = jwt.sign(
      { pnr: ticket.pnr, gate: ticket.gate, stand: ticket.stand },
      process.env.JWT_SECRET,
      { expiresIn: '12h', issuer: 'venueiq' }
    );

    logger.info('fan checked in', { pnr: ticket.pnr, gate: ticket.gate, stand: ticket.stand });

    res.json({
      success: true,
      fan: {
        name:  ticket.name,
        gate:  ticket.gate,
        stand: ticket.stand,
        block: ticket.block,
        row:   ticket.row,
        seat:  ticket.seat,
        match: 'IND vs AUS · Narendra Modi Stadium · 2 Nov 2024 · 19:30 IST',
      },
      token,
    });
  } catch (err) { next(err); }
});

module.exports = router;