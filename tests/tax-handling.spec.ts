/**
 * Unit tests for the Issue #21 tax-handling helpers:
 *   - resolveTaxConfig() — backward-compatible TaxConfig resolution
 *   - rcTotal()           — reverse-charge total collapse
 *   - taxConfigLabel()    — human label for the PDF tax line
 *   - TAX_PRESETS         — country quick-pick rates (UK/DE/FR/AU/CH)
 *
 * Run with: npx playwright test tests/tax-handling.spec.ts
 */
import { test, expect } from '@playwright/test';
import {
  resolveTaxConfig,
  rcTotal,
  taxConfigLabel,
  TAX_PRESETS,
  createEmptyInvoice,
  type Invoice,
  type TaxConfig,
} from '../src/types';

// Minimal invoice shape accepted by resolveTaxConfig (Pick<Invoice,
// 'taxRate' | 'taxConfig' | 'from' | 'to'>). Built from createEmptyInvoice
// so it stays valid if the CompanyInfo interface grows new required fields.
function baseInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return { ...createEmptyInvoice(), ...overrides };
}

test.describe('tax-handling', () => {
  // ─── resolveTaxConfig ──────────────────────────────────────────────────
  test.describe('resolveTaxConfig', () => {
    test('synthesizes a default TaxConfig from legacy taxRate (no taxConfig)', () => {
      const inv = baseInvoice({ taxRate: 20 });
      const cfg = resolveTaxConfig(inv);
      // Legacy invoices had no structured tax descriptor, so the synthesized
      // config must keep the flat rate and use the neutral 'Tax' label.
      expect(cfg.rate).toBe(20);
      expect(cfg.label).toBe('Tax');
      expect(cfg.reverseCharge).toBe(false);
      expect(cfg.customLabel).toBeUndefined();
    });

    test('falls back to rate 0 when both taxConfig and taxRate are absent/NaN', () => {
      const inv = baseInvoice({ taxRate: NaN });
      expect(resolveTaxConfig(inv).rate).toBe(0);
    });

    test('passes through a structured TaxConfig (rate, label, reverseCharge)', () => {
      const structured: TaxConfig = {
        label: 'VAT',
        rate: 19,
        reverseCharge: true,
        taxId: 'DE123456789',
        buyerTaxId: 'FR987654321',
      };
      const cfg = resolveTaxConfig(baseInvoice({ taxRate: 0, taxConfig: structured }));
      expect(cfg.label).toBe('VAT');
      expect(cfg.rate).toBe(19);
      expect(cfg.reverseCharge).toBe(true);
      expect(cfg.taxId).toBe('DE123456789');
      expect(cfg.buyerTaxId).toBe('FR987654321');
    });

    test('uses taxConfig.taxId, falls back to from.taxId when unset', () => {
      // taxConfig carries its own seller registration number → wins.
      const withCfgId = resolveTaxConfig(
        baseInvoice({
          from: { ...createEmptyInvoice().from, taxId: 'GB111' },
          taxConfig: { label: 'VAT', rate: 20, reverseCharge: false, taxId: 'GB222' },
        }),
      );
      expect(withCfgId.taxId).toBe('GB222');

      // taxConfig has no taxId → fall back to the seller party block.
      const fallback = resolveTaxConfig(
        baseInvoice({
          from: { ...createEmptyInvoice().from, taxId: 'GB111' },
          taxConfig: { label: 'VAT', rate: 20, reverseCharge: false },
        }),
      );
      expect(fallback.taxId).toBe('GB111');
    });

    test('uses taxConfig.buyerTaxId, falls back to to.taxId when unset', () => {
      const fallback = resolveTaxConfig(
        baseInvoice({
          to: { ...createEmptyInvoice().to, taxId: 'FR999' },
          taxConfig: { label: 'VAT', rate: 20, reverseCharge: true },
        }),
      );
      expect(fallback.buyerTaxId).toBe('FR999');
    });

    test('clamps an out-of-range structured rate into [0, 100]', () => {
      const cfg = resolveTaxConfig(
        baseInvoice({ taxRate: 5, taxConfig: { label: 'VAT', rate: 150, reverseCharge: false } }),
      );
      expect(cfg.rate).toBe(100);
    });

    test('rejects an unknown label, falling back to "Tax"', () => {
      // Crafted payload — cast through unknown to bypass TS.
      const cfg = resolveTaxConfig(
        baseInvoice({
          taxRate: 10,
          taxConfig: { label: 'Bogus', rate: 10, reverseCharge: false } as unknown as TaxConfig,
        }),
      );
      expect(cfg.label).toBe('Tax');
    });

    test('preserves customLabel only when non-empty', () => {
      const withCustom = resolveTaxConfig(
        baseInvoice({
          taxConfig: { label: 'Custom', customLabel: 'Consumption Tax', rate: 5, reverseCharge: false },
        }),
      );
      expect(withCustom.label).toBe('Custom');
      expect(withCustom.customLabel).toBe('Consumption Tax');

      const blankCustom = resolveTaxConfig(
        baseInvoice({
          taxConfig: { label: 'Custom', customLabel: '   ', rate: 5, reverseCharge: false },
        }),
      );
      expect(blankCustom.customLabel).toBeUndefined();
    });
  });

  // ─── rcTotal ───────────────────────────────────────────────────────────
  test.describe('rcTotal', () => {
    test('collapses total to subtotal when reverseCharge=true (tax still reported)', () => {
      const totals = { subtotal: 1000, tax: 200, total: 1200 };
      const rc = rcTotal(totals, true);
      // Reverse charge: buyer self-accounts, so the seller's total drops the
      // tax. The tax amount is still surfaced for annotation.
      expect(rc.total).toBe(1000);
      expect(rc.tax).toBe(200);
    });

    test('returns original tax/total unchanged when reverseCharge=false', () => {
      const totals = { subtotal: 1000, tax: 200, total: 1200 };
      const rc = rcTotal(totals, false);
      expect(rc).toEqual({ tax: 200, total: 1200 });
    });

    test('reverse charge with zero tax is a no-op on the total', () => {
      const totals = { subtotal: 500, tax: 0, total: 500 };
      expect(rcTotal(totals, true)).toEqual({ tax: 0, total: 500 });
    });
  });

  // ─── taxConfigLabel ────────────────────────────────────────────────────
  test.describe('taxConfigLabel', () => {
    test('returns the display string for each known TaxLabel', () => {
      expect(taxConfigLabel({ label: 'Tax', rate: 0, reverseCharge: false })).toBe('Tax');
      expect(taxConfigLabel({ label: 'Sales Tax', rate: 0, reverseCharge: false })).toBe('Sales Tax');
      expect(taxConfigLabel({ label: 'VAT', rate: 0, reverseCharge: false })).toBe('VAT');
      expect(taxConfigLabel({ label: 'GST', rate: 0, reverseCharge: false })).toBe('GST');
      expect(taxConfigLabel({ label: 'MwSt', rate: 0, reverseCharge: false })).toBe('MwSt');
    });

    test('returns the user customLabel when label === "Custom"', () => {
      expect(
        taxConfigLabel({ label: 'Custom', customLabel: 'QST', rate: 9.975, reverseCharge: false }),
      ).toBe('QST');
    });

    test('falls back to the literal "Custom" display string when customLabel is absent', () => {
      // The ?? 'Tax' fallback only fires for an UNKNOWN label; 'Custom' is in
      // TAX_LABEL_DISPLAY, so a Custom config with no customLabel renders the
      // word "Custom" (not "Tax") — matching the editor picker.
      expect(taxConfigLabel({ label: 'Custom', rate: 0, reverseCharge: false })).toBe('Custom');
    });
  });

  // ─── TAX_PRESETS ───────────────────────────────────────────────────────
  test.describe('TAX_PRESETS', () => {
    // Build a {country → preset} map once so each rate assertion reads cleanly.
    const byCountry = new Map(TAX_PRESETS.map((p) => [p.country, p]));

    test('has exactly the expected countries', () => {
      expect(TAX_PRESETS.map((p) => p.country).sort()).toEqual(['AU', 'CH', 'DE', 'FR', 'GB']);
    });

    test('UK preset is VAT 20%', () => {
      const uk = byCountry.get('GB');
      expect(uk).toBeDefined();
      expect(uk!.label).toBe('VAT');
      expect(uk!.rate).toBe(20);
    });

    test('DE preset is VAT 19%', () => {
      const de = byCountry.get('DE');
      expect(de).toBeDefined();
      expect(de!.label).toBe('VAT');
      expect(de!.rate).toBe(19);
    });

    test('FR preset is VAT 21%', () => {
      const fr = byCountry.get('FR');
      expect(fr).toBeDefined();
      expect(fr!.label).toBe('VAT');
      expect(fr!.rate).toBe(21);
    });

    test('AU preset is GST 10%', () => {
      const au = byCountry.get('AU');
      expect(au).toBeDefined();
      expect(au!.label).toBe('GST');
      expect(au!.rate).toBe(10);
    });

    test('CH preset is MwSt 7.7%', () => {
      const ch = byCountry.get('CH');
      expect(ch).toBeDefined();
      expect(ch!.label).toBe('MwSt');
      expect(ch!.rate).toBe(7.7);
    });

    test('every preset has a stable id and a non-empty human name', () => {
      for (const p of TAX_PRESETS) {
        expect(p.id.length).toBeGreaterThan(0);
        expect(p.name.length).toBeGreaterThan(0);
      }
      // ids are unique (used as React keys by the preset picker).
      const ids = TAX_PRESETS.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
