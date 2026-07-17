// "Invoice Tax & Compliance Guide by Country" — the linkable/AEO asset from the
// growth audit. A reference page other sites cite (→ backlinks → domain authority
// that lifts every page), and content AI Overviews can lift verbatim (the EU
// mandate timeline especially).
//
// ACCURACY POLICY: tax rates and e-invoice dates are general, dated figures
// drawn from the verified audit matrix + public standard rates. The page carries
// a prominent "not tax advice — verify with your authority" disclaimer. Re-check
// quarterly (dates drift). Do NOT state definitive compliance — scope to what's
// verifiable and link to official sources in the copy.

export type EInvoiceStatus = 'none' | 'receive-only' | 'mandatory' | 'planned';

export interface TaxCountry {
  /** ISO 3166-1 alpha-2, for display + flag-emoji if ever added. */
  code: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  /** Local tax name, e.g. "VAT", "GST", "MwSt", "Sales tax". */
  taxName: string;
  /** Standard rate as a display string, e.g. "20%" or "0% (no GST/VAT)". */
  standardRate: string;
  /** Registration threshold (display string). */
  registrationThreshold: string;
  eInvoiceStatus: EInvoiceStatus;
  /** One-line e-invoice status detail. */
  eInvoiceDetail: string;
  /** 40–60 word freelancer-relevant note. */
  freelancerNote: string;
}

export interface MandateMilestone {
  /** ISO date or "since YYYY-MM" / "by YYYY". */
  date: string;
  region: string;
  event: string;
}

export const TAX_GUIDE_UPDATED_AT = '2026-07-17';

export const TAX_COUNTRIES: TaxCountry[] = [
  {
    code: 'DE', name: 'Germany', currencyCode: 'EUR', currencyName: 'Euro',
    taxName: 'MwSt (VAT)', standardRate: '19%',
    registrationThreshold: 'Kleinunternehmer scheme ≈ €25k/yr turnover (2025)',
    eInvoiceStatus: 'receive-only',
    eInvoiceDetail: 'Receiving structured e-invoices mandatory since 1 Jan 2025; issuance required >€800k turnover from 1 Jan 2027, all others 1 Jan 2028 (Kleinunternehmer & invoices ≤€250 exempt). Decentralised — a self-generated XRechnung/ZUGFeRD file is compliant.',
    freelancerNote: 'Germany is moving to mandatory e-invoicing on a decentralised model — you can self-generate a compliant XML file without a government portal. If you\'re under the Kleinunternehmer threshold or turn over little, your obligation arrives last (2028). Standard VAT is 19%, reduced 7%.',
  },
  {
    code: 'FR', name: 'France', currencyCode: 'EUR', currencyName: 'Euro',
    taxName: 'TVA (VAT)', standardRate: '20%',
    registrationThreshold: 'Franchise en base TVA ≈ €91.9k/yr (services)',
    eInvoiceStatus: 'planned',
    eInvoiceDetail: 'Receiving structured e-invoices mandatory 1 Sep 2026; SME/micro issuance deferred to Sep 2027. CTC model — a self-generated file alone is NOT compliant; a certified Plateforme Agréée must transmit. Cross-border (non-FR→FR) does not use the PA route.',
    freelancerNote: 'France is a clearance (CTC) market — unlike Germany, you can\'t just generate a file; it must go through a certified platform. Cross-border invoices follow a different rule. Standard TVA is 20%, reduced 5.5%/10%. Under the franchise threshold you don\'t charge TVA.',
  },
  {
    code: 'IT', name: 'Italy', currencyCode: 'EUR', currencyName: 'Euro',
    taxName: 'IVA (VAT)', standardRate: '22%',
    registrationThreshold: 'Flat-rate (forfettario) regime up to €85k/yr turnover',
    eInvoiceStatus: 'mandatory',
    eInvoiceDetail: 'All B2B and B2C e-invoicing is mandatory via the SDI (Sistema di Interscambio) exchange since 2019 — the longest-running national mandate in the EU.',
    freelancerNote: 'Italy is the EU\'s most mature e-invoice market — every invoice goes through the SDI exchange. If you bill Italian clients, expect to use it. Standard IVA is 22%. Many freelancers use the forfettario flat-rate regime, which has its own rules.',
  },
  {
    code: 'ES', name: 'Spain', currencyCode: 'EUR', currencyName: 'Euro',
    taxName: 'IVA (VAT)', standardRate: '21%',
    registrationThreshold: 'No general VAT threshold (register from first sale)',
    eInvoiceStatus: 'planned',
    eInvoiceDetail: 'Veri*Factu (mandatory invoicing-system verification for certain B2B software) rolling out 2026; SII (immediate supply of info) already applies to large VAT taxpayers.',
    freelancerNote: 'Spain is layering Veri*Factu (anti-fraud invoicing-system rules) on top of existing IVA rules. Standard IVA is 21%, reduced 10%/4%. There\'s no general VAT registration threshold, so you typically register from your first sale.',
  },
  {
    code: 'NL', name: 'Netherlands', currencyCode: 'EUR', currencyName: 'Euro',
    taxName: 'BTW (VAT)', standardRate: '21%',
    registrationThreshold: 'Small-business scheme (KOR) up to €20k/yr',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No national B2B mandate yet; Peppol widely adopted. Falls under the EU ViDa cross-border rule from 1 Jul 2030.',
    freelancerNote: 'The Netherlands has no current national e-invoice mandate for freelancers (ViDa arrives 2030). Standard BTW is 21%, reduced 9%. The small-business scheme (KOR) exempts you from charging BTW up to €20k turnover.',
  },
  {
    code: 'IE', name: 'Ireland', currencyCode: 'EUR', currencyName: 'Euro',
    taxName: 'VAT', standardRate: '23%',
    registrationThreshold: '€85k/yr (services)',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No national B2B e-invoice mandate; EU ViDa applies from 1 Jul 2030.',
    freelancerNote: 'Ireland has no current e-invoice mandate (ViDa in 2030). Standard VAT is 23%, reduced 13.5%/9%. You must register for VAT above €85k services turnover; below it, registration is optional.',
  },
  {
    code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', currencyName: 'Pound sterling',
    taxName: 'VAT', standardRate: '20%',
    registrationThreshold: '£90k/yr turnover',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No mandate; government consulted (Nov 2025) on a decentralised Peppol model, expected ~2029.',
    freelancerNote: 'The UK has no e-invoice mandate yet (a Peppol-style model is under consultation, ~2029). Standard VAT is 20%, reduced 5%. VAT registration is mandatory above £90k turnover; the Making Tax Digital rules already require digital record-keeping.',
  },
  {
    code: 'US', name: 'United States', currencyCode: 'USD', currencyName: 'US dollar',
    taxName: 'Sales tax (state)', standardRate: 'Avg ≈ 6.6% (state/county; 0% in DE, MT, NH, OR)',
    registrationThreshold: 'State-specific economic nexus (~$100k–$500k sales)',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No federal VAT or e-invoice mandate; sales tax is state/county-level, and a few states run voluntary e-invoicing pilots.',
    freelancerNote: 'The US has no federal VAT — sales tax is handled state-by-state (and five states have none). Most service-providing freelancers owe no sales tax, but rules vary. Issue clean invoices with clear line items; track state nexus if you sell goods.',
  },
  {
    code: 'CA', name: 'Canada', currencyCode: 'CAD', currencyName: 'Canadian dollar',
    taxName: 'GST/HST', standardRate: 'GST 5% (+ provincial HST 13–15% in participating provinces)',
    registrationThreshold: 'C$30k/yr (small-supplier threshold)',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No federal e-invoice mandate; Peppol adopted voluntarily by some businesses and government.',
    freelancerNote: 'Canada charges 5% GST federally, with HST (harmonized, 13–15%) in some provinces. The C$30k small-supplier threshold means many new freelancers don\'t need to register immediately. Provincial rules (QST in Québec) layer on top.',
  },
  {
    code: 'AU', name: 'Australia', currencyCode: 'AUD', currencyName: 'Australian dollar',
    taxName: 'GST', standardRate: '10%',
    registrationThreshold: 'A$75k/yr turnover',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No business mandate; eInvoicing via Peppol is government-led and voluntary for suppliers.',
    freelancerNote: 'Australia charges 10% GST, with registration required above A$75k turnover. The ABN (Australian Business Number) goes on your invoices, and Peppol e-invoicing is available but not mandatory for freelancers.',
  },
  {
    code: 'SG', name: 'Singapore', currencyCode: 'SGD', currencyName: 'Singapore dollar',
    taxName: 'GST', standardRate: '9%',
    registrationThreshold: 'S$1M/yr turnover',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No mandate; the InvoiceNow (Peppol) network is actively encouraged by government.',
    freelancerNote: 'Singapore\'s GST rose to 9% in 2024, with registration needed above S$1M turnover — so most freelancers don\'t register. The InvoiceNow e-invoice network is encouraged but optional.',
  },
  {
    code: 'NZ', name: 'New Zealand', currencyCode: 'NZD', currencyName: 'New Zealand dollar',
    taxName: 'GST', standardRate: '15%',
    registrationThreshold: 'NZ$60k/yr turnover',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No mandate; Peppol e-invoicing available via the BusinessNZ network.',
    freelancerNote: 'New Zealand charges 15% GST, one of the higher rates but with a high NZ$60k registration threshold. GST-registered businesses must show GST on invoices and file returns.',
  },
  {
    code: 'HK', name: 'Hong Kong', currencyCode: 'HKD', currencyName: 'Hong Kong dollar',
    taxName: 'None (no GST/VAT)', standardRate: '0% — no GST or VAT',
    registrationThreshold: 'N/A (profits tax applies instead, ~16.5%)',
    eInvoiceStatus: 'none',
    eInvoiceDetail: 'No GST/VAT and no e-invoice mandate.',
    freelancerNote: 'Hong Kong has no GST or VAT — invoicing is simpler, with no consumption-tax line. Profits tax (~16.5% for corporations, 15% for unincorporated) is handled separately, not on each invoice.',
  },
  {
    code: 'AE', name: 'United Arab Emirates', currencyCode: 'AED', currencyName: 'UAE dirham',
    taxName: 'VAT', standardRate: '5%',
    registrationThreshold: 'AED 375k/yr mandatory (AED 187.5k voluntary)',
    eInvoiceStatus: 'planned',
    eInvoiceDetail: 'Phase 2 e-invoicing (clearance model) planned for large taxpayers ~2026, broader rollout after.',
    freelancerNote: 'The UAE has one of the world\'s lowest VAT rates at 5%, with mandatory registration above AED 375k. A clearance-model e-invoice system is rolling out for large taxpayers first, so watch this space if you bill UAE clients.',
  },
];

// The EU e-invoicing timeline — the high-value, AEO-citable core of the guide.
// Verified against primary sources (EUR-Lex, BMF, AEAT, etc.) in the growth audit.
export const EU_MANDATE_TIMELINE: MandateMilestone[] = [
  { date: 'Since 2019', region: 'Italy', event: 'All B2B/B2C e-invoicing mandatory via the SDI exchange.' },
  { date: '1 Jan 2025', region: 'Germany', event: 'Receiving structured e-invoices mandatory (issuance phased 2027–2028).' },
  { date: '1 Jan 2026', region: 'Belgium', event: 'All VAT taxpayers must issue + receive structured B2B (EN 16931).' },
  { date: '1 Feb 2026', region: 'Poland', event: 'KSeF mandatory for large taxpayers (FA(3) format, not UBL).' },
  { date: '2026', region: 'Spain', event: 'Veri*Factu invoicing-system verification rolling out.' },
  { date: '1 Sep 2026', region: 'France', event: 'Receiving structured e-invoices mandatory (SME/micro issuance deferred to Sep 2027; CTC).' },
  { date: '1 Jan 2027', region: 'Germany', event: 'Issuance mandatory for businesses >€800k turnover.' },
  { date: '~2029', region: 'United Kingdom', event: 'Decentralised Peppol e-invoicing expected (consulted Nov 2025).' },
  { date: '1 Jul 2030', region: 'EU-wide (ViDa)', event: 'Cross-border intra-EU B2G/B2B structured e-invoices mandatory (EN 16931); no SME exemption.' },
];

export const TAX_GUIDE_FAQ = [
  {
    question: 'Do freelancers have to charge VAT or GST?',
    answer:
      'It depends on where your clients are and your turnover. Most countries have a registration threshold (e.g. £90k UK, €25k Germany Kleinunternehmer, A$75k Australia) below which charging VAT/GST is optional or unnecessary. Once you cross it — or voluntarily register — you must add it to your invoices and file returns. Always confirm with your local tax authority.',
  },
  {
    question: 'What is e-invoicing, and does it affect freelancers?',
    answer:
      'E-invoicing means issuing invoices in a structured, machine-readable format (often UBL or XRechnung XML) rather than a PDF. Several EU countries now require it, and the rules differ by country: some let you self-generate a file (Germany), others require a certified platform to transmit it (France, Italy). If you invoice EU B2B clients from 2026 onward, you will increasingly need to produce one.',
  },
  {
    question: 'Is a PDF invoice still valid?',
    answer:
      'A PDF remains a valid invoice in most of the world today, but from 2027–2028 a plain PDF will no longer be a compliant B2B invoice in Germany, Belgium, and parts of France for domestic transactions, and from July 2030 for cross-border intra-EU B2B. Check the country rows above and verify with the local authority.',
  },
  {
    question: 'What currency and tax should I put on an international invoice?',
    answer:
      'Use the currency you and your client agreed on, clearly stated. For tax, the general rule is that services are taxed where the customer is (B2B reverse-charge in the EU), but this varies by country and service type. When in doubt, state "reverse charge" and the client\'s VAT ID, and confirm the treatment with an accountant.',
  },
  {
    question: 'Is this guide tax advice?',
    answer:
      'No. It\'s general, dated information to help you ask the right questions. Tax rules and e-invoice dates change, and your situation may have exceptions. Always confirm with a qualified accountant or your national tax authority before relying on any of it.',
  },
];
