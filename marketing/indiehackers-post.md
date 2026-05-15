# IndieHackers Post

## I built a free invoice generator because every alternative wanted my email, my card, and my sanity

### The Problem

A few months ago, a freelancer friend asked me for help setting up invoicing. We tried tool after tool and every single one followed the same playbook:

1. Create an account
2. Verify your email
3. Enter a credit card ("don't worry, we won't charge until after your trial!")
4. Get upsold on features you'll never use

For someone sending a handful of invoices a month, this is absurd. The barrier to getting paid shouldn't be higher than the work itself.

### The Solution

I built **Billify** (https://billify.me) — a dead-simple invoice generator that respects your time and privacy.

**What's different:**
- **No signup.** Open the site, build your invoice, download the PDF. That's it.
- **Privacy-first.** Everything runs in your browser via client-side rendering. Your data never touches our servers.
- **Actually free.** No trial timers, no feature gates, no "free until you need to export."
- **Auto-save.** Your work is saved to localStorage, so you can close the tab and come back later.

### Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Client-side PDF generation (no server round-trip for exports)
- localStorage for persistence
- Stripe for Pro tier subscriptions

### The Pro Tier ($9/mo)

The free version handles everything most freelancers need. Pro adds:
- Unlimited invoices
- All 3 templates (Modern, Classic, Minimal)
- Custom branding (logo, colors)
- No watermark

I wanted the free tier to be genuinely useful, not a crippled teaser. The Pro tier is for people who invoice at volume or want their brand front and center.

### What's Next

- Recurring invoices
- Expense tracking
- Client portal

### Ask for Feedback

I'm shipping fast and would love input from fellow founders, freelancers, and small business operators:

1. **Would you trust a no-signup tool for your business invoices?**
2. **What feature would make you switch from your current invoicing tool?**
3. **Any concerns about the privacy-first / browser-only model?**

Drop your thoughts below 👇
