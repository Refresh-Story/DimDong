# Dim-Dong 🪥💎

Application iOS (Expo / React Native + Firebase) qui motive un enfant à se brosser les
dents : un minuteur de **2 minutes** fait gagner des **gemmes**, dépensées dans une
**Boutique** pour habiller le personnage **Dim**.

## Lancer l'app

L'app utilise le workflow **prebuild** (build natif, plus d'Expo Go) :

```bash
npm install
npx expo run:ios   # génère ios/, pod install, build et lance le simulateur
```

> Build TestFlight : `npm run submit:ios` (EAS build production + auto-submit).
> La config Firebase iOS `GoogleService-Info.plist` (projet **dim-dong**) doit être à la racine.

## La boucle de jeu

1. Accueil : Dim dans son salon de dim-sum, niveau et gemmes.
2. **Se brosser les dents** → minuteur 2 min (guidage par zones, vibrations).
3. Fin du minuteur → **gemmes + XP** (chaque brossage est récompensé).
4. **Boutique** → acheter un accessoire.
5. **Mes objets** → équiper/déséquiper, Dim change en direct.

## Structure

| Fichier | Rôle |
|---|---|
| `src/app/` | Écrans (expo-router) : `index` (accueil), `onboarding`, `timer`, `shop`, `inventory` |
| `src/context/GameContext.tsx` | État global + actions (`brushCompleted`, `buyItem`, `equipItem`). Données joueur **locales** (AsyncStorage) ; catalogue lu depuis Firestore |
| `src/components/DimAvatar.tsx` | Personnage en couches (corps + accessoires empilés) |
| `src/components/Scene.tsx` | Décor (ciel, soleil, herbe, barrière) |
| `src/data/items.ts` | Catalogue + catégories (placeholders dessinés `draw`) |
| `src/game/rules.ts` | Durée, gains, niveaux |
| `src/firebase.ts` | Init `@react-native-firebase` (Firestore, lecture seule) |

## Données & Firebase

- **Données joueur** (gems, achats, équipement, paramètres) : **100 % locales à l'iPhone**
  via AsyncStorage (clé `dimdong.player`). **Aucune auth, aucun cloud utilisateur.**
- **Catalogue partagé** (items achetables, prix, images) : Firestore du projet **dim-dong**,
  en **lecture seule** (`@react-native-firebase/firestore`), mis en cache local
  (`dimdong.catalog`) pour l'offline. Ajouter un item = un doc `catalog/<id>` + un PNG dans
  Storage, **sans redéployer l'app**.
- Images des items : Firebase **Storage** (PNG publics), chargés par `expo-image`.
- Seed/upload : [`scripts/render-items.mjs`](scripts/render-items.mjs) (rasterise + upload Storage),
  [`scripts/seed-catalog.mjs`](scripts/seed-catalog.mjs) (push Firestore). Voir aussi
  [`docs/visuels-ia.md`](docs/visuels-ia.md).

## Visuels

Dim et ses accessoires sont **dessinés en SVG vectoriel** dans
[`src/components/DimAvatar.tsx`](src/components/DimAvatar.tsx) : net à toutes les
tailles, transparent, en couches (champ `draw` du catalogue). Pour ajouter un objet,
ajouter une entrée dans `src/data/items.ts` et son cas SVG dans `DimAvatar`.

Option future (rendu bitmap plus illustré) : `DimAvatar` gère aussi un champ `image`
(overlay aligné) — voir [`docs/visuels-ia.md`](docs/visuels-ia.md).
