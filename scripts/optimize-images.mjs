// Generates the shipped WebP art from the heavy PNG masters.
// Masters live in /design (gitignored, out of the deploy path); the optimized
// WebP variants are written to /public and are the only art that ships.
// Run: node scripts/optimize-images.mjs
import { readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const base = dirname(fileURLToPath(import.meta.url));
const srcDir = join(base, "..", "design");
const outDir = join(base, "..", "public");

const TARGETS = [
  { file: "scene-garden-day.png", maxWidth: 1280, quality: 82 },
  { file: "scene-garden-night.png", maxWidth: 1280, quality: 82 },
];

const NEKO_MOODS = [
  { file: "neko-cat-normal.webp", column: 0, row: 0 },
  { file: "neko-cat-happy.webp", column: 1, row: 0 },
  { file: "neko-cat-blissful.webp", column: 1, row: 0 },
  { file: "neko-cat-sleepy.webp", column: 0, row: 1 },
  { file: "neko-cat-sad.webp", column: 1, row: 1 },
];

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

for (const { file, maxWidth, quality } of TARGETS) {
  const src = join(srcDir, file);
  const out = join(outDir, file.replace(/\.png$/, ".webp"));
  const input = await readFile(src);
  const before = (await stat(src)).size;

  const webp = await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer();

  await writeFile(out, webp);
  console.log(`${file.padEnd(34)} ${kb(before).padStart(9)} png  ->  ${kb(webp.length).padStart(9)} webp`);
}

const moodSheet = join(srcDir, "neko-mood-sheet.png");
const sheet = sharp(await readFile(moodSheet));
const metadata = await sheet.metadata();
const cellWidth = Math.floor(metadata.width / 2);
const cellHeight = Math.floor(metadata.height / 2);

for (const { file, column, row } of NEKO_MOODS) {
  const webp = await sharp(moodSheet)
    .extract({ left: column * cellWidth, top: row * cellHeight, width: cellWidth, height: cellHeight })
    .resize({ width: 512 })
    .webp({ quality: 84, effort: 6 })
    .toBuffer();
  await writeFile(join(outDir, file), webp);
  console.log(`${file.padEnd(34)} generated mood -> ${kb(webp.length).padStart(9)} webp`);
}

console.log("\nDone. WebP variants written to /public.");
