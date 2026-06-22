// Rasterise les visuels du catalogue (SVG dessinés dans l'app) en PNG transparents,
// les uploade sur Firebase Storage (catalog/<id>.png), et écrit l'URL dans le champ
// `image` de catalog.seed.json.
//
// But : une fois lancé + seedé (scripts/seed-catalog.mjs), les objets s'affichent via
// PNG distants. On peut alors AJOUTER de nouveaux objets sans rebuild de l'app :
// upload d'un PNG + doc Firestore `catalog/<id>` avec un champ `image`.
//
// Les formes ci-dessous sont un PORT 1:1 du rendu SVG de :
//   - src/components/DimAvatar.tsx  (accessoires portés, canvas 200×260)
//   - src/components/Decor.tsx        (décorations, canvas 100×120)
// Les 6 objets `color` ne sont PAS rendus (ils recolorent la pâte, pas d'overlay).
//
// Prérequis :
//   npm i -D @resvg/resvg-js firebase-admin
//   export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json
//
// Lancement :
//   node scripts/render-items.mjs            # rend les PNG en local + upload + patch seed
//   node scripts/render-items.mjs --dry-run  # rend les PNG en local seulement (pas d'upload)

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const PROJECT_ID = 'dim-dong';
const BUCKET = 'dim-dong.firebasestorage.app';
const DRY_RUN = process.argv.includes('--dry-run');

const SEED_URL = new URL('./catalog.seed.json', import.meta.url);
const OUT_DIR = new URL('./catalog-png/', import.meta.url);

// Canvas (identiques aux viewBox des composants).
const AVATAR = { w: 200, h: 260, scale: 4 }; // DimAvatar
const DECOR = { w: 100, h: 120, scale: 4 }; // DecorView

// ---------------------------------------------------------------------------
// Helpers couleur (copie fidèle des composants).
// DimAvatar : darken(amount=0.24), lighten(amount=0.3). Decor : lighten(0.28), darken(0.26).
function darken(hex, a = 0.24) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - a)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - a)));
  const b = Math.max(0, Math.round((n & 255) * (1 - a)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function lighten(hex, a = 0.3) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + 255 * a));
  const g = Math.min(255, Math.round(((n >> 8) & 255) + 255 * a));
  const b = Math.min(255, Math.round((n & 255) + 255 * a));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Dégradé "volume" 3D (équiv. fonction Vol de DimAvatar).
function vol(gid, c) {
  return (
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${lighten(c, 0.28)}"/>` +
    `<stop offset="0.55" stop-color="${c}"/>` +
    `<stop offset="1" stop-color="${darken(c, 0.28)}"/>` +
    `</linearGradient></defs>`
  );
}

// ---------------------------------------------------------------------------
// Accessoires portés (DimAvatar → fonction Accessory). canvas 200×260.
function shoe(x, gid, dark) {
  return (
    `<path d="M${x} 216 Q${x - 3} 236 ${x + 36} 236 L${x + 36} 216 Z" fill="url(#${gid})"/>` +
    `<rect x="${x - 3}" y="232" width="40" height="8" rx="4" fill="#FFFFFF"/>` +
    `<path d="M${x + 5} 221 L${x + 18} 221" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`
  );
}

function accessory(draw, c, id) {
  const gid = `g-${id}`;
  const d = darken(c);
  switch (draw) {
    case 'tuft':
      return (
        vol(gid, c) +
        `<path d="M62 50 Q60 14 84 38 Q88 10 100 34 Q112 10 122 40 Q142 16 138 54 Q100 38 62 50 Z" fill="url(#${gid})"/>` +
        `<path d="M86 32 Q90 20 96 34" stroke="${lighten(c, 0.35)}" stroke-width="3" stroke-linecap="round" fill="none"/>`
      );
    case 'cap':
      return (
        vol(gid, c) +
        `<path d="M52 60 C54 14 146 14 148 60 Z" fill="url(#${gid})"/>` +
        `<path d="M94 56 Q150 50 170 64 Q150 68 94 66 Z" fill="${d}"/>` +
        `<ellipse cx="82" cy="34" rx="20" ry="11" fill="#FFFFFF" opacity="0.18"/>` +
        `<circle cx="100" cy="20" r="5" fill="${d}"/>`
      );
    case 'beanie':
      return (
        vol(gid, c) +
        `<path d="M50 62 C52 10 148 10 150 62 Z" fill="url(#${gid})"/>` +
        `<rect x="46" y="54" width="108" height="18" rx="9" fill="${d}"/>` +
        `<ellipse cx="80" cy="32" rx="18" ry="11" fill="#FFFFFF" opacity="0.16"/>` +
        `<circle cx="100" cy="11" r="11" fill="#FFFFFF"/>`
      );
    case 'crown':
      return (
        vol(gid, c) +
        `<polygon points="60,56 75,22 90,56 100,18 110,56 125,22 140,56" fill="url(#${gid})"/>` +
        `<rect x="60" y="52" width="80" height="20" rx="4" fill="url(#${gid})"/>` +
        `<rect x="60" y="52" width="80" height="6" rx="3" fill="#FFFFFF" opacity="0.25"/>` +
        `<circle cx="80" cy="62" r="4.5" fill="#E24B4A"/>` +
        `<circle cx="100" cy="62" r="4.5" fill="#3D7BE0"/>` +
        `<circle cx="120" cy="62" r="4.5" fill="#1D9E75"/>`
      );
    case 'glasses':
      return (
        `<circle cx="82" cy="140" r="17" stroke="${c}" stroke-width="5" fill="#BFE9FF" fill-opacity="0.18"/>` +
        `<circle cx="118" cy="140" r="17" stroke="${c}" stroke-width="5" fill="#BFE9FF" fill-opacity="0.18"/>` +
        `<path d="M97 137 Q100 133 103 137" stroke="${c}" stroke-width="4" fill="none"/>` +
        `<path d="M65 136 L46 130" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M135 136 L154 130" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M73 133 L80 129" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.7"/>`
      );
    case 'sunglasses':
      return (
        vol(gid, c) +
        `<ellipse cx="82" cy="140" rx="20" ry="15" fill="url(#${gid})"/>` +
        `<ellipse cx="118" cy="140" rx="20" ry="15" fill="url(#${gid})"/>` +
        `<rect x="98" y="136" width="6" height="5" fill="${c}"/>` +
        `<path d="M62 135 L44 129" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M138 135 L156 129" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M72 134 L86 131" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>` +
        `<path d="M108 134 L122 131" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`
      );
    case 'bowtie':
      return (
        vol(gid, c) +
        `<polygon points="100,192 76,180 76,204" fill="url(#${gid})"/>` +
        `<polygon points="100,192 124,180 124,204" fill="url(#${gid})"/>` +
        `<rect x="93" y="184" width="14" height="16" rx="4" fill="${d}"/>`
      );
    case 'scarf':
      return (
        vol(gid, c) +
        `<path d="M48 194 Q100 214 152 194 Q100 224 48 194 Z" fill="url(#${gid})"/>` +
        `<path d="M122 206 L142 206 L139 240 L125 240 Z" fill="${d}"/>`
      );
    case 'sneakers':
      return vol(gid, c) + shoe(60, gid, d) + shoe(104, gid, d);
    case 'cape':
      return (
        vol(gid, c) +
        `<path d="M58 88 Q100 76 142 88 L156 214 Q100 246 44 214 Z" fill="url(#${gid})" opacity="0.97"/>`
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Décorations (Decor → fonction Shape). canvas 100×120.
function decorGrad(gid, c) {
  return (
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${lighten(c, 0.28)}"/>` +
    `<stop offset="0.55" stop-color="${c}"/>` +
    `<stop offset="1" stop-color="${darken(c, 0.26)}"/>` +
    `</linearGradient></defs>`
  );
}
function stalk(x, top, h, c, dk) {
  let s = `<rect x="${x}" y="${top}" width="11" height="${h}" rx="5" fill="${c}"/>`;
  const segs = Math.floor(h / 16);
  for (let i = 0; i < segs; i++) {
    s += `<rect x="${x}" y="${top + 14 + i * 16}" width="11" height="2.5" fill="${dk}" opacity="0.5"/>`;
  }
  return s;
}

function decor(kind, c, id) {
  const gid = `d-${id}`;
  const fill = `url(#${gid})`;
  const dk = darken(c, 0.26);
  const shadow = `<ellipse cx="50" cy="114" rx="30" ry="6" fill="#2E3A1F" opacity="0.15"/>`;
  const grad = decorGrad(gid, c);
  switch (kind) {
    case 'bonsai':
      return (
        grad + shadow +
        `<path d="M32 96 L68 96 L64 112 L36 112 Z" fill="#C56B3A"/>` +
        `<rect x="29" y="90" width="42" height="8" rx="3" fill="#B5612F"/>` +
        `<path d="M50 96 Q44 80 57 70" stroke="#6B4A2B" stroke-width="6" stroke-linecap="round" fill="none"/>` +
        `<ellipse cx="40" cy="66" rx="16" ry="10" fill="${fill}"/>` +
        `<ellipse cx="64" cy="62" rx="16" ry="10" fill="${fill}"/>` +
        `<ellipse cx="52" cy="52" rx="18" ry="11" fill="${fill}"/>` +
        `<ellipse cx="46" cy="48" rx="7" ry="4" fill="#FFFFFF" opacity="0.2"/>`
      );
    case 'sakura': {
      const flowers = [[34, 50], [60, 44], [48, 60], [70, 60], [40, 66]]
        .map(([fx, fy]) => `<circle cx="${fx}" cy="${fy}" r="3" fill="#FFF0F5"/>`)
        .join('');
      return (
        grad + shadow +
        `<path d="M47 112 L47 64 Q47 56 54 54 L58 56 L55 112 Z" fill="#7A552E"/>` +
        `<path d="M52 78 Q40 72 34 60" stroke="#7A552E" stroke-width="4" stroke-linecap="round" fill="none"/>` +
        `<circle cx="34" cy="56" r="18" fill="${fill}"/>` +
        `<circle cx="66" cy="54" r="18" fill="${fill}"/>` +
        `<circle cx="50" cy="40" r="22" fill="${fill}"/>` +
        `<ellipse cx="44" cy="34" rx="9" ry="6" fill="#FFFFFF" opacity="0.25"/>` +
        flowers
      );
    }
    case 'bamboo':
      return (
        grad + shadow +
        stalk(42, 36, 78, c, dk) +
        stalk(60, 50, 64, lighten(c, 0.1), dk) +
        `<path d="M52 44 Q70 34 84 40 Q70 46 52 48 Z" fill="${c}"/>` +
        `<path d="M50 60 Q34 52 22 58 Q36 64 50 64 Z" fill="${dk}"/>` +
        `<path d="M66 56 Q82 50 92 56 Q80 62 66 60 Z" fill="${lighten(c, 0.12)}"/>`
      );
    case 'lantern':
      return (
        grad + shadow +
        `<rect x="48" y="108" width="4" height="6" fill="#7A552E"/>` +
        `<rect x="38" y="46" width="24" height="7" rx="3" fill="#F4C430"/>` +
        `<ellipse cx="50" cy="78" rx="26" ry="25" fill="${fill}"/>` +
        `<path d="M50 53 L50 103" stroke="${dk}" stroke-width="1.5" opacity="0.4"/>` +
        `<path d="M36 60 Q34 78 36 96" stroke="${dk}" stroke-width="1.5" opacity="0.4" fill="none"/>` +
        `<path d="M64 60 Q66 78 64 96" stroke="${dk}" stroke-width="1.5" opacity="0.4" fill="none"/>` +
        `<ellipse cx="42" cy="68" rx="6" ry="9" fill="#FFFFFF" opacity="0.2"/>` +
        `<rect x="38" y="101" width="24" height="6" rx="3" fill="#F4C430"/>` +
        `<rect x="47" y="107" width="6" height="10" rx="2" fill="#F4C430"/>`
      );
    case 'teapot':
      return (
        grad + shadow +
        `<path d="M24 82 Q8 78 11 66 Q18 74 30 78 Z" fill="${fill}"/>` +
        `<path d="M76 74 Q94 72 90 94 Q86 98 80 94" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="50" cy="86" rx="30" ry="24" fill="${fill}"/>` +
        `<ellipse cx="50" cy="88" rx="30" ry="14" fill="${dk}" opacity="0.25"/>` +
        `<ellipse cx="50" cy="64" rx="20" ry="8" fill="${lighten(c, 0.1)}"/>` +
        `<circle cx="50" cy="58" r="5" fill="${dk}"/>` +
        `<path d="M36 80 Q50 86 64 80" stroke="#FFFFFF" stroke-width="2.5" opacity="0.5" fill="none"/>`
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Produit le SVG complet pour un item, ou null s'il n'a pas de visuel à rendre.
function svgFor(item) {
  if (item.category === 'decor' && item.decor) {
    const body = decor(item.decor, item.color, item.id);
    if (!body) return null;
    return {
      canvas: DECOR,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DECOR.w} ${DECOR.h}">${body}</svg>`,
    };
  }
  if (item.draw) {
    const body = accessory(item.draw, item.color, item.id);
    if (!body) return null;
    return {
      canvas: AVATAR,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${AVATAR.w} ${AVATAR.h}">${body}</svg>`,
    };
  }
  return null; // colors & co : pas d'image
}

function rasterize(svg, canvas) {
  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,0)',
    fitTo: { mode: 'width', value: canvas.w * canvas.scale },
  });
  return resvg.render().asPng();
}

// Jeton de téléchargement déterministe (réexécutions → mêmes URLs).
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
    console.warn('⚠️  GOOGLE_APPLICATION_CREDENTIALS absent : rendu local seulement (pas d\'upload ni de patch seed).');
  }
  const bucket = canUpload ? await getBucket() : null;

  let rendered = 0;
  for (const item of items) {
    const out = svgFor(item);
    if (!out) continue;

    const png = rasterize(out.svg, out.canvas);
    await writeFile(new URL(`${item.id}.png`, OUT_DIR), png);
    rendered++;

    if (bucket) {
      const token = tokenFor(item.id);
      await bucket.file(`catalog/${item.id}.png`).save(png, {
        metadata: {
          contentType: 'image/png',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      item.image = downloadUrl(item.id, token);
      console.log(`↑ ${item.id}.png → ${item.image}`);
    } else {
      console.log(`• ${item.id}.png (local)`);
    }
  }

  if (bucket) {
    const json = '[\n' + items.map((it) => '  ' + JSON.stringify(it)).join(',\n') + '\n]\n';
    await writeFile(SEED_URL, json);
    console.log(`\n✅ ${rendered} PNG uploadés + catalog.seed.json mis à jour (champ "image").`);
    console.log('➡️  Lance ensuite : node scripts/seed-catalog.mjs');
  } else {
    console.log(`\n✅ ${rendered} PNG rendus dans scripts/catalog-png/ (inspection locale).`);
  }
}

main().catch((e) => {
  console.error('❌ Échec du rendu :', e);
  process.exit(1);
});
