// Vérifie les limites App Store des textes de docs/store/fiche-app-store.md.
// Usage : npm run check:store-copy
import { readFile } from 'node:fs/promises';

const FICHE = new URL('../docs/store/fiche-app-store.md', import.meta.url);
const md = await readFile(FICHE, 'utf8');

// Contenu d'une section « ## Titre … » jusqu'au prochain « ## ».
function section(title) {
  const re = new RegExp(`^## ${title}[^\\n]*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm');
  const m = md.match(re);
  if (!m) throw new Error(`Section introuvable : « ${title} »`);
  return m[1].trim();
}

// Les lignes « > … » d'une section, jointes en un seul texte.
function blockquote(title) {
  const lines = section(title)
    .split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) => l.replace(/^>\s?/, ''));
  return lines.join('\n').trim();
}

const name = blockquote('Nom');
const subtitle = blockquote('Sous-titre');
const promo = blockquote('Texte promotionnel');
const description = section('Description');
const keywords = blockquote('Mots-clés').split('\n')[0];

const words = (s) => s.toLowerCase().split(/[^a-zà-ÿ]+/).filter(Boolean);
const reserved = new Set([...words(name), ...words(subtitle)]);

let failed = false;
function check(label, ok, detail) {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${label} — ${detail}`);
  if (!ok) failed = true;
}

check('Nom ≤ 30', name.length <= 30, `${name.length} car. : « ${name} »`);
check('Sous-titre ≤ 30', subtitle.length <= 30, `${subtitle.length} car. : « ${subtitle} »`);
check('Texte promotionnel ≤ 170', promo.length <= 170, `${promo.length} car.`);
check('Description ≤ 4000', description.length <= 4000, `${description.length} car.`);
check('Mots-clés ≤ 100', keywords.length <= 100, `${keywords.length} car. : « ${keywords} »`);
check('Mots-clés sans espace après virgule', !keywords.includes(', '), 'format « a,b,c »');

const dupes = keywords.split(',').filter((k) => reserved.has(k.trim().toLowerCase()));
check(
  'Mots-clés sans doublon du nom/sous-titre',
  dupes.length === 0,
  dupes.length ? `doublons : ${dupes.join(', ')}` : 'aucun doublon'
);

process.exit(failed ? 1 : 0);
