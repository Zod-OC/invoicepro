import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowLeft } from 'lucide-react';
import { templates, TemplateType } from '@/types';

export const metadata: Metadata = {
  title: 'Templates',
  description: 'Browse 12 professional invoice templates on Billify. Modern, Classic, Minimal, Clean, Bold, Corporate, Startup, Freelancer, Executive, Agency, Consulting, and Creative designs for every brand.',
  alternates: { canonical: '/templates' },
  openGraph: {
    title: 'Billify Templates — 12 Professional Invoice Designs',
    description: 'Modern, Classic, Minimal, Clean, Bold, Corporate, Startup, Freelancer, Executive, Agency, Consulting, and Creative. Free forever for the basics.',
    url: 'https://billify.me/templates',
  },
};

export default function TemplatesPage() {
  return (
    <div className="min-h-full flex flex-col">
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Billify</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
        </div>
      </nav>

      <div className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Invoice Templates</h1>
          <p className="text-muted-foreground mb-10">Choose a template. Customize everything. Export as PDF.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Modern Template Preview */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center p-4">
                <div className="text-white w-full max-w-[200px] bg-white/10 backdrop-blur rounded-lg p-3 text-left shadow-lg">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Invoice</div>
                  <div className="text-lg font-bold leading-tight">#001</div>
                  <div className="h-px bg-white/30 my-2" />
                  <div className="flex justify-between text-[9px] opacity-80">
                    <span>Web Design</span>
                    <span className="font-bold">$850.00</span>
                  </div>
                  <div className="flex justify-between text-[9px] opacity-80 mt-0.5">
                    <span>Hosting</span>
                    <span className="font-bold">$150.00</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-white/20 flex justify-between text-[10px] font-bold">
                    <span>Total</span>
                    <span>$1,000.00</span>
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Modern</CardTitle>
                <p className="text-sm text-muted-foreground">Gradient header, bold typography</p>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/app?template=modern`}>Use Template</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Classic Template Preview */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="w-full max-w-[200px] border border-zinc-300 dark:border-zinc-600 rounded-none p-3 text-left font-serif">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase">Acme Corp</div>
                      <div className="text-[8px] text-zinc-500">123 Business St</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold">INVOICE</div>
                      <div className="text-[8px]">#001</div>
                    </div>
                  </div>
                  <table className="w-full text-[8px] mt-2 border-t border-zinc-300 dark:border-zinc-600">
                    <thead>
                      <tr className="border-b border-zinc-300 dark:border-zinc-600">
                        <th className="text-left py-0.5">Item</th>
                        <th className="text-right py-0.5">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-0.5">Consulting</td>
                        <td className="text-right">$500.00</td>
                      </tr>
                      <tr className="border-t border-zinc-300 dark:border-zinc-600 font-bold">
                        <td className="py-0.5">Total</td>
                        <td className="text-right">$500.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Classic</CardTitle>
                <p className="text-sm text-muted-foreground">Professional, timeless design</p>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/app?template=classic`}>Use Template</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Minimal Template Preview */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
                <div className="w-full max-w-[200px] p-4 text-left">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3">Invoice #001</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-zinc-500">Strategy Session</span>
                      <span>$300.00</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-zinc-500">Brand Audit</span>
                      <span>$200.00</span>
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-2" />
                    <div className="flex justify-between text-[10px] font-medium">
                      <span>Total</span>
                      <span>$500.00</span>
                    </div>
                  </div>
                  <div className="mt-3 text-[7px] text-zinc-400">Thank you for your business</div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Minimal</CardTitle>
                <p className="text-sm text-muted-foreground">Clean and simple</p>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/app?template=minimal`}>Use Template</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Remaining 9 templates — lightweight previews */}
            {/* Clean */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white border-b border-slate-200 p-4">
                <div className="text-slate-700 font-light text-2xl">Invoice</div>
                <div className="text-xs text-slate-400 mt-1">#001</div>
                <div className="border-b-2 border-slate-200 mt-3"></div>
                <div className="mt-3 space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold text-slate-600 border-b border-slate-200 pb-1"><span>Description</span><span>Amount</span></div>
                  <div className="flex justify-between text-slate-500"><span>Service A</span><span>€450.00</span></div>
                  <div className="flex justify-between text-slate-500"><span>Service B</span><span>€300.00</span></div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-300"><span>Total</span><span>€750.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Clean<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">White space, subtle borders</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=clean`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Bold */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-slate-900 text-white p-4 flex flex-col">
                <div className="flex justify-between items-start">
                  <div><div className="text-3xl font-bold">INVOICE</div><div className="text-[10px] text-slate-400">#001</div></div>
                  <div className="text-right text-[10px] text-slate-400"><div>2024-01-15</div><div>Due 2024-02-15</div></div>
                </div>
                <div className="mt-auto space-y-1 text-[10px]">
                  <div className="flex justify-between border-b border-slate-700 pb-1"><span>Description</span><span>Amount</span></div>
                  <div className="flex justify-between text-slate-300"><span>Service A</span><span>€450.00</span></div>
                  <div className="flex justify-between text-slate-300"><span>Service B</span><span>€300.00</span></div>
                  <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-500"><span>Total</span><span>€750.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Bold<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">High contrast, large type</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=bold`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Corporate */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white p-0">
                <div className="h-1 bg-blue-800"></div>
                <div className="p-3 flex justify-between items-start">
                  <div><div className="text-base font-bold">INVOICE</div><div className="text-[9px] text-slate-500">No: 001</div></div>
                  <div className="text-[9px] text-blue-800 font-semibold">Your Company</div>
                </div>
                <div className="h-px bg-blue-800 mx-3"></div>
                <div className="p-3 space-y-1 text-[10px]">
                  <div className="flex justify-between font-bold text-blue-800 text-[9px] uppercase"><span>Billed To</span></div>
                  <div className="text-slate-700">Client Name</div>
                  <div className="flex justify-between border-b-2 border-blue-800 pb-1 text-blue-800 font-bold text-[9px] uppercase mt-2"><span>Description</span><span>Amount</span></div>
                  <div className="flex justify-between text-slate-600"><span>Service A</span><span>€450.00</span></div>
                  <div className="flex justify-between text-slate-600"><span>Service B</span><span>€300.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Corporate<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Two-column header, business-formal</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=corporate`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Startup */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white flex">
                <div className="w-16 bg-purple-600 text-white flex flex-col items-center justify-center p-2">
                  <div className="text-[8px] font-semibold">Your Brand</div>
                  <div className="text-base font-bold mt-1">INVOICE</div>
                  <div className="text-[8px]">#001</div>
                </div>
                <div className="flex-1 p-3 space-y-1">
                  <div className="text-base font-bold">Invoice</div>
                  <div className="text-[9px] text-slate-500">2024-01-15 • Due 2024-02-15</div>
                  <div className="text-[9px] text-purple-600 font-bold uppercase mt-1">Billed To</div>
                  <div className="text-[10px] text-slate-700">Client Name</div>
                  <div className="flex justify-between text-[9px] bg-purple-600 text-white px-1 py-0.5 font-bold mt-2"><span>Item</span><span>Amount</span></div>
                  <div className="flex justify-between text-[9px] text-slate-600"><span>Service A</span><span>€450.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Startup<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Energetic, brand-color sidebar</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=startup`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Freelancer */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white flex">
                <div className="w-1.5 bg-pink-500"></div>
                <div className="flex-1 p-3 space-y-1">
                  <div className="text-2xl font-light">Invoice</div>
                  <div className="text-[9px] text-slate-500">#001 • 2024-01-15 • Due 2024-02-15</div>
                  <div className="text-[9px] text-pink-500 font-bold uppercase mt-2">From</div>
                  <div className="text-[10px] text-slate-900 font-bold">Your Name</div>
                  <div className="text-[9px] text-pink-500 font-bold uppercase mt-1">Billed To</div>
                  <div className="text-[10px] text-slate-900 font-bold">Client Name</div>
                  <div className="border-b border-pink-500 text-pink-500 text-[9px] font-bold uppercase mt-2 pb-0.5">Description / Amount</div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Freelancer<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Single column, generous whitespace</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=freelancer`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Executive */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white p-0">
                <div className="h-1 bg-amber-700"></div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div><div className="text-base font-bold text-slate-700 tracking-wide">TAX INVOICE</div><div className="text-[9px] text-slate-500 mt-0.5">Invoice #: 001</div></div>
                    <div className="text-right text-[9px] text-slate-500"><div>2024-01-15</div><div>Due 2024-02-15</div></div>
                  </div>
                  <div className="h-px bg-amber-700 mt-2"></div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold mt-2">Billed To</div>
                  <div className="text-[10px] text-slate-900 font-bold">Client Name</div>
                  <div className="flex justify-between text-[9px] bg-slate-700 text-white px-1 py-0.5 font-bold mt-2"><span>Description</span><span>Amount</span></div>
                  <div className="flex justify-between text-[9px] text-slate-600"><span>Service A</span><span>€450.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Executive<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Formal, refined layout</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=executive`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Agency */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white p-0">
                <div className="bg-slate-900 text-white p-3">
                  <div className="flex justify-between items-start">
                    <div><div className="text-sm font-bold">Your Agency</div><div className="text-[8px] text-slate-400">hello@agency.com</div></div>
                    <div className="text-right"><div className="text-lg font-bold">INVOICE</div><div className="text-[8px] text-slate-400">#001</div></div>
                  </div>
                </div>
                <div className="h-1 bg-yellow-400"></div>
                <div className="p-3 space-y-1">
                  <div className="flex gap-2 text-[8px] text-slate-600"><span><b>Date</b> 2024-01-15</span><span><b>Due</b> 2024-02-15</span></div>
                  <div className="text-[9px] text-slate-900 font-bold mt-1">BILL TO</div>
                  <div className="text-[10px] text-slate-700">Client Name</div>
                  <div className="bg-slate-900 text-white text-[9px] font-bold px-1 py-0.5 flex justify-between mt-2"><span>Item</span><span>Amount</span></div>
                  <div className="flex justify-between text-[9px] text-slate-600"><span>Service A</span><span>€450.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Agency<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Dark header, full-width design</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=agency`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Consulting */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white p-3 font-mono">
                <div className="text-xs font-bold tracking-wider">INVOICE</div>
                <div className="text-[8px] text-slate-600 mt-0.5">No: 001 • Date: 2024-01-15 • Due: 2024-02-15</div>
                <div className="h-0.5 bg-slate-900 mt-1.5"></div>
                <div className="text-[8px] text-slate-900 font-bold mt-2">TO:</div>
                <div className="text-[9px] text-slate-900">Client Name</div>
                <div className="text-[8px] mt-1.5">
                  <div className="flex justify-between bg-slate-900 text-white px-1 py-0.5 font-bold"><span>DESCRIPTION</span><span>AMOUNT</span></div>
                  <div className="flex justify-between text-slate-700 mt-0.5"><span>Service A</span><span>€450.00</span></div>
                  <div className="flex justify-between text-slate-700"><span>Service B</span><span>€300.00</span></div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Consulting<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Minimalist formal, mono accents</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=consulting`}>Use Template</Link></Button></CardContent>
            </Card>

            {/* Creative */}
            <Card className="overflow-hidden">
              <div className="h-44 bg-white p-3 flex">
                <div className="flex-1">
                  <div className="text-5xl font-bold text-amber-500 leading-none">#001</div>
                  <div className="text-xs font-bold text-slate-900 mt-3">Your Studio</div>
                  <div className="text-[8px] text-slate-500">hello@studio.com</div>
                  <div className="h-1 w-12 bg-amber-500 mt-2"></div>
                </div>
                <div className="text-right text-[8px] text-slate-600">
                  <div className="text-[10px] font-bold text-slate-900">INVOICE</div>
                  <div>2024-01-15</div>
                  <div>Due: 2024-02-15</div>
                </div>
              </div>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Creative<Badge variant="secondary" className="text-[10px]">Pro</Badge></CardTitle><p className="text-sm text-muted-foreground">Bright accent stripe, big number</p></CardHeader>
              <CardContent><Button asChild className="w-full"><Link href={`/app?template=creative`}>Use Template</Link></Button></CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
