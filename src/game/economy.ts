import type { Emotion } from '@/art/dimArt';
import { Item, ItemCategory, KIMONO_ID } from '@/data/items';
import { GEMS_PER_BRUSH, STARTING_GEMS } from '@/game/rules';

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

export function equip(p: PlayerState, item: Item): PlayerState {
  if (item.category === 'kimono') {
    const equipped: PlayerState['equipped'] = {};
    if (p.equipped.color) equipped.color = p.equipped.color;
    if (p.equipped.background) equipped.background = p.equipped.background;
    equipped.kimono = item.id;
    return { ...p, equipped };
  }
  const equipped = { ...p.equipped, [item.category]: item.id };
  if (item.category !== 'color' && item.category !== 'background') delete equipped.kimono;
  return { ...p, equipped };
}

export function unequip(p: PlayerState, category: ItemCategory): PlayerState {
  const equipped = { ...p.equipped };
  delete equipped[category];
  return { ...p, equipped };
}

export function toggleDecor(p: PlayerState, item: Item): PlayerState {
  const placedDecor = p.placedDecor.includes(item.id)
    ? p.placedDecor.filter((id) => id !== item.id)
    : [...p.placedDecor, item.id];
  return { ...p, placedDecor };
}
