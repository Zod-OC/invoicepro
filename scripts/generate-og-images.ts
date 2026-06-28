/**
 * Generates one 1200×630 OG image per profession at
 * public/og-images/invoice-template-[slug].png. Referenced by each profession
 * route's generateMetadata openGraph.images.
 *
 *   npx tsx scripts/generate-og-images.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { professions } from '../src/data/professions';
import { SITE_URL, professionPath, ogImageFilename, OG_IMAGE_DIR, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from '../src/lib/site';

const __dirname = dirname(fileURLToPath(import.meta.url));
// OG_IMAGE_DIR is the site-relative URL path (`/og-images`) the route serves the
// images under; the file written here lives at `public/OG_IMAGE_DIR`. Deriving
// the on-disk directory from that single source keeps the generator in lockstep
// with site.ts if the directory is ever renamed (otherwise the route would point
// at a renamed-away image with no build-time signal).
const OUT_DIR = join(__dirname, '..', 'public', OG_IMAGE_DIR);

// Canvas dimensions derive from site.ts (OG_IMAGE_WIDTH/HEIGHT) — the SAME
// source the two metadata declarations (layout.tsx + the profession route)
// use to describe the image to social platforms, so regenerating the canvas at
// a different size updates the metadata hints in lockstep with no drift.
const WIDTH = OG_IMAGE_WIDTH;
const HEIGHT = OG_IMAGE_HEIGHT;
const BG_TOP = '#0f172a'; // slate-900
const BG_BOTTOM = '#1e293b'; // slate-800
const ACCENT = '#6366f1'; // indigo-500
const WHITE = '#f8fafc';
const MUTED = '#94a3b8'; // slate-400

/** Word-wrap `text` to fit `maxWidth` at the current font settings. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function generate(profession: (typeof professions)[number]) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

  // Vertical gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, BG_TOP);
  grad.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Accent bar down the left edge
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, 12, HEIGHT);

  // Wordmark
  ctx.fillStyle = ACCENT;
  ctx.font = '600 30px sans-serif';
  ctx.fillText('✦  Billify', 80, 90);

  // Title — "{Profession} Invoice Template", wrapped
  ctx.fillStyle = WHITE;
  ctx.font = '800 76px sans-serif';
  const titleLines = wrap(ctx, `${profession.name} Invoice Template`, WIDTH - 160);
  let y = 250;
  for (const line of titleLines) {
    ctx.fillText(line, 80, y);
    y += 88;
  }

  // Tagline
  ctx.fillStyle = MUTED;
  ctx.font = '400 34px sans-serif';
  ctx.fillText('Free. No signup. Data stays in your browser.', 80, y + 40);

  // Bottom-right URL — derived from SITE_URL + professionPath (the single source
  // of truth in site.ts) so the baked-into-image text stays in lockstep with the
  // canonical origin and route prefix. The image renders it scheme-less (no
  // https://) for brevity, matching the display style.
  ctx.fillStyle = MUTED;
  ctx.font = '400 26px sans-serif';
  const url = (SITE_URL + professionPath(profession.slug)).replace(/^https?:\/\//, '');
  const w = ctx.measureText(url).width;
  ctx.fillText(url, WIDTH - 80 - w, HEIGHT - 60);

  const outPath = join(OUT_DIR, ogImageFilename(profession.slug));
  writeFileSync(outPath, canvas.toBuffer('image/png'));
  return outPath;
}

// Ensure the output directory exists once, not once per profession.
mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const p of professions) {
  const path = generate(p);
  count++;
  if (count <= 3 || count === professions.length) console.log('wrote', path);
}
console.log(`\nDone: ${count} OG images in ${OUT_DIR}`);
