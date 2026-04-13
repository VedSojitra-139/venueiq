'use strict';
const router = require('express').Router();
const { dijkstra, findNearestN } = require('../services/pathfinder');
const { NODES }  = require('../data/stadium-graph');
const density    = require('../services/density');
const { verifyToken } = require('../middleware/auth');
const { ValidationError } = require('../utils/errors');

const POI_TYPES = new Set(['food', 'washroom', 'exit']);

// GET /api/route?from=gate-7&to=stand-c   (exact node)
// GET /api/route?from=gate-7&to=food       (nearest of type)
router.get('/route', verifyToken, (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) throw new ValidationError('from and to query params required');
    if (!NODES[from]) throw new ValidationError(`Unknown node: ${from}`);

    let result;
    if (POI_TYPES.has(to)) {
      result = findNearestN(from, to, 1)[0];
    } else {
      if (!NODES[to]) throw new ValidationError(`Unknown node: ${to}`);
      result = dijkstra(from, to);
    }
    if (!result) return res.status(404).json({ error: 'No path found' });

    const dest = result.path[result.path.length - 1];
    if (to === 'food') result.queueMin = density.getZone(dest)?.queueMin ?? null;

    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/route/alternatives?from=gate-7&type=food  → top 3
router.get('/route/alternatives', verifyToken, (req, res, next) => {
  try {
    const { from, type } = req.query;
    if (!from || !type) throw new ValidationError('from and type required');
    if (!NODES[from]) throw new ValidationError(`Unknown node: ${from}`);
    if (!POI_TYPES.has(type)) throw new ValidationError(`type must be one of: ${[...POI_TYPES].join(', ')}`);

    const results = findNearestN(from, type, 3).map(r => {
      const dest = r.path[r.path.length - 1];
      return {
        ...r,
        destId:    dest,
        destLabel: NODES[dest]?.label,
        queueMin:  type === 'food' ? density.getZone(dest)?.queueMin : undefined,
      };
    });
    res.json(results);
  } catch (err) { next(err); }
});

module.exports = router;