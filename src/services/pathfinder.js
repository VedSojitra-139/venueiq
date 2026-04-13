'use strict';
const { NODES, buildGraph } = require('../data/stadium-graph');

const GRAPH = buildGraph(); // built once at startup
const WALK_SPEED_MPS = 1.3; // metres per second (~80m/min)

/**
 * Returns shortest path between two node IDs.
 * @returns {{ path, totalMetres, walkSeconds, walkMinutes, steps } | null}
 */
const dijkstra = (start, end) => {
  if (!NODES[start] || !NODES[end]) return null;
  if (start === end) return { path:[start], totalMetres:0, walkSeconds:0, walkMinutes:0, steps:[{ id:start, label:NODES[start].label, type:NODES[start].type }] };

  const dist = {}, prev = {}, visited = new Set();
  Object.keys(NODES).forEach(n => (dist[n] = Infinity));
  dist[start] = 0;

  // Simple binary-heap substitute using sorted array (sufficient at this graph size)
  const pq = [{ node: start, d: 0 }];

  while (pq.length) {
    pq.sort((a, b) => a.d - b.d);
    const { node: cur } = pq.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === end) break;

    for (const { node: nb, dist: w } of (GRAPH[cur] ?? [])) {
      const nd = dist[cur] + w;
      if (nd < dist[nb]) {
        dist[nb] = nd; prev[nb] = cur;
        pq.push({ node: nb, d: nd });
      }
    }
  }

  if (dist[end] === Infinity) return null;

  // Reconstruct path
  const path = [];
  for (let c = end; c; c = prev[c]) path.unshift(c);
  if (path[0] !== start) return null;

  const totalMetres  = Math.round(dist[end]);
  const walkSeconds  = Math.round(totalMetres / WALK_SPEED_MPS);
  const walkMinutes  = Math.ceil(walkSeconds / 60);

  return {
    path,
    totalMetres,
    walkSeconds,
    walkMinutes,
    steps: path.map(id => ({ id, label: NODES[id].label, type: NODES[id].type })),
  };
};

/**
 * Returns shortest path to the nearest node of a given type.
 */
const findNearest = (from, type) => {
  const targets = Object.keys(NODES).filter(n => NODES[n].type === type);
  return targets
    .map(t => dijkstra(from, t))
    .filter(Boolean)
    .sort((a, b) => a.totalMetres - b.totalMetres)[0] ?? null;
};

/**
 * Returns top-N nearest nodes of a given type.
 */
const findNearestN = (from, type, n = 3) => {
  const targets = Object.keys(NODES).filter(id => NODES[id].type === type);
  return targets
    .map(t => dijkstra(from, t))
    .filter(Boolean)
    .sort((a, b) => a.totalMetres - b.totalMetres)
    .slice(0, n);
};

module.exports = { dijkstra, findNearest, findNearestN };