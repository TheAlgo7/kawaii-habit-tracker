// Generates the shipped icon set from the approved, image-generated master artwork.
// Run: node scripts/make-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, "..", "public");
const source = await readFile(join(here, "..", "design", "app-icon-master.png"));
const { version } = JSON.parse(await readFile(join(here, "..", "package.json"), "utf8"));
const releaseTag = `v${version}`;

const OAT = "#F3D7AA";
const PNG_OPTIONS = {
  compressionLevel: 9,
  adaptiveFiltering: true,
  palette: false,
  effort: 10,
};

async function render(size, contentScale = 1) {
  const artworkSize = Math.round(size * contentScale);
  const artwork = sharp(source)
    .resize({ width: artworkSize, height: artworkSize, fit: "fill" })

  if (contentScale === 1) return artwork.png(PNG_OPTIONS).toBuffer();

  const remaining = size - artworkSize;
  const leading = Math.floor(remaining / 2);
  const trailing = remaining - leading;

  // Extend the painting's own edge pixels into the adaptive-icon margin so
  // Android masks never reveal a flat inset square around the watercolor.
  return artwork
    .extend({
      top: leading,
      bottom: trailing,
      left: leading,
      right: trailing,
      extendWith: "copy",
      background: OAT,
    })
    .png(PNG_OPTIONS)
    .toBuffer();
}

const jobs = [
  [["icon-192.png", `icon-192-${releaseTag}.png`], 192, 1],
  [["icon-512.png", `icon-512-${releaseTag}.png`], 512, 1],
  [["icon-maskable.png", `icon-maskable-${releaseTag}.png`], 512, 0.82],
  [["apple-touch-icon.png", `apple-touch-icon-${releaseTag}.png`], 180, 1],
  [["favicon-48.png", `favicon-48-${releaseTag}.png`], 48, 1],
];

for (const [names, size, contentScale] of jobs) {
  const out = await render(size, contentScale);
  await Promise.all(names.map((name) => writeFile(join(pub, name), out)));
  console.log(`${names.join(", ")}  ${size}x${size}  ${(out.length / 1024).toFixed(1)} KB each`);
}

console.log("\nIcons written to /public.");
