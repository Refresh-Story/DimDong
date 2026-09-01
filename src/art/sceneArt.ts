/**
 * Décors — dessin en SVG généré.
 *
 * Deux règles structurent tout le fichier.
 *
 * 1. **L'art est généré POUR sa boîte.** Chaque fonction reçoit un `ArtFrame` dont le ratio
 *    est celui de la boîte cible, donc `preserveAspectRatio` est sans effet : rien n'est
 *    rogné et tout atterrit exactement où c'est dessiné, sur n'importe quel appareil.
 *    Repères : dans un ciel, `y = f.h` EST la ligne d'horizon ; dans un sol, `y = 0` l'est.
 *
 * 2. **La profondeur se joue sur le contour, pas sur la couleur.** Un plan lointain perd son
 *    trait d'encre et se mélange vers `sky.bottom` (`haze`). C'est ce qui fait reculer un plan ;
 *    tant que tout porte le même contour noir, tout est à la même distance.
 *
 * Pas de `<filter>` : react-native-svg et resvg ne les rendent pas pareil, et l'app doit rester
 * pixel-identique aux PNG de l'App Store. Les halos se font au dégradé radial.
 */
import { darken, lighten, mix } from '@/art/dimArt';
import { type ArtFrame, convergingColumns, depthScale, groundRows, xAtDepth } from '@/art/sceneGeom';
import type { SceneKind, ScenePalette } from '@/data/backgrounds';

const INK = '#16161D';

/**
 * `cap` : couleur réellement peinte en y = 0 du cadre de ciel. Elle sert à remplir la bande
 * réservée au HUD au-dessus du ciel (cf. `SceneGeom.top`) sans laisser de couture. Par défaut
 * c'est `p.sky.top`, le premier arrêt du dégradé de fond — seuls les ciels qui repeignent tout
 * leur haut la renseignent.
 */
export type SkyParts = { defs: string; back: string; mid: string; front: string; cap?: string };
export type GroundParts = { defs: string; body: string };

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function svgDoc(f: ArtFrame, defs: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.w} ${f.h}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>`
  );
}

/** Facteur de « hauteur disponible » : un cadre écrasé (vignette) réduit la taille des objets. */
function roomy(f: ArtFrame): number {
  return Math.max(0.58, Math.min(1.12, f.h / 500));
}

/** Recule une couleur vers le fond de ciel. Le cœur de la perspective atmosphérique. */
function haze(c: string, p: ScenePalette, t = 0.55): string {
  return mix(c, p.sky.bottom, t);
}

function linGrad(id: string, top: string, bottom: string, midStop?: { c: string; at: number }): string {
  const mids = midStop ? `<stop offset="${midStop.at}" stop-color="${midStop.c}"/>` : '';
  return (
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/>${mids}<stop offset="1" stop-color="${bottom}"/>` +
    `</linearGradient>`
  );
}

/** Halo : dégradé radial dont le stop externe est transparent. Remplace le faux glow double-contour. */
function radGlow(id: string, color: string, inner = 0.85, core = 0.12): string {
  return (
    `<radialGradient id="${id}">` +
    `<stop offset="0" stop-color="${color}" stop-opacity="${inner}"/>` +
    `<stop offset="${core + 0.3}" stop-color="${color}" stop-opacity="${(inner * 0.35).toFixed(2)}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/>` +
    `</radialGradient>`
  );
}

function glowSpot(id: string, cx: number, cy: number, r: number): string {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${r.toFixed(1)}" ry="${r.toFixed(1)}" fill="url(#${id})"/>`;
}

/** Ombre de contact au sol : ce qui pose un objet plutôt que de le laisser flotter. */
export function contactShadow(cx: number, cy: number, rx: number, ry = rx * 0.28, o = 0.22): string {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${INK}" opacity="${o}"/>`;
}

/** Silhouette lointaine ondulante, sans contour, refermée sur le bas du cadre. */
function ridge(f: ArtFrame, yBase: number, amp: number, seed: number, fill: string, o = 1, bumps = 5): string {
  const n = Math.max(2, bumps);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = -12 + ((f.w + 24) * i) / n;
    const r = ((i * 37 + seed * 53) % 100) / 100;
    pts.push([x, yBase + (r - 0.5) * amp * 2]);
  }
  let d = `M-12 ${(f.h + 12).toFixed(1)} L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    d += ` Q${((px + x) / 2).toFixed(1)} ${Math.min(py, y).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  d += ` L${(f.w + 12).toFixed(1)} ${(f.h + 12).toFixed(1)} Z`;
  return `<path d="${d}" fill="${fill}" opacity="${o}"/>`;
}

function star4(cx: number, cy: number, s: number, fill: string, o = 1): string {
  const k = s * 0.22;
  return `<path d="M${cx} ${cy - s} Q${cx + k} ${cy - k} ${cx + s} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + s} Q${cx - k} ${cy + k} ${cx - s} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - s} Z" fill="${fill}" opacity="${o}"/>`;
}

function bambooLeaf(x: number, y: number, len: number, deg: number, fill: string, o = 1, ink = true): string {
  const w = len * 0.3;
  const stroke = ink ? ` stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"` : '';
  return (
    `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${deg})" opacity="${o}">` +
    `<path d="M0 0 Q${(len * 0.4).toFixed(1)} ${-w.toFixed(1)} ${len.toFixed(1)} ${(-w * 0.2).toFixed(1)} Q${(len * 0.45).toFixed(1)} ${(w * 0.6).toFixed(1)} 0 0 Z" fill="${fill}"${stroke}/>` +
    `</g>`
  );
}

function sakuraFlower(cx: number, cy: number, r: number, petal: string, ink = true): string {
  let petals = '';
  const stroke = ink ? ` stroke="${INK}" stroke-width="2"` : '';
  for (let i = 0; i < 5; i++) {
    petals += `<ellipse cx="0" cy="${(-r * 0.62).toFixed(1)}" rx="${(r * 0.38).toFixed(1)}" ry="${(r * 0.55).toFixed(1)}" fill="${petal}"${stroke} transform="rotate(${i * 72})"/>`;
  }
  return (
    `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">` +
    petals +
    (ink
      ? `<circle r="${(r * 0.2).toFixed(1)}" fill="#F4B740" stroke="${INK}" stroke-width="1.6"/>` +
        `<circle cx="${(r * 0.12).toFixed(1)}" cy="${(-r * 0.4).toFixed(1)}" r="${(r * 0.08).toFixed(1)}" fill="#FFFFFF" opacity="0.8"/>`
      : '') +
    `</g>`
  );
}

function lantern(x: number, y: number, s: number, body: string, gold: string, glowId?: string): string {
  const g = (v: number) => (v * s).toFixed(1);
  return (
    (glowId ? `<ellipse cx="${x.toFixed(1)}" cy="${(y + 24 * s).toFixed(1)}" rx="${g(46)}" ry="${g(46)}" fill="url(#${glowId})"/>` : '') +
    `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(3)})">` +
    `<line x1="0" y1="-14" x2="0" y2="6" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="-8" y="6" width="16" height="5" rx="2" fill="${gold}" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="-13" y="10" width="26" height="28" rx="12" fill="${body}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M-5 12 Q-6 24 -5 36 M5 12 Q6 24 5 36" stroke="${darken(body, 0.3)}" stroke-width="1.6" fill="none" opacity="0.6"/>` +
    `<ellipse cx="-5" cy="17" rx="4" ry="6" fill="#FFFFFF" opacity="0.35"/>` +
    `<rect x="-7" y="37" width="14" height="5" rx="2" fill="${gold}" stroke="${INK}" stroke-width="1.8"/>` +
    `<line x1="0" y1="42" x2="0" y2="50" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  );
}

function firework(cx: number, cy: number, r: number, color: string, alt: string, o = 1, ink = true): string {
  let out = `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})" opacity="${o}">`;
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const c = i % 3 === 0 ? alt : color;
    out += `<line x1="${(Math.cos(a) * r * 0.35).toFixed(1)}" y1="${(Math.sin(a) * r * 0.35).toFixed(1)}" x2="${(Math.cos(a) * r).toFixed(1)}" y2="${(Math.sin(a) * r).toFixed(1)}" stroke="${c}" stroke-width="${ink ? 3 : 2}" stroke-linecap="round"/>`;
    out += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="${ink ? 2.6 : 1.8}" fill="${c}"/>`;
  }
  return out + star4(0, 0, r * 0.16, '#FFFFFF', 0.9) + `</g>`;
}

/** Rai de lumière oblique. Deux ou trois suffisent à donner de l'air à une forêt ou une pièce. */
function lightShaft(f: ArtFrame, xTop: number, w: number, lean: number, o = 0.16): string {
  return `<path d="M${xTop} 0 L${xTop + w} 0 L${(xTop + w + lean).toFixed(1)} ${f.h} L${(xTop + lean).toFixed(1)} ${f.h} Z" fill="#FFFFFF" opacity="${o}"/>`;
}

// ---------------------------------------------------------------------------
// SOLS — plan en perspective
// ---------------------------------------------------------------------------

/**
 * Coque commune : dégradé de profondeur (brumeux à l'horizon, saturé au premier plan),
 * motif, puis assombrissement du tout premier plan pour asseoir la scène.
 */
function groundShell(
  p: ScenePalette,
  f: ArtFrame,
  ns: string,
  pattern: string,
  opts: { rim?: number; rimDetail?: string; far?: number } = {}
): GroundParts {
  const g = p.ground;
  const farC = mix(g.base, p.sky.bottom, opts.far ?? 0.4);
  const defs =
    linGrad(`${ns}_gg`, farC, g.base) +
    linGrad(`${ns}_gn`, `${g.shade}`, `${g.shade}`);
  const rimH = opts.rim ?? 0;
  const rim = rimH
    ? `<rect x="0" y="0" width="${f.w}" height="${rimH}" fill="${g.rim}"/>` +
      (opts.rimDetail ?? '') +
      `<rect x="0" y="${(rimH - 2.5).toFixed(1)}" width="${f.w}" height="2.5" fill="${INK}" opacity="0.75"/>`
    : '';
  const body =
    `<rect x="0" y="0" width="${f.w}" height="${f.h}" fill="url(#${ns}_gg)"/>` +
    `<g${rimH ? ` transform="translate(0,${rimH})"` : ''}>${pattern}</g>` +
    // Assombrissement du bord le plus proche : évite que le sol « flotte » en bas de l'écran.
    `<path d="M0 ${f.h} L0 ${(f.h * 0.78).toFixed(1)} Q${(f.w * 0.5).toFixed(1)} ${(f.h * 0.72).toFixed(1)} ${f.w} ${(f.h * 0.79).toFixed(1)} L${f.w} ${f.h} Z" fill="${g.shade}" opacity="0.28"/>` +
    rim;
  return { defs, body };
}

/** Grille en perspective : lignes transversales + fuyantes vers le point de fuite. */
function perspectiveGrid(
  f: ArtFrame,
  rows: number[],
  cols: number[],
  stroke: string,
  w = 2,
  o = 0.4
): string {
  let s = '';
  for (const y of rows) {
    s += `<line x1="0" y1="${y.toFixed(1)}" x2="${f.w}" y2="${y.toFixed(1)}" stroke="${stroke}" stroke-width="${(w * depthScale(y, f.h, 0.3)).toFixed(2)}" opacity="${o}"/>`;
  }
  for (const x of cols) {
    s += `<line x1="${xAtDepth(f, x, 0).toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${f.h}" stroke="${stroke}" stroke-width="${w}" opacity="${o}"/>`;
  }
  return s;
}

function grassGround(p: ScenePalette, f: ArtFrame, ns: string, petals: boolean): GroundParts {
  const g = p.ground;
  const rows = groundRows(f.h, 11, 0.1);
  let tufts = '';
  rows.forEach((y, r) => {
    const s = depthScale(y, f.h, 0.22);
    const n = 3 + Math.round(s * 4);
    for (let i = 0; i < n; i++) {
      const x = ((((i * 53 + r * 29) % 100) / 100) * 1.1 - 0.05) * f.w;
      const k = 17 * s;
      tufts +=
        `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q${(-k * 0.14).toFixed(1)} ${(-k * 0.8).toFixed(1)} ${(-k * 0.3).toFixed(1)} ${(-k * 1.25).toFixed(1)} M${(x + k * 0.1).toFixed(1)} ${y.toFixed(1)} q${(k * 0.02).toFixed(1)} ${(-k * 0.95).toFixed(1)} ${(-k * 0.04).toFixed(1)} ${(-k * 1.5).toFixed(1)} M${(x + k * 0.2).toFixed(1)} ${y.toFixed(1)} q${(k * 0.24).toFixed(1)} ${(-k * 0.8).toFixed(1)} ${(k * 0.42).toFixed(1)} ${(-k * 1.2).toFixed(1)}" ` +
        `stroke="${mix(darken(g.base, 0.26), p.sky.bottom, 0.34 * (1 - s))}" stroke-width="${(2.8 * s).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
    }
  });
  // Bandes de tonte : elles convergent, donc elles décrivent le plan.
  const cols = convergingColumns(f, 5, 2.6);
  let streaks = '';
  cols.slice(1, 5).forEach((x, i) => {
    const y0 = f.h * (0.18 + i * 0.02);
    streaks += `<path d="M${xAtDepth(f, x, y0).toFixed(1)} ${y0.toFixed(1)} L${x.toFixed(1)} ${f.h}" stroke="${lighten(g.base, 0.1)}" stroke-width="${(f.w * 0.055).toFixed(1)}" opacity="0.1" stroke-linecap="round"/>`;
  });
  let extra = '';
  if (petals) {
    for (let i = 0; i < 16; i++) {
      const y = f.h * (0.14 + (((i * 37) % 100) / 100) * 0.84);
      const s = depthScale(y, f.h, 0.24);
      extra += `<ellipse cx="${((((i * 61) % 100) / 100) * 0.96 + 0.02) * f.w}" cy="${y.toFixed(1)}" rx="${(5.5 * s).toFixed(1)}" ry="${(3.4 * s).toFixed(1)}" fill="${p.hero[2]}" opacity="0.85" transform="rotate(${(i * 47) % 90} ${((((i * 61) % 100) / 100) * 0.96 + 0.02) * f.w} ${y.toFixed(1)})"/>`;
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const y = f.h * (0.2 + (((i * 43) % 100) / 100) * 0.76);
      const s = depthScale(y, f.h, 0.3);
      const x = ((((i * 67) % 100) / 100) * 0.9 + 0.05) * f.w;
      extra +=
        `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})">` +
        `<circle cx="-4" cy="0" r="3" fill="#FFFFFF" opacity="0.9"/><circle cx="4" cy="0" r="3" fill="#FFFFFF" opacity="0.9"/><circle cx="0" cy="-5" r="3" fill="#FFFFFF" opacity="0.9"/><circle r="2" fill="#F4B740"/></g>`;
    }
  }
  return groundShell(p, f, ns, streaks + tufts + extra, { far: 0.3 });
}

function tatamiGround(p: ScenePalette, f: ArtFrame, ns: string): GroundParts {
  const g = p.ground;
  const rows = groundRows(f.h, 6, 0.1);
  const cols = convergingColumns(f, 4, 2.2);
  let mats = '';
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r];
    const y1 = rows[r + 1];
    for (let c = 0; c < cols.length - 1; c++) {
      const a = cols[c];
      const b = cols[c + 1];
      const q = (yy: number, xx: number) => `${xAtDepth(f, xx, yy).toFixed(1)} ${yy.toFixed(1)}`;
      const d = `M${q(y0, a)} L${q(y0, b)} L${q(y1, b)} L${q(y1, a)} Z`;
      const s = depthScale((y0 + y1) / 2, f.h, 0.2);
      // L'alternance du sens de tissage d'un tatami à l'autre : c'est ça qui le fait lire.
      const horiz = (r + c) % 2 === 0;
      let weave = '';
      const n = 4;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        if (horiz) {
          const y = y0 + (y1 - y0) * t;
          weave += `<line x1="${xAtDepth(f, a, y).toFixed(1)}" y1="${y.toFixed(1)}" x2="${xAtDepth(f, b, y).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${g.line}" stroke-width="${(1.8 * s).toFixed(2)}" opacity="0.35"/>`;
        } else {
          const x = a + (b - a) * t;
          weave += `<line x1="${xAtDepth(f, x, y0).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${xAtDepth(f, x, y1).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${g.line}" stroke-width="${(1.8 * s).toFixed(2)}" opacity="0.35"/>`;
        }
      }
      mats +=
        `<path d="${d}" fill="${horiz ? lighten(g.base, 0.05) : darken(g.base, 0.05)}" opacity="0.7"/>` +
        weave +
        `<path d="${d}" fill="none" stroke="${g.rim}" stroke-width="${(4.5 * s).toFixed(2)}" opacity="0.9"/>`;
    }
  }
  return groundShell(p, f, ns, mats, { far: 0.45 });
}

function plankGround(
  p: ScenePalette,
  f: ArtFrame,
  ns: string,
  opts: { planks: number; rim?: number; rimDetail?: string; confetti?: string[] }
): GroundParts {
  const g = p.ground;
  const cols = convergingColumns(f, opts.planks, 2.4);
  let planks = '';
  cols.forEach((x, i) => {
    planks += `<line x1="${xAtDepth(f, x, 0).toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${f.h}" stroke="${g.line}" stroke-width="2.6" opacity="0.55"/>`;
    if (i < cols.length - 1) {
      const mid = (x + cols[i + 1]) / 2;
      // Veine de bois : elle suit la fuyante, sinon elle contredit la perspective.
      const y0 = f.h * 0.3;
      planks += `<path d="M${xAtDepth(f, mid, y0).toFixed(1)} ${y0.toFixed(1)} Q${xAtDepth(f, mid + 8, f.h * 0.6).toFixed(1)} ${(f.h * 0.6).toFixed(1)} ${xAtDepth(f, mid, f.h * 0.95).toFixed(1)} ${(f.h * 0.95).toFixed(1)}" stroke="${g.line}" stroke-width="1.4" fill="none" opacity="0.3"/>`;
    }
  });
  // Traverses : elles matérialisent la profondeur.
  let joints = '';
  groundRows(f.h, 5, 0.14).forEach((y) => {
    joints += `<line x1="0" y1="${y.toFixed(1)}" x2="${f.w}" y2="${y.toFixed(1)}" stroke="${g.line}" stroke-width="${(2 * depthScale(y, f.h, 0.3)).toFixed(2)}" opacity="0.3"/>`;
  });
  let conf = '';
  (opts.confetti ?? []).forEach((c, i) => {
    const y = f.h * (0.24 + (((i * 41) % 100) / 100) * 0.68);
    const s = depthScale(y, f.h, 0.3);
    const x = ((((i * 71) % 100) / 100) * 0.9 + 0.05) * f.w;
    conf += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(10 * s).toFixed(1)}" height="${(6 * s).toFixed(1)}" rx="1.5" fill="${c}" opacity="0.9" transform="rotate(${(i * 53) % 90} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
  });
  return groundShell(p, f, ns, joints + planks + conf, { rim: opts.rim, rimDetail: opts.rimDetail, far: 0.42 });
}

function steamerGround(p: ScenePalette, f: ArtFrame, ns: string): GroundParts {
  const g = p.ground;
  const rimH = 26 * roomy(f);
  let slats = '';
  const n = Math.ceil(f.w / 26);
  for (let i = 0; i < n; i++) {
    slats += `<rect x="${(4 + i * 26).toFixed(1)}" y="4" width="17" height="${(rimH - 10).toFixed(1)}" rx="2.5" fill="${darken(g.rim, 0.12)}" stroke="${INK}" stroke-width="2" opacity="0.9"/>`;
  }
  const inner: ArtFrame = { w: f.w, h: f.h - rimH };
  const rows = groundRows(inner.h, 9, 0.12);
  const cols = convergingColumns(inner, 9, 2.6);
  const weave = perspectiveGrid(inner, rows, cols, g.line, 2.2, 0.28);
  return groundShell(p, f, ns, weave, { rim: rimH, rimDetail: slats, far: 0.34 });
}

function counterGround(p: ScenePalette, f: ArtFrame, ns: string): GroundParts {

  const rimH = 22 * roomy(f);
  const base = plankGround(p, { w: f.w, h: f.h }, ns, { planks: 7, rim: rimH });
  // Reflet mouillé du comptoir : une bande claire juste sous l'arête du fond.
  const sheen = `<rect x="0" y="${(rimH + 4).toFixed(1)}" width="${f.w}" height="${(f.h * 0.14).toFixed(1)}" fill="#FFFFFF" opacity="0.12"/>`;
  return { defs: base.defs, body: base.body + sheen };
}

function sandGround(p: ScenePalette, f: ArtFrame, ns: string): GroundParts {
  const g = p.ground;
  const rows = groundRows(f.h, 12, 0.05);
  let ripples = '';
  rows.forEach((y, r) => {
    const s = depthScale(y, f.h, 0.16);
    const step = 62 * s;
    const off = (r % 2 ? step / 2 : 0) - step;
    for (let x = off; x < f.w + step; x += step) {
      ripples += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q${(step * 0.25).toFixed(1)} ${(9 * s).toFixed(1)} ${(step * 0.5).toFixed(1)} 0" stroke="${g.shade}" stroke-width="${(2.4 * s).toFixed(2)}" fill="none" opacity="0.5" stroke-linecap="round"/>`;
    }
  });
  // Ourlet d'eau : la bande mouillée qui raccorde la mer au sable.
  const wet =
    `<path d="M0 0 L${f.w} 0 L${f.w} ${(f.h * 0.13).toFixed(1)} Q${(f.w * 0.72).toFixed(1)} ${(f.h * 0.19).toFixed(1)} ${(f.w * 0.46).toFixed(1)} ${(f.h * 0.13).toFixed(1)} Q${(f.w * 0.2).toFixed(1)} ${(f.h * 0.08).toFixed(1)} 0 ${(f.h * 0.15).toFixed(1)} Z" fill="${mix(g.shade, p.hero[1], 0.4)}" opacity="0.5"/>` +
    `<path d="M0 ${(f.h * 0.15).toFixed(1)} Q${(f.w * 0.2).toFixed(1)} ${(f.h * 0.08).toFixed(1)} ${(f.w * 0.46).toFixed(1)} ${(f.h * 0.13).toFixed(1)} Q${(f.w * 0.72).toFixed(1)} ${(f.h * 0.19).toFixed(1)} ${f.w} ${(f.h * 0.13).toFixed(1)}" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.75"/>`;
  const shellY = f.h * 0.52;
  const sk = depthScale(shellY, f.h, 0.3);
  const props =
    `<g transform="translate(${(f.w * 0.22).toFixed(1)},${shellY.toFixed(1)}) scale(${sk.toFixed(2)})">` +
    contactShadow(0, 7, 15, 4, 0.16) +
    `<path d="M-13 6 A 13 13 0 0 1 13 6 Z" fill="#F6E7CE" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M-7 6 L-4 -5 M0 6 L0 -7 M7 6 L4 -5" stroke="${INK}" stroke-width="1.6" opacity="0.6"/></g>` +
    `<g transform="translate(${(f.w * 0.78).toFixed(1)},${(f.h * 0.78).toFixed(1)}) scale(${depthScale(f.h * 0.78, f.h, 0.3).toFixed(2)}) rotate(12)">` +
    contactShadow(0, 12, 15, 4, 0.16) +
    `<path d="M0 -13 L4 -4 L14 -3 L6 4 L8 13 L0 8 L-8 13 L-6 4 L-14 -3 L-4 -4 Z" fill="#F0A868" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></g>`;
  let pebbles = '';
  for (let i = 0; i < 10; i++) {
    const y = f.h * (0.2 + (((i * 47) % 100) / 100) * 0.76);
    const sc = depthScale(y, f.h, 0.24);
    const x = ((((i * 73) % 100) / 100) * 0.94 + 0.03) * f.w;
    pebbles += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(5 * sc).toFixed(1)}" ry="${(3.4 * sc).toFixed(1)}" fill="${darken(g.base, 0.16)}" opacity="0.7"/>`;
  }
  return groundShell(p, f, ns, wet + ripples + pebbles + props, { far: 0.5 });
}

function streetGround(p: ScenePalette, f: ArtFrame, ns: string): GroundParts {
  const g = p.ground;
  const rows = groundRows(f.h, 7, 0.08);
  const q = (yy: number, xx: number) => `${xAtDepth(f, xx, yy).toFixed(1)} ${yy.toFixed(1)}`;

  // Passage piéton : des bandes qui fuient, occupant toute la largeur.
  const y0 = rows[2];
  const y1 = rows[4];
  let zebra = '';
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const a = -f.w * 0.9 + (i * (f.w * 2.8)) / bands;
    const b = a + (f.w * 2.8) / bands * 0.55;
    zebra += `<path d="M${q(y0, a)} L${q(y0, b)} L${q(y1, b)} L${q(y1, a)} Z" fill="${g.line}" opacity="0.75"/>`;
  }

  // Ligne médiane discontinue.
  let dashes = '';
  for (let i = 3; i < rows.length - 1; i++) {
    const ya = rows[i];
    const yb = ya + (rows[i + 1] - ya) * 0.55;
    dashes += `<path d="M${q(ya, f.w / 2)} L${q(yb, f.w / 2)}" stroke="${g.line}" stroke-width="${(7 * depthScale(ya, f.h, 0.2)).toFixed(1)}" opacity="0.6" stroke-linecap="round"/>`;
  }

  // Reflets de néon : larges, doux, ils s'élargissent en approchant. C'est ça, l'asphalte mouillé.
  const spots = [
    [0.13, p.hero[2]],
    [0.42, p.hero[1]],
    [0.74, p.hero[2]],
    [0.93, p.hero[1]],
  ] as const;
  const reflDefs = spots
    .map(([, c], i) => `<linearGradient id="${ns}_r${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`)
    .join('');
  const refl = spots
    .map(([fx], i) => {
      const near = fx * f.w;
      const top = xAtDepth(f, near, 0);
      return `<path d="M${(top - 5).toFixed(1)} 0 L${(top + 5).toFixed(1)} 0 L${(near + 30).toFixed(1)} ${f.h} L${(near - 30).toFixed(1)} ${f.h} Z" fill="url(#${ns}_r${i})"/>`;
    })
    .join('');

  const manhole =
    `<g transform="translate(${(f.w * 0.74).toFixed(1)},${(f.h * 0.72).toFixed(1)}) scale(${depthScale(f.h * 0.72, f.h, 0.3).toFixed(2)})">` +
    `<ellipse rx="26" ry="12" fill="${darken(g.base, 0.22)}" stroke="${INK}" stroke-width="2.6"/>` +
    `<ellipse rx="18" ry="8" fill="none" stroke="${INK}" stroke-width="1.8" opacity="0.6"/></g>`;
  const puddle =
    `<g transform="translate(${(f.w * 0.24).toFixed(1)},${(f.h * 0.86).toFixed(1)})">` +
    `<ellipse rx="${(f.w * 0.16).toFixed(1)}" ry="${(f.h * 0.05).toFixed(1)}" fill="${lighten(g.base, 0.1)}" opacity="0.7"/>` +
    `<ellipse rx="${(f.w * 0.16).toFixed(1)}" ry="${(f.h * 0.05).toFixed(1)}" fill="none" stroke="${lighten(g.base, 0.22)}" stroke-width="2" opacity="0.6"/>` +
    `<path d="M${(-f.w * 0.08).toFixed(1)} -4 Q0 -10 ${(f.w * 0.08).toFixed(1)} -4" stroke="${p.hero[1]}" stroke-width="3" fill="none" opacity="0.6" stroke-linecap="round"/></g>`;

  const shell = groundShell(p, f, ns, zebra + dashes + refl + manhole + puddle, { far: 0.22 });
  return { defs: shell.defs + reflDefs, body: shell.body };
}

function moonGround(p: ScenePalette, f: ArtFrame, ns: string): GroundParts {
  const g = p.ground;
  let craters = '';
  groundRows(f.h, 11, 0.07).forEach((y, i) => {
    const s = depthScale(y, f.h, 0.12);
    const cx = ((((i * 57) % 100) / 100) * 1.12 - 0.06) * f.w;
    const r = 88 * s;
    craters +=
      `<g transform="translate(${cx.toFixed(1)},${y.toFixed(1)})">` +
      `<ellipse rx="${r.toFixed(1)}" ry="${(r * 0.4).toFixed(1)}" fill="${darken(g.base, 0.2)}" stroke="${INK}" stroke-width="${(2.4 * s).toFixed(2)}" opacity="0.9"/>` +
      `<ellipse cx="${(r * 0.1).toFixed(1)}" cy="${(r * 0.1).toFixed(1)}" rx="${(r * 0.66).toFixed(1)}" ry="${(r * 0.24).toFixed(1)}" fill="${darken(g.base, 0.36)}"/>` +
      `<path d="M${(-r * 0.7).toFixed(1)} ${(-r * 0.2).toFixed(1)} Q0 ${(-r * 0.48).toFixed(1)} ${(r * 0.7).toFixed(1)} ${(-r * 0.2).toFixed(1)}" stroke="${lighten(g.base, 0.2)}" stroke-width="${(2.2 * s).toFixed(2)}" fill="none" opacity="0.85"/></g>`;
  });
  // Ombres longues : sur la Lune le soleil rase, c'est le détail qui vend le décor.
  let rocks = '';
  [0.14, 0.4, 0.62, 0.88].forEach((fx, i) => {
    const y = f.h * (0.3 + i * 0.19);
    const s = depthScale(y, f.h, 0.24) * 1.2;
    const x = fx * f.w;
    rocks +=
      `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x - 60 * s).toFixed(1)} ${(y + 8 * s).toFixed(1)} L${(x - 54 * s).toFixed(1)} ${(y + 14 * s).toFixed(1)} L${(x + 6 * s).toFixed(1)} ${(y + 6 * s).toFixed(1)} Z" fill="${INK}" opacity="0.2"/>` +
      `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l ${(11 * s).toFixed(1)} ${(-6 * s).toFixed(1)} l ${(10 * s).toFixed(1)} ${(7 * s).toFixed(1)} l ${(-6 * s).toFixed(1)} ${(8 * s).toFixed(1)} l ${(-12 * s).toFixed(1)} ${(-1 * s).toFixed(1)} Z" fill="${g.shade}" stroke="${INK}" stroke-width="${(2 * s).toFixed(2)}" stroke-linejoin="round"/>`;
  });
  let dust = '';
  for (let i = 0; i < 16; i++) {
    const y = f.h * (0.1 + (((i * 39) % 100) / 100) * 0.88);
    dust += `<circle cx="${((((i * 63) % 100) / 100) * 0.94 + 0.03) * f.w}" cy="${y.toFixed(1)}" r="${(2.2 * depthScale(y, f.h, 0.3)).toFixed(2)}" fill="${g.shade}" opacity="0.5"/>`;
  }
  return groundShell(p, f, ns, craters + dust + rocks, { far: 0.4 });
}

export function groundArt(kind: SceneKind, p: ScenePalette, f: ArtFrame, ns: string): GroundParts {
  switch (kind) {
    case 'default':
      return steamerGround(p, f, ns);
    case 'bamboo':
      return grassGround(p, f, ns, false);
    case 'sakura':
      return grassGround(p, f, ns, true);
    case 'dojo':
      return tatamiGround(p, f, ns);
    case 'sushi':
      return counterGround(p, f, ns);
    case 'wave':
      return sandGround(p, f, ns);
    case 'matsuri':
      return plankGround(p, f, ns, { planks: 8, confetti: ['#EE3B30', '#F7C948', '#2E6BE6', '#EE3B30', '#F7C948'] });
    case 'neon':
      return streetGround(p, f, ns);
    case 'space':
      return moonGround(p, f, ns);
  }
}

export function groundDoc(kind: SceneKind, p: ScenePalette, f: ArtFrame, ns: string): string {
  const { defs, body } = groundArt(kind, p, f, ns);
  return svgDoc(f, defs, body);
}

// ---------------------------------------------------------------------------
// CIELS — trois plans (back / mid / front) que la scène anime séparément
// ---------------------------------------------------------------------------

function skyBase(p: ScenePalette, f: ArtFrame, ns: string): string {
  return `<rect x="0" y="0" width="${f.w}" height="${f.h}" fill="url(#${ns}_sky)"/>`;
}

function defaultSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [body, gold] = p.hero;
  const k = roomy(f);
  const yShelf = f.h * 0.7; // arête du comptoir
  const farC = haze(p.far, p, 0.42);
  const wood = mix('#8A5E3B', p.sky.bottom, 0.25);

  // Panier vapeur empilé. Sans encre au fond, à l'encre pleine au premier plan.
  const stack = (x: number, n: number, w: number, fill: string, ink: boolean, baseY: number) => {
    let out = '';
    const hh = 15 * k;
    for (let i = 0; i < n; i++) {
      const y = baseY - (i + 1) * hh;
      out +=
        `<rect x="${(x - w / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}" rx="${(4 * k).toFixed(1)}" fill="${fill}"${ink ? ` stroke="${INK}" stroke-width="2.6"` : ''}/>` +
        `<rect x="${(x - w / 2).toFixed(1)}" y="${(y + 5 * k).toFixed(1)}" width="${w.toFixed(1)}" height="${(2 * k).toFixed(1)}" fill="${darken(fill, 0.18)}" opacity="0.65"/>`;
    }
    // Couvercle bombé : c'est lui qui rend la pile identifiable.
    const ty = baseY - n * hh;
    out += `<path d="M${(x - w / 2 - 3).toFixed(1)} ${ty.toFixed(1)} Q${x.toFixed(1)} ${(ty - 13 * k).toFixed(1)} ${(x + w / 2 + 3).toFixed(1)} ${ty.toFixed(1)} Z" fill="${lighten(fill, 0.06)}"${ink ? ` stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"` : ''}/>`;
    return out;
  };

  const back =
    skyBase(p, f, ns) +
    // Lambris vertical du mur.
    Array.from({ length: 13 }, (_, i) =>
      `<rect x="${((i * f.w) / 13).toFixed(1)}" y="0" width="2.5" height="${yShelf.toFixed(1)}" fill="${haze(darken(p.far, 0.2), p, 0.5)}" opacity="0.5"/>`
    ).join('') +
    glowSpot(`${ns}_lamp`, f.w * 0.5, f.h * 0.24, f.w * 0.52) +
    // Ardoise du menu : trois traits de « kanji » suffisent à situer le lieu.
    `<g transform="translate(${(f.w * 0.06).toFixed(1)},${(f.h * 0.14).toFixed(1)})">` +
    `<rect x="0" y="0" width="${(f.w * 0.34).toFixed(1)}" height="${(f.h * 0.3).toFixed(1)}" fill="${haze('#3A332C', p, 0.2)}" stroke="${wood}" stroke-width="${(7 * k).toFixed(1)}"/>` +
    [0, 1, 2, 3]
      .map(
        (i) =>
          `<rect x="${(f.w * 0.05).toFixed(1)}" y="${(f.h * (0.055 + i * 0.055)).toFixed(1)}" width="${(f.w * (0.22 - i * 0.035)).toFixed(1)}" height="${(3.5 * k).toFixed(1)}" rx="1.5" fill="${haze('#F7F2E6', p, 0.2)}"/>`
      )
      .join('') +
    `</g>` +
    // Étagère du fond, garnie.
    `<rect x="0" y="${(yShelf - 66 * k).toFixed(1)}" width="${f.w}" height="${(5 * k).toFixed(1)}" fill="${wood}" opacity="0.9"/>` +
    stack(f.w * 0.12, 3, 52 * k, farC, false, yShelf - 66 * k) +
    stack(f.w * 0.88, 2, 46 * k, farC, false, yShelf - 66 * k);

  // Face avant du comptoir : lattes verticales + plinthe, pour qu'il ait une épaisseur.
  let counter = `<rect x="0" y="${yShelf.toFixed(1)}" width="${f.w}" height="${(f.h - yShelf).toFixed(1)}" fill="${mix('#B9803F', p.sky.bottom, 0.15)}"/>`;
  for (let i = 0; i <= 9; i++) {
    counter += `<rect x="${((i * f.w) / 9).toFixed(1)}" y="${yShelf.toFixed(1)}" width="3" height="${(f.h - yShelf).toFixed(1)}" fill="${darken('#B9803F', 0.22)}" opacity="0.4"/>`;
  }
  counter +=
    `<rect x="0" y="${yShelf.toFixed(1)}" width="${f.w}" height="${(11 * k).toFixed(1)}" fill="${lighten('#B9803F', 0.12)}" stroke="${INK}" stroke-width="2.6"/>` +
    `<rect x="0" y="${(yShelf + 11 * k).toFixed(1)}" width="${f.w}" height="${(9 * k).toFixed(1)}" fill="${INK}" opacity="0.14"/>`;

  const mid =
    // Le rail auquel les lanternes sont réellement accrochées.
    `<rect x="0" y="${(f.h * 0.06).toFixed(1)}" width="${f.w}" height="${(11 * k).toFixed(1)}" fill="${wood}" stroke="${INK}" stroke-width="2.6"/>` +
    `<rect x="0" y="${(f.h * 0.06 + 3).toFixed(1)}" width="${f.w}" height="2.5" fill="${lighten('#8A5E3B', 0.22)}" opacity="0.6"/>` +
    counter +
    // Théière et bols posés sur le comptoir.
    `<g transform="translate(${(f.w * 0.72).toFixed(1)},${yShelf.toFixed(1)}) scale(${k.toFixed(2)})">` +
    `<path d="M-26 0 Q-30 -26 0 -26 Q30 -26 26 0 Z" fill="${p.sky.bottom}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M26 -20 q16 4 12 16 l-7 -2 q3 -8 -7 -9 Z" fill="${p.sky.bottom}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<rect x="-30" y="-31" width="60" height="7" rx="3.5" fill="${lighten(p.sky.bottom, 0.03)}" stroke="${INK}" stroke-width="2.2"/>` +
    `<rect x="-4" y="-38" width="8" height="8" rx="3" fill="${gold}" stroke="${INK}" stroke-width="2"/></g>`;

  const front =
    lantern(f.w * 0.56, f.h * 0.2, 1.2 * k, body, gold, `${ns}_lg`) +
    lantern(f.w * 0.84, f.h * 0.33, 1 * k, body, gold, `${ns}_lg`) +
    `<line x1="${(f.w * 0.56).toFixed(1)}" y1="${(f.h * 0.06 + 11 * k).toFixed(1)}" x2="${(f.w * 0.56).toFixed(1)}" y2="${(f.h * 0.2 - 12).toFixed(1)}" stroke="${INK}" stroke-width="2.4" opacity="0.85"/>` +
    `<line x1="${(f.w * 0.84).toFixed(1)}" y1="${(f.h * 0.06 + 11 * k).toFixed(1)}" x2="${(f.w * 0.84).toFixed(1)}" y2="${(f.h * 0.33 - 12).toFixed(1)}" stroke="${INK}" stroke-width="2.4" opacity="0.85"/>` +
    // Pile de paniers posée sur le comptoir, à l'encre pleine : le repère de premier plan.
    stack(f.w * 0.16, 3, 86 * k, p.ground.base, true, f.h) +
    contactShadow(f.w * 0.16, f.h, 46 * k, 7 * k, 0.16);

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) +
    radGlow(`${ns}_lamp`, '#FFE9BC', 0.42) +
    radGlow(`${ns}_lg`, gold, 0.5);
  return { defs, back, mid, front };
}

function bambooSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [c0, c1, c2] = p.hero;
  const k = roomy(f);

  // Une canne : elle descend TOUJOURS jusqu'à f.h, donc elle est plantée dans l'herbe.
  const stalk = (x: number, w: number, fill: string, ink: boolean, yTop: number, nodes: number) => {
    const shade = darken(fill, 0.22);
    let s = `<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${w.toFixed(1)}" height="${(f.h - yTop + 4).toFixed(1)}" fill="${fill}"${ink ? ` stroke="${INK}" stroke-width="3"` : ''}/>`;
    if (ink) s += `<rect x="${(x + w * 0.6).toFixed(1)}" y="${yTop.toFixed(1)}" width="${(w * 0.22).toFixed(1)}" height="${(f.h - yTop + 4).toFixed(1)}" fill="${shade}" opacity="0.45"/>`;
    const step = (f.h - yTop) / (nodes + 1);
    for (let i = 1; i <= nodes; i++) {
      const y = yTop + i * step;
      s += ink
        ? `<rect x="${(x - 3).toFixed(1)}" y="${y.toFixed(1)}" width="${(w + 6).toFixed(1)}" height="${(9 * k).toFixed(1)}" rx="4.5" fill="${darken(fill, 0.16)}" stroke="${INK}" stroke-width="2.4"/>`
        : `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(3 * k).toFixed(1)}" fill="${darken(fill, 0.12)}" opacity="0.5"/>`;
    }
    return s;
  };

  // Mur de cannes lointaines, sans encre : c'est ça, la profondeur de champ.
  let far = '';
  for (let i = 0; i < 11; i++) {
    const x = (((i * 71) % 100) / 100) * f.w;
    const t = 0.45 + (((i * 29) % 100) / 100) * 0.3;
    far += stalk(x, 5 + (i % 3) * 3, haze(c0, p, t), false, -f.h * (0.02 + (i % 4) * 0.03), 5);
  }

  const back =
    skyBase(p, f, ns) +
    glowSpot(`${ns}_sun`, f.w * 0.72, f.h * 0.14, f.w * 0.4) +
    far +
    lightShaft(f, f.w * 0.1, 40, f.w * 0.28, 0.14) +
    lightShaft(f, f.w * 0.52, 26, f.w * 0.22, 0.1);

  const midC = haze(c0, p, 0.24);
  const mid =
    stalk(f.w * 0.2, 16, midC, false, -6, 5) +
    stalk(f.w * 0.58, 20, haze(c2, p, 0.28), false, -6, 5) +
    stalk(f.w * 0.78, 14, midC, false, f.h * 0.06, 4) +
    bambooLeaf(f.w * 0.24, f.h * 0.4, 40, -22, haze(c2, p, 0.3), 1, false) +
    bambooLeaf(f.w * 0.56, f.h * 0.55, 44, 16, haze(c1, p, 0.3), 1, false) +
    bambooLeaf(f.w * 0.82, f.h * 0.34, -38, 196, haze(c2, p, 0.3), 1, false);

  const front =
    stalk(10, 34, c0, true, -8, 6) +
    stalk(66, 17, c2, true, -8, 6) +
    stalk(f.w - 44, 34, c0, true, -8, 6) +
    bambooLeaf(48, f.h * 0.3, 48, -24, c2) +
    bambooLeaf(48, f.h * 0.33, 40, 8, c1) +
    bambooLeaf(46, f.h * 0.56, 44, 28, c1) +
    bambooLeaf(84, f.h * 0.44, 42, -14, c2) +
    bambooLeaf(84, f.h * 0.68, 46, 18, c1) +
    bambooLeaf(f.w - 44, f.h * 0.42, -48, 204, c2) +
    bambooLeaf(f.w - 44, f.h * 0.62, -44, 158, c1) +
    bambooLeaf(f.w - 42, f.h * 0.66, -38, 190, c2);

  const defs = linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) + radGlow(`${ns}_sun`, '#FFFFFF', 0.5);
  return { defs, back, mid, front };
}

function dojoSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [beam, paper, seal] = p.hero;
  const k = roomy(f);
  const yWall = f.h * 0.34;
  const beamDark = darken(beam, 0.24);

  // Mur de shoji plein cadre, rétroéclairé : la pièce a enfin un fond.
  const panelW = f.w / 5;
  let shoji = '';
  for (let i = 0; i < 5; i++) {
    const x = i * panelW;
    shoji += `<rect x="${x.toFixed(1)}" y="${yWall.toFixed(1)}" width="${panelW.toFixed(1)}" height="${(f.h - yWall).toFixed(1)}" fill="${lighten(paper, 0.04)}" stroke="${mix(beamDark, p.sky.bottom, 0.3)}" stroke-width="3"/>`;
    for (let c = 1; c < 3; c++) {
      shoji += `<line x1="${(x + (panelW / 3) * c).toFixed(1)}" y1="${yWall.toFixed(1)}" x2="${(x + (panelW / 3) * c).toFixed(1)}" y2="${f.h.toFixed(1)}" stroke="${mix(beamDark, p.sky.bottom, 0.45)}" stroke-width="2.4"/>`;
    }
    for (let r = 1; r < 5; r++) {
      const y = yWall + ((f.h - yWall) / 5) * r;
      shoji += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + panelW).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${mix(beamDark, p.sky.bottom, 0.45)}" stroke-width="2.4"/>`;
    }
  }

  // Plafond à solives, en perspective : le haut du cadre n'est plus une bande vide.
  const ceilH = yWall - 20 * k;
  const ceilingC = mix(beamDark, p.sky.top, 0.45);
  let ceiling = `<rect x="0" y="0" width="${f.w}" height="${ceilH.toFixed(1)}" fill="${ceilingC}"/>`;
  for (let i = 0; i <= 6; i++) {
    const xNear = (i / 6) * f.w * 2.1 - f.w * 0.55;
    ceiling += `<path d="M${(f.w / 2 + (xNear - f.w / 2) * 0.12).toFixed(1)} ${ceilH.toFixed(1)} L${xNear.toFixed(1)} 0 Z" stroke="${darken(beamDark, 0.2)}" stroke-width="${(7 * k).toFixed(1)}" fill="none" opacity="0.55"/>`;
  }
  // Ranma : la claire-voie ajourée entre la poutre et le plafond.
  const ranmaY = ceilH - 30 * k;
  let ranma = `<rect x="0" y="${ranmaY.toFixed(1)}" width="${f.w}" height="${(30 * k).toFixed(1)}" fill="${lighten(paper, 0.02)}"/>`;
  for (let i = 0; i < 22; i++) {
    ranma += `<rect x="${((i + 0.5) * (f.w / 22) - 2).toFixed(1)}" y="${(ranmaY + 4).toFixed(1)}" width="4" height="${(22 * k).toFixed(1)}" fill="${beamDark}" opacity="0.7"/>`;
  }
  ranma += `<rect x="0" y="${ranmaY.toFixed(1)}" width="${f.w}" height="${(5 * k).toFixed(1)}" fill="${beam}" stroke="${INK}" stroke-width="2.2"/>`;

  const back =
    skyBase(p, f, ns) +
    ceiling +
    ranma +
    glowSpot(`${ns}_bl`, f.w * 0.3, f.h * 0.66, f.w * 0.46) +
    glowSpot(`${ns}_bl`, f.w * 0.78, f.h * 0.7, f.w * 0.4) +
    shoji;

  const mid =
    // Poutre maîtresse, avec son assemblage visible.
    `<rect x="0" y="${(yWall - 20 * k).toFixed(1)}" width="${f.w}" height="${(20 * k).toFixed(1)}" fill="${beam}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="0" y="${(yWall - 16 * k).toFixed(1)}" width="${f.w}" height="3" fill="${lighten(beam, 0.2)}" opacity="0.7"/>` +
    [0.18, 0.5, 0.82]
      .map(
        (fx) =>
          `<rect x="${(fx * f.w - 7 * k).toFixed(1)}" y="${(yWall - 20 * k).toFixed(1)}" width="${(14 * k).toFixed(1)}" height="${(20 * k).toFixed(1)}" fill="${beamDark}" opacity="0.45"/>`
      )
      .join('') +
    // Piliers d'angle, jusqu'au sol.
    `<rect x="0" y="${(yWall - 20 * k).toFixed(1)}" width="${(16 * k).toFixed(1)}" height="${(f.h - yWall + 20 * k).toFixed(1)}" fill="${beam}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="${(f.w - 16 * k).toFixed(1)}" y="${(yWall - 20 * k).toFixed(1)}" width="${(16 * k).toFixed(1)}" height="${(f.h - yWall + 20 * k).toFixed(1)}" fill="${beam}" stroke="${INK}" stroke-width="3"/>`;

  const cx = f.w * 0.5;
  const scrollTop = yWall + 8 * k;
  const scrollH = (f.h - yWall) * 0.72;
  const front =
    // Kakemono centré, accroché à la poutre.
    `<line x1="${cx}" y1="${(yWall - 2).toFixed(1)}" x2="${cx}" y2="${scrollTop.toFixed(1)}" stroke="${INK}" stroke-width="2.6"/>` +
    `<rect x="${(cx - 42 * k).toFixed(1)}" y="${scrollTop.toFixed(1)}" width="${(84 * k).toFixed(1)}" height="${(11 * k).toFixed(1)}" rx="5" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
    `<rect x="${(cx - 34 * k).toFixed(1)}" y="${(scrollTop + 11 * k).toFixed(1)}" width="${(68 * k).toFixed(1)}" height="${scrollH.toFixed(1)}" fill="${paper}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="${(cx + 26 * k).toFixed(1)}" y="${(scrollTop + 11 * k).toFixed(1)}" width="${(8 * k).toFixed(1)}" height="${scrollH.toFixed(1)}" fill="${darken(paper, 0.08)}"/>` +
    `<g transform="translate(${cx.toFixed(1)},${(scrollTop + 11 * k).toFixed(1)}) scale(${k.toFixed(2)})">` +
    `<path d="M-6 26 Q2 34 -2 50 Q-6 64 1 72 L6 69 Q1 60 6 48 Q11 34 2 24 Z" fill="${INK}"/>` +
    `<path d="M-12 92 L10 95 L9 101 L-11 98 Z" fill="${INK}"/>` +
    `<path d="M-4 108 Q-8 126 -2 142 L4 140 Q-1 126 2 110 Z" fill="${INK}"/>` +
    `</g>` +
    `<rect x="${(cx + 10 * k).toFixed(1)}" y="${(scrollTop + scrollH - 22 * k).toFixed(1)}" width="${(15 * k).toFixed(1)}" height="${(15 * k).toFixed(1)}" fill="${seal}" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="${(cx - 42 * k).toFixed(1)}" y="${(scrollTop + 11 * k + scrollH).toFixed(1)}" width="${(84 * k).toFixed(1)}" height="${(12 * k).toFixed(1)}" rx="6" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
    // Étagère + daruma à gauche.
    `<rect x="${(f.w * 0.1).toFixed(1)}" y="${(f.h * 0.72).toFixed(1)}" width="${(84 * k).toFixed(1)}" height="${(9 * k).toFixed(1)}" rx="3" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
    `<g transform="translate(${(f.w * 0.1 + 42 * k).toFixed(1)},${(f.h * 0.72).toFixed(1)}) scale(${k.toFixed(2)})">` +
    `<path d="M-19 0 Q-21 -30 0 -32 Q21 -30 19 0 Z" fill="${seal}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
    `<ellipse cx="0" cy="-12" rx="12" ry="10" fill="${paper}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="-5" cy="-14" r="2.6" fill="${INK}"/><circle cx="5" cy="-14" r="2.6" fill="${INK}"/>` +
    `<path d="M-4 -6 Q0 -3 4 -6" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>` +
    // Râtelier à bokken à droite.
    `<g transform="translate(${(f.w * 0.82).toFixed(1)},${(f.h * 0.6).toFixed(1)}) scale(${k.toFixed(2)})">` +
    `<rect x="-6" y="0" width="12" height="${((f.h * 0.4) / k).toFixed(1)}" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
    `<path d="M-46 22 Q0 8 46 18 L46 26 Q0 16 -46 30 Z" fill="${lighten(beam, 0.18)}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M-44 58 Q0 44 44 54 L44 62 Q0 52 -44 66 Z" fill="${lighten(beam, 0.1)}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></g>`;

  const defs = linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) + radGlow(`${ns}_bl`, '#FFF6DF', 0.55);
  // Le plafond couvre tout le haut du cadre : c'est lui, et non le dégradé, qui donne le ton.
  return { defs, back, mid, front, cap: ceilingC };
}

function sushiSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [cloth, motif, accent] = p.hero;
  const k = roomy(f);
  const shade = darken(cloth, 0.18);

  // Vitrine à poissons + ardoise : ce qu'on aperçoit ENTRE les pans du noren.
  const caseY = f.h * 0.74;
  const back =
    skyBase(p, f, ns) +
    glowSpot(`${ns}_lamp`, f.w * 0.5, f.h * 0.34, f.w * 0.5) +
    `<rect x="0" y="${(f.h * 0.5).toFixed(1)}" width="${f.w}" height="${(f.h * 0.5).toFixed(1)}" fill="${mix(p.far, p.sky.bottom, 0.3)}"/>` +
    `<rect x="${(f.w * 0.08).toFixed(1)}" y="${caseY.toFixed(1)}" width="${(f.w * 0.84).toFixed(1)}" height="${(f.h - caseY).toFixed(1)}" fill="${haze('#BBD4DE', p, 0.18)}" stroke="${haze(INK, p, 0.42)}" stroke-width="3"/>` +
    `<rect x="${(f.w * 0.08).toFixed(1)}" y="${caseY.toFixed(1)}" width="${(f.w * 0.84).toFixed(1)}" height="${(7 * k).toFixed(1)}" fill="${haze('#8A5E3B', p, 0.25)}"/>` +
    `<rect x="${(f.w * 0.08).toFixed(1)}" y="${(caseY + (f.h - caseY) * 0.52).toFixed(1)}" width="${(f.w * 0.84).toFixed(1)}" height="${(f.h - caseY) * 0.48}" fill="${haze('#8A5E3B', p, 0.42)}" opacity="0.55"/>` +
    [0.18, 0.3, 0.42, 0.6, 0.72]
      .map((fx, i) => {
        const c = [accent, '#F3B7A0', '#EFE3C6', accent, '#F3B7A0'][i];
        return `<g transform="translate(${(fx * f.w).toFixed(1)},${(caseY + 26 * k).toFixed(1)})"><ellipse rx="${(15 * k).toFixed(1)}" ry="${(9 * k).toFixed(1)}" fill="${haze('#F7F2E6', p, 0.15)}"/><ellipse cy="${(-8 * k).toFixed(1)}" rx="${(14 * k).toFixed(1)}" ry="${(7 * k).toFixed(1)}" fill="${haze(c, p, 0.15)}"/></g>`;
      })
      .join('') +
    `<rect x="${(f.w * 0.68).toFixed(1)}" y="${(f.h * 0.53).toFixed(1)}" width="${(f.w * 0.24).toFixed(1)}" height="${(f.h * 0.1).toFixed(1)}" fill="${haze('#2E2A26', p, 0.4)}"/>` +
    [0, 1, 2]
      .map(
        (i) =>
          `<rect x="${(f.w * 0.71).toFixed(1)}" y="${(f.h * 0.55 + i * f.h * 0.026).toFixed(1)}" width="${(f.w * (0.17 - i * 0.03)).toFixed(1)}" height="2.5" fill="${haze('#F7F2E6', p, 0.35)}"/>`
      )
      .join('');

  // Noren : accroché à sa barre en haut, pans jusqu'à ~0.6h.
  const railY = f.h * 0.08;
  const panelW = f.w * 0.216;
  const gap = (f.w - panelW * 4) / 5;
  let panels = '';
  let clipDefs = '';
  for (let i = 0; i < 4; i++) {
    const x = gap + i * (panelW + gap);
    const h = railY + f.h * (i % 2 ? 0.46 : 0.52);
    const d = `M${x.toFixed(1)} ${(railY + 6).toFixed(1)} L${(x + panelW).toFixed(1)} ${(railY + 6).toFixed(1)} L${(x + panelW).toFixed(1)} ${(h - 8).toFixed(1)} Q${(x + panelW / 2).toFixed(1)} ${(h + 8).toFixed(1)} ${x.toFixed(1)} ${(h - 8).toFixed(1)} Z`;
    clipDefs += `<clipPath id="${ns}_np${i}"><path d="${d}"/></clipPath>`;
    let wave = '';
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        wave += `<path d="M${(x + c * 22 - 6 + (r % 2 ? 11 : 0)).toFixed(1)} ${(h - 34 + r * 11).toFixed(1)} a 14 14 0 0 1 28 0" fill="none" stroke="${motif}" stroke-width="2.4" opacity="0.75"/>`;
      }
    }
    panels +=
      `<path d="${d}" fill="${cloth}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      `<g clip-path="url(#${ns}_np${i})">` +
      `<rect x="${(x + panelW - 16).toFixed(1)}" y="${railY.toFixed(1)}" width="16" height="${h.toFixed(1)}" fill="${shade}" opacity="0.5"/>` +
      `<path d="M${(x + panelW * 0.3).toFixed(1)} ${(railY + 10).toFixed(1)} Q${(x + panelW * 0.26).toFixed(1)} ${(h * 0.6).toFixed(1)} ${(x + panelW * 0.3).toFixed(1)} ${(h - 16).toFixed(1)}" stroke="${shade}" stroke-width="2" fill="none" opacity="0.45"/>` +
      `<path d="M${(x + panelW * 0.64).toFixed(1)} ${(railY + 10).toFixed(1)} Q${(x + panelW * 0.68).toFixed(1)} ${(h * 0.6).toFixed(1)} ${(x + panelW * 0.64).toFixed(1)} ${(h - 16).toFixed(1)}" stroke="${shade}" stroke-width="2" fill="none" opacity="0.35"/>` +
      wave +
      `</g><path d="${d}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    if (i === 1) {
      const mcx = x + panelW / 2;
      const mcy = railY + f.h * 0.26;
      panels +=
        `<circle cx="${mcx.toFixed(1)}" cy="${mcy.toFixed(1)}" r="${(24 * k).toFixed(1)}" fill="${motif}" stroke="${INK}" stroke-width="2.6"/>` +
        `<path d="M${(mcx - 20 * k).toFixed(1)} ${mcy.toFixed(1)} Q${mcx.toFixed(1)} ${(mcy - 12 * k).toFixed(1)} ${(mcx + 16 * k).toFixed(1)} ${mcy.toFixed(1)} Q${mcx.toFixed(1)} ${(mcy + 11 * k).toFixed(1)} ${(mcx - 20 * k).toFixed(1)} ${mcy.toFixed(1)} Z" fill="${accent}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M${(mcx + 16 * k).toFixed(1)} ${mcy.toFixed(1)} L${(mcx + 26 * k).toFixed(1)} ${(mcy - 9 * k).toFixed(1)} L${(mcx + 26 * k).toFixed(1)} ${(mcy + 9 * k).toFixed(1)} Z" fill="${accent}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<circle cx="${(mcx - 11 * k).toFixed(1)}" cy="${(mcy - 3 * k).toFixed(1)}" r="2.2" fill="${INK}"/>`;
    }
  }

  const mid =
    `<rect x="0" y="${railY.toFixed(1)}" width="${f.w}" height="${(12 * k).toFixed(1)}" fill="${mix('#8A5E3B', p.sky.bottom, 0.1)}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="0" y="${(railY + 3).toFixed(1)}" width="${f.w}" height="3" fill="${lighten('#8A5E3B', 0.2)}" opacity="0.6"/>` +
    panels;

  // Objets posés sur l'arête du comptoir : ils marquent le premier plan.
  const front =
    `<g transform="translate(${(f.w * 0.09).toFixed(1)},${f.h.toFixed(1)}) scale(${k.toFixed(2)})">` +
    contactShadow(0, 0, 22, 5, 0.18) +
    `<path d="M-11 0 L-8 -26 Q0 -32 8 -26 L11 0 Z" fill="${cloth}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<rect x="-5" y="-34" width="10" height="8" rx="2" fill="${accent}" stroke="${INK}" stroke-width="2"/></g>` +
    `<g transform="translate(${(f.w * 0.24).toFixed(1)},${f.h.toFixed(1)}) scale(${k.toFixed(2)})">` +
    contactShadow(0, 0, 26, 6, 0.18) +
    `<path d="M-24 0 Q-26 -14 0 -14 Q26 -14 24 0 Z" fill="${motif}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<ellipse cy="-14" rx="26" ry="6" fill="${lighten(motif, 0.05)}" stroke="${INK}" stroke-width="2.4"/></g>` +
    `<rect x="${(f.w - 22 * k).toFixed(1)}" y="${(f.h * 0.42).toFixed(1)}" width="${(22 * k).toFixed(1)}" height="${(f.h * 0.58).toFixed(1)}" fill="${mix('#8A5E3B', p.sky.bottom, 0.05)}" stroke="${INK}" stroke-width="3"/>`;

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) + radGlow(`${ns}_lamp`, '#FFE9BC', 0.4) + clipDefs;
  return { defs, back, mid, front };
}

function sakuraSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [wood, blossom, light] = p.hero;
  const k = roomy(f);

  // Une branche se dessine au trait qui s'affine, pas en contour fermé : sinon c'est un tronc.
  const limb = (d: string, w: number) =>
    `<path d="${d}" stroke="${INK}" stroke-width="${(w + 5).toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" stroke="${wood}" stroke-width="${w.toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Grappe : une masse tendre en dégradé, puis quelques fleurs nettes posées dessus.
  const cluster = (cx: number, cy: number, r: number, n: number, seed: number) => {
    let out = '';
    for (let i = 0; i < 7; i++) {
      const a2 = ((i * 51 + seed * 31) * Math.PI) / 180;
      const rr = r * (0.42 + ((i * 17) % 10) / 40);
      out += `<circle cx="${(cx + Math.cos(a2) * r * 0.5).toFixed(1)}" cy="${(cy + Math.sin(a2) * r * 0.44).toFixed(1)}" r="${rr.toFixed(1)}" fill="${i % 3 === 0 ? blossom : light}" opacity="0.95"/>`;
    }
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="${light}" opacity="0.9"/>`;
    for (let i = 0; i < n; i++) {
      const a2 = ((i * 137 + seed * 47) * Math.PI) / 180;
      out += sakuraFlower(
        cx + Math.cos(a2) * r * 0.55,
        cy + Math.sin(a2) * r * 0.5,
        r * 0.3,
        i % 2 ? blossom : light
      );
    }
    return out;
  };

  // Rangée de couronnes sur l'horizon : « une branche » devient « un jardin ».
  let crowns = '';
  for (let i = 0; i < 8; i++) {
    const x = (i / 7) * (f.w + 70) - 35;
    const r = (40 + ((i * 31) % 24)) * k;
    const y = f.h - r * 0.3;
    const c = haze(blossom, p, 0.48 + (i % 3) * 0.08);
    crowns +=
      `<rect x="${(x - 3).toFixed(1)}" y="${y.toFixed(1)}" width="6" height="${(f.h - y).toFixed(1)}" fill="${haze(wood, p, 0.55)}"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.6).toFixed(1)}" fill="${c}"/>` +
      `<circle cx="${(x - r * 0.34).toFixed(1)}" cy="${(y + r * 0.14).toFixed(1)}" r="${(r * 0.4).toFixed(1)}" fill="${c}"/>` +
      `<circle cx="${(x + r * 0.36).toFixed(1)}" cy="${(y + r * 0.12).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="${c}"/>`;
  }
  const tx = f.w * 0.66;
  const ty = f.h - 4;
  const th = 86 * k;
  const torii =
    `<g fill="${haze('#C0392B', p, 0.48)}">` +
    `<rect x="${(tx - 34).toFixed(1)}" y="${(ty - th).toFixed(1)}" width="8" height="${th.toFixed(1)}"/>` +
    `<rect x="${(tx + 26).toFixed(1)}" y="${(ty - th).toFixed(1)}" width="8" height="${th.toFixed(1)}"/>` +
    `<rect x="${(tx - 48).toFixed(1)}" y="${(ty - th).toFixed(1)}" width="96" height="9"/>` +
    `<rect x="${(tx - 38).toFixed(1)}" y="${(ty - th + 18).toFixed(1)}" width="76" height="6"/></g>`;

  // Deuxième rangée d'arbres, à mi-distance : sans elle, un grand vide sépare la branche du sol.
  let midTrees = '';
  for (let i = 0; i < 4; i++) {
    const x = (0.1 + i * 0.28) * f.w;
    const r = (56 + ((i * 23) % 20)) * k;
    const y = f.h * 0.78 - r * 0.2;
    const c = haze(blossom, p, 0.3 + (i % 2) * 0.06);
    midTrees +=
      `<rect x="${(x - 5).toFixed(1)}" y="${y.toFixed(1)}" width="10" height="${(f.h - y).toFixed(1)}" fill="${haze(wood, p, 0.35)}"/>` +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.56).toFixed(1)}" fill="${c}"/>` +
      `<circle cx="${(x - r * 0.36).toFixed(1)}" cy="${(y + r * 0.16).toFixed(1)}" r="${(r * 0.38).toFixed(1)}" fill="${c}"/>` +
      `<circle cx="${(x + r * 0.38).toFixed(1)}" cy="${(y + r * 0.14).toFixed(1)}" r="${(r * 0.4).toFixed(1)}" fill="${c}"/>`;
  }

  const back =
    skyBase(p, f, ns) +
    glowSpot(`${ns}_sun`, f.w * 0.22, f.h * 0.14, f.w * 0.44) +
    ridge(f, f.h * 0.86, 16, 3, haze('#9FBE84', p, 0.55)) +
    crowns +
    torii +
    midTrees;

  // Deuxième branche, entrante par la droite, atténuée.
  const midD = `M${f.w + 14} ${(f.h * 0.16).toFixed(1)} Q${(f.w * 0.78).toFixed(1)} ${(f.h * 0.2).toFixed(1)} ${(f.w * 0.56).toFixed(1)} ${(f.h * 0.31).toFixed(1)}`;
  const mid =
    `<path d="${midD}" stroke="${haze(wood, p, 0.35)}" stroke-width="${(9 * k).toFixed(1)}" fill="none" stroke-linecap="round"/>` +
    [0.6, 0.72, 0.86, 0.97]
      .map((fx, i) =>
        `<circle cx="${(fx * f.w).toFixed(1)}" cy="${(f.h * (0.29 - i * 0.035)).toFixed(1)}" r="${(30 * k).toFixed(1)}" fill="${haze(light, p, 0.3)}" opacity="0.9"/>`
      )
      .join('');

  // Branche héroïne : entre en haut à gauche, s'affine vers la droite.
  const mainD = `M-16 ${(f.h * 0.08).toFixed(1)} Q${(f.w * 0.24).toFixed(1)} ${(f.h * 0.13).toFixed(1)} ${(f.w * 0.48).toFixed(1)} ${(f.h * 0.26).toFixed(1)} Q${(f.w * 0.68).toFixed(1)} ${(f.h * 0.36).toFixed(1)} ${(f.w * 0.92).toFixed(1)} ${(f.h * 0.38).toFixed(1)}`;
  const twigA = `M${(f.w * 0.3).toFixed(1)} ${(f.h * 0.16).toFixed(1)} Q${(f.w * 0.4).toFixed(1)} ${(f.h * 0.06).toFixed(1)} ${(f.w * 0.56).toFixed(1)} ${(f.h * 0.04).toFixed(1)}`;
  const twigB = `M${(f.w * 0.62).toFixed(1)} ${(f.h * 0.33).toFixed(1)} Q${(f.w * 0.66).toFixed(1)} ${(f.h * 0.46).toFixed(1)} ${(f.w * 0.58).toFixed(1)} ${(f.h * 0.56).toFixed(1)}`;
  const front =
    limb(mainD, 13 * k) +
    limb(twigA, 7 * k) +
    limb(twigB, 6 * k) +
    cluster(f.w * 0.08, f.h * 0.1, 40 * k, 3, 1) +
    cluster(f.w * 0.32, f.h * 0.13, 34 * k, 3, 2) +
    cluster(f.w * 0.54, f.h * 0.05, 30 * k, 2, 3) +
    cluster(f.w * 0.56, f.h * 0.29, 36 * k, 3, 4) +
    cluster(f.w * 0.84, f.h * 0.36, 32 * k, 3, 5) +
    cluster(f.w * 0.58, f.h * 0.57, 24 * k, 2, 6) +
    // Lanterne de pierre posée sur l'horizon.
    `<g transform="translate(${(f.w * 0.92).toFixed(1)},${f.h.toFixed(1)}) scale(${k.toFixed(2)})">` +
    contactShadow(0, 0, 26, 6, 0.2) +
    `<path d="M-18 0 L-13 -12 L13 -12 L18 0 Z" fill="#B9B4A6" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<rect x="-9" y="-34" width="18" height="22" fill="#C9C4B6" stroke="${INK}" stroke-width="2.6"/>` +
    `<rect x="-5" y="-30" width="10" height="12" fill="#F7C948" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M-24 -34 L0 -50 L24 -34 Z" fill="#B9B4A6" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<circle cy="-54" r="5" fill="#B9B4A6" stroke="${INK}" stroke-width="2.2"/></g>`;

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) +
    radGlow(`${ns}_sun`, '#FFFFFF', 0.5) +
    radGlow(`${ns}_bm`, light, 0.95, 0.2);
  return { defs, back, mid, front };
}

function waveSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [deep, light, foam, sun] = p.hero;
  const k = roomy(f);
  const deepDark = darken(deep, 0.2);
  const seaY = f.h * 0.52;

  const claw = (x: number, y: number, s2: number) =>
    `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">` +
    `<circle r="${s2.toFixed(1)}" fill="${foam}" stroke="${INK}" stroke-width="2.4"/>` +
    `<circle cx="${(s2 * 1.5).toFixed(1)}" cy="${(s2 * 0.5).toFixed(1)}" r="${(s2 * 0.72).toFixed(1)}" fill="${foam}" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle cx="${(s2 * 2.7).toFixed(1)}" cy="${(s2 * 1.15).toFixed(1)}" r="${(s2 * 0.5).toFixed(1)}" fill="${foam}" stroke="${INK}" stroke-width="2"/></g>`;

  // Fuji : sans contour d'encre et mélangé vers le ciel, il recule enfin pour de bon.
  const fx = f.w * 0.62;
  const fujiC = haze(p.far, p, 0.4);
  const back =
    skyBase(p, f, ns) +
    `<circle cx="${(f.w * 0.86).toFixed(1)}" cy="${(f.h * 0.14).toFixed(1)}" r="${(30 * k).toFixed(1)}" fill="${sun}" opacity="0.95"/>` +
    glowSpot(`${ns}_sun`, f.w * 0.86, f.h * 0.14, f.w * 0.3) +
    `<path d="M${(fx - 150).toFixed(1)} ${seaY.toFixed(1)} L${(fx - 20).toFixed(1)} ${(f.h * 0.17).toFixed(1)} Q${fx.toFixed(1)} ${(f.h * 0.12).toFixed(1)} ${(fx + 20).toFixed(1)} ${(f.h * 0.17).toFixed(1)} L${(fx + 150).toFixed(1)} ${seaY.toFixed(1)} Z" fill="${fujiC}"/>` +
    `<path d="M${(fx - 40).toFixed(1)} ${(f.h * 0.27).toFixed(1)} L${(fx - 20).toFixed(1)} ${(f.h * 0.17).toFixed(1)} Q${fx.toFixed(1)} ${(f.h * 0.12).toFixed(1)} ${(fx + 20).toFixed(1)} ${(f.h * 0.17).toFixed(1)} L${(fx + 40).toFixed(1)} ${(f.h * 0.27).toFixed(1)} Q${(fx + 18).toFixed(1)} ${(f.h * 0.31).toFixed(1)} ${fx.toFixed(1)} ${(f.h * 0.26).toFixed(1)} Q${(fx - 18).toFixed(1)} ${(f.h * 0.31).toFixed(1)} ${(fx - 40).toFixed(1)} ${(f.h * 0.27).toFixed(1)} Z" fill="${mix('#FFFFFF', p.sky.bottom, 0.2)}"/>` +
    // Brume au pied du Fuji, puis la mer jusqu'à l'horizon : plus de trou entre la vague et la plage.
    `<rect x="0" y="${(seaY - 14).toFixed(1)}" width="${f.w}" height="28" fill="${p.sky.bottom}" opacity="0.55"/>` +
    `<rect x="0" y="${seaY.toFixed(1)}" width="${f.w}" height="${(f.h - seaY).toFixed(1)}" fill="url(#${ns}_sea)"/>` +
    // Houle du large, de plus en plus marquée en approchant.
    [0.6, 0.7, 0.82]
      .map(
        (fy, i) =>
          `<path d="M${(-10 + i * 30).toFixed(1)} ${(f.h * fy).toFixed(1)} q${(f.w * 0.16).toFixed(1)} ${(-8 - i * 3).toFixed(1)} ${(f.w * 0.32).toFixed(1)} 0 t${(f.w * 0.32).toFixed(1)} 0 t${(f.w * 0.32).toFixed(1)} 0" stroke="${mix(light, '#FFFFFF', 0.3)}" stroke-width="${(2.4 + i).toFixed(1)}" fill="none" opacity="${(0.4 + i * 0.15).toFixed(2)}" stroke-linecap="round"/>`
      )
      .join('');

  // Vague secondaire, à droite, en retrait.
  const mid =
    `<path d="M${(f.w * 0.52).toFixed(1)} ${f.h.toFixed(1)} L${(f.w * 0.52).toFixed(1)} ${(f.h * 0.82).toFixed(1)} Q${(f.w * 0.68).toFixed(1)} ${(f.h * 0.72).toFixed(1)} ${(f.w * 0.84).toFixed(1)} ${(f.h * 0.78).toFixed(1)} Q${(f.w * 0.95).toFixed(1)} ${(f.h * 0.83).toFixed(1)} ${(f.w + 8).toFixed(1)} ${(f.h * 0.76).toFixed(1)} L${(f.w + 8).toFixed(1)} ${f.h.toFixed(1)} Z" fill="${deep}" stroke="${INK}" stroke-width="3"/>` +
    claw(f.w * 0.6, f.h * 0.78, 7 * k) +
    claw(f.w * 0.88, f.h * 0.755, 6 * k);

  // La grande vague : cantonnée à la gauche, elle encadre la scène au lieu de l'écraser.
  const R = 0.56; // portée horizontale, en fraction de la largeur
  const front =
    `<path d="M-20 ${f.h.toFixed(1)} L-20 ${(f.h * 0.5).toFixed(1)} Q${(f.w * 0.06).toFixed(1)} ${(f.h * 0.3).toFixed(1)} ${(f.w * 0.18).toFixed(1)} ${(f.h * 0.26).toFixed(1)} Q${(f.w * 0.3).toFixed(1)} ${(f.h * 0.23).toFixed(1)} ${(f.w * 0.34).toFixed(1)} ${(f.h * 0.33).toFixed(1)} Q${(f.w * 0.37).toFixed(1)} ${(f.h * 0.41).toFixed(1)} ${(f.w * 0.31).toFixed(1)} ${(f.h * 0.46).toFixed(1)} Q${(f.w * 0.4).toFixed(1)} ${(f.h * 0.46).toFixed(1)} ${(f.w * 0.44).toFixed(1)} ${(f.h * 0.58).toFixed(1)} Q${(f.w * 0.48).toFixed(1)} ${(f.h * 0.72).toFixed(1)} ${(f.w * 0.4).toFixed(1)} ${(f.h * 0.82).toFixed(1)} Q${(f.w * 0.5).toFixed(1)} ${(f.h * 0.84).toFixed(1)} ${(f.w * R).toFixed(1)} ${(f.h * 0.94).toFixed(1)} L${(f.w * 0.58).toFixed(1)} ${f.h.toFixed(1)} Z" fill="${deep}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>` +
    `<path d="M-20 ${f.h.toFixed(1)} L-20 ${(f.h * 0.76).toFixed(1)} Q${(f.w * 0.1).toFixed(1)} ${(f.h * 0.66).toFixed(1)} ${(f.w * 0.22).toFixed(1)} ${(f.h * 0.72).toFixed(1)} Q${(f.w * 0.34).toFixed(1)} ${(f.h * 0.8).toFixed(1)} ${(f.w * 0.4).toFixed(1)} ${(f.h * 0.93).toFixed(1)} L${(f.w * 0.42).toFixed(1)} ${f.h.toFixed(1)} Z" fill="${deepDark}" opacity="0.5"/>` +
    `<path d="M${(f.w * 0.005).toFixed(1)} ${(f.h * 0.49).toFixed(1)} Q${(f.w * 0.11).toFixed(1)} ${(f.h * 0.41).toFixed(1)} ${(f.w * 0.22).toFixed(1)} ${(f.h * 0.43).toFixed(1)} M-3 ${(f.h * 0.62).toFixed(1)} Q${(f.w * 0.13).toFixed(1)} ${(f.h * 0.53).toFixed(1)} ${(f.w * 0.27).toFixed(1)} ${(f.h * 0.57).toFixed(1)} M${(f.w * 0.04).toFixed(1)} ${(f.h * 0.76).toFixed(1)} Q${(f.w * 0.18).toFixed(1)} ${(f.h * 0.69).toFixed(1)} ${(f.w * 0.32).toFixed(1)} ${(f.h * 0.75).toFixed(1)}" stroke="${light}" stroke-width="3.4" fill="none" opacity="0.85" stroke-linecap="round"/>` +
    claw(f.w * 0.1, f.h * 0.33, 9 * k) +
    claw(f.w * 0.21, f.h * 0.3, 8 * k) +
    claw(f.w * 0.3, f.h * 0.36, 8 * k) +
    claw(f.w * 0.34, f.h * 0.46, 7 * k) +
    claw(f.w * 0.42, f.h * 0.6, 7 * k) +
    claw(f.w * 0.44, f.h * 0.76, 6 * k) +
    // Écume qui déborde sur le rivage : le raccord mer / plage.
    `<path d="M0 ${f.h.toFixed(1)} Q${(f.w * 0.22).toFixed(1)} ${(f.h * 0.93).toFixed(1)} ${(f.w * 0.46).toFixed(1)} ${(f.h * 0.97).toFixed(1)} Q${(f.w * 0.72).toFixed(1)} ${f.h.toFixed(1)} ${f.w} ${(f.h * 0.94).toFixed(1)} L${f.w} ${f.h.toFixed(1)} Z" fill="${foam}" opacity="0.9"/>` +
    `<circle cx="${(f.w * 0.2).toFixed(1)}" cy="${(f.h * 0.19).toFixed(1)}" r="${(4.4 * k).toFixed(1)}" fill="${foam}" stroke="${INK}" stroke-width="1.8"/>` +
    `<circle cx="${(f.w * 0.29).toFixed(1)}" cy="${(f.h * 0.17).toFixed(1)}" r="${(3.4 * k).toFixed(1)}" fill="${foam}" stroke="${INK}" stroke-width="1.6"/>`;

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) +
    linGrad(`${ns}_sea`, mix(light, p.sky.bottom, 0.6), deep) +
    radGlow(`${ns}_sun`, sun, 0.4);
  return { defs, back, mid, front };
}

function matsuriSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [lant, gold, alt] = p.hero;
  const k = roomy(f);
  const farC = haze(p.far, p, 0.3);

  // Toits de stands + temple sur l'horizon, avec des fenêtres allumées.
  let stalls = '';
  [0.06, 0.3, 0.56, 0.84].forEach((fx, i) => {
    const w = (70 + (i % 2) * 26) * k;
    const h = (52 + (i % 3) * 14) * k;
    const x = fx * f.w;
    stalls +=
      `<path d="M${(x - w / 2 - 8).toFixed(1)} ${(f.h - h).toFixed(1)} L${x.toFixed(1)} ${(f.h - h - 16 * k).toFixed(1)} L${(x + w / 2 + 8).toFixed(1)} ${(f.h - h).toFixed(1)} Z" fill="${darken(farC, 0.12)}"/>` +
      `<rect x="${(x - w / 2).toFixed(1)}" y="${(f.h - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${farC}"/>` +
      [0, 1, 2]
        .map(
          (j) =>
            `<rect x="${(x - w / 2 + 10 + j * (w / 3.4)).toFixed(1)}" y="${(f.h - h + 12 * k).toFixed(1)}" width="${(11 * k).toFixed(1)}" height="${(13 * k).toFixed(1)}" fill="${gold}" opacity="${j % 2 ? 0.55 : 0.85}"/>`
        )
        .join('');
  });
  const tw = f.w * 0.3;
  const temple =
    `<g transform="translate(${(f.w * 0.44).toFixed(1)},${(f.h - 96 * k).toFixed(1)})" fill="${haze(p.far, p, 0.45)}">` +
    `<path d="${`M${-tw / 2 - 14} 0 L0 -34 L${tw / 2 + 14} 0 Z`}"/>` +
    `<rect x="${(-tw / 2).toFixed(1)}" y="0" width="${tw.toFixed(1)}" height="${(96 * k).toFixed(1)}"/>` +
    `<path d="M${(-tw / 2 - 20).toFixed(1)} ${(34 * k).toFixed(1)} L0 ${(6 * k).toFixed(1)} L${(tw / 2 + 20).toFixed(1)} ${(34 * k).toFixed(1)} Z"/></g>`;

  const back =
    skyBase(p, f, ns) +
    // Feux d'artifice lointains : petits, hauts, désaturés.
    firework(f.w * 0.2, f.h * 0.14, 30 * k, haze(gold, p, 0.35), haze(lant, p, 0.35), 0.75, false) +
    firework(f.w * 0.74, f.h * 0.1, 24 * k, haze(alt, p, 0.35), haze(gold, p, 0.35), 0.6, false) +
    star4(f.w * 0.46, f.h * 0.08, 6, '#FFFFFF', 0.7) +
    star4(f.w * 0.88, f.h * 0.22, 5, '#FFFFFF', 0.6) +
    ridge(f, f.h * 0.82, 10, 5, haze(p.far, p, 0.6)) +
    temple +
    stalls;

  // Cordes tendues entre deux mâts visibles : la guirlande est enfin accrochée.
  const onRope = (y0: number, sag: number, t: number) =>
    (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag) + t * t * (y0 - 4 * k);
  const ropeY0 = f.h * 0.2;
  const ropeY1 = f.h * 0.34;
  const sag = f.h * 0.1;
  let lanterns = '';
  [0.08, 0.26, 0.44, 0.62, 0.8, 0.95].forEach((t, i) => {
    lanterns += lantern(t * f.w, onRope(ropeY0, sag, t), 0.95 * k, i % 3 === 0 ? gold : i % 2 ? alt : lant, gold, `${ns}_lg`);
  });
  [0.16, 0.36, 0.56, 0.76, 0.92].forEach((t, i) => {
    lanterns += lantern(t * f.w, onRope(ropeY1, sag * 0.85, t), 0.8 * k, i % 2 ? lant : alt, gold, `${ns}_lg`);
  });
  const mid =
    `<rect x="${(6 * k).toFixed(1)}" y="${(ropeY0 - 10).toFixed(1)}" width="${(9 * k).toFixed(1)}" height="${(f.h - ropeY0 + 10).toFixed(1)}" fill="${mix('#6B4A36', p.sky.bottom, 0.2)}" stroke="${INK}" stroke-width="2.4"/>` +
    `<rect x="${(f.w - 15 * k).toFixed(1)}" y="${(ropeY0 - 10).toFixed(1)}" width="${(9 * k).toFixed(1)}" height="${(f.h - ropeY0 + 10).toFixed(1)}" fill="${mix('#6B4A36', p.sky.bottom, 0.2)}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M0 ${ropeY0.toFixed(1)} Q${(f.w / 2).toFixed(1)} ${(ropeY0 + sag).toFixed(1)} ${f.w} ${(ropeY0 - 4 * k).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="3" opacity="0.8"/>` +
    `<path d="M0 ${ropeY1.toFixed(1)} Q${(f.w / 2).toFixed(1)} ${(ropeY1 + sag * 0.85).toFixed(1)} ${f.w} ${(ropeY1 - 4 * k).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="3" opacity="0.8"/>` +
    lanterns;

  // Une grosse lanterne coupée par le bord : le repère de premier plan le moins cher qui soit.
  const front = lantern(f.w * 0.12, f.h * 0.02, 2.2 * k, lant, gold, `${ns}_bg`);

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom, { c: mix(p.sky.top, p.sky.bottom, 0.55), at: 0.62 }) +
    radGlow(`${ns}_lg`, gold, 0.55) +
    radGlow(`${ns}_bg`, gold, 0.6);
  return { defs, back, mid, front };
}

function neonSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [building, neonA, neonB, win] = p.hero;
  const k = roomy(f);

  const windows = (bx: number, bw: number, top: number, cols: number, rows: number, o = 1) => {
    let s = '';
    const cw = bw / (cols + 1);
    const rh = (f.h - top) / (rows + 0.6);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = (r * 3 + c * 5 + Math.round(bx)) % 7 < 3;
        s += `<rect x="${(bx + cw * 0.6 + c * cw).toFixed(1)}" y="${(top + 12 + r * rh).toFixed(1)}" width="${(9 * k).toFixed(1)}" height="${(12 * k).toFixed(1)}" rx="1.5" fill="${win}" opacity="${(lit ? 0.95 : 0.28) * o}"/>`;
      }
    }
    return s;
  };

  // Troisième rang, sans encre, mélangé au ciel : la ville continue derrière.
  let farRow = '';
  for (let i = 0; i < 9; i++) {
    const x = -10 + i * (f.w / 8);
    const w = f.w / 7;
    const top = f.h * (0.42 + (((i * 43) % 100) / 100) * 0.2);
    farRow +=
      `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${(f.h - top).toFixed(1)}" fill="${haze(building, p, 0.55)}"/>` +
      windows(x, w, top, 2, 4, 0.4);
  }

  const back =
    skyBase(p, f, ns) +
    // Halo urbain juste au-dessus de l'horizon : le signal « Tokyo la nuit ».
    glowSpot(`${ns}_city`, f.w * 0.5, f.h * 1.02, f.w * 0.85) +
    `<circle cx="${(f.w * 0.82).toFixed(1)}" cy="${(f.h * 0.13).toFixed(1)}" r="${(30 * k).toFixed(1)}" fill="#F7F2E6" stroke="${INK}" stroke-width="2.6"/>` +
    `<circle cx="${(f.w * 0.79).toFixed(1)}" cy="${(f.h * 0.11).toFixed(1)}" r="${(6 * k).toFixed(1)}" fill="${darken('#F7F2E6', 0.12)}" opacity="0.7"/>` +
    glowSpot(`${ns}_moon`, f.w * 0.82, f.h * 0.13, f.w * 0.22) +
    farRow;

  const backC = darken(building, 0.28);
  let midRow = '';
  [
    [0.02, 0.16, 0.3],
    [0.34, 0.15, 0.24],
    [0.62, 0.18, 0.34],
    [0.86, 0.16, 0.26],
  ].forEach(([fx, fw, ft]) => {
    const top = f.h * (1 - ft);
    midRow +=
      `<rect x="${(fx * f.w).toFixed(1)}" y="${top.toFixed(1)}" width="${(fw * f.w).toFixed(1)}" height="${(f.h - top).toFixed(1)}" fill="${backC}"/>` +
      windows(fx * f.w, fw * f.w, top, 3, 5, 0.7);
  });
  // Ligne de métro aérien.
  const railY = f.h * 0.72;
  const mid =
    midRow +
    `<rect x="0" y="${railY.toFixed(1)}" width="${f.w}" height="${(9 * k).toFixed(1)}" fill="${darken(building, 0.15)}"/>` +
    [0.12, 0.4, 0.68, 0.94]
      .map((fx) => `<rect x="${(fx * f.w).toFixed(1)}" y="${(railY + 9 * k).toFixed(1)}" width="${(8 * k).toFixed(1)}" height="${(f.h - railY).toFixed(1)}" fill="${darken(building, 0.15)}"/>`)
      .join('');

  let frontRow = '';
  [
    [-0.03, 0.24, 0.62],
    [0.22, 0.2, 0.46],
    [0.44, 0.24, 0.74],
    [0.7, 0.19, 0.5],
    [0.9, 0.18, 0.62],
  ].forEach(([fx, fw, ft]) => {
    const top = f.h * (1 - ft);
    frontRow +=
      `<rect x="${(fx * f.w).toFixed(1)}" y="${top.toFixed(1)}" width="${(fw * f.w).toFixed(1)}" height="${(f.h - top).toFixed(1)}" fill="${building}" stroke="${INK}" stroke-width="2.6"/>` +
      windows(fx * f.w, fw * f.w, top, 3, 6);
  });
  const signA = { x: f.w * 0.47, y: f.h * 0.36, w: 32 * k, h: 88 * k };
  const signB = { x: f.w * 0.06, y: f.h * 0.48, w: 56 * k, h: 42 * k };
  const front =
    frontRow +
    glowSpot(`${ns}_ga`, signA.x + signA.w / 2, signA.y + signA.h / 2, signA.h * 1.1) +
    `<rect x="${signA.x.toFixed(1)}" y="${signA.y.toFixed(1)}" width="${signA.w.toFixed(1)}" height="${signA.h.toFixed(1)}" rx="5" fill="${darken(building, 0.18)}" stroke="${neonA}" stroke-width="3"/>` +
    `<path d="M${(signA.x + 8).toFixed(1)} ${(signA.y + 16).toFixed(1)} L${(signA.x + signA.w - 8).toFixed(1)} ${(signA.y + 16).toFixed(1)} M${(signA.x + signA.w / 2).toFixed(1)} ${(signA.y + 16).toFixed(1)} L${(signA.x + signA.w / 2).toFixed(1)} ${(signA.y + 34).toFixed(1)} M${(signA.x + 7).toFixed(1)} ${(signA.y + 46).toFixed(1)} L${(signA.x + signA.w - 7).toFixed(1)} ${(signA.y + 46).toFixed(1)} L${(signA.x + signA.w - 7).toFixed(1)} ${(signA.y + 62).toFixed(1)} L${(signA.x + 7).toFixed(1)} ${(signA.y + 62).toFixed(1)} Z M${(signA.x + 8).toFixed(1)} ${(signA.y + 72).toFixed(1)} L${(signA.x + signA.w - 8).toFixed(1)} ${(signA.y + 82).toFixed(1)}" stroke="${neonA}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    glowSpot(`${ns}_gb`, signB.x + signB.w / 2, signB.y + signB.h / 2, signB.w * 0.9) +
    `<rect x="${signB.x.toFixed(1)}" y="${signB.y.toFixed(1)}" width="${signB.w.toFixed(1)}" height="${signB.h.toFixed(1)}" rx="7" fill="${darken(building, 0.18)}" stroke="${neonB}" stroke-width="3"/>` +
    `<path d="M${(signB.x + 10).toFixed(1)} ${(signB.y + 24).toFixed(1)} a 16 12 0 0 0 ${(signB.w - 20).toFixed(1)} 0" fill="none" stroke="${neonB}" stroke-width="2.6"/>` +
    `<path d="M${(signB.x + 12).toFixed(1)} ${(signB.y + 17).toFixed(1)} Q${(signB.x + 20).toFixed(1)} ${(signB.y + 10).toFixed(1)} ${(signB.x + 28).toFixed(1)} ${(signB.y + 17).toFixed(1)} M${(signB.x + 28).toFixed(1)} ${(signB.y + 17).toFixed(1)} Q${(signB.x + 36).toFixed(1)} ${(signB.y + 10).toFixed(1)} ${(signB.x + 44).toFixed(1)} ${(signB.y + 17).toFixed(1)}" stroke="${neonB}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) +
    radGlow(`${ns}_city`, neonA, 0.35) +
    radGlow(`${ns}_moon`, '#FFFFFF', 0.3) +
    radGlow(`${ns}_ga`, neonA, 0.5) +
    radGlow(`${ns}_gb`, neonB, 0.5);
  return { defs, back, mid, front };
}

function spaceSky(p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  const [sea, land, star] = p.hero;
  const k = roomy(f);

  // Étoiles en trois strates, densité qui s'éclaircit vers l'horizon.
  let stars = '';
  for (let i = 0; i < 46; i++) {
    const fy = ((i * 37) % 100) / 100;
    const y = fy * fy * f.h; // plus dense en haut
    const r = (i % 7 === 0 ? 2.6 : i % 3 === 0 ? 1.9 : 1.2) * k;
    stars += `<circle cx="${((((i * 61) % 100) / 100) * f.w).toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${star}" opacity="${(i % 3 === 0 ? 0.9 : 0.55).toFixed(2)}"/>`;
  }
  const back =
    skyBase(p, f, ns) +
    // Voie lactée : une bande radiale inclinée, très basse en opacité.
    `<ellipse cx="${(f.w * 0.55).toFixed(1)}" cy="${(f.h * 0.36).toFixed(1)}" rx="${(f.w * 0.75).toFixed(1)}" ry="${(f.h * 0.16).toFixed(1)}" fill="url(#${ns}_mw)" transform="rotate(-24 ${(f.w * 0.55).toFixed(1)} ${(f.h * 0.36).toFixed(1)})"/>` +
    stars +
    star4(f.w * 0.44, f.h * 0.08, 8 * k, star) +
    star4(f.w * 0.8, f.h * 0.22, 6 * k, star, 0.9) +
    star4(f.w * 0.1, f.h * 0.3, 5 * k, star, 0.8) +
    `<line x1="${(f.w * 0.62).toFixed(1)}" y1="${(f.h * 0.56).toFixed(1)}" x2="${(f.w * 0.82).toFixed(1)}" y2="${(f.h * 0.48).toFixed(1)}" stroke="${star}" stroke-width="2.6" stroke-linecap="round" opacity="0.7"/>` +
    star4(f.w * 0.83, f.h * 0.475, 7 * k, '#FFFFFF');

  const ex = f.w * 0.3;
  const ey = f.h * 0.36;
  const er = 58 * k;
  const mid =
    glowSpot(`${ns}_eg`, ex, ey, er * 1.9) +
    `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(er + 5).toFixed(1)}" fill="none" stroke="#BFE6FF" stroke-width="${(6 * k).toFixed(1)}" opacity="0.4"/>` +
    `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${er.toFixed(1)}" fill="${sea}" stroke="${INK}" stroke-width="3"/>` +
    `<g transform="translate(${ex.toFixed(1)},${ey.toFixed(1)}) scale(${(er / 44).toFixed(3)})">` +
    `<path d="M-32 -20 Q-20 -34 -2 -30 Q10 -26 6 -12 Q-2 0 -20 -4 Q-34 -8 -32 -20 Z" fill="${land}" stroke="${INK}" stroke-width="1.8"/>` +
    `<path d="M14 14 Q30 8 36 20 Q34 32 18 34 Q6 30 14 14 Z" fill="${land}" stroke="${INK}" stroke-width="1.8"/>` +
    `<path d="M-18 24 Q-8 20 -2 26 Q-8 34 -18 30 Z" fill="${land}" stroke="${INK}" stroke-width="1.6"/>` +
    `<path d="M-36 6 Q-22 10 -8 8 M0 -20 Q16 -22 26 -14" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round"/>` +
    `</g>` +
    // Terminateur : le côté nuit de la planète.
    `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${er.toFixed(1)}" fill="url(#${ns}_term)"/>` +
    `<g transform="translate(${(f.w * 0.85).toFixed(1)},${(f.h * 0.66).toFixed(1)})">` +
    `<circle r="${(15 * k).toFixed(1)}" fill="#F4B740" stroke="${INK}" stroke-width="2.4"/>` +
    `<ellipse rx="${(28 * k).toFixed(1)}" ry="${(8 * k).toFixed(1)}" fill="none" stroke="${lighten('#F4B740', 0.2)}" stroke-width="3" transform="rotate(-16)"/></g>`;

  const front =
    // Affleurement rocheux qui casse la ligne d'horizon, et un drapeau planté.
    `<path d="M${(f.w * 0.72).toFixed(1)} ${f.h.toFixed(1)} L${(f.w * 0.78).toFixed(1)} ${(f.h - 46 * k).toFixed(1)} L${(f.w * 0.86).toFixed(1)} ${(f.h - 30 * k).toFixed(1)} L${(f.w * 0.94).toFixed(1)} ${(f.h - 54 * k).toFixed(1)} L${(f.w + 6).toFixed(1)} ${(f.h - 18 * k).toFixed(1)} L${(f.w + 6).toFixed(1)} ${f.h.toFixed(1)} Z" fill="${p.ground.shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<g transform="translate(${(f.w * 0.16).toFixed(1)},${f.h.toFixed(1)}) scale(${k.toFixed(2)})">` +
    contactShadow(6, 0, 22, 5, 0.25) +
    `<rect x="-2" y="-70" width="4" height="70" fill="#D9D6CB" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M2 -70 L38 -62 L38 -42 L2 -50 Z" fill="#EE3B30" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></g>`;

  const defs =
    linGrad(`${ns}_sky`, p.sky.top, p.sky.bottom) +
    `<radialGradient id="${ns}_mw"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.14"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${ns}_term" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0.3" stop-color="#000018" stop-opacity="0"/><stop offset="1" stop-color="#000018" stop-opacity="0.72"/></linearGradient>` +
    radGlow(`${ns}_eg`, '#8FD0EC', 0.3);
  return { defs, back, mid, front };
}

export function skyArt(kind: SceneKind, p: ScenePalette, f: ArtFrame, ns: string): SkyParts {
  switch (kind) {
    case 'default':
      return defaultSky(p, f, ns);
    case 'bamboo':
      return bambooSky(p, f, ns);
    case 'dojo':
      return dojoSky(p, f, ns);
    case 'sushi':
      return sushiSky(p, f, ns);
    case 'sakura':
      return sakuraSky(p, f, ns);
    case 'wave':
      return waveSky(p, f, ns);
    case 'matsuri':
      return matsuriSky(p, f, ns);
    case 'neon':
      return neonSky(p, f, ns);
    case 'space':
      return spaceSky(p, f, ns);
  }
}

export function skyDoc(kind: SceneKind, p: ScenePalette, f: ArtFrame, ns: string): string {
  const s = skyArt(kind, p, f, ns);
  return svgDoc(f, s.defs, s.back + s.mid + s.front);
}

/** Un plan isolé, pour la parallaxe : chaque couche est son propre document. */
export function skyLayerDoc(parts: SkyParts, layer: 'back' | 'mid' | 'front', f: ArtFrame): string {
  return svgDoc(f, parts.defs, parts[layer]);
}
