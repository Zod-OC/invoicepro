/**
 * Payment reminder templates — escalating email/SMS text for overdue invoices.
 * Issue #20: pure functions that take an InvoiceRecord + daysOverdue and return
 * copy-paste-ready reminder text. Three escalation tiers:
 *   - Tier 1 (1-6 days): friendly nudge
 *   - Tier 2 (7-13 days): firm follow-up
 *   - Tier 3 (14+ days): final notice
 *
 * All client-side. No backend. The UI is a "Reminders" button on overdue
 * invoices in the history panel that opens a modal with the generated text
 * and a copy-to-clipboard button.
 */

import type { InvoiceRecord } from '@/types';

export type ReminderTier = 1 | 2 | 3;
export type ReminderChannel = 'email' | 'sms';

export interface ReminderContent {
  tier: ReminderTier;
  channel: ReminderChannel;
  subject: string;
  body: string;
}

/** Determine the escalation tier from days overdue. */
export function getReminderTier(daysOverdue: number): ReminderTier {
  if (daysOverdue >= 14) return 3;
  if (daysOverdue >= 7) return 2;
  return 1;
}

/** Days overdue from the due date (or issue date if no due date). */
export function calculateDaysOverdue(record: InvoiceRecord, now: Date = new Date()): number {
  const due = record.dueDate ? new Date(record.dueDate) : new Date(record.date);
  const diffMs = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

interface TemplateVars {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  daysOverdue: number;
  dueDate: string;
  ourCompany: string;
  ourEmail: string;
}

function extractVars(record: InvoiceRecord): TemplateVars {
  return {
    clientName: record.clientName || 'there',
    invoiceNumber: record.number || 'N/A',
    amount: typeof record.amount === 'number'
      ? record.amount.toFixed(2)
      : (typeof record.amount === 'string' ? record.amount : '—'),
    daysOverdue: 0, // filled by caller
    dueDate: record.dueDate
      ? new Date(record.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    ourCompany: 'our company',
    ourEmail: 'replies@example.com',
  };
}

// ─── Tier 1: Friendly nudge (day 1-6) ──────────────────────────────

const EMAIL_TIER1 = (v: TemplateVars) => ({
  subject: `Friendly reminder: Invoice ${v.invoiceNumber}`,
  body: `Hi ${v.clientName},

I hope this message finds you well. I'm writing to gently remind you that invoice ${v.invoiceNumber} for ${v.amount} was due on ${v.dueDate}.

If you've already sent payment, please disregard this message — thank you! If not, you can process it at your convenience. I've attached the invoice for easy reference.

No rush at all — just wanted to make sure it didn't slip through the cracks.

Best regards,
${v.ourCompany}`,
});

const SMS_TIER1 = (v: TemplateVars) => ({
  subject: '',
  body: `Hi ${v.clientName}, just a friendly reminder that invoice ${v.invoiceNumber} (${v.amount}) was due ${v.dueDate}. No rush — just making sure it didn't slip through! Thanks, ${v.ourCompany}`,
});

// ─── Tier 2: Firm follow-up (day 7-13) ─────────────────────────────

const EMAIL_TIER2 = (v: TemplateVars) => ({
  subject: `Follow-up: Invoice ${v.invoiceNumber} is ${v.daysOverdue} days overdue`,
  body: `Hi ${v.clientName},

I'm following up on invoice ${v.invoiceNumber} for ${v.amount}, which was due on ${v.dueDate} and is now ${v.daysOverdue} days overdue.

Could you please provide an update on the status of this payment? If there's an issue I should know about, I'm happy to discuss it.

I'd appreciate it if you could process the payment at your earliest convenience.

Best regards,
${v.ourCompany}`,
});

const SMS_TIER2 = (v: TemplateVars) => ({
  subject: '',
  body: `Hi ${v.clientName}, invoice ${v.invoiceNumber} (${v.amount}) is now ${v.daysOverdue} days overdue (was due ${v.dueDate}). Could you provide a status update? Thanks, ${v.ourCompany}`,
});

// ─── Tier 3: Final notice (day 14+) ────────────────────────────────

const EMAIL_TIER3 = (v: TemplateVars) => ({
  subject: `FINAL NOTICE: Invoice ${v.invoiceNumber} — ${v.daysOverdue} days overdue`,
  body: `Dear ${v.clientName},

This is a final notice regarding invoice ${v.invoiceNumber} for ${v.amount}, which was due on ${v.dueDate} and is now ${v.daysOverdue} days overdue.

Despite previous reminders, we have not yet received payment. Please arrange payment immediately to avoid further action.

If payment has already been made, please send proof of transfer so we can reconcile our records.

If there is a dispute or concern, please contact us within 48 hours so we can resolve it before escalating.

Regards,
${v.ourCompany}`,
});

const SMS_TIER3 = (v: TemplateVars) => ({
  subject: '',
  body: `FINAL NOTICE: ${v.clientName}, invoice ${v.invoiceNumber} (${v.amount}) is ${v.daysOverdue} days overdue. Please arrange payment immediately or contact us within 48h. ${v.ourCompany}`,
});

// ─── Public API ────────────────────────────────────────────────────

const TEMPLATES: Record<ReminderTier, Record<ReminderChannel, (v: TemplateVars) => { subject: string; body: string }>> = {
  1: { email: EMAIL_TIER1, sms: SMS_TIER1 },
  2: { email: EMAIL_TIER2, sms: SMS_TIER2 },
  3: { email: EMAIL_TIER3, sms: SMS_TIER3 },
};

/**
 * Generate reminder content for an overdue invoice.
 * @param record The invoice record from useInvoiceHistory
 * @param channel 'email' or 'sms'
 * @param now Override for testing (defaults to new Date())
 */
export function generateReminder(
  record: InvoiceRecord,
  channel: ReminderChannel,
  now: Date = new Date(),
): ReminderContent {
  const daysOverdue = calculateDaysOverdue(record, now);
  const tier = getReminderTier(daysOverdue);
  const vars = { ...extractVars(record), daysOverdue };
  const template = TEMPLATES[tier][channel](vars);

  return {
    tier,
    channel,
    subject: template.subject,
    body: template.body,
  };
}

/**
 * Get all applicable tiers for a given daysOverdue value.
 * Useful for showing the escalation progression in the UI.
 */
export function getApplicableTiers(daysOverdue: number): ReminderTier[] {
  const currentTier = getReminderTier(daysOverdue);
  const tiers: ReminderTier[] = [];
  for (let t = 1 as ReminderTier; t <= currentTier; t++) {
    tiers.push(t);
  }
  return tiers;
}
