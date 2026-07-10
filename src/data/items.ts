// Catalogue des objets de la boutique de Dim-Dong.
//
// Deux façons de représenter un objet :
//  - `image`  : URL (Firebase Storage) d'un PNG transparent aligné sur le corps.
//               C'est le mode "final" une fois les visuels IA générés (tâche 7).
//  - `draw`   : un accessoire dessiné en code (placeholder jouable AVANT les images IA),
//               rendu par DimAvatar. Permet de tester toute la boucle dès maintenant.

import type { BackgroundKind } from '@/data/backgrounds';

export type ItemCategory =
  | 'kimono' // tenue de judo (catégorie spéciale : exclusive, ceinture selon le niveau)
  | 'color' // couleur de la pâte du dim-sum
  | 'hair'
  | 'hat'
  | 'glasses'
  | 'outfit'
  | 'shoes'
  | 'accessory'
  | 'background' // décor d'arrière-plan plein écran (un seul actif à la fois)
  | 'decor';

// Couleur par défaut de la pâte du dim-sum (si aucune couleur équipée).
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
  | 'tuft'
  | 'kimono';

// Décorations placées dans la scène (sur le panier), pas portées par le personnage.
export type DecorKind = 'bonsai' | 'sakura' | 'bamboo' | 'lantern' | 'teapot';

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  price: number; // en gemmes
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  // Pâte arc-en-ciel (rendu spécial multi-couleurs sur le personnage).
  rainbow?: boolean;
  // Ordre d'empilement (plus grand = au-dessus).
  zIndex: number;
  // Couleur principale (chip de la boutique + teinte du placeholder dessiné).
  color: string;
  // Visuel : soit une image IA, soit un placeholder dessiné.
  image?: string;
  draw?: DrawKind;
  // Décorations uniquement : forme dessinée + position dans la scène.
  decor?: DecorKind;
  x?: number; // position horizontale dans la scène (0 = gauche, 1 = droite)
  w?: number; // largeur de la décoration en px
  // Décors d'arrière-plan uniquement : clé de la config dans BACKGROUNDS.
  background?: BackgroundKind;
};

// Ordre d'empilement des couches (le corps de base est à 0).
export const Z = {
  cape: 5,
  outfit: 10,
  shoes: 15,
  accessory: 20,
  hair: 30,
  hat: 40,
  glasses: 50,
} as const;

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  kimono: 'Kimono',
  color: 'Couleurs',
  hair: 'Cheveux',
  hat: 'Chapeaux',
  glasses: 'Lunettes',
  outfit: 'Tenues',
  shoes: 'Chaussures',
  accessory: 'Accessoires',
  background: 'Décors de fond',
  decor: 'Décorations',
};

export const CATEGORY_ORDER: ItemCategory[] = [
  'kimono',
  'color',
  'hat',
  'glasses',
  'hair',
  'accessory',
  'outfit',
  'shoes',
  'background',
  'decor',
];

// Catégories portées par le personnage (une seule par catégorie à la fois).
export const WEARABLE_CATEGORIES: ItemCategory[] = [
  'kimono',
  'color',
  'hat',
  'glasses',
  'hair',
  'accessory',
  'outfit',
  'shoes',
];

// Catalogue de secours (placeholders dessinés). Utilisé si Firestore est vide
// ou indisponible. Une fois les visuels IA prêts, on bascule sur le catalogue
// Firestore (mêmes ids), où chaque objet a une `image`.
// Kimono de judo : objet unique de la catégorie spéciale `kimono` (gratuit, possédé d'office).
export const KIMONO_ID = 'kimono_judo';

export const FALLBACK_CATALOG: Item[] = [
  // Kimono de judo (catégorie spéciale, en premier). Veste blanc cassé ; la ceinture est
  // colorée dynamiquement selon le niveau (cf. beltForLevel) — pas une couleur d'item.
  { id: KIMONO_ID, name: 'Kimono de judo', category: 'kimono', price: 0, rarity: 'rare', zIndex: Z.outfit, color: '#F4F1EA', draw: 'kimono' },

  // Couleurs de pâte (la pâte par défaut est crème, gratuite/non listée).
  { id: 'color_pink', name: 'Pâte rose', category: 'color', price: 40, rarity: 'common', zIndex: 0, color: '#F2A9C0' },
  { id: 'color_matcha', name: 'Pâte matcha', category: 'color', price: 40, rarity: 'common', zIndex: 0, color: '#A9C46C' },
  { id: 'color_blue', name: 'Pâte bleue', category: 'color', price: 40, rarity: 'common', zIndex: 0, color: '#8FD0EC' },
  { id: 'color_choco', name: 'Pâte chocolat', category: 'color', price: 60, rarity: 'rare', zIndex: 0, color: '#B07A4E' },
  { id: 'color_gold', name: 'Pâte dorée', category: 'color', price: 120, rarity: 'epic', zIndex: 0, color: '#E8C75A' },
  { id: 'color_rainbow', name: 'Pâte Rainbow', category: 'color', price: 1000, rarity: 'legendary', zIndex: 0, color: '#B58CFF', rainbow: true },

  { id: 'cap_red', name: 'Casquette rouge', category: 'hat', price: 20, rarity: 'common', zIndex: Z.hat, color: '#E2574C', draw: 'cap' },
  { id: 'cap_blue', name: 'Casquette bleue', category: 'hat', price: 20, rarity: 'common', zIndex: Z.hat, color: '#3D7BE0', draw: 'cap' },
  { id: 'beanie_purple', name: 'Bonnet violet', category: 'hat', price: 35, rarity: 'common', zIndex: Z.hat, color: '#9B7BE0', draw: 'beanie' },
  { id: 'crown_gold', name: 'Couronne dorée', category: 'hat', price: 120, rarity: 'epic', zIndex: Z.hat, color: '#F4B740', draw: 'crown' },

  { id: 'glasses_nerd', name: 'Lunettes rondes', category: 'glasses', price: 30, rarity: 'common', zIndex: Z.glasses, color: '#2E3A1F', draw: 'glasses' },
  { id: 'sunglasses_cool', name: 'Lunettes de soleil', category: 'glasses', price: 50, rarity: 'rare', zIndex: Z.glasses, color: '#222222', draw: 'sunglasses' },

  { id: 'bowtie_pink', name: 'Nœud papillon', category: 'accessory', price: 25, rarity: 'common', zIndex: Z.accessory, color: '#ED93B1', draw: 'bowtie' },
  { id: 'scarf_teal', name: 'Écharpe', category: 'accessory', price: 40, rarity: 'rare', zIndex: Z.accessory, color: '#1D9E75', draw: 'scarf' },
  { id: 'cape_hero', name: 'Cape de héros', category: 'accessory', price: 90, rarity: 'epic', zIndex: 5, color: '#E24B4A', draw: 'cape' },

  { id: 'sneakers_white', name: 'Baskets', category: 'shoes', price: 30, rarity: 'common', zIndex: Z.shoes, color: '#3a4660', draw: 'sneakers' },

  { id: 'hair_purple', name: 'Mèche violette', category: 'hair', price: 25, rarity: 'common', zIndex: Z.hair, color: '#B07BE0', draw: 'tuft' },
  { id: 'hair_orange', name: 'Mèche orange', category: 'hair', price: 25, rarity: 'common', zIndex: Z.hair, color: '#F19A3E', draw: 'tuft' },

  // Décors d'arrière-plan plein écran (un seul actif à la fois, via equipped.background).
  // `color` = teinte dominante, utilisée par la vignette de la boutique.
  { id: 'bg_bamboo', name: 'Forêt de bambous', category: 'background', price: 80, rarity: 'common', zIndex: 0, color: '#6FB23E', background: 'bamboo' },
  { id: 'bg_dojo', name: 'Dojo', category: 'background', price: 100, rarity: 'common', zIndex: 0, color: '#B7C68B', background: 'dojo' },
  { id: 'bg_sushi', name: 'Restaurant de sushis', category: 'background', price: 150, rarity: 'rare', zIndex: 0, color: '#31538F', background: 'sushi' },
  { id: 'bg_sakura', name: 'Jardin de sakura', category: 'background', price: 150, rarity: 'rare', zIndex: 0, color: '#F6A8C4', background: 'sakura' },
  { id: 'bg_wave', name: 'La Grande Vague', category: 'background', price: 220, rarity: 'epic', zIndex: 0, color: '#2E6BA6', background: 'wave' },
  { id: 'bg_matsuri', name: 'Festival matsuri', category: 'background', price: 260, rarity: 'epic', zIndex: 0, color: '#EE3B30', background: 'matsuri' },
  { id: 'bg_neon', name: 'Tokyo néon', category: 'background', price: 300, rarity: 'epic', zIndex: 0, color: '#FF5C8A', background: 'neon' },
  { id: 'bg_space', name: 'Sur la Lune', category: 'background', price: 450, rarity: 'legendary', zIndex: 0, color: '#3F4470', background: 'space' },

  // Décorations asiatiques (posées sur le panier, plusieurs possibles en même temps).
  { id: 'decor_bonsai', name: 'Bonsaï', category: 'decor', price: 60, rarity: 'common', zIndex: 1, color: '#3E8C4A', decor: 'bonsai', x: 0.84, w: 90 },
  { id: 'decor_tree', name: 'Cerisier', category: 'decor', price: 80, rarity: 'rare', zIndex: 1, color: '#F4A6C0', decor: 'sakura', x: 0.15, w: 104 },
  { id: 'decor_flowers', name: 'Bambou', category: 'decor', price: 30, rarity: 'common', zIndex: 1, color: '#6FB23E', decor: 'bamboo', x: 0.3, w: 70 },
  { id: 'decor_mushroom', name: 'Lanterne', category: 'decor', price: 35, rarity: 'common', zIndex: 1, color: '#D6453F', decor: 'lantern', x: 0.7, w: 56 },
  { id: 'decor_pond', name: 'Théière', category: 'decor', price: 70, rarity: 'rare', zIndex: 1, color: '#6FA9C9', decor: 'teapot', x: 0.5, w: 96 },
];

export function getItemById(catalog: Item[], id?: string | null): Item | undefined {
  if (!id) return undefined;
  return catalog.find((i) => i.id === id);
}

// Fusionne le catalogue distant (Firestore) avec le catalogue embarqué : le distant
// gagne à id égal, et les objets du fallback absents du distant sont ajoutés à la
// suite. Sans ce merge, un catalogue Firestore plus ancien que l'app masquerait les
// nouveaux objets embarqués (ex. les décors de fond).
export function mergeCatalog(remote: Item[], fallback: Item[] = FALLBACK_CATALOG): Item[] {
  const ids = new Set(remote.map((i) => i.id));
  return [...remote, ...fallback.filter((i) => !ids.has(i.id))];
}
