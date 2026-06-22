// Palette et espacements de Dim-Dong — un univers doux et enfantin.

export const Palette = {
  // Ambiance asiatique "salon de dim-sum" : mur chaud, lanternes, vapeur, bambou.
  wallTop: '#FFF3E0', // mur crème chaud
  wallBottom: '#FBE0C2', // pêche
  steamerLight: '#EBC983', // bambou clair
  steamer: '#E0B968',
  steamerDark: '#C7973F', // ombre du panier
  steamerRim: '#B07F30', // bord du panier
  weave: '#D2A659', // lignes de tressage
  lantern: '#D6453F', // rouge porte-bonheur
  lanternDark: '#A8322D',
  lanternGold: '#F4C430',
  steam: '#FFFFFF',

  ink: '#4A3526', // texte brun chaud
  inkSoft: '#8A6F58',
  white: '#FFFFFF',

  gem: '#46C9E8',
  gemDark: '#1B8FB0',
  gold: '#F4B740',

  card: '#FFFFFF',
  cardSoft: '#FBE8D4', // crème chaud
  panel: '#FFF6EC', // fond d'écran chaud

  primary: '#1FA37A', // jade (boutons d'action)
  primaryDark: '#15795A',
  danger: '#D6453F',
  locked: '#DAC9B4',
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
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#3A4A1E',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;
