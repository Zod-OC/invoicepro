'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Invoice, createEmptyInvoice, formatCurrency, calculateTotals, templates, currencies, currencySymbols, TemplateType } from '@/types';
import { generatePDF } from '@/lib/pdf';
import { Sparkles, Plus, Trash2, Download, RotateCcw, FileText } from 'lucide-react';

const STORAGE_KEY = 'billify_current';

function loadInvoice(): Invoice {
  if (typeof window === 'undefined') return createEmptyInvoice();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return createEmptyInvoice();
}

function saveInvoice(inv: Invoice) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...inv, updatedAt: Date.now() }));
}

export default function AppPage() {
  const [invoice, setInvoice] = useState<Invoice>(loadInvoice);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    saveInvoice(invoice);
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
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (target === 'from') updateFrom({ logo: base64 });
      else updateTo({ logo: base64 });
    };
    reader.readAsDataURL(file);
  }, [updateFrom, updateTo]);

  const handleDownload = useCallback(async () => {
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
    } catch (err) {
      console.error(err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [invoice]);

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
          <tr className={`text-left text-xs uppercase ${invoice.template === 'modern' ? 'bg-blue-500 text-white' : invoice.template === 'classic' ? 'bg-gray-100' : 'border-b-2 border-black'}`}>
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
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Billify</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setInvoice(createEmptyInvoice())}>
              <RotateCcw className="w-4 h-4 mr-1" /> New
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading}>
              <Download className="w-4 h-4 mr-1" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Editor */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" /> Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Number</Label>
                <Input value={invoice.number} onChange={e => update({ number: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <select
                  value={invoice.currency}
                  onChange={e => update({ currency: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
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
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Email" value={invoice.from.email} onChange={e => updateFrom({ email: e.target.value })} />
                <Input placeholder="Phone" value={invoice.from.phone} onChange={e => updateFrom({ phone: e.target.value })} />
              </div>
              <Input placeholder="Address" value={invoice.from.address} onChange={e => updateFrom({ address: e.target.value })} />
              <div>
                <Label className="text-xs">Logo</Label>
                <Input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'from')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">To (Client)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Client name" value={invoice.to.name} onChange={e => updateTo({ name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
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
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateItem(idx, { description: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={`Rate (${sym})`}
                      value={item.rate}
                      onChange={e => updateItem(idx, { rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} disabled={invoice.items.length <= 1}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tax Rate (%)</Label>
                  <Input type="number" min={0} max={100} value={invoice.taxRate} onChange={e => update({ taxRate: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Template</Label>
                  <select
                    value={invoice.template}
                    onChange={e => update({ template: e.target.value as TemplateType })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <Input placeholder="Notes" value={invoice.notes} onChange={e => update({ notes: e.target.value })} />
              <Input placeholder="Terms" value={invoice.terms} onChange={e => update({ terms: e.target.value })} />
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="flex-1 p-4 bg-gray-100 dark:bg-zinc-900 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          <div className="sticky top-0">
            <Badge variant="outline" className="mb-2">Live Preview</Badge>
            <Preview />
          </div>
        </div>
      </div>
    </div>
  );
}
