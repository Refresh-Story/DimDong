import { Palette } from '@/theme';

export const FLOOR_RATIO = 0.4;
export const RIM_H = 30;

export type BackgroundKind =
  | 'bamboo'
  | 'sushi'
  | 'dojo'
  | 'sakura'
  | 'neon'
  | 'wave'
  | 'space'
  | 'matsuri';

export type FloorKind = 'steamer' | 'grass' | 'counter' | 'tatami' | 'sand' | 'street' | 'moon' | 'deck';

export type UpperKind =
  | 'lanterns'
  | 'stalks'
  | 'noren'
  | 'scroll'
  | 'branch'
  | 'skyline'
  | 'wavecrest'
  | 'moonstars'
  | 'garland';

export type AmbientKind = 'steam' | 'fall' | 'rise' | 'twinkle' | 'none';

export type BackgroundConfig = {
  kind: BackgroundKind | 'default';
  paper: string;
  halftone: { dot: string; opacity: number };
  speed: { color: string; opacity: number };
  floor: {
    kind: FloorKind;
    base: string;
    shade: string;
    rim: string;
    line: string;
  };
  upper: { kind: UpperKind; colors: string[] };
  ambient: { kind: AmbientKind; color: string; shape?: 'circle' | 'petal' };
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  kind: 'default',
  paper: Palette.paper,
  halftone: { dot: Palette.screentoneMid, opacity: 0.4 },
  speed: { color: Palette.ink, opacity: 0.12 },
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
    floor: { kind: 'grass', base: '#8FBB6E', shade: '#6B9A4E', rim: '#77A85C', line: '#5A8442' },
    upper: { kind: 'stalks', colors: ['#6FB23E', '#4E8F2E', '#8FCB5B'] },
    ambient: { kind: 'fall', color: '#8FCB5B', shape: 'petal' },
  },
  dojo: {
    kind: 'dojo',
    paper: '#F3E9D7',
    halftone: { dot: '#D8C8A8', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.12 },
    floor: { kind: 'tatami', base: '#B7C68B', shade: '#93A468', rim: '#55603C', line: '#93A468' },
    upper: { kind: 'scroll', colors: ['#8A5E3B', '#F7F2E6', '#B7412E'] },
    ambient: { kind: 'none', color: Palette.steam },
  },
  sushi: {
    kind: 'sushi',
    paper: '#FBEFDD',
    halftone: { dot: '#E3CFAE', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.12 },
    floor: { kind: 'counter', base: '#C98D4B', shade: '#A26D33', rim: '#EFDDB6', line: '#A26D33' },
    upper: { kind: 'noren', colors: ['#31538F', '#F7F2E6', '#B7412E'] },
    ambient: { kind: 'steam', color: Palette.steam },
  },
  sakura: {
    kind: 'sakura',
    paper: '#FDEFF4',
    halftone: { dot: '#F2CEDC', opacity: 0.45 },
    speed: { color: Palette.ink, opacity: 0.1 },
    floor: { kind: 'grass', base: '#A8CF8E', shade: '#83AF6B', rim: '#92BE79', line: '#6E9A57' },
    upper: { kind: 'branch', colors: ['#6B4A36', '#F6A8C4', '#FBD3E2'] },
    ambient: { kind: 'fall', color: '#F6A8C4', shape: 'petal' },
  },
  wave: {
    kind: 'wave',
    paper: '#E8F4F8',
    halftone: { dot: '#BFDDE8', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.1 },
    floor: { kind: 'sand', base: '#EFD9A7', shade: '#D9B97C', rim: '#CBA96B', line: '#D9B97C' },
    upper: { kind: 'wavecrest', colors: ['#2E6BA6', '#7FB8DA', '#F5F1E8', '#E8574C'] },
    ambient: { kind: 'rise', color: '#FFFFFF' },
  },
  matsuri: {
    kind: 'matsuri',
    paper: '#FBE3B8',
    halftone: { dot: '#E5C892', opacity: 0.4 },
    speed: { color: Palette.ink, opacity: 0.12 },
    floor: { kind: 'deck', base: '#B9803F', shade: '#96632C', rim: '#A7712F', line: '#96632C' },
    upper: { kind: 'garland', colors: [Palette.lantern, Palette.lanternGold, '#2E6BE6'] },
    ambient: { kind: 'rise', color: Palette.lanternGold },
  },
  neon: {
    kind: 'neon',
    paper: '#4E5480',
    halftone: { dot: '#5D6390', opacity: 0.35 },
    speed: { color: '#FFFFFF', opacity: 0.1 },
    floor: { kind: 'street', base: '#4A4E66', shade: '#383B50', rim: '#585D78', line: '#D9D6CB' },
    upper: { kind: 'skyline', colors: ['#2B2E49', '#FF5C8A', '#3EDBF0', '#F7C948'] },
    ambient: { kind: 'twinkle', color: '#3EDBF0' },
  },
  space: {
    kind: 'space',
    paper: '#3F4470',
    halftone: { dot: '#4C517E', opacity: 0.35 },
    speed: { color: '#FFFFFF', opacity: 0.1 },
    floor: { kind: 'moon', base: '#AEB3C2', shade: '#8A8FA3', rim: '#9BA0B2', line: '#8A8FA3' },
    upper: { kind: 'moonstars', colors: ['#8FD0EC', '#7FB069', '#F7F2E6'] },
    ambient: { kind: 'twinkle', color: '#F7F2E6' },
  },
};

export function getBackground(kind?: string | null): BackgroundConfig {
  if (kind && kind in BACKGROUNDS) return BACKGROUNDS[kind as BackgroundKind];
  return DEFAULT_BACKGROUND;
}
