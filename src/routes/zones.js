'use strict';
const router  = require('express').Router();
const density = require('../services/density');
const { verifyOps } = require('../middleware/auth');
const { validate }  = require('../middleware/validate');
const { NODES }     = require('../data/stadium-graph');

// Public — fan app needs this to show heatmap hints
router.get('/zones', (req, res) => {
  const raw = density.getAll();
  const zones = Object.entries(raw).map(([id, z]) => ({
    id,
    ...z,
    alerts: z.alerts ? [...z.alerts] : [],
    colour: density.getColour(id),
    pct:    z.capacity ? Math.round((z.current / z.capacity) * 100) : null,
  }));
  res.json(zones);
});

// Ops only — force surge for demo
router.post('/zones/surge', verifyOps, validate('surgTest'), (req, res, next) => {
  try {
    const { standId } = req.body;
    density.forceSurge(standId);
    res.json({ ok: true, standId, pct: 92, message: `${NODES[standId]?.label} surged to 92%` });
  } catch (err) { next(err); }
});

module.exports = router;