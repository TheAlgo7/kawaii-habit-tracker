// Generates the shipped icon set from the HD Photoshop masters.
// Masters live in /design (out of the deploy path); outputs go to /public.
// Run: node scripts/make-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const design = join(here, "..", "design");
const pub = join(here, "..", "public");

// Background used to make maskable / apple icons full-bleed (no transparent
// corners), sampled to match the icons' dark plum edge.
const FILL = "#1b1029";

const full = await readFile(join(design, "Kawaii-App-Icon.png")); // full sakura scene
const zoom = await readFile(join(design, "Kawaii-App-Icon-Zoomed.png")); // centered cat

async function square(buf, size, fill) {
  let pipe = sharp(buf).resize({ width: size, height: size, fit: "cover", position: "centre" });
  if (fill) pipe = pipe.flatten({ background: fill });
  return pipe.png({ compressionLevel: 9 }).toBuffer();
}

const jobs = [
  ["icon-192.png", () => square(full, 192)], // any
  ["icon-512.png", () => square(full, 512)], // any
  ["icon-maskable.png", () => square(zoom, 512, FILL)], // maskable, full-bleed, centered
  ["apple-touch-icon.png", () => square(zoom, 180, FILL)], // iOS rounds it itself
  ["favicon-48.png", () => square(zoom, 48)],
];

for (const [name, make] of jobs) {
  const out = await make();
  await writeFile(join(pub, name), out);
  console.log(`${name.padEnd(22)} ${(out.length / 1024).toFixed(0)} KB`);
}

console.log("\nIcons written to /public.");
