
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

import { accessoryDoc, bodyDoc, decorDoc, DRAW_FRAME, DECOR_FRAME } from '../src/art/dimArt.ts';
import { ensureAdminCredentials } from './credentials.mjs';

const PROJECT_ID = 'dim-dong';
const BUCKET = 'dim-dong.firebasestorage.app';
const DRY_RUN = process.argv.includes('--dry-run');

const SEED_URL = new URL('./catalog.seed.json', import.meta.url);
const OUT_DIR = new URL('./catalog-png/', import.meta.url);

const SCALE = 4;
const AVATAR = { w: DRAW_FRAME.w, h: DRAW_FRAME.h };
const DECOR = { w: DECOR_FRAME.w, h: DECOR_FRAME.h };

function svgFor(item) {
  if (item.category === 'color') {
    return { canvas: AVATAR, svg: bodyDoc(item.color, { rainbow: !!item.rainbow, id: item.id }) };
  }
  if (item.category === 'decor' && item.decor) {
    return { canvas: DECOR, svg: decorDoc(item.decor, item.color) };
  }
  if (item.draw) {
    return { canvas: AVATAR, svg: accessoryDoc(item.draw, item.color) };
  }
  return null;
}

function rasterize(svg, canvas) {
  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,0)',
    fitTo: { mode: 'width', value: canvas.w * SCALE },
  });
  return resvg.render().asPng();
}

function tokenFor(id) {
  const h = createHash('sha256').update(id).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
function downloadUrl(id, token) {
  const path = encodeURIComponent(`catalog/${id}.png`);
  return `https:
}

async function getBucket() {
  const { initializeApp, applicationDefault } = await import('firebase-admin/app');
  const { getStorage } = await import('firebase-admin/storage');
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID, storageBucket: BUCKET });
  return getStorage().bucket();
}

async function main() {
  const items = JSON.parse(await readFile(SEED_URL, 'utf8'));
  await mkdir(OUT_DIR, { recursive: true });

  const canUpload = !DRY_RUN && !!ensureAdminCredentials();
  if (!DRY_RUN && !canUpload) {
    console.warn('⚠️  Aucune clé de compte de service trouvée : rendu local seulement (pas d\'upload).');
  }
  const bucket = canUpload ? await getBucket() : null;

  let rendered = 0;
  for (const item of items) {
    const out = svgFor(item);
    if (!out) continue;

    const png = rasterize(out.svg, out.canvas);
    await writeFile(new URL(`${item.id}.png`, OUT_DIR), png);
    rendered++;
    console.log(`  🎨 ${item.id}.png`);

    if (bucket) {
      const token = tokenFor(item.id);
      await bucket.file(`catalog/${item.id}.png`).save(png, {
        metadata: {
          contentType: 'image/png',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      item.image = downloadUrl(item.id, token);
      console.log(`    ↑ ${item.image}`);
    }
  }

  if (bucket) {
    const json = '[\n' + items.map((it) => '  ' + JSON.stringify(it)).join(',\n') + '\n]\n';
    await writeFile(SEED_URL, json);
    console.log(`\n✅ ${rendered} PNG uploadés + catalog.seed.json mis à jour (champ "image").`);
    console.log('➡️  Lance ensuite : npm run seed:catalog');
  } else {
    console.log(`\n✅ ${rendered} PNG rendus dans scripts/catalog-png/ (inspection locale).`);
  }
}

main().catch((e) => {
  console.error('❌ Échec du rendu :', e);
  process.exit(1);
});
