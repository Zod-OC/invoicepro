'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Invoice, createEmptyInvoice, formatCurrency, calculateTotals, templates, currencies, currencySymbols, TemplateType, validateInvoice, MAX_LOGO_SIZE, ALLOWED_LOGO_TYPES } from '@/types';
import { generatePDF } from '@/lib/pdf';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { Sparkles, Plus, Trash2, Download, RotateCcw, FileText, Lock } from 'lucide-react';
import { PaywallModal } from '@/components/PaywallModal';
const STORAGE_KEY = 'billify_current';

function loadInvoice(): Invoice {
  if (typeof window === 'undefined') return createEmptyInvoice();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validated = validateInvoice(parsed);
      if (validated) return validated;
    }
  } catch {}
  return createEmptyInvoice();
}

function saveInvoice(inv: Invoice) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...inv, updatedAt: Date.now() }));
}

/** Simple HTML-escape to prevent XSS in preview. React escapes by default,
 *  but we also render strings inside PDF templates and some users paste HTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AppPage() {
  const { plan, limits, canCreateInvoice, hasTemplateAccess, hasNoWatermark } = useSubscription();
  const [invoice, setInvoice] = useState<Invoice>(loadInvoice);
  const [downloading, setDownloading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState<{ open: boolean; feature: string; plan: 'pro' | 'team' } | null>(null);
  const [monthlyCount, setMonthlyCount] = useState(0);

  // Load monthly invoice count
  useEffect(() => {
    try {
      const key = `billify_count_${new Date().toISOString().slice(0, 7)}`;
      const count = Number(localStorage.getItem(key) || '0');
      setMonthlyCount(count);
    } catch { /* ignore */ }
  }, []);

  const incrementMonthlyCount = useCallback(() => {
    try {
      const key = `billify_count_${new Date().toISOString().slice(0, 7)}`;
      const next = monthlyCount + 1;
      localStorage.setItem(key, String(next));
      setMonthlyCount(next);
    } catch { /* ignore */ }
  }, [monthlyCount]);

  // Debounced save to localStorage — prevents jank on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      saveInvoice(invoice);
    }, 500);
    return () => clearTimeout(timer);
  }, [invoice]);

  const update = useCallback((patch: Partial<Invoice>) => {
    setInvoice(prev => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }, []);

  const updateFrom = useCallback((patch: Partial<Invoice['from']>) => {
    setInvoice(prev => ({ ...prev, from: { ...prev.from, ...patch }, updatedAt: Date.now() }));
  }, []);

  const updateTo = useCallback((patch: Partial<Invoice['to']>) => {
    setInvoice(prev => ({ ...prev, to: { ...prev.to, ...patch }, updatedAt: Date.now() }));
  }, []);

  const updateItem = useCallback((idx: number, patch: Partial<Invoice['items'][0]>) => {
    setInvoice(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...prev, items, updatedAt: Date.now() };
    });
  }, []);

  const addItem = useCallback(() => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0 }],
      updatedAt: Date.now(),
    }));
  }, []);

  const removeItem = useCallback((idx: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
      updatedAt: Date.now(),
    }));
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, target: 'from' | 'to') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Logo must be PNG, JPEG, or WebP.');
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setLogoError('Logo must be under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Basic base64 sanity check
      if (!base64.startsWith('data:image/')) {
        setLogoError('Invalid image file.');
        return;
      }
      if (base64.startsWith('data:image/svg+xml')) {
        setLogoError('SVG files are not supported for security reasons.');
        return;
      }
      if (target === 'from') updateFrom({ logo: base64 });
      else updateTo({ logo: base64 });
    };
    reader.onerror = () => setLogoError('Failed to read image.');
    reader.readAsDataURL(file);
  }, [updateFrom, updateTo]);

  const handleDownload = useCallback(async () => {
    // Gate: free tier limited to 3 invoices/month
    if (plan === 'free' && monthlyCount >= 3) {
      setShowPaywall({ open: true, feature: 'Unlimited Invoices', plan: 'pro' });
      return;
    }
    setDownloading(true);
    try {
      const blob = await generatePDF(invoice);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      incrementMonthlyCount();
    } catch (err) {
      console.error(err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [invoice, plan, monthlyCount, incrementMonthlyCount]);

  const { subtotal, tax, total } = calculateTotals(invoice.items, invoice.taxRate);
  const sym = currencySymbols[invoice.currency] || '$';

  // Preview component
  const Preview = () => (
    <div className="bg-white text-black p-8 min-h-[600px] shadow-lg rounded-lg">
      {invoice.template === 'modern' && (
        <div className="border-b-4 border-blue-500 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-blue-600">INVOICE</h2>
              <p className="text-sm text-gray-500">#{invoice.number}</p>
            </div>
            {invoice.from.logo && <img src={invoice.from.logo} alt="logo" className="h-12 object-contain" />}
          </div>
        </div>
      )}
      {invoice.template === 'classic' && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">INVOICE</h2>
          <p className="text-sm text-gray-500">#{invoice.number}</p>
        </div>
      )}
      {invoice.template === 'minimal' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Invoice</h2>
          <p className="text-sm text-gray-500">#{invoice.number} • {invoice.date}</p>
        </div>
      )}
      {invoice.template === 'clean' && (
        <div className="mb-6 border-b-2 border-slate-200 pb-4">
          <h2 className="text-3xl font-light text-slate-700">Invoice</h2>
          <p className="text-sm text-slate-400 mt-1">#{invoice.number} — {invoice.date} — Due {invoice.dueDate}</p>
        </div>
      )}
      {invoice.template === 'bold' && (
        <div className="mb-6 bg-slate-900 text-white -mx-8 -mt-8 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-bold">INVOICE</h2>
              <p className="text-sm text-slate-300 mt-2">#{invoice.number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300">{invoice.date}</p>
              <p className="text-sm text-slate-400">Due {invoice.dueDate}</p>
            </div>
          </div>
        </div>
      )}
      {invoice.template === 'executive' && (
        <div className="mb-6">
          <div className="h-1 bg-amber-700 mb-4 -mx-8 -mt-8 w-[calc(100%+4rem)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-700 tracking-wide">TAX INVOICE</h2>
              <p className="text-sm text-slate-500 mt-1">Invoice #: {invoice.number}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{invoice.date}</p>
              <p>Due Date: {invoice.dueDate}</p>
            </div>
          </div>
          <div className="h-px bg-amber-700 mt-4"></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">From</p>
          <p className="font-semibold">{invoice.from.name || 'Your Company'}</p>
          <p className="text-sm text-gray-600">{invoice.from.email}</p>
          <p className="text-sm text-gray-600">{invoice.from.address}</p>
          <p className="text-sm text-gray-600">{invoice.from.phone}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase mb-1">Bill To</p>
          <p className="font-semibold">{invoice.to.name || 'Client Name'}</p>
          <p className="text-sm text-gray-600">{invoice.to.email}</p>
          <p className="text-sm text-gray-600">{invoice.to.address}</p>
          <p className="text-sm text-gray-600">{invoice.to.phone}</p>
        </div>
      </div>

      {invoice.template !== 'minimal' && (
        <div className="flex gap-8 mb-6 text-sm">
          <div><span className="text-gray-500">Date: </span>{invoice.date}</div>
          <div><span className="text-gray-500">Due: </span>{invoice.dueDate}</div>
        </div>
      )}

      <table className="w-full mb-6">
        <thead>
          <tr className={`text-left text-xs uppercase ${
            invoice.template === 'modern' ? 'bg-blue-500 text-white' : 
            invoice.template === 'classic' ? 'bg-gray-100' : 
            invoice.template === 'clean' ? 'border-b-2 border-slate-300 text-slate-600' :
            invoice.template === 'bold' ? 'bg-slate-900 text-white' :
            invoice.template === 'executive' ? 'bg-slate-700 text-white' :
            'border-b-2 border-black'
          }`}>
            <th className="p-2">Description</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Rate</th>
            <th className="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{item.description || '—'}</td>
              <td className="p-2 text-right">{item.quantity}</td>
              <td className="p-2 text-right">{formatCurrency(item.rate, invoice.currency)}</td>
              <td className="p-2 text-right">{formatCurrency(item.quantity * item.rate, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(subtotal, invoice.currency)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(tax, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.terms) && (
        <div className="mt-8 text-sm text-gray-600">
          {invoice.notes && <div className="mb-2"><span className="font-semibold">Notes: </span>{invoice.notes}</div>}
          {invoice.terms && <div><span className="font-semibold">Terms: </span>{invoice.terms}</div>}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full flex flex-col">
      {/* Nav */}
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-bold text-lg hidden sm:inline">Billify</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="px-2 sm:px-3" onClick={() => setInvoice(createEmptyInvoice())}>
              <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline ml-1">New</span>
            </Button>
            <Button size="sm" className="px-2 sm:px-3" onClick={handleDownload} disabled={downloading}>
              <Download className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">{downloading ? 'Generating...' : 'Download PDF'}</span>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">
                <span className={`text-xs font-semibold ${plan !== 'free' ? 'text-primary' : 'text-muted-foreground'}`}>
                  {plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Team'}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Editor */}
        <div className="flex-1 p-3 sm:p-4 space-y-4 overflow-y-auto lg:max-h-[calc(100vh-3.5rem)]">
          <SubscriptionManager />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Number</Label>
                <Input value={invoice.number} onChange={e => update({ number: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                  <select
                    value={invoice.currency}
                    onChange={e => update({ currency: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                  {currencies.map(c => <option key={c} value={c}>{c} ({currencySymbols[c]})</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={invoice.date} onChange={e => update({ date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={invoice.dueDate} onChange={e => update({ dueDate: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">From (Your Company)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Company name" value={invoice.from.name} onChange={e => updateFrom({ name: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Email" value={invoice.from.email} onChange={e => updateFrom({ email: e.target.value })} />
                <Input placeholder="Phone" value={invoice.from.phone} onChange={e => updateFrom({ phone: e.target.value })} />
              </div>
              <Input placeholder="Address" value={invoice.from.address} onChange={e => updateFrom({ address: e.target.value })} />
              <div>
                <Label className="text-xs">Logo</Label>
                <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors w-fit">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => handleLogoUpload(e, 'from')}
                  />
                  <span>{invoice.from.logo ? 'Change Logo' : 'Upload Logo'}</span>
                </label>
              {logoError && (
                <p className="text-xs text-destructive mt-1">{logoError}</p>
              )}
              {invoice.from.logo && (
                <div className="mt-2 w-16 h-16 rounded-md border overflow-hidden">
                  <img src={invoice.from.logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">To (Client)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Client name" value={invoice.to.name} onChange={e => updateTo({ name: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Email" value={invoice.to.email} onChange={e => updateTo({ email: e.target.value })} />
                <Input placeholder="Phone" value={invoice.to.phone} onChange={e => updateTo({ phone: e.target.value })} />
              </div>
              <Input placeholder="Address" value={invoice.to.address} onChange={e => updateTo({ address: e.target.value })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-6">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateItem(idx, { description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 sm:col-span-6 gap-2">
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-3">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder={`Rate (${sym})`}
                          value={item.rate}
                          onChange={e => updateItem(idx, { rate: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="w-full h-10" onClick={() => removeItem(idx)} disabled={invoice.items.length <= 1}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Extras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tax Rate (%)</Label>
                  <Input type="number" min={0} max={100} value={invoice.taxRate} onChange={e => update({ taxRate: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Template</Label>
                  <select
                    data-testid="template-select"
                    value={invoice.template}
                    onChange={e => {
                      const selected = e.target.value as TemplateType;
                      const t = templates.find(t => t.id === selected);
                      const required = t?.tier ?? 'free';
                      if (required === 'pro' && plan === 'free') {
                        setShowPaywall({ open: true, feature: t?.name ?? 'Pro Template', plan: 'pro' });
                        return;
                      }
                      if (required === 'team' && plan !== 'team') {
                        setShowPaywall({ open: true, feature: t?.name ?? 'Team Template', plan: 'team' });
                        return;
                      }
                      update({ template: selected });
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.tier === 'pro' && plan === 'free' ? ' 🔒 Pro' : ''}
                        {t.tier === 'team' && plan !== 'team' ? ' 🔒 Team' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input placeholder="Notes" value={invoice.notes} onChange={e => update({ notes: e.target.value })} />
              <Input placeholder="Terms" value={invoice.terms} onChange={e => update({ terms: e.target.value })} />
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="flex-1 p-3 sm:p-4 bg-gray-100 dark:bg-zinc-900 overflow-y-auto lg:max-h-[calc(100vh-3.5rem)]">
          <div className="sticky top-0">
            <Badge variant="outline" className="mb-2">Live Preview</Badge>
            <Preview />
          </div>
        </div>
      </div>

      <PaywallModal
        open={showPaywall?.open ?? false}
        onClose={() => setShowPaywall(null)}
        feature={showPaywall?.feature ?? ''}
        plan={showPaywall?.plan ?? 'pro'}
      />
    </div>
  );
}
