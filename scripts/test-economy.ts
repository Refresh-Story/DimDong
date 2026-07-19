const assert = {
  ok(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg);
  },
};

import { FALLBACK_CATALOG, getItemById } from '@/data/items';
import { DEFAULT_PLAYER, brush, buy, equip, grant, selectBelt, setEmotion, toggleDecor, unequip } from '@/game/economy';
import { SENSEI_BELT, beltForLevel, beltForPlayer, dayKey, earnedBelts, isSenseiName } from '@/game/rules';

const item = (id: string) => {
  const it = getItemById(FALLBACK_CATALOG, id);
  if (!it) throw new Error(`item introuvable: ${id}`);
  return it;
};

let pass = 0;
function check(label: string, cond: boolean) {
  assert.ok(cond, `ÉCHEC: ${label}`);
  console.log(`  ✓ ${label}`);
  pass++;
}

console.log('--- Achat ---');
const cap = item('cap_red'); // 20 gemmes
let p = { ...DEFAULT_PLAYER }; // 30 gemmes au départ
check(`départ à ${p.gems} gemmes`, p.gems === 30);

let r = buy(p, cap);
check("achat casquette (20) → status 'ok'", r.status === 'ok');
check('gemmes débitées : 30 - 20 = 10', r.player.gems === 10);
check('objet ajouté à l’inventaire', r.player.ownedItems.includes('cap_red'));
p = r.player;

r = buy(p, cap);
check("racheter le même → 'owned' (pas de double débit)", r.status === 'owned' && r.player.gems === 10);

const gold = item('color_gold'); // 120 gemmes
r = buy(p, gold);
check("achat trop cher (120 > 10) → 'insufficient'", r.status === 'insufficient');
check('solde inchangé après refus', r.player.gems === 10);

const rainbow = item('color_rainbow'); // 500 gemmes, légendaire
check('Rainbow est bien légendaire + rainbow + 500', rainbow.rarity === 'legendary' && rainbow.rainbow === true && rainbow.price === 500);
r = buy({ ...DEFAULT_PLAYER }, rainbow);
check("Rainbow inabordable au départ → 'insufficient'", r.status === 'insufficient');
r = buy({ ...DEFAULT_PLAYER, gems: 500 }, rainbow);
check('Rainbow achetée avec 500 → ok, solde 0', r.status === 'ok' && r.player.gems === 0 && r.player.ownedItems.includes('color_rainbow'));

console.log('--- Secret (déblocage gratuit) ---');
const g = grant({ ...DEFAULT_PLAYER }, rainbow);
check('grant : Rainbow obtenue sans payer (gemmes inchangées)', g.gems === 30 && g.ownedItems.includes('color_rainbow'));
const g2 = grant(g, rainbow);
check('grant : pas de doublon si déjà possédée', g2.ownedItems.filter((id) => id === 'color_rainbow').length === 1);

console.log('--- Brossage (récompense à chaque brossage, sans plafond) ---');
const today = dayKey(new Date());
let q = { ...DEFAULT_PLAYER };
let b = brush(q, today);
check('1er brossage récompensé (+10)', b.result.gained === 10 && b.player.gems === 40);
q = b.player;
b = brush(q, today);
check('2e brossage récompensé (+10) → 50', b.result.gained === 10 && b.player.gems === 50);
q = b.player;
b = brush(q, today);
check('3e brossage le même jour → toujours récompensé (+10) → 60', b.result.gained === 10 && b.player.gems === 60);
check('le brossage est compté (totalBrushes = 3)', b.player.totalBrushes === 3);
check('chaque brossage donne 1 XP', b.player.xp === 3);
q = b.player;
b = brush(q, '2099-01-01'); // nouveau jour
check('nouveau jour → récompensé aussi', b.result.gained === 10 && b.player.gems === 70);

console.log('--- Équipement / décor ---');
let e = equip({ ...DEFAULT_PLAYER }, cap);
check('équiper la casquette', e.equipped.hat === 'cap_red');
e = unequip(e, 'hat');
check('déséquiper la casquette', e.equipped.hat === undefined);
const bonsai = item('decor_bonsai');
let d = toggleDecor({ ...DEFAULT_PLAYER }, bonsai);
check('placer le bonsaï', d.placedDecor.includes('decor_bonsai'));
d = toggleDecor(d, bonsai);
check('retirer le bonsaï', !d.placedDecor.includes('decor_bonsai'));

console.log('--- Décors de fond ---');
const backgrounds = FALLBACK_CATALOG.filter((i) => i.category === 'background');
check('8 décors de fond au catalogue', backgrounds.length === 8);
check('chaque décor a une clé `background` unique', new Set(backgrounds.map((i) => i.background)).size === 8 && backgrounds.every((i) => !!i.background));
check('prix entre 80 et 400 gemmes', backgrounds.every((i) => i.price >= 80 && i.price <= 400));

const bgBamboo = item('bg_bamboo'); // 80 gemmes
const bgDojo = item('bg_dojo');
r = buy({ ...DEFAULT_PLAYER, gems: 100 }, bgBamboo);
check('achat forêt de bambous (80) → ok, solde 20', r.status === 'ok' && r.player.gems === 20 && r.player.ownedItems.includes('bg_bamboo'));

let f = equip({ ...DEFAULT_PLAYER }, bgBamboo);
check('activer un décor de fond', f.equipped.background === 'bg_bamboo');
f = equip(f, bgDojo);
check('activer un 2e décor remplace le 1er (un seul actif)', f.equipped.background === 'bg_dojo');
f = unequip(f, 'background');
check('désactiver → retour au décor par défaut', f.equipped.background === undefined);

const kimono = item('kimono_judo');
f = equip(equip({ ...DEFAULT_PLAYER }, kimono), bgBamboo);
check('activer un décor ne retire pas le kimono', f.equipped.kimono === 'kimono_judo' && f.equipped.background === 'bg_bamboo');
f = equip(equip({ ...DEFAULT_PLAYER }, bgBamboo), kimono);
check('équiper le kimono ne retire pas le décor', f.equipped.background === 'bg_bamboo' && f.equipped.kimono === 'kimono_judo');
f = equip(equip({ ...DEFAULT_PLAYER }, cap), bgBamboo);
check('activer un décor ne touche pas au chapeau', f.equipped.hat === 'cap_red' && f.equipped.background === 'bg_bamboo');
f = equip({ ...DEFAULT_PLAYER, equipped: { hat: 'cap_red', background: 'bg_bamboo' } }, kimono);
check('le kimono retire bien le chapeau mais garde le décor', f.equipped.hat === undefined && f.equipped.background === 'bg_bamboo');

console.log('--- Ceintures (une tous les 3 niveaux) ---');
check('niveaux 1 à 3 → Blanche', [1, 2, 3].every((l) => beltForLevel(l).label === 'Blanche'));
check('niveaux 4 à 6 → Jaune', [4, 5, 6].every((l) => beltForLevel(l).label === 'Jaune'));
check('niveaux 7 à 9 → Orange', [7, 8, 9].every((l) => beltForLevel(l).label === 'Orange'));
check('niveaux 10 à 12 → Verte', [10, 11, 12].every((l) => beltForLevel(l).label === 'Verte'));
check('niveaux 13 à 15 → Bleue', [13, 14, 15].every((l) => beltForLevel(l).label === 'Bleue'));
check('niveaux 16 à 18 → Marron', [16, 17, 18].every((l) => beltForLevel(l).label === 'Marron'));
check('niveau 19 et au-delà → Noire', [19, 25, 100].every((l) => beltForLevel(l).label === 'Noire'));

console.log('--- Ceinture Sensei + sélection ---');
check('« sensei » détecté quelle que soit la casse', ['Sensei', 'SENSEI', 'DimSensei', 'sEnSeI'].every(isSenseiName));
check("'Dim' n'active pas la ceinture Sensei", !isSenseiName('Dim'));
check('la ceinture Sensei est noire et rouge', SENSEI_BELT.color === '#22222A' && SENSEI_BELT.accent === '#C62828');
check('niveau 1 → 1 ceinture obtenue', earnedBelts(1).length === 1);
check('niveau 7 → 3 ceintures obtenues', earnedBelts(7).length === 3);
check('niveau 19 → les 7 ceintures', earnedBelts(19).length === 7);

const lvl7 = { ...DEFAULT_PLAYER, xp: 24 }; // niveau 7
let s = selectBelt(lvl7, 'Blanche');
check('sélectionner une ceinture obtenue', s.selectedBelt === 'Blanche');
s = selectBelt(s, 'Noire');
check('ceinture non obtenue → refusée', s.selectedBelt === 'Blanche');
s = selectBelt(s, 'Turquoise');
check('label inconnu → refusé', s.selectedBelt === 'Blanche');
check('même sélection → même objet (aucune écriture inutile)', selectBelt(s, 'Blanche') === s);
s = selectBelt(s, null);
check('null → retour à la ceinture du niveau', s.selectedBelt === null);

check('beltForPlayer : ceinture du niveau par défaut', beltForPlayer('Dim', 7, null).label === 'Orange');
check('beltForPlayer : la sélection prime sur le niveau', beltForPlayer('Dim', 7, 'Jaune').label === 'Jaune');
check('beltForPlayer : sélection non obtenue ignorée', beltForPlayer('Dim', 7, 'Noire').label === 'Orange');
check('beltForPlayer : Sensei prime sur tout', beltForPlayer('Dim Sensei', 7, 'Jaune') === SENSEI_BELT);

console.log('--- Émotions ---');
const base = { ...DEFAULT_PLAYER };
check("émotion par défaut : 'joy'", base.emotion === 'joy');
const em = setEmotion(base, 'sad');
check("changer d'émotion est gratuit (gemmes inchangées)", em.emotion === 'sad' && em.gems === base.gems);
check('même émotion → même objet (aucune écriture inutile)', setEmotion(em, 'sad') === em);

console.log(`\n✅ ${pass} vérifications réussies.`);
