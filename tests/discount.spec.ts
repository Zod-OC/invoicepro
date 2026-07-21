/**
 * Unit tests for the Issue #19 discount field in calculateTotals().
 * Order-of-operations contract: subtotal → discount → tax → total.
 *
 * Run with: npx playwright test tests/discount.spec.ts
 */
import { test, expect } from '@playwright/test';
import { calculateTotals, type InvoiceItem, type DiscountConfig } from '../src/types';

function items(...lines: Array<[number, number]>): InvoiceItem[] {
  return lines.map(([quantity, rate], i) => ({
    description: `Line ${i + 1}`,
    quantity,
    rate,
  }));
}

test.describe('discount — calculateTotals', () => {
  test('percentage discount applies as a fraction of the subtotal', () => {
    // subtotal 1000, 10% off → discount 100, taxable base 900, tax 0.
    const discount: DiscountConfig = { type: 'percentage', value: 10 };
    const t = calculateTotals(items([10, 100]), 0, discount);
    expect(t.subtotal).toBe(1000);
    expect(t.discount).toBeCloseTo(100, 10);
    expect(t.tax).toBe(0);
    expect(t.total).toBeCloseTo(900, 10);
  });

  test('fixed discount subtracts an absolute amount', () => {
    // subtotal 1000, fixed 150 off → discount 150, base 850, tax 0.
    const discount: DiscountConfig = { type: 'fixed', value: 150 };
    const t = calculateTotals(items([10, 100]), 0, discount);
    expect(t.subtotal).toBe(1000);
    expect(t.discount).toBe(150);
    expect(t.total).toBeCloseTo(850, 10);
  });

  test('no discount is backward compatible (discount === 0, total === subtotal + tax)', () => {
    // Omitting the discount arg entirely must match pre-#19 behavior exactly.
    const withoutArg = calculateTotals(items([2, 50]), 20);
    expect(withoutArg).toEqual({ subtotal: 100, discount: 0, tax: 20, total: 120 });

    // Passing undefined explicitly must be identical.
    const withUndefined = calculateTotals(items([2, 50]), 20, undefined);
    expect(withUndefined).toEqual(withoutArg);
  });

  test('discount is applied BEFORE tax (order: subtotal → discount → tax → total)', () => {
    // subtotal 200, 50% discount → base 100, then 20% tax on 100 → tax 20,
    // total 120. If tax were applied first this would be 200 → tax 40 →
    // total 240 then discounted to 120 — same total here by coincidence, so
    // assert the INTERMEDIATE tax to prove the base was discounted first.
    const discount: DiscountConfig = { type: 'percentage', value: 50 };
    const t = calculateTotals(items([4, 50]), 20, discount);
    expect(t.subtotal).toBe(200);
    expect(t.discount).toBeCloseTo(100, 10);
    expect(t.tax).toBeCloseTo(20, 10); // 20% of the DISCOUNTED base (100), not 200
    expect(t.total).toBeCloseTo(120, 10);
  });

  test('fixed discount is clamped to [0, subtotal] (cannot drive base negative)', () => {
    // A 5000 fixed discount on a 1000 subtotal clamps to 1000 → base 0.
    const discount: DiscountConfig = { type: 'fixed', value: 5000 };
    const t = calculateTotals(items([10, 100]), 20, discount);
    expect(t.discount).toBe(1000);
    expect(t.tax).toBe(0);
    expect(t.total).toBe(0);
  });

  test('percentage discount is clamped to [0, 100]', () => {
    const over: DiscountConfig = { type: 'percentage', value: 150 };
    expect(calculateTotals(items([10, 100]), 0, over).discount).toBe(1000); // 100% of 1000
    const under: DiscountConfig = { type: 'percentage', value: -25 };
    expect(calculateTotals(items([10, 100]), 0, under).discount).toBe(0); // 0%
  });

  test('discount with value 0 is a no-op (renders identically to no discount)', () => {
    const zeroPct: DiscountConfig = { type: 'percentage', value: 0 };
    const zeroFixed: DiscountConfig = { type: 'fixed', value: 0 };
    const none = calculateTotals(items([3, 50]), 10);
    expect(calculateTotals(items([3, 50]), 10, zeroPct)).toEqual(none);
    expect(calculateTotals(items([3, 50]), 10, zeroFixed)).toEqual(none);
  });
});
