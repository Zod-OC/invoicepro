import { Invoice, calculateTotals } from '@/types';

// RFC 4180 CSV cell escaping for TEXT cells, plus CSV/formula-injection
// mitigation: a cell starting with = + - @ TAB or CR is prefixed with a single
// quote (OWASP recommendation) so Excel/Sheets don't evaluate it as a formula.
// Cells containing comma/quote/newline are quoted with embedded quotes doubled.
function csvText(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (/[",\n\r]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

// Pure client-side CSV export (no server, no PDF dependency). The audit calls
// this "the fastest new traffic cluster enabler": it closes the PDF-only gap vs
// free clones AND unlocks the 'invoice template excel/sheets' format-SEO cluster.
// Numeric fields are computed numbers (no user-text injection surface) so they
// pass through raw; only text fields are escaped.
export function generateCSV(invoice: Invoice): string {
  const totals = calculateTotals(invoice.items, invoice.taxRate);
  const num = (n: number) => String(n);
  const rows: string[][] = [
    ['Billify Invoice', ''],
    ['Number', csvText(invoice.number)],
    ['Date', csvText(invoice.date)],
    ['Due', csvText(invoice.dueDate)],
    ['Currency', invoice.currency],
    ['From', csvText(invoice.from.name)],
    ['To', csvText(invoice.to.name)],
    [],
    ['Description', 'Quantity', 'Unit Price', 'Amount'],
    ...invoice.items.map((it) => [
      csvText(it.description),
      num(it.quantity),
      num(it.rate),
      num(it.quantity * it.rate),
    ]),
    [],
    ['Subtotal', '', '', num(totals.subtotal)],
    ['Tax', `${invoice.taxRate}%`, '', num(totals.tax)],
    ['Total', '', '', num(totals.total)],
  ];
  return rows.map((r) => r.join(',')).join('\r\n');
}
