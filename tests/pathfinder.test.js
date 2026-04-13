'use strict';
const { dijkstra, findNearest, findNearestN } = require('../src/services/pathfinder');
const { NODES } = require('../src/data/stadium-graph');

describe('dijkstra', () => {
  test('returns null for unknown start node', () => {
    expect(dijkstra('fake-node', 'stand-c')).toBeNull();
  });

  test('returns trivial path when start === end', () => {
    const r = dijkstra('gate-7', 'gate-7');
    expect(r.path).toEqual(['gate-7']);
    expect(r.totalMetres).toBe(0);
    expect(r.walkMinutes).toBe(0);
  });

  test('returns valid path from gate-7 to stand-c', () => {
    const r = dijkstra('gate-7', 'stand-c');
    expect(r).not.toBeNull();
    expect(r.path[0]).toBe('gate-7');
    expect(r.path[r.path.length - 1]).toBe('stand-c');
    expect(r.totalMetres).toBeGreaterThan(0);
    expect(r.walkMinutes).toBeGreaterThanOrEqual(1);
  });

  test('path only contains valid node IDs', () => {
    const r = dijkstra('gate-1', 'stand-e');
    r.path.forEach(id => expect(NODES[id]).toBeDefined());
  });

  test('path is optimal — gate-7 to stand-c is shorter than gate-1 to stand-c', () => {
    const near = dijkstra('gate-7', 'stand-c');
    const far  = dijkstra('gate-1', 'stand-c');
    expect(near.totalMetres).toBeLessThan(far.totalMetres);
  });

  test('steps array has label and type for each node', () => {
    const r = dijkstra('gate-3', 'stand-b');
    r.steps.forEach(s => {
      expect(s.id).toBeDefined();
      expect(s.label).toBeDefined();
      expect(s.type).toBeDefined();
    });
  });
});

describe('findNearest', () => {
  test('finds nearest food stall from gate-7', () => {
    const r = findNearest('gate-7', 'food');
    expect(r).not.toBeNull();
    const dest = r.path[r.path.length - 1];
    expect(NODES[dest].type).toBe('food');
  });

  test('finds nearest washroom', () => {
    const r = findNearest('stand-c', 'washroom');
    expect(r).not.toBeNull();
    expect(NODES[r.path.at(-1)].type).toBe('washroom');
  });

  test('finds nearest emergency exit', () => {
    const r = findNearest('stand-a', 'exit');
    expect(NODES[r.path.at(-1)].type).toBe('exit');
  });

  test('returns null for unreachable type', () => {
    expect(findNearest('gate-1', 'nonexistent_type')).toBeNull();
  });
});

describe('findNearestN', () => {
  test('returns at most N results', () => {
    const r = findNearestN('gate-5', 'food', 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });

  test('results are sorted by distance ascending', () => {
    const r = findNearestN('gate-7', 'food', 3);
    for (let i = 1; i < r.length; i++) {
      expect(r[i].totalMetres).toBeGreaterThanOrEqual(r[i-1].totalMetres);
    }
  });
});