# Code Review — Iteration 1

- **Date:** 2026-07-18T12:09:36Z
- **Commit:** 0e581c7
- **Reviewer model:** minimax-m3:cloud

## Verdict: CLEAN

The diff is a focused, behavior-preserving refactor that moves EN 16931 compliance details (Tax ID/VAT, IBAN/BIC, account name, PO) out of a fragile below-totals block and into the seller/buyer party blocks, where they belong on a compliant invoice. I independently ran the new test file — **52/52 pass** — and the full suite is green (`unexpected: 0, flaky: 0`). No blocking issues.

## Summary

The old `drawDetails` helper painted compliance text at `finalY + 48`, which clipped off-page on multi-page invoices. The fix replaces it with three reusable helpers (`sellerDetailLines`, `buyerDetailLines`, `drawPartyDetails`) and two orchestrators (`drawDetailsInline` for side-by-side party blocks, `drawDetailsCombined` for single-column templates, plus a double-`drawPartyDetails` path for Freelancer). Every template now positions the items table with `startY: Math.max(<original offset>, detailsY + 5)`, so details sit above the table and the table is pushed down only as far as needed. The no-op invariant holds: when no compliance data is present, `detailsY === baseY` and `Math.max(originalOffset, baseY + 5)` reduces to `originalOffset` for every template, so invoices without compliance data render byte-for-byte as before. The renderer map is exhaustiveness-checked over `TemplateType`, so a future template cannot silently fall through to a default. This is clean code; the only notes below are a stale committed test artifact and minor maintainability suggestions.

## 🔴 Blocking Issues

None.

## 🟡 Warnings

**W1 — Committed test-report artifact does not evidence the new tests**

- **File:** `test-report/results.json` (carried in the tree at this commit; not part of the diff itself)
- **Concern:** The `results.json` present in the tree at `0e581c7` is a pre-commit run (startTime `2026-07-18T08:27:05Z`, 131 expected, 7 skipped) whose file list does **not** include `tests/pdf-details-inline.spec.ts`. So the committed artifact gives no evidence that the feature tests pass.
- **Risk:** Low, and mitigated — I independently ran `tests/pdf-details-inline.spec.ts`: **52 passed (1.6s)**, and the working-tree `results.json` is a fresh full run (12 files including the new spec, `unexpected: 0, flaky: 0`). No code defect; just housekeeping. Regenerate and re-commit the report so the green run includes this feature.

**W2 — Test spy relies on a jsPDF internal detail**

- **File:** `tests/pdf-details-inline.spec.ts` (`captureText` helper)
- **Concern:** `captureText` monkey-patches `doc.text` as an own property on the jsPDF instance to intercept `{text, y}` calls. This is valid against jsPDF v4 today (the assertions pass and assert specific captured strings, which is the proof), but it couples the test to *how* jsPDF attaches `text`.
- **Risk:** If a jsPDF upgrade moves `text` to the prototype or otherwise makes the per-instance override a no-op, the spy returns an empty capture and the assertions fail **loudly** (not silently) — so the failure mode is test breakage on upgrade, not a false-green. Worth a comment pinning the jsPDF version this assumes.

## 🟢 Suggestions

- **Extract the repeated From/To column literals.** `drawDetailsInline(doc, invoice, 15, 110, …)` appears verbatim at 7 call sites (Classic, Corporate, Bold, Modern, Clean, Executive, Creative). If the party-column x-positions ever change, all 7 must be found and updated in lockstep. Hoisting `15`/`110` (and the combined `15`/`70` used by Consulting/Agency vs. Startup) into named module constants would prevent drift.
- **Name the line-layout magic numbers.** In `drawPartyDetails`, the first line is drawn at `baseY + 6` with successive lines at `i * 4` (`doc.text(line, x, baseY + 6 + i * 4)`). The `6` (top inset) and `4` (line height at 8pt) are load-bearing but undocumented; named constants (`DETAIL_TOP_INSET`, `DETAIL_LINE_HEIGHT`) would make the math readable and keep it consistent with the `return baseY + 6 + lines.length * 4`.
