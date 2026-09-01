
import type { BackgroundKind } from '@/data/backgrounds';

// Une catégorie = un emplacement sur le dim : un seul objet porté à la fois.
// Deux objets qui se chevauchent (une casquette et une mèche) partagent donc
// forcément la même catégorie, et les sections de la boutique les montrent ensemble.
export type ItemCategory =
  | 'kimono'
  | 'color'
  | 'head'
  | 'glasses'
  | 'neck'
  | 'back'
  | 'shoes'
  | 'background'
  | 'decor';

export const DEFAULT_DOUGH = '#EAD5A0';

export type DrawKind =
  | 'cap'
  | 'crown'
  | 'beanie'
  | 'glasses'
  | 'sunglasses'
  | 'bowtie'
  | 'scarf'
  | 'sneakers'
  | 'cape'
  | 'katanas'
  | 'tuft'
  | 'kimono';

export type DecorKind = 'bonsai' | 'sakura' | 'bamboo' | 'lantern';

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rainbow?: boolean;
  zIndex: number;
  color: string;
  image?: string;
  draw?: DrawKind;
  decor?: DecorKind;
  x?: number;
  w?: number;
  background?: BackgroundKind;
};

// Ordre d'empilement dans le cadre 200×260. Le corps est à 8 : en dessous, l'objet
// passe derrière le dim. `hair` et `hat` sont deux hauteurs de la même catégorie
// `head` — elles ne coexistent jamais, mais chaque dessin garde sa place.
export const Z = {
  back: 5,
  kimono: 10,
  shoes: 15,
  neck: 20,
  hair: 30,
  hat: 40,
  glasses: 50,
} as const;

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  kimono: 'Kimono',
  color: 'Couleurs',
  head: 'Tête',
  glasses: 'Lunettes',
  neck: 'Cou',
  back: 'Dos',
  shoes: 'Chaussures',
  background: 'Décors de fond',
  decor: 'Décorations',
};

export const CATEGORY_ORDER: ItemCategory[] = [
  'kimono',
  'color',
  'head',
  'glasses',
  'neck',
  'back',
  'shoes',
  'background',
  'decor',
];

export const WEARABLE_CATEGORIES: ItemCategory[] = [
  'kimono',
  'color',
  'head',
  'glasses',
  'neck',
  'back',
  'shoes',
];

export const KIMONO_ID = 'kimono_judo';

export const FALLBACK_CATALOG: Item[] = [
  { id: KIMONO_ID, name: 'Kimono de judo', category: 'kimono', price: 0, rarity: 'rare', zIndex: Z.kimono, color: '#F4F1EA', draw: 'kimono' },

  { id: 'color_pink', name: 'Pâte rose', category: 'color', price: 40, rarity: 'common', zIndex: 0, color: '#F2A9C0' },
  { id: 'color_matcha', name: 'Pâte matcha', category: 'color', price: 40, rarity: 'common', zIndex: 0, color: '#A9C46C' },
  { id: 'color_blue', name: 'Pâte bleue', category: 'color', price: 40, rarity: 'common', zIndex: 0, color: '#8FD0EC' },
  { id: 'color_choco', name: 'Pâte chocolat', category: 'color', price: 60, rarity: 'rare', zIndex: 0, color: '#B07A4E' },
  { id: 'color_gold', name: 'Pâte dorée', category: 'color', price: 120, rarity: 'epic', zIndex: 0, color: '#E8C75A' },
  { id: 'color_rainbow', name: 'Pâte Rainbow', category: 'color', price: 500, rarity: 'legendary', zIndex: 0, color: '#B58CFF', rainbow: true },

  // Tête : chapeaux et mèches couvrent le même crâne, un seul à la fois.
  { id: 'cap_red', name: 'Casquette rouge', category: 'head', price: 20, rarity: 'common', zIndex: Z.hat, color: '#E2574C', draw: 'cap' },
  { id: 'cap_blue', name: 'Casquette bleue', category: 'head', price: 20, rarity: 'common', zIndex: Z.hat, color: '#3D7BE0', draw: 'cap' },
  { id: 'beanie_purple', name: 'Bonnet violet', category: 'head', price: 40, rarity: 'common', zIndex: Z.hat, color: '#9B7BE0', draw: 'beanie' },
  { id: 'crown_gold', name: 'Couronne dorée', category: 'head', price: 120, rarity: 'epic', zIndex: Z.hat, color: '#F4B740', draw: 'crown' },
  { id: 'hair_purple', name: 'Mèche violette', category: 'head', price: 20, rarity: 'common', zIndex: Z.hair, color: '#B07BE0', draw: 'tuft' },
  { id: 'hair_orange', name: 'Mèche orange', category: 'head', price: 20, rarity: 'common', zIndex: Z.hair, color: '#F19A3E', draw: 'tuft' },

  { id: 'glasses_nerd', name: 'Lunettes rondes', category: 'glasses', price: 20, rarity: 'common', zIndex: Z.glasses, color: '#2E3A1F', draw: 'glasses' },
  { id: 'sunglasses_cool', name: 'Lunettes de soleil', category: 'glasses', price: 60, rarity: 'rare', zIndex: Z.glasses, color: '#222222', draw: 'sunglasses' },

  { id: 'bowtie_pink', name: 'Nœud papillon', category: 'neck', price: 20, rarity: 'common', zIndex: Z.neck, color: '#ED93B1', draw: 'bowtie' },
  { id: 'scarf_teal', name: 'Écharpe', category: 'neck', price: 60, rarity: 'rare', zIndex: Z.neck, color: '#1D9E75', draw: 'scarf' },

  { id: 'cape_hero', name: 'Cape de héros', category: 'back', price: 100, rarity: 'epic', zIndex: Z.back, color: '#E24B4A', draw: 'cape' },
  { id: 'katana_duo', name: 'Katanas croisés', category: 'back', price: 160, rarity: 'epic', zIndex: Z.back, color: '#8A2E3C', draw: 'katanas' },

  { id: 'sneakers_white', name: 'Baskets', category: 'shoes', price: 20, rarity: 'common', zIndex: Z.shoes, color: '#3a4660', draw: 'sneakers' },

  { id: 'bg_bamboo', name: 'Forêt de bambous', category: 'background', price: 80, rarity: 'common', zIndex: 0, color: '#6FB23E', background: 'bamboo' },
  { id: 'bg_dojo', name: 'Dojo', category: 'background', price: 100, rarity: 'common', zIndex: 0, color: '#B7C68B', background: 'dojo' },
  { id: 'bg_sushi', name: 'Restaurant de sushis', category: 'background', price: 140, rarity: 'rare', zIndex: 0, color: '#31538F', background: 'sushi' },
  { id: 'bg_sakura', name: 'Jardin de sakura', category: 'background', price: 140, rarity: 'rare', zIndex: 0, color: '#F6A8C4', background: 'sakura' },
  { id: 'bg_wave', name: 'La Grande Vague', category: 'background', price: 200, rarity: 'epic', zIndex: 0, color: '#2E6BA6', background: 'wave' },
  { id: 'bg_matsuri', name: 'Festival matsuri', category: 'background', price: 240, rarity: 'epic', zIndex: 0, color: '#EE3B30', background: 'matsuri' },
  { id: 'bg_neon', name: 'Tokyo néon', category: 'background', price: 280, rarity: 'epic', zIndex: 0, color: '#FF5C8A', background: 'neon' },
  { id: 'bg_space', name: 'Sur la Lune', category: 'background', price: 400, rarity: 'legendary', zIndex: 0, color: '#3F4470', background: 'space' },

  { id: 'decor_bonsai', name: 'Bonsaï', category: 'decor', price: 60, rarity: 'common', zIndex: 1, color: '#3E8C4A', decor: 'bonsai', x: 0.84, w: 90 },
  { id: 'decor_tree', name: 'Cerisier', category: 'decor', price: 80, rarity: 'rare', zIndex: 1, color: '#F4A6C0', decor: 'sakura', x: 0.15, w: 104 },
  { id: 'decor_flowers', name: 'Bambou', category: 'decor', price: 40, rarity: 'common', zIndex: 1, color: '#6FB23E', decor: 'bamboo', x: 0.3, w: 70 },
  { id: 'decor_mushroom', name: 'Lanterne', category: 'decor', price: 40, rarity: 'common', zIndex: 1, color: '#D6453F', decor: 'lantern', x: 0.7, w: 56 },
];

export function getItemById(catalog: Item[], id?: string | null): Item | undefined {
  if (!id) return undefined;
  return catalog.find((i) => i.id === id);
}
