import { FLOOR_RATIO } from '@/art/sceneGeom';

export { FLOOR_RATIO };

export type BackgroundKind =
  | 'bamboo'
  | 'sushi'
  | 'dojo'
  | 'sakura'
  | 'neon'
  | 'wave'
  | 'space'
  | 'matsuri';

/** Identité d'un décor. `default` est celui des nouveaux joueurs. */
export type SceneKind = BackgroundKind | 'default';

export type AmbientKind = 'steam' | 'fall' | 'rise' | 'twinkle' | 'none';

/**
 * Palette d'un décor.
 *
 * Les couleurs sont nommées, plus positionnelles : l'ancien `upper.colors: string[]`
 * changeait de sens selon le décor, ce qui le rendait illisible et inextensible.
 */
export type ScenePalette = {
  /** Dégradé de ciel : `top` en haut de l'écran, `bottom` à la ligne d'horizon. */
  sky: { top: string; bottom: string };
  /** Base des silhouettes lointaines. Elles sont mélangées vers `sky.bottom` au tracé. */
  far: string;
  /** Couleurs de l'élément central du décor (bambous, noren, vague…). */
  hero: string[];
  ground: { base: string; shade: string; rim: string; line: string };
  halftone: { dot: string; opacity: number };
  speed: { color: string; opacity: number };
  ambient: { kind: AmbientKind; color: string; shape?: 'circle' | 'petal' };
  /** Couleur de repli hors scène (fond de carte, chargement). */
  paper: string;
};

export type BackgroundConfig = { kind: SceneKind } & ScenePalette;

const INK = '#16161D';

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  kind: 'default',
  // Intérieur : la lumière s'accumule en bas, donc le haut est le plus sombre.
  sky: { top: '#E4D6B8', bottom: '#FBF3E2' },
  far: '#CBB994',
  hero: ['#EE3B30', '#F7C948', '#B7261D'],
  ground: { base: '#E0A92E', shade: '#B07F1E', rim: '#8A5E16', line: '#B07F1E' },
  halftone: { dot: '#C9C3B5', opacity: 0.3 },
  speed: { color: INK, opacity: 0.1 },
  ambient: { kind: 'steam', color: '#FFFFFF' },
  paper: '#FBF3E2',
};

export const BACKGROUNDS: Record<BackgroundKind, BackgroundConfig> = {
  bamboo: {
    kind: 'bamboo',
    sky: { top: '#CFE6AE', bottom: '#F4FAE6' },
    far: '#93C071',
    hero: ['#6FB23E', '#4E8F2E', '#8FCB5B'],
    ground: { base: '#8FBB6E', shade: '#6B9A4E', rim: '#77A85C', line: '#5A8442' },
    halftone: { dot: '#C2D4A8', opacity: 0.3 },
    speed: { color: INK, opacity: 0.08 },
    ambient: { kind: 'fall', color: '#8FCB5B', shape: 'petal' },
    paper: '#EAF2DC',
  },
  dojo: {
    kind: 'dojo',
    sky: { top: '#B9A078', bottom: '#F6EEDD' },
    far: '#D6C4A0',
    hero: ['#8A5E3B', '#F7F2E6', '#B7412E'],
    ground: { base: '#B7C68B', shade: '#93A468', rim: '#55603C', line: '#93A468' },
    halftone: { dot: '#D8C8A8', opacity: 0.3 },
    speed: { color: INK, opacity: 0.09 },
    ambient: { kind: 'none', color: '#FFFFFF' },
    paper: '#F3E9D7',
  },
  sushi: {
    kind: 'sushi',
    sky: { top: '#B07E4C', bottom: '#F6DFB9' },
    far: '#D2A873',
    hero: ['#31538F', '#F7F2E6', '#B7412E'],
    ground: { base: '#C98D4B', shade: '#A26D33', rim: '#EFDDB6', line: '#8A5A28' },
    halftone: { dot: '#E3CFAE', opacity: 0.28 },
    speed: { color: INK, opacity: 0.09 },
    ambient: { kind: 'steam', color: '#FFFFFF' },
    paper: '#FBEFDD',
  },
  sakura: {
    kind: 'sakura',
    sky: { top: '#F8BFD6', bottom: '#FFF6F9' },
    far: '#EFAEC8',
    hero: ['#6B4A36', '#F6A8C4', '#FBD3E2'],
    ground: { base: '#A8CF8E', shade: '#83AF6B', rim: '#92BE79', line: '#6E9A57' },
    halftone: { dot: '#F2CEDC', opacity: 0.32 },
    speed: { color: INK, opacity: 0.08 },
    ambient: { kind: 'fall', color: '#F6A8C4', shape: 'petal' },
    paper: '#FDEFF4',
  },
  wave: {
    kind: 'wave',
    sky: { top: '#A9D6EC', bottom: '#F7E9CE' },
    far: '#8FA3C8',
    hero: ['#2E6BA6', '#7FB8DA', '#F5F1E8', '#E8574C'],
    halftone: { dot: '#BFDDE8', opacity: 0.3 },
    ground: { base: '#EFD9A7', shade: '#D9B97C', rim: '#CBA96B', line: '#C9A362' },
    speed: { color: INK, opacity: 0.08 },
    ambient: { kind: 'rise', color: '#FFFFFF' },
    paper: '#E8F4F8',
  },
  matsuri: {
    kind: 'matsuri',
    sky: { top: '#332C5E', bottom: '#FBDCA6' },
    far: '#6B4E76',
    hero: ['#EE3B30', '#F7C948', '#2E6BE6'],
    ground: { base: '#B9803F', shade: '#96632C', rim: '#A7712F', line: '#7A4E1F' },
    halftone: { dot: '#E5C892', opacity: 0.26 },
    speed: { color: '#FFFFFF', opacity: 0.08 },
    ambient: { kind: 'rise', color: '#F7C948' },
    paper: '#FBE3B8',
  },
  neon: {
    kind: 'neon',
    sky: { top: '#1E1B3A', bottom: '#7C5A92' },
    far: '#3A3560',
    hero: ['#2B2E49', '#FF5C8A', '#3EDBF0', '#F7C948'],
    ground: { base: '#33364B', shade: '#1F2130', rim: '#4A4E68', line: '#E4E1D6' },
    halftone: { dot: '#5D6390', opacity: 0.22 },
    speed: { color: '#FFFFFF', opacity: 0.07 },
    ambient: { kind: 'twinkle', color: '#3EDBF0' },
    paper: '#4E5480',
  },
  space: {
    kind: 'space',
    sky: { top: '#0C0E28', bottom: '#464C7E' },
    far: '#2A2E55',
    hero: ['#8FD0EC', '#7FB069', '#F7F2E6'],
    ground: { base: '#A6ABBC', shade: '#767C92', rim: '#9BA0B2', line: '#767C92' },
    halftone: { dot: '#4C517E', opacity: 0.22 },
    speed: { color: '#FFFFFF', opacity: 0.07 },
    ambient: { kind: 'twinkle', color: '#F7F2E6' },
    paper: '#3F4470',
  },
};

export function getBackground(kind?: string | null): BackgroundConfig {
  if (kind && kind in BACKGROUNDS) return BACKGROUNDS[kind as BackgroundKind];
  return DEFAULT_BACKGROUND;
}
