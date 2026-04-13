'use strict';
// Re-require fresh module for each test group to avoid state bleed
let density;
beforeEach(() => {
  jest.resetModules();
  density = require('../src/services/density');
});

describe('density service', () => {
  test('getAll returns an object with stand entries', () => {
    const all = density.getAll();
    expect(Object.keys(all).some(k => k.startsWith('stand'))).toBe(true);
  });

  test('getZone returns data for a known stand', () => {
    const z = density.getZone('stand-c');
    expect(z).not.toBeNull();
    expect(z.capacity).toBe(2200);
    expect(z.current).toBeGreaterThanOrEqual(0);
  });

  test('getZone returns null for unknown ID', () => {
    expect(density.getZone('stand-z')).toBeNull();
  });

  test('checkin increments stand occupancy', () => {
    const before = density.getZone('stand-c').current;
    density.checkin('gate-7', 'stand-c');
    expect(density.getZone('stand-c').current).toBe(before + 1);
  });

  test('checkin does not exceed capacity', () => {
    const z = density.getZone('stand-c');
    // Fill to capacity
    for (let i = 0; i < z.capacity + 10; i++) density.checkin('gate-7', 'stand-c');
    expect(density.getZone('stand-c').current).toBe(z.capacity);
  });

  test('forceSurge sets stand to 92%', () => {
    density.forceSurge('stand-c');
    const z = density.getZone('stand-c');
    expect(z.current / z.capacity).toBeCloseTo(0.92, 1);
  });

  test('forceSurge throws for unknown stand', () => {
    expect(() => density.forceSurge('stand-z')).toThrow();
  });

  test('getColour returns green for low occupancy', () => {
    const z = density.getZone('stand-c');
    z.current = Math.floor(z.capacity * 0.1);
    expect(density.getColour('stand-c')).toBe('green');
  });

  test('getColour returns critical at 90%+', () => {
    density.forceSurge('stand-c');
    expect(density.getColour('stand-c')).toBe('critical');
  });
});