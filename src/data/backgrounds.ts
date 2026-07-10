// Décors d'arrière-plan achetables de Dim-Dong.
//
// Données PURES (pas de React ni React Native) : chaque décor est une config de
// couleurs + variantes, consommée par Scene (et ses sous-composants Floor / Upper /
// Ambient). Le décor `default` reproduit exactement le salon de dim-sum historique.
//
// Invariants de scène (valables pour TOUS les décors) :
//  - le sol occupe la part basse FLOOR_RATIO de l'écran, avec une bande « rebord »
//    de RIM_H px en haut du sol où se posent les décorations achetées (item.x / item.w) ;
//  - le personnage ({children} de Scene) ne bouge pas d'un décor à l'autre.
import { Palette } from '@/theme';

// Part basse de l'écran occupée par le sol (ex-panier vapeur).
export const FLOOR_RATIO = 0.4;
// Hauteur de la bande « rebord » en haut du sol (les décorations s'y posent à top: 30).
export const RIM_H = 30;

export type BackgroundKind =
  | 'bamboo' // forêt de bambous
  | 'sushi' // restaurant de sushis
  | 'dojo' // dojo (tatamis + rouleau de calligraphie)
  | 'sakura' // jardin de cerisiers en fleurs
  | 'neon' // Tokyo néon au crépuscule
  | 'wave' // Grande Vague façon Hokusai
  | 'space' // sur la Lune
  | 'matsuri'; // festival japonais (lanternes + feux d'artifice)

// Variante de sol (la variante `steamer` est le panier vapeur historique).
export type FloorKind = 'steamer' | 'grass' | 'counter' | 'tatami' | 'sand' | 'street' | 'moon' | 'deck';

// Éléments hauts de la scène (suspendus / horizon).
export type UpperKind =
  | 'lanterns' // les 2 lanternes balancées historiques
  | 'stalks' // tiges de bambou sur les bords
  | 'noren' // rideau de restaurant à pans
  | 'scroll' // poutre + rouleau de calligraphie
  | 'branch' // branche de cerisier fleurie
  | 'skyline' // silhouettes d'immeubles + enseignes néon
  | 'wavecrest' // crête de vague + soleil levant
  | 'moonstars' // Terre au loin + étoiles
  | 'garland'; // guirlande de lanternes de fête + feux d'artifice

// Ambiance animée : `steam` = colonnes de vapeur historiques ; les autres sont des
// particules génériques (chute, montée, scintillement) ou rien.
export type AmbientKind = 'steam' | 'fall' | 'rise' | 'twinkle' | 'none';

export type BackgroundConfig = {
  kind: BackgroundKind | 'default';
  paper: string; // fond papier plein écran
  halftone: { dot: string; opacity: number }; // trame manga (screentone)
  speed: { color: string; opacity: number }; // traits de vitesse derrière le héros
  spotlight: { fill: string; fillOpacity: number; ring: string; ringOpacity: number };
  floor: {
    kind: FloorKind;
    base: string; // aplat principal du sol
    shade: string; // ombre cel (bas du sol) + motifs sombres
    rim: string; // bande « rebord » où se posent les décorations
    line: string; // lignes de motif (tressage, lattes, marquages…)
  };
  upper: { kind: UpperKind; colors: string[] };
  ambient: { kind: AmbientKind; color: string; shape?: 'circle' | 'petal' };
};

// Salon de dim-sum historique : mêmes valeurs que l'ancien Scene.tsx codé en dur.
export const DEFAULT_BACKGROUND: BackgroundConfig = {
  kind: 'default',
  paper: Palette.paper,
  halftone: { dot: Palette.screentoneMid, opacity: 0.4 },
  speed: { color: Palette.ink, opacity: 0.12 },
  spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
  floor: { kind: 'steamer', base: Palette.steamer, shade: Palette.steamerDark, rim: Palette.steamerRim, line: Palette.steamerDark },
  upper: { kind: 'lanterns', colors: [Palette.lantern, Palette.lanternGold, Palette.lanternDark] },
  ambient: { kind: 'steam', color: Palette.steam },
};

export const BACKGROUNDS: Record<BackgroundKind, BackgroundConfig> = {
  bamboo: {
    kind: 'bamboo',
    paper: '#EAF2DC',
    halftone: { dot: '#C2D4A8', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.1 },
    spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
    floor: { kind: 'grass', base: '#8FBB6E', shade: '#6B9A4E', rim: '#77A85C', line: '#5A8442' },
    upper: { kind: 'stalks', colors: ['#6FB23E', '#4E8F2E', '#8FCB5B'] },
    ambient: { kind: 'fall', color: '#8FCB5B', shape: 'petal' },
  },
  dojo: {
    kind: 'dojo',
    paper: '#F3E9D7',
    halftone: { dot: '#D8C8A8', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.12 },
    spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
    floor: { kind: 'tatami', base: '#B7C68B', shade: '#93A468', rim: '#55603C', line: '#93A468' },
    upper: { kind: 'scroll', colors: ['#8A5E3B', '#F7F2E6', '#B7412E'] },
    ambient: { kind: 'none', color: Palette.steam },
  },
  sushi: {
    kind: 'sushi',
    paper: '#FBEFDD',
    halftone: { dot: '#E3CFAE', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.12 },
    spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
    floor: { kind: 'counter', base: '#C98D4B', shade: '#A26D33', rim: '#EFDDB6', line: '#A26D33' },
    upper: { kind: 'noren', colors: ['#31538F', '#F7F2E6', '#B7412E'] },
    ambient: { kind: 'steam', color: Palette.steam },
  },
  sakura: {
    kind: 'sakura',
    paper: '#FDEFF4',
    halftone: { dot: '#F2CEDC', opacity: 0.45 },
    speed: { color: Palette.ink, opacity: 0.1 },
    spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
    floor: { kind: 'grass', base: '#A8CF8E', shade: '#83AF6B', rim: '#92BE79', line: '#6E9A57' },
    upper: { kind: 'branch', colors: ['#6B4A36', '#F6A8C4', '#FBD3E2'] },
    ambient: { kind: 'fall', color: '#F6A8C4', shape: 'petal' },
  },
  wave: {
    kind: 'wave',
    paper: '#E8F4F8',
    halftone: { dot: '#BFDDE8', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.1 },
    spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
    floor: { kind: 'sand', base: '#EFD9A7', shade: '#D9B97C', rim: '#CBA96B', line: '#D9B97C' },
    upper: { kind: 'wavecrest', colors: ['#2E6BA6', '#7FB8DA', '#F5F1E8', '#E8574C'] },
    ambient: { kind: 'rise', color: '#FFFFFF' },
  },
  matsuri: {
    kind: 'matsuri',
    paper: '#FBE3B8',
    halftone: { dot: '#E5C892', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.12 },
    spotlight: { fill: Palette.white, fillOpacity: 0.55, ring: Palette.outline, ringOpacity: 0.5 },
    floor: { kind: 'deck', base: '#B9803F', shade: '#96632C', rim: '#A7712F', line: '#96632C' },
    upper: { kind: 'garland', colors: [Palette.lantern, Palette.lanternGold, '#2E6BE6'] },
    ambient: { kind: 'rise', color: Palette.lanternGold },
  },
  // Fonds crépusculaires : indigo MOYEN (pas noir) + traits de vitesse clairs pour
  // préserver la lisibilité des textes posés sur la scène (minuteur).
  neon: {
    kind: 'neon',
    paper: '#4E5480',
    halftone: { dot: '#5D6390', opacity: 0.35 },
    speed: { color: '#FFFFFF', opacity: 0.1 },
    spotlight: { fill: '#FFFFFF', fillOpacity: 0.22, ring: '#FFFFFF', ringOpacity: 0.35 },
    floor: { kind: 'street', base: '#4A4E66', shade: '#383B50', rim: '#585D78', line: '#D9D6CB' },
    upper: { kind: 'skyline', colors: ['#2B2E49', '#FF5C8A', '#3EDBF0', '#F7C948'] },
    ambient: { kind: 'twinkle', color: '#3EDBF0' },
  },
  space: {
    kind: 'space',
    paper: '#3F4470',
    halftone: { dot: '#4C517E', opacity: 0.35 },
    speed: { color: '#FFFFFF', opacity: 0.1 },
    spotlight: { fill: '#FFFFFF', fillOpacity: 0.22, ring: '#FFFFFF', ringOpacity: 0.35 },
    floor: { kind: 'moon', base: '#AEB3C2', shade: '#8A8FA3', rim: '#9BA0B2', line: '#8A8FA3' },
    upper: { kind: 'moonstars', colors: ['#8FD0EC', '#7FB069', '#F7F2E6'] },
    ambient: { kind: 'twinkle', color: '#F7F2E6' },
  },
};

// Résolution tolérante : un kind inconnu (ex. item Firestore plus récent que l'app)
// retombe sur le décor par défaut — jamais de crash.
export function getBackground(kind?: string | null): BackgroundConfig {
  if (kind && kind in BACKGROUNDS) return BACKGROUNDS[kind as BackgroundKind];
  return DEFAULT_BACKGROUND;
}
