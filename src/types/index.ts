export interface CompanyInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
  logo?: string;
  // Optional structured/compliance fields (all backward-compatible: older saved
  // invoices simply lack them). taxId is the seller/buyer VAT/GST/TFN identifier;
  // the structured address fields (ISO 3166-1 alpha-2 country, city, postal code,
  // …) feed UBL/EN 16931 export (NEXT tier).
  taxId?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

// Per-line tax category for UBL/EN 16931. NEXT-tier smart-tax maps these to a
// rate and a per-band TaxTotal; today taxCategory is COLLECTED but does NOT
// change the computed total — calculateTotals stays flat-rate (invoice.taxRate).
export type TaxCategory = 'standard' | 'reduced' | 'zero' | 'exempt' | 'reverse' | 'excluded';

// ─── Issue #21: TaxConfig (VAT / GST / Sales Tax / MwSt / Custom) ─────────
// Structured tax descriptor for EU/UK/AU users. Backward-compatible with the
// existing flat `taxRate` field: when an invoice has `taxRate` but no
// `taxConfig`, resolveTaxConfig() synthesizes a default `{ label: 'Tax',
// rate: taxRate, reverseCharge: false }` so every code path that consumed
// `invoice.taxRate` keeps working unchanged.
//
// `taxId`/`buyerTaxId` here DUPLICATE `from.taxId`/`to.taxId` on purpose:
//   - The CompanyInfo taxId fields are seller/buyer identity, attached to the
//     party for UBL/EN 16931 export and rendered inline with the address block.
//   - The TaxConfig taxId/buyerTaxId are the tax-regime-scoped registration
//     numbers shown next to the tax line on the PDF (e.g. "VAT No: GB123456789"
//     under the totals), which is the EN 16931 convention. In practice a user
//     who has set from.taxId will see it surface in both places; users who only
//     fill the TaxConfig get just the tax-line annotation. resolveTaxConfig()
//     falls back to from.taxId when taxConfig.taxId is unset so the PDF shows
//     the seller's registration number by the VAT label without forcing a
//     duplicate field.
export type TaxLabel = 'Tax' | 'Sales Tax' | 'VAT' | 'GST' | 'MwSt' | 'Custom';

export interface TaxConfig {
  label: TaxLabel;          // "VAT" / "GST" / "Sales Tax" / "MwSt" / "Tax" / "Custom"
  customLabel?: string;     // user-supplied text when label === 'Custom'
  rate: number;             // percentage, 0–100 (same scale as taxRate)
  taxId?: string;           // seller tax registration number for this regime
  buyerTaxId?: string;      // buyer tax registration number (needed for RC)
  reverseCharge: boolean;   // EU reverse-charge: tax is NOT added to total
}

// ─── Issue #19: DiscountConfig (percentage or fixed) ─────────────────────
// Structured discount descriptor. Backward-compatible with the existing
// flat-rate Invoice: when an invoice has no `discount` field, or value is 0,
// calculateTotals / totalsFoot / CSV all skip the discount entirely and render
// identically to pre-#19 invoices.
//
// `type: 'percentage'` → value is a percentage of the subtotal (e.g. value=10
//   subtracts 10% of subtotal). `type: 'fixed'` → value is an absolute currency
//   amount subtracted from the subtotal (clamped to [0, subtotal] so a
//   mistyped fixed discount can't drive the taxable base negative).
export type DiscountType = 'percentage' | 'fixed';

export interface DiscountConfig {
  type: DiscountType;
  value: number;            // percentage points (0–100) when type==='percentage',
                            // absolute currency amount when type==='fixed'
}

// Editor dropdown options. Array (not a Record) so the picker order is
// source-controlled. Exported for src/app/app/page.tsx.
export const DISCOUNT_TYPES: readonly DiscountType[] = ['percentage', 'fixed'];

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage (%)',
  fixed: 'Fixed amount',
};

// Editor dropdown options. Order is source-controlled (unlike a Record key
// enumeration), so the picker surfaces the common "Sales Tax / VAT / GST"
// first and the escape hatch "Custom" last. TAX_LABELS is exported for the
// editor <select> in src/app/app/page.tsx.
export const TAX_LABELS: readonly TaxLabel[] = ['Tax', 'Sales Tax', 'VAT', 'GST', 'MwSt', 'Custom'];

export const TAX_LABEL_DISPLAY: Record<TaxLabel, string> = {
  Tax: 'Tax',
  'Sales Tax': 'Sales Tax',
  VAT: 'VAT',
  GST: 'GST',
  MwSt: 'MwSt',
  Custom: 'Custom',
};

// Country presets for the quick-pick row. `label` is the TaxLabel the preset
// applies (so picking "VAT 20% UK" sets label=VAT, rate=20, currency/country
// are NOT auto-applied — the user might invoice in EUR from a UK-registered
// seller). Sorted by the issue's call-out order (UK / DE / FR).
export interface TaxPreset {
  id: string;       // stable key for the preset button
  label: TaxLabel;  // VAT / GST / etc.
  rate: number;
  country: string;  // ISO 3166-1 alpha-2, for display only
  name: string;     // human label e.g. "VAT 20% (UK)"
}

export const TAX_PRESETS: readonly TaxPreset[] = [
  { id: 'vat-uk', label: 'VAT', rate: 20, country: 'GB', name: 'VAT 20% (UK)' },
  { id: 'vat-de', label: 'VAT', rate: 19, country: 'DE', name: 'VAT 19% (DE)' },
  { id: 'vat-fr', label: 'VAT', rate: 21, country: 'FR', name: 'VAT 21% (FR)' },
  { id: 'gst-au', label: 'GST', rate: 10, country: 'AU', name: 'GST 10% (AU)' },
  { id: 'mwst-ch', label: 'MwSt', rate: 7.7, country: 'CH', name: 'MwSt 7.7% (CH)' },
];

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  taxCategory?: TaxCategory;
  unitCode?: string; // UN/ECE Recommendation 20 unit code, e.g. 'C62' pieces, 'HUR' hour
}

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'clean' | 'bold' | 'executive' | 'corporate' | 'startup' | 'freelancer' | 'agency' | 'consulting' | 'creative';
export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface PaymentMeans {
  code: string; // UN/ECE 4461 payment-means code, e.g. '58' SEPA Credit Transfer
  iban?: string;
  bic?: string;
  accountName?: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  from: CompanyInfo;
  to: CompanyInfo;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  taxRate: number;
  // Issue #21: structured tax config (VAT/GST/etc). Optional + backward-
  // compatible: when absent, resolveTaxConfig() synthesizes one from taxRate.
  // The PDF and totals path go through resolveTaxConfig so neither branch needs
  // a separate "legacy" case.
  taxConfig?: TaxConfig;
  // Issue #19: structured discount (percentage or fixed). Optional + backward-
  // compatible: when absent or value===0, calculateTotals / totalsFoot / CSV
  // skip the discount entirely (no "Discount" row on the PDF), so pre-#19
  // invoices render identically. Applied AFTER subtotal, BEFORE tax.
  discount?: DiscountConfig;
  currency: string;
  template: TemplateType;
  status: InvoiceStatus;
  createdAt: number;
  updatedAt: number;
  // Optional workflow/compliance fields (backward-compatible). purchaseOrder is
  // general-purpose; leitwegId (DE routing ID) + paymentMeans feed UBL/EN 16931
  // export (NEXT tier).
  purchaseOrder?: string;
  leitwegId?: string;
  paymentMeans?: PaymentMeans;
}

// ISO 4217 currency codes (active, circulating). Kept as a readonly tuple so
// (typeof currencies)[number] stays a literal union for typing (professions.ts
// defaultCurrency), and so the list is available with no runtime-API dependency.
// The currency SYMBOL and DECIMAL PRECISION are derived from Intl at format
// time: Intl already knows each currency's native decimals (JPY/KRW = 0,
// USD/EUR = 2, BHD/KWD/OMR = 3), so there is no hand-maintained symbol or
// minorUnits map that could drift out of sync with CLDR.
export const currencies = [
  'AED','AFN','ALL','AMD','ANG','AOA','ARS','AUD','AWG','AZN',
  'BAM','BBD','BDT','BGN','BHD','BIF','BMD','BND','BOB','BRL','BSD','BTN','BWP','BYN','BZD',
  'CAD','CDF','CHF','CLF','CLP','CNY','COP','CRC','CUP','CVE','CZK',
  'DJF','DKK','DOP','DZD',
  'EGP','ERN','ETB','EUR',
  'FJD','FKP',
  'GBP','GEL','GHS','GIP','GMD','GNF','GTQ','GYD',
  'HKD','HNL','HTG','HUF',
  'IDR','ILS','INR','IQD','IRR','ISK',
  'JMD','JOD','JPY',
  'KES','KGS','KHR','KMF','KPW','KRW','KWD','KYD','KZT',
  'LAK','LBP','LKR','LRD','LSL','LYD',
  'MAD','MDL','MGA','MKD','MMK','MNT','MOP','MRU','MUR','MVR','MWK','MXN','MYR','MZN',
  'NAD','NGN','NIO','NOK','NPR','NZD',
  'OMR',
  'PAB','PEN','PGK','PHP','PKR','PLN','PYG',
  'QAR',
  'RON','RSD','RUB','RWF',
  'SAR','SBD','SCR','SDG','SEK','SGD','SLE','SLL','SOS','SRD','SSP','STN','SVC','SYP','SZL',
  'THB','TJS','TMT','TND','TOP','TRY','TTD','TWD','TZS',
  'UAH','UGX','USD','UYU','UZS',
  'VED','VES','VND','VUV',
  'WST',
  'XAF','XCD','XOF','XPF',
  'YER',
  'ZAR','ZMW','ZWL',
] as const;

export const templates = [
  // Free tier
  { id: 'modern' as TemplateType, name: 'Modern', description: 'Gradient header, bold typography', tier: 'free' as const },
  { id: 'classic' as TemplateType, name: 'Classic', description: 'Professional, timeless design', tier: 'free' as const },
  // Paid tier (Pro + Team — all 10 unlocked with any paid plan)
  { id: 'minimal' as TemplateType, name: 'Minimal', description: 'Clean and simple', tier: 'pro' as const },
  { id: 'clean' as TemplateType, name: 'Clean', description: 'White space, subtle borders', tier: 'pro' as const },
  { id: 'bold' as TemplateType, name: 'Bold', description: 'High contrast, large type', tier: 'pro' as const },
  { id: 'corporate' as TemplateType, name: 'Corporate', description: 'Two-column header, business-formal', tier: 'pro' as const },
  { id: 'startup' as TemplateType, name: 'Startup', description: 'Energetic, brand-color sidebar', tier: 'pro' as const },
  { id: 'freelancer' as TemplateType, name: 'Freelancer', description: 'Single column, generous whitespace', tier: 'pro' as const },
  { id: 'executive' as TemplateType, name: 'Executive', description: 'Formal, refined layout', tier: 'pro' as const },
  { id: 'agency' as TemplateType, name: 'Agency', description: 'Dark header, full-width design', tier: 'pro' as const },
  { id: 'consulting' as TemplateType, name: 'Consulting', description: 'Minimalist formal, mono accents', tier: 'pro' as const },
  { id: 'creative' as TemplateType, name: 'Creative', description: 'Bright accent stripe, big number', tier: 'pro' as const },
];

/**
 * Look up a template descriptor by id, and test whether a string is a known
 * template id. Hoisted from the 6 hand-rolled `templates.find(t => t.id === x)`
 * / `templates.some(t => t.id === x)` sites (validateInvoice, the clamp, the
 * preview tier check, the template-param consume, and the template-picker
 * selected-state). Each site paid a full linear scan and hand-asserted the
 * id-equality; centralizing keeps the "what is a valid template id" contract
 * in one place so a new template added to the array is automatically honored by
 * every consumer with no scattered .some() to forget to update. The render-time
 * `invoice.template === 'modern'` switch arms are exhaustive discriminators on
 * the TemplateType union (NOT id lookups), so they stay as-is — replacing them
 * with isTemplateId would be meaningless (they compare against literals, not a
 * variable id string).
 */
export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  tier: 'free' | 'pro';
}

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

// Type guard (not a plain boolean) so the two call sites that branch on this
// (validateInvoice below and the ?template= param parse in app/page.tsx) get
// `id` narrowed to TemplateType for free — dropping the `as TemplateType` casts
// those sites needed when this returned `boolean`. A cast after a runtime
// `isTemplateId(id)` check is exactly the pattern a type guard exists to
// replace, and leaving the casts in would let a future change to `templates`
// (e.g. widening TemplateType without updating the guard's `some`) silently
// keep compiling while narrowing to a value the guard didn't actually verify.
export function isTemplateId(id: string): id is TemplateType {
  return templates.some((t) => t.id === id);
}

/**
 * Pick a free-tier template id the user actually has access to, for the
 * load-time clamp (app/page.tsx) and the debounced-save pre-clamp-on-save path
 * (app/page.tsx). Derived from the server-configured allowed set
 * (limits.templates, shape `string[] | 'all'`) — NOT a hardcoded 'modern' — so
 * that if the free plan were ever configured to exclude 'modern' (e.g.
 * limits.templates = ['classic']), the clamp wouldn't pick a template the
 * download gate (hasTemplateAccess) then paywalls, locking the user out of the
 * very invoice the UI chose for them. Returns the first free-tier template id
 * in the allowed set, or 'modern' if none match (DEFAULT_LIMITS includes
 * 'modern', so this is 'modern' in the common case).
 *
 * SHARED by the clamp layout effect and the pre-clamp save effect so the two
 * sites can't drift: R27 #8 introduced the pre-clamp save path by duplicating
 * the clamp's `templates.find(...)?.id ?? 'modern'` expression verbatim, so a
 * future tweak to one site would silently diverge from the other — clamping the
 * live state to one template while the durable save wrote another. Routing
 * both through this helper makes the fallback a single-source invariant.
 */
export function freeFallbackTemplate(allowed: string[] | 'all'): TemplateType {
  const list = Array.isArray(allowed) ? allowed : [];
  return templates.find((t) => t.tier === 'free' && list.includes(t.id))?.id ?? 'modern';
}

// One Intl.NumberFormat per currency (construction is ~10x costlier than
// format, and formatCurrency is called ~2x per line item across the 12 PDF
// templates + the live preview). Built lazily and cached. Intl chooses the
// currency's native decimal precision automatically — no minorUnits map needed.
// Cached per (currency, variant). Both variants use a FIXED en-US locale so the
// output is deterministic across the SSR prerender (Node) and client hydration
// (browser) — an undefined locale would render "$" on the server but "US$" on a
// fr-FR client, a hydration mismatch on every prerendered currency string.
// 'preview' = en-US symbol (the browser renders Unicode); 'pdf' = ISO code
// (jsPDF's default WinAnsi font can't render non-ASCII glyphs like the rupee
// sign). The null (RangeError) case is cached too, so an invalid code doesn't
// re-throw on every call.
type CurrencyVariant = 'preview' | 'pdf';
const currencyFormatterCache = new Map<string, Intl.NumberFormat | null>();
function currencyFormatter(currency: string, variant: CurrencyVariant): Intl.NumberFormat | null {
  const key = `${variant}:${currency}`;
  const cached = currencyFormatterCache.get(key);
  if (cached !== undefined) return cached; // computed already (may be null)
  let nf: Intl.NumberFormat | null = null;
  try {
    nf =
      variant === 'pdf'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' })
        : new Intl.NumberFormat('en-US', { style: 'currency', currency });
  } catch {
    nf = null; // RangeError on an invalid/unknown ISO 4217 code
  }
  currencyFormatterCache.set(key, nf);
  return nf;
}

// O(1) ISO 4217 membership test — currencies is a ~160-entry tuple, so
// Array.includes is O(n). Backs validateInvoice + the editor's currency-validity
// check, both on hot paths (every load / every keystroke).
const CURRENCY_SET: ReadonlySet<string> = new Set(currencies);
export function isValidCurrencyCode(code: string): boolean {
  return CURRENCY_SET.has(code);
}

export function formatCurrency(amount: number, currency: string): string {
  const nf = currencyFormatter(currency, 'preview');
  return nf ? nf.format(amount) : `${currency} ${amount.toFixed(2)}`;
}

// Currency symbol/glyph for a code, for inputs that have no amount to format
// (e.g. the rate-field placeholder). Derived from the SAME Intl formatter so it
// can never disagree with formatCurrency; falls back to the raw code for an
// unknown currency rather than silently rendering '$'.
export function currencySymbol(code: string): string {
  const nf = currencyFormatter(code, 'preview');
  if (!nf) return code;
  const literal = nf.formatToParts(0).find((p) => p.type === 'currency');
  return literal ? literal.value : code;
}

// ASCII-safe, locale-deterministic currency formatting for the PDF path.
// jsPDF's default font is WinAnsi and CANNOT render non-ASCII currency glyphs
// (₹ ₪ ₽ ₺ …) or non-ASCII grouping separators (e.g. U+202F in fr/de locales),
// so the PDF uses the ISO 4217 CODE (always ASCII) under a fixed en-US locale.
// The on-screen preview (formatCurrency above) ALSO uses en-US (symbols), so the
// PDF and preview differ only in symbol-vs-code; both are deterministic across
// SSR prerender and client hydration. Both variants share ONE cache, keyed by
// variant — see currencyFormatter.
export function formatCurrencyPdf(amount: number, currency: string): string {
  // R8 fix: clamp NaN/Infinity to 0 so the PDF never renders "NaN" as a total.
  // Transient NaN happens mid-edit (e.g. user types "1-" in a rate field).
  const safe = Number.isFinite(amount) ? amount : 0;
  const nf = currencyFormatter(currency, 'pdf');
  return nf ? nf.format(safe) : `${currency} ${safe.toFixed(2)}`;
}

export function calculateTotals(
  items: InvoiceItem[],
  taxRate: number,
  // Issue #19: optional discount. Backward-compatible: omitted by every existing
  // caller (useInvoiceHistory, csv.ts, page.tsx, the 12 PDF renderers), so they
  // all keep getting { subtotal, tax, total } with no discount. The discount is
  // applied AFTER subtotal, BEFORE tax (per the issue spec) — so the taxable
  // base is (subtotal − discount), not the raw subtotal. The returned `discount`
  // is the ABSOLUTE amount subtracted (already resolved from percentage), so
  // callers that need it for a PDF/CSV line don't re-resolve it.
  discount?: DiscountConfig,
): { subtotal: number; discount: number; tax: number; total: number } {
  // R8 fix: guard each numeric input. quantity/rate can be NaN during editing;
  // taxRate is user-editable and can also go NaN mid-keystroke.
  const safeNum = (n: number) => Number.isFinite(n) ? n : 0;
  const safeTax = safeNum(taxRate);
  const subtotal = items.reduce((sum, item) => sum + safeNum(item.quantity) * safeNum(item.rate), 0);
  // Resolve the discount to an absolute amount. Zero/absent/invalid → 0, which
  // keeps the math (and the returned shape) identical to pre-#19 for callers
  // that don't pass a discount. Fixed amounts are clamped to [0, subtotal] so
  // a mistyped value can't drive the taxable base (or the total) negative;
  // percentages are clamped to [0, 100] for the same reason.
  let discountAmount = 0;
  if (discount && (discount.type === 'percentage' || discount.type === 'fixed')) {
    const raw = safeNum(discount.value);
    if (discount.type === 'percentage') {
      const pct = Math.max(0, Math.min(100, raw));
      discountAmount = subtotal * (pct / 100);
    } else {
      discountAmount = Math.max(0, Math.min(subtotal, raw));
    }
  }
  const taxableBase = subtotal - discountAmount;
  const tax = taxableBase * (safeTax / 100);
  const total = taxableBase + tax;
  return { subtotal, discount: discountAmount, tax, total };
}

// ─── Issue #21: TaxConfig resolution + helpers ───────────────────────────
// resolveTaxConfig returns a fully-populated TaxConfig for an invoice:
//   - If `invoice.taxConfig` is present (and structurally valid), it's used
//     directly (rate coerced to a finite number, label coerced to a known
//     TaxLabel — a crafted payload can't smuggle an arbitrary string).
//   - Otherwise we synthesize one from `invoice.taxRate` (the legacy flat
//     field). This keeps every consumer backward-compatible: callers that used
//     `invoice.taxRate` switch to `resolveTaxConfig(invoice).rate` and keep
//     rendering the same value for existing saved invoices.
//
// `taxId` falls back to `invoice.from.taxId` so the PDF surfaces the seller's
// registration number by the VAT label even when the user hasn't filled the
// TaxConfig-specific field. `buyerTaxId` falls back to `invoice.to.taxId` so
// the reverse-charge annotation can name the buyer's registration number from
// the party block without a duplicate field.
export function resolveTaxConfig(invoice: Pick<Invoice, 'taxRate' | 'taxConfig' | 'from' | 'to'>): TaxConfig {
  const cfg = invoice.taxConfig;
  const fallbackRate = Number.isFinite(invoice.taxRate) ? invoice.taxRate : 0;
  if (cfg && typeof cfg === 'object') {
    const rate = Number.isFinite(cfg.rate) ? Math.max(0, Math.min(100, cfg.rate)) : fallbackRate;
    const label = isValidTaxLabel(cfg.label) ? cfg.label : 'Tax';
    const customLabel = typeof cfg.customLabel === 'string' && cfg.customLabel.trim() ? cfg.customLabel : undefined;
    return {
      label,
      customLabel,
      rate,
      taxId: optString(cfg.taxId) ?? optString(invoice.from.taxId),
      buyerTaxId: optString(cfg.buyerTaxId) ?? optString(invoice.to.taxId),
      reverseCharge: cfg.reverseCharge === true,
    };
  }
  return {
    label: 'Tax',
    rate: fallbackRate,
    taxId: optString(invoice.from.taxId),
    buyerTaxId: optString(invoice.to.taxId),
    reverseCharge: false,
  };
}

// The human label for the tax LINE on the PDF — "VAT" / "GST" / "Sales Tax" /
// "MwSt" / "Tax", or the user's customLabel when label==='Custom'. Used by the
// PDF's totalsFoot and the editor's live preview.
export function taxConfigLabel(cfg: TaxConfig): string {
  if (cfg.label === 'Custom' && cfg.customLabel) return cfg.customLabel;
  return TAX_LABEL_DISPLAY[cfg.label] ?? 'Tax';
}

// A reverse-charge invoice does NOT add tax to the total — the buyer accounts
// for it on their own VAT return (EU reverse-charge mechanism, B2B across
// member states). calculateTotals() itself stays flat-rate (issue constraint:
// don't touch it), so reverseCharge is applied as a post-step by callers:
// resolveTaxConfig gives them `reverseCharge`, and they subtract the tax when
// computing the final total. See pdf.ts (totalsFootRC + rcTotal) for the
// canonical PDF path and the editor preview mirror.
export function rcTotal(totals: { subtotal: number; tax: number; total: number }, reverseCharge: boolean): { tax: number; total: number } {
  if (!reverseCharge) return { tax: totals.tax, total: totals.total };
  // Tax is still reported (it's the reverse-charge amount the buyer must
  // self-account for), but it is NOT added to the seller's total.
  return { tax: totals.tax, total: totals.subtotal };
}

function isValidTaxLabel(v: unknown): v is TaxLabel {
  return typeof v === 'string' && (TAX_LABELS as readonly string[]).includes(v);
}

// Sanitize a raw discount at the validateInvoice ingestion boundary: a crafted
// payload may carry an unknown type or NaN value. Returns undefined when the
// payload isn't a usable object (so calculateTotals / totalsFoot / CSV all skip
// the discount via their `if (discount && …)` guards) — never throws. A value
// of 0 is KEPT (the user might explicitly clear a discount), which is harmless
// because the totals path treats 0 as "no discount" and the PDF row is gated on
// `discount.value > 0`. Returned `type` is always a known DiscountType literal.
function sanitizeDiscount(v: unknown): DiscountConfig | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const o = v as Record<string, unknown>;
  const type = o.type === 'fixed' ? 'fixed' : 'percentage'; // default → percentage
  const value = typeof o.value === 'number' && Number.isFinite(o.value)
    ? Math.max(0, o.value) // negative makes no sense as a discount magnitude
    : 0;
  return { type, value };
}

// Sanitize a raw taxConfig at the validateInvoice ingestion boundary: a
// crafted payload may carry an unknown label, NaN rate, or wrong-typed
// reverseCharge. Returns undefined when the payload isn't a usable object so
// the migration helper resolves from taxRate instead — never throws.
function sanitizeTaxConfig(v: unknown, fallbackRate: number, fromTaxId: string | undefined, toTaxId: string | undefined): TaxConfig | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const o = v as Record<string, unknown>;
  const label = isValidTaxLabel(o.label) ? o.label : 'Tax';
  const rate = typeof o.rate === 'number' && Number.isFinite(o.rate)
    ? Math.max(0, Math.min(100, o.rate))
    : fallbackRate;
  return {
    label,
    customLabel: typeof o.customLabel === 'string' && o.customLabel.trim() ? o.customLabel : undefined,
    rate,
    taxId: optString(o.taxId) ?? fromTaxId,
    buyerTaxId: optString(o.buyerTaxId) ?? toTaxId,
    reverseCharge: o.reverseCharge === true,
  };
}

export function generateId(): string {
  return typeof window !== 'undefined' && 'crypto' in window
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const MAX_LOGO_SIZE = 1024 * 1024; // 1MB
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Return a copy of `inv` with the from/to logos removed (set to undefined).
 * Logos are ~1 MB base64 strings and are stored in their OWN side-keys
 * (logoStorageKey) rather than inside the JSON invoice blob, so any invoice
 * written to localStorage — billify_current, a share/handoff payload, or a
 * history snapshot — is persisted logo-stripped and reassembled from the
 * side-keys on load. Centralizing the strip here keeps the three write sites
 * (persistInvoice, handoffUrl, useInvoiceHistory snapshots) from drifting.
 */
export function stripLogos(inv: Invoice): Invoice {
  return {
    ...inv,
    from: { ...inv.from, logo: undefined },
    to: { ...inv.to, logo: undefined },
  };
}

function isValidString(v: unknown): v is string {
  return typeof v === 'string';
}
function isValidNumber(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v);
}
function isValidCompanyInfo(v: unknown): v is CompanyInfo {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isValidString(o.name) && isValidString(o.email) && isValidString(o.address) && isValidString(o.phone);
}

// Canonical option lists — shared by validateInvoice AND the editor <select>s so
// the values a user can pick and the values the validator accepts can't drift
// (single source of truth). Exported for src/app/app/page.tsx + src/lib/pdf.ts.
export const TAX_CATEGORIES = ['standard', 'reduced', 'zero', 'exempt', 'reverse', 'excluded'] as const;
export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  standard: 'Standard rate',
  reduced: 'Reduced rate',
  zero: 'Zero-rated',
  exempt: 'Exempt',
  reverse: 'Reverse charge',
  excluded: 'Outside tax scope',
};
// Common UN/ECE Recommendation 20 unit codes for the per-line Unit picker.
// unitCode stays a free string at the validation boundary (Rec 20 has hundreds
// of codes); this list is the editor's convenience set.
export const UNIT_CODES = [
  { code: 'C62', label: 'Piece' },
  { code: 'HUR', label: 'Hour' },
  { code: 'DAY', label: 'Day' },
  { code: 'WEE', label: 'Week' },
  { code: 'MON', label: 'Month' },
  { code: 'ANN', label: 'Year' },
  { code: 'KGM', label: 'Kilogram' },
  { code: 'MTR', label: 'Metre' },
  { code: 'LTR', label: 'Litre' },
] as const;
// UN/ECE 4461 payment-means codes offered in the editor + rendered by the PDF
// drawDetails block. DEFAULT_PAYMENT_CODE is the SEPA value updatePayment pins
// when bank details are typed before a method is chosen.
// UN/ECE 4461 payment-means codes offered in the editor + rendered by the PDF
// drawDetails block. An ordered ARRAY (not a Record) so the dropdown iteration
// order is source-controlled — integer-like keys ('1','58',…) in a Record would
// be enumerated in ascending numeric order by the JS engine, surfacing 'Cash'
// before 'SEPA' regardless of the literal. DEFAULT_PAYMENT_CODE is the SEPA
// value updatePayment pins when bank details are typed before a method is chosen.
export const PAYMENT_METHODS = [
  { code: '58', label: 'Bank transfer (SEPA)' },
  { code: '30', label: 'Credit transfer' },
  { code: '49', label: 'Direct debit' },
  { code: '48', label: 'Bank card' },
  { code: '1', label: 'Cash' },
] as const;
export function paymentMethodLabel(code: string): string | undefined {
  return PAYMENT_METHODS.find((p) => p.code === code)?.label;
}
export const DEFAULT_PAYMENT_CODE = '58';
function isValidTaxCategory(v: unknown): v is TaxCategory {
  return isValidString(v) && (TAX_CATEGORIES as readonly string[]).includes(v);
}
function isValidPaymentMeans(v: unknown): v is PaymentMeans {
  if (typeof v !== 'object' || v === null) return false;
  const code = (v as Record<string, unknown>).code;
  // code is required and must be non-empty: isValidString('') is true, so an
  // explicit empty check keeps a crafted {code:''} payload from being retained.
  return isValidString(code) && code !== '';
}
// Optional-string coercion at the validateInvoice ingestion boundary: a
// malformed (non-string) value normalizes to undefined instead of being carried
// through into billify_current / share links.
function optString(v: unknown): string | undefined {
  return isValidString(v) ? v : undefined;
}
// Builds a fully-validated CompanyInfo from raw input, called only AFTER the
// isValidCompanyInfo guard has confirmed name/email/address/phone are strings,
// so those four are read straight through; the optional fields (incl. logo) are
// each re-validated so a crafted payload can't smuggle a bad value past the
// strict rebuild. Centralizing this keeps the from/to extraction DRY and means a
// new CompanyInfo field has exactly ONE place to be added (else it's dropped on
// reload — see the validateInvoice invariant).
function sanitizeCompanyInfo(v: unknown): CompanyInfo {
  const o = v as CompanyInfo;
  return {
    name: o.name,
    email: o.email,
    address: o.address,
    phone: o.phone,
    logo: sanitizeLogo(o.logo),
    taxId: optString(o.taxId),
    addressLine2: optString(o.addressLine2),
    city: optString(o.city),
    region: optString(o.region),
    postalCode: optString(o.postalCode),
    country: optString(o.country),
  };
}

// Logo validation at the data-ingestion boundary. MAX_LOGO_SIZE and
// ALLOWED_LOGO_TYPES are enforced at upload time in handleLogoUpload, but every
// other ingestion path — a crafted /app?invoice=<base64url> share link, the
// full-screen handoff (peekHandoff/consumeHandoff), and restore-from-billify_current — goes
// through validateInvoice with NO logo check, so a crafted link could stash a
// >1MB or wrong-scheme (e.g. SVG, which we refuse at upload for security) logo
// into billify_current, bloating localStorage and rendering untrusted markup.
// Validate here so the cap is a data-time invariant, not just an upload-time
// one. DROP an invalid logo (set undefined) rather than rejecting the whole
// invoice, so a bad logo on an otherwise-valid handoff/share doesn't destroy
// the user's data. The size check measures the DECODED byte length (matching
// how upload measures file.size), NOT the data-URL string length — base64
// inflates ~1.37x, so a string-length cap would wrongly strip a legitimate
// 1MB-uploaded logo on every reload from billify_current.
//
// LOGO_RE is DERIVED from ALLOWED_LOGO_TYPES, not hand-rolled as a regex
// alternation, so the allowed-MIME set lives in exactly one place. A hand-rolled
// `png|jpeg|webp` here would silently drift from the upload allowlist: adding a
// type (e.g. image/avif) to ALLOWED_LOGO_TYPES would make upload accept it but
// sanitizeLogo silently strip it on every handoff/restore round-trip — the user
// uploads a logo, it persists, then disappears with no error. Deriving the
// regex keeps the two validators in lockstep automatically.
const LOGO_RE = new RegExp(
  '^data:image/(' + ALLOWED_LOGO_TYPES.map((t) => t.replace('image/', '')).join('|') + ');base64,',
);

/**
 * Shared, allowlist-derived logo-data-URL validator. Enforces BOTH the MIME
 * prefix (LOGO_RE, derived from ALLOWED_LOGO_TYPES so the allowed set lives in
 * exactly one place) and the decoded-byte cap (MAX_LOGO_SIZE). Used by the two
 * ingestion boundaries that need a data-URL shape check:
 *  - sanitizeLogo (every non-upload ingestion: handoff, ?invoice=, restore from
 *    billify_current) — drops an invalid logo to undefined rather than rejecting
 *    the whole invoice.
 *  - handleLogoUpload (the upload path) — the authoritative gate there is
 *    file.type/file.size, but the FileReader result is re-checked here as
 *    defense-in-depth and to avoid a second, weaker hand-rolled `data:image/`
 *    prefix check (plus a dead svg branch — svg is already refused by the
 *    file.type allowlist before readAsDataURL can produce an svg data URL).
 *
 * The decoded byte length is derivable from the base64 string length in O(1) —
 * `floor(len*3/4) - padding` — so we do NOT atob the whole payload (which
 * allocates a ~1MB binary string and blocks the main thread) just to read
 * .length. This runs on every /app mount via the restore-from-billify_current
 * path and (once more) on the ?invoice= share-link path, so the O(1) form turns
 * a per-load ~1MB decode into a constant-time arithmetic check.
 */
export function isValidLogoDataUrl(s: string): boolean {
  if (s.length === 0) return false;
  if (!LOGO_RE.test(s)) return false;
  // Derive the base64 payload length and padding from offsets into `s` itself,
  // WITHOUT slicing. `s.slice(s.indexOf(',') + 1)` would materialize the entire
  // ~1.37MB payload as a new JS string just so the next two lines could read
  // `.length` and `.endsWith('=')`, then immediately discard it — running on
  // every /app mount via restore-from-billify_current (twice when both from/to
  // logos are present). The payload is the trailing segment after the
  // `data:...;base64,` prefix LOGO_RE already matched, so its length is
  // `s.length - (commaPos + 1)` and the padding is the trailing `=`/`==` of `s`
  // itself. This keeps the per-load logo check constant-time + zero-allocation —
  // the O(1) intent the docblock above describes, which the prior slice quietly
  // violated. (The `typeof s !== 'string'` guard that used to lead this function
  // was unreachable: the signature is `string` and the only caller, sanitizeLogo,
  // narrows `typeof v === 'string'` first, so it is omitted.)
  const commaPos = s.indexOf(',');
  const b64Len = s.length - (commaPos + 1);
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  const decodedLen = Math.floor((b64Len * 3) / 4) - pad;
  // Lower bound: reject degenerate/zero-length payloads. LOGO_RE is unanchored
  // at the end (it matches only the `data:image/(png|jpeg|webp);base64,` prefix),
  // so the remainder is never structurally validated. A crafted `data:image/png;
  // base64,` (empty payload, b64Len=0, pad=0 → decodedLen=0), `...,=` (b64Len=1,
  // pad=1 → decodedLen=-1) or `...,==` (b64Len=2, pad=2 → decodedLen=-1) all match
  // LOGO_RE and used to pass because the prior check was UPPER-bound only
  // (`decodedLen <= MAX_LOGO_SIZE` is true for 0 and -1). A crafted
  // /app?invoice=<base64url> share link (or a handoff stash) could then set
  // from/to.logo to such a string — it survives sanitizeLogo (returns it
  // unchanged), persists to the billify_logo_* side-keys, and renders as a
  // broken image in the preview and the exported PDF. Impact is low (cosmetic,
  // ~30 bytes, and the passive ?invoice= path requires explicit adoption before
  // it persists), but the validator's stated job is to enforce the data-URL
  // shape at every ingestion boundary, so a non-positive decoded length is a
  // malformed payload and is rejected here. `decodedLen > 0` also covers the
  // empty-payload case (b64Len=0 → decodedLen=0), so no separate b64Len guard.
  return decodedLen > 0 && decodedLen <= MAX_LOGO_SIZE;
}

function sanitizeLogo(v: unknown): string | undefined {
  return typeof v === 'string' && isValidLogoDataUrl(v) ? v : undefined;
}
function isValidItem(v: unknown): v is InvoiceItem {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isValidString(o.description) && isValidNumber(o.quantity) && isValidNumber(o.rate);
}

export function validateInvoice(raw: unknown): Invoice | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  // isValidItem stays LENIENT (only the 3 required fields), so old invoices
  // don't drop items. The optional taxCategory/unitCode are then attached by an
  // explicit, validated map — never trusted from the raw object.
  const items: InvoiceItem[] = Array.isArray(o.items)
    ? o.items.filter(isValidItem).map((it) => ({
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        ...(isValidTaxCategory(it.taxCategory) ? { taxCategory: it.taxCategory } : {}),
        ...(isValidString(it.unitCode) ? { unitCode: it.unitCode } : {}),
      }))
    : [];
  if (!items.length) return null;
  if (!isValidCompanyInfo(o.from) || !isValidCompanyInfo(o.to)) return null;
  const template = isValidString(o.template) && isTemplateId(o.template)
    ? o.template
    : 'modern';
  // Accept any ISO 4217 code (was USD/EUR/GBP only). Warn on a present-but-
  // unknown code so a mistyped currency is debuggable instead of silently
  // downgraded to USD.
  let currency: string;
  if (isValidString(o.currency) && isValidCurrencyCode(o.currency)) {
    currency = o.currency;
  } else {
    if (isValidString(o.currency)) console.warn(`[billify] unknown currency "${o.currency}", falling back to USD`);
    currency = 'USD';
  }
  const paymentMeans: PaymentMeans | undefined = isValidPaymentMeans(o.paymentMeans)
    ? {
        code: o.paymentMeans.code,
        iban: optString(o.paymentMeans.iban),
        bic: optString(o.paymentMeans.bic),
        accountName: optString(o.paymentMeans.accountName),
      }
    : undefined;
  // Issue #21: taxRate stays the canonical flat-rate field (clamped, backward-
  // compatible). taxConfig is the OPTIONAL structured sibling — sanitized so a
  // crafted payload can't smuggle an unknown label, a NaN rate, or a wrong-
  // typed reverseCharge. When absent it stays undefined and resolveTaxConfig
  // synthesizes one from taxRate at render time.
  const taxRate = isValidNumber(o.taxRate) ? Math.max(0, Math.min(100, o.taxRate)) : 0;
  // from/to haven't been sanitized yet at this point (that happens below), so
  // read their taxId defensively via the unknown-cast path used elsewhere in
  // this validator — an absent or non-object from/to is already rejected by
  // isValidCompanyInfo above, so we only get here with a usable shape.
  const fromTaxId = optString((o.from as unknown as Record<string, unknown> | undefined)?.taxId);
  const toTaxId = optString((o.to as unknown as Record<string, unknown> | undefined)?.taxId);
  const taxConfig = sanitizeTaxConfig(o.taxConfig, taxRate, fromTaxId, toTaxId);
  // Issue #19: optional discount. sanitizeDiscount returns undefined for a
  // non-object payload, so pre-#19 invoices (no discount field) stay undefined
  // and calculateTotals / totalsFoot / CSV all skip the discount row. A value
  // of 0 is retained but treated as "no discount" by the rendering path.
  const discount = sanitizeDiscount(o.discount);
  return {
    id: isValidString(o.id) ? o.id : generateId(),
    number: isValidString(o.number) ? o.number : `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    date: isValidString(o.date) ? o.date : new Date().toISOString().split('T')[0],
    dueDate: isValidString(o.dueDate) ? o.dueDate : new Date().toISOString().split('T')[0],
    from: sanitizeCompanyInfo(o.from),
    to: sanitizeCompanyInfo(o.to),
    items,
    notes: isValidString(o.notes) ? o.notes : '',
    terms: isValidString(o.terms) ? o.terms : 'Net 14',
    taxRate,
    taxConfig,
    discount,
    currency,
    template,
    status: isValidString(o.status) && ['draft', 'sent', 'paid'].includes(o.status) ? (o.status as InvoiceStatus) : 'draft',
    createdAt: isValidNumber(o.createdAt) ? o.createdAt : Date.now(),
    updatedAt: isValidNumber(o.updatedAt) ? o.updatedAt : Date.now(),
    purchaseOrder: optString(o.purchaseOrder),
    leitwegId: optString(o.leitwegId),
    paymentMeans,
  };
}

// ---------------------------------------------------------------------------
// Client directory (Pro feature — free tier limited to 3 clients)
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  defaultCurrency?: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Invoice history (localStorage — status tracking without a backend)
// ---------------------------------------------------------------------------

export type HistoryStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface InvoiceRecord {
  id: string;         // matches Invoice.id for load-back-into-editor
  number: string;
  clientName: string;
  amount: number;
  currency: string;
  date: string;
  dueDate: string;
  status: HistoryStatus;
  paidDate?: string;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Backup / restore schema
// ---------------------------------------------------------------------------

export interface BillifyBackup {
  version: 1;
  exportedAt: string; // ISO timestamp
  clients: Client[];
  history: InvoiceRecord[];
  // Full (logo-stripped) invoice snapshots keyed by invoice id, used by the
  // History panel's "Load into editor" action. Optional so backups from before
  // snapshots existed still parse (they load with Load disabled, gracefully).
  snapshots?: Record<string, Invoice>;
  counter: number | null;
  currentInvoice: Invoice | null;
}

export const FREE_CLIENT_LIMIT = 3;

export function createEmptyClient(): Client {
  return {
    id: generateId(),
    name: '',
    email: '',
    phone: '',
    address: '',
    createdAt: Date.now(),
  };
}

export function createEmptyInvoice(): Invoice {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const due = new Date();
  due.setDate(due.getDate() + 14);
  return {
    id: generateId(),
    number: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    date: today,
    dueDate: due.toISOString().split('T')[0],
    from: { name: '', email: '', address: '', phone: '' },
    to: { name: '', email: '', address: '', phone: '' },
    items: [{ description: '', quantity: 1, rate: 0 }],
    notes: '',
    terms: 'Net 14',
    taxRate: 0,
    currency: 'USD',
    template: 'modern',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}
