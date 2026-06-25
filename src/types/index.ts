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

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'clean' | 'bold' | 'executive';
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
  { id: 'modern' as TemplateType, name: 'Modern', description: 'Gradient header, bold typography', tier: 'free' as const },
  { id: 'classic' as TemplateType, name: 'Classic', description: 'Professional, timeless design', tier: 'free' as const },
  { id: 'minimal' as TemplateType, name: 'Minimal', description: 'Clean and simple', tier: 'pro' as const },
  { id: 'clean' as TemplateType, name: 'Clean', description: 'White space, subtle borders', tier: 'pro' as const },
  { id: 'bold' as TemplateType, name: 'Bold', description: 'High contrast, large type', tier: 'pro' as const },
  { id: 'executive' as TemplateType, name: 'Executive', description: 'Formal, refined layout', tier: 'team' as const },
];

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
  const template = isValidString(o.template) && ['modern', 'classic', 'minimal', 'clean', 'bold', 'executive'].includes(o.template)
    ? (o.template as TemplateType)
    : 'modern';
  return {
    id: isValidString(o.id) ? o.id : generateId(),
    number: isValidString(o.number) ? o.number : `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    date: isValidString(o.date) ? o.date : new Date().toISOString().split('T')[0],
    dueDate: isValidString(o.dueDate) ? o.dueDate : new Date().toISOString().split('T')[0],
    from: o.from as CompanyInfo,
    to: o.to as CompanyInfo,
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
