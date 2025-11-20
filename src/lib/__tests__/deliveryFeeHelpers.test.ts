import { describe, it, expect } from 'vitest';
import {
  calculateRevenueSplit,
  FLAT_DELIVERY_FEE,
  calculateDriverPayout,
} from '../deliveryFeeHelpers';

describe('calculateRevenueSplit', () => {
  it('always splits 85/5/10 (farmer/lead/platform)', () => {
    const split = calculateRevenueSplit(100.00);
    expect(split.farmerShare).toBe(85.00);
    expect(split.leadFarmerShare).toBe(5.00);
    expect(split.platformFee).toBe(10.00);
  });

  it('total always equals input', () => {
    const split = calculateRevenueSplit(127.45);
    const total = split.farmerShare + split.leadFarmerShare + split.platformFee;
    expect(total).toBeCloseTo(127.45, 2);
  });

  it('maintains correct proportions for various amounts', () => {
    const testAmounts = [50, 75, 150, 250, 1000];
    
    testAmounts.forEach(amount => {
      const split = calculateRevenueSplit(amount);

      expect(split.farmerShare).toBeCloseTo(amount * 0.85, 2);
      expect(split.leadFarmerShare).toBeCloseTo(amount * 0.05, 2);
      expect(split.platformFee).toBeCloseTo(amount * 0.10, 2);
      
      // Verify total
      const total = split.farmerShare + split.leadFarmerShare + split.platformFee;
      expect(total).toBeCloseTo(amount, 2);
    });
  });

  it('farmer always receives largest share', () => {
    const split = calculateRevenueSplit(100.00);
    expect(split.farmerShare).toBeGreaterThan(split.platformFee);
    expect(split.farmerShare).toBeGreaterThan(split.leadFarmerShare);
  });

  it('handles edge cases', () => {
    const zeroSplit = calculateRevenueSplit(0);
    expect(zeroSplit.farmerShare).toBe(0);
    expect(zeroSplit.leadFarmerShare).toBe(0);
    expect(zeroSplit.platformFee).toBe(0);

    const smallSplit = calculateRevenueSplit(1.00);
    expect(smallSplit.farmerShare).toBe(0.85);
    expect(smallSplit.leadFarmerShare).toBe(0.05);
    expect(smallSplit.platformFee).toBe(0.10);
  });
});

describe('FLAT_DELIVERY_FEE', () => {
  it('is always $7.50', () => {
    expect(FLAT_DELIVERY_FEE).toBe(7.50);
  });
});

describe('calculateDriverPayout', () => {
  it('calculates flat fee times delivery count', () => {
    expect(calculateDriverPayout(1)).toBe(7.50);
    expect(calculateDriverPayout(5)).toBe(37.50);
    expect(calculateDriverPayout(10)).toBe(75.00);
    expect(calculateDriverPayout(20)).toBe(150.00);
  });

  it('handles zero deliveries', () => {
    expect(calculateDriverPayout(0)).toBe(0.00);
  });

  it('rounds to 2 decimal places', () => {
    expect(calculateDriverPayout(3)).toBe(22.50);
    expect(calculateDriverPayout(7)).toBe(52.50);
  });

  it('handles large delivery counts', () => {
    expect(calculateDriverPayout(100)).toBe(750.00);
    expect(calculateDriverPayout(50)).toBe(375.00);
  });
});
