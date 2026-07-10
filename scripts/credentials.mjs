// Résolution des credentials Firebase Admin pour les scripts de seed/rendu.
//
// `applicationDefault()` ne lit QUE la variable d'environnement
// GOOGLE_APPLICATION_CREDENTIALS : avoir un serviceAccountKey.json sur le disque ne
// suffit pas. Ce helper cherche la clé aux emplacements habituels du repo et renseigne
// la variable pour le process courant, afin que `node scripts/… .mjs` marche sans
// `export` préalable.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPTS_DIR, '..');

// Emplacements sondés, dans l'ordre (tous ignorés par git — cf. .gitignore).
const CANDIDATES = [
  join(REPO_ROOT, 'serviceAccountKey.json'),
  join(SCRIPTS_DIR, 'serviceAccountKey.json'),
  join(REPO_ROOT, 'secrets', 'serviceAccountKey.json'),
];

// Renseigne GOOGLE_APPLICATION_CREDENTIALS si nécessaire. Retourne le chemin utilisé,
// ou null si aucune clé n'a été trouvée (l'appelant décide si c'est bloquant).
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
