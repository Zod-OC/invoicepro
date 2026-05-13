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

export type TemplateType = 'modern' | 'classic' | 'minimal';
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
  { id: 'modern' as TemplateType, name: 'Modern', description: 'Gradient header, bold typography' },
  { id: 'classic' as TemplateType, name: 'Classic', description: 'Professional, timeless design' },
  { id: 'minimal' as TemplateType, name: 'Minimal', description: 'Clean and simple' },
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
