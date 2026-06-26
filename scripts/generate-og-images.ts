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

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'og-images');

const WIDTH = 1200;
const HEIGHT = 630;
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

  // Bottom-right URL
  ctx.fillStyle = MUTED;
  ctx.font = '400 26px sans-serif';
  const url = 'billify.me/invoice-template-for/' + profession.slug;
  const w = ctx.measureText(url).width;
  ctx.fillText(url, WIDTH - 80 - w, HEIGHT - 60);

  const outPath = join(OUT_DIR, `invoice-template-${profession.slug}.png`);
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