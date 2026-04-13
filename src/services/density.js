'use strict';
const { NODES } = require('../data/stadium-graph');
const logger    = require('../utils/logger');

const ALERT_THRESHOLDS = { HIGH: 0.70, CRITICAL: 0.90 };

// State — keyed by node ID
const state = new Map();

const init = () => {
  Object.entries(NODES).forEach(([id, n]) => {
    if (n.type === 'stand') {
      state.set(id, {
        label:    n.label,
        capacity: n.capacity,
        current:  Math.floor(Math.random() * n.capacity * 0.25),
        alerts:   new Set(),
      });
    }
    if (n.type === 'food') {
      state.set(id, { label: n.label, queueMin: n.queueBase + Math.floor(Math.random() * 4) });
    }
    if (n.type === 'gate') {
      state.set(id, { label: n.label, throughput: 0 });
    }
  });
};

const _evaluateAlerts = (id) => {
  const z = state.get(id);
  if (!z?.capacity) return;
  const pct = z.current / z.capacity;
  if (pct >= ALERT_THRESHOLDS.CRITICAL && !z.alerts.has('CRITICAL')) {
    z.alerts.add('CRITICAL');
    logger.warn('CRITICAL density alert', { standId: id, pct: Math.round(pct * 100) });
  } else if (pct >= ALERT_THRESHOLDS.HIGH && !z.alerts.has('HIGH')) {
    z.alerts.add('HIGH');
    logger.warn('HIGH density alert', { standId: id, pct: Math.round(pct * 100) });
  }
};

/** Called on every fan check-in. Passive crowd sensing. */
const checkin = (gateId, standId) => {
  const stand = state.get(standId);
  if (stand?.capacity !== undefined)
    stand.current = Math.min(stand.current + 1, stand.capacity);
  const gate = state.get(gateId);
  if (gate) gate.throughput = (gate.throughput ?? 0) + 1;
  _evaluateAlerts(standId);
};

/** For demo surge button — bumps a stand to 92% */
const forceSurge = (standId) => {
  const z = state.get(standId);
  if (!z?.capacity) throw new Error(`Unknown stand: ${standId}`);
  z.current = Math.floor(z.capacity * 0.92);
  _evaluateAlerts(standId);
};

const getColour = (id) => {
  const z = state.get(id);
  if (!z?.capacity) return 'green';
  const pct = z.current / z.capacity;
  if (pct >= 0.90) return 'critical';
  if (pct >= 0.70) return 'red';
  if (pct >= 0.40) return 'amber';
  return 'green';
};

const getAll  = () => Object.fromEntries(state);
const getZone = (id) => state.get(id) ?? null;

/** Simulate live crowd drift — 10s ticks */
const startSimulator = () => {
  const timer = setInterval(() => {
    state.forEach((z, id) => {
      if (NODES[id]?.type === 'stand') {
        z.current = Math.max(0, Math.min(z.current + (Math.floor(Math.random() * 6) - 1), z.capacity));
        _evaluateAlerts(id);
      }
      if (NODES[id]?.type === 'food') {
        z.queueMin = Math.max(1, z.queueMin + (Math.random() > 0.5 ? 1 : -1));
      }
    });
  }, 10_000);
  // Don't block process exit in tests
  if (timer.unref) timer.unref();
};

init();
module.exports = { checkin, forceSurge, getAll, getZone, getColour, startSimulator };