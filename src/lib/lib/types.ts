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
  template: 'modern' | 'classic' | 'minimal';
  status: 'draft' | 'sent' | 'paid';
  createdAt: number;
  updatedAt: number;
}

export const CURRENCIES: Record<string, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
};

export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCIES[currency]?.symbol || '$';
  return `${sym}${amount.toFixed(2)}`;
}

export function calculateTotals(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

export function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

export function generateNumber(): string {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`;
}

export function createDefaultInvoice(): Invoice {
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 14);
  return {
    id: generateId(),
    number: generateNumber(),
    date: now.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    from: { name: '', email: '', address: '', phone: '' },
    to: { name: '', email: '', address: '', phone: '' },
    items: [{ description: 'Service', quantity: 1, rate: 100 }],
    notes: '',
    terms: 'Payment due within 14 days.',
    taxRate: 0,
    currency: 'USD',
    template: 'modern',
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
