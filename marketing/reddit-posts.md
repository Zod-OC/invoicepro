# Reddit Marketing Posts — Billify

## Post 1: r/SideProject (primary)

**Title:** I built a free invoice generator that doesn't demand your email, password, or credit card

**Body:**

Every invoicing tool I tried had the same friction: create an account, verify your email, enter your credit card for a "free trial," then get spammed with upsells. I just wanted to make a damn PDF.

So I built **Billify** — https://billify.me

**How it works:**
- Land on the page → start typing → download PDF. That's it.
- No signup. No email. No data leaves your browser (everything is localStorage).
- 12 invoice templates, multi-currency (~160 currencies), tax calculation.
- Auto-saves your work. Come back tomorrow, your invoice is still there.

**Pricing:**
- Free: 3 PDF downloads/month, 2 templates
- Pro (€9/mo): unlimited downloads, all 12 templates, logo upload

The entire app runs client-side. The only server-side component is the Stripe checkout for Pro — and even that uses a stateless JWT, no user database. Your invoice data never touches a server.

**Why no accounts?** Because I'm a freelancer too, and I hate creating accounts. The privacy model is the product, not a limitation. Your client list, invoice history, and business details stay on your device. GDPR non-issue: localStorage isn't a cookie, no data leaves the browser.

**What's next:** PDF Unicode support (CJK/Arabic), tax handling upgrade (VAT/GST labels, reverse charge), payment reminder emails.

Tech: Next.js 14, TypeScript, Tailwind, jsPDF, Stripe. Deployed on a €4/mo Hetzner box with Coolify. 113 tests. Zero analytics tracking (Umami, self-hosted, PII-free).

Feedback welcome — especially from anyone who actually sends invoices regularly. What's missing?

---

## Post 2: r/freelance (targeted)

**Title:** Free invoice tool with no signup — I got tired of Wave/Quickbooks requiring accounts

**Body:**

I'm a freelancer. Every month I send invoices. Every tool wants me to log in, verify my email, connect my bank, and pay €15-30/mo for features I don't use.

Built a dead-simple alternative: **billify.me**

- Type your invoice → download PDF. No account.
- 12 templates, multi-currency, tax calculation
- Free for 3 invoices/month. Pro is €9/mo for unlimited.
- Your data stays in your browser. No server database. No "we got hacked, here's your data on a forum."

I'm not trying to replace QuickBooks. This is for the freelancer who sends 5-10 invoices a month and just wants a clean PDF without the SaaS overhead.

What do you currently use for invoicing? What annoys you about it?

---

## Post 3: r/webdev (technical angle)

**Title:** I built a SaaS with zero user accounts, zero database, and zero analytics tracking

**Body:**

**Billify** — https://billify.me — a free invoice generator.

The interesting technical decision: **no user accounts, no database, no backend data storage.** Everything runs client-side:

- Invoice data → localStorage (with backup/restore JSON export)
- PDF generation → jsPDF entirely in the browser
- Pro tier auth → stateless JWT signed by a tiny Express endpoint, no session store
- Analytics → self-hosted Umami, PII-free, 5 named events, no autocapture
- Stripe checkout → stateless, webhooks sync a `billing_status` flag, no user table

**The privacy model IS the product.** No signup friction = higher conversion. No database = no breach surface. No GDPR consent banner needed (localStorage isn't a cookie).

**The tradeoffs I made:**
- Client-side Pro gating is inherently bypassable (localStorage editing). Accepted — the honest-user model works for a €9/mo product. The server-side PDF watermark + download counter is the real gate.
- Cross-device sync requires Google Drive OAuth (browser-only, no server token storage). Phase 2.
- No collaborative editing. By design — invoices are single-user.

**Architecture:** Next.js 14 static export + separate Express API (Stripe only) + nginx + Umami. Deployed on Hetzner CX22 (€4/mo), 2GB RAM, handles the entire stack including Coolify + Traefik.

**What I'd do differently:** Start with CI from day 1. I shipped for 2 weeks without GitHub Actions and accumulated 35 lint errors that I'm still cleaning up.

---

## Post 4: r/smallbusiness (conversion-focused)

**Title:** What's the simplest way to make professional invoices without subscription hell?

**Body:**

Genuine question for small business owners:

I've used Wave (free but bloated), QuickBooks (€30/mo for features I don't need), and plain Word templates (ugly). None of them let me just... make an invoice and download it.

I ended up building my own: billify.me — no account needed, type and download PDF, free for 3/month.

But I'm curious: what do YOU use? Is there a tool that gets out of your way? Or is everyone just tolerating the SaaS tax?

---

## Posting Schedule

| Subreddit | When | Why |
|-----------|------|-----|
| r/SideProject | Tuesday 9am EST | Primary launch post, indie community |
| r/freelance | Wednesday 10am EST | Target audience, pain-point focused |
| r/webdev | Thursday 2pm EST | Technical angle, different audience |
| r/smallbusiness | Friday 9am EST | Discussion format, drives curiosity |

**Rules:**
- Don't crosspost — write unique angles for each subreddit
- Engage genuinely in comments for the first 2 hours
- Don't mention the product in the title of r/smallbusiness post (it's a discussion, not an ad)
- Follow up with anyone who asks questions via DM

**Karma thresholds:** Accounts need 50+ karma and 30+ day age to post in r/freelance and r/smallbusiness.
