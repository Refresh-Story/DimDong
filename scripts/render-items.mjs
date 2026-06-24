// Rasterise les visuels manga du catalogue (SOURCE UNIQUE : src/art/dimArt.ts) en PNG
// transparents, les uploade sur Firebase Storage (catalog/<id>.png), et écrit l'URL dans
// le champ `image` de catalog.seed.json.
//
// Le tracé est EXACTEMENT le même que celui rendu par l'app (DimAvatar / Decor via SvgXml)
// → app et PNG pixel-identiques.
//
// Lancé avec `tsx` (import direct du module TS). Voir package.json → render:items.
//
// Prérequis upload :
//   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
//
// Lancement :
//   npm run render:items            # produit les PNG + upload + patch seed
//   npm run render:items -- --dry-run   # produit les PNG en local seulement

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

import { accessoryDoc, bodyDoc, decorDoc, DRAW_FRAME, DECOR_FRAME } from '../src/art/dimArt.ts';

const PROJECT_ID = 'dim-dong';
const BUCKET = 'dim-dong.firebasestorage.app';
const DRY_RUN = process.argv.includes('--dry-run');

const SEED_URL = new URL('./catalog.seed.json', import.meta.url);
const OUT_DIR = new URL('./catalog-png/', import.meta.url);

const SCALE = 4;
const AVATAR = { w: DRAW_FRAME.w, h: DRAW_FRAME.h };
const DECOR = { w: DECOR_FRAME.w, h: DECOR_FRAME.h };

// Produit le SVG complet + le cadre pour un item, ou null s'il n'a pas de visuel.
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

// Jeton de téléchargement déterministe (réexécutions → mêmes URLs → remplace en place).
function tokenFor(id) {
  const h = createHash('sha256').update(id).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
function downloadUrl(id, token) {
  const path = encodeURIComponent(`catalog/${id}.png`);
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${path}?alt=media&token=${token}`;
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

  const canUpload = !DRY_RUN && !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!DRY_RUN && !canUpload) {
    console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS absent : rendu local seulement (pas d\'upload).');
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
