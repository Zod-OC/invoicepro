export interface CompanyInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
  logo?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'clean' | 'bold' | 'executive' | 'corporate' | 'startup' | 'freelancer' | 'agency' | 'consulting' | 'creative';
export type InvoiceStatus = 'draft' | 'sent' | 'paid';

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
  currency: string;
  template: TemplateType;
  status: InvoiceStatus;
  createdAt: number;
  updatedAt: number;
}

export const currencies = ['USD', 'EUR', 'GBP'] as const;
export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

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

export function formatCurrency(amount: number, currency: string): string {
  const sym = currencySymbols[currency] || '$';
  return `${sym}${amount.toFixed(2)}`;
}

export function calculateTotals(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function generateId(): string {
  return typeof window !== 'undefined' && 'crypto' in window
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const MAX_LOGO_SIZE = 1024 * 1024; // 1MB
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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
  const items = Array.isArray(o.items) ? o.items.filter(isValidItem) : [];
  if (!items.length) return null;
  if (!isValidCompanyInfo(o.from) || !isValidCompanyInfo(o.to)) return null;
  const template = isValidString(o.template) && isTemplateId(o.template)
    ? o.template
    : 'modern';
  return {
    id: isValidString(o.id) ? o.id : generateId(),
    number: isValidString(o.number) ? o.number : `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    date: isValidString(o.date) ? o.date : new Date().toISOString().split('T')[0],
    dueDate: isValidString(o.dueDate) ? o.dueDate : new Date().toISOString().split('T')[0],
    from: { ...(o.from as CompanyInfo), logo: sanitizeLogo(o.from.logo) },
    to: { ...(o.to as CompanyInfo), logo: sanitizeLogo(o.to.logo) },
    items,
    notes: isValidString(o.notes) ? o.notes : '',
    terms: isValidString(o.terms) ? o.terms : 'Net 14',
    taxRate: isValidNumber(o.taxRate) ? Math.max(0, Math.min(100, o.taxRate)) : 0,
    currency: isValidString(o.currency) && currencies.includes(o.currency as typeof currencies[number]) ? o.currency as typeof currencies[number] : 'USD',
    template,
    status: isValidString(o.status) && ['draft', 'sent', 'paid'].includes(o.status) ? (o.status as InvoiceStatus) : 'draft',
    createdAt: isValidNumber(o.createdAt) ? o.createdAt : Date.now(),
    updatedAt: isValidNumber(o.updatedAt) ? o.updatedAt : Date.now(),
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
