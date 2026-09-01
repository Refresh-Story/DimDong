// Rend chaque décor en PNG, sans simulateur, via le MÊME compositeur que l'app
// (src/art/sceneCompose.ts) : ce qu'on regarde ici est ce que l'app affiche.
//
//   npm run render:scenes
//   npm run render:scenes -- --only=bamboo,neon --guides --no-ambient
//   npm run render:scenes -- --top=131   (géométrie réelle de l'accueil : encoche + HUD réservés)
//
// Sortie : scripts/scene-png/  (ignoré par git, régénérable)
import { mkdir, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

import { composeSceneSvg } from '../src/art/sceneCompose.ts';
import { FLOOR_RATIO, sceneGeom } from '../src/art/sceneGeom.ts';
import { BACKGROUNDS, DEFAULT_BACKGROUND } from '../src/data/backgrounds.ts';

const OUT_DIR = new URL('./scene-png/', import.meta.url);

// On inclut volontairement les cadres non-téléphone : c'est là que les casses liées
// au ratio se voient (la carte d'aperçu fait 1.1 de ratio, l'écran 2.16).
const SIZES = [
  { id: 'iphone-390x844', w: 390, h: 844, scale: 2 },
  { id: 'iphone-430x932', w: 430, h: 932, scale: 2 },
  { id: 'preview-card', w: 300, h: 330, scale: 2 },
  { id: 'thumb', w: 72, h: 72, scale: 4 },
];

const SCENES = [['default', DEFAULT_BACKGROUND], ...Object.entries(BACKGROUNDS)];

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const only = opt('only')?.split(',').map((s) => s.trim());
const sizeFilter = opt('size');
const guides = flag('guides');
// Réserve du HUD, en px : `--top=131` reproduit la géométrie de l'accueil sur un 390×844
// (47 d'encoche + 76 de carte + 8). Par défaut 0, donc les planches habituelles sont inchangées.
const topReserve = Number(opt('top') ?? 0);
const ambientPhase = flag('no-ambient') ? null : Number(opt('ambient-phase') ?? 0.45);

function png(svg, w, h, scale) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: Math.round(w * scale) } }).render().asPng();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const scenes = SCENES.filter(([k]) => !only || only.includes(k));
  const sizes = SIZES.filter((s) => !sizeFilter || s.id.includes(sizeFilter));
  let count = 0;

  for (const size of sizes) {
    const g = sceneGeom(size.w, size.h, FLOOR_RATIO, topReserve);
    const tiles = [];

    for (const [key, cfg] of scenes) {
      // Les vignettes n'ont pas de particules dans l'app (BackgroundThumb les désactive).
      const svg = composeSceneSvg(cfg, g, { scope: key, guides, ambientPhase: size.id === 'thumb' ? null : ambientPhase });
      const file = new URL(`${size.id}--${key}.png`, OUT_DIR);
      await writeFile(file, png(svg, size.w, size.h, size.scale));
      tiles.push({ key, cfg });
      count++;
    }

    if (tiles.length > 1) await contactSheet(tiles, g, size);
  }

  console.log(`${count} rendus → ${OUT_DIR.pathname}`);
}

// La planche-contact est l'image qu'on juge vraiment : « ces décors font-ils famille ? »
async function contactSheet(tiles, g, size) {
  const cols = 3;
  const rows = Math.ceil(tiles.length / cols);
  const pad = 14;
  const label = 26;
  const cellW = g.w;
  const cellH = g.h + label;
  const W = cols * cellW + (cols + 1) * pad;
  const H = rows * cellH + (rows + 1) * pad;

  const body = tiles
    .map(({ key, cfg }, i) => {
      const x = pad + (i % cols) * (cellW + pad);
      const y = pad + Math.floor(i / cols) * (cellH + pad);
      const inner = composeSceneSvg(cfg, g, { scope: `c${i}`, guides, ambientPhase: size.id === 'thumb' ? null : ambientPhase })
        .replace(/^<svg[^>]*>/, '')
        .replace(/<\/svg>$/, '');
      // Chaque case est clippée : sans ça, les particules débordent sur la voisine.
      return (
        `<clipPath id="cl${i}"><rect x="${x}" y="${y + label}" width="${g.w}" height="${g.h}"/></clipPath>` +
        `<text x="${x}" y="${y + 17}" font-family="Bangers" font-size="19" fill="#16161D">${key}</text>` +
        `<g clip-path="url(#cl${i})"><g transform="translate(${x},${y + label})">${inner}</g></g>` +
        `<rect x="${x}" y="${y + label}" width="${g.w}" height="${g.h}" fill="none" stroke="#16161D" stroke-width="3"/>`
      );
    })
    .join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="#FFFFFF"/>${body}</svg>`;

  const out = new Resvg(svg, {
    fitTo: { mode: 'width', value: Math.min(1800, W) },
    font: { fontFiles: [new URL('../assets/fonts/Bangers-Regular.ttf', import.meta.url).pathname], loadSystemFonts: false },
  })
    .render()
    .asPng();
  await writeFile(new URL(`_contact--${size.id}.png`, OUT_DIR), out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
