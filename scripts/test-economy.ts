const assert = {
  ok(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg);
  },
};

import { accessoryInner } from '@/art/dimArt';
import { CATEGORY_LABELS, CATEGORY_ORDER, FALLBACK_CATALOG, Z, actionVerbs, getItemById } from '@/data/items';
import {
  DEFAULT_PLAYER,
  brush,
  buy,
  canSell,
  equip,
  grant,
  migrateEquipped,
  selectBelt,
  sell,
  setEmotion,
  toggleDecor,
  unequip,
  unlockSecret,
} from '@/game/economy';
import {
  EMPTY_PROFILES,
  MAX_PROFILES,
  addProfile,
  canCreateProfile,
  getProfile,
  migrateLegacyPlayer,
  removeProfile,
  updateProfile,
} from '@/game/profiles';
import { SENSEI_BELT, availableBelts, beltForLevel, beltForPlayer, dayKey, earnedBelts, isSenseiName } from '@/game/rules';

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

console.log('--- Revente ---');
const glasses = item('glasses_nerd'); // 20 gemmes
const bonsaiItem = item('decor_bonsai');
const bgItem = item('bg_bamboo'); // 80 gemmes
const kimonoItem = item('kimono_judo'); // offert, 0 gemme

check('le kimono offert n’est pas revendable', !canSell(kimonoItem));
check('un objet payant est revendable', canSell(cap) && canSell(rainbow));

let v = buy({ ...DEFAULT_PLAYER }, cap).player; // 30 → 10 gemmes
let sr = sell(v, cap);
check("revente d’un objet possédé → 'ok'", sr.status === 'ok');
check('achat puis revente : solde de départ retrouvé (30)', sr.player.gems === 30);
check('l’objet quitte l’inventaire', !sr.player.ownedItems.includes('cap_red'));

sr = sell(equip(v, cap), cap);
check('revendre un objet équipé le déséquipe', sr.player.equipped.head === undefined);

sr = sell(equip(equip(buy(v, glasses).player, cap), glasses), cap);
check('revendre n’affecte pas les autres emplacements', sr.player.equipped.glasses === 'glasses_nerd');

sr = sell(toggleDecor(buy({ ...DEFAULT_PLAYER, gems: 100 }, bonsaiItem).player, bonsaiItem), bonsaiItem);
check('revendre une décoration la retire de la scène', !sr.player.placedDecor.includes('decor_bonsai'));

sr = sell(equip(buy({ ...DEFAULT_PLAYER, gems: 100 }, bgItem).player, bgItem), bgItem);
check('revendre le décor de fond actif le désactive', sr.player.equipped.background === undefined);

const noCap = { ...DEFAULT_PLAYER };
sr = sell(noCap, cap);
check("revendre un objet non possédé → 'not-owned'", sr.status === 'not-owned');
check('refus → joueur inchangé (aucune écriture)', sr.player === noCap);

const withKimono = { ...DEFAULT_PLAYER };
sr = sell(withKimono, kimonoItem);
check("revendre le kimono offert → 'protected'", sr.status === 'protected');
check('kimono : solde inchangé et objet conservé', sr.player === withKimono);

console.log('--- Secret : une seule fois par profil ---');
check('un profil neuf n’a pas encore joué le secret', DEFAULT_PLAYER.secretUsed === false);

let sec = unlockSecret({ ...DEFAULT_PLAYER }, rainbow);
check("secret sur profil neuf → 'ok'", sec.status === 'ok');
check('Rainbow offerte sans dépenser de gemmes', sec.player.gems === 30 && sec.player.ownedItems.includes('color_rainbow'));
check('le secret est consommé', sec.player.secretUsed === true);

const secOnce = sec.player;
sec = unlockSecret(secOnce, rainbow);
check("second appel → 'used'", sec.status === 'used');
check('refus → joueur inchangé', sec.player === secOnce);

// La faille que la revente ouvrirait : offert → revendu (+500) → à nouveau offert.
const soldGift = sell(secOnce, rainbow);
check('la Rainbow offerte se revend 500 (30 → 530)', soldGift.status === 'ok' && soldGift.player.gems === 530);
check("revendre ne rouvre pas le secret → 'used'", unlockSecret(soldGift.player, rainbow).status === 'used');

// L'autre faille : achetée 500 → revendue 500 (neutre) → le secret l'offrirait gratuitement.
const bought = buy({ ...DEFAULT_PLAYER, gems: 500 }, rainbow).player;
check('acheter la Rainbow consomme aussi le secret', bought.secretUsed === true);
const boughtThenSold = sell(bought, rainbow);
check('achat puis revente : opération neutre (0 → 500)', boughtThenSold.player.gems === 500);
check("achat puis revente ne rend pas le secret → 'used'", unlockSecret(boughtThenSold.player, rainbow).status === 'used');

check(
  "secret sur un joueur qui possède déjà la Rainbow sans le drapeau → 'owned'",
  unlockSecret(grant({ ...DEFAULT_PLAYER }, rainbow), rainbow).status === 'owned'
);
check('acheter un objet ordinaire ne consomme pas le secret', buy({ ...DEFAULT_PLAYER }, cap).player.secretUsed === false);

console.log('--- Verbes d’action ---');
check('décoration → Placer / Retirer', actionVerbs('decor').on === 'Placer' && actionVerbs('decor').off === 'Retirer');
check('décor de fond → Activer / Désactiver', actionVerbs('background').on === 'Activer' && actionVerbs('background').off === 'Désactiver');
check('objet porté → Équiper / Retirer', actionVerbs('head').on === 'Équiper' && actionVerbs('kimono').off === 'Retirer');

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
check('équiper la casquette', e.equipped.head === 'cap_red');
e = unequip(e, 'head');
check('déséquiper la casquette', e.equipped.head === undefined);
const bonsai = item('decor_bonsai');
let d = toggleDecor({ ...DEFAULT_PLAYER }, bonsai);
check('placer le bonsaï', d.placedDecor.includes('decor_bonsai'));
d = toggleDecor(d, bonsai);
check('retirer le bonsaï', !d.placedDecor.includes('decor_bonsai'));

console.log('--- Regroupement par emplacement (pas de superposition) ---');
const crown = item('crown_gold');
const tuft = item('hair_purple');
const bowtie = item('bowtie_pink');
const scarf = item('scarf_teal');
const cape = item('cape_hero');
const katanas = item('katana_duo');

check('chapeaux et mèches partagent l’emplacement « Tête »', [cap, crown, tuft].every((i) => i.category === 'head'));
let h = equip(equip({ ...DEFAULT_PLAYER }, cap), tuft);
check('la mèche remplace la casquette (un seul objet sur la tête)', h.equipped.head === 'hair_purple');
h = equip(h, crown);
check('la couronne remplace la mèche', h.equipped.head === 'crown_gold');
check('rien d’autre n’a été porté au passage', Object.keys(h.equipped).join(',') === 'head');

let a = equip(equip({ ...DEFAULT_PLAYER }, bowtie), scarf);
check('l’écharpe remplace le nœud papillon (emplacement « Cou »)', a.equipped.neck === 'scarf_teal');
a = equip(a, cape);
check('la cape se porte en plus (emplacement « Dos »)', a.equipped.neck === 'scarf_teal' && a.equipped.back === 'cape_hero');
a = equip(a, katanas);
check('les katanas remplacent la cape', a.equipped.back === 'katana_duo' && a.equipped.neck === 'scarf_teal');

check(
  'chaque emplacement du catalogue a au moins un objet',
  CATEGORY_ORDER.every((c) => FALLBACK_CATALOG.some((i) => i.category === c))
);
check(
  'chaque objet a un emplacement affichable',
  FALLBACK_CATALOG.every((i) => CATEGORY_ORDER.includes(i.category) && !!CATEGORY_LABELS[i.category])
);
check('les identifiants du catalogue sont uniques', new Set(FALLBACK_CATALOG.map((i) => i.id)).size === FALLBACK_CATALOG.length);
const OUTFIT_DRAWS = ['kimono', 'ninja', 'samurai'];
check(
  'chaque accessoire dessiné a un rendu (pas de `draw` sans dessin)',
  FALLBACK_CATALOG.filter((i) => i.draw && !OUTFIT_DRAWS.includes(i.draw)).every((i) => accessoryInner(i.draw!, i.color).length > 0)
);

console.log('--- Migration des anciennes sauvegardes ---');
const migrate = (raw: unknown) => migrateEquipped(raw, FALLBACK_CATALOG);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

check('chapeau + mèche → le chapeau est conservé', same(migrate({ hat: 'cap_red', hair: 'hair_purple' }), { head: 'cap_red' }));
check(
  "l'ordre des clés du JSON ne change rien",
  same(migrate({ hair: 'hair_purple', hat: 'cap_red' }), { head: 'cap_red' })
);
check('mèche seule → conservée', same(migrate({ hair: 'hair_orange' }), { head: 'hair_orange' }));
check("l'ancienne catégorie « accessory » se scinde : la cape va au dos", same(migrate({ accessory: 'cape_hero' }), { back: 'cape_hero' }));
check("… et le nœud papillon au cou", same(migrate({ accessory: 'bowtie_pink' }), { neck: 'bowtie_pink' }));
check(
  'kimono, pâte et décor de fond sont conservés tels quels',
  same(migrate({ kimono: 'kimono_judo', color: 'color_gold', background: 'bg_dojo' }), {
    kimono: 'kimono_judo',
    color: 'color_gold',
    background: 'bg_dojo',
  })
);
check('objet disparu du catalogue → ignoré', same(migrate({ hat: 'cap_disparue' }), {}));
check('décoration rangée par erreur dans equipped → ignorée', same(migrate({ decor: 'decor_bonsai' }), {}));
check(
  'entrée illisible → équipement vide',
  [undefined, null, [], 'nawak', 42, { hat: 7 }].every((raw) => same(migrate(raw), {}))
);
const migrated = migrate({ hat: 'cap_red', hair: 'hair_purple', accessory: 'cape_hero', color: 'color_gold' });
check('migration rejouée → résultat identique (idempotente)', same(migrate(migrated), migrated));
check(
  'une sauvegarde déjà migrée traverse sans dommage',
  same(migrate({ head: 'crown_gold', neck: 'scarf_teal', back: 'katana_duo' }), {
    head: 'crown_gold',
    neck: 'scarf_teal',
    back: 'katana_duo',
  })
);

console.log('--- Tenues ---');
const ninja = item('outfit_ninja');
const samurai = item('outfit_samurai');
const outfits = FALLBACK_CATALOG.filter((i) => i.category === 'kimono');
check('3 tenues au catalogue (kimono, ninja, samouraï)', outfits.length === 3);
check('la section s’appelle « Tenues »', CATEGORY_LABELS.kimono === 'Tenues');
check('ninja : 300 gemmes, épique, dessin ninja', ninja.price === 300 && ninja.rarity === 'epic' && ninja.draw === 'ninja');
check('samouraï : 450 gemmes, légendaire, dessin samurai', samurai.price === 450 && samurai.rarity === 'legendary' && samurai.draw === 'samurai');
check('le kimono garde son dessin (la ceinture en dépend)', kimonoItem.draw === 'kimono');
check('les trois tenues partagent le même plan (Z.kimono)', outfits.every((i) => i.zIndex === Z.kimono));
check('les tenues achetées sont revendables, pas le kimono offert', canSell(ninja) && canSell(samurai) && !canSell(kimonoItem));

let t = buy({ ...DEFAULT_PLAYER, gems: 300 }, ninja);
check('achat du ninja (300) → ok, solde 0', t.status === 'ok' && t.player.gems === 0 && t.player.ownedItems.includes('outfit_ninja'));
let tp = equip(t.player, ninja);
check('équiper le ninja occupe l’emplacement tenue', tp.equipped.kimono === 'outfit_ninja');
const ts = sell(tp, ninja);
check(
  'revendre le ninja rend 300 et vide l’emplacement',
  ts.status === 'ok' && ts.player.gems === 300 && ts.player.equipped.kimono === undefined && !ts.player.ownedItems.includes('outfit_ninja')
);

tp = equip({ ...DEFAULT_PLAYER, equipped: { head: 'cap_red', color: 'color_gold', background: 'bg_bamboo' } }, ninja);
check(
  'le ninja retire le chapeau mais garde pâte et décor de fond',
  tp.equipped.head === undefined && tp.equipped.color === 'color_gold' && tp.equipped.background === 'bg_bamboo' && tp.equipped.kimono === 'outfit_ninja'
);
tp = equip(tp, item('kimono_judo'));
check('le kimono remplace le ninja (une seule tenue portée)', tp.equipped.kimono === 'kimono_judo');
tp = equip({ ...DEFAULT_PLAYER, equipped: { kimono: 'outfit_samurai' } }, cape);
check('porter la cape retire la tenue samouraï', tp.equipped.kimono === undefined && tp.equipped.back === 'cape_hero');
check('migration : la clé legacy « outfit » retrouve l’emplacement tenue', same(migrate({ outfit: 'outfit_ninja' }), { kimono: 'outfit_ninja' }));

console.log('--- Animaux (compagnon unique) ---');
const animals = FALLBACK_CATALOG.filter((i) => i.category === 'animal');
const chat = item('animal_cat');
const chien = item('animal_dog');
check('6 compagnons au catalogue', animals.length === 6);
check('la section s’appelle « Animaux »', CATEGORY_LABELS.animal === 'Animaux');
check('chaque compagnon a un dessin `animal` unique', new Set(animals.map((i) => i.animal)).size === 6 && animals.every((i) => !!i.animal));
check('chaque compagnon a sa place dans la scène (x et w)', animals.every((i) => typeof i.x === 'number' && typeof i.w === 'number'));
check(
  'prix et raretés : 80/80/150/200/300/400',
  chat.price === 80 && chat.rarity === 'common' &&
    chien.price === 80 && chien.rarity === 'common' &&
    item('animal_monkey').price === 150 && item('animal_monkey').rarity === 'rare' &&
    item('animal_panda').price === 200 && item('animal_panda').rarity === 'epic' &&
    item('animal_tiger').price === 300 && item('animal_tiger').rarity === 'legendary' &&
    item('animal_unicorn').price === 400 && item('animal_unicorn').rarity === 'legendary'
);
check('verbes : Appeler / Retirer / Avec toi ✓', actionVerbs('animal').on === 'Appeler' && actionVerbs('animal').off === 'Retirer' && actionVerbs('animal').state === 'Avec toi ✓');

let an = equip({ ...DEFAULT_PLAYER }, chat);
check('appeler le chat occupe l’emplacement compagnon', an.equipped.animal === 'animal_cat');
an = equip(an, chien);
check('appeler le chien remplace le chat (un seul compagnon)', an.equipped.animal === 'animal_dog');

an = equip({ ...DEFAULT_PLAYER, equipped: { kimono: 'kimono_judo', head: 'cap_red', color: 'color_gold', background: 'bg_bamboo' } }, chat);
check(
  'appeler un compagnon ne touche à rien d’autre (kimono, chapeau, pâte, fond)',
  an.equipped.kimono === 'kimono_judo' && an.equipped.head === 'cap_red' && an.equipped.color === 'color_gold' && an.equipped.background === 'bg_bamboo' && an.equipped.animal === 'animal_cat'
);
an = equip({ ...DEFAULT_PLAYER, equipped: { animal: 'animal_cat' } }, kimonoItem);
check('équiper le kimono garde le compagnon', an.equipped.animal === 'animal_cat' && an.equipped.kimono === 'kimono_judo');
an = equip({ ...DEFAULT_PLAYER, equipped: { kimono: 'kimono_judo', animal: 'animal_cat' } }, cape);
check('porter la cape retire le kimono mais garde le compagnon', an.equipped.kimono === undefined && an.equipped.animal === 'animal_cat');

let ar = buy({ ...DEFAULT_PLAYER, gems: 100 }, chat);
check('achat du chat (80) → ok, solde 20', ar.status === 'ok' && ar.player.gems === 20 && ar.player.ownedItems.includes('animal_cat'));
const asold = sell(equip(ar.player, chat), chat);
check(
  'revendre le chat rend 80 et libère l’emplacement',
  asold.status === 'ok' && asold.player.gems === 100 && asold.player.equipped.animal === undefined && !asold.player.ownedItems.includes('animal_cat')
);
check('migration : un id de compagnon retrouve son emplacement', same(migrate({ animal: 'animal_cat' }), { animal: 'animal_cat' }));
check('compagnon disparu du catalogue → ignoré', same(migrate({ animal: 'animal_licorne' }), {}));

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
check('activer un décor ne touche pas au chapeau', f.equipped.head === 'cap_red' && f.equipped.background === 'bg_bamboo');
f = equip({ ...DEFAULT_PLAYER, equipped: { head: 'cap_red', background: 'bg_bamboo' } }, kimono);
check('le kimono retire bien le chapeau mais garde le décor', f.equipped.head === undefined && f.equipped.background === 'bg_bamboo');
f = equip({ ...DEFAULT_PLAYER, equipped: { kimono: 'kimono_judo' } }, cape);
check('porter la cape retire le kimono', f.equipped.back === 'cape_hero' && f.equipped.kimono === undefined);

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

check(
  'Sensei proposée seulement si le nom contient « sensei »',
  availableBelts('DimSensei', 1).includes(SENSEI_BELT) && !availableBelts('Dim', 19).includes(SENSEI_BELT)
);
check('un nom sensei ne force pas la ceinture', beltForPlayer('DimSensei', 7, null).label === 'Orange');
check('Sensei sélectionnable avec le bon nom', beltForPlayer('DimSensei', 7, 'Sensei') === SENSEI_BELT);
check('sélection Sensei ignorée sans le bon nom', beltForPlayer('Dim', 7, 'Sensei').label === 'Orange');
check('selectBelt accepte Sensei avec le bon nom', selectBelt({ ...DEFAULT_PLAYER, name: 'DimSensei' }, 'Sensei').selectedBelt === 'Sensei');
check('selectBelt refuse Sensei sans le bon nom', selectBelt({ ...DEFAULT_PLAYER }, 'Sensei').selectedBelt === null);

console.log('--- Émotions ---');
const base = { ...DEFAULT_PLAYER };
check("émotion par défaut : 'joy'", base.emotion === 'joy');
const em = setEmotion(base, 'sad');
check("changer d'émotion est gratuit (gemmes inchangées)", em.emotion === 'sad' && em.gems === base.gems);
check('même émotion → même objet (aucune écriture inutile)', setEmotion(em, 'sad') === em);

console.log('--- Profils (multi-comptes) ---');
check('état vide → création possible', canCreateProfile(EMPTY_PROFILES));
let ps = addProfile(EMPTY_PROFILES, 'id-1', '  Momo  ', 1000);
check('création du premier profil', ps !== null && ps.profiles.length === 1);
check('nom trimé à la création', ps!.profiles[0].player.name === 'Momo');
check('profil créé déjà onboardé', ps!.profiles[0].player.onboarded === true);
check('profil créé avec les gemmes de départ', ps!.profiles[0].player.gems === 30);
check('id et date conservés', ps!.profiles[0].id === 'id-1' && ps!.profiles[0].createdAt === 1000);
check('nom vide → création refusée', addProfile(EMPTY_PROFILES, 'id-x', '   ', 0) === null);

for (let i = 2; i <= MAX_PROFILES; i++) ps = addProfile(ps!, `id-${i}`, `Dim ${i}`, 1000 + i);
check(`${MAX_PROFILES} profils créés`, ps !== null && ps.profiles.length === MAX_PROFILES);
check('limite atteinte → création impossible', !canCreateProfile(ps!));
check(`${MAX_PROFILES + 1}e profil refusé`, addProfile(ps!, 'id-trop', 'Trop', 9999) === null);
check('ordre de création préservé', ps!.profiles.map((r) => r.id).join(',') === 'id-1,id-2,id-3,id-4,id-5');

const richPlayer = { ...DEFAULT_PLAYER, name: 'Riche', gems: 999, xp: 12 };
let ups = updateProfile(ps!, 'id-2', richPlayer);
check('updateProfile remplace le bon profil', getProfile(ups, 'id-2')?.player.gems === 999);
check('updateProfile ne touche pas les autres', getProfile(ups, 'id-1')?.player.gems === 30 && getProfile(ups, 'id-3')?.player.gems === 30);
check('updateProfile id inconnu → même objet', updateProfile(ps!, 'id-inconnu', richPlayer) === ps);

let rm = removeProfile(ups, 'id-3');
check('removeProfile retire le bon profil', rm.profiles.length === 4 && getProfile(rm, 'id-3') === undefined);
check('removeProfile préserve l’ordre des autres', rm.profiles.map((r) => r.id).join(',') === 'id-1,id-2,id-4,id-5');
check('removeProfile id inconnu → même objet', removeProfile(rm, 'id-3') === rm);
check('après suppression → création à nouveau possible', canCreateProfile(rm));

const legacy = { ...DEFAULT_PLAYER, name: 'Ancien', gems: 120, xp: 8, ownedItems: ['kimono', 'cap_red'], onboarded: true };
const mig = migrateLegacyPlayer(legacy, 'id-legacy', 2000);
check('migration → un seul profil', mig.profiles.length === 1);
check('migration → PlayerState conservé tel quel', mig.profiles[0].player === legacy);
check('getProfile(null) → undefined', getProfile(mig, null) === undefined);

console.log(`\n✅ ${pass} vérifications réussies.`);
