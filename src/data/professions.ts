// Auto-authored programmatic-SEO copy for the 30 profession landing pages.
// Do not hand-edit individual entries casually: regenerate via the authoring
// workflow contract in marketing/programmatic-seo-plan.md if structure changes.
import type { InvoiceItem } from '@/types';

export interface Profession {
  /** URL slug, e.g. "electrician". */
  slug: string;
  /** Singular trade name, e.g. "Electrician". */
  name: string;
  /** Plural, e.g. "Electricians". */
  pluralName: string;
  /** H1 + <title> (before the "| Billify" suffix), e.g. "Free Electrician Invoice Template — No Signup". */
  h1: string;
  /** 150–160 char meta description. */
  metaDescription: string;
  /** 80–120 word lede paragraph. */
  introParagraph: string;
  /** 5–8 real line-item suggestions for this trade. */
  whatToInclude: string[];
  /** 200–300 word practical billing-tips section. */
  industryTips: string;
  /** 3–5 Q&As, also emitted as FAQ JSON-LD. */
  faq: { question: string; answer: string }[];
  /** 2–3 related profession slugs for cross-linking. */
  relatedSlugs: string[];
  /** Prefill for the embedded editor's line items. */
  defaultLineItems: InvoiceItem[];
  /** Prefill tax rate (%). */
  defaultTaxRate: number;
  /** Prefill currency — restricted to the currencies Billify supports. */
  defaultCurrency: 'USD' | 'EUR' | 'GBP';
}

export const professions: Profession[] = [
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Web development — billable hours",
        "quantity": 12,
        "rate": 85
      },
      {
        "description": "Project management & client comms",
        "quantity": 4.5,
        "rate": 75
      },
      {
        "description": "Software subscriptions passed through (receipt attached)",
        "quantity": 1,
        "rate": 49
      },
      {
        "description": "Rush delivery surcharge",
        "quantity": 1,
        "rate": 150
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "For a one-person operation, Net 14 or Net 15 is far better for cash flow than the default Net 30. State the terms and a specific due date on the invoice itself, not just 'payable upon receipt,' and add a late fee clause like 1.5% per month so it's enforceable when a client drags their feet.",
        "question": "What payment terms should I put on my freelance invoice?"
      },
      {
        "answer": "Yes for project work. A 50% upfront deposit protects you against scope creep and ghosting, and clients who won't pay a deposit are the ones most likely to dispute the final bill. For hourly retainer work, bill the retainer at the start of the month, not the end.",
        "question": "Should I take a deposit before starting freelance work?"
      },
      {
        "answer": "It depends on your jurisdiction and what you sell. Most freelance services aren't subject to sales tax, but digital goods, software, and some consulting categories are in many states. Check your local self-employment and sales tax rules, and if a tax applies, show it as its own line so it looks intentional.",
        "question": "Do I need to charge tax on my freelance services?"
      },
      {
        "answer": "State the late fee on the original invoice, typically 1.5% per month or a flat amount after a grace period. A late fee you never mentioned is unenforceable and just annoys the client. Send a polite reminder a few days after the due date, then apply the fee on the next follow-up.",
        "question": "How do I add a late fee to an unpaid invoice?"
      }
    ],
    "h1": "Free Freelancer Invoice Template — No Signup",
    "industryTips": "Set your payment terms on the invoice itself, not buried in a contract. Net 14 or Net 15 beats Net 30 for cash flow when you're a one-person operation, and stating it explicitly makes it enforceable. Always number invoices sequentially and include a clear due date, not just 'payable upon receipt,' which clients interpret as 'whenever.' If you bill hourly, log time in a spreadsheet as you work rather than reconstructing hours at month-end, because rounded-up estimates are the number-one reason clients dispute freelancer invoices. For project work, break the total into a 50% upfront deposit and 50% on delivery, which protects you against scope creep and ghosting. Apply a materials or expense markup only when you've actually incurred the cost, and attach the receipt. Track which clients pay late and quote those clients a deposit-only arrangement next time. Keep a separate invoice numbering series per client if you do repeat work, so you aren't reconciling invoice 1047 across five businesses. Send the invoice the same day you finish a milestone, not the end of the month, because invoices sent within 24 hours of delivery get paid roughly twice as fast. Finally, know your local self-employment tax rate and whether you must collect sales tax on services, then bake it into the invoice so it looks intentional rather than an afterthought added in a follow-up email.",
    "introParagraph": "Freelancing means wearing every hat at once, and chasing unpaid invoices shouldn't be one of them. Whether you bill hourly, per project, or on retainer, the friction comes from juggling different clients, currencies, and payment terms across a dozen side projects. Most invoicing tools want you to create an account, connect a payment processor, and hand over client details before you've even sent a single bill. Billify skips all that. Open the page, drop in your hours and rate, add tax if it applies, and export a clean PDF you can email today. No signup, no recurring fee, no client data sitting on a server.",
    "metaDescription": "Free freelancer invoice template you can use right in your browser. No signup, no account, no data leaves your device. Add hours, rate, and tax, export PDF.",
    "name": "Freelancer",
    "pluralName": "Freelancers",
    "relatedSlugs": [
      "consultant",
      "web-developer",
      "graphic-designer"
    ],
    "slug": "freelancer",
    "whatToInclude": [
      "Hourly rate billing",
      "Project-based flat fee",
      "Retainer hours (used vs. contracted)",
      "Overtime or rush rate",
      "Late payment fee",
      "Reimbursable expenses (software, hosting, subscriptions)",
      "Deposit or upfront payment"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Service call — first hour (journeyman)",
        "quantity": 1,
        "rate": 125
      },
      {
        "description": "Labor — additional hours",
        "quantity": 2.5,
        "rate": 95
      },
      {
        "description": "12/2 Romex & conduit (cost + 20% markup)",
        "quantity": 1,
        "rate": 88
      },
      {
        "description": "200A breaker — materials supplied",
        "quantity": 1,
        "rate": 64
      },
      {
        "description": "Permit & inspection fee",
        "quantity": 1,
        "rate": 75
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes. A flat trip or service call fee covers the first hour and the drive to the job, then you bill hourly beyond that. Stating it on the invoice up front stops the customer from being surprised by the second-hour charge and covers your time even on a quick fix.",
        "question": "Should I charge a service call fee separate from labor?"
      },
      {
        "answer": "A transparent 15 to 30 percent over your cost is standard, shown as an itemized line with the unit cost. Clients contest lump-sum 'parts' charges far more than itemized ones, so breaking out wire, conduit, and breakers with a clear markup keeps disputes down.",
        "question": "How much markup should I put on electrical materials?"
      },
      {
        "answer": "In most states, yes. Put your contractor license number and the state on every invoice, not just the estimate. Homeowners use it to verify you before paying and to claim warranty work later, and inspectors and buyers' attorneys will ask for it years down the road.",
        "question": "Do I need to show my license number on the invoice?"
      },
      {
        "answer": "Pass the permit fee through as its own line item, never buried in labor. Pull a permit for any panel upgrade, new circuit, or service-entrance work, and list the inspection charge separately so it's documented for the homeowner and any future sale of the property.",
        "question": "How do I handle permits and inspection fees on an invoice?"
      }
    ],
    "h1": "Free Electrician Invoice Template — No Signup",
    "industryTips": "In most states your contractor license number belongs on every electrical invoice, not just the estimate, because homeowners use it to verify you before paying and to claim any warranty work later. Break materials out at cost plus a transparent markup, typically 15 to 30 percent, rather than folding them into a single labor figure, because clients contest lump-sum 'parts' charges far more often than itemized ones. For service calls, charge a flat trip fee that covers the first hour and the drive, then bill hourly beyond that, and say so on the invoice so the customer isn't surprised by the second-hour charge. Pull a permit for any panel upgrade, new circuit, or work that touches the service entrance, and pass the permit fee through as its own line item, not buried in labor, because inspectors and buyers' attorneys will ask for it years later. After-hours and emergency calls should carry a clearly stated premium, usually 1.5x or 2x the standard rate, with a minimum charge, and that rate should appear on the invoice before the work starts, not after. Always note the make and model of any fixture or breaker you supplied, plus the warranty period, so the customer knows what's covered. Finally, photograph the finished install and keep it with your job file, because disputed invoices almost always come down to 'was it actually done' and a timestamped photo settles it without a second visit.",
    "introParagraph": "As an electrician, your work lives between two billing realities: the quick service call with a flat fee and the bigger job that spans materials, labor, and a permit inspection. Clients rarely understand the markup on wire and conduit, and a vague invoice is the fastest way to start a dispute over what 'parts' actually cost. You also juggle licensing requirements that change by state, and homeowners want to see your license number before they'll pay. Billify keeps it simple: line up your labor hours, the service call fee, materials at cost plus markup, and any permit or inspection charge, then send a clean PDF from the job site. Nothing leaves your browser.",
    "metaDescription": "Free electrician invoice template for contractors and solo sparkies. Add labor hours, service call fees, materials, and permit costs, then export a clean PDF.",
    "name": "Electrician",
    "pluralName": "Electricians",
    "relatedSlugs": [
      "plumber",
      "hvac",
      "handyman"
    ],
    "slug": "electrician",
    "whatToInclude": [
      "Labor hours (journeyman and apprentice)",
      "Service call / trip fee",
      "Materials at cost plus markup (wire, conduit, breakers)",
      "Permit and inspection fees",
      "Emergency / after-hours rate",
      "Panel, fixture, or breaker supplied",
      "License number and state"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Diagnostic service call (first hour)",
        "quantity": 1,
        "rate": 120
      },
      {
        "description": "Labor — additional hours",
        "quantity": 2,
        "rate": 90
      },
      {
        "description": "PVC fittings & pipe (cost + 25% markup)",
        "quantity": 1,
        "rate": 54
      },
      {
        "description": "40-gal water heater supplied",
        "quantity": 1,
        "rate": 480
      },
      {
        "description": "After-hours emergency premium (1.5x)",
        "quantity": 1,
        "rate": 45
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Charge a flat diagnostic fee for the visit and the time to identify the problem, then quote and bill the fix separately. Folding the trip into the labor rate makes customers assume you're padding hours, while a clear diagnostic line plus labor line shows exactly what they're paying for.",
        "question": "How do I charge for a diagnostic visit versus the actual repair?"
      },
      {
        "answer": "A consistent 20 to 30 percent over cost is standard, and show the unit cost on the invoice so the homeowner sees the parts are real. Itemized fittings and pipe with a clear markup get disputed far less than a single lump-sum 'parts' charge.",
        "question": "What markup should I put on plumbing parts and fixtures?"
      },
      {
        "answer": "Yes. After-hours and emergency calls typically carry a 1.5x to 2x premium with a minimum charge, and that rate should be on the invoice before you start the work, not after. Stating it up front avoids the awkward call when the customer sees the bill at 11pm.",
        "question": "Do I charge more for after-hours and emergency calls?"
      },
      {
        "answer": "Pull a permit for any water heater swap, repipe, or new gas line, and pass the fee through as its own line item. Code inspectors and home buyers' inspectors will ask for it later, and a buried permit fee in labor looks like padding.",
        "question": "Should I pull a permit and bill it on the invoice?"
      }
    ],
    "h1": "Free Plumber Invoice Template — No Signup",
    "industryTips": "Plumbers lose more money on vague invoices than on bad parts, so itemize. Charge a diagnostic fee for the visit and the time to identify the problem, then quote the fix, rather than folding the trip into the labor rate where customers assume you're padding hours. Mark up fittings, pipe, and valves at a consistent 20 to 30 percent and show the unit cost so the homeowner sees the parts are real, not invented. Emergency and after-hours calls should carry a clearly stated premium, typically 1.5x to 2x the standard rate with a minimum charge, and that rate belongs on the invoice before you turn a wrench, not after. When you supply a water heater, toilet, or fixture, list the make, model, and warranty period as its own line, because the warranty is what the customer actually buys and disputes later. Pull a permit for any water heater swap, repipe, or new gas line, and pass the permit fee through as a separate item, because code inspectors and home buyers' inspectors will ask for it. Note the location of the work, like 'master bath shower valve' or 'kitchen sink drain,' on every line, because 'replaced valve' on an invoice with three bathrooms is a dispute waiting to happen. Photograph the leak before and the repair after, and keep it with the job, because water damage claims surface months later and a timestamped photo ends the argument.",
    "introParagraph": "Plumbing invoices get messy fast because a single job can mix a diagnostic visit, parts you picked up at the supply house, and labor that ran longer once you opened the wall. Customers question the markup on fittings and PVC more than almost anything else, and a line that just says 'plumbing repair' invites a phone call. You also deal with after-hours emergencies where the rate doubles, and renters who need an invoice their landlord will accept. Billify lets you lay out the diagnostic fee, labor hours, fixtures at cost plus markup, and any after-hours premium as separate lines, then send a clean PDF from the truck. No account, no app, and the customer's address never leaves your phone.",
    "metaDescription": "Free plumber invoice template for service calls, repairs, and installs. Add labor, trip fee, fixtures, and materials markup, then export a clean PDF in minutes.",
    "name": "Plumber",
    "pluralName": "Plumbers",
    "relatedSlugs": [
      "electrician",
      "hvac",
      "handyman"
    ],
    "slug": "plumber",
    "whatToInclude": [
      "Diagnostic / service call fee",
      "Labor hours (plumber and helper)",
      "Fixtures and fittings at cost plus markup",
      "After-hours or emergency rate",
      "Trip charge for parts run",
      "Water heater / fixture supplied (make, model, warranty)",
      "Permit and inspection (where required)"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Portrait session — half day",
        "quantity": 1,
        "rate": 600
      },
      {
        "description": "Post-production & retouching",
        "quantity": 4,
        "rate": 75
      },
      {
        "description": "Travel & parking (at cost)",
        "quantity": 1,
        "rate": 35
      },
      {
        "description": "Print package — 8x10 fine art",
        "quantity": 6,
        "rate": 45
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes. Split the creative fee from post-production on the invoice, because clients who would never question a shoot day will balk at editing they didn't witness. A labeled line like 'retouching — 4 hrs' ends that conversation before it starts.",
        "question": "Should I charge editing separately from the shoot fee?"
      },
      {
        "answer": "Take 25 to 50 percent to reserve the date, and on wedding work collect the balance before you deliver the gallery, not after. A delivered gallery is your only leverage, and handing it over unpaid is the classic mistake photographers make.",
        "question": "How much deposit should I take for a wedding or session?"
      },
      {
        "answer": "Spell out the usage rights on the invoice itself, including the term and whether the client gets commercial use or personal-only. 'I assumed I owned the photos' is the most common photographer dispute, so state the scope and expiry in writing rather than verbally.",
        "question": "How do I invoice for usage rights and licensing?"
      },
      {
        "answer": "State a late fee and the due date on the original invoice so it's enforceable. Send a polite reminder a few days after the due date, and withhold the full gallery or print delivery until the balance clears, since the gallery is your leverage.",
        "question": "What should I do if a client is late paying the balance?"
      }
    ],
    "h1": "Free Photographer Invoice Template — No Signup",
    "industryTips": "Split the creative fee from post-production on every invoice, because clients who would never question a shoot day will balk at editing they didn't witness, and a labeled line 'retouching — 4 hrs' ends that conversation. Take a deposit of at least 25 to 50 percent to reserve the date, and on wedding work collect the balance before the gallery, not after delivery, because a delivered gallery is your only leverage and handing it over unpaid is the classic mistake. Spell out usage rights in writing on the invoice itself, not a separate contract, including the term and whether the client gets commercial use or personal-only, because 'I assumed I owned the photos' is the most common photographer dispute. Charge travel beyond a set radius as its own line with mileage or a flat fee, and bill parking and tolls at cost, because those add up across a season and clients respect a line item more than a bundled price. For print orders, mark up the lab cost 2 to 3x and show the print size, finish, and quantity so the client understands what they're buying. Apply a usage extension fee if a brand wants to use images past the original term, and quote it in writing rather than verbally. Send the invoice the same day as delivery, and number invoices per client so repeat print orders don't collide.",
    "introParagraph": "Photographers get paid in stages but get questioned in one moment: when the client sees the final invoice and asks why editing is a separate line from the shoot. Your billing mixes a session fee, hours of culling and retouching the client never sees, print markups, and usage rights that expire. Couples want a deposit and a balance, brands want a usage license spelled out, editors want a day rate with travel. Billify lets you separate the creative fee from post-production, list prints or digital files at their real price, and add a travel or assistant line, then send a clean PDF before you hand over the gallery. Nothing is uploaded, and your clients' email addresses stay on your machine.",
    "metaDescription": "Free photographer invoice template for shoots, prints, and packages. Add session fees, editing hours, usage rights, and travel, then export a clean PDF.",
    "name": "Photographer",
    "pluralName": "Photographers",
    "relatedSlugs": [
      "wedding-photographer",
      "videographer",
      "illustrator"
    ],
    "slug": "photographer",
    "whatToInclude": [
      "Session or day-rate fee",
      "Post-production / editing hours",
      "Prints and gallery markup (size and finish)",
      "Usage / licensing rights (term and scope)",
      "Travel and parking",
      "Second shooter or assistant",
      "Deposit and balance line"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Strategy consulting — billable hours",
        "quantity": 14,
        "rate": 175
      },
      {
        "description": "Reimbursable travel (at cost, receipts attached)",
        "quantity": 1,
        "rate": 320
      },
      {
        "description": "Monthly retainer — 20 hrs (10 used this period)",
        "quantity": 1,
        "rate": 2400
      },
      {
        "description": "Subcontractor pass-through",
        "quantity": 1,
        "rate": 450
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Match the model to the work. Hourly suits uncertain scope, fixed-fee suits well-defined deliverables invoiced against milestones, and retainers suit ongoing access. Whatever you pick, break hours by phase so the client sees what they're paying for rather than a single opaque line.",
        "question": "Should I bill hourly, by project, or on retainer?"
      },
      {
        "answer": "Bill them at cost with the receipt referenced on the line, never marked up. Clients tolerate billable hours but despise a hidden margin on a hotel or flight, so a transparent at-cost expense with the receipt number builds trust rather than disputes.",
        "question": "How do I handle reimbursable expenses on a consulting invoice?"
      },
      {
        "answer": "Net 15 is standard for independent work, not Net 30, because you don't have a corporation's cash buffer. State the terms and a late fee, like 1.5 percent per month, on the invoice itself so it's enforceable rather than a surprise follow-up.",
        "question": "What payment terms are standard for independent consultants?"
      },
      {
        "answer": "Show hours contracted, hours used, and hours rolling over or expiring on every retainer invoice. The number-one retainer dispute is 'what happened to the hours I paid for,' so a clear used-versus-remaining line ends that conversation.",
        "question": "How do I show retainer hours used and unused?"
      },
      {
        "answer": "Yes, but only if you stated it on the original invoice. A late fee you never mentioned is unenforceable and just annoys the client. Spell out something like 1.5 percent per month after the due date, then send a polite reminder before applying it.",
        "question": "Can I charge a late fee on an unpaid consulting invoice?"
      }
    ],
    "h1": "Free Consultant Invoice Template — No Signup",
    "industryTips": "Consultants get paid on trust and clarity, and a muddy invoice erodes both. For hourly work, attach a time log or break hours by phase, because a single 'consulting — 40 hrs' line is the fastest way to a disputed bill, while 'discovery — 8 hrs, analysis — 20 hrs, presentation — 12 hrs' sails through. On fixed-fee projects, invoice against milestones, not the calendar, and tie each milestone to a deliverable the client signed off on, so the invoice is a receipt of work done rather than a request. For retainers, show hours contracted, hours used, and hours rolling over or expiring, because the number-one retainer dispute is 'what happened to the hours I paid for.' Bill reimbursable expenses at cost with the receipt referenced, never marked up, because clients tolerate billable hours but despise a hidden margin on a hotel. Set Net 15 terms, not Net 30, for independent work, and state a late fee, like 1.5 percent per month, on the invoice itself so it's enforceable rather than a surprise. Keep a separate invoice series per client so retainer invoice 03 doesn't collide across engagements. Finally, include a brief one-line description per line item, because procurement departments reject invoices that say only 'services rendered.'",
    "introParagraph": "Consultants bill in three shapes, hourly, project, and retainer, and each one invites a different kind of client question. Hourly clients want to see the time log, project clients want to know what's included versus out of scope, and retainer clients want the unused hours explained. Add reimbursable travel, a software subscription you fronted, or a subcontractor, and the invoice turns into a spreadsheet no one wants to read. Billify gives you clean lines for billable hours at your rate, a flat project fee, a monthly retainer with hours used, and reimbursable expenses with receipts noted, then exports a PDF that reads like a professional statement of work. No account, and no client list leaves your laptop.",
    "metaDescription": "Free consultant invoice template for billable hours, retainers, and project fees. Add rate, expenses, and travel, set Net 15 terms, then export a clean PDF.",
    "name": "Consultant",
    "pluralName": "Consultants",
    "relatedSlugs": [
      "freelancer",
      "virtual-assistant",
      "writer"
    ],
    "slug": "consultant",
    "whatToInclude": [
      "Billable hours at rate (broken by phase)",
      "Flat project fee",
      "Monthly retainer and hours used",
      "Reimbursable travel and meals (at cost)",
      "Subcontractor pass-through",
      "Software or tooling passed through",
      "Late fee and payment terms"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Frontend development — hourly",
        "quantity": 12,
        "rate": 95
      },
      {
        "description": "Monthly hosting & maintenance retainer",
        "quantity": 1,
        "rate": 180
      },
      {
        "description": "Domain registration (pass-through)",
        "quantity": 1,
        "rate": 14.99
      },
      {
        "description": "Bug fix sprint — 3 hours",
        "quantity": 3,
        "rate": 95
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Separate them. Pass through domain, SSL, and platform fees at cost as their own line items, and bill your labor and retainers separately. Clients and their accountants need to tell software costs from professional services, and mixing them slows payment while clouding their bookkeeping.",
        "question": "Should I bill hosting and domain renewals on the same invoice as my build hours?"
      },
      {
        "answer": "Reference the signed scope in each milestone line item — for example, 'Milestone 2: checkout integration per SOW dated June 12.' Bill a 30–50% deposit before work starts, and tie each milestone to a deliverable your client accepts in writing. Scope changes get a separate change-order invoice, not a quiet addition to the next bill.",
        "question": "How do I invoice for a milestone-based project without scope creep eating my margin?"
      },
      {
        "answer": "Net 14 is standard for project work and net 7 is fair for small maintenance jobs. For monthly retainers, date the invoice before the month it covers and mark it due on receipt — you should not be financing your client's website. State a late fee of 1.5% per month on the invoice itself so it's agreed before any dispute.",
        "question": "What payment terms should I put on a web development invoice?"
      },
      {
        "answer": "Professional web development labor is generally not taxable in most US states, but preconfigured software, plugins, and themes you resell often are. Check your state's rules on digital goods, and if you're unsure whether a line item is a service or a product, bill it as labor and document your reasoning.",
        "question": "Do I charge sales tax on web development services?"
      }
    ],
    "h1": "Free Web Developer Invoice Template — No Signup",
    "industryTips": "Most freelance web developers underbill because they round hours down out of guilt. Track time in 15-minute increments and bill what you actually worked — clients respect precision more than generosity. Spell out your payment terms on every invoice: net 14 is standard for project work, but retainer invoices should be due before the month they cover, not after. If you charge a fixed milestone, reference the signed scope in the line item description so the client can match it to the contract — that single habit kills most 'what is this for?' emails. Always bill third-party costs (domain renewals, Stripe fees, plugin licenses) as pass-through line items at cost, not buried inside your hourly rate. Clients hate surprise line items, not disclosed ones. For recurring retainers, send a separate invoice each month rather than one annual bill; it keeps cash flow steady and makes churn cheaper to unwind. On late fees, pick a number and put it on the invoice before the work starts — 1.5% per month is common and enforceable in most US states. Charge a deposit of 30–50% upfront on any fixed-scope build; a client who won't pay a deposit is a client who won't pay the final invoice. Finally, keep your hourly rate consistent across clients. The moment a client sees you billed someone else half as much on the same invoice template, your pricing credibility is gone.",
    "introParagraph": "You finish a client's site, send the invoice, and wait three weeks for payment. Freelance web developers juggle hourly debugging sprints, fixed-scope milestones, and recurring hosting retainers — and clients rarely know which is which. Your invoice needs to separate retainer work from one-off build fees so nobody questions the bill. Billify runs entirely in your browser: no account, no database, no monthly fee. Open the template, drop in your line items, and export a clean PDF that a non-technical client can actually read and pay.",
    "metaDescription": "Free web developer invoice template for freelancers. No signup, no login needed — your billing data stays in your browser. Download or print PDF instantly.",
    "name": "Web Developer",
    "pluralName": "Web Developers",
    "relatedSlugs": [
      "web-designer",
      "freelancer",
      "consultant"
    ],
    "slug": "web-developer",
    "whatToInclude": [
      "Hourly development hours",
      "Project milestone payment",
      "Monthly hosting retainer",
      "Bug fix / maintenance sprint",
      "Third-party API / domain costs passed through",
      "CMS license (e.g. Shopify, Webflow)",
      "Deployment and DNS setup"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Logo concept development — hourly",
        "quantity": 8,
        "rate": 85
      },
      {
        "description": "Final logo files (flat fee, 3 revisions included)",
        "quantity": 1,
        "rate": 750
      },
      {
        "description": "Stock photography pass-through (Shutterstock)",
        "quantity": 1,
        "rate": 29.99
      },
      {
        "description": "Font license — commercial use",
        "quantity": 1,
        "rate": 45
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Put the included count on the original invoice line — for example, 'Logo design, 3 revision rounds included.' Bill any round after that as a separate hourly line item. When the boundary is printed on the first invoice, extra charges feel like an agreed term, not a surprise, and most clients stop requesting endless tweaks.",
        "question": "How do I charge for revision rounds without sounding difficult?"
      },
      {
        "answer": "List them as pass-through line items at the exact cost you paid, with the vendor named in the description. The client owns those licenses, so they need the paper trail for their own accounting and legal records. Folding them into your design fee hides a real expense and makes you eat the cost if the client disputes the bill.",
        "question": "Should stock photos and fonts go on my invoice or be billed separately?"
      },
      {
        "answer": "Net 14 is standard for solo clients, and net 30 is common when you're sub-contracting through a larger agency. Charge a 50% deposit before starting concept work on anything over $500 — that deposit covers the hours you'll spend whether or not the project reaches final delivery.",
        "question": "What payment terms are normal for freelance design work?"
      },
      {
        "answer": "After. Send watermarked, low-resolution PDFs for review and approval, but hold the editable source files, print-ready files, and final assets until the final invoice clears. The source files are your only leverage if a client stops responding, so never release them early.",
        "question": "Do I hand over source files before or after final payment?"
      }
    ],
    "h1": "Free Graphic Designer Invoice Template — No Signup",
    "industryTips": "Freelance graphic designers lose money on revisions more than anywhere else. State how many revision rounds your fee includes on the invoice line itself — 'Logo design, 3 revision rounds included' — and bill every round after that as a separate line item at your hourly rate. Clients accept extra revision charges far better when the boundary was on the original invoice. Bill stock photos, fonts, and stock vectors at cost as pass-through line items, never folded into your design fee. A font license is a real, traceable expense and the client owns that license, not you. Keep the receipts and reference them in the description so the client's accountant can match the charge to a vendor. For usage licensing — packaging, broadcast, regional rights — describe the scope precisely. 'Unlimited usage' sounds generous until a client puts your illustration on merchandise sold worldwide; charge for the rights you actually grant. Net 14 is the industry standard for design work; large agencies sometimes push net 30, but a solo client should pay net 14. Charge 50% upfront on any project over $500 — concept time is non-refundable work, and a deposit filters out clients who planned to argue about the final bill. Finally, never deliver final print-ready or source files before the final invoice is paid. Watermarked PDFs for approval are fine; the editable files are your leverage.",
    "introParagraph": "You delivered the logo files three weeks ago and the client still hasn't paid because the invoice buried your design hours under a vague 'project' line. Freelance graphic designers bill in three different currencies — hourly concept time, flat per-asset fees, and usage licensing — and clients need to see which is which. Your invoice should split concepts from revisions and call out stock photography and font licenses as pass-through costs. Billify stays in your browser, so there's no account to create and no client data leaving your machine. Drop in your line items and export a PDF your client's accounts team can process without a follow-up call.",
    "metaDescription": "Free graphic designer invoice template for freelancers. No signup needed — your billing stays private in your browser. Download or print a clean PDF now.",
    "name": "Graphic Designer",
    "pluralName": "Graphic Designers",
    "relatedSlugs": [
      "illustrator",
      "web-designer",
      "freelancer"
    ],
    "slug": "graphic-designer",
    "whatToInclude": [
      "Concept development hours",
      "Logo design — flat fee",
      "Revision rounds",
      "Stock photography (pass-through)",
      "Font / typeface license",
      "Usage rights / licensing fee",
      "Print production management",
      "Brand guidelines document"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Labor — finish carpentry on site",
        "quantity": 16,
        "rate": 65
      },
      {
        "description": "Lumber & sheet goods (20% markup)",
        "quantity": 1,
        "rate": 540
      },
      {
        "description": "Hardware & fasteners",
        "quantity": 1,
        "rate": 85
      },
      {
        "description": "Demolition & haul-away",
        "quantity": 1,
        "rate": 150
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "15–20% is standard for lumber and hardware. That markup covers your time sourcing, lumberyard runs mid-job, and the waste factor on cuts. Always itemize what you bought — 'maple 1x6, 24 pcs at $11.50' beats 'lumber — $276' and stops homeowners from checking your numbers against the receipt.",
        "question": "How much should I mark up materials on a carpentry invoice?"
      },
      {
        "answer": "Yes, always. Collect a material deposit that covers the lumber and hardware before you buy anything out of pocket. Walnut, maple, and hardwood plywood are expensive, and a client who ghosts after you've stocked the job leaves you holding the wood. A deposit also filters out clients who never intended to pay.",
        "question": "Should I ask for a deposit before buying lumber?"
      },
      {
        "answer": "Bill permits as a pass-through line item at exact cost, and keep the permit and inspection paperwork. If an inspection fails and triggers a re-fee, your invoice trail proves the cost was real and not padded. Some states require your contractor license number on the invoice, so include it to stay compliant and professional.",
        "question": "Do I bill permits on the invoice or separately?"
      },
      {
        "answer": "Show labor and materials as separate lines even when the total is fixed, so the client sees what the work really costs. When the client adds shelves, trim, or a paint touch-up, send a separate change-order invoice for the extra rather than folding it into the original total. Reference the signed quote on the original invoice.",
        "question": "How do I invoice for a fixed-price job without losing money on scope creep?"
      }
    ],
    "h1": "Free Carpenter Invoice Template — No Signup",
    "industryTips": "Carpenters get burned on material markup more than any other trade. Buy lumber and hardware at your trade discount, then mark it up 15–20% on the invoice — that markup covers your time sourcing, the cost of running to the lumberyard mid-job, and the waste factor on every cut. Itemize every material; 'lumber — $420' is fine, '2x4 x8, 40 pcs' is better, and it shuts down the homeowner who wants to check your numbers against the receipt. Bill labor in quarter-hour increments, not rounded hours. A 20-minute hinge adjustment billed honestly at 0.5 hours builds more trust than a rounded hour that looks padded. On fixed-price jobs, still show labor and materials as separate lines even if the total is agreed — it teaches the client what the work actually costs and protects you when the scope grows. Always collect a material deposit before buying anything out of pocket. Lumber is expensive, and a client who ghosts after you've bought $800 of walnut leaves you holding the wood. Put a late fee on the invoice — 1.5% per month is standard and enforceable in most states. For permits, bill them as a pass-through at exact cost and keep the inspection paperwork; a homeowner will blame you if a failed inspection costs a re-fee, and your invoice trail is your defense. Finally, note your contractor license number on every invoice if your state requires one.",
    "introParagraph": "You finished the built-in bookshelves, but the homeowner is questioning the lumber bill because your invoice just says 'materials.' Carpenters live and die by material markup and accurate labor tracking, and a vague invoice invites a dispute on a job where your margin is already thin. Your invoice needs to list every stick of lumber, every box of screws, and every hour on site — plus the markup that keeps you profitable. Billify runs in your browser with no account, so you can build the invoice on your phone in the truck and hand over a clean PDF before you drive off.",
    "metaDescription": "Free carpenter invoice template for freelancers. No signup, no login — your job billing stays private in your browser. Download or print a clean PDF instantly.",
    "name": "Carpenter",
    "pluralName": "Carpenters",
    "relatedSlugs": [
      "handyman",
      "roofer",
      "painter"
    ],
    "slug": "carpenter",
    "whatToInclude": [
      "Labor hours on site",
      "Lumber and sheet goods (with markup)",
      "Hardware and fasteners",
      "Finish materials — stain, paint, sealant",
      "Tool rental / equipment",
      "Permit and inspection fees",
      "Demolition and haul-away",
      "Shop drawing / template time"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "1-on-1 training session (60 min)",
        "quantity": 8,
        "rate": 80
      },
      {
        "description": "10-session block — block rate",
        "quantity": 1,
        "rate": 720
      },
      {
        "description": "Custom 12-week programming plan",
        "quantity": 1,
        "rate": 150
      },
      {
        "description": "Movement assessment & screen",
        "quantity": 1,
        "rate": 60
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Often yes, but only if the right services are itemized. Split personal training from nutrition consulting on the invoice, because many wellness programs reimburse training sessions but reject meal plans. A single lumped 'training package' line item usually gets the whole claim denied, so itemize clearly.",
        "question": "Can my clients use my invoices for HSA or wellness reimbursement?"
      },
      {
        "answer": "Collect payment upfront before the block starts, and show the per-session rate and the block discount on the invoice. Track sessions used on each subsequent invoice so the client always knows how many remain. Trainers who bill after the last session end up chasing clients who already stopped showing up.",
        "question": "How should I bill a 10-session package — upfront or per session?"
      },
      {
        "answer": "50% of the session rate for cancellations under 24 hours, and full rate for no-shows. The key is stating it on your intake paperwork before the first session, not springing it as a surprise on the final invoice. When it's an agreed term up front, clients rarely argue.",
        "question": "What's a fair late-cancellation fee for personal training?"
      },
      {
        "answer": "Pick one method and stick to it — either pass the rental through as a separate line item, or fold it into your session rate. Doing both on different invoices double-charges the client and looks sloppy. Consistency matters more than which method you choose, so pick one and apply it every time.",
        "question": "Should I include gym floor rental on my invoice?"
      }
    ],
    "h1": "Free Personal Trainer Invoice Template — No Signup",
    "industryTips": "Personal trainers lose clients and money to unclear package billing. If you sell a 10-session block, put the per-session rate and the block discount on the invoice line — '10 sessions at $80, block rate $720' — so the client sees the value they're getting and knows each session's worth. Track sessions used against the package on each invoice; a running tally prevents the awkward 'you actually only have two left' conversation after a client thought they had five. Charge a late-cancellation fee and put it on your intake paperwork before the first session, not as a surprise on the final invoice. 50% of the session rate for cancellations under 24 hours is standard, and stating it up front makes it enforceable. Bill no-shows at full rate. For HSA and wellness reimbursement, separate personal training from nutrition consulting on the invoice — many benefits programs reimburse training but not meal plans, and a single lumped line item gets the whole claim rejected. If you rent floor space at a gym, list the rental as a pass-through or fold it into your session rate consistently — never both, which double-charges the client on some invoices. Collect payment before the block starts, not after the last session; trainers who bill in arrears chase clients who've already stopped showing up. Finally, send a clean PDF for every package, even small ones. The invoice is your record for taxes and your proof of a real business if the IRS or a benefits administrator ever asks.",
    "introParagraph": "Your client just finished a 12-week block and wants a receipt for their HSA or wellness benefit — but you've been collecting payment through Venmo with no paper trail. Freelance personal trainers juggle single sessions, package blocks, and gym floor-rental fees, and a clean invoice proves you're running a real business, not a side hustle. Your invoice should separate training sessions from programming and nutrition plans so clients can submit the right lines to reimbursement. Billify lives in your browser with no signup, so you can build a professional PDF from your phone between sets and email it before the client leaves the gym.",
    "metaDescription": "Free personal trainer invoice template for freelancers. No signup, no login — your billing stays private in your browser. Download or print clean PDF instantly.",
    "name": "Personal Trainer",
    "pluralName": "Personal Trainers",
    "relatedSlugs": [
      "massage-therapist",
      "coach",
      "therapist"
    ],
    "slug": "personal-trainer",
    "whatToInclude": [
      "1-on-1 training session",
      "Session package block (e.g. 10 sessions)",
      "Custom programming / workout plan",
      "Nutrition guidance plan",
      "Gym floor rental fee",
      "Assessment and movement screen",
      "Remote / virtual training session",
      "Late cancellation fee"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Calculus tutoring — 1-on-1 (60 min)",
        "quantity": 4,
        "rate": 90
      },
      {
        "description": "SAT prep — 8-session package",
        "quantity": 1,
        "rate": 640
      },
      {
        "description": "Homework help — elementary reading (45 min)",
        "quantity": 6,
        "rate": 45
      },
      {
        "description": "Custom SAT math module — curriculum prep",
        "quantity": 2,
        "rate": 60
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Often yes, but the subject and level must be on each line item so the parent can match it to the right reimbursement category. Separate test prep from general homework help, since some programs cover one and not the other. A clean, itemized PDF is exactly what benefits administrators ask for.",
        "question": "Can parents use my tutoring invoices for 529 plan or education reimbursement?"
      },
      {
        "answer": "Yes. Calculus, physics, and MCAT prep routinely command $80–120 an hour, while elementary reading help sits closer to $40–60. List the subject and level on every line so parents understand the difference. Flat-rating everything either leaves money on the table or prices you out of lower-level work.",
        "question": "Should I charge different rates for different subjects?"
      },
      {
        "answer": "Collect package payment upfront or in two installments. Show the per-session rate inside the package total so the parent sees the unit cost, and track sessions used on each invoice. A parent who's already paid is far more likely to keep showing up than one you're chasing in arrears.",
        "question": "Should I bill for a semester package upfront or per session?"
      },
      {
        "answer": "State on the original invoice that sessions expire after 90 days. An expiration policy is enforceable and far less confrontational than chasing a late fee. Track remaining sessions on every invoice so the parent always knows where they stand and rebooks before time runs out.",
        "question": "How do I handle unused sessions in a package without being awkward?"
      }
    ],
    "h1": "Free Tutor Invoice Template — No Signup",
    "industryTips": "Tutors get underpaid mostly by not charging different rates for different subjects. Calculus, physics, and MCAT prep command $80–120 an hour, while elementary reading help might be $40–60 — and billing them all at one flat rate leaves money on the table or prices you out of jobs. List the subject and level on every line item so parents understand why one hour costs more than another. Parents rarely argue about a rate when the subject is spelled out. For package billing, show the per-session rate inside the package — '8 sessions, $70 each, package total $560' — so the parent sees the unit cost even though they're paying for the block. Track sessions used on each invoice and note sessions remaining; a parent who's lost count is a parent who stops rebooking. Charge for materials and curriculum prep when it's substantial; an hour building a custom SAT math module is billable, and most parents happily pay when you describe what you built. Bill in arrears only for hourly work you've already done. For packages and semester blocks, collect payment upfront or in two installments — a parent who's paid is a parent who shows up. Late fees are awkward with families, so instead state that sessions not used within 90 days expire; that's enforceable and less confrontational than a fee. Finally, if you tutor through an online platform, keep your own invoices too. Platform records vanish when an account closes, and your PDFs are your tax records and your proof of income for a mortgage or lease.",
    "introParagraph": "You tutored eight hours this month and the parent is asking for a receipt they can submit to their 529 plan or learning-support program. Freelance tutors bill by the hour, by the semester package, and sometimes by the subject at different rates — and parents need to see exactly what they paid for. A Venmo request with a smiley face is not an invoice. Your invoice should separate test prep from homework help and note the subject on each line so parents can match it to a reimbursement category. Billify runs in your browser with no account, so you can send a clean PDF from your laptop the minute a session ends.",
    "metaDescription": "Free tutor invoice template for freelancers. No signup, no login — your billing stays private in your browser. Download or print a clean PDF instantly.",
    "name": "Tutor",
    "pluralName": "Tutors",
    "relatedSlugs": [
      "coach",
      "therapist",
      "consultant"
    ],
    "slug": "tutor",
    "whatToInclude": [
      "1-on-1 tutoring session (subject + level)",
      "Test prep — SAT / ACT / GRE block",
      "Homework help session",
      "Semester package — subject specified",
      "Group / small-group session",
      "Curriculum and materials prep",
      "Progress report / assessment",
      "Travel to student's home"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Service call fee / trip charge",
        "quantity": 1,
        "rate": 75
      },
      {
        "description": "Labor — general repairs",
        "quantity": 3,
        "rate": 65
      },
      {
        "description": "Materials (hinges, drywall, hardware)",
        "quantity": 1,
        "rate": 48
      },
      {
        "description": "Disposal of old fixtures",
        "quantity": 1,
        "rate": 35
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "A flat trip or service call fee of $50 to $125 is standard for the first hour in most US markets, on top of your hourly rate. Put it on its own line so the client sees it isn't hidden in the labor. For jobs under an hour, the call fee often is the minimum charge.",
        "question": "How much should I charge for a service call fee?"
      },
      {
        "answer": "Yes. Take 30 to 50 percent up front for any job that requires you to buy fixtures, paint, or parts over about $100. Buying materials on your own card without deposit money is the fastest way to go broke on a no-show client.",
        "question": "Should I take a deposit before buying materials?"
      },
      {
        "answer": "Use net seven for small handyman jobs, not net thirty. Small jobs are easy to forget, and a week is long enough. State a 1.5 percent monthly late fee on the invoice so you can actually collect when a client drags it out.",
        "question": "What payment terms should I put on the invoice?"
      },
      {
        "answer": "In states that license handymen — California, Oregon, Arizona, Florida, and others — yes, put the number on every invoice. A disputes board will check for it, and its absence can turn an unpaid invoice into a regulatory problem.",
        "question": "Do I need my contractor license number on the invoice?"
      }
    ],
    "h1": "Free Handyman Invoice Template — No Signup",
    "industryTips": "Handyman billing gets disputes fastest when labor and materials are blended into one number. Always split them — clients tolerate a healthy materials markup when they can see the parts cost separately, but a single inflated line looks like padding. Note your trip charge explicitly; a flat service-call fee for the first hour is standard in most US markets and clients expect to see it rather than have it buried in the hourly rate. Track time to the quarter hour and write start and end times on the invoice. If a job ran long because the previous contractor's wiring was wrong, that is billable time — say so on the line item instead of absorbing it. Keep a running materials list on your phone during the job so you don't forget the box of wire nuts and the tube of caulk at the end of a ten-item day. In states that require it, put your contractor registration or license number on every invoice — California, Oregon, and many others treat unregistered handyman work as a misdemeanor, and a missing number on the invoice is the easiest thing a disputes board can check. If a job crosses a deposit threshold, take a deposit of 30 to 50 percent for materials and never buy specialty fixtures on your own card without that money in hand. Specify payment terms as net seven, not net thirty, for small jobs, and add a late fee clause — 1.5 percent monthly is common and enforceable in most states — so you can actually collect on the slow payers.",
    "introParagraph": "Most handyman jobs are a mix of small repairs, odd installs, and a constantly shifting list of materials from the hardware store. That makes billing messy — you finish a leaky faucet, hang drywall, and replace a door handle in the same afternoon, then try to remember what you charged for each. Billify lets you build a clean invoice on your phone between jobs, with separate lines for labor, parts, and the trip out to the site. Nothing is stored online and there is no account to manage, so you can send it and move straight to the next call.",
    "metaDescription": "Free handyman invoice template you fill in your browser. Add labor hours, materials, and trip charges. No signup, no download — your data stays on your device.",
    "name": "Handyman",
    "pluralName": "Handymen",
    "relatedSlugs": [
      "plumber",
      "carpenter",
      "electrician"
    ],
    "slug": "handyman",
    "whatToInclude": [
      "Trip charge / service call fee",
      "Labor hours with start and end times",
      "Materials and hardware markup",
      "Disposal or dump fees",
      "Mileage to remote sites",
      "Emergency or after-hours premium",
      "Permit pull fee"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Weekly clean — 2 bed / 1 bath",
        "quantity": 4,
        "rate": 120
      },
      {
        "description": "Deep clean — kitchen and appliances",
        "quantity": 1,
        "rate": 60
      },
      {
        "description": "Interior windows",
        "quantity": 8,
        "rate": 6
      },
      {
        "description": "Cleaning supplies consumables",
        "quantity": 1,
        "rate": 18
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Use a flat visit rate for recurring cleans — clients like predictability and you stop losing money on a tough house. Use hourly for one-time deep cleans where the scope is genuinely unknown until you see it. You can mix both on one invoice: a flat base rate plus hourly add-ons.",
        "question": "Should I charge hourly or a flat rate per clean?"
      },
      {
        "answer": "List every room and each add-on — oven, fridge, windows, baseboards — as its own line. When a client says 'I thought the oven was included,' the line item ends it. A vague 'house clean — $120' is what starts the argument.",
        "question": "How do I stop clients disputing what was cleaned?"
      },
      {
        "answer": "Yes, and you should. Add a modest supplies line for consumables like solutions, cloths, and sponges, even if it's only a few dollars. Those costs disappear into your margin otherwise, and clients accept the line when it's shown.",
        "question": "Can I charge for cleaning supplies separately?"
      },
      {
        "answer": "Set due on receipt for one-time cleans and net seven for recurring. Cleaners get stretched on receivables more than most trades because clients treat cleaning as optional. A stated 1.5 percent monthly late fee gives you a real way to collect.",
        "question": "What payment terms work for recurring clients?"
      }
    ],
    "h1": "Free Cleaner Invoice Template — No Signup",
    "industryTips": "Cleaning clients argue about scope more than price, so your invoice should prove what you did. List every room or zone serviced, not just 'house clean,' and call out the add-ons — inside the oven, inside the fridge, the interior windows, the baseboards — because that is what separates a $90 tidy from a $320 deep clean. When a client says 'I thought that was included,' pointing at the line item ends the conversation. For recurring clients, put the visit schedule on the invoice: 'Weekly, Tuesdays, 1.5 hrs.' It prevents the classic dispute where a client claims they were billed for a visit that didn't happen. Keep your hourly and flat rates consistent across the invoice — mixing a flat visit rate with an hourly add-on is fine, but state which is which on each line. Charge for supplies explicitly, even if it is a few dollars. Consumables — cloths, solutions, sponges — get eaten silently and clients never see that cost. A modest supplies line keeps your real margin visible. If you hold keys or alarm codes, a small lockout or key-handling fee is normal and worth stating up front in your terms, not added as a surprise. Set payment terms to due on receipt for one-time cleans and net seven for recurring; cleaners get stretched on receivables more than any trade because clients treat cleaning as optional. A late fee of 1.5 percent per month, stated on the invoice, gives you a way to collect. Always confirm whether your state taxes cleaning services — several US states tax commercial cleaning but exempt residential, and billing the wrong way triggers audit interest.",
    "introParagraph": "Cleaners rarely bill one job the same way twice. A one-time deep clean of a three-bedroom house is priced differently from a weekly tidy of a small apartment, and clients always want to see exactly what was covered. Billify lets you itemize by room, by hour, or by a flat visit rate, so a move-out clean can list oven degreasing and carpet shampoo as separate lines next to the base rate. Because everything runs in your browser with no account, you can write the invoice on the kitchen counter before you leave and email it from your phone.",
    "metaDescription": "Free cleaner invoice template you fill in your browser. Add recurring visits, rooms, and supplies. No signup, no download — your data stays on your device.",
    "name": "Cleaner",
    "pluralName": "Cleaners",
    "relatedSlugs": [
      "handyman",
      "painter",
      "landscaper"
    ],
    "slug": "cleaner",
    "whatToInclude": [
      "Recurring vs one-time clean designation",
      "Hourly rate or flat visit rate",
      "Rooms or zones serviced",
      "Cleaning supplies and consumables",
      "Window or carpet add-ons",
      "Key pickup / lockout fee",
      "Travel surcharge for distant jobs"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Surface prep — patch, sand, caulk",
        "quantity": 1,
        "rate": 180
      },
      {
        "description": "Primer — 1 coat",
        "quantity": 1,
        "rate": 150
      },
      {
        "description": "Interior walls — 2 coats (per sq ft)",
        "quantity": 450,
        "rate": 0.85
      },
      {
        "description": "Paint — premium latex satin, 3 gal",
        "quantity": 3,
        "rate": 62
      },
      {
        "description": "Trim cut-in labor",
        "quantity": 8,
        "rate": 40
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Break out prep, primer, paint, and labor as separate lines with the square footage and coat count. Clients argue most when they see one big number; they accept the same total when prep and a named paint brand are visible. Quote paint by the gallon with the brand and sheen.",
        "question": "How do I price a repaint so the client doesn't balk?"
      },
      {
        "answer": "Take one-third up front for any job over a few hundred dollars, especially when you're buying the paint. Paint is returnable only unopened, so leftover custom-mixed gallons are your loss. Deposit money in hand means you're never financing the client's materials.",
        "question": "Should I take a deposit for materials?"
      },
      {
        "answer": "In licensed states — California, Arizona, Florida, and others — yes, include your license number. For pre-1978 homes, note your EPA lead-safe certification too. A missing number is the easiest thing a disputes board checks.",
        "question": "Do I need my contractor license on the invoice?"
      },
      {
        "answer": "Net seven for residential work, not net thirty. Paint jobs are finished and visible, so there's no reason to wait a month. Add a 1.5 percent monthly late fee on the invoice and photograph the walls before and after as your record if a client later claims the finish is uneven.",
        "question": "What payment terms should I set?"
      }
    ],
    "h1": "Free Painter Invoice Template — No Signup",
    "industryTips": "Paint estimates go wrong when prep is free. It isn't. Sanding, patching, caulking, and masking are the majority of the labor on a repaint, and clients who only see 'paint walls — $X' will balk when the bill is high. Put prep on its own line with a clear description, and quote paint by the gallon with the brand and sheen named — 'Benjamin Moore Regal Select, matte' — so the client understands they are paying for a real product, not mystery liquid. Quote by the square foot for walls and by the linear foot for trim, and state the number of coats. Two coats over a dark color costs more than the client expects; the invoice should reflect that before you start, not after. Keep your paint markup visible — 15 to 20 percent over the paint store price is standard and covers the trip, the returns, and the half-gallons you never use. On exterior work, list the ladder or lift rental and the disposal of scraped paint separately if your area treats paint waste as regulated. In states with contractor licensing — California, Arizona, Florida, and others — your license number belongs on the invoice, and so does the lead-safe certification note for pre-1978 homes. Take a deposit of one-third for materials on jobs over a few hundred dollars, set terms to net seven on residential, and add a 1.5 percent monthly late fee. Photograph the walls before and after; the photo set is your defense when a client claims the finish is uneven weeks later.",
    "introParagraph": "Painters live and die by prep and material math, but most invoices bury that detail under a single flat number — and then clients question the total. A good invoice shows the square footage, the coats, the primer, the sanding and patching, and the paint itself by the gallon with the brand named. Billify gives you line items for all of that so the breakdown is obvious and the markup on paint is visible rather than hidden. Build it on site when you walk the room, store nothing online, and send the PDF before you load your ladders.",
    "metaDescription": "Free painter invoice template you fill in your browser. Add labor, primer, paint gallons, and prep. No signup, no download — your data stays on your device.",
    "name": "Painter",
    "pluralName": "Painters",
    "relatedSlugs": [
      "handyman",
      "carpenter",
      "roofer"
    ],
    "slug": "painter",
    "whatToInclude": [
      "Square footage and number of coats",
      "Primer coat(s)",
      "Paint by the gallon (brand and sheen)",
      "Surface prep — sanding, patching, caulking",
      "Trim and cut-in labor",
      "Wallpaper removal or repair",
      "Masking and drop cloth setup",
      "Cleanup and disposal"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Full shoot day — 2 cameras",
        "quantity": 1,
        "rate": 1800
      },
      {
        "description": "Second operator",
        "quantity": 1,
        "rate": 650
      },
      {
        "description": "Edit — rough cut + 2 revisions",
        "quantity": 22,
        "rate": 85
      },
      {
        "description": "Color grading",
        "quantity": 1,
        "rate": 300
      },
      {
        "description": "Motion graphics / titles",
        "quantity": 1,
        "rate": 250
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Break post into rough cut, revisions, and color or sound, each with its own line and hours. Reference your contract's revision cap — usually two rounds included — so the third round is clearly billable. A single 'edit — $X' line is what causes the argument.",
        "question": "How do I bill the edit without the client complaining?"
      },
      {
        "answer": "Yes, list the camera, lenses, media, and batteries as a package with a day rate of $400 to $1,200 depending on your kit. Clients who see the gear as a line item stop treating it as free, and it lets you quote a lower day rate without losing money.",
        "question": "Should I charge gear separately from my day rate?"
      },
      {
        "answer": "Take 25 to 50 percent to lock the date and state that it's non-refundable inside two weeks. That's standard. The deposit protects you when a client cancels after you've turned down other work for that date.",
        "question": "How much deposit should I take for an event or wedding?"
      },
      {
        "answer": "Send the invoice with the gallery link, not on shoot day, and set it to net seven. Videographers get paid last because the deliverable comes weeks later. A 1.5 percent monthly late fee on the invoice is your tool for the slow payers.",
        "question": "What payment terms work when delivery is weeks after the shoot?"
      }
    ],
    "h1": "Free Videographer Invoice Template — No Signup",
    "industryTips": "Videographer disputes almost always come down to the edit. Clients underestimate how many hours the post takes, so your invoice should make the edit phase as visible as the shoot. Break post into rough cut, revisions, and color or sound, each with its own line and hour count, and reference your contract's revision cap — '2 revisions included, additional rounds billed at $X/hr' — so the fourth round of changes is clearly extra, not a favor. List your gear package explicitly with a day rate. Clients who see 'camera, lenses, media, batteries' as a line item stop treating the kit as free; a real package runs $400 to $1,200 a day depending on bodies and glass. Charge for a second operator or assistant as its own line — clients try to fold the second shooter into the main rate, and your invoice is where that gets corrected. Drone work needs its own line because Part 107 licensing, insurance, and the risk are real costs; do not bundle it. For weddings and events, take a deposit of 25 to 50 percent to lock the date and state that it is non-refundable inside two weeks — that is standard and the invoice terms are where it lives. Deliver the final invoice with the gallery link, set terms to net seven, and add a 1.5 percent monthly late fee; videographers get paid last because the deliverable comes weeks after the shoot. Confirm whether your state taxes production services — some tax the equipment rental portion separately from labor.",
    "introParagraph": "Videography pricing splits across two phases nobody outside the industry understands — the shoot and the edit — and clients constantly ask why the edit costs more than the filming. A clear invoice fixes that. Break out the shoot day, the assistant or second operator, the camera and lens package, the drone fee, and the post hours by the rough cut and the fine cut. Billify keeps all of that as named line items instead of one vague package price, runs entirely in your browser so no project details leak to a server, and exports a clean PDF you can attach to the gallery delivery email.",
    "metaDescription": "Free videographer invoice template you fill in your browser. Add shoot day, gear, and editing hours. No signup, no download — your data stays on your device.",
    "name": "Videographer",
    "pluralName": "Videographers",
    "relatedSlugs": [
      "photographer",
      "wedding-photographer",
      "dj"
    ],
    "slug": "videographer",
    "whatToInclude": [
      "Pre-production / storyboard and planning",
      "Shoot day (half-day vs full-day)",
      "Second operator or assistant",
      "Camera and lens package",
      "Drone / aerial footage fee",
      "Motion graphics and titles",
      "Color grading",
      "Edit hours — rough cut and revisions"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Feature article (per word)",
        "quantity": 1200,
        "rate": 0.5
      },
      {
        "description": "Interview and research",
        "quantity": 3,
        "rate": 60
      },
      {
        "description": "Extra revision round",
        "quantity": 1,
        "rate": 120
      },
      {
        "description": "Rush delivery surcharge",
        "quantity": 1,
        "rate": 75
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Per word or per project for defined pieces — clients like a clear number. Hourly suits open-ended consulting or projects where the scope shifts. The key is to state the word count or deliverable on the invoice so the editor can't quietly expand it.",
        "question": "Should I bill per word, per project, or hourly?"
      },
      {
        "answer": "Line-item them. Your contract should include two rounds; anything beyond is billable at your hourly rate, and the invoice should show 'Revision round 3 — 2 hrs.' so the client sees what endless notes cost. Bundling revisions into one fee is how writers work for free.",
        "question": "How do I charge for extra revision rounds?"
      },
      {
        "answer": "A kill fee is the percentage of your full fee — usually 25 to 50 percent — that the client pays when an assignment is spiked after you've started. Put it on the invoice referencing your contract's kill fee clause, so you're paid for time already spent.",
        "question": "What's a kill fee and how do I invoice it?"
      },
      {
        "answer": "Net thirty for publications with standing contracts, net seven for one-off clients. Add a 1.5 percent monthly late fee. Confirm whether your state taxes freelance writing — most don't tax editorial services, but content marketing is sometimes treated differently.",
        "question": "What payment terms should I set?"
      }
    ],
    "h1": "Free Writer Invoice Template — No Signup",
    "industryTips": "Writers get underpaid because the invoice hides the real scope. A 1,200-word feature is not just the words — it is the interviews, the transcript, the fact-check, and the two rounds of editor revisions, and each of those should be its own line or baked into a clear per-word rate that accounts for them. If you bill per word, state the word count on the invoice; if you bill per project, name the deliverable precisely ('1,200-word feature, draft + 2 revisions'). Vague 'article — $600' invites the editor to ask for a third and fourth round for free. Always line-item extra revision rounds. Your contract should include two rounds; anything beyond that is billable at your hourly rate, and the invoice should show 'Revision round 3 — 2 hrs.' so the client sees the cost of endless notes. Charge a rush surcharge — 25 to 50 percent is normal for a 48-hour turnaround — and label it, because rush work costs you other work. Kill fees belong on the invoice when an assignment is spiked; state the kill fee percentage from your contract, usually 25 to 50 percent of the full fee, so the client pays for the time already spent. Usage and licensing matter too: one-time print rights are not the same as ongoing web use or syndication, and a usage line lets you charge for the upgrade. Set terms to net thirty for publications with standing contracts and net seven for one-off clients, add a 1.5 percent monthly late fee, and confirm whether your state taxes freelance writing — most do not tax editorial services, but content marketing and copywriting are sometimes treated differently.",
    "introParagraph": "Freelance writers juggle three pricing models depending on the client — per word, per project, or hourly — and the worst invoices collapse them into a flat fee that hides whether revisions were billed. Billify lets you itemize the deliverable by word count or piece, add a separate line for the extra round of edits the editor requested, and note kill fees or rush surcharges as their own rows. Everything stays in your browser, so you can draft the invoice from the coffee shop where you wrote the draft, export a PDF, and get paid without ever creating an account or handing your client list to a server.",
    "metaDescription": "Free writer invoice template you fill in your browser. Add per-word, per-project, and hourly rates. No signup, no download — your data stays on your device.",
    "name": "Writer",
    "pluralName": "Writers",
    "relatedSlugs": [
      "web-developer",
      "graphic-designer",
      "consultant"
    ],
    "slug": "writer",
    "whatToInclude": [
      "Deliverable — word count or piece",
      "Research and interview time",
      "Revisions / extra edit rounds",
      "Rush delivery surcharge",
      "Kill fee or kill-fee retainer",
      "Usage / licensing (one-time vs ongoing)",
      "Stock images or fact-checking costs",
      "Hourly consulting rate"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Diagnostic / service call fee",
        "quantity": 1,
        "rate": 89
      },
      {
        "description": "Labor — system troubleshooting (reg hrs)",
        "quantity": 2.5,
        "rate": 95
      },
      {
        "description": "R-410A refrigerant recharge (per lb)",
        "quantity": 8,
        "rate": 35
      },
      {
        "description": "Replacement dual run capacitor",
        "quantity": 1,
        "rate": 65
      },
      {
        "description": "After-hours emergency trip charge",
        "quantity": 1,
        "rate": 150
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes. The diagnostic fee covers your time, fuel, and the truck roll to their door — charge it whether or not they approve the fix. Put it on the invoice as a separate line and apply it as a credit toward the repair if they say yes, which makes the fee feel fair and closes more jobs.",
        "question": "Should I charge a diagnostic fee if the customer doesn't go ahead with the repair?"
      },
      {
        "answer": "Itemize refrigerant per pound at your actual cost-plus markup, separate from labor, and note the total pounds pulled from the system. Homeowners argue less when they see the math instead of a flat 'freon charge' line they can't parse. Mark warranty parts as $0 so they see the cost you covered.",
        "question": "How do I price refrigerant recharges without an argument?"
      },
      {
        "answer": "In most regulated states — Texas, California, Florida, and others — yes, your contractor license number must appear on the invoice or it may not be legally collectable. Add your EPA Section 608 certification number too, since customers need it to register equipment warranties.",
        "question": "Do I need my license number on every invoice?"
      },
      {
        "answer": "Bill residential jobs Net 15 and ask for half the estimate on any install over $2,000 to cover equipment. Commercial property managers run Net 30 and often Net 45, so price your labor to carry that float. Always state a 1.5% monthly late fee on the invoice so it's enforceable.",
        "question": "What payment terms work for residential vs. commercial HVAC?"
      },
      {
        "answer": "Invoice the full annual agreement fee upfront as one line, then list the included tune-ups as $0 visits on each service call so the customer sees value delivered. This smooths your summer cash-flow crunch and locks in fall tune-ups before competitors cold-call your customers.",
        "question": "How should I invoice a seasonal maintenance agreement?"
      }
    ],
    "h1": "Free HVAC Technician Invoice Template — No Signup",
    "industryTips": "On every HVAC invoice, list your contractor license number and EPA Section 608 certification — many states (Texas, California, Florida) require the license number on the invoice or it's not legally collectable, and customers need it for warranty registration on equipment like a new condenser. Itemize refrigerant separately from labor: a 25-pound R-410A recharge at your per-pound rate reads honest and stops the 'why is it $600 for freon?' argument. Mark parts as 'warranty — no charge' with a $0 line so the homeowner sees the dealer cost you absorbed, which builds trust for the next service call. For seasonal maintenance agreements, invoice the flat annual fee upfront and note the included tune-ups, rather than billing each visit — it smooths your summer cash-flow crunch. Always quote after-hours and weekend rates as a multiplier (1.5x or 2x) on a separate line; burying it in labor confuses homeowners and invites chargebacks. Charge a diagnostic fee even if the customer declines repair — it covers the truck roll and your hour on site. Add a line for permit and inspection when you install a new system; passing that cost through itemized keeps your margin intact and gives the building department paperwork. Set payment terms to Net 15 for residential and Net 30 for commercial property managers, and add a 1.5% monthly late fee — state it on the invoice so it's enforceable. Photograph the data plate before and after every install; it backs up your invoice if a compressor fails under warranty and the manufacturer wants proof of the recharge.",
    "introParagraph": "Scheduling a furnace swap in the morning and an AC tune-up that afternoon means paperwork gets squeezed into the truck cab at 9 p.m. You're juggling a diagnostic fee, parts from the supply house, labor to swap a blower motor, and the moment a homeowner asks why the quote doubled after you pulled a frozen coil. Generic invoices make that worse — no line for emergency after-hours rates or warranty parts. Billify gives you a template built for HVAC work: service calls, refrigerant by the pound, seasonal maintenance agreements, with tax and late fees figured in. No signup. Data stays in your browser.",
    "metaDescription": "Free HVAC Technician invoice template — no signup. Bill service calls, repairs, and seasonal installations with tax and late fees. Data stays in your browser.",
    "name": "HVAC Technician",
    "pluralName": "HVAC Technicians",
    "relatedSlugs": [
      "plumber",
      "electrician",
      "handyman"
    ],
    "slug": "hvac",
    "whatToInclude": [
      "Diagnostic / service call fee",
      "Labor hours (regular and after-hours rate)",
      "Refrigerant recharge (R-410A per pound)",
      "Replacement parts (compressor, capacitor, blower motor)",
      "Seasonal maintenance agreement",
      "Permit and inspection fees",
      "Warranty parts tracking",
      "Emergency trip charge"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Diagnostic / OBD-II scan fee",
        "quantity": 1,
        "rate": 95
      },
      {
        "description": "Labor — brake pad replacement (flat-rate hrs)",
        "quantity": 1.5,
        "rate": 120
      },
      {
        "description": "OEM brake pad set (front)",
        "quantity": 1,
        "rate": 110
      },
      {
        "description": "Core charge — alternator (refundable on return)",
        "quantity": 1,
        "rate": 40
      },
      {
        "description": "Shop supplies & hazmat disposal",
        "quantity": 1,
        "rate": 18
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes, apply the diagnostic or scan fee as a credit toward the approved repair — it's standard shop practice and makes the fee feel fair. If the customer declines the fix, the diagnostic fee still covers your tech's time and the bay. State this policy on your estimate and invoice so there's no argument at pickup.",
        "question": "Should the diagnostic fee come off the final repair bill?"
      },
      {
        "answer": "List shop supplies as a small percentage of labor (8-10%) for rags, brake clean, and used-oil disposal, and core charges as a refundable line on alternators, batteries, and calipers. Showing them separately — instead of hiding them in parts — keeps your margin clean and avoids the 'what's this fee?' fight at the counter.",
        "question": "How do I explain shop supplies and core charges to a customer?"
      },
      {
        "answer": "Always get a signed authorization before any work over your estimate threshold, and keep a card on file. Without it you can't legally hold the car for non-payment in most states, even under a mechanic's lien. The signature also protects you if the customer claims they never approved OEM versus aftermarket parts.",
        "question": "Do I need the customer to sign a repair authorization?"
      },
      {
        "answer": "Retail and residential customers pay due-on-pickup or Net 15 — never release the keys unpaid without a card on file. Commercial fleet accounts can run Net 30, but price your labor to carry that float. Add a storage fee for vehicles left past 72 hours after you notify the customer.",
        "question": "What payment terms should a shop use?"
      },
      {
        "answer": "Mark warranty parts as a $0 line with a note like 'warranty — no charge' so the customer sees what you absorbed. Document the OEM-versus-aftermarket choice on the original invoice; if a part fails under warranty, that paper trail backs you up with the parts supplier and the customer.",
        "question": "How do I handle warranty and come-back parts on the invoice?"
      }
    ],
    "h1": "Free Mechanic Invoice Template — No Signup",
    "industryTips": "Put your shop's labor rate and the flat-rate hour estimate on every invoice — customers accept a $120/hr charge for 1.2 flat-rate hours far faster than a vague 'labor: $144,' because they can see the math. Apply the diagnostic or scan fee as a credit toward the repair when the customer approves it; that's standard shop practice and stops the 'I paid you to tell me what's wrong' complaint. Always list core charges on alternators, batteries, brake calipers, and some sensors as a separate line, and note that the core is refunded on return — it keeps the parts house happy and your margin clean. Add a shop-supplies or hazmat line (typically 8-10% of labor) to cover rags, brake clean, and used-oil disposal; burying it in parts hides the cost from the customer and from you when margins shrink. Mark warranty and goodwill parts as $0 with a note so the customer sees what you covered — it pays off in repeat business. Quote OEM vs. aftermarket on the estimate and on the invoice; a $60 aftermarket pad set versus a $120 OEM set is a real choice the customer should sign off on, and documenting it prevents comebacks. For tires, list mount, balance, valve stem, and disposal as separate lines, not a bundled 'tire install,' because each has a cost and a warranty implication. Set residential and retail terms to Net 15 or due-on-pickup — never let a car leave the lot unpaid without a signed repair authorization and a card on file. Add a storage fee line for vehicles left past 72 hours after notification, and state your lien rights under your state's mechanic's lien statute so a non-paying customer can't tie up your bay.",
    "introParagraph": "You finish a brake job, wipe the grease off, and now you're writing up a ticket at the parts counter while the next car idles on the lift. The customer wants to know why a $40 pad set costs $180, what the 'shop supplies' line is, and whether the diagnostic fee comes off the final bill. Generic invoices don't have lines for flat-rate labor times, core charges on alternators, or hazmat disposal — so you end up handwriting addenda. Billify is built for shop work: itemized labor by flat-rate hours, parts with markup, core charges, and shop supplies, with tax figured in. No signup. Data stays in your browser.",
    "metaDescription": "Free Mechanic invoice template — no signup. Bill labor, parts, diagnostics, and shop supplies with tax and late fees figured in. Data stays in your browser.",
    "name": "Mechanic",
    "pluralName": "Mechanics",
    "relatedSlugs": [
      "handyman",
      "hvac",
      "electrician"
    ],
    "slug": "mechanic",
    "whatToInclude": [
      "Flat-rate labor hours (per operation)",
      "Diagnostic fee / scan time",
      "OEM and aftermarket parts with markup",
      "Core charges (alternators, batteries, calipers)",
      "Shop supplies / hazmat disposal fee",
      "Tire mount and balance",
      "Fluids (oil, coolant, brake fluid)",
      "Warranty parts ($0 with note)"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Individual psychotherapy — CPT 90834 (45 min)",
        "quantity": 1,
        "rate": 150
      },
      {
        "description": "Late-cancel fee (under 24 hrs notice)",
        "quantity": 1,
        "rate": 150
      },
      {
        "description": "Couples session — CPT 90847 (50 min)",
        "quantity": 1,
        "rate": 200
      },
      {
        "description": "Sliding-scale adjustment (credit)",
        "quantity": 1,
        "rate": -40
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "No. Psychotherapy is a medical service and isn't subject to sales tax in any U.S. state, so set tax to 0 on your invoices. Adding a tax line to a superbill only confuses the insurance claims department and can delay reimbursement. If your invoicing tool defaults tax on, override it.",
        "question": "Do I charge sales tax on therapy sessions?"
      },
      {
        "answer": "Your NPI, the client's name and date of birth, service date, CPT code (e.g., 90834 for 45 minutes), ICD-10 diagnosis code, and place-of-service code. Insurers reject submissions missing any of these. Generate the superbill each session, not monthly — clients who batch them tend to lose reimbursement windows.",
        "question": "What has to be on a superbill for out-of-network reimbursement?"
      },
      {
        "answer": "State your 24- or 48-hour cancel policy in your intake paperwork so the client agreed before the missed session, then bill the full session fee as a line item when they no-show. Insurance won't cover a no-show, so the client is responsible. Don't reduce it to a smaller 'cancel fee' — charge the full session rate.",
        "question": "How do I handle late-cancel and no-show fees?"
      },
      {
        "answer": "No. A superbill carries diagnosis codes, dates, and CPT codes — not clinical content. Putting therapy notes on an invoice blurs a billing document with a medical record and can breach HIPAA if the client shares it with an insurer. Keep clinical notes in your EHR, separate from billing.",
        "question": "Can I put session notes on the invoice?"
      },
      {
        "answer": "List your full fee first, then a 'sliding-scale adjustment' line as a negative amount, so the client sees both your real rate and the discount you offered. That transparency protects you if they submit the superbill to insurance and the insurer questions the reduced amount.",
        "question": "How should I show a sliding-scale discount?"
      }
    ],
    "h1": "Free Therapist Invoice Template — No Signup",
    "industryTips": "On every superbill, list your NPI, the client's name and date of birth, the service date, the CPT code (90834 for 45-minute individual, 90837 for 60-minute), the ICD-10 diagnosis code, and place-of-service code (11 for office) — insurers reject submissions missing any of these. Use the diagnosis code your treatment plan supports, and never add a diagnosis the client doesn't have just to improve reimbursement odds; that's fraud and it puts your license at risk. Set tax to 0 — psychotherapy is not subject to sales tax in any U.S. state, and a tax line on a superbill only confuses the claims department. Spell out your late-cancel policy (typically 24 or 48 hours) in your intake paperwork and repeat the fee as a line item when you charge it, so the client agreed to it before the missed session. Bill the full session fee for a late cancel, not a reduced 'cancel fee,' because insurance won't cover a no-show and the client is responsible. For out-of-network clients, generate the superbill at the end of each session, not monthly — clients who batch superbills lose them and lose reimbursement. If you offer a sliding scale, show the full fee, then a 'sliding-scale adjustment' line as a negative amount, so the client sees both your real rate and the discount you gave. Keep superbills on file for at least seven years to match medical-record retention. Never put clinical notes on an invoice — superbills carry diagnosis codes, not session content, and mixing them breaches HIPAA.",
    "introParagraph": "You see clients back-to-back, jot a note between sessions, and the last thing you want at 7 p.m. is rebuilding a superbill in a word processor. Out-of-network clients need a clean document with CPT codes, an ICD-10 diagnosis code, your NPI, and the place-of-service code to file with their insurer — and they need it formatted the way claims departments expect. Generic invoices don't have a CPT 90834 line or a field for the late-cancel policy you set in your intake paperwork. Billify handles private-practice billing: sessions by CPT code, late-cancel and no-show fees, and superbills with tax set to 0 since therapy isn't taxable. No signup. Data stays in your browser.",
    "metaDescription": "Free Therapist invoice template — no signup. Bill sessions, late-cancel fees, and superbills. Tax set to 0 in private practice. Data stays in your browser.",
    "name": "Therapist",
    "pluralName": "Therapists",
    "relatedSlugs": [
      "coach",
      "tutor",
      "massage-therapist"
    ],
    "slug": "therapist",
    "whatToInclude": [
      "CPT code & session length (90834, 90837, etc.)",
      "ICD-10 diagnosis code",
      "NPI number",
      "Place-of-service code",
      "Late-cancel / no-show fee",
      "Sliding-scale adjustment",
      "Couples / family session add-on",
      "Superbill / statement for out-of-network"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Monthly retainer — IG + TikTok, 12 posts, 4 reels",
        "quantity": 1,
        "rate": 2500
      },
      {
        "description": "Ad management & campaign setup fee",
        "quantity": 1,
        "rate": 450
      },
      {
        "description": "Paid ad spend pass-through (Meta) — at cost",
        "quantity": 1,
        "rate": 1200
      },
      {
        "description": "Extra content package — 8 carousel graphics",
        "quantity": 1,
        "rate": 600
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes, but as a separate pass-through line at cost with zero markup, alongside your ad-management fee. Never bundle ad spend into your fee — if Meta suspends the account and the spend reverses, a bundled invoice makes the refund a mess. The split also lets the client's accountant deduct ad spend correctly.",
        "question": "Should ad spend be on the same invoice as my management fee?"
      },
      {
        "answer": "Bill retainers due-on-receipt at the start of the month, not in arrears. Billing in arrears means you've done 30 days of work before you see a cent — the number-one cash-flow killer for social freelancers. State the due date on every invoice and add a 1.5% monthly late fee so it's enforceable.",
        "question": "Do I bill a monthly retainer in advance or in arrears?"
      },
      {
        "answer": "Put the exact scope and platforms in the retainer line description — 'monthly retainer, Instagram and TikTok, 12 posts, 4 reels.' When the client asks for LinkedIn too, it's clearly outside the agreement and billable as an add-on line. Tracking community-management hours separately also gives you data to justify a retainer increase at renewal.",
        "question": "How do I stop scope creep on a retainer?"
      },
      {
        "answer": "Bill the creator's fee as a pass-through line with their handle, and your coordination or management fee as a separate line. That way the client can see exactly what the creator charged and what you charged, and they can't dispute your markup on the creator's rate. Attach the creator's invoice as backup.",
        "question": "How should I bill influencer campaigns?"
      },
      {
        "answer": "In most U.S. states, social media management services are not subject to sales tax, but ad spend passed through may be taxed differently depending on the platform and state. Set tax to 0 on your service lines and check your state's rules on digital advertising. When in doubt, keep ad spend as a non-taxed reimbursement line.",
        "question": "Do I charge sales tax on freelance social media services?"
      }
    ],
    "h1": "Free Social Media Manager Invoice Template — No Signup",
    "industryTips": "Split your invoice into three buckets — retainer, content/deliverables, and pass-through ad spend — so the client can see what you earned versus what you spent on their behalf. Never bundle ad spend into your fee; if Meta or Google suspends the account and the spend reverses, a bundled invoice makes the refund a mess. Bill ad spend at cost with a zero-markup note and the campaign name, then bill ad management as a separate line — clients and their accountants need the distinction for tax deductions. Put the scope and platforms in the retainer line description ('monthly retainer — Instagram, TikTok, 12 posts, 4 reels') so a scope-creep request ('can you also do LinkedIn?') is clearly outside the agreement and billable as an add-on. For one-off content packages, list each deliverable with its quantity and rate so the client sees you billed 8 graphics, not 'content services.' Set retainers to due-on-receipt at the start of the month, not in arrears — billing in arrears is the number-one cash-flow killer for social freelancers, because you've already done 30 days of work. Add a 1.5% monthly late fee and state your payment terms on every invoice; clients who pay net-30 on a retainer are effectively getting a free month of your time. Track hours on community management separately, even inside a retainer, so when the client asks 'how much DM time are we actually getting?' you have a number. For influencer campaigns, bill the creator fee as a pass-through with the creator's handle, and your coordination fee separately, so the client can't dispute your markup on the creator's rate.",
    "introParagraph": "You're juggling four client accounts, a content calendar in Notion, a Canva queue, and a Meta Ads dashboard — and invoicing is the task that slips to month-end. Half your income is a flat monthly retainer, the other half is one-off content packages and a separate ad-spend budget you pass through. Clients ask why the invoice doesn't match the ad-spend receipt, or why a 'strategy session' shows up unbilled. Generic invoice tools don't separate retainer work from ad spend or from hourly content creation. Billify is built for social freelancers: retainer lines, content deliverables, and a pass-through for ad spend, with tax and late fees. No signup. Data stays in your browser.",
    "metaDescription": "Free Social Media Manager invoice template — no signup. Bill retainers, content, and ad spend with tax and late fees built in. Data stays in your browser.",
    "name": "Social Media Manager",
    "pluralName": "Social Media Managers",
    "relatedSlugs": [
      "web-developer",
      "graphic-designer",
      "videographer"
    ],
    "slug": "social-media-manager",
    "whatToInclude": [
      "Monthly retainer (scope & platforms)",
      "Content deliverables (posts, reels, graphics)",
      "Community management hours",
      "Paid ad spend (pass-through, client-billed)",
      "Ad management / campaign setup fee",
      "Strategy session / content planning",
      "Influencer outreach / gifting coordination",
      "Analytics reporting"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Performance — 4 hr DJ set (base)",
        "quantity": 1,
        "rate": 1200
      },
      {
        "description": "Cocktail hour / ceremony add-on (1 hr)",
        "quantity": 1,
        "rate": 250
      },
      {
        "description": "Uplighting add-on (8 fixtures)",
        "quantity": 1,
        "rate": 350
      },
      {
        "description": "Overtime — past contracted end time (per hr)",
        "quantity": 1,
        "rate": 150
      },
      {
        "description": "Travel — per mile beyond 50 mi radius",
        "quantity": 60,
        "rate": 0.65
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Take a non-refundable deposit of 25-50% of the total to lock the date. A date held without a deposit is a date you'll lose to the first caller offering cash, and the deposit covers your lost marketing if the client cancels. Apply the deposit as a line on the final invoice so the balance owed is crystal clear.",
        "question": "How much deposit should I take to book a date?"
      },
      {
        "answer": "Put the contracted start and end time on the invoice and in your contract, then bill overtime as a separate hourly line at a rate you spell out upfront — say $150/hour. A wedding that runs an hour over isn't a freebie, and a clear overtime line stops the awkward 'can you just play one more song?' at 1 a.m.",
        "question": "How do I charge for overtime when the event runs late?"
      },
      {
        "answer": "Bill whoever signed the contract — usually the couple for private events, the planner or venue for corporate. For venue and corporate gigs, send the invoice with a W-9 attached the day of the event; their AP department runs Net 30, so the earlier it lands the earlier you're paid. Private events should pay the balance on the night.",
        "question": "Should I bill the venue or the couple for a wedding?"
      },
      {
        "answer": "Bill each add-on — uplighting, fog machine, extra speakers, a wireless mic for toasts — as a separate line with its own rate. Couples upgrade mid-planning, and an itemized invoice gives you a clean record of what they added and what to bring. Bundling gear into one 'package' fee hides the value and invites disputes.",
        "question": "How do I handle gear add-ons and upgrades?"
      },
      {
        "answer": "Private events and weddings: deposit on booking, balance due on or before the night of the event — never 'I'll send a check next week,' because chasing a couple post-honeymoon is a losing game. Corporate and venue gigs: Net 30, with a W-9 attached. Add a 1.5% monthly late fee to every invoice so it's enforceable.",
        "question": "What payment terms should a DJ use?"
      }
    ],
    "h1": "Free DJ Invoice Template — No Signup",
    "industryTips": "Take a non-refundable deposit of 25-50% to lock the date — a date held without a deposit is a date you'll lose to the first caller offering cash, and the deposit covers your lost marketing if they cancel. Put the contracted start and end time on the invoice, then bill overtime as a separate hourly line with the rate spelled out in your contract, so a wedding that runs an hour over isn't a freebie. Bill gear add-ons — uplighting, a fog machine, a second speaker, a wireless mic for toasts — as separate lines with their own rates, because couples upgrade mid-planning and you want a clean record of what they added. For corporate and venue gigs, send the invoice with a W-9 attached the day of the event; their AP department runs Net 30 and sometimes Net 45, so the earlier the invoice lands the earlier you're paid. Weddings and private parties should pay the balance on or before the night of — never 'I'll send a check next week,' because chasing a couple post-honeymoon is a losing game. Charge travel as a per-mile line beyond your included radius, and bill lodging for gigs over a certain drive. If you bring a second DJ or an assistant, list them as a line item so the client sees the value and you can pay your crew from the gross. Keep your invoices simple and itemized — venues and planners forward them to accounting, and a messy invoice gets paid last. Set payment terms to due-on-receipt for private events and Net 30 for corporate, and add a 1.5% monthly late fee on every invoice so it's enforceable.",
    "introParagraph": "You load in at 4 p.m., spin until midnight, tear down, and you're home at 2 a.m. counting cash and realizing nobody paid the balance. Most of your gigs are a deposit when you book and the rest on the night — but couples forget, coordinators pay from a different budget, and the venue's AP team wants a W-9 before cutting a check 30 days later. Generic invoices don't have a line for overtime past the contracted end time, gear add-ons like uplighting, or the assistant you brought for a 500-guest wedding. Billify is built for working DJs: deposit and balance lines, overtime, gear rentals, and travel, with tax and late fees. No signup. Data stays in your browser.",
    "metaDescription": "Free DJ invoice template — no signup. Bill gigs, deposits, gear, and overtime with tax and late fees built in. Made for event DJs. Data stays in your browser.",
    "name": "DJ",
    "pluralName": "DJs",
    "relatedSlugs": [
      "wedding-photographer",
      "videographer",
      "photographer"
    ],
    "slug": "dj",
    "whatToInclude": [
      "Performance fee (base rate, hours)",
      "Deposit / retainer (booking)",
      "Overtime (past contracted end time)",
      "Gear add-ons (uplighting, fog machine, extra speakers)",
      "Sound / lighting rental",
      "Travel & load-in fee",
      "Assistant / second DJ",
      "Cocktail hour / ceremony add-on"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Coaching session (50 min)",
        "quantity": 1,
        "rate": 150
      },
      {
        "description": "12-session coaching package",
        "quantity": 1,
        "rate": 1800
      },
      {
        "description": "Between-session email support (monthly)",
        "quantity": 1,
        "rate": 200
      },
      {
        "description": "DISC personality assessment",
        "quantity": 1,
        "rate": 75
      },
      {
        "description": "Late cancellation fee (under 24h notice)",
        "quantity": 1,
        "rate": 75
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Free discovery calls are a marketing cost, not a billable line. If you do charge, label it 'intake session' on the invoice and only after the client has signed on — billing a prospect for the call that sold them usually kills the deal. Some coaches fold a paid intake into the package price and note it as 'included' on the first invoice.",
        "question": "Should I charge for the discovery call?"
      },
      {
        "answer": "Bill the full package amount up front with the package name and total session count on the invoice, then track sessions used and remaining on each subsequent invoice. If you split it into milestones, label each installment (e.g. 'Installment 2 of 3 — month-one review') so the client knows exactly which payment this is. Prepaid bundles that show sessions-to-date prevent nearly every billing dispute.",
        "question": "How do I invoice a prepaid coaching package?"
      },
      {
        "answer": "Yes, if your 24-hour cancellation policy is in your signed engagement letter. Add it as a dated line item on the next invoice with the original session time, and reference the policy clause. Without the policy in writing first, a no-show charge reads as a surprise fee and clients push back.",
        "question": "Can I charge a late-cancellation fee if a client no-shows?"
      },
      {
        "answer": "In most states, coaching is a service and not subject to sales tax, but a handful treat life coaching and career coaching differently from business consulting. Check your state's rules, and if you sell tangible products like workbooks or assessment kits, those are usually taxable even when the coaching isn't.",
        "question": "Do I charge sales tax on coaching sessions?"
      },
      {
        "answer": "For multi-month packages, take the full package or a 50% deposit up front and bill the balance at an agreed milestone, not net 30 after completion. Per-session clients do fine with due-on-receipt invoices sent the same day as the session. Coaching clients pay slowest when the invoice arrives weeks after the work.",
        "question": "What payment terms should I set for long-term coaching clients?"
      }
    ],
    "h1": "Free Coach Invoice Template — No Signup",
    "industryTips": "If you bill packages instead of single sessions, your invoice should reference the package name and how many sessions it covers — clients hate seeing a charge with no context three months in. For multi-month engagements, invoice the full package up front or split it into agreed milestones (e.g. 50% on signing, 25% at the month-one review, 25% at month two) and label each installment clearly so the client never wonders which payment this is. Prepaid bundles should note total sessions purchased, sessions used to date, and sessions remaining — this single line prevents most billing emails. Charge for no-shows and late cancellations explicitly: state your 24-hour cancellation policy in your engagement letter, then add it as a dated line item when it happens. Coaches are usually sole proprietors, so sales tax generally doesn't apply to coaching services in most states, but confirm your jurisdiction — a few tax coaching differently than consulting. Send invoices right after each session or milestone rather than in monthly batches; coaching clients pay faster when the invoice arrives while the session is still fresh. Always include your business name (or your own, if unincorporated), the client's name, session dates, and a unique invoice number — repeat coaching clients accumulate dozens of invoices, and clean numbering saves you at tax time.",
    "introParagraph": "Most coaches don't bill by the hour — you sell packages, three-month engagements, and prepaid session bundles. That makes invoicing awkward: a single PDF line for 'coaching' doesn't match what the client actually bought, and retainer clients get confused when an invoice arrives mid-package with no session breakdown. You also juggle discovery calls that are free, sessions that got rescheduled, and the occasional no-show you still chose to charge for. Billify lets you itemize each of those clearly on one invoice, with package names and session counts, so clients see exactly what they're paying for — no account required, and the numbers never leave your browser.",
    "metaDescription": "Free coach invoice template for life, career, and business coaches. Bill clients for sessions and packages with no signup and no data leaving your browser.",
    "name": "Coach",
    "pluralName": "Coaches",
    "relatedSlugs": [
      "therapist",
      "personal-trainer",
      "consultant"
    ],
    "slug": "coach",
    "whatToInclude": [
      "Coaching session (50 minutes)",
      "Discovery / intake call",
      "3-month coaching package",
      "Prepaid session bundle (sessions remaining)",
      "Between-session email support",
      "Assessment or profile (DISC, Enneagram)",
      "Late-cancellation / no-show fee"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Crew labor (2 workers x 6 hrs)",
        "quantity": 12,
        "rate": 45
      },
      {
        "description": "Mulch (3 cu yd, delivered)",
        "quantity": 3,
        "rate": 65
      },
      {
        "description": "Mini-excavator rental (1 day)",
        "quantity": 1,
        "rate": 285
      },
      {
        "description": "Debris hauling and dump fee",
        "quantity": 1,
        "rate": 95
      },
      {
        "description": "Patio paver installation (per sq ft)",
        "quantity": 120,
        "rate": 18
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes for design-build and hardscaping jobs — a 30% to 50% deposit that covers your material costs (plants, pavers, soil) before you order is standard. It protects you from fronting thousands at the supplier and confirms the client is committed. For small recurring maintenance, no deposit is needed; just bill monthly.",
        "question": "Should I collect a deposit before starting a big landscaping job?"
      },
      {
        "answer": "List the materials at cost and add a separate materials-markup line for your sourcing and delivery time, or show materials-with-markup as one line — but never bury the markup inside labor. Clients compare your invoice to the garden center receipt, so the math needs to be visible. Wholesale invoices on file help if they question it.",
        "question": "How do I handle materials I buy and resell to the client?"
      },
      {
        "answer": "Bill a flat monthly retainer on the first of the month, not per-visit invoices that pile up. Monthly retainer invoicing means one predictable charge the client can auto-pay, and you stop chasing twelve small invoices a year. Put the visits covered that month in the description.",
        "question": "What payment terms work for recurring lawn-care clients?"
      },
      {
        "answer": "In most states, hardscaping, irrigation, and anything involving grading or structures requires a landscaping contractor license — and that license number belongs on the invoice. Basic mowing and trimming often don't, but if you're licensed anyway, print it; it signals a real business and speeds payment.",
        "question": "Do I need my contractor license number on the invoice?"
      },
      {
        "answer": "Keep the original quoted line items but note the weather delay on the invoice date line or in a notes section so the client sees why a Tuesday job finished Friday. Don't add a surcharge for weather unless you had equipment sitting idle on rental — then itemize the extra day as 'weather delay — equipment standby.'",
        "question": "How do I bill when weather delays the job?"
      }
    ],
    "h1": "Free Landscaper Invoice Template — No Signup",
    "industryTips": "If you mark up materials — and you should, to cover the time spent sourcing, picking up, and returning plants — list the materials and the markup separately or as a single materials-with-markup line, but never bury it inside labor; clients compare your invoice to the garden center receipt and want to see the math. For design-build jobs, quote a fixed estimate and then invoice in draws tied to milestones (demolition, rough grade, planting, final cleanup) so the client isn't hit with one big bill at the end and you aren't fronting thousands in plant costs. Recurring maintenance clients do best with a flat monthly retainer invoiced on the first of the month rather than per-visit invoices that pile up. Always include your license or contractor registration number where your state requires one — many states require a landscaping contractor license for hardscaping and irrigation but not for basic mowing, so know your threshold. Add the dump-fee and equipment-rental lines even when you didn't quote them separately; clients forget these were in the estimate. Note weather delays on the invoice date line so the client understands why a Tuesday job finished Friday. Set payment terms of net 15 for residential clients — 30 days is too long when materials were already paid out of pocket.",
    "introParagraph": "Landscaping invoices get messy fast — you've got labor hours for a crew of three, plants and mulch bought at wholesale then marked up, equipment rental for the stump grinder you only needed that one day, and a maintenance client on a recurring weekly schedule who expects the same clean line items every visit. A single 'landscape work' line doesn't cut it when a client is reviewing a $4,000 design-build bill, and forgetting to list the permit or the sod delivery gets you a phone call instead of a check. Billify lets you break each job into labor, materials, equipment, and fees so the bill matches the estimate you quoted — all in your browser, no signup.",
    "metaDescription": "Free landscaper invoice template for lawn care, design, and hardscaping crews. Itemize labor, plants, materials, and equipment rental with no signup required.",
    "name": "Landscaper",
    "pluralName": "Landscapers",
    "relatedSlugs": [
      "handyman",
      "painter",
      "cleaner"
    ],
    "slug": "landscaper",
    "whatToInclude": [
      "Labor hours (crew, by person)",
      "Materials — plants, mulch, sod, soil",
      "Materials markup",
      "Equipment rental (stump grinder, mini-excavator)",
      "Design / consultation fee",
      "Hardscaping installation (patio, retaining wall)",
      "Debris hauling and dump fees",
      "Permit fees"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Architectural shingles (per square)",
        "quantity": 18,
        "rate": 110
      },
      {
        "description": "Synthetic underlayment (roll)",
        "quantity": 4,
        "rate": 95
      },
      {
        "description": "Ice and water shield (roll)",
        "quantity": 2,
        "rate": 85
      },
      {
        "description": "Tear-off and dump fee (per square)",
        "quantity": 18,
        "rate": 35
      },
      {
        "description": "Labor — roof replacement (per square)",
        "quantity": 18,
        "rate": 150
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes — for a full replacement, take a deposit that covers your shingles, underlayment, and flashing before you place the supply order, then bill the balance on final inspection. This two-draw structure is standard in roofing and keeps you from fronting thousands at the supply house on a job that could still fall through.",
        "question": "Should I collect a deposit before ordering roofing materials?"
      },
      {
        "answer": "Mirror the adjuster's line items exactly — same units, same descriptions — and attach your invoice to the adjuster's estimate so the homeowner can forward it to claims. Mismatched units are the top reason storm invoices get held up. Add your license number and a dated completion photo; adjusters pay faster when paperwork is clean and complete.",
        "question": "How do I invoice a job that's going through insurance?"
      },
      {
        "answer": "List shingles by the square (one square = 100 sq ft) and show bundles by count underneath if the client wants the detail. Clients and adjusters both speak in squares, and a line that says '18 squares architectural shingles' matches the estimate and the claim far better than 'a bunch of shingles.'",
        "question": "What's the right way to bill shingles — by the bundle or the square?"
      },
      {
        "answer": "Yes, and split it into two lines: the manufacturer's material warranty (e.g. 30-year limited) and your own workmanship warranty (e.g. 5 years against leaks at flashing). They are two different promises made by two different parties, and stating both on the invoice protects you later if only the manufacturer's coverage is in play.",
        "question": "Do I include my warranty on the invoice?"
      },
      {
        "answer": "Net 14 for residential replacements and net 30 for commercial or property-management clients. Residential homeowners tend to pay the balance the week after final inspection, so net 14 keeps you from chasing it into a second month. For storm jobs, expect the insurance check to set the timeline — bill net 15 from when the homeowner receives the depreciated payment.",
        "question": "What payment terms do roofers typically use?"
      }
    ],
    "h1": "Free Roofer Invoice Template — No Signup",
    "industryTips": "On insurance jobs, mirror the adjuster's line items exactly — same quantity units, same line descriptions — and attach your invoice to the adjuster's estimate so the homeowner can hand it straight to the claims department; mismatched units are the number-one reason roofing invoices get delayed. For full replacements, bill in draws: a deposit for materials (shingles, underlayment, flashing) that you order before tear-off, then the balance on final inspection — this is standard and protects you from fronting thousands at the supply house. Always list shingles by the square (one square = 100 sq ft) and bundles by count; clients and adjusters speak in squares, not in 'a bunch of shingles.' Include the tear-off, dump, and disposal fees as separate lines, not buried in labor, because insurance reimburses these specifically. Note your roofing license or contractor number on every invoice — most states require one, and a missing license number on a storm-chasing invoice is a red flag for homeowners. Add the warranty line: state the manufacturer's material warranty years and your own workmanship warranty separately, because they're two different promises. Set net 14 for residential replacements and net 30 for commercial or property-management clients. Photograph the finished roof and send it with the invoice — adjusters often pay faster when a dated photo of completed work accompanies the claim paperwork.",
    "introParagraph": "Roofing invoices live or die on whether they match the insurance adjuster's paperwork. After a storm job you're billing against a claim, and if your line items don't mirror the adjuster's estimate — shingles by the square, underlayment by the roll, ice and water shield, drip edge, flashing, ridge vent, tear-off and dump fees — the homeowner gets stuck waiting on the insurance check. Then there are the small repair calls where you drove out for a $400 leak fix and still need to bill travel, labor, and the bundle of shingles off the truck. Billify itemizes every bundle, square, and trip charge so the bill is claim-ready — no signup, data stays in your browser.",
    "metaDescription": "Free roofer invoice template for repairs, replacements, and storm work. Line-item shingles, underlayment, flashing, labor, and dump fees with no signup.",
    "name": "Roofer",
    "pluralName": "Roofers",
    "relatedSlugs": [
      "hvac",
      "painter",
      "handyman"
    ],
    "slug": "roofer",
    "whatToInclude": [
      "Tear-off and disposal (per square)",
      "Shingles (by the square / bundle)",
      "Underlayment (synthetic / felt, by roll)",
      "Ice and water shield",
      "Drip edge and flashing metal",
      "Ridge vent / roof ventilation",
      "Labor (per square or hourly)",
      "Trip charge / service call fee"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Wedding day coverage (8 hours)",
        "quantity": 1,
        "rate": 2800
      },
      {
        "description": "Engagement session (2 hours)",
        "quantity": 1,
        "rate": 450
      },
      {
        "description": "Second shooter",
        "quantity": 1,
        "rate": 400
      },
      {
        "description": "Premium leather album (40 pages)",
        "quantity": 1,
        "rate": 650
      },
      {
        "description": "Retainer (non-refundable, secures date)",
        "quantity": 1,
        "rate": 500
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Call it a non-refundable retainer. In many states a 'deposit' is legally refundable for services you haven't performed yet, while a retainer compensates you for holding the date and turning away other couples. The wording matters the day someone cancels six weeks before the wedding and asks for their money back.",
        "question": "Should I call the upfront payment a deposit or a retainer?"
      },
      {
        "answer": "Two weeks before the wedding, not the day of. Once the wedding week arrives, couples stop checking email and you'll be chasing the balance while you're already editing their gallery. A pre-wedding due date also lets you confirm payment before you're on site with a camera in your hand.",
        "question": "When should the final balance be due?"
      },
      {
        "answer": "Put the overtime rate per hour on the invoice itself, not only in the contract, so the rate is agreed before the toast runs 40 minutes over. Log the actual overage time on the final invoice as a line item, and reference the contracted coverage hours so the couple sees exactly where the extra hour came from.",
        "question": "How do I charge for overtime on the wedding day?"
      },
      {
        "answer": "In most states, yes — the physical album and prints are taxable goods even when the photography service is not. Split the invoice so the service portion and the product portion are separate line items, and collect sales tax only on the goods. Check your state's rules, since a few now tax digital downloads too.",
        "question": "Do I charge sales tax on the album and prints?"
      },
      {
        "answer": "If your contract defines it as a non-refundable retainer that secures the date, you keep it — that's the point of the wording. If you've already incurred costs (a second shooter you can't rebook, a booked venue visit), invoice those separately and document them. Refunding a retainer you specifically called non-refundable sets a precedent that undermines every future booking.",
        "question": "What happens to the retainer if the couple cancels?"
      }
    ],
    "h1": "Free Wedding Photographer Invoice Template — No Signup",
    "industryTips": "Always call the upfront payment a non-refundable retainer, not a deposit — in many states a 'deposit' is legally refundable for unperformed services, while a retainer secures the date and the business you turned away, and the distinction matters when a couple cancels six weeks out. Invoice the retainer the day they sign, with the balance due two weeks before the wedding, not the day of; once the wedding week hits, couples stop checking email and you'll be chasing payment while editing someone else's gallery. Break the package into its real components — coverage hours, second shooter, engagement session, album, print credit — even if you sell it as one price, so couples see the value and so upgrades have a home. Put the overtime rate per hour on the invoice itself, not buried in the contract, because weddings run late and you want the rate agreed before the toast runs 40 minutes over. Bill travel as mileage at the IRS rate plus lodging when you're driving more than a couple hours; itemize these so the couple isn't surprised. Keep your sales tax straight: many states tax the physical album and prints but not the photography service, so split taxable goods from services on the invoice. Number invoices by couple or date so you can find the balance for a wedding you shot last August.",
    "introParagraph": "Wedding photographers almost always bill in a deposit-then-balance structure, and the balance is due before the wedding, not after — couples book a year out and the final payment routinely gets forgotten in the chaos of the week. Your invoices need to tie to a signed contract and a retainer, itemize the package (coverage hours, second shooter, engagement session, album, print credit), and clearly state what's due when. Travel, assistant fees, and overtime beyond the contracted hours are the line items that cause the most disputes, because they weren't in the original package. Billify keeps every shoot's deposits and balances on a clean, contract-ready invoice the couple can't misread — no signup, nothing leaves your browser.",
    "metaDescription": "Free wedding photographer invoice template for couples. Bill packages, second shooters, albums, and travel with deposits and balance due — no signup required.",
    "name": "Wedding Photographer",
    "pluralName": "Wedding Photographers",
    "relatedSlugs": [
      "photographer",
      "videographer",
      "dj"
    ],
    "slug": "wedding-photographer",
    "whatToInclude": [
      "Wedding day coverage (hours)",
      "Engagement session",
      "Second shooter / assistant fee",
      "Wedding album (pages and size)",
      "Print credit or print package",
      "Travel and lodging",
      "Overtime (beyond contracted hours)",
      "Retainer (non-refundable)"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Commercial VO session (30-sec spot)",
        "quantity": 1,
        "rate": 350
      },
      {
        "description": "Broadcast usage — regional, 13 weeks",
        "quantity": 1,
        "rate": 500
      },
      {
        "description": "E-learning module (per finished minute)",
        "quantity": 22,
        "rate": 45
      },
      {
        "description": "Pickups — script change (session)",
        "quantity": 1,
        "rate": 250
      },
      {
        "description": "Rush turnaround fee (same-day)",
        "quantity": 1,
        "rate": 200
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Per cycle for broadcast — a 13-week regional run is standard, and you invoice the renewal as a new invoice when the client wants another cycle. For internet and in-store, you'll often quote a 1-year or in-perpetuity flat fee. Always state media, market, and term on the invoice line itself so the client and their producer can't later claim the usage was broader.",
        "question": "How do I bill usage rights — flat fee or per cycle?"
      },
      {
        "answer": "The first round of reasonable pickups is usually included; after that, charge at your full session rate and label it 'script change — new session' on the invoice. If the client rewrote the copy after delivery, that's a new session, not a revision, and your invoice should reflect it so they don't expect free re-records every time the script changes.",
        "question": "When do I charge for pickups and revisions?"
      },
      {
        "answer": "Per finished hour is the industry standard, with ACX setting a floor rate. Royalty-share deals still need an invoice for any per-hour fee you negotiated plus a separate line documenting the royalty split. Note the finished hours delivered, not your hours in the booth — clients pay for what they receive, not how long it took you.",
        "question": "How should I price an audiobook — per finished hour or royalty share?"
      },
      {
        "answer": "Typically 1.5x to 2x your session rate, labeled clearly as 'rush — same-day turnaround' or 'weekend session' on the invoice. Stating it on the invoice (not just in an email) prevents clients from treating the rush rate as your new normal rate for future work.",
        "question": "What's the rush fee for weekend or same-day work?"
      },
      {
        "answer": "Usually no — voice-over is a service and not taxable in most states, same as the session itself. If you deliver a physical product like a burned CD or a branded USB drive, that tangible good may be taxable, so split it from the session fee on the invoice. Check your jurisdiction, since a few states have started taxing digital downloads.",
        "question": "Do I charge sales tax on voice-over services?"
      }
    ],
    "h1": "Free Voice-Over Artist Invoice Template — No Signup",
    "industryTips": "Voice-over is one of the few trades where the invoice and the contract are almost the same document — your usage terms belong on the invoice, not just in the agreement, because clients and their producers often only look at the invoice months later when a spot goes into rotation. Specify the usage explicitly: media (broadcast TV, radio, internet, in-store), market (local, regional, national), and term (13 weeks, 1 year, in perpetuity) — a 13-week cycle is standard for broadcast and clients will renew, so bill the renewal as a new invoice rather than letting usage quietly continue. Charge pickups at full session rate after the included round; the first round of reasonable revisions is usually free, but script changes after delivery are a new session. For audiobooks, the per-finished-hour rate is industry standard (ACX sets a floor), and a royalty-share deal still needs an invoice for any per-hour fee plus the royalty split documented separately. Bill rush and weekend work at 1.5x to 2x and label it as such so clients don't expect it as the regular rate. E-learning is usually priced per finished minute, so note the finished minutes delivered, not the hours you sat in the booth. Keep your invoice numbers and project names consistent so a client paying three separate spots in one quarter can tie each invoice to the right campaign.",
    "introParagraph": "Voice-over work bills in three currencies: studio time, usage rights, and revisions. A radio spot is cheap to record but expensive to broadcast, so you price it with a usage fee tied to market and term; e-learning is priced per finished minute; an audiobook per finished hour, sometimes royalty-share. Disputes come from pickups the client insists were in the script, usage that ran past its term, and sessions that ran over with copy changes. Your invoice must spell out what was delivered, with what usage and for how long — otherwise the client will argue the bill matches only 'a recording.' Billify keeps usage terms and session time on one clean invoice — no signup, data stays in your browser.",
    "metaDescription": "Free voice-over invoice template for commercials, e-learning, and audiobooks. Bill session time, usage rights, pickups, and revisions with no signup required.",
    "name": "Voice-Over Artist",
    "pluralName": "Voice-Over Artists",
    "relatedSlugs": [
      "videographer",
      "writer",
      "dj"
    ],
    "slug": "voice-over-artist",
    "whatToInclude": [
      "Session time (studio, per hour or 15-min)",
      "Finished audio (per finished minute / hour)",
      "Usage rights (media, market, term)",
      "Pickups / revisions (beyond included round)",
      "Audiobook per-finished-hour rate",
      "ISDN / Source-Connect session fee",
      "File delivery / split tracks",
      "Rush / weekend turnaround fee"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "60-minute Swedish massage",
        "quantity": 1,
        "rate": 90
      },
      {
        "description": "Hot stone add-on",
        "quantity": 1,
        "rate": 25
      },
      {
        "description": "Aromatherapy upgrade",
        "quantity": 1,
        "rate": 15
      },
      {
        "description": "Outcall / travel fee (mileage)",
        "quantity": 1,
        "rate": 20
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "It depends on your state. Some states treat massage as a personal service and exempt it, others tax it like a salon service, and medically referred massage is often exempt even when wellness massage is not. Check your state's department of revenue before adding a tax line to your invoices.",
        "question": "Do I charge sales tax on massage sessions?"
      },
      {
        "answer": "Yes, a deposit or card-on-file is standard for first appointments. It lets you charge for no-shows and late cancellations under your stated policy. Put the policy and the deposit amount in your intake form so the client agrees before the first session.",
        "question": "Should I collect a deposit from new clients?"
      },
      {
        "answer": "Print your cancellation policy — usually 24 hours — on every invoice, then bill missed or late-cancelled sessions at 50% of the session rate as their own line. Having the policy on the invoice removes the argument when the charge shows up.",
        "question": "How do I handle no-shows and late cancellations on the invoice?"
      },
      {
        "answer": "Keep gratuity as its own line, never folded into the session rate. Tipped wages are taxed differently in many states, and a separate tip line makes your bookkeeping and the client's receipt equally clear.",
        "question": "Should gratuity be on the invoice or separate?"
      },
      {
        "answer": "Your massage therapy license number and your name as licensed. If you take HSA or FSA payments, add your NPI. Some states also require your business address and tax ID, so check local rules.",
        "question": "What license info belongs on my massage invoice?"
      }
    ],
    "h1": "Free Massage Therapist Invoice Template — No Signup",
    "industryTips": "Most states require your massage therapy license number on any invoice or receipt you hand a client. It is not optional, and it protects you if a dispute or insurance reimbursement ever comes up. List it beside your name and your NPI if you take HSA or FSA payments. If you sell prepaid packages, invoice each session as it is redeemed rather than billing the full package up front, so clients track what they have used and you avoid refund headaches. Keep gratuity as a separate line, never bundled into the session rate, because tipped wages are taxed differently in many states. If you do outcalls, charge a travel fee based on mileage and note your radius in the intake form. Always state your cancellation policy — most therapists use 24 hours — directly on the invoice so late cancellations and no-shows are billable at half the session rate without argument. Sales tax on massage varies wildly: some states treat it as a personal service and exempt it, others tax it like a salon service, and medical or chiropractic referrals are often exempt even when wellness massage is not. Check your state's rules before adding a tax line. Keep simple SOAP notes tied to each invoice number so a client can never claim a session never happened.",
    "introParagraph": "You see clients back-to-back, and the last thing you want after the last session ends is paperwork. A clear massage invoice keeps your books clean, your clients informed, and your license info on the record where it belongs. Whether you bill single sessions, six-session packages, or add-ons like hot stone and aromatherapy, each line should show what the client actually received. Tips, gift cards, and outcall travel fees need their own rows so your tax season is painless. This template is built for licensed massage therapists who want clean, professional invoices without monthly software fees.",
    "metaDescription": "Free massage therapist invoice template — no signup. Bill sessions, prepaid packages, and add-ons, track tips and outcall fees, and keep client records tidy.",
    "name": "Massage Therapist",
    "pluralName": "Massage Therapists",
    "relatedSlugs": [
      "therapist",
      "personal-trainer",
      "coach"
    ],
    "slug": "massage-therapist",
    "whatToInclude": [
      "60-minute Swedish massage",
      "90-minute deep tissue massage",
      "Hot stone add-on",
      "Aromatherapy upgrade",
      "Prenatal massage session",
      "6-session package (bulk rate)",
      "Outcall / travel fee",
      "Gratuity (separate line)"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "30-minute solo dog walk",
        "quantity": 5,
        "rate": 25
      },
      {
        "description": "Additional dog (same household)",
        "quantity": 5,
        "rate": 10
      },
      {
        "description": "Weekend / holiday surcharge",
        "quantity": 2,
        "rate": 15
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Weekly or biweekly is safer for you. Monthly lets a client rack up a full month of walks before paying for the last one, and that is how dog walkers get stiffed. Send the invoice the same day each week so paying becomes a habit.",
        "question": "Should I bill dog walking clients weekly or monthly?"
      },
      {
        "answer": "Most pet sitters add a 50 to 100 percent surcharge on Thanksgiving, Christmas, New Year's, and similar holidays. Put the surcharge on its own line so the client sees why the total is higher, and mention it in your welcome agreement so nobody is surprised.",
        "question": "How much should I charge for holiday walks?"
      },
      {
        "answer": "Set a cancellation window — same-day or under 24 hours is typical — and charge half or the full walk fee for it. Print the policy on the invoice so the charge is expected, and apply it consistently or clients stop taking it seriously.",
        "question": "What if a client cancels a walk at the last minute?"
      },
      {
        "answer": "In most U.S. states, pet care and dog walking are personal services and not subject to sales tax, but a few states tax pet boarding or grooming. Confirm with your state's department of revenue before deciding whether to add a tax line.",
        "question": "Do I need to charge sales tax on dog walking?"
      },
      {
        "answer": "Yes, add an incremental fee per extra dog rather than a second full walk. Most dog walkers charge around half the single-walk rate for each additional dog. List it as its own line so the client sees the household total clearly.",
        "question": "Should I charge extra for a second dog in the same household?"
      }
    ],
    "h1": "Free Dog Walker Invoice Template — No Signup",
    "industryTips": "Bill per walk, not per week, unless a client is on a flat monthly plan. Itemized visits are easier to defend if a customer disputes a charge or asks for a refund. Charge a holiday surcharge — most pet sitters add 50 to 100 percent on Thanksgiving, Christmas, and New Year's — and list it as its own line so the client sees exactly why their total is higher. If you walk multiple dogs from the same household, add an incremental fee per extra dog rather than a second full walk; that is standard and clients expect it. Keep a late-booking fee for same-day requests and a key-handling fee if you hold or pick up keys. Set payment terms to weekly or biweekly, not monthly: dog walkers get burned by clients who rack up walks, then cancel service owing hundreds. Send the invoice the same day each week so clients build a habit of paying it. If you offer overnight sitting, bill it as a flat nightly rate separate from walks, and note whether the overnight includes evening and morning walks or those are extra. Track which sitter covered each visit if you have staff, so payroll and client billing match up.",
    "introParagraph": "Dog walking is a volume business. You juggle a dozen clients, multiple dogs per household, and a rotating schedule of solo walks, group walks, and last-minute add-ons. When billing gets messy, you lose track of who owes what and which visits actually happened. A clean invoice lets you bill by the walk, by the week, or by the pet without confusion. Holiday surcharges, extra-dog fees, and overnight sitting each get their own line so nothing slips through. This template is built for solo dog walkers and small pet-care businesses who want fast, clear invoices between walks, with no software subscription and no account to manage.",
    "metaDescription": "Free dog walker invoice template — no signup needed. Bill solo and group walks, holiday surcharges, overnight pet sitting, and extra-dog fees per visit.",
    "name": "Dog Walker",
    "pluralName": "Dog Walkers",
    "relatedSlugs": [
      "cleaner",
      "personal-trainer",
      "tutor"
    ],
    "slug": "dog-walker",
    "whatToInclude": [
      "30-minute solo dog walk",
      "60-minute group walk",
      "Overnight pet sitting (per night)",
      "Cat drop-in visit",
      "Weekend / holiday surcharge",
      "Additional dog (same household)",
      "Last-minute booking fee",
      "Key pickup and return fee"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Homepage design — Figma mockups",
        "quantity": 1,
        "rate": 1200
      },
      {
        "description": "Inner page template",
        "quantity": 4,
        "rate": 350
      },
      {
        "description": "Responsive / mobile breakpoint design",
        "quantity": 1,
        "rate": 600
      },
      {
        "description": "Client revision round (3rd, overage)",
        "quantity": 2,
        "rate": 150
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Yes, 50 percent before you open Figma is standard for project work. It commits the client to the timeline and weeds out non-serious leads who want to see designs before paying. The final 50 percent is due on handoff, not net 30.",
        "question": "Should I charge a deposit before starting design work?"
      },
      {
        "answer": "Include two revision rounds in your flat fee and bill every round after that as its own line. When extra revisions appear as a number on the invoice, clients get careful about scope fast. Reference the signed SOW on the invoice so the original scope is never in dispute.",
        "question": "How do I handle scope creep and extra revisions?"
      },
      {
        "answer": "Yes, front the cost and pass it through at cost plus a small markup, with the license listed on the invoice. Keep the receipts so if the client later asks who owns the assets, you can answer immediately and point to the license.",
        "question": "Should I pass stock photo costs through to the client?"
      },
      {
        "answer": "In most U.S. states, custom web design is a non-taxable service, but pre-made templates, themes, or hosting resold to a client can be taxable. If you resell tangible digital goods, check your state's rules and add a tax line only where required.",
        "question": "Do I charge sales tax on web design?"
      },
      {
        "answer": "50 percent deposit up front and final payment due on handoff, not net 30. Once you deliver the files, you have nothing left to collect with, so tie final payment to delivery, not to a later date the client picks.",
        "question": "What payment terms are standard for freelance design?"
      }
    ],
    "h1": "Free Web Designer Invoice Template — No Signup",
    "industryTips": "Always invoice against a signed scope of work, and reference the SOW or proposal number on every invoice so scope-creep disputes are settled by the document, not by memory. Build two revision rounds into your flat fee and bill every additional round as a separate line — clients respect scope far more when extra revisions show up as a number on an invoice. Front stock photography and font licensing costs and pass them through at cost with a small markup; keep the license receipts in case a client later asks who owns the assets. For design-system or component-library work, bill it as its own deliverable rather than folding it into page count, because the value is entirely different. Take a deposit of 50 percent before you open Figma — this is standard for project work and weeds out non-serious clients. Set final payment due on handoff, not net 30, because once files are delivered, you have nothing left to collect with. If you also do light development, keep design and dev on separate invoices or at least separate line groups so the client cannot blur the two scopes. Save a PDF of every invoice; email delivery fails and clients switch addresses.",
    "introParagraph": "Most of your projects are flat-fee design work with a defined scope, a couple of revision rounds, and a handoff to a developer. Invoicing gets messy when scope creeps: extra pages, another revision cycle, a last-minute brand guide, stock photos you fronted. Each of those should be its own line so the client sees exactly what changed and why the total moved. A clean invoice also protects you at handoff — it documents what was delivered, what is billable as an add-on, and what was included in the original proposal. This template is built for freelance web designers who quote by project and need to bill clearly without paying monthly SaaS fees.",
    "metaDescription": "Free web designer invoice template — no signup. Bill homepage mockups, inner pages, responsive design, revision rounds, and stock licensing per project.",
    "name": "Web Designer",
    "pluralName": "Web Designers",
    "relatedSlugs": [
      "web-developer",
      "graphic-designer",
      "illustrator"
    ],
    "slug": "web-designer",
    "whatToInclude": [
      "Homepage design (Figma mockups)",
      "Inner page template",
      "Responsive / mobile breakpoint design",
      "Design system or component library",
      "Brand style guide",
      "Stock photography licensing (pass-through)",
      "Client revision round (overage)",
      "Handoff documentation"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Spot illustration (single)",
        "quantity": 3,
        "rate": 250
      },
      {
        "description": "Full-page illustration",
        "quantity": 1,
        "rate": 900
      },
      {
        "description": "Usage licensing — web, 1 year",
        "quantity": 1,
        "rate": 400
      },
      {
        "description": "Rush job surcharge (48hr)",
        "quantity": 1,
        "rate": 300
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Split them into two lines: one for creating the illustration and one for the license, which should state scope, duration, and territory. A blog-post spot and a nationwide packaging run are very different prices for the same drawing, and the invoice should make that clear to both of you.",
        "question": "How do I price usage rights versus the artwork itself?"
      },
      {
        "answer": "Yes. Layered source files are a separate deliverable from final exported images, and many illustrators only hand them over for higher-tier licenses or an added fee. State on the invoice what the client received — finals only, or finals plus source.",
        "question": "Should I charge extra for source files?"
      },
      {
        "answer": "25 to 50 percent above your base rate for anything due in under a week, and more for 48-hour turnarounds. Put it on its own line so the client sees that urgency has a cost, and mention it in your original quote so it is expected, not a surprise.",
        "question": "What is a fair rush-job surcharge?"
      },
      {
        "answer": "By default you keep copyright and license usage. Full copyright transfer or work-for-hire should cost significantly more and be spelled out on the invoice. Never let work-for-hire be assumed — if they want to own it, they pay for it and you document it.",
        "question": "Who owns the copyright, me or the client?"
      },
      {
        "answer": "Send the invoice on delivery of the finals, not on client approval, and hold the final high-resolution files until the invoice is paid. Once you hand over everything, you have nothing left to collect with, so keep the hi-res files as your security.",
        "question": "Should I invoice before or after final delivery?"
      }
    ],
    "h1": "Free Illustrator Invoice Template — No Signup",
    "industryTips": "Price the artwork and the usage separately, always. A client buying a spot illustration for a single blog post should not pay the same as one running it on packaging nationwide, so list the usage scope, duration, and territory on the invoice so neither side forgets the deal. Build one or two rounds of revisions into your base fee and bill further rounds as a line item; illustrators lose the most margin to endless just-one-more-tweak requests. Charge a rush surcharge of 25 to 50 percent for anything under a week and say so up front in your quote — it belongs on the invoice as its own line so the client links urgency to cost. Handing over source files is a separate service from delivering finals; many illustrators charge a source-file fee or reserve source files for higher-tier licenses. If the client wants print production, color separations, or press-ready files, bill that as prep work distinct from the illustration. Keep copyright unless the client explicitly buys it — work-for-hire should cost significantly more and be documented on the invoice, not assumed. Send invoices on delivery of finals, not on approval, and hold the final high-resolution files until the invoice is paid.",
    "introParagraph": "Illustration pricing depends on usage almost as much as the artwork itself. The same piece is worth one price for a blog post, another for a book cover, and far more for an ad campaign or merchandise. Your invoice has to reflect what the client actually licensed — usage scope, duration, territory — not just one illustration. Revisions, rush jobs, and source-file handovers each change the total, and clients will quietly expect them for free unless they are line items. A clear invoice turns that conversation into a receipt. This template is built for freelance illustrators who need to bill artwork and usage rights clearly, without recurring software costs.",
    "metaDescription": "Free illustrator invoice template — no signup. Bill artwork and usage rights separately, plus revisions, rush surcharges, source files, and print prep.",
    "name": "Illustrator",
    "pluralName": "Illustrators",
    "relatedSlugs": [
      "graphic-designer",
      "web-designer",
      "photographer"
    ],
    "slug": "illustrator",
    "whatToInclude": [
      "Spot illustration (single)",
      "Full-page illustration",
      "Character design / concept sketch",
      "Color studies and revisions",
      "Usage licensing fee (scope, duration, territory)",
      "Rush job surcharge",
      "Source file handover (.AI / .PSD)",
      "Print production file prep"
    ]
  },
  {
    "defaultCurrency": "USD",
    "defaultLineItems": [
      {
        "description": "Administrative support (hourly)",
        "quantity": 10,
        "rate": 35
      },
      {
        "description": "Inbox management",
        "quantity": 4,
        "rate": 35
      },
      {
        "description": "CRM data entry",
        "quantity": 3,
        "rate": 35
      },
      {
        "description": "Monthly retainer (20 hrs)",
        "quantity": 1,
        "rate": 700
      }
    ],
    "defaultTaxRate": 0,
    "faq": [
      {
        "answer": "Offer both. A retainer covers predictable recurring work at a set monthly rate, and hourly billing covers overflow beyond the retainer. Bill overflow at a slightly higher rate so clients scope their retainer honestly instead of treating you as an on-demand tap.",
        "question": "Should I bill by the hour or use a monthly retainer?"
      },
      {
        "answer": "Most VAs do not roll unused hours over, and you should print that policy on the invoice or your agreement. Without it in writing, clients expect banked hours at month end, and that becomes an argument you can avoid by stating the rule up front.",
        "question": "Do unused retainer hours roll over?"
      },
      {
        "answer": "Round to 15-minute increments and say so on the invoice. Clients distrust invoices that bill to the minute, and consistent rounding makes your totals predictable and easy to verify against a shared time log.",
        "question": "How should I round time on my invoice?"
      },
      {
        "answer": "Net 7 or net 14, not net 30. Because the work is ongoing, a long payment window lets a client rack up another month of service before paying for the last one. Short terms keep your cash flow steady and your clients honest.",
        "question": "What payment terms should I set as a VA?"
      },
      {
        "answer": "Invoice it separately from the retainer so the retainer budget stays clean and the client sees the project as its own scope. Mixing them on one invoice blurs the two budgets and makes it hard to argue scope creep later.",
        "question": "How do I bill project work on top of a retainer?"
      }
    ],
    "h1": "Free Virtual Assistant Invoice Template — No Signup",
    "industryTips": "Track time by task, not by day, so your invoice reads as a list of services rendered rather than a vague 10 hours of admin. Clients accept invoices far faster when they can see their inbox was managed for 3 hours and their CRM updated for 2. If you run a retainer, state the included hours on the invoice and whether unused hours roll over — most VAs do not roll them over, and printing that policy prevents end-of-month arguments. Bill overflow hours at a higher rate than retainer hours so clients are incentivized to scope retainer work accurately, not to treat you as an on-demand tap. Round time in 15-minute increments and say so on the invoice; clients distrust invoices that bill to the minute. Set terms of net 7 or net 14, not net 30 — VAs do ongoing work, and a long payment window lets a client rack up another month of service before paying for the last one. If you take on project work alongside retainer work for the same client, invoice it separately so the retainer budget stays clean. Always note which time tracker or log the hours came from, so a client who disputes can be pointed back to the shared log.",
    "introParagraph": "Virtual assistants almost always bill in two shapes: a monthly retainer for predictable work and hourly for anything that spills over. The hard part is tracking time across dozens of small tasks for different clients so the invoice reflects what you actually did — 20 minutes of inbox triage here, an hour of calendar wrangling there. Without itemized lines, clients question the total and you cannot defend it. A clean invoice breaks retainer hours from overflow hours and lists the task categories so the client sees the work at a glance. This template is built for VAs who want to bill hourly and retainer work clearly without paying for invoicing software every month.",
    "metaDescription": "Free virtual assistant invoice template — no signup. Bill hourly and retainer admin, inbox, calendar, data entry, and social scheduling with clear task lines.",
    "name": "Virtual Assistant",
    "pluralName": "Virtual Assistants",
    "relatedSlugs": [
      "freelancer",
      "consultant",
      "social-media-manager"
    ],
    "slug": "virtual-assistant",
    "whatToInclude": [
      "Hourly administrative support",
      "Email inbox management",
      "Calendar scheduling",
      "Data entry / CRM updates",
      "Social media post scheduling",
      "Travel itinerary research",
      "Monthly retainer block (hours)",
      "Ad-hoc project (hourly overflow)"
    ]
  }
];

const bySlugMap = new Map(professions.map((p) => [p.slug, p] as const));

export function bySlug(slug: string): Profession | undefined {
  return bySlugMap.get(slug);
}

/**
 * Last-edited date for the profession content set (ISO YYYY-MM-DD). Bumped when
 * the authored copy is updated. Used by sitemap.ts as the lastModified for the
 * profession pages so a rebuild alone doesn't tell crawlers every page changed
 * (which `new Date()` at build time would do).
 */
export const PROFESSION_DATA_UPDATED_AT = '2026-06-26';

