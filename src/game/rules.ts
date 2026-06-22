// Règles de jeu de Dim-Dong : durée du brossage, gains, niveaux.

export const BRUSH_DURATION_SEC = 120; // 2 minutes
export const GEMS_PER_BRUSH = 10;
export const STARTING_GEMS = 30; // pécule de départ d'un nouveau joueur
export const MAX_REWARDED_BRUSHES_PER_DAY = 2; // matin + soir

// Brossage divisé en 4 zones (15 s chacune) avec un petit guidage.
export const BRUSH_ZONES = [
  'En haut à gauche',
  'En haut à droite',
  'En bas à gauche',
  'En bas à droite',
] as const;

// Chaque brossage récompensé = +1 XP. Le niveau augmente tous les LEVEL_STEP brossages.
const LEVEL_STEP = 4;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / LEVEL_STEP) + 1;
}

// Progression (0..1) à l'intérieur du niveau courant, pour la jauge.
export function levelProgress(xp: number): number {
  return (xp % LEVEL_STEP) / LEVEL_STEP;
}

export function xpForNextLevel(xp: number): { current: number; needed: number } {
  return { current: xp % LEVEL_STEP, needed: LEVEL_STEP };
}

// Clé de jour locale (YYYY-MM-DD) pour le plafond journalier.
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
