import { describe, it, expect } from 'vitest';
import { formatMoney } from '../formatMoney';

describe('formatMoney', () => {
  it('formats positive amounts correctly', () => {
    expect(formatMoney(100)).toBe('$100.00');
    expect(formatMoney(1234.56)).toBe('$1,234.56');
  });

  it('formats zero correctly', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('formats negative amounts correctly', () => {
    expect(formatMoney(-50.25)).toBe('-$50.25');
  });

  it('rounds to two decimal places', () => {
    expect(formatMoney(10.999)).toBe('$11.00');
    expect(formatMoney(10.001)).toBe('$10.00');
  });

  it('handles large numbers with proper comma separation', () => {
    expect(formatMoney(1000000)).toBe('$1,000,000.00');
  });
});
