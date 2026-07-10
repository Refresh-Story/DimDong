import { Item, ItemCategory, KIMONO_ID } from '@/data/items';
import { GEMS_PER_BRUSH, MAX_REWARDED_BRUSHES_PER_DAY, STARTING_GEMS } from '@/game/rules';

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
};

export type BrushResult = {
  rewarded: boolean;
  gained: number;
  remainingToday: number;
};

export type BuyStatus = 'ok' | 'owned' | 'insufficient';

export function setName(p: PlayerState, name: string): PlayerState {
  return { ...p, name: name.trim() || 'Dim', onboarded: true };
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

export function brush(p: PlayerState, todayKey: string): { player: PlayerState; result: BrushResult } {
  const brushesToday = p.brushDateKey === todayKey ? p.brushesToday : 0;
  const canReward = brushesToday < MAX_REWARDED_BRUSHES_PER_DAY;
  const player: PlayerState = {
    ...p,
    totalBrushes: p.totalBrushes + 1,
    gems: p.gems + (canReward ? GEMS_PER_BRUSH : 0),
    xp: p.xp + (canReward ? 1 : 0),
    brushDateKey: todayKey,
    brushesToday: brushesToday + (canReward ? 1 : 0),
  };
  return {
    player,
    result: {
      rewarded: canReward,
      gained: canReward ? GEMS_PER_BRUSH : 0,
      remainingToday: Math.max(0, MAX_REWARDED_BRUSHES_PER_DAY - player.brushesToday),
    },
  };
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
