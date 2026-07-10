// Seed de la collection Firestore `catalog` pour Dim-Dong.
//
// Prérequis :
//   1) npm i -D firebase-admin
//   2) Une clé de compte de service (Console Firebase → Paramètres du projet →
//      Comptes de service → Générer une nouvelle clé privée), posée à la racine du
//      repo sous le nom serviceAccountKey.json (détectée automatiquement), ou :
//        export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json
//
// Lancement :
//   node scripts/seed-catalog.mjs
//
// Les règles Firestore interdisent l'écriture sur `catalog` depuis les clients ;
// ce script utilise le SDK Admin (droits serveur) pour la peupler.
//
// Astuce : une fois les visuels IA prêts, ajoute un champ `image` (URL Storage) à
// chaque objet de catalog.seed.json, puis relance ce script.

import { readFile } from 'node:fs/promises';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import { credentialsHelp, ensureAdminCredentials } from './credentials.mjs';

const PROJECT_ID = 'dim-dong';

async function main() {
  if (!ensureAdminCredentials()) {
    console.error(`❌ ${credentialsHelp()}`);
    process.exit(1);
  }

  const items = JSON.parse(
    await readFile(new URL('./catalog.seed.json', import.meta.url), 'utf8')
  );

  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  const batch = db.batch();
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(db.collection('catalog').doc(id), data, { merge: true });
  }
  await batch.commit();

  console.log(`✅ ${items.length} objets écrits dans la collection "catalog".`);
}

main().catch((e) => {
  console.error('❌ Échec du seed :', e);
  process.exit(1);
});
