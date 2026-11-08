// Turns the originals in public/diwali (any format, any size) into small same-format
// files in public/gallery, plus the list the site reads. Run after adding photos:
//   npm run gallery
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "public/diwali";
const OUTPUT_DIR = "public/gallery";
const MANIFEST = "src/lib/galleryPhotos.json";
const LONGEST_SIDE = 1200;
const QUALITY = 76;

// Filename starts of the photos to show on top of the stack; the last one is the top card.
const TOP_OF_STACK = ["2d971bff", "ec1997eb"];

const stackRank = (name) => TOP_OF_STACK.findIndex((start) => name.startsWith(start));

const names = (await readdir(SOURCE_DIR))
  .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
  .sort((a, b) => stackRank(a) - stackRank(b) || a.localeCompare(b));

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

const photos = [];
let totalBytes = 0;

for (const [index, name] of names.entries()) {
  const fileName = `photo-${String(index + 1).padStart(2, "0")}.webp`;
  const pipeline = sharp(path.join(SOURCE_DIR, name))
    .rotate() // apply the camera's orientation before the tag is dropped
    .resize(LONGEST_SIDE, LONGEST_SIDE, { fit: "inside", withoutEnlargement: true });

  const { data, info } = await pipeline
    .clone()
    .webp({ quality: QUALITY, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  await writeFile(path.join(OUTPUT_DIR, fileName), data);

  const { dominant } = await pipeline.clone().stats();
  photos.push({
    src: `/gallery/${fileName}`,
    width: info.width,
    height: info.height,
    color: `rgb(${dominant.r},${dominant.g},${dominant.b})`,
  });
  totalBytes += data.length;
}

await writeFile(MANIFEST, `${JSON.stringify(photos, null, 2)}\n`);
console.log(`${photos.length} photos, ${(totalBytes / 1048576).toFixed(2)} MB total`);
