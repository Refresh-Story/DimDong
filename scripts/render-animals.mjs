// Rendu de validation des compagnons chibi : chaque animal (yeux ouverts + clignement)
// et une planche-contact pour juger la famille d'un coup d'œil.
//
// Lancement : npx tsx scripts/render-animals.mjs
// (volontairement pas de script npm : `package.json.scripts` fait partie de
// l'empreinte runtimeVersion — cf. docs/visuels-ia.md.)
// Sortie : scripts/animal-png/ (ignoré via .git/info/exclude).
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ANIMAL_FRAME, animalDoc } from '../src/art/dimArt.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'animal-png');
mkdirSync(OUT, { recursive: true });

// Miroir du futur catalogue : (kind, pelage).
const ANIMALS = [
  ['cat', '#F0A35E'],
  ['dog', '#C89066'],
  ['monkey', '#A9744F'],
  ['panda', '#F4F1EA'],
  ['tiger', '#F19A3E'],
];

const PAPER = '#F5F1E8';

function inner(doc) {
  return doc.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

function renderPng(svgDoc, width, file) {
  const png = new Resvg(svgDoc, { fitTo: { mode: 'width', value: width } }).render().asPng();
  writeFileSync(join(OUT, file), png);
  console.log(`  ${file}`);
}

const { w: FW, h: FH } = ANIMAL_FRAME;

for (const [kind, color] of ANIMALS) {
  for (const blink of [false, true]) {
    const doc =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${FW} ${FH}">` +
      `<rect width="${FW}" height="${FH}" fill="${PAPER}"/>` +
      inner(animalDoc(kind, color, { blink })) +
      `</svg>`;
    renderPng(doc, 400, `${kind}${blink ? '--blink' : ''}.png`);
  }
}

// Planche-contact : rangée yeux ouverts, rangée clignement.
const cols = ANIMALS.length;
let sheet = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * FW} ${2 * FH}">`;
sheet += `<rect width="${cols * FW}" height="${2 * FH}" fill="${PAPER}"/>`;
ANIMALS.forEach(([kind, color], i) => {
  for (const [row, blink] of [[0, false], [1, true]]) {
    sheet += `<g transform="translate(${i * FW},${row * FH})">${inner(animalDoc(kind, color, { blink }))}</g>`;
  }
});
sheet += `</svg>`;
renderPng(sheet, cols * 300, '_contact.png');
console.log('done');
