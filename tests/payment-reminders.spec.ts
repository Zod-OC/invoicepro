/**
 * Unit tests for payment-reminders module.
 * Run with: npx playwright test tests/payment-reminders.spec.ts
 * (Uses Playwright's test runner for consistency with the rest of the suite.)
 */
import { test, expect } from '@playwright/test';
import { generateReminder, getReminderTier, calculateDaysOverdue, getApplicableTiers } from '../src/lib/payment-reminders';
import type { InvoiceRecord } from '../src/types';

function makeRecord(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  return {
    id: 'test-1',
    number: 'INV-001',
    clientName: 'Acme Corp',
    amount: 1500,
    currency: 'EUR',
    date: '2026-01-01',
    dueDate: '2026-01-15',
    status: 'overdue',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

test.describe('payment-reminders', () => {
  test.describe('getReminderTier', () => {
    test('tier 1 for 1-6 days', () => {
      expect(getReminderTier(1)).toBe(1);
      expect(getReminderTier(6)).toBe(1);
    });

    test('tier 2 for 7-13 days', () => {
      expect(getReminderTier(7)).toBe(2);
      expect(getReminderTier(13)).toBe(2);
    });

    test('tier 3 for 14+ days', () => {
      expect(getReminderTier(14)).toBe(3);
      expect(getReminderTier(30)).toBe(3);
    });
  });

  test.describe('calculateDaysOverdue', () => {
    test('calculates from due date', () => {
      const record = makeRecord({ dueDate: '2026-01-15' });
      expect(calculateDaysOverdue(record, new Date('2026-01-22T00:00:00Z'))).toBe(7);
    });

    test('falls back to issue date', () => {
      const record = makeRecord({ date: '2026-01-01', dueDate: '' });
      expect(calculateDaysOverdue(record, new Date('2026-01-08T00:00:00Z'))).toBe(7);
    });

    test('returns 0 for future', () => {
      const record = makeRecord({ dueDate: '2026-12-31' });
      expect(calculateDaysOverdue(record, new Date('2026-01-15T00:00:00Z'))).toBe(0);
    });
  });

  test.describe('generateReminder', () => {
    test('tier 1 email at 3 days', () => {
      const record = makeRecord({ dueDate: '2026-01-15' });
      const result = generateReminder(record, 'email', new Date('2026-01-18T00:00:00Z'));
      expect(result.tier).toBe(1);
      expect(result.subject).toContain('INV-001');
      expect(result.body).toContain('Acme Corp');
    });

    test('tier 2 email at 7 days', () => {
      const record = makeRecord({ dueDate: '2026-01-15' });
      const result = generateReminder(record, 'email', new Date('2026-01-22T00:00:00Z'));
      expect(result.tier).toBe(2);
      expect(result.subject).toContain('7 days overdue');
    });

    test('tier 3 email at 14+ days', () => {
      const record = makeRecord({ dueDate: '2026-01-01' });
      const result = generateReminder(record, 'email', new Date('2026-01-20T00:00:00Z'));
      expect(result.tier).toBe(3);
      expect(result.subject).toContain('FINAL NOTICE');
    });

    test('SMS is short', () => {
      const record = makeRecord({ dueDate: '2026-01-15' });
      const result = generateReminder(record, 'sms', new Date('2026-01-22T00:00:00Z'));
      expect(result.body.length).toBeLessThan(200);
    });

    test('handles missing client name', () => {
      const record = makeRecord({ clientName: '' });
      const result = generateReminder(record, 'email', new Date('2026-01-22T00:00:00Z'));
      expect(result.body).toContain('there');
    });
  });

  test.describe('getApplicableTiers', () => {
    test('tier 1 only at 3 days', () => {
      expect(getApplicableTiers(3)).toEqual([1]);
    });

    test('tiers 1-2 at 10 days', () => {
      expect(getApplicableTiers(10)).toEqual([1, 2]);
    });

    test('tiers 1-2-3 at 20 days', () => {
      expect(getApplicableTiers(20)).toEqual([1, 2, 3]);
    });
  });
});
