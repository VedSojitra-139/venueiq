'use strict';
const router  = require('express').Router();
const mock    = require('../data/mock-tickets');
const density = require('../services/density');
const { verifyOps } = require('../middleware/auth');

// GET /api/admin/tickets — list all tickets (ops only)
router.get('/admin/tickets', verifyOps, (req, res) => {
  // MOCK: real version queries Firestore 'tickets' collection
  res.json(mock.getAll());
});

// GET /api/admin/summary — high-level event summary
router.get('/admin/summary', verifyOps, (req, res) => {
  const zones = density.getAll();
  const stands = Object.entries(zones).filter(([id]) => id.startsWith('stand'));
  const totalCurrent  = stands.reduce((s, [, z]) => s + (z.current ?? 0), 0);
  const totalCapacity = stands.reduce((s, [, z]) => s + (z.capacity ?? 0), 0);
  const busiest = stands.sort(([, a], [, b]) => (b.current/b.capacity) - (a.current/a.capacity))[0];
  const alerts  = stands.filter(([, z]) => z.alerts?.size > 0).map(([id, z]) => ({ id, alerts: [...z.alerts] }));

  res.json({
    totalCheckedIn: totalCurrent,
    totalCapacity,
    avgOccupancyPct: Math.round((totalCurrent / totalCapacity) * 100),
    busiestStand: busiest ? { id: busiest[0], ...busiest[1] } : null,
    activeAlerts: alerts,
  });
});

module.exports = router;