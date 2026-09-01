/**
 * Géométrie de scène — module **pur** (aucun import react-native).
 *
 * C'est la condition pour que `scripts/render-scenes.mjs` importe exactement la même
 * math que l'app : si le script recalculait la mise en page de son côté, les aperçus
 * dériveraient et on jugerait la qualité des décors sur un mensonge.
 *
 * Repères, valables partout :
 *   - Ciel  : y = 0 en haut de la BANDE de ciel (donc sous la réserve `top`, cf. `sceneGeom`),
 *             y = frame.h EST la ligne d'horizon.
 *   - Sol   : y = 0 EST la ligne d'horizon, y = frame.h est le bas de l'écran (au plus près).
 */

/** Largeur d'unité d'art. Les épaisseurs de trait sont exprimées dans ce repère. */
export const SCENE_W = 390;

/** Part de la hauteur d'écran occupée par le sol. */
export const FLOOR_RATIO = 0.4;

/** De combien les pieds d'une décoration s'enfoncent sous l'horizon. */
export const PLANT_DEPTH = 22;

export type SceneGeom = {
  /** Largeur de la boîte de scène, en px appareil. */
  w: number;
  /** Hauteur de la boîte de scène, en px appareil. */
  h: number;
  /** Hauteur réservée en haut de la boîte (HUD) : le ciel commence à cette ordonnée. */
  top: number;
  /** Distance du haut de la boîte à la ligne d'horizon, en px. */
  horizonY: number;
  /** Hauteur de la bande de ciel (= horizonY - top). */
  skyH: number;
  /** Hauteur de la bande de sol. */
  floorH: number;
  /** Où reposent les pieds des décorations. */
  groundY: number;
  /** Facteur unité d'art → px appareil. */
  u: number;
  /** Abscisse du point de fuite. */
  vanishX: number;
  aspect: number;
  floorRatio: number;
};

/**
 * `topReserve` : bande du haut de l'écran que la scène cède au HUD. Elle est prise **sur le
 * seul ciel** — l'horizon, le sol et les décorations restent exactement où ils étaient, seule
 * la bande de ciel raccourcit et son art se recompose dans le nouveau cadre (cf. `artFrame`).
 * Bornée à la moitié du ciel : un petit écran ne peut pas produire une bande dégénérée.
 */
export function sceneGeom(w: number, h: number, floorRatio = FLOOR_RATIO, topReserve = 0): SceneGeom {
  const horizonY = Math.round(h * (1 - floorRatio) * 10) / 10;
  const top = Math.max(0, Math.min(topReserve, horizonY * 0.5));
  return {
    w,
    h,
    top,
    horizonY,
    skyH: horizonY - top,
    floorH: h - horizonY,
    groundY: horizonY + PLANT_DEPTH,
    u: w / SCENE_W,
    vanishX: w / 2,
    aspect: h / w,
    floorRatio,
  };
}

/**
 * Cadre d'art : largeur figée à SCENE_W, hauteur dérivée du ratio de la boîte cible.
 * Le viewBox a donc le même ratio que sa boîte par construction → `preserveAspectRatio`
 * devient sans effet, rien n'est rogné, et tout atterrit là où c'est dessiné.
 * La hauteur est quantifiée au demi-point pour que la clé de cache reste stable.
 */
export type ArtFrame = { w: number; h: number };

export function artFrame(boxW: number, boxH: number): ArtFrame {
  return { w: SCENE_W, h: Math.round((SCENE_W * boxH) / boxW * 2) / 2 };
}

/** Cadre du ciel / du sol d'une scène donnée. */
export function skyFrame(g: SceneGeom): ArtFrame {
  return artFrame(g.w, g.skyH);
}
export function groundFrame(g: SceneGeom): ArtFrame {
  return artFrame(g.w, g.floorH);
}

// ---------------------------------------------------------------------------
// Perspective du plan de sol
// ---------------------------------------------------------------------------

/**
 * Ordonnées des lignes transversales d'un sol vu en perspective, pour n lignes
 * régulièrement espacées **dans le monde**. Repère sol : y = 0 à l'horizon, y = H au plus près.
 *
 * Sous une caméra sténopé regardant un plan, l'écart sous l'horizon varie en 1/distance.
 * `p` est la position de la ligne la plus lointaine, en fraction de H : plus p est petit,
 * plus la pièce est profonde. La bande [0, p·H) reste volontairement vide — c'est la brume.
 */
export function groundRows(H: number, n: number, p = 0.18): number[] {
  const k = 1 / p;
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 1 : i / (n - 1);
    return H / (k + t * (1 - k));
  });
}

/**
 * Fuyantes : pour m intervalles, les abscisses au bord proche des lignes qui convergent
 * vers le point de fuite. `spread > 1` pousse les colonnes extérieures hors du cadre en bas,
 * ce qui est précisément ce qui fait « lire » le plan.
 */
export function convergingColumns(fg: ArtFrame, m: number, spread = 2.2): number[] {
  return Array.from({ length: m + 1 }, (_, j) => fg.w / 2 + (j / m - 0.5) * fg.w * spread);
}

/**
 * De combien le point de fuite est remonté AU-DESSUS de l'horizon, en fraction de la bande.
 *
 * Une convergence géométriquement exacte ferait se rejoindre toutes les fuyantes en un point
 * unique sur l'horizon : sur une bande qui ne fait que 40 % de la hauteur, ça se lit comme un
 * tunnel, pas comme un sol. Relever le point de fuite est la convention du jeu illustré.
 */
export const VP_LIFT = 0.62;

/** Abscisse, à la profondeur écran `y`, d'une fuyante qui vaut `xNear` au bord proche. */
export function xAtDepth(fg: ArtFrame, xNear: number, y: number): number {
  const L = fg.h * VP_LIFT;
  return fg.w / 2 + (xNear - fg.w / 2) * ((y + L) / (fg.h + L));
}

/** Échelle d'un motif posé au sol selon sa profondeur (1 au plus près, plancher à 0.18). */
export function depthScale(y: number, H: number, floor = 0.18): number {
  return Math.max(y / H, floor);
}

// ---------------------------------------------------------------------------
// Speed lines — géométrie partagée entre le composant RN et le compositeur SVG
// ---------------------------------------------------------------------------

export type SpeedLine = { x1: number; y1: number; x2: number; y2: number; w: number };

/**
 * Source unique de la géométrie des speed lines : `components/ui.tsx` et
 * `art/sceneCompose.ts` l'appellent tous les deux, ils ne peuvent donc plus diverger.
 */
export function speedLinePaths(
  size: number,
  count = 28,
  innerRatio = 0.42,
  strokeWidth = 2
): SpeedLine[] {
  const c = size / 2;
  const rOuter = size * 0.72;
  const rInner = size * innerRatio;
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const jitter = 0.82 + ((i * 47) % 100) / 100 / 3;
    return {
      x1: c + cos * rInner,
      y1: c + sin * rInner,
      x2: c + cos * rOuter * jitter,
      y2: c + sin * rOuter * jitter,
      w: strokeWidth * (i % 3 === 0 ? 1.8 : 1),
    };
  });
}
