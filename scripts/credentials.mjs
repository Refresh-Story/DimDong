import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, '..');

const CANDIDATES = [
  join(REPO_ROOT, 'serviceAccountKey.json'),
  join(SCRIPTS_DIR, 'serviceAccountKey.json'),
  join(REPO_ROOT, 'secrets', 'serviceAccountKey.json'),
];

export function ensureAdminCredentials() {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      console.warn(`⚠️  GOOGLE_APPLICATION_CREDENTIALS pointe vers un fichier introuvable : ${fromEnv}`);
    }
    return fromEnv;
  }
  for (const path of CANDIDATES) {
    if (existsSync(path)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = path;
      console.log(`🔑 Clé de compte de service détectée : ${path}`);
      return path;
    }
  }
  return null;
}

export function credentialsHelp() {
  return [
    'Aucune clé de compte de service trouvée. Deux options :',
    '  1) Place ton serviceAccountKey.json à la racine du repo (ou dans scripts/),',
    '  2) ou exporte GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/serviceAccountKey.json',
    'Clé à générer via Console Firebase → Paramètres du projet → Comptes de service.',
  ].join('\n');
}
