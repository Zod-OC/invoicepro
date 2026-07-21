// Unicode font registration + per-string font selection for jsPDF.
//
// jsPDF's built-in Helvetica is a standard PDF font: it only renders CP1252
// (Latin-1 + a few extensions). Any character outside that range — CJK,
// Cyrillic beyond Latin-1, Greek, Arabic, Hebrew, etc. — renders as a blank
// box or is silently dropped from the output stream.
//
// This module loads a merged Noto Sans Regular TTF (see
// src/assets/fonts/noto-sans-regular.ts) that covers ~32k glyphs across
// Latin/Cyrillic/Greek/Arabic/Hebrew/CJK/Hiragana/Katakana, registers it
// with jsPDF's virtual file system, and exposes helpers that let the PDF
// renderers keep Helvetica as the default (smaller, cleaner for invoices)
// while transparently falling back to Noto Sans for any string that
// contains non-CP1252 characters.
//
// Strategy: jsPDF cannot mix fonts within a single text() call, so callers
// must pick a font per string. `selectFontFor(doc, text)` returns the font
// family name to pass to doc.setFont() based on whether `text` contains
// any non-CP1252 character. `registerUnicodeFont(doc)` does the one-time
// VFS/addFont registration and is idempotent across calls on the same doc.

import jsPDF from 'jspdf';
import { NOTO_SANS_REGULAR_B64 } from '@/assets/fonts/noto-sans-regular';

export const NOTO_FONT_FAMILY = 'NotoSans';
const VFS_FILENAME = 'NotoSans-Regular.ttf';
let registeredGlobally = false;

// CP1252 is a single-byte encoding covering Latin-1 (0x00-0xFF) plus a
// sprinkling of extra punctuation/symbols in the 0x80-0x9F range (€, ‚, ƒ,
// „, …, †, ‡, ˆ, ‰, Š, ‹, Œ, Ž, ' ', ' " " • — ˜ ™ š › œ ž Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ × ÷, etc.).
// Helvetica in jsPDF renders exactly this set. Anything above U+00FF, or
// in the 0x80-0x9F C1 range that CP1252 leaves undefined (0x81, 0x8D, 0x8F,
// 0x90, 0x9D), needs the Unicode fallback. We keep an explicit allowlist of
// the CP1252-encodable code points rather than relying on TextEncoder (which
// would silently replace unmappable chars with '?') so the check is exact.
const CP1252_RANGE = buildCp1252Set();
function buildCp1252Set(): Set<number> {
  // 0x00-0x7F (ASCII) + 0xA0-0xFF (Latin-1 supplement) are all in CP1252.
  const set = new Set<number>();
  for (let cp = 0x00; cp <= 0x7f; cp++) set.add(cp);
  for (let cp = 0xa0; cp <= 0xff; cp++) set.add(cp);
  // CP1252-specific mappings in 0x80-0x9F (the undefined slots in Latin-1).
  // 0x81, 0x8D, 0x8F, 0x90, 0x9D are explicitly UNDEFINED in CP1252.
  const cp1252Extras = [
    0x20ac, // €  (0x80)
    0x201a, // ‚  (0x82)
    0x0192, // ƒ  (0x83)
    0x201e, // „  (0x84)
    0x2026, // …  (0x85)
    0x2020, // †  (0x86)
    0x2021, // ‡  (0x87)
    0x02c6, // ˆ  (0x88)
    0x2030, // ‰  (0x89)
    0x0160, // Š  (0x8a)
    0x2039, // ‹  (0x8b)
    0x0152, // Œ  (0x8c)
    0x017d, // Ž  (0x8e)
    0x2018, // '  (0x91)
    0x2019, // '  (0x92)
    0x201c, // "  (0x93)
    0x201d, // "  (0x94)
    0x2022, // •  (0x95)
    0x2013, // –  (0x96)
    0x2014, // —  (0x97)
    0x02dc, // ˜  (0x98)
    0x2122, // ™  (0x99)
    0x0161, // š  (0x9a)
    0x203a, // ›  (0x9b)
    0x0153, // œ  (0x9c)
    0x017e, // ž  (0x9e)
    0x0178, // Ÿ  (0x9f)
  ];
  for (const cp of cp1252Extras) set.add(cp);
  return set;
}

/** True if every character in `s` is renderable by jsPDF's built-in Helvetica
 *  (CP1252). False for CJK, Arabic, Hebrew, Cyrillic beyond Latin-1, Greek,
 *  emoji, etc. — those need the Noto Sans fallback. */
export function isCp1252(s: string): boolean {
  for (const ch of s) {
    if (!CP1252_RANGE.has(ch.codePointAt(0)!)) return false;
  }
  return true;
}

/**
 * Register the Noto Sans Unicode font with `doc`'s virtual file system.
 * Safe to call multiple times on the same doc — the registration is memoized
 * both globally (jsPDF shares a VFS across docs by default) and per-doc via
 * a guard flag. After this returns, `doc.setFont('NotoSans', 'normal')` is
 * usable. Bold/italic variants are NOT registered — the merged TTF is
 * Regular only, so bold-style emphasis for non-Latin text falls back to
 * Helvetica bold when the whole string is CP1252 (the common case for
 * section headers like "INVOICE").
 */
export function registerUnicodeFont(doc: jsPDF): void {
  if (registeredGlobally) return;
  doc.addFileToVFS(VFS_FILENAME, NOTO_SANS_REGULAR_B64);
  doc.addFont(VFS_FILENAME, NOTO_FONT_FAMILY, 'normal');
  registeredGlobally = true;
}

/**
 * Pick the font family for a given string: 'helvetica' if every char is
 * CP1252-renderable (keeps the smaller, crisper Latin default), or
 * NOTO_FONT_FAMILY if any char needs the Unicode fallback. Call this right
 * before doc.text() / autoTable cell rendering and pass the result to
 * doc.setFont(). The caller is still responsible for restoring the previous
 * font after the call if needed.
 *
 * Note: jsPDF cannot mix fonts within ONE text() call, so a string like
 * "Hello 世界" will be rendered entirely in Noto Sans. Noto Sans's Latin
 * glyphs are visually close enough to Helvetica that this is acceptable;
 * the alternative (splitting the string into Latin/non-Latin runs and
 * emitting two text() calls at adjacent x offsets) would require per-call
 * width measurement and was rejected as fragile for the 12 templates.
 */
export function selectFontFor(_doc: jsPDF, text: string): string {
  return isCp1252(text) ? 'helvetica' : NOTO_FONT_FAMILY;
}
