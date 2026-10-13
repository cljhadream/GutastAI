import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, 'public');

// PNG files that MUST stay PNG for compatibility:
// - og-cover.png: social platforms' og:image support for WebP is unreliable
// - apple-touch-icon.png: iOS home-screen icons do not support WebP
// - favicon-48.png: legacy favicon fallback for browsers without WebP icons
const KEEP_PNG = new Set([
  'og-cover.png',
  'apple-touch-icon.png',
  'favicon-48.png',
]);

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return files.flat();
}

// Human-readable file size for the report
function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function convertImages() {
  console.log('Starting WebP generation for PNG images in public/...');

  const files = await getFiles(publicDir);
  let generatedCount = 0;
  let skippedExistingCount = 0;
  let skippedKeepPngCount = 0;
  let failedCount = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.png') {
      const name = path.basename(file);

      // Keep compatibility-critical PNGs untouched
      if (KEEP_PNG.has(name)) {
        skippedKeepPngCount++;
        continue;
      }

      const dir = path.dirname(file);
      const base = path.basename(file, ext);
      const newFile = path.join(dir, `${base}.webp`);

      try {
        try {
          await fs.access(newFile);
          skippedExistingCount++;
          continue;
        } catch {
          // file doesn't exist
        }

        const info = await sharp(file)
          .webp({ quality: 80 })
          .toFile(newFile);

        generatedCount++;
        console.log(
          `Generated: ${path.relative(publicDir, newFile)} ` +
          `(${formatKB(info.size)}, was ${formatKB((await fs.stat(file)).size)})`,
        );
      } catch (err) {
        failedCount++;
        console.error(`Error generating webp for ${file}:`, err);
      }
    }
  }

  console.log('\nDone.');
  console.log(`Generated: ${generatedCount}`);
  console.log(`Skipped (webp exists): ${skippedExistingCount}`);
  console.log(`Skipped (must stay PNG): ${skippedKeepPngCount}`);
  console.log(`Failed: ${failedCount}`);
}

convertImages();
