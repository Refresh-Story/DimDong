# Visuels manga de Dim-Dong — guide

Les visuels (personnage, accessoires, décors) sont **dessinés en code**, en style manga
(contours d'encre, ombrage cel, grands yeux). Une **source unique** sert à la fois l'app
et la génération des PNG → app et images **pixel-identiques**.

## Source unique : `src/art/dimArt.ts`

Fonctions qui renvoient des **chaînes SVG** (cadre 200×260 pour le personnage/accessoires,
100×120 pour les décors) :

- `bodyDoc(dough, { rainbow?, id?, emotion? })` — corps de Dim (dim-sum). `id` namespace les
  `<defs>` ; `emotion` (`joy` par défaut, `sad`, `angry`, `serene`, `scared`) change le visage.
  Les PNG générés gardent le visage `joy` : quand une autre émotion est active, `DimAvatar`
  retombe sur le tracé SVG.
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

## Décors : `src/art/sceneGeom.ts`, `sceneArt.ts`, `sceneCompose.ts`

Les décors suivent les mêmes règles de tracé que le personnage (aplat → ombre cel → contour
d'encre re-tracé), avec trois principes en plus.

### 1. L'art est généré POUR sa boîte

`sceneGeom(w, h)` donne la géométrie de la scène (`horizonY`, `skyH`, `floorH`, `u`) ;
`artFrame(boxW, boxH)` en dérive un cadre de largeur fixe (390) et de **hauteur proportionnelle
à la boîte cible**. Le `viewBox` a donc le même ratio que sa boîte : rien n'est rogné, et tout
rejoint l'horizon exactement — sur n'importe quel iPhone, dans la carte d'aperçu comme dans une
vignette de 72 px. C'est ce qui remplace les anciennes hauteurs fixes par décor, qui étaient
dérivées de la largeur d'écran alors que l'horizon dérive de la hauteur.

Repères : dans un **ciel**, `y = f.h` EST la ligne d'horizon ; dans un **sol**, `y = 0` l'est.
Les épaisseurs de trait restent en unités d'art (2,4 à 3,4) ; les positions s'ancrent en
fractions de `f.w` / `f.h`.

### 2. La profondeur se joue sur le contour, pas sur la couleur

Un plan lointain **perd son trait d'encre** et se mélange vers `sky.bottom` (`haze()`, qui
s'appuie sur `mix()` dans `dimArt.ts`). Tant que toutes les formes portent le même contour noir,
elles sont à la même distance — c'est le levier le plus rentable du système, avant tout dégradé.

Chaque décor livre quatre plans : `sky.back` (dégradé, astre, silhouettes lointaines),
`sky.mid` (l'élément héros), `sky.front` (cadrage de premier plan, collé à l'horizon) et
`ground`. Les deux premiers dérivent lentement en parallaxe ; le plan avant reste fixe, puisque
c'est lui qui touche l'horizon.

### 3. Le sol est un plan, pas une texture

- `groundRows(H, n, p)` — ordonnées des lignes transversales, comprimées vers l'horizon.
- `convergingColumns(fg, m, spread)` / `xAtDepth(fg, xNear, y)` — fuyantes vers un point de fuite
  **relevé au-dessus de l'horizon** (`VP_LIFT`). Une convergence exacte ferait un tunnel sur une
  bande qui ne fait que 40 % de la hauteur.
- `depthScale(y, H)` — taille d'un motif selon sa profondeur.

### Règles dures

- **Pas de `<filter>`.** Ils parsent des deux côtés, mais react-native-svg et resvg ne les rendent
  pas pareil : l'app et les PNG de l'App Store divergeraient. Les halos se font au dégradé radial
  à stop externe transparent (`radGlow`).
- **Tous les ids de `<defs>` sont namespacés** par le `scope` de la scène (`home`, `preview`,
  `thumb`…). Deux scènes coexistent dès qu'on ouvre l'aperçu de la boutique.
- **Ne pas laisser de géométrie très loin hors d'une zone de clip** : resvg 2.6 plante
  (`geom.rs:27`) quand un groupe clippé n'a aucun contenu dans son clip.

### Boucle de travail

```
npx tsx scripts/render-scenes.mjs                       # 9 décors × 4 formats + planches-contact
npx tsx scripts/render-scenes.mjs --only=neon --guides  # un décor, avec les repères de mise en page
```

> Volontairement **pas** de script npm : `app.json` utilise `runtimeVersion.policy = "fingerprint"`,
> et le bloc `scripts` de `package.json` fait partie de l'empreinte native. Y ajouter une commande
> d'outillage change la runtimeVersion et empêche silencieusement un `eas update` d'atteindre les
> builds déjà installés. Même raison pour l'ignore des PNG, placé dans `.git/info/exclude` plutôt
> que dans `.gitignore` (lui aussi source d'empreinte).

Sortie dans `scripts/scene-png/` (ignoré localement). Le script et l'app appellent le **même**
compositeur (`src/art/sceneCompose.ts`) : les aperçus ne peuvent pas mentir. `_contact--*.png`
est l'image à regarder pour juger « ces décors font-ils famille ? ».
