/**
 * Compositeur de scène — module **pur** (aucun import react-native).
 *
 * `Scene.tsx` (rendu RN, couches séparées pour la parallaxe) et `scripts/render-scenes.mjs`
 * (rastérisation resvg, document unique) appellent tous les deux ce module : un aperçu PNG
 * montre donc bien ce que l'app affiche, et les deux ne peuvent pas diverger.
 */
import { DECOR_FRAME, decorDoc } from '@/art/dimArt';
import { groundArt, skyArt } from '@/art/sceneArt';
import { groundFrame, type SceneGeom, skyFrame, speedLinePaths } from '@/art/sceneGeom';
import type { BackgroundConfig } from '@/data/backgrounds';

const INK = '#16161D';

/** Contenu interne d'un document SVG, sans sa racine (SvgXml ne gère pas les <svg> imbriqués). */
export function svgInner(doc: string): string {
  return doc.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

export type ComposeOpts = {
  /** Namespace des ids SVG : une scène par scope, déterministe donc stable pour la mémoïsation. */
  scope?: string;
  decor?: { id: string; decor?: string; color?: string; x?: number; w?: number }[];
  /** Repères de mise en page (horizon, bandes de profondeur). */
  guides?: boolean;
  /** Particules figées à cette phase (0..1), ou null pour les omettre. */
  ambientPhase?: number | null;
};

// ---------------------------------------------------------------------------
// Couches
// ---------------------------------------------------------------------------

/** Trame manga. Maille en px appareil (le composant RN n'a pas de viewBox), pas en unités d'art. */
function halftoneBody(cfg: BackgroundConfig, g: SceneGeom, ns: string) {
  return {
    defs:
      `<pattern id="${ns}_ht" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">` +
      `<circle cx="3" cy="3" r="2" fill="${cfg.halftone.dot}" opacity="${(cfg.halftone.opacity * 0.55).toFixed(3)}"/></pattern>`,
    body: `<rect x="0" y="0" width="${g.w}" height="${g.h}" fill="url(#${ns}_ht)"/>`,
  };
}

function speedBody(cfg: BackgroundConfig, g: SceneGeom): string {
  const size = g.w * 0.52;
  const lines = speedLinePaths(size, 30, 0.42, 1.8)
    .map(
      (l) =>
        `<line x1="${l.x1.toFixed(1)}" y1="${l.y1.toFixed(1)}" x2="${l.x2.toFixed(1)}" y2="${l.y2.toFixed(1)}" ` +
        `stroke="${cfg.speed.color}" stroke-width="${l.w}" stroke-linecap="round"/>`
    )
    .join('');
  // Centré sur le personnage plutôt que sur un point arbitraire : le faisceau doit désigner Dim.
  // Centrées sur le personnage, pas sur un point arbitraire : le faisceau doit désigner Dim.
  const left = g.w * 0.5 - size / 2;
  const top = g.horizonY - size * 0.78;
  return `<g transform="translate(${left.toFixed(1)},${top.toFixed(1)})" opacity="${(cfg.speed.opacity * 0.5).toFixed(3)}">${lines}</g>`;
}

function decorBody(g: SceneGeom, ns: string, decor: NonNullable<ComposeOpts['decor']>): string {
  return decor
    .filter((it) => it.decor)
    .map((it, i) => {
      const w = (it.w ?? 90) * g.u;
      const h = (w * DECOR_FRAME.h) / DECOR_FRAME.w;
      const x = (it.x ?? 0.5) * g.w - w / 2;
      const y = g.groundY - h;
      const body = svgInner(decorDoc(it.decor as never, it.color ?? '#FFFFFF')).replace(
        /\sid="([^"]+)"/g,
        ` id="${ns}d${i}_$1"`
      );
      return (
        `<ellipse cx="${(x + w / 2).toFixed(1)}" cy="${g.groundY.toFixed(1)}" rx="${(w * 0.42).toFixed(1)}" ry="${(w * 0.11).toFixed(1)}" fill="${INK}" opacity="0.18"/>` +
        `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(w / DECOR_FRAME.w).toFixed(4)})">${body}</g>`
      );
    })
    .join('');
}

/** Particules figées à une phase donnée, d'après les interpolations d'Ambient.tsx. */
function ambientBody(cfg: BackgroundConfig, g: SceneGeom, t: number): string {
  const frac = (i: number, step: number) => ((i * step) % 100) / 100;
  const a = cfg.ambient;
  const ring = `stroke="${INK}" stroke-width="2"`;
  switch (a.kind) {
    case 'none':
      return '';
    case 'steam': {
      let out = '';
      for (const left of [g.w * 0.36, g.w * 0.6]) {
        [0.2, 0.5, 0.8].forEach((tt, k) => {
          const o = tt < 0.7 ? 0.45 : 0.25;
          const sc = 0.55 + tt * 0.95;
          out += `<circle cx="${(left + [0, 12, -6][k] + 14).toFixed(1)}" cy="${(g.horizonY - tt * 78 - 14).toFixed(1)}" r="${(14 * sc).toFixed(1)}" fill="${a.color}" opacity="${o}" ${ring}/>`;
        });
      }
      return out;
    }
    case 'fall': {
      let out = '';
      for (let i = 0; i < 7; i++) {
        const tt = (t + i / 7) % 1;
        const size = 9 + (i % 3) * 3;
        const drift = (frac(i, 37) - 0.5) * 70;
        const x = (0.06 + frac(i, 29) * 0.88) * g.w + drift * (tt < 0.5 ? tt * 2 : 1);
        const y = -20 + tt * (g.horizonY - 20);
        const rw = a.shape === 'petal' ? size * 1.5 : size;
        out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(rw / 2).toFixed(1)}" ry="${(size / 2).toFixed(1)}" fill="${a.color}" opacity="0.75" stroke="${INK}" stroke-width="1.5" transform="rotate(${(tt * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      return out;
    }
    case 'rise': {
      let out = '';
      for (let i = 0; i < 6; i++) {
        const tt = (t + i / 6) % 1;
        const size = 10 + (i % 3) * 4;
        out += `<circle cx="${((0.08 + frac(i, 31) * 0.84) * g.w).toFixed(1)}" cy="${(g.horizonY - tt * 96 - size / 2).toFixed(1)}" r="${((size / 2) * (0.6 + tt * 0.6)).toFixed(1)}" fill="${a.color}" opacity="${(0.8 - tt * 0.4).toFixed(2)}" ${ring}/>`;
      }
      return out;
    }
    case 'twinkle': {
      let out = '';
      for (let i = 0; i < 8; i++) {
        const tt = (t + i / 8) % 1;
        const size = 5 + (i % 3) * 2;
        out += `<circle cx="${((0.05 + frac(i, 23) * 0.9) * g.w).toFixed(1)}" cy="${(30 + frac(i, 43) * g.skyH * 0.6).toFixed(1)}" r="${((size / 2) * (0.7 + tt * 0.5)).toFixed(1)}" fill="${a.color}" opacity="${(0.15 + tt * 0.8).toFixed(2)}"/>`;
      }
      return out;
    }
  }
}

function guideBody(g: SceneGeom): string {
  return (
    [0.22, 0.58, 0.88]
      .map(
        (f) =>
          `<line x1="0" y1="${(g.skyH * f).toFixed(1)}" x2="${g.w}" y2="${(g.skyH * f).toFixed(1)}" stroke="#2E6BE6" stroke-width="1" stroke-dasharray="6 6" opacity="0.7"/>`
      )
      .join('') +
    `<line x1="0" y1="${g.horizonY}" x2="${g.w}" y2="${g.horizonY}" stroke="#FF00A0" stroke-width="1.5"/>` +
    `<line x1="0" y1="${g.groundY}" x2="${g.w}" y2="${g.groundY}" stroke="#FF00A0" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`
  );
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Les couches séparées. `Scene.tsx` en a besoin pour animer chaque plan indépendamment ;
 * chacune est un document SVG complet, prêt pour `SvgXml`.
 */
export function sceneLayers(cfg: BackgroundConfig, g: SceneGeom, opts: ComposeOpts = {}) {
  const ns = opts.scope ?? 'home';
  const sf = skyFrame(g);
  const gf = groundFrame(g);
  const sky = skyArt(cfg.kind, cfg, sf, `${ns}s`);
  const ground = groundArt(cfg.kind, cfg, gf, `${ns}g`);
  const doc = (f: { w: number; h: number }, defs: string, body: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.w} ${f.h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
  return {
    skyFrame: sf,
    groundFrame: gf,
    back: doc(sf, sky.defs, sky.back),
    mid: doc(sf, sky.defs, sky.mid),
    front: doc(sf, sky.defs, sky.front),
    ground: doc(gf, ground.defs, ground.body),
  };
}

/** La même scène, aplatie en un document : script de rendu et vignettes de boutique. */
export function composeSceneSvg(cfg: BackgroundConfig, g: SceneGeom, opts: ComposeOpts = {}): string {
  const ns = opts.scope ?? 'home';
  const sf = skyFrame(g);
  const gf = groundFrame(g);
  const sky = skyArt(cfg.kind, cfg, sf, `${ns}s`);
  const ground = groundArt(cfg.kind, cfg, gf, `${ns}g`);
  const ht = halftoneBody(cfg, g, ns);
  const s = g.u.toFixed(4);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.w} ${g.h}" width="${g.w}" height="${g.h}">` +
    `<defs>${sky.defs}${ground.defs}${ht.defs}</defs>` +
    `<rect x="0" y="0" width="${g.w}" height="${g.h}" fill="${cfg.paper}"/>` +
    `<g transform="scale(${s})">${sky.back}${sky.mid}${sky.front}</g>` +
    (opts.ambientPhase == null ? '' : ambientBody(cfg, g, opts.ambientPhase)) +
    `<g transform="translate(0,${g.horizonY}) scale(${s})">${ground.body}</g>` +
    `<rect x="0" y="${g.horizonY}" width="${g.w}" height="3" fill="${INK}"/>` +
    speedBody(cfg, g) +
    ht.body +
    (opts.decor?.length ? decorBody(g, ns, opts.decor) : '') +
    (opts.guides ? guideBody(g) : '') +
    `</svg>`
  );
}
