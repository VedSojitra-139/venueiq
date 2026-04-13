'use strict';
const { lookup, getAll } = require('../src/data/mock-tickets');

describe('mock-tickets lookup', () => {
  test('returns ticket for valid PNR + phone', () => {
    const t = lookup('IND2024001', '9999999999');
    expect(t).not.toBeNull();
    expect(t.name).toBe('Arjun Mehta');
    expect(t.gate).toBe('gate-7');
  });

  test('is case-insensitive on PNR', () => {
    expect(lookup('ind2024001', '9999999999')).not.toBeNull();
  });

  test('returns null for wrong phone', () => {
    expect(lookup('IND2024001', '1111111111')).toBeNull();
  });

  test('returns null for unknown PNR', () => {
    expect(lookup('FAKE99999', '9999999999')).toBeNull();
  });

  test('getAll returns array of 20 tickets', () => {
    expect(getAll()).toHaveLength(20);
  });

  test('getAll returns a copy — mutation does not affect internal data', () => {
    const tickets = getAll();
    tickets[0].name = 'HACKED';
    expect(lookup('IND2024001', '9999999999').name).toBe('Arjun Mehta');
  });
});