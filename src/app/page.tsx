import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Zap, Download, Check, Sparkles } from 'lucide-react';
import { templates } from '@/types';
import { freeInvoiceCap, PRO_PLAN_FEATURES, PRO_ANNUAL_PRICE } from '@/lib/plan-limits';
import { BrowseProfessions } from '@/components/BrowseProfessions';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';

// Server component (no 'use client'). This page is a pure render — no
// useState/useEffect/refs/event handlers/browser APIs — so it needs no client
// directive. Keeping it server-side means the `professions` dataset (~160KB,
// imported transitively by BrowseProfessions → ProfessionCard) stays in the
// server/prerender bundle and is NOT shipped to the browser, where it was
// previously pulled into the client chunk by the unnecessary 'use client'. The
// children (SiteNav/SiteFooter/BrowseProfessions/ProfessionCard) are themselves
// server components (Link + Tailwind only), matching pricing/ and templates/,
// which already render the same subtree as server pages under output:'export'.
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      <SiteNav />

      {/* Hero — with product preview */}
      <section className="flex-1 flex flex-col items-center text-center px-4 py-16 md:py-24">
        <Badge variant="secondary" className="mb-6">
          🚀 Free forever. No signup required.
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
          Create Beautiful
          <br />
          <span className="text-primary">Invoices in Seconds</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          Professional PDF invoices that look like $500 designer work.
          Your data stays in your browser. No cloud. No third-party tracking.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/app">
              <Zap className="w-4 h-4" />
              Create Free Invoice
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/templates">View Templates</Link>
          </Button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" /> No signup
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" /> Free forever
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" /> No data leaves your browser
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-500" /> PDF download in 1 click
          </span>
        </div>

        {/* Product preview — show what the invoice actually looks like */}
        <div className="mt-16 w-full max-w-4xl">
          <div className="relative rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-md border border-border">
                  billify.me/app
                </span>
              </div>
            </div>
            {/* Editor + Preview split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left: Editor form (simplified mock) */}
              <div className="p-6 text-left space-y-3 border-r border-border hidden md:block">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Invoice Details</div>
                <div className="h-8 rounded-md bg-muted/50 border border-border" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 rounded-md bg-muted/50 border border-border" />
                  <div className="h-8 rounded-md bg-muted/50 border border-border" />
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase pt-2">From → To</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <div className="h-3 rounded bg-primary/20 w-3/4" />
                    <div className="h-2 rounded bg-muted w-full" />
                    <div className="h-2 rounded bg-muted w-5/6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 rounded bg-primary/20 w-3/4" />
                    <div className="h-2 rounded bg-muted w-full" />
                    <div className="h-2 rounded bg-muted w-5/6" />
                  </div>
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase pt-2">Line Items</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 flex-1 rounded bg-primary/10" />
                    <div className="h-6 w-12 rounded bg-muted" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 flex-1 rounded bg-muted/50" />
                    <div className="h-6 w-12 rounded bg-muted" />
                  </div>
                </div>
              </div>
              {/* Right: Live invoice preview */}
              <div className="p-6 bg-white text-gray-900">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xl font-bold text-blue-600">INVOICE</div>
                    <div className="text-xs text-gray-500">#INV-1001</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>Date: Jul 18, 2026</div>
                    <div>Due: Aug 1, 2026</div>
                  </div>
                </div>
                <div className="flex justify-between mb-4 text-xs">
                  <div>
                    <div className="font-semibold text-gray-700">KSP Labs</div>
                    <div className="text-gray-400">billing@ksplabs.dev</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-700">Acme Corp</div>
                    <div className="text-gray-400">accounts@acme.com</div>
                  </div>
                </div>
                <table className="w-full text-xs mb-4">
                  <thead>
                    <tr className="bg-blue-500 text-white">
                      <th className="text-left p-1.5 rounded-l">Description</th>
                      <th className="text-center p-1.5">Qty</th>
                      <th className="text-right p-1.5">Rate</th>
                      <th className="text-right p-1.5 rounded-r">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-1.5">Web design — Landing page</td>
                      <td className="text-center p-1.5">1</td>
                      <td className="text-right p-1.5">$1,200</td>
                      <td className="text-right p-1.5">$1,200</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-1.5">Revisions (2h)</td>
                      <td className="text-center p-1.5">2</td>
                      <td className="text-right p-1.5">$75</td>
                      <td className="text-right p-1.5">$150</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end text-xs space-y-0.5">
                  <div className="w-32 flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span>$1,350</span>
                  </div>
                  <div className="w-32 flex justify-between">
                    <span className="text-gray-500">Tax (0%):</span>
                    <span>$0</span>
                  </div>
                  <div className="w-32 flex justify-between font-bold text-blue-600">
                    <span>Total:</span>
                    <span>$1,350</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            ↑ What you see is what you get. Edit on the left, live preview on the right.
          </p>
        </div>
      </section>

      {/* Stats / social proof bar */}
      <section className="w-full border-y border-border bg-card py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">{templates.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Professional Templates</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">~160</div>
            <div className="text-xs text-muted-foreground mt-1">Currencies Supported</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">&lt; 30s</div>
            <div className="text-xs text-muted-foreground mt-1">To Create an Invoice</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">€0</div>
            <div className="text-xs text-muted-foreground mt-1">To Get Started</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full bg-muted/50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Everything you need</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
            All the essentials for professional invoicing. No bloat, no learning curve.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-fr">
            {[
              { icon: FileText, title: `${templates.length} Stunning Templates`, desc: 'Modern, Classic, Minimal, Clean, Bold, Corporate, Startup, Freelancer, Executive, Agency, Consulting, and Creative designs.' },
              { icon: Download, title: 'PDF Export', desc: 'Generate professional PDFs instantly. No server needed — it all happens in your browser.' },
              { icon: Shield, title: 'Privacy First', desc: 'Your data lives in your browser. We cannot see it, and neither can anyone else.' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Create, preview, and download in under 30 seconds. No waiting, no loading bars.' },
              { icon: Check, title: 'Free Forever', desc: 'Core features cost nothing — 3 invoices/month, PDF export, auto-save. Upgrade only if you need more.' },
              { icon: Sparkles, title: 'Auto-Save + History', desc: 'Never lose work. Everything saves automatically, and your invoice history is always one click away.' },
            ].map((f) => (
              <Card key={f.title} className="border-0 shadow-none bg-transparent h-full">
                <CardContent className="p-6">
                  <f.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3-step guide for first-time users */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">How it works</h2>
          <p className="text-center text-muted-foreground mb-10">Three steps. No account. No setup.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Fill in your details</h3>
              <p className="text-sm text-muted-foreground">
                Type your company info, client details, and line items. Everything auto-saves as you type.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Pick a template</h3>
              <p className="text-sm text-muted-foreground">
                Choose from {templates.length} professional designs. See the preview update live as you type.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Download PDF</h3>
              <p className="text-sm text-muted-foreground">
                Click <em>Download PDF</em>. That&apos;s it. Print it, email it, send it to your client.
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Button asChild size="lg" className="gap-2">
              <Link href="/app">
                <Zap className="w-4 h-4" />
                Try it now — it&apos;s free
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Simple, honest pricing</h2>
          <p className="text-muted-foreground mb-8">Free forever for most users. Upgrade only if you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            <Card className="border-2 border-transparent flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <div className="text-3xl font-bold">€0</div>
                <div className="text-xs text-muted-foreground">forever — no card needed</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>✓ {freeInvoiceCap} invoices/month</div>
                <div>✓ 2 basic templates (Modern, Classic)</div>
                <div>✓ PDF export</div>
                <div>✓ Auto-save</div>
                <div className="text-xs pt-2 text-primary">↑ Enough for most freelancers</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">For power users</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <div className="text-3xl font-bold">{PRO_ANNUAL_PRICE}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <div className="text-xs text-muted-foreground">billed annually · <Link href="/pricing" className="underline hover:text-foreground">view plans</Link></div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                {PRO_PLAN_FEATURES.map((f) => (
                  <div key={f}>✓ {f}</div>
                ))}
                <div className="text-xs pt-2 text-primary">↑ For monthly invoicing at scale</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Browse by profession */}
      <BrowseProfessions />

      {/* Final CTA */}
      <section className="py-20 px-4 text-center border-t border-border">
        <h2 className="text-3xl font-bold mb-4">Ready to create your first invoice?</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          No signup. No download. No commitment. Just a beautiful invoice in 30 seconds.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/app">
            <Zap className="w-4 h-4" />
            Create Free Invoice
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
