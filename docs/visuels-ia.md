# Visuels IA de Plif Plaf — guide d'intégration

L'app fonctionne **dès maintenant** avec des accessoires *dessinés en code* (placeholders,
voir `src/data/items.ts`, champ `draw`). Ce document explique comment passer aux **vrais
visuels générés par IA**, en couches transparentes, sans rien casser.

## 1. Principe : des couches qui s'alignent toutes seules

`DimAvatar` empile des images de **même taille** en position absolue. Donc toutes les
images doivent être générées sur **le même canevas**, personnage centré, le reste transparent :

- Canevas : **1024 × 1024 px**, fond **transparent** (PNG).
- Le **corps de Dim** occupe la zone centrale (≈ 60 % de la hauteur, centré).
- Chaque accessoire est dessiné **à sa place finale sur ce canevas** (un chapeau en haut,
  des chaussures en bas…) et **tout le reste est transparent**.
- Résultat : on superpose corps + chapeau + lunettes… et tout tombe pile au bon endroit,
  sans calcul de position.

Ordre d'empilement (déjà géré par le code, champ `zIndex`) :
`cape(5) < corps(8) < tenue(10) < chaussures(15) < accessoire(20) < cheveux(30) < chapeau(40) < lunettes(50)`

## 2. Style commun (à mettre dans chaque prompt)

> Personnage mascotte « blob » rond et mignon, style flat / cartoon pour enfants,
> couleurs douces, contours doux, ombrage minimal, **fond transparent**,
> centré, vue de face. Rendu propre type sticker.

## 3. Prompts par image

**Corps de base** (à embarquer dans l'app, `assets/dim/body.png`) :
> Un petit personnage blob vert arrondi, ventre plus clair, deux grands yeux ronds
> amicaux, petit sourire, deux petits pieds. Vue de face, centré, fond transparent.

**Accessoires** (un par image, même cadrage que le corps, le reste transparent) :
- `cap_red` : « une casquette rouge posée sur le haut de la tête, reste transparent »
- `glasses_nerd` : « des lunettes rondes à la hauteur des yeux, reste transparent »
- `crown_gold` : « une couronne dorée sur le haut de la tête, reste transparent »
- `bowtie_pink` : « un nœud papillon rose sous le visage, reste transparent »
- `sneakers_white` : « une paire de baskets blanches en bas, reste transparent »
- … (un prompt par objet de `src/data/items.ts`)

> Astuce : génère d'abord le corps, puis demande au modèle de garder **exactement le
> même cadrage** et de ne dessiner que l'accessoire. Détoure ensuite (suppression du
> fond) pour garantir la transparence, puis exporte en PNG.

## 4. Brancher les images dans l'app

Deux options :

**a) Images embarquées (simple, sans Storage).** Mets les PNG dans `assets/dim/` et
remplace, dans `src/data/items.ts`, le champ `draw` par `image: require('@/assets/dim/cap_red.png')`.
(Adapter le type `Item.image` pour accepter un `require`/`number`, et le `<Image source>`
dans `DimAvatar`.)

**b) Images sur Firebase Storage (recommandé, catalogue dynamique).**
1. Active **Storage** dans la console Firebase (nécessite le plan **Blaze** sur un projet
   récent — voir tâche ci-dessous).
2. Uploade les PNG (ex. `gs://plif-plaf-app.firebasestorage.app/items/cap_red.png`).
3. Récupère l'URL de téléchargement et mets-la dans le champ `image` du catalogue Firestore
   (voir `scripts/seed-catalog.mjs`). Le corps de base reste embarqué dans l'app.
4. `DimAvatar` charge déjà les `image` via `expo-image` — rien d'autre à changer côté app.

## 5. Activer Firebase Storage

Storage n'a pas pu être activé automatiquement (les nouveaux projets exigent le plan
**Blaze**). Pour l'activer :
1. Console Firebase → projet **plif-plaf-app** → **Build → Storage → Commencer**.
2. Passer le projet en **Blaze** si demandé (un budget/alerte peut être fixé ; l'usage
   reste gratuit en dessous des quotas).
3. Déployer les règles : crée un `storage.rules` (lecture publique, écriture refusée) et
   `firebase deploy --only storage`.

## 6. Seed du catalogue Firestore

Voir `scripts/seed-catalog.mjs`. Tant que la collection `catalog` est **vide**, l'app
utilise automatiquement le catalogue de secours dessiné (`FALLBACK_CATALOG`). Dès qu'on
seede Firestore (avec ou sans `image`), l'app bascule sur le catalogue distant.
