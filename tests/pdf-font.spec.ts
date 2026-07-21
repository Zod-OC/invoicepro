/**
 * Unit tests for the Issue #4 PDF Unicode-font helpers:
 *   - isCp1252()    — exact CP1252 encodability test
 *   - selectFontFor() — 'helvetica' vs NotoSans fallback selection
 *
 * These exercise the pure string-classification helpers; they do NOT touch
 * jsPDF, so there is no font registration / VFS side effect to set up.
 *
 * Run with: npx playwright test tests/pdf-font.spec.ts
 */
import { test, expect } from '@playwright/test';
import { isCp1252, selectFontFor, NOTO_FONT_FAMILY } from '../src/lib/pdf-font';
import type jsPDF from 'jspdf';

// selectFontFor's first arg is unused at the classification layer (it exists
// for API symmetry with registerUnicodeFont). Pass null cast through the
// type rather than constructing a real jsPDF — keeps the test hermetic.
const noDoc = null as unknown as jsPDF;

test.describe('pdf-font — isCp1252', () => {
  test('returns true for plain ASCII / Latin text', () => {
    expect(isCp1252('')).toBe(true);
    expect(isCp1252('Hello, World!')).toBe(true);
    expect(isCp1252('Invoice #12345 — Net 14')).toBe(true); // em dash is CP1252 (0x97)
    expect(isCp1252('Total: €1,234.50')).toBe(true); // euro sign is CP1252 (0x80)
    expect(isCp1252('café résumé naïve')).toBe(true); // Latin-1 accented letters
    expect(isCp1252('100% — “quoted” •')).toBe(true); // smart quotes + bullet
  });

  test('returns false for CJK characters', () => {
    expect(isCp1252('こんにちは')).toBe(false); // Japanese (Hiragana)
    expect(isCp1252('你好')).toBe(false); // Simplified Chinese
    expect(isCp1252('안녕하세요')).toBe(false); // Korean (Hangul)
  });

  test('returns false for Arabic', () => {
    expect(isCp1252('مرحبا')).toBe(false);
  });

  test('returns false for Cyrillic beyond Latin-1', () => {
    expect(isCp1252('Привет')).toBe(false); // Russian
  });

  test('returns false for emoji', () => {
    expect(isCp1252('Invoice 💰')).toBe(false);
    expect(isCp1252('☑ done')).toBe(false);
  });

  test('returns false for a mixed Latin + non-Latin string', () => {
    // One non-CP1252 char anywhere in the string is enough to need the fallback.
    expect(isCp1252('Total: 1000 円')).toBe(false); // '円' (U+5186)
  });
});

test.describe('pdf-font — selectFontFor', () => {
  test("returns 'helvetica' for Latin/CP1252 text", () => {
    expect(selectFontFor(noDoc, 'Acme Corp')).toBe('helvetica');
    expect(selectFontFor(noDoc, 'Amount due: €500.00')).toBe('helvetica');
    expect(selectFontFor(noDoc, '')).toBe('helvetica');
  });

  test(`returns '${NOTO_FONT_FAMILY}' for non-Latin text`, () => {
    expect(selectFontFor(noDoc, '株式会社')).toBe(NOTO_FONT_FAMILY); // CJK
    expect(selectFontFor(noDoc, 'مرحبا')).toBe(NOTO_FONT_FAMILY); // Arabic
    expect(selectFontFor(noDoc, 'Привет')).toBe(NOTO_FONT_FAMILY); // Cyrillic
    expect(selectFontFor(noDoc, '💰 invoice')).toBe(NOTO_FONT_FAMILY); // emoji
  });

  test('classifies a mixed string as non-Latin (NotoSans renders the whole run)', () => {
    // jsPDF can't mix fonts in one text() call, so a mixed string must take
    // the Unicode fallback for the whole run.
    expect(selectFontFor(noDoc, 'Total 1000 円')).toBe(NOTO_FONT_FAMILY);
  });
});
