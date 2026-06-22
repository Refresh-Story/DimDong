// Test automatisé de la logique d'économie (achat, brossage, équipement).
// Lancement : npx tsx scripts/test-economy.ts  (ou npm test)
const assert = {
  ok(cond: boolean, msg: string) {
    if (!cond) throw new Error(msg);
  },
};

import { FALLBACK_CATALOG, getItemById } from '@/data/items';
import { DEFAULT_PLAYER, brush, buy, equip, grant, toggleDecor, unequip } from '@/game/economy';
import { dayKey } from '@/game/rules';

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

const rainbow = item('color_rainbow'); // 1000 gemmes, légendaire
check('Rainbow est bien légendaire + rainbow + 1000', rainbow.rarity === 'legendary' && rainbow.rainbow === true && rainbow.price === 1000);
r = buy({ ...DEFAULT_PLAYER }, rainbow);
check("Rainbow inabordable au départ → 'insufficient'", r.status === 'insufficient');
r = buy({ ...DEFAULT_PLAYER, gems: 1000 }, rainbow);
check('Rainbow achetée avec 1000 → ok, solde 0', r.status === 'ok' && r.player.gems === 0 && r.player.ownedItems.includes('color_rainbow'));

console.log('--- Secret (déblocage gratuit) ---');
const g = grant({ ...DEFAULT_PLAYER }, rainbow);
check('grant : Rainbow obtenue sans payer (gemmes inchangées)', g.gems === 30 && g.ownedItems.includes('color_rainbow'));
const g2 = grant(g, rainbow);
check('grant : pas de doublon si déjà possédée', g2.ownedItems.filter((id) => id === 'color_rainbow').length === 1);

console.log('--- Brossage (récompense + plafond journalier) ---');
const today = dayKey(new Date());
let q = { ...DEFAULT_PLAYER };
let b = brush(q, today);
check('1er brossage récompensé (+10)', b.result.rewarded && b.result.gained === 10 && b.player.gems === 40);
q = b.player;
b = brush(q, today);
check('2e brossage récompensé (+10) → 50', b.result.rewarded && b.player.gems === 50);
q = b.player;
b = brush(q, today);
check('3e brossage le même jour → non récompensé (plafond 2/j)', !b.result.rewarded && b.player.gems === 50);
check('mais le brossage est compté (totalBrushes = 3)', b.player.totalBrushes === 3);
q = b.player;
b = brush(q, '2099-01-01'); // nouveau jour
check('nouveau jour → de nouveau récompensé', b.result.rewarded && b.player.gems === 60);

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

console.log(`\n✅ ${pass} vérifications réussies.`);
