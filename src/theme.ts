// Palette et espacements de Dim-Dong — univers "manga / anime" pour enfants 8-10 ans.
// Codes visuels : encre noire franche, papier, trames (screentone), accents punchy.
//
// Rétro-compatibilité : toutes les clés historiques sont conservées (les écrans qui
// lisent Palette.* / Shadow.card continuent de fonctionner). On a seulement re-ciblé
// leurs valeurs et ajouté des clés "manga".

export const Palette = {
  // --- Ambiance "salon de dim-sum", redessinée façon manga (encre + trames) ---
  // Conservées pour Scene.tsx ; contours/ombres encre gérés dans le composant.
  wallTop: '#FBF7EE', // papier clair (haut de mur)
  wallBottom: '#EFE7D4', // papier légèrement ombré (bas de mur)
  steamerLight: '#F2C14E', // bambou clair
  steamer: '#E0A92E',
  steamerDark: '#B07F1E', // ombre du panier
  steamerRim: '#8A5E16', // bord du panier
  weave: '#C28E2A', // lignes de tressage
  lantern: '#EE3B30', // rouge porte-bonheur (plus saturé, "manga")
  lanternDark: '#B7261D',
  lanternGold: '#F7C948',
  steam: '#FFFFFF',

  // --- Encre & papier (texte / fonds) ---
  ink: '#16161D', // encre quasi-noire : texte + contours
  inkSoft: '#5B5B66', // gris encre (texte secondaire)
  white: '#FFFFFF',

  // --- Récompenses ---
  gem: '#36C5F0', // cristal de gemme
  gemDark: '#1486AD',
  gold: '#F4B740',

  // --- Surfaces ---
  card: '#FFFFFF',
  cardSoft: '#ECE7DB', // papier crème (carte secondaire)
  panel: '#F5F1E8', // fond d'écran "papier manga"

  // --- Actions / accents ---
  primary: '#FF4757', // rouge manga énergique (boutons d'action)
  primaryDark: '#D32F3C',
  danger: '#E5322B',
  locked: '#C9C4B8', // grisé "papier" (désactivé)

  // --- Nouvelles clés manga ---
  outline: '#16161D', // contour encre (bordures de cases / composants)
  paper: '#F5F1E8', // alias sémantique du fond papier
  accent: '#FFD23F', // jaune "impact" (étoiles, bursts)
  accent2: '#2E6BE6', // bleu pop (accents secondaires)
  screentoneLight: '#E7E2D6', // trames (clair → foncé)
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
  sharp: 4, // coins quasi nets (look "case BD")
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

// Ombre "dure" décalée, sans flou : signature visuelle d'une case de BD/manga.
// (Le nom de clé `card` est conservé pour ne casser aucun consommateur existant.)
export const Shadow = {
  card: {
    shadowColor: Palette.ink,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 6,
  },
} as const;

// Familles de polices (chargées dans src/app/_layout.tsx via expo-font).
// `display` = titres / grands nombres (manga), `body` = texte courant lisible.
export const Fonts = {
  display: 'MangaDisplay', // Bangers (SIL OFL) — titres / grands nombres
  body: 'MangaBody', // Baloo 2 SemiBold (SIL OFL) — texte courant
  bodyBold: 'MangaBodyBold', // Baloo 2 ExtraBold — emphase / boutons
} as const;
