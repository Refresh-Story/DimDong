# Visuels manga de Dim-Dong — guide

Les visuels (personnage, accessoires, décors) sont **dessinés en code**, en style manga
(contours d'encre, ombrage cel, grands yeux). Une **source unique** sert à la fois l'app
et la génération des PNG → app et images **pixel-identiques**.

## Source unique : `src/art/dimArt.ts`

Fonctions qui renvoient des **chaînes SVG** (cadre 200×260 pour le personnage/accessoires,
100×120 pour les décors) :

- `bodyDoc(dough, { rainbow?, id? })` — corps de Dim (dim-sum). `id` namespace les `<defs>`.
- `accessoryDoc(draw, color)` — un accessoire (`cap`, `crown`, `beanie`, `glasses`,
  `sunglasses`, `bowtie`, `scarf`, `sneakers`, `cape`, `tuft`).
- `decorDoc(kind, color)` — une décoration (`bonsai`, `sakura`, `bamboo`, `lantern`, `teapot`).

Règle de tracé manga : aplat → ombre cel → **contour d'encre re-tracé par-dessus**
(garantit des bords nets, jamais mangés par l'ombre).

## Consommateurs

- **App (runtime)** : `DimAvatar` et `Decor` rendent ces chaînes via `SvgXml`
  (react-native-svg). `DimAvatar` empile les couches (corps + cosmétiques) triées par
  `zIndex` (cape derrière, chapeau devant…). Les cosmétiques avec un champ `image`
  (PNG Firebase) priment sur le tracé SVG ; sinon le tracé manga est utilisé (fallback
  hors-ligne / catalogue vide → `FALLBACK_CATALOG`).
- **Génération PNG** : `scripts/render-items.mjs` (lancé avec `tsx`) importe le même module,
  rasterise chaque item via `@resvg/resvg-js` (×4) et uploade sur Firebase Storage
  `catalog/<id>.png` (jeton de téléchargement déterministe → remplace en place).

## Ajouter / modifier un visuel

1. Édite la forme dans `src/art/dimArt.ts` (l'app se met à jour immédiatement en dev).
2. Régénère + réuploade les PNG :
   ```
   npm run render:items -- --dry-run     # aperçu local (scripts/catalog-png/)
   export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   npm run render:items                  # upload Storage + patch catalog.seed.json
   npm run seed:catalog                  # écrit le champ image dans Firestore
   ```

## Couleurs de pâte

Les items `category: 'color'` sont des **corps complets** (pas une teinte) : le script rend
`bodyDoc(color, { rainbow })` en plein corps, et `DimAvatar` remplace le corps par cette
image quand la couleur est équipée. Le `rainbow` ajoute un dégradé arc-en-ciel + étincelles.

> Note : les jetons de téléchargement étant déterministes (dérivés de l'id), réuploader un
> item conserve la même URL → l'app affiche la nouvelle image sans re-seed (le re-seed reste
> utile quand un item gagne un champ `image` pour la première fois, ex. les couleurs).
