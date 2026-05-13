import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { templates } from '@/types';

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
          </div>
        </div>
      </div>
    </div>
  );
}
