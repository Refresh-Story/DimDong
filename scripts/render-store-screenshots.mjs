// Compose les screenshots marketing App Store à partir des captures brutes de
// docs/store/screenshots/raw/ : fond palette + trame manga, accroche Bangers,
// capture dans un cadre encré à ombre dure. Usage :
//   npm run render:store-screenshots
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

import { bodyDoc } from '../src/art/dimArt.ts';
import { DEFAULT_DOUGH } from '../src/data/items.ts';

const RAW_DIR = new URL('../docs/store/screenshots/raw/', import.meta.url);
const OUT_DIR = new URL('../docs/store/screenshots/marketing/', import.meta.url);
const FONTS = [
  new URL('../assets/fonts/Bangers-Regular.ttf', import.meta.url).pathname,
  new URL('../assets/fonts/Baloo2-ExtraBold.ttf', import.meta.url).pathname,
];
const BANGERS = 'Bangers';
const BALOO = 'Baloo 2 ExtraBold';

const INK = '#16161D';
const PAPER = '#F5F1E8';
const RED = '#FF4757';
const CYAN = '#36C5F0';
const GOLD = '#F4B740';

// Tailles exigées par App Store Connect (iPhone 6,9" et 6,5").
const SIZES = [
  { dir: '6.9-inch', w: 1320, h: 2868 },
  { dir: '6.5-inch', w: 1284, h: 2778 },
];

// Hauteur de la barre de statut à rogner en haut des captures (px pour une
// capture large de 1320 ; mise à l'échelle pour les autres largeurs).
const STATUS_BAR_CROP = 140;

// headline : lignes Bangers ; les segments { t, accent } passent en couleur d'accent.
const PANELS = [
  {
    id: 'accueil',
    capture: '01-accueil.png',
    bg: RED,
    ink: '#FFFFFF',
    accent: GOLD,
    dots: '#FFFFFF',
    headline: [[{ t: 'Adieu la ' }, { t: 'corvée', accent: true }], [{ t: 'du brossage !' }]],
    subline: 'Dim transforme 2 minutes en jeu',
    sublineColor: PAPER,
    garnish: 'petals',
    tilt: 0,
  },
  {
    id: 'brossage',
    capture: '02-brossage.png',
    bg: PAPER,
    ink: INK,
    accent: RED,
    dots: INK,
    headline: [[{ t: '2 minutes', accent: true }, { t: ' qui passent' }], [{ t: 'trop vite !' }]],
    subline: 'La durée recommandée par les dentistes',
    sublineColor: INK,
    garnish: 'speed',
    tilt: -1.6,
  },
  {
    id: 'boutique',
    capture: '03-boutique.png',
    bg: CYAN,
    ink: INK,
    accent: '#FFFFFF',
    dots: '#FFFFFF',
    headline: [[{ t: 'Des ' }, { t: 'gemmes', accent: true }], [{ t: 'à chaque brossage' }]],
    subline: '32 objets à collectionner',
    sublineColor: INK,
    garnish: 'gems',
    tilt: 1.6,
  },
  {
    id: 'parcours',
    capture: '04-parcours.png',
    bg: GOLD,
    ink: INK,
    accent: '#FFFFFF',
    dots: INK,
    headline: [[{ t: 'De la ceinture' }], [{ t: 'blanche', accent: true }, { t: ' à la noire !' }]],
    subline: 'Progresse comme un vrai judoka',
    sublineColor: INK,
    garnish: 'belts',
    tilt: 0,
  },
  {
    id: 'parents',
    capture: null,
    bg: PAPER,
    ink: INK,
    accent: RED,
    dots: INK,
    headline: [[{ t: 'Pensé pour' }], [{ t: 'les ' }, { t: 'parents', accent: true }]],
    subline: 'Tout se gagne en se brossant les dents',
    sublineColor: INK,
    garnish: null,
    tilt: 0,
  },
];

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function headlineText(lines, { x, y, fs, fill, accent }) {
  return lines
    .map((segments, i) => {
      const spans = segments
        .map((s) => `<tspan${s.accent ? ` fill="${accent}"` : ''}>${esc(s.t)}</tspan>`)
        .join('');
      return (
        `<text x="${x}" y="${y + i * fs * 1.04}" text-anchor="middle" font-family="${BANGERS}" ` +
        `font-size="${fs}" fill="${fill}" letter-spacing="2">${spans}</text>`
      );
    })
    .join('');
}

function screentone(id, color, W) {
  const step = W * 0.036;
  const r = W * 0.0045;
  return (
    `<pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">` +
    `<circle cx="${step / 2}" cy="${step / 2}" r="${r}" fill="${color}" opacity="0.09"/>` +
    `</pattern>`
  );
}

// --- Garnitures : petits éléments décoratifs autour de la zone d'accroche ---
function petal(x, y, s, rot, fill, opacity) {
  return (
    `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})" opacity="${opacity}">` +
    `<path d="M0 -14 C8 -8 8 4 0 14 C-8 4 -8 -8 0 -14 Z" fill="${fill}"/>` +
    `</g>`
  );
}

function gem(x, y, s, fill, opacity) {
  return (
    `<g transform="translate(${x},${y}) scale(${s})" opacity="${opacity}">` +
    `<path d="M0 -13 L11 0 L0 13 L-11 0 Z" fill="${fill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M-4 -3 L1 -8" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>` +
    `</g>`
  );
}

const BELT_COLORS = ['#ECECEC', '#F4D23C', '#E8852B', '#3DA45A', '#2F73CC', '#7A4A24', '#22222A'];

function garnish(kind, W, H) {
  const y0 = H * 0.02;
  const y1 = H * 0.17;
  switch (kind) {
    case 'petals':
      return (
        petal(W * 0.07, y0 + H * 0.03, 2.6, -25, '#FFFFFF', 0.5) +
        petal(W * 0.13, y1 - H * 0.02, 2, 40, '#FFFFFF', 0.35) +
        petal(W * 0.9, y0 + H * 0.02, 2.2, 15, '#FFFFFF', 0.45) +
        petal(W * 0.94, y1 - H * 0.03, 2.8, -50, '#FFFFFF', 0.35)
      );
    case 'speed': {
      let out = '';
      for (let i = 0; i < 5; i++) {
        const y = y0 + (i / 4) * (y1 - y0);
        const len = W * (0.05 + 0.03 * ((i * 7) % 3));
        out +=
          `<path d="M0 ${y} h${len}" stroke="${INK}" stroke-width="${W * 0.006}" stroke-linecap="round" opacity="0.5"/>` +
          `<path d="M${W} ${y + H * 0.012} h-${len}" stroke="${INK}" stroke-width="${W * 0.006}" stroke-linecap="round" opacity="0.5"/>`;
      }
      return out;
    }
    case 'gems':
      return (
        gem(W * 0.08, y0 + H * 0.035, 3, '#FFFFFF', 0.9) +
        gem(W * 0.14, y1 - H * 0.02, 2.2, '#FFFFFF', 0.7) +
        gem(W * 0.9, y0 + H * 0.025, 2.6, '#FFFFFF', 0.85) +
        gem(W * 0.93, y1 - H * 0.025, 2, '#FFFFFF', 0.7)
      );
    case 'belts':
      return BELT_COLORS.map((c, i) => {
        const x = W * (0.5 + (i - 3) * 0.115);
        return (
          `<circle cx="${x}" cy="${H * 0.026}" r="${W * 0.018}" fill="${c}" ` +
          `stroke="${INK}" stroke-width="${W * 0.005}"/>`
        );
      }).join('');
    default:
      return '';
  }
}

// Capture dans un cadre arrondi encré, ombre dure, barre de statut rognée.
function framedCapture(png, { W, H, tilt }) {
  const { w: rawW } = pngSize(png);
  const frameW = W * 0.84;
  const frameH = H * 0.755;
  const frameX = (W - frameW) / 2;
  const frameY = H * 0.2;
  const rx = W * 0.05;
  const stroke = W * 0.009;
  const shadow = W * 0.014;
  const scale = frameW / rawW;
  const crop = STATUS_BAR_CROP * (rawW / 1320) * scale;
  const imgH = pngSize(png).h * scale;
  const href = `data:image/png;base64,${png.toString('base64')}`;
  const cx = frameX + frameW / 2;
  const cy = frameY + frameH / 2;
  return (
    `<g transform="rotate(${tilt} ${cx} ${cy})">` +
    `<rect x="${frameX + shadow}" y="${frameY + shadow}" width="${frameW}" height="${frameH}" rx="${rx}" fill="${INK}"/>` +
    `<clipPath id="frame"><rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${rx}"/></clipPath>` +
    `<g clip-path="url(#frame)">` +
    `<rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" fill="${PAPER}"/>` +
    `<image x="${frameX}" y="${frameY - crop}" width="${frameW}" height="${imgH}" href="${href}" preserveAspectRatio="xMidYMin meet"/>` +
    `</g>` +
    `<rect x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" rx="${rx}" fill="none" stroke="${INK}" stroke-width="${stroke}"/>` +
    `</g>`
  );
}

// Panneau « parents » : badges 0 pub / 0 achat / 0 compte + Dim serein.
function parentsBody({ W, H }) {
  const pills = [
    { t: '0 publicité', bg: RED, fg: '#FFFFFF' },
    { t: '0 achat intégré', bg: CYAN, fg: INK },
    { t: '0 compte à créer', bg: GOLD, fg: INK },
  ];
  const pillW = W * 0.74;
  const pillH = H * 0.082;
  const gap = H * 0.035;
  const startY = H * 0.24;
  const rx = pillH / 2;
  const stroke = W * 0.007;
  const shadow = W * 0.011;
  let out = '';
  pills.forEach((p, i) => {
    const x = (W - pillW) / 2;
    const y = startY + i * (pillH + gap);
    out +=
      `<rect x="${x + shadow}" y="${y + shadow}" width="${pillW}" height="${pillH}" rx="${rx}" fill="${INK}"/>` +
      `<rect x="${x}" y="${y}" width="${pillW}" height="${pillH}" rx="${rx}" fill="${p.bg}" stroke="${INK}" stroke-width="${stroke}"/>` +
      `<text x="${W / 2}" y="${y + pillH * 0.68}" text-anchor="middle" font-family="${BANGERS}" ` +
      `font-size="${pillH * 0.52}" fill="${p.fg}" letter-spacing="2">${esc(p.t)}</text>`;
  });
  out +=
    `<text x="${W / 2}" y="${startY + 3 * (pillH + gap) + H * 0.02}" text-anchor="middle" ` +
    `font-family="${BALOO}" font-size="${W * 0.042}" fill="${INK}">100 % hors ligne, données sur l'appareil</text>`;
  const dimW = W * 0.52;
  const dimH = (dimW * 260) / 200;
  const dim = bodyDoc(DEFAULT_DOUGH, { emotion: 'serene', id: 'par' }).replace(
    'viewBox="0 0 200 260"',
    `viewBox="0 0 200 260" x="${(W - dimW) / 2}" y="${H - dimH - H * 0.025}" width="${dimW}" height="${dimH}"`
  );
  return out + dim;
}

function panelSvg(panel, { w: W, h: H }, captures) {
  const fsHead = W * 0.098;
  const headY = H * 0.052;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`,
    `<defs>${screentone('tone', panel.dots, W)}</defs>`,
    `<rect width="${W}" height="${H}" fill="${panel.bg}"/>`,
    `<rect width="${W}" height="${H}" fill="url(#tone)"/>`,
    garnish(panel.garnish, W, H),
    headlineText(panel.headline, { x: W / 2, y: headY + fsHead, fs: fsHead, fill: panel.ink, accent: panel.accent }),
    `<text x="${W / 2}" y="${headY + fsHead * (panel.headline.length + 0.35) + W * 0.028}" text-anchor="middle" ` +
      `font-family="${BALOO}" font-size="${W * 0.043}" fill="${panel.sublineColor}">${esc(panel.subline)}</text>`,
    panel.capture ? framedCapture(captures[panel.capture], { W, H, tilt: panel.tilt }) : parentsBody({ W, H }),
    `</svg>`,
  ];
  return parts.join('');
}

function render(svg, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: BANGERS },
  });
  return resvg.render().asPng();
}

async function main() {
  const captures = {};
  for (const p of PANELS) {
    if (p.capture) captures[p.capture] = await readFile(new URL(p.capture, RAW_DIR));
  }
  for (const size of SIZES) {
    const dir = new URL(`${size.dir}/`, OUT_DIR);
    await mkdir(dir, { recursive: true });
    let i = 0;
    for (const panel of PANELS) {
      i += 1;
      const png = render(panelSvg(panel, size, captures), size.w);
      const { w, h } = pngSize(png);
      if (w !== size.w || h !== size.h) {
        throw new Error(`${size.dir}/${panel.id} : ${w}×${h} au lieu de ${size.w}×${size.h}`);
      }
      const name = `0${i}-${panel.id}.png`;
      await writeFile(new URL(name, dir), png);
      console.log(`✓ marketing/${size.dir}/${name} (${w}×${h}, ${(png.length / 1024).toFixed(0)} Ko)`);
    }
  }
}

await main();
