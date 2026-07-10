
export const Palette = {
  wallTop: '#FBF7EE',
  wallBottom: '#EFE7D4',
  steamerLight: '#F2C14E',
  steamer: '#E0A92E',
  steamerDark: '#B07F1E',
  steamerRim: '#8A5E16',
  weave: '#C28E2A',
  lantern: '#EE3B30',
  lanternDark: '#B7261D',
  lanternGold: '#F7C948',
  steam: '#FFFFFF',

  ink: '#16161D',
  inkSoft: '#5B5B66',
  white: '#FFFFFF',

  gem: '#36C5F0',
  gemDark: '#1486AD',
  gold: '#F4B740',

  card: '#FFFFFF',
  cardSoft: '#ECE7DB',
  panel: '#F5F1E8',

  primary: '#FF4757',
  primaryDark: '#D32F3C',
  danger: '#E5322B',
  locked: '#C9C4B8',

  outline: '#16161D',
  paper: '#F5F1E8',
  accent: '#FFD23F',
  accent2: '#2E6BE6',
  screentoneLight: '#E7E2D6',
  screentoneMid: '#C9C3B5',
  screentoneDark: '#9A9488',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sharp: 4,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: Palette.ink,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 6,
  },
} as const;

export const Fonts = {
  display: 'MangaDisplay',
  body: 'MangaBody',
  bodyBold: 'MangaBodyBold',
} as const;
