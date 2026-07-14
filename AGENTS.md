# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Catalogue & publication

- Les items de la boutique (prix, raretés, visuels SVG) vivent uniquement dans `src/data/items.ts` — pas de backend.
- Publier un changement JS (nouvel item, prix…) : commit puis `eas update --channel production` (OTA, sans review App Store).
- Tout changement natif (nouveau module, config app.json native) exige un build store : `npm run submit:ios`.
