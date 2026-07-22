import { test, expect } from '@playwright/test';
import jsPDF from 'jspdf';
import { generatePDF, renderTemplateInto } from '../src/lib/pdf';
import { createEmptyInvoice, type Invoice, type TemplateType } from '../src/types';

// Feature #7 / issue #6 — PDF compliance details render INLINE in the From/To
// party-block region (above the items table), NOT in a below-totals block that
// clips off the page on long invoices. EN 16931 layout guidance.
//
// These are pure-logic tests (no browser): they drive each template renderer
// with a real jsPDF in Node and observe doc.text calls directly, plus a
// byte-level check of the public generatePDF path.

const TEMPLATES: TemplateType[] = [
  'modern', 'classic', 'minimal', 'clean', 'bold', 'executive',
  'corporate', 'startup', 'freelancer', 'agency', 'consulting', 'creative',
];

// An invoice fully populated with EN 16931 compliance fields (seller + buyer tax
// IDs, PO, and SEPA bank details) so every drawDetails* branch has data to draw.
function invoice(template: TemplateType, withCompliance: boolean): Invoice {
  const base = createEmptyInvoice();
  const inv: Invoice = {
    ...base,
    number: 'INV-7',
    // Enough body to look real, but short enough that "below totals" would land
    // far below the compliance block — so the above/below distinction is crisp.
    items: [{ description: 'Consulting hours', quantity: 2, rate: 100 }],
    template,
  } as Invoice;
  if (withCompliance) {
    inv.from = {
      ...base.from,
      name: 'Acme GmbH', email: 'billing@acme.example', phone: '+49 30 123456',
      address: 'Friedrichstraße 1', taxId: 'DE123456789',
    };
    inv.to = {
      ...base.to,
      name: 'Client SARL', email: 'ap@client.example', phone: '+33 1 987654',
      address: '2 Rue de la Paix', taxId: 'FR987654321',
    };
    inv.purchaseOrder = 'PO-0099';
    inv.paymentMeans = {
      code: '58', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', accountName: 'Acme GmbH',
    };
  }
  return inv;
}

// Record every doc.text(...) call as { text, y } by patching the INSTANCE. jsPDF
// (v4) attaches text as an own property of the instance, so we capture the real
// method (bound) BEFORE shadowing it with the spy — the spy then delegates to
// it. Both the renderer and jspdf-autotable resolve `doc.text` at draw time, so
// the own-property spy intercepts them too.
function captureText(doc: jsPDF): { text: string; y: number }[] {
  const calls: { text: string; y: number }[] = [];
  // Preserve the exact variadic signature of jsPDF's text() so `orig(...args)`
  // (a spread of `unknown[]` into a rest-arg call) type-checks under strict mode.
  type TextFn = (...args: Parameters<jsPDF['text']>) => ReturnType<jsPDF['text']>;
  const orig = doc.text.bind(doc) as TextFn;
  (doc as unknown as { text: TextFn }).text = function (...args: Parameters<jsPDF['text']>) {
    const t = Array.isArray(args[0]) ? (args[0] as unknown[]).join(' ') : String(args[0]);
    calls.push({ text: t, y: typeof args[2] === 'number' ? args[2] : NaN });
    return orig(...args);
  };
  return calls;
}

// The items-table row Y for the line-item description, captured from the spy.
function itemRowY(calls: { text: string; y: number }[]): number {
  const ys = calls.filter((c) => c.text.includes('Consulting hours')).map((c) => c.y);
  return Math.min(...ys);
}

test.describe('PDF compliance details — inline layout (EN 16931, issue #6)', () => {

  test.describe('content: every template renders the compliance fields', () => {
    for (const tpl of TEMPLATES) {
      test(`${tpl}: seller + buyer compliance strings present, legacy "Details" header gone`, () => {
        const doc = new jsPDF();
        const calls = captureText(doc);
        renderTemplateInto(doc, invoice(tpl, true));
        const all = calls.map((c) => c.text).join('\n');

        // Seller (From) compliance.
        expect(all, 'seller tax id').toContain('DE123456789');
        expect(all, 'iban').toContain('DE89370400440532013000');
        expect(all, 'bic').toContain('COBADEFFXXX');
        // Buyer (To) compliance.
        expect(all, 'buyer tax id').toContain('FR987654321');
        expect(all, 'purchase order').toContain('PO-0099');

        // The old below-totals block opened with a "Details" heading — it must
        // be gone from every template now.
        expect(all).not.toContain('Details');
      });
    }
  });

  test.describe('position: details sit ABOVE the items table (no clipping)', () => {
    for (const tpl of TEMPLATES) {
      test(`${tpl}: items table is pushed down when compliance data is present`, () => {
        // Render the SAME template twice — once with compliance data, once
        // without — and compare the item-row Y. If details render ABOVE the
        // table they consume vertical space first and push the table down
        // (yWith > yWithout). If they rendered BELOW the table (the old
        // clipping bug) the table Y would be unchanged. This is baseline-
        // agnostic: it compares the same text's position across two renders.
        const withDoc = new jsPDF();
        const withCalls = captureText(withDoc);
        renderTemplateInto(withDoc, invoice(tpl, true));
        const yWith = itemRowY(withCalls);

        const withoutDoc = new jsPDF();
        const withoutCalls = captureText(withoutDoc);
        renderTemplateInto(withoutDoc, invoice(tpl, false));
        const yWithout = itemRowY(withoutCalls);

        expect(yWith, `${tpl}: table pushed down by above-table details`).toBeGreaterThan(yWithout);

        // And every compliance string's own Y sits above the item row.
        const detailYs = withCalls
          .filter((c) => /DE123456789|FR987654321|DE89370400440532013000|COBADEFFXXX|PO-0099/.test(c.text))
          .map((c) => c.y);
        expect(detailYs.length, `${tpl}: detail strings were drawn`).toBeGreaterThan(0);
        expect(Math.max(...detailYs), `${tpl}: details above item row`).toBeLessThan(yWith);
      });
    }
  });

  test('no-op when there is no compliance data — no stray labels or shifts', () => {
    for (const tpl of TEMPLATES) {
      const doc = new jsPDF();
      const calls = captureText(doc);
      renderTemplateInto(doc, invoice(tpl, false));
      const all = calls.map((c) => c.text).join('\n');
      // No compliance label leaks when there is nothing to render.
      expect(all, `${tpl}`).not.toContain('Tax ID / VAT');
      expect(all, `${tpl}`).not.toContain('IBAN');
      expect(all, `${tpl}`).not.toContain('BIC / SWIFT');
      expect(all, `${tpl}`).not.toMatch(/: PO-0099/);
    }
  });

  test('public generatePDF: every template yields a PDF with compliance data, no "Details" header', async () => {
    for (const tpl of TEMPLATES) {
      const blob = generatePDF(invoice(tpl, true));
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size, `${tpl}: non-trivial pdf`).toBeGreaterThan(2000);
      const text = Buffer.from(await blob.arrayBuffer()).toString('latin1');
      expect(text, `${tpl}: no legacy Details header`).not.toContain('Details');
      expect(text, `${tpl}: seller tax id in bytes`).toContain('DE123456789');
      expect(text, `${tpl}: buyer tax id in bytes`).toContain('FR987654321');
    }
  });
});
