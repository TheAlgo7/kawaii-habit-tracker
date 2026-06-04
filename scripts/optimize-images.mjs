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
  { file: "neko-cat-blissful.png", maxWidth: 512, quality: 80 },
  { file: "neko-cat-happy.png", maxWidth: 512, quality: 80 },
  { file: "neko-cat-normal.png", maxWidth: 512, quality: 80 },
  { file: "neko-cat-sad.png", maxWidth: 512, quality: 80 },
  { file: "neko-cat-sleepy.png", maxWidth: 512, quality: 80 },
  { file: "background-transparent-sky.png", maxWidth: 900, quality: 76 },
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

console.log("\nDone. WebP variants written to /public.");
