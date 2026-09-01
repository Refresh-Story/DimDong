import type { Emotion } from '@/art/dimArt';
import { Item, ItemCategory, KIMONO_ID, getItemById } from '@/data/items';
import { GEMS_PER_BRUSH, STARTING_GEMS, availableBelts, levelFromXp } from '@/game/rules';

export type PlayerState = {
  name: string;
  gems: number;
  xp: number;
  totalBrushes: number;
  equipped: Partial<Record<ItemCategory, string>>;
  ownedItems: string[];
  placedDecor: string[];
  brushDateKey: string;
  brushesToday: number;
  onboarded: boolean;
  emotion: Emotion;
  // Label d'une ceinture de BELTS ; null = ceinture du niveau courant.
  selectedBelt: string | null;
};

export const DEFAULT_PLAYER: PlayerState = {
  name: 'Dim',
  gems: STARTING_GEMS,
  xp: 0,
  totalBrushes: 0,
  equipped: {},
  ownedItems: [KIMONO_ID],
  placedDecor: [],
  brushDateKey: '',
  brushesToday: 0,
  onboarded: false,
  emotion: 'joy',
  selectedBelt: null,
};

export type BrushResult = {
  gained: number;
};

export type BuyStatus = 'ok' | 'owned' | 'insufficient';

export function setName(p: PlayerState, name: string): PlayerState {
  return { ...p, name: name.trim() || 'Dim', onboarded: true };
}

// Gratuit et illimité : aucun coût en gemmes, aucune possession requise.
export function setEmotion(p: PlayerState, emotion: Emotion): PlayerState {
  return p.emotion === emotion ? p : { ...p, emotion };
}

// Porter une ceinture disponible ; null = revenir à la ceinture du niveau.
export function selectBelt(p: PlayerState, label: string | null): PlayerState {
  if (label !== null && !availableBelts(p.name, levelFromXp(p.xp)).some((b) => b.label === label)) return p;
  return p.selectedBelt === label ? p : { ...p, selectedBelt: label };
}

export function grant(p: PlayerState, item: Item): PlayerState {
  if (p.ownedItems.includes(item.id)) return p;
  return { ...p, ownedItems: [...p.ownedItems, item.id] };
}

export function buy(p: PlayerState, item: Item): { player: PlayerState; status: BuyStatus } {
  if (p.ownedItems.includes(item.id)) return { player: p, status: 'owned' };
  if (p.gems < item.price) return { player: p, status: 'insufficient' };
  return {
    player: { ...p, gems: p.gems - item.price, ownedItems: [...p.ownedItems, item.id] },
    status: 'ok',
  };
}

// Chaque brossage est récompensé : aucun plafond journalier.
export function brush(p: PlayerState, todayKey: string): { player: PlayerState; result: BrushResult } {
  const brushesToday = p.brushDateKey === todayKey ? p.brushesToday : 0;
  const player: PlayerState = {
    ...p,
    totalBrushes: p.totalBrushes + 1,
    gems: p.gems + GEMS_PER_BRUSH,
    xp: p.xp + 1,
    brushDateKey: todayKey,
    brushesToday: brushesToday + 1,
  };
  return { player, result: { gained: GEMS_PER_BRUSH } };
}

// Une catégorie = un emplacement : équiper un objet remplace celui qui l'occupait.
// Isolé du PlayerState pour que l'aperçu de la boutique rejoue exactement la même
// règle que l'équipement réel, au lieu de la réécrire à la main.
export function equipMap(equipped: PlayerState['equipped'], item: Item): PlayerState['equipped'] {
  if (item.category === 'kimono') {
    const next: PlayerState['equipped'] = {};
    if (equipped.color) next.color = equipped.color;
    if (equipped.background) next.background = equipped.background;
    next.kimono = item.id;
    return next;
  }
  const next = { ...equipped, [item.category]: item.id };
  if (item.category !== 'color' && item.category !== 'background') delete next.kimono;
  return next;
}

export function equip(p: PlayerState, item: Item): PlayerState {
  return { ...p, equipped: equipMap(p.equipped, item) };
}

export function unequip(p: PlayerState, category: ItemCategory): PlayerState {
  const equipped = { ...p.equipped };
  delete equipped[category];
  return { ...p, equipped };
}

// Les sauvegardes d'avant le regroupement indexent `equipped` par les anciennes
// catégories ('hat', 'hair', 'accessory', 'outfit'). On ne traduit pas les clés : on
// relit la catégorie de chaque objet dans le catalogue. C'est la seule façon de
// trancher 'accessory', qui mélangeait le cou et le dos — et ça reste juste après
// n'importe quel regroupement futur.
//
// L'ordre de résolution évite de dépendre de l'ordre des clés du JSON, qui peut
// varier d'une sauvegarde à l'autre pour un même contenu.
const EQUIP_RESOLUTION_ORDER = [
  'kimono',
  'color',
  'background',
  'glasses',
  'shoes',
  // Chapeau avant mèche : quand les deux étaient portés, c'est le chapeau qu'on
  // voyait (z 40 > 30), et c'est le plus cher des deux. On garde donc le chapeau.
  'hat',
  'head',
  'hair',
  'neck',
  'back',
  'accessory',
  'outfit',
];

function resolutionRank(key: string): number {
  const i = EQUIP_RESOLUTION_ORDER.indexOf(key);
  return i === -1 ? EQUIP_RESOLUTION_ORDER.length : i;
}

// Rejouée à chaque chargement, donc idempotente : un objet n'appartient qu'à une
// catégorie, et les clés déjà migrées figurent dans l'ordre de résolution.
export function migrateEquipped(raw: unknown, catalog: Item[]): PlayerState['equipped'] {
  const out: PlayerState['equipped'] = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const stored = raw as Record<string, unknown>;
  for (const key of Object.keys(stored).sort((a, b) => resolutionRank(a) - resolutionRank(b))) {
    const id = stored[key];
    if (typeof id !== 'string') continue;
    const item = getItemById(catalog, id);
    // Objet retiré du catalogue, ou décoration (multi-sélection via placedDecor).
    if (!item || item.category === 'decor') continue;
    if (out[item.category]) continue; // premier servi selon l'ordre de résolution
    out[item.category] = id;
  }
  return out;
}

export function toggleDecor(p: PlayerState, item: Item): PlayerState {
  const placedDecor = p.placedDecor.includes(item.id)
    ? p.placedDecor.filter((id) => id !== item.id)
    : [...p.placedDecor, item.id];
  return { ...p, placedDecor };
}
