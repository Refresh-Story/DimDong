
export const BRUSH_DURATION_SEC = 120;
export const GEMS_PER_BRUSH = 10;
export const STARTING_GEMS = 30;

export const BRUSH_ZONES = [
  'En haut à gauche',
  'En haut à droite',
  'En bas à gauche',
  'En bas à droite',
] as const;

const LEVEL_STEP = 4;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / LEVEL_STEP) + 1;
}

export function levelProgress(xp: number): number {
  return (xp % LEVEL_STEP) / LEVEL_STEP;
}

export function xpForNextLevel(xp: number): { current: number; needed: number } {
  return { current: xp % LEVEL_STEP, needed: LEVEL_STEP };
}

export type Belt = { maxLevel: number; label: string; color: string; accent?: string };

// Une ceinture tous les 3 niveaux : Blanche 1-3, Jaune 4-6, Orange 7-9…
export const BELTS: Belt[] = [
  { maxLevel: 3, label: 'Blanche', color: '#ECECEC' },
  { maxLevel: 6, label: 'Jaune', color: '#F4D23C' },
  { maxLevel: 9, label: 'Orange', color: '#E8852B' },
  { maxLevel: 12, label: 'Verte', color: '#3DA45A' },
  { maxLevel: 15, label: 'Bleue', color: '#2F73CC' },
  { maxLevel: 18, label: 'Marron', color: '#7A4A24' },
  { maxLevel: Infinity, label: 'Noire', color: '#22222A' },
];

export function beltForLevel(level: number): Belt {
  return BELTS.find((b) => level <= b.maxLevel) ?? BELTS[BELTS.length - 1];
}

// Ceinture des grands maîtres, réservée aux noms contenant « sensei ».
export const SENSEI_BELT: Belt = { maxLevel: Infinity, label: 'Sensei', color: '#22222A', accent: '#C62828' };

export function isSenseiName(name: string): boolean {
  return name.toLowerCase().includes('sensei');
}

export function earnedBelts(level: number): Belt[] {
  return BELTS.slice(0, BELTS.indexOf(beltForLevel(level)) + 1);
}

// Ceintures portables : celles déjà obtenues, plus la Sensei si le nom s'y prête.
export function availableBelts(name: string, level: number): Belt[] {
  const belts = earnedBelts(level);
  return isSenseiName(name) ? [...belts, SENSEI_BELT] : belts;
}

// La ceinture choisie si elle est disponible, sinon celle du niveau.
export function beltForPlayer(name: string, level: number, selectedBelt: string | null): Belt {
  const selected = availableBelts(name, level).find((b) => b.label === selectedBelt);
  return selected ?? beltForLevel(level);
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
