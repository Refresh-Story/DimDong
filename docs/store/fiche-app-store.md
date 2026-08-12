# Fiche App Store — Dim-Dong

Source de vérité des textes de la fiche. Chaque champ est dans un bloc `>` pour rester
vérifiable par `npm run check:store-copy` (limites App Store : 30 / 170 / 4000 / 100).

## Nom (max 30 caractères)

> Dim-Dong : brossage de dents

Le nom est le champ le plus fort pour la recherche — « brossage de dents » y vaut bien
plus que dans les mots-clés. Modifiable uniquement avec une nouvelle version soumise.

## Sous-titre (max 30 caractères)

> Le jeu qui motive le brossage

## Texte promotionnel (max 170 caractères)

> Fini la bataille du brossage ! Dim, adorable dim sum judoka, transforme les 2 minutes en jeu : gemmes, objets à collectionner, ceintures à gagner. Sans pub ni achats.

## Description (max 4 000 caractères)

Chaque matin et chaque soir, c'est la même bataille pour se brosser les dents ? Dim-Dong la transforme en moment préféré de la journée.

Voici Dim : un petit dim sum tout mignon en kimono de judo. Il attend ton enfant pour l'accompagner pendant le brossage — et il a plein de choses à lui faire gagner.

POURQUOI ÇA MARCHE
• 2 minutes de brossage, la durée recommandée par les dentistes
• Un minuteur rythmé en 4 étapes, avec une petite vibration à chaque changement
• Chaque brossage terminé rapporte des gemmes et fait progresser Dim
• Résultat : c'est l'enfant qui réclame le brossage, pas l'inverse

UN COMPAGNON À CHOUCHOUTER
• Donne-lui le nom que tu veux
• Dim exprime ses émotions d'un simple geste : joie, sérénité, tristesse, colère, peur
• Habille-le et regarde-le changer en direct

32 OBJETS À COLLECTIONNER
• Casquettes, couronne dorée, lunettes, cape de héros, katanas croisés…
• Change la couleur de sa pâte : rose, matcha, chocolat, dorée… jusqu'à la légendaire pâte Rainbow et son aura arc-en-ciel
• 8 décors manga à débloquer : forêt de bambous, dojo, restaurant de sushis, jardin de sakura, festival matsuri, la Grande Vague, Tokyo néon… et même la Lune !

DE LA CEINTURE BLANCHE À LA CEINTURE NOIRE
• Chaque brossage rapporte de l'expérience
• La ceinture du kimono de Dim évolue comme au judo : blanche, jaune, orange, verte, bleue, marron… noire !
• Suis ta progression sur l'écran « Mon parcours »

PENSÉ POUR LES PARENTS
• 0 publicité
• 0 achat intégré : tout se gagne en se brossant les dents
• 0 compte à créer : les données restent sur l'appareil
• 100 % hors ligne
• Une routine saine qui s'installe toute seule, matin et soir

Dim t'attend. À ta brosse !

## Mots-clés (max 100 caractères)

> enfant,minuteur,dentiste,routine,hygiene,manga,kawaii,tamagotchi,recompense,famille,sante,dentaire

Règles : pas d'espace après les virgules ; ne pas répéter les mots du nom
(« brossage », « dents ») ni du sous-titre (« jeu », « motive ») — Apple les indexe déjà.

## Nouveautés (template, max 4 000 caractères)

À adapter à chaque version :

> Dim a fait le plein d'énergie pour cette mise à jour !
>
> • Nouveau : …
> • Amélioré : …
> • Corrigé : …
>
> Bon brossage !

## Screenshots

Générés par `npm run render:store-screenshots` à partir des captures brutes de
`docs/store/screenshots/raw/` (voir `scripts/render-store-screenshots.mjs`).
Sorties : `docs/store/screenshots/marketing/6.9-inch/` (1320×2868) et
`marketing/6.5-inch/` (1284×2778).

Captures brutes attendues dans `raw/` (plein écran, avec barre de statut — elle est
rognée à la composition) : `01-accueil.png`, `02-brossage.png`, `03-boutique.png`,
`04-parcours.png`.

Ordre (les 3 premiers apparaissent dans les résultats de recherche) :

1. Accueil — « Adieu la corvée du brossage ! » (fond rouge, pétales)
2. Brossage en cours — « 2 minutes qui passent trop vite ! » (fond papier, lignes de vitesse)
3. Boutique — « Des gemmes à chaque brossage » (fond cyan, gemmes)
4. Mon parcours — « De la ceinture blanche à la noire ! » (fond or, pastilles de ceintures)
5. Panneau parents (composé, sans capture) — « Pensé pour les parents » : 0 publicité,
   0 achat intégré, 0 compte à créer, 100 % hors ligne

## Checklist d'upload (App Store Connect)

Sur https://appstoreconnect.apple.com → Mes apps → Dim-Dong → version FR :

1. `npm run check:store-copy` doit être vert.
1bis. Nom → champ « Nom » (nécessite une nouvelle version en préparation).
2. Sous-titre → champ « Sous-titre » (fiche de l'app). Tant qu'il est vide, l'App Store
   affiche la catégorie (« Forme et santé ») à la place dans les résultats de recherche.
3. Texte promotionnel → champ « Texte promotionnel » (modifiable sans nouvelle version).
4. Description → champ « Description ».
5. Mots-clés → champ « Mots-clés » (invisible au public).
6. Screenshots : glisser les 5 PNG de `marketing/6.9-inch/` (iPhone 6,9") puis ceux de
   `marketing/6.5-inch/` (iPhone 6,5") dans l'ordre ci-dessus.
7. Nouveautés → champ « Nouveautés de cette version » (à partir du template).
8. URLs d'assistance et de confidentialité : vérifier qu'elles pointent vers les pages
   publiées de `docs/assistance.html` et `docs/confidentialite.html`.

## Notes

- Régénéré le 2026-08-11. Chiffres vérifiés dans le code : 32 objets (`src/data/items.ts`),
  2 min / 10 gemmes par brossage (`src/game/rules.ts`), aucun plafond journalier
  (`src/game/economy.ts`), 7 ceintures + Sensei cachée.
- « Pas de publicité / pas d'achats intégrés / pas de compte / hors ligne » : vérifié dans
  le code à cette date — à re-vérifier avant chaque soumission.
