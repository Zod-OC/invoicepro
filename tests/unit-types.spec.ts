import { test, expect } from '@playwright/test';
import { formatCurrency, formatCurrencyPdf, currencySymbol, validateInvoice, createEmptyInvoice, calculateTotals, type Invoice } from '../src/types';
import { generateCSV } from '../src/lib/csv';

// Pure-logic tests (no browser) for the ISO 4217 currency helpers. These assert
// against Intl's OWN output in the same locale, so they stay green regardless of
// the host locale (en-US, de-DE, …) rather than hard-coding "$1,000.00"-style
// strings that would flip with the decimal/grouping separator.

test.describe('currency formatting (ISO 4217 via Intl)', () => {
  test('formatCurrency matches Intl for valid currencies (incl. 0- and 3-decimal)', () => {
    const cases: Array<[number, string]> = [
      [9.5, 'USD'],    // 2 decimals
      [1000, 'JPY'],   // 0 decimals
      [1234.5, 'EUR'], // 2 decimals
      [1000, 'BHD'],   // 3 decimals
    ];
    for (const [amt, cur] of cases) {
      const expected = new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(amt);
      expect(formatCurrency(amt, cur), `${cur} ${amt}`).toBe(expected);
    }
  });

  test('Intl itself resolves the right fraction digits — no minorUnits map needed', () => {
    const frac = (cur: string) =>
      new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).resolvedOptions().maximumFractionDigits;
    expect(frac('JPY')).toBe(0);
    expect(frac('USD')).toBe(2);
    expect(frac('BHD')).toBe(3);
  });

  test('formatCurrency never throws; falls back to "CODE amount" when Intl rejects a code', () => {
    // 2-letter 'US' is structurally invalid → Intl throws RangeError → our
    // fallback "CODE amount". (3-letter codes like 'XYZ' are accepted by ICU
    // and render via Intl — also without throwing.)
    expect(formatCurrency(100, 'US')).toBe('US 100.00');
    expect(() => formatCurrency(100, 'US')).not.toThrow();
    expect(() => formatCurrency(100, 'XYZ')).not.toThrow();
    expect(formatCurrency(100, 'XYZ')).toContain('100');
  });

  test('currencySymbol matches Intl currency literal, raw code for unknown', () => {
    const literal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      .formatToParts(0)
      .find((p) => p.type === 'currency')!.value;
    expect(currencySymbol('USD')).toBe(literal);
    expect(currencySymbol('XYZ')).toBe('XYZ'); // unknown → code, never silently '$'
  });

  test('formatCurrencyPdf uses the ISO code (no non-WinAnsi glyph) under en-US', () => {
    // jsPDF's default WinAnsi font cannot render non-WinAnsi glyphs (₹ ₪ ₽), so
    // the PDF uses the ISO CODE under a fixed en-US locale. (en-US separates the
    // code from the amount with U+00A0 nbsp, which IS WinAnsi-safe and renders.)
    const eur = formatCurrencyPdf(1234.5, 'EUR');
    expect(eur).toContain('EUR');
    expect(eur).toContain('1,234.50');
    expect(eur).not.toContain('€');

    const inr = formatCurrencyPdf(1234.5, 'INR');
    expect(inr).toContain('INR');
    expect(inr).not.toContain('₹'); // the glyph jsPDF would render as garbage — must be absent
    expect(inr).toContain('1,234.50'); // en-US grouping (,) + decimal (.)
  });
});

// The validateInvoice strict-rebuild invariant: EVERY field must survive a
// JSON round-trip through validateInvoice (the universal ingestion boundary for
// localStorage, share links, handoff, and iframe postMessage). If a new field is
// added to the interface but not extracted in validateInvoice, this test fails —
// that is its entire purpose.

function fullInvoice(): Invoice {
  const base = createEmptyInvoice();
  return {
    ...base,
    from: { ...base.from, taxId: 'DE123456789', addressLine2: 'Suite 1', city: 'Berlin', region: 'Berlin', postalCode: '10115', country: 'DE' },
    to: { ...base.to, taxId: 'FR987654321', addressLine2: 'Étage 2', city: 'Paris', postalCode: '75001', region: 'Île-de-France', country: 'FR' },
    items: [{ description: 'Consulting', quantity: 5, rate: 120, taxCategory: 'standard', unitCode: 'HUR' }],
    purchaseOrder: 'PO-0099',
    leitwegId: '99listen-id-123',
    paymentMeans: { code: '58', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', accountName: 'Acme GmbH' },
  };
}

test.describe('validateInvoice — strict-rebuild round-trip', () => {
  test('every new field survives a JSON round-trip (the silent-drop guard)', () => {
    const roundtrip = validateInvoice(JSON.parse(JSON.stringify(fullInvoice())));
    expect(roundtrip).not.toBeNull();
    const r = roundtrip!;
    // CompanyInfo structured fields + taxId
    expect(r.from.taxId).toBe('DE123456789');
    expect(r.from.addressLine2).toBe('Suite 1');
    expect(r.from.city).toBe('Berlin');
    expect(r.from.region).toBe('Berlin');
    expect(r.from.postalCode).toBe('10115');
    expect(r.from.country).toBe('DE');
    expect(r.to.taxId).toBe('FR987654321');
    expect(r.to.country).toBe('FR');
    // Per-line optionals
    expect(r.items[0].taxCategory).toBe('standard');
    expect(r.items[0].unitCode).toBe('HUR');
    // Invoice-level optionals
    expect(r.purchaseOrder).toBe('PO-0099');
    expect(r.leitwegId).toBe('99listen-id-123');
    expect(r.paymentMeans?.code).toBe('58');
    expect(r.paymentMeans?.iban).toBe('DE89370400440532013000');
    expect(r.paymentMeans?.bic).toBe('COBADEFFXXX');
    expect(r.paymentMeans?.accountName).toBe('Acme GmbH');
  });

  test('old-shape invoice (no new fields) round-trips with optionals undefined', () => {
    const roundtrip = validateInvoice(JSON.parse(JSON.stringify(createEmptyInvoice())));
    expect(roundtrip).not.toBeNull();
    const r = roundtrip!;
    expect(r.from.taxId).toBeUndefined();
    expect(r.from.country).toBeUndefined();
    expect(r.purchaseOrder).toBeUndefined();
    expect(r.leitwegId).toBeUndefined();
    expect(r.paymentMeans).toBeUndefined();
    expect(r.items[0].taxCategory).toBeUndefined();
    expect(r.items[0].unitCode).toBeUndefined();
  });

  test('a malformed paymentMeans is dropped, not the whole invoice', () => {
    const bad = { ...fullInvoice(), paymentMeans: { iban: 'no-code' } }; // missing required code
    const r = validateInvoice(JSON.parse(JSON.stringify(bad)))!;
    expect(r).not.toBeNull();
    expect(r.paymentMeans).toBeUndefined();
  });

  test('a paymentMeans with an EMPTY code is dropped (isValidString("") is true)', () => {
    const bad = { ...fullInvoice(), paymentMeans: { code: '', iban: 'DE89370400440532013000' } };
    const r = validateInvoice(JSON.parse(JSON.stringify(bad)))!;
    expect(r).not.toBeNull();
    expect(r.paymentMeans).toBeUndefined(); // not retained as a {code:''} block
  });

  test('an invalid taxCategory on a line is dropped, the line survives', () => {
    const bad = { ...fullInvoice(), items: [{ description: 'x', quantity: 1, rate: 10, taxCategory: 'bogus' }] };
    const r = validateInvoice(JSON.parse(JSON.stringify(bad)))!;
    expect(r.items).toHaveLength(1);
    expect(r.items[0].taxCategory).toBeUndefined();
  });

  test('taxCategory does NOT affect totals (flat-rate, smart-tax is NEXT)', () => {
    const withCat: Invoice = { ...createEmptyInvoice(), items: [{ description: 'x', quantity: 2, rate: 50, taxCategory: 'zero' }], taxRate: 20 };
    const withoutCat: Invoice = { ...createEmptyInvoice(), items: [{ description: 'x', quantity: 2, rate: 50 }], taxRate: 20 };
    expect(calculateTotals(withCat.items, withCat.taxRate)).toEqual(calculateTotals(withoutCat.items, withoutCat.taxRate));
    // and the flat-rate math itself
    expect(calculateTotals(withCat.items, 20)).toEqual({ subtotal: 100, tax: 20, total: 120 });
  });
});

test.describe('generateCSV — RFC 4180 escaping + injection mitigation', () => {
  test('neutralizes formula prefixes and quotes comma/quote cells', () => {
    const inv = {
      ...createEmptyInvoice(),
      number: 'INV-1',
      items: [
        { description: '=CMD|a', quantity: 1, rate: 10 },
        { description: 'Widgets, "premium"', quantity: 2, rate: 5 },
      ],
    };
    const csv = generateCSV(inv);
    expect(csv).toContain("'=CMD|a"); // formula prefix neutralized
    expect(csv).toContain('"Widgets, ""premium"""'); // comma+quote cell quoted, quotes doubled
    expect(csv).toContain('\r\n'); // RFC 4180 CRLF line endings
    expect(csv).toContain('INV-1');
  });
});
