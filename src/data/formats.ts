// Programmatic-SEO "invoice template by format" cluster. Targets format-based
// intent ("invoice template excel", "google sheet invoice template", "csv invoice",
// "pdf invoice template") — a DIFFERENT intent surface than the 30 profession
// pages, with verified demand (~6,600/mo, KD 20 for the Sheets variant per the
// growth audit). CSV + PDF are real Billify exports; Excel/Sheets are reached via
// CSV import, which the copy states plainly (no native .xlsx/.gsheet claim).
//
// Keep entries substantive (intro + what-to-include + export steps + FAQ) so each
// page clears the quality bar — not a thin variable-swap template.

export interface InvoiceFormat {
  /** URL slug, e.g. "google-sheets". */
  slug: string;
  /** Display name, e.g. "Google Sheets". */
  name: string;
  h1: string;
  metaDescription: string;
  /** 70–110 word lede. */
  introParagraph: string;
  /** 5–7 real fields a [format] invoice should carry. */
  whatToInclude: string[];
  /** 3–5 numbered steps to produce this format from Billify. */
  exportSteps: string[];
  /** 3–4 Q&As, also emitted as FAQ JSON-LD. */
  faq: { question: string; answer: string }[];
  /** 2–3 sibling format slugs for cross-linking. */
  relatedSlugs: string[];
}

export const FORMAT_DATA_UPDATED_AT = '2026-07-03';

export const INVOICE_FORMATS: InvoiceFormat[] = [
  {
    slug: 'csv',
    name: 'CSV',
    h1: 'Free CSV Invoice Template — Export & Open in Excel or Google Sheets',
    metaDescription:
      'Free CSV invoice template. Build your invoice in the browser and export a clean, spreadsheet-ready CSV — opens in Excel, Google Sheets, and Numbers. No signup.',
    introParagraph:
      'A CSV (comma-separated values) invoice is the most portable format there is: it opens in every spreadsheet app and imports cleanly into accounting tools. Billify generates a clean, RFC-4180 CSV straight from your browser — with cells properly quoted and formula-injection characters neutralized so Excel and Sheets open it safely. No signup, no account, and no .xlsx lock-in: your data is yours to move wherever you want.',
    whatToInclude: [
      'A unique invoice number and issue/due dates',
      'Your business name and the client’s name',
      'Line items: description, quantity, unit price, amount',
      'Subtotal, tax rate and tax amount, and the grand total',
      'Payment terms (e.g. Net 14) and bank/payment details',
    ],
    exportSteps: [
      'Open the editor at billify.me/app — no signup needed.',
      'Fill in your business, the client, and your line items.',
      'Click the CSV button next to Download PDF.',
      'Open the downloaded .csv in Excel, Google Sheets, or Numbers.',
    ],
    faq: [
      {
        question: 'Is the CSV invoice template really free?',
        answer:
          'Yes. The free tier lets you create and export up to 3 invoices a month with no signup and no watermark. The CSV export is included on the free tier — you don’t need Pro to download a CSV.',
      },
      {
        question: 'Will the CSV open correctly in Excel and Google Sheets?',
        answer:
          'Yes. Billify follows RFC 4180 (commas, quotes, and newlines are escaped correctly) and prefixes cells that start with =, +, -, or @ with a single quote, so Excel and Sheets treat them as text rather than formulas — a standard protection against CSV formula injection.',
      },
      {
        question: 'Is my invoice data stored on a server?',
        answer:
          'No. Billify is browser-first: your invoice lives in your browser’s local storage and the CSV is generated on your device. There is no server-side database of invoices, so nothing to leak.',
      },
    ],
    relatedSlugs: ['excel', 'google-sheets', 'pdf'],
  },
  {
    slug: 'excel',
    name: 'Excel',
    h1: 'Free Excel Invoice Template — Export a Spreadsheet-Ready Invoice',
    metaDescription:
      'Free Excel invoice template. Build an invoice in your browser and export a clean CSV that opens directly in Microsoft Excel — no formulas to break, no macros, no signup.',
    introParagraph:
      'You don’t need a .xlsx file — and honestly, you’re better off without one. Billify exports a clean CSV that opens directly in Microsoft Excel with no broken formulas, no macro-security prompts, and no signup. Fill in your invoice in the browser, click export, and Excel reads it as a normal spreadsheet you can format, sum, and sort. It’s the fastest path from blank page to a spreadsheet you control.',
    whatToInclude: [
      'Invoice number and the issue + due dates',
      'Sender and client name (and tax ID, if you charge VAT/GST)',
      'One row per line item: description, qty, unit price, line total',
      'Subtotal, tax, and total — as their own cells so Excel can sum them',
      'Payment terms and how to pay',
    ],
    exportSteps: [
      'Open billify.me/app and build your invoice (no signup).',
      'Click the CSV button to download a spreadsheet-ready file.',
      'Open the .csv in Excel — it lands in columns automatically.',
      'Save as .xlsx if you want Excel’s native format.',
    ],
    faq: [
      {
        question: 'Do you export a native .xlsx file?',
        answer:
          'No — and on purpose. We export CSV, which Excel opens natively with no formula or macro risks and no file-format lock-in. Once it’s open in Excel you can immediately Save As .xlsx if you prefer.',
      },
      {
        question: 'Do I need an account or Microsoft 365 to create the invoice?',
        answer:
          'No account and no Microsoft subscription. The invoice is built in your browser at billify.me/app and exported as a CSV; Excel (or any spreadsheet) only needs to open the file.',
      },
      {
        question: 'Can I reuse the template for multiple clients?',
        answer:
          'Yes. Save the downloaded CSV as your master template, then duplicate it per client. Or keep your client details in Billify’s built-in client directory and re-export in one click.',
      },
    ],
    relatedSlugs: ['csv', 'google-sheets', 'pdf'],
  },
  {
    slug: 'google-sheets',
    name: 'Google Sheets',
    h1: 'Free Google Sheets Invoice Template — Import a CSV in Seconds',
    metaDescription:
      'Free Google Sheets invoice template. Build an invoice in your browser, export a CSV, and import it into Google Sheets — no add-on, no signup, no Google account required.',
    introParagraph:
      'The cleanest way into Google Sheets is a CSV. Build your invoice in Billify (no signup, no Google account needed to create it), click export, then File → Import in Sheets. You get a native, editable spreadsheet with one row per line item — no add-ons, no script, no copy-pasting. It’s the fastest no-friction route to a Sheets invoice you fully own and can share.',
    whatToInclude: [
      'Invoice number plus issue and due dates',
      'Your name/business and the client’s name',
      'Line items as rows: description, quantity, rate, amount',
      'Subtotal, tax, and total in their own cells',
      'Notes and payment terms',
    ],
    exportSteps: [
      'Build your invoice at billify.me/app (no signup).',
      'Click CSV to download the file.',
      'In Google Sheets: File → Import → Upload, and select the .csv.',
      'Choose “Insert at new sheet” — your invoice is now a live spreadsheet.',
    ],
    faq: [
      {
        question: 'Do I need a Sheets add-on or script?',
        answer:
          'No. You export a standard CSV from Billify and use Sheets’ built-in File → Import. No add-ons, no permissions, no script to maintain.',
      },
      {
        question: 'Do I need a Google account to create the invoice?',
        answer:
          'Only to open Google Sheets itself. Creating and exporting the invoice in Billify needs no account at all — you can build it and download the CSV anonymously, then import it into whichever Sheets account you like.',
      },
      {
        question: 'Will the numbers stay as numbers in Sheets?',
        answer:
          'Yes. Quantities, rates, and totals are written as plain numeric values, and any cell that could be misread as a formula is neutralized, so Sheets imports them as real numbers you can sum and format.',
      },
    ],
    relatedSlugs: ['csv', 'excel', 'pdf'],
  },
  {
    slug: 'pdf',
    name: 'PDF',
    h1: 'Free PDF Invoice Template — 12 Professional Designs, No Signup',
    metaDescription:
      'Free PDF invoice template. Pick from 12 designs, fill in your details, and download a polished, print-ready PDF — generated in your browser. No signup, no watermark.',
    introParagraph:
      'PDF is Billify’s default export and what most clients expect. Pick from 12 professional designs — modern, minimal, bold, corporate, and more — fill in your business and line items, and download a polished, print-ready PDF. It’s generated entirely in your browser, so your invoice data never touches a server. No signup, no account, and no watermark on the free tier.',
    whatToInclude: [
      'Your logo and business details',
      'Invoice number, issue date, and due date',
      'Itemized lines with quantity, rate, and amount',
      'Tax, subtotal, and a clear total',
      'Payment terms and how to pay',
    ],
    exportSteps: [
      'Open billify.me/app and pick a template (12 free + Pro designs).',
      'Add your logo, business, client, and line items.',
      'Click Download PDF — it’s generated in your browser instantly.',
      'Email it to your client or print it.',
    ],
    faq: [
      {
        question: 'Is there a watermark on the free PDF?',
        answer:
          'No. Billify never watermarks invoices, on any tier. The free PDF is clean and ready to send.',
      },
      {
        question: 'How many PDF templates are free?',
        answer:
          'Two of the twelve designs (Modern and Classic) are free; the other ten unlock on Pro (€9/mo). Every template exports the same clean PDF — the difference is only the visual design.',
      },
      {
        question: 'Can I add my logo to the PDF?',
        answer:
          'Yes. Upload a PNG, JPEG, or WebP logo and it appears on the invoice; Pro is required for logo upload. The logo is stored locally in your browser, not on a server.',
      },
    ],
    relatedSlugs: ['csv', 'excel', 'google-sheets'],
  },
];

const FORMAT_BY_SLUG = new Map(INVOICE_FORMATS.map((f) => [f.slug, f]));

export function getFormat(slug: string): InvoiceFormat | undefined {
  return FORMAT_BY_SLUG.get(slug);
}
