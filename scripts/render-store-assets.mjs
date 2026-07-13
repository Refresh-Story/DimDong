// Génère les assets de publication (icône, splash, favicon, icônes Android)
// à partir du dessin SVG de Dim. Usage :
//   node --experimental-strip-types scripts/render-store-assets.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

import { BODY_PATH, bodyDoc } from '../src/art/dimArt.ts';
import { DEFAULT_DOUGH } from '../src/data/items.ts';

const OUT_DIR = new URL('../assets/images/', import.meta.url);
const ICON_COMPOSER_DIR = new URL('../assets/expo.icon/Assets/', import.meta.url);
const BANGERS = new URL('../assets/fonts/Bangers-Regular.ttf', import.meta.url);

const INK = '#16161D';
const RED = '#FF4757'; // Palette.primary
const PAPER = '#F5F1E8'; // Palette.paper

// Cadrage carré sur la tête (couronne + visage) dans le repère 200×260 du dessin.
const HEAD = { x: 13, y: 38, s: 174 };
const HEAD_VIEWBOX = `${HEAD.x} ${HEAD.y} ${HEAD.s} ${HEAD.s}`;

const XMLNS = 'xmlns="http://www.w3.org/2000/svg"';

function headSvg(id, { x = 0, y = 0, size }) {
  return bodyDoc(DEFAULT_DOUGH, { emotion: 'joy', id }).replace(
    'viewBox="0 0 200 260"',
    `viewBox="${HEAD_VIEWBOX}" x="${x}" y="${y}" width="${size}" height="${size}"`
  );
}

function fullBodySvg(id, { x = 0, y = 0, width }) {
  const height = (width * 260) / 200;
  return bodyDoc(DEFAULT_DOUGH, { emotion: 'joy', id }).replace(
    'viewBox="0 0 200 260"',
    `viewBox="0 0 200 260" x="${x}" y="${y}" width="${width}" height="${height}"`
  );
}

function render(svg, width, opts = {}) {
  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,0)',
    fitTo: { mode: 'width', value: width },
    ...opts,
  });
  return resvg.render().asPng();
}

// --- Icône principale : tête de Dim plein cadre sur fond uni ---
function iconSvg(bg) {
  return (
    `<svg ${XMLNS} viewBox="0 0 1024 1024">` +
    `<rect width="1024" height="1024" fill="${bg}"/>` +
    headSvg('icn', { size: 1024 }) +
    `</svg>`
  );
}

// --- Adaptive Android : le masque rond ne montre que ~66 % du canvas ;
// la tête déborde de la zone visible pour que ses bords coupés restent cachés. ---
const FG_SIZE = 820;
const FG_OFFSET = (1024 - FG_SIZE) / 2;
const foregroundSvg =
  `<svg ${XMLNS} viewBox="0 0 1024 1024">` +
  headSvg('fg', { x: FG_OFFSET, y: FG_OFFSET, size: FG_SIZE }) +
  `</svg>`;

const backgroundSvg = `<svg ${XMLNS} viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${RED}"/></svg>`;

// --- Monochrome Android 13+ : silhouette blanche, yeux/bouche évidés ---
const CROWN_T = 'translate(100,80) scale(0.6) translate(-100,-80)';
const monochromeSvg =
  `<svg ${XMLNS} viewBox="0 0 1024 1024">` +
  `<defs><mask id="mono">` +
  `<g transform="translate(${FG_OFFSET},${FG_OFFSET}) scale(${FG_SIZE / HEAD.s}) translate(${-HEAD.x},${-HEAD.y})">` +
  `<path d="${BODY_PATH}" fill="#FFF" stroke="#FFF" stroke-width="6"/>` +
  `<g transform="${CROWN_T}" fill="#FFF" stroke="#FFF" stroke-width="6" stroke-linejoin="round">` +
  `<path d="M70 82 Q68 54 100 48 Q132 54 130 82 Z"/>` +
  `<path d="M100 44 Q113 47 109 60 Q100 55 95 63 Q90 49 100 44 Z"/>` +
  `</g>` +
  `<ellipse cx="76" cy="150" rx="13" ry="17" fill="#000"/>` +
  `<ellipse cx="124" cy="150" rx="13" ry="17" fill="#000"/>` +
  `<path d="M88 176 Q100 192 112 176 Q100 184 88 176 Z" fill="#000" stroke="#000" stroke-width="4"/>` +
  `</g>` +
  `</mask></defs>` +
  `<rect width="1024" height="1024" fill="#FFF" mask="url(#mono)"/>` +
  `</svg>`;

// --- Splash : Dim en pied + logotype « Dim-Dong » ---
const splashSvg =
  `<svg ${XMLNS} viewBox="0 0 260 392">` +
  fullBodySvg('spl', { x: 30, y: 6, width: 200 }) +
  `<text x="130" y="366" text-anchor="middle" font-family="Bangers" font-size="62" fill="${INK}" letter-spacing="2">Dim-Dong</text>` +
  `</svg>`;

// --- SVG plat pour Icon Composer (iOS 26) : sans clipPath ni surbrillance ---
function iconComposerSvg() {
  const doc = bodyDoc(DEFAULT_DOUGH, { emotion: 'joy', id: 'ic' });
  return doc
    .replace(
      'viewBox="0 0 200 260"',
      // width/height explicites : sans eux Icon Composer rend le SVG à sa
      // taille intrinsèque (174 pt), minuscule au centre du canvas 1024.
      `viewBox="${HEAD_VIEWBOX}" width="1024" height="1024"`
    )
    .replace(/<defs>.*?<\/defs>/, '')
    .replace(/<g clip-path="[^"]*">.*?<\/g>/, '');
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = [
    ['icon.png', render(iconSvg(RED), 1024)],
    ['favicon.png', render(iconSvg(RED), 48)],
    ['android-icon-foreground.png', render(foregroundSvg, 512)],
    ['android-icon-background.png', render(backgroundSvg, 512)],
    ['android-icon-monochrome.png', render(monochromeSvg, 432)],
    [
      'splash-icon.png',
      render(splashSvg, 1024, {
        font: { fontFiles: [BANGERS.pathname], loadSystemFonts: false, defaultFontFamily: 'Bangers' },
      }),
    ],
  ];
  for (const [name, png] of files) {
    await writeFile(new URL(name, OUT_DIR), png);
    console.log(`✓ assets/images/${name} (${(png.length / 1024).toFixed(0)} Ko)`);
  }
  await writeFile(new URL('dim-head.svg', ICON_COMPOSER_DIR), iconComposerSvg());
  console.log('✓ assets/expo.icon/Assets/dim-head.svg');

  if (process.argv.includes('--variants')) {
    const dir = process.argv[process.argv.indexOf('--variants') + 1] ?? '.';
    await writeFile(`${dir}/icon-paper.png`, render(iconSvg(PAPER), 512));
    await writeFile(`${dir}/icon-red.png`, render(iconSvg(RED), 512));
    console.log(`✓ variantes de fond écrites dans ${dir}`);
  }
}

await main();
