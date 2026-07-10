
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
