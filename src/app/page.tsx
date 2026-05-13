'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Zap, Download, Check, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Navbar */}
      <nav className="w-full border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">Billify</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Button asChild size="sm">
              <Link href="/app">Create Invoice</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center text-center px-4 py-20 md:py-32">
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
          Your data stays in your browser. No cloud. No tracking.
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
      </section>

      {/* Features */}
      <section className="w-full bg-muted/50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Everything you need</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: '3 Stunning Templates', desc: 'Modern, Classic, and Minimal designs for every brand.' },
              { icon: Download, title: 'PDF Export', desc: 'Generate professional PDFs instantly. No server needed.' },
              { icon: Shield, title: 'Privacy First', desc: 'Your data lives in your browser. We cannot see it.' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Create, preview, and download in under 30 seconds.' },
              { icon: Check, title: 'Free Forever', desc: 'Core features cost nothing. Pro tier adds superpowers.' },
              { icon: Sparkles, title: 'Auto-Save', desc: 'Never lose work. Everything is saved automatically.' },
            ].map((f) => (
              <Card key={f.title} className="border-0 shadow-none bg-transparent">
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

      {/* Pricing Teaser */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground mb-8">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card className="border-2 border-transparent">
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <div className="text-3xl font-bold">$0</div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>✓ 3 invoices/month</div>
                <div>✓ Basic templates</div>
                <div>✓ PDF export</div>
                <div>✓ localStorage save</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <div className="text-3xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>✓ Unlimited invoices</div>
                <div>✓ All 10+ templates</div>
                <div>✓ Custom branding</div>
                <div>✓ Invoice history</div>
                <div>✓ No watermark</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-transparent">
              <CardHeader>
                <CardTitle className="text-lg">Team</CardTitle>
                <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>✓ Everything in Pro</div>
                <div>✓ Multiple users</div>
                <div>✓ Shared templates</div>
                <div>✓ API access (soon)</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold">Billify</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Billify. Built for freelancers.</p>
        </div>
      </footer>
    </div>
  );
}
