/**
 * Unit tests for the Issue #22 / R8 NaN clamps in calculateTotals() and
 * formatCurrencyPdf(). These guards keep the UI and PDF from ever rendering
 * "NaN" / "Infinity" when an input goes non-finite mid-edit (e.g. typing
 * "1-" in a rate field).
 *
 * Run with: npx playwright test tests/nan-guards.spec.ts
 */
import { test, expect } from '@playwright/test';
import { calculateTotals, formatCurrencyPdf, type InvoiceItem } from '../src/types';

test.describe('nan-guards — calculateTotals', () => {
  test('a NaN quantity contributes 0 for that line (other lines unaffected)', () => {
    const lines: InvoiceItem[] = [
      { description: 'bad qty', quantity: NaN, rate: 100 },
      { description: 'good', quantity: 2, rate: 50 },
    ];
    const t = calculateTotals(lines, 0);
    // bad line: NaN*100 → clamped to 0; good line: 2*50 = 100.
    expect(t.subtotal).toBe(100);
    expect(t.total).toBe(100);
    expect(t.tax).toBe(0);
  });

  test('a NaN rate contributes 0 for that line (other lines unaffected)', () => {
    const lines: InvoiceItem[] = [
      { description: 'bad rate', quantity: 5, rate: NaN },
      { description: 'good', quantity: 2, rate: 50 },
    ];
    const t = calculateTotals(lines, 10);
    // bad line clamps to 0; good line 100 → tax 10 → total 110.
    expect(t.subtotal).toBe(100);
    expect(t.tax).toBeCloseTo(10, 10);
    expect(t.total).toBeCloseTo(110, 10);
  });

  test('a NaN taxRate is treated as 0 (no tax added)', () => {
    const lines: InvoiceItem[] = [{ description: 'x', quantity: 1, rate: 200 }];
    const t = calculateTotals(lines, NaN);
    expect(t.subtotal).toBe(200);
    expect(t.tax).toBe(0);
    expect(t.total).toBe(200);
  });

  test('Infinity inputs are also clamped to 0 (Number.isFinite guard)', () => {
    const lines: InvoiceItem[] = [
      { description: 'inf qty', quantity: Infinity, rate: 10 },
      { description: 'inf rate', quantity: 1, rate: -Infinity },
    ];
    const t = calculateTotals(lines, 0);
    expect(t.subtotal).toBe(0);
    expect(t.total).toBe(0);
  });

  test('all-NaN invoice still returns a finite, renderable totals object', () => {
    const lines: InvoiceItem[] = [{ description: 'x', quantity: NaN, rate: NaN }];
    const t = calculateTotals(lines, NaN);
    expect(Number.isFinite(t.subtotal)).toBe(true);
    expect(Number.isFinite(t.tax)).toBe(true);
    expect(Number.isFinite(t.total)).toBe(true);
    expect(t).toEqual({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  });
});

test.describe('nan-guards — formatCurrencyPdf', () => {
  test('NaN amount renders as a formatted 0 (never "NaN")', () => {
    const out = formatCurrencyPdf(NaN, 'USD');
    expect(out).not.toContain('NaN');
    expect(out).toContain('0.00');
  });

  test('Infinity amount renders as a formatted 0', () => {
    expect(formatCurrencyPdf(Infinity, 'EUR')).not.toContain('Infinity');
    expect(formatCurrencyPdf(-Infinity, 'EUR')).not.toContain('Infinity');
    expect(formatCurrencyPdf(Infinity, 'EUR')).toContain('0.00');
  });

  test('a finite amount still formats normally (guard is a no-op)', () => {
    const out = formatCurrencyPdf(1234.5, 'USD');
    expect(out).toContain('1,234.50');
    expect(out).not.toContain('NaN');
  });

  test('NaN with a 0-decimal currency renders as the currency-appropriate 0', () => {
    // JPY has 0 fraction digits — the guard output must respect that rather
    // than always emitting "0.00".
    const out = formatCurrencyPdf(NaN, 'JPY');
    expect(out).not.toContain('NaN');
    expect(out).toMatch(/0(?! \.)/); // "0", not "0.00"
  });
});
