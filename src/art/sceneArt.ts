import { darken, lighten } from '@/art/dimArt';
import type { BackgroundConfig, FloorKind, UpperKind } from '@/data/backgrounds';

const INK = '#16161D';

export const SCENE_W = 390;
export const FLOOR_FRAME = { w: SCENE_W, h: 460 };

export const UPPER_H: Record<Exclude<UpperKind, 'lanterns'>, number> = {
  stalks: 560,
  noren: 310,
  scroll: 420,
  branch: 380,
  skyline: 260,
  wavecrest: 280,
  moonstars: 400,
  garland: 380,
};

export const UPPER_BOTTOM_ANCHORED: ReadonlySet<UpperKind> = new Set(['skyline', 'wavecrest']);

function svg(w: number, h: number, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` + body + `</svg>`
  );
}

function star4(cx: number, cy: number, s: number, fill: string, o = 1): string {
  const k = s * 0.22;
  return (
    `<path d="M${cx} ${cy - s} Q${cx + k} ${cy - k} ${cx + s} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + s} Q${cx - k} ${cy + k} ${cx - s} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - s} Z" fill="${fill}" opacity="${o}"/>`
  );
}

function bambooLeaf(x: number, y: number, len: number, deg: number, fill: string, o = 1): string {
  const w = len * 0.3;
  return (
    `<g transform="translate(${x},${y}) rotate(${deg})" opacity="${o}">` +
    `<path d="M0 0 Q${len * 0.4} ${-w} ${len} ${-w * 0.2} Q${len * 0.45} ${w * 0.6} 0 0 Z" fill="${fill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `</g>`
  );
}

function sakuraFlower(cx: number, cy: number, r: number, petal: string, id: string): string {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    petals += `<ellipse cx="0" cy="${-r * 0.62}" rx="${r * 0.38}" ry="${r * 0.55}" fill="${petal}" stroke="${INK}" stroke-width="2" transform="rotate(${i * 72})"/>`;
  }
  return (
    `<g transform="translate(${cx},${cy})" data-id="${id}">` +
    petals +
    `<circle r="${r * 0.2}" fill="#F4B740" stroke="${INK}" stroke-width="1.6"/>` +
    `<circle cx="${r * 0.12}" cy="${-r * 0.4}" r="${r * 0.08}" fill="#FFFFFF" opacity="0.8"/>` +
    `</g>`
  );
}

function miniLantern(x: number, y: number, body: string, gold: string): string {
  return (
    `<g transform="translate(${x},${y})">` +
    `<ellipse cx="0" cy="24" rx="20" ry="17" fill="${gold}" opacity="0.22"/>` +
    `<line x1="0" y1="0" x2="0" y2="6" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="-8" y="6" width="16" height="5" rx="2" fill="${gold}" stroke="${INK}" stroke-width="1.8"/>` +
    `<rect x="-13" y="10" width="26" height="28" rx="12" fill="${body}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M-5 12 Q-6 24 -5 36 M5 12 Q6 24 5 36" stroke="${darken(body, 0.3)}" stroke-width="1.6" fill="none" opacity="0.6"/>` +
    `<ellipse cx="-5" cy="17" rx="4" ry="6" fill="#FFFFFF" opacity="0.35"/>` +
    `<rect x="-7" y="37" width="14" height="5" rx="2" fill="${gold}" stroke="${INK}" stroke-width="1.8"/>` +
    `<line x1="0" y1="42" x2="0" y2="50" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  );
}

function firework(cx: number, cy: number, r: number, color: string, alt: string): string {
  let out = `<g transform="translate(${cx},${cy})">`;
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    const x1 = Math.cos(a) * r * 0.35;
    const y1 = Math.sin(a) * r * 0.35;
    const x2 = Math.cos(a) * r;
    const y2 = Math.sin(a) * r;
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${i % 3 === 0 ? alt : color}" stroke-width="3" stroke-linecap="round"/>`;
    out += `<circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.6" fill="${i % 3 === 0 ? alt : color}"/>`;
  }
  out += star4(0, 0, r * 0.16, '#FFFFFF', 0.9) + `</g>`;
  return out;
}

function stalksArt(c0: string, c1: string, c2: string): string {
  const far = lighten(c0, 0.28);
  const H = UPPER_H.stalks;

  const farStalk = (x: number, w: number) =>
    `<rect x="${x}" y="0" width="${w}" height="${H}" fill="${far}" opacity="0.5"/>` +
    [90, 200, 310, 430].map((y) => `<rect x="${x}" y="${y}" width="${w}" height="3" fill="${darken(far, 0.15)}" opacity="0.6"/>`).join('');

  const stalk = (x: number, w: number, fill: string, nodes: number[]) => {
    const shade = darken(fill, 0.22);
    let s =
      `<rect x="${x}" y="-8" width="${w}" height="${H + 16}" fill="${fill}" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="${x + w * 0.6}" y="-8" width="${w * 0.22}" height="${H + 16}" fill="${shade}" opacity="0.45"/>`;
    for (const y of nodes) {
      s += `<rect x="${x - 3}" y="${y}" width="${w + 6}" height="9" rx="4.5" fill="${darken(fill, 0.16)}" stroke="${INK}" stroke-width="2.4"/>`;
    }
    return s;
  };

  return svg(
    SCENE_W,
    H,
    farStalk(100, 12) +
      farStalk(168, 9) +
      farStalk(252, 13) +
      farStalk(312, 9) +
      stalk(14, 34, c0, [64, 158, 252, 346, 442]) +
      stalk(64, 18, c2, [96, 200, 304, 410]) +
      stalk(342, 34, c0, [92, 186, 280, 374, 470]) +
      bambooLeaf(48, 208, 46, -24, c2) +
      bambooLeaf(48, 212, 38, 6, c1) +
      bambooLeaf(46, 302, 42, 28, c1) +
      bambooLeaf(82, 250, 40, -14, c2) +
      bambooLeaf(82, 354, 44, 18, c1) +
      bambooLeaf(80, 358, 34, 44, c2) +
      bambooLeaf(342, 236, -46, 204, c2) +
      bambooLeaf(342, 330, -42, 158, c1) +
      bambooLeaf(344, 334, -36, 190, c2) +
      bambooLeaf(150, 114, 22, 30, far, 0.5) +
      bambooLeaf(230, 222, 20, -20, far, 0.5) +
      bambooLeaf(190, 380, 22, 14, far, 0.45)
  );
}

function norenArt(cloth: string, motif: string, accent: string): string {
  const H = UPPER_H.noren;
  const shade = darken(cloth, 0.18);
  const panelW = 88;
  const gap = (SCENE_W - panelW * 4) / 5;

  const seigaiha = (px: number, py: number) => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += `<path d="M${px + i * 22 - 6} ${py} a 14 14 0 0 1 28 0" fill="none" stroke="${motif}" stroke-width="2.4" opacity="0.75"/>`;
    }
    for (let i = 0; i < 5; i++) {
      s += `<path d="M${px + i * 22 - 17} ${py + 10} a 14 14 0 0 1 28 0" fill="none" stroke="${motif}" stroke-width="2.4" opacity="0.75"/>`;
    }
    return s;
  };

  let defs = '';
  let panels = '';
  for (let i = 0; i < 4; i++) {
    const x = gap + i * (panelW + gap);
    const h = i % 2 ? 268 : 288;
    const panelPath = `M${x} 16 L${x + panelW} 16 L${x + panelW} ${h - 8} Q${x + panelW / 2} ${h + 6} ${x} ${h - 8} Z`;
    defs += `<clipPath id="np_${i}"><path d="${panelPath}"/></clipPath>`;
    panels +=
      `<path d="${panelPath}" fill="${cloth}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      `<g clip-path="url(#np_${i})">` +
      `<path d="M${x + panelW - 14} 16 L${x + panelW} 16 L${x + panelW} ${h - 8} Q${x + panelW * 0.8} ${h + 2} ${x + panelW - 14} ${h - 4} Z" fill="${shade}" opacity="0.5"/>` +
      `<path d="M${x + panelW * 0.3} 22 Q${x + panelW * 0.26} ${h * 0.5} ${x + panelW * 0.3} ${h - 18}" stroke="${shade}" stroke-width="2" fill="none" opacity="0.45"/>` +
      `<path d="M${x + panelW * 0.62} 22 Q${x + panelW * 0.66} ${h * 0.5} ${x + panelW * 0.62} ${h - 18}" stroke="${shade}" stroke-width="2" fill="none" opacity="0.35"/>` +
      seigaiha(x + 8, h - 26) +
      `</g>` +
      `<path d="${panelPath}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    if (i === 1) {
      panels +=
        `<circle cx="${x + panelW / 2}" cy="218" r="24" fill="${motif}" stroke="${INK}" stroke-width="2.6"/>` +
        `<path d="M${x + 24} 218 Q${x + 44} 204 ${x + 60} 218 Q${x + 44} 230 ${x + 24} 218 Z" fill="${accent}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M${x + 60} 218 L${x + 70} 209 L${x + 70} 227 Z" fill="${accent}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<circle cx="${x + 33}" cy="215" r="2.2" fill="${INK}"/>`;
    }
    if (i === 2) {
      panels +=
        `<path d="M${x + panelW / 2 - 4} 196 Q${x + panelW / 2 + 6} 214 ${x + panelW / 2 - 2} 234 Q${x + panelW / 2 - 8} 246 ${x + panelW / 2 + 2} 254 L${x + panelW / 2 + 8} 250 Q${x + panelW / 2 + 2} 238 ${x + panelW / 2 + 8} 220 Q${x + panelW / 2 + 12} 206 ${x + panelW / 2 + 4} 194 Z" fill="${accent}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
    }
  }

  return svg(
    SCENE_W,
    H,
    `<defs>${defs}</defs>` +
      `<rect x="0" y="0" width="${SCENE_W}" height="10" fill="#8A5E3B" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="0" y="2" width="${SCENE_W}" height="3" fill="${lighten('#8A5E3B', 0.2)}" opacity="0.6"/>` +
      panels
  );
}

function scrollArt(beam: string, paper: string, seal: string): string {
  const H = UPPER_H.scroll;
  const beamDark = darken(beam, 0.22);

  const shoji = (x: number, w: number, h: number) => {
    let grid = '';
    for (let i = 1; i < 3; i++) grid += `<line x1="${x + (w / 3) * i}" y1="34" x2="${x + (w / 3) * i}" y2="${34 + h}" stroke="${beamDark}" stroke-width="3" opacity="0.85"/>`;
    for (let i = 1; i < 4; i++) grid += `<line x1="${x}" y1="${34 + (h / 4) * i}" x2="${x + w}" y2="${34 + (h / 4) * i}" stroke="${beamDark}" stroke-width="3" opacity="0.85"/>`;
    return (
      `<rect x="${x}" y="34" width="${w}" height="${h}" fill="${lighten(paper, 0.06)}" stroke="${INK}" stroke-width="3"/>` +
      grid +
      `<rect x="${x}" y="34" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="3"/>`
    );
  };

  return svg(
    SCENE_W,
    H,
    `<g transform="translate(0,160)">` +
      shoji(20, 122, 116) +
      shoji(248, 122, 116) +
      `<rect x="0" y="14" width="${SCENE_W}" height="16" fill="${beam}" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="0" y="17" width="${SCENE_W}" height="3" fill="${lighten(beam, 0.18)}" opacity="0.7"/>` +
      `<line x1="195" y1="30" x2="195" y2="48" stroke="${INK}" stroke-width="2.6"/>` +
      `<rect x="156" y="46" width="78" height="10" rx="5" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
      `<rect x="163" y="54" width="64" height="150" fill="${paper}" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="219" y="54" width="8" height="150" fill="${darken(paper, 0.08)}"/>` +
      `<path d="M191 70 Q198 76 194 90 Q190 102 196 108 L200 106 Q196 98 200 88 Q204 76 197 68 Z" fill="${INK}"/>` +
      `<path d="M186 120 L206 122 L205 127 L187 125 Z" fill="${INK}"/>` +
      `<path d="M193 132 Q190 148 195 162 L200 160 Q196 148 198 134 Z" fill="${INK}"/>` +
      `<rect x="206" y="178" width="15" height="15" fill="${seal}" stroke="${INK}" stroke-width="2"/>` +
      `<rect x="156" y="202" width="78" height="11" rx="5.5" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
      `<circle cx="152" cy="207" r="4" fill="${beamDark}" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="238" cy="207" r="4" fill="${beamDark}" stroke="${INK}" stroke-width="1.8"/>` +
      `<rect x="40" y="170" width="82" height="9" rx="3" fill="${beam}" stroke="${INK}" stroke-width="2.6"/>` +
      `<path d="M62 168 Q60 138 81 136 Q102 138 100 168 Z" fill="${seal}" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
      `<ellipse cx="81" cy="156" rx="12" ry="10" fill="${paper}" stroke="${INK}" stroke-width="2"/>` +
      `<circle cx="76" cy="154" r="2.6" fill="${INK}"/>` +
      `<circle cx="86" cy="154" r="2.6" fill="${INK}"/>` +
      `<path d="M77 162 Q81 165 85 162" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `</g>`
  );
}

function branchArt(wood: string, blossom: string, blossomLight: string): string {
  const H = UPPER_H.branch;
  const bud = darken(blossom, 0.18);

  return svg(
    SCENE_W,
    H,
    `<g transform="translate(0,170)">` +
      `<path d="M-12 26 Q90 34 170 62 Q240 86 305 96 L303 108 Q236 100 164 76 Q88 50 -12 44 Z" fill="${wood}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M-8 32 Q90 40 168 66" stroke="${darken(wood, 0.25)}" stroke-width="2" fill="none" opacity="0.5"/>` +
      `<path d="M120 52 Q150 34 186 30 L187 38 Q154 42 126 58 Z" fill="${wood}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M226 82 Q252 96 262 122 L254 126 Q244 102 220 90 Z" fill="${wood}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<ellipse cx="70" cy="30" rx="46" ry="26" fill="${blossomLight}" opacity="0.55"/>` +
      `<ellipse cx="196" cy="26" rx="40" ry="22" fill="${blossomLight}" opacity="0.55"/>` +
      `<ellipse cx="286" cy="112" rx="34" ry="20" fill="${blossomLight}" opacity="0.5"/>` +
      sakuraFlower(46, 28, 15, blossom, 'f1') +
      sakuraFlower(92, 40, 12, blossomLight, 'f2') +
      sakuraFlower(146, 44, 14, blossom, 'f3') +
      sakuraFlower(196, 24, 13, blossomLight, 'f4') +
      sakuraFlower(238, 66, 12, blossom, 'f5') +
      sakuraFlower(282, 106, 14, blossomLight, 'f6') +
      sakuraFlower(310, 130, 10, blossom, 'f7') +
      `<circle cx="118" cy="34" r="5" fill="${bud}" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="172" cy="66" r="4.4" fill="${bud}" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="258" cy="94" r="4.6" fill="${bud}" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M402 20 Q370 30 348 52 L356 60 Q376 40 402 32 Z" fill="${wood}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<ellipse cx="356" cy="44" rx="26" ry="16" fill="${blossomLight}" opacity="0.5"/>` +
      sakuraFlower(352, 46, 12, blossom, 'f8') +
      sakuraFlower(378, 26, 10, blossomLight, 'f9') +
      `<circle cx="336" cy="62" r="4.4" fill="${bud}" stroke="${INK}" stroke-width="1.8"/>` +
      `<ellipse cx="150" cy="102" rx="6" ry="4" fill="${blossomLight}" opacity="0.8" transform="rotate(24 150 102)"/>` +
      `<ellipse cx="330" cy="70" rx="6" ry="4" fill="${blossom}" opacity="0.7" transform="rotate(-18 330 70)"/>` +
      `<ellipse cx="250" cy="140" rx="5" ry="3.4" fill="${blossomLight}" opacity="0.7" transform="rotate(40 250 140)"/>` +
      `</g>`
  );
}

function skylineArt(building: string, neonA: string, neonB: string, win: string): string {
  const H = UPPER_H.skyline;
  const back = darken(building, 0.3);

  const windows = (bx: number, bw: number, bh: number, cols: number, rows: number) => {
    let s = '';
    const cw = bw / (cols + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = (r * 3 + c * 5 + bx) % 7 < 3;
        s += `<rect x="${(bx + cw * 0.6 + c * cw).toFixed(1)}" y="${H - bh + 14 + r * 24}" width="9" height="12" rx="1.5" fill="${win}" opacity="${lit ? 0.95 : 0.3}"/>`;
      }
    }
    return s;
  };

  const front = (x: number, w: number, h: number, cols: number, rows: number) =>
    `<rect x="${x}" y="${H - h}" width="${w}" height="${h}" fill="${building}" stroke="${INK}" stroke-width="2.6"/>` +
    windows(x, w, h, cols, rows);

  return svg(
    SCENE_W,
    H,
    `<circle cx="322" cy="46" r="42" fill="#F7F2E6" opacity="0.18"/>` +
      `<circle cx="322" cy="46" r="30" fill="#F7F2E6" stroke="${INK}" stroke-width="2.6"/>` +
      `<circle cx="312" cy="40" r="6" fill="${darken('#F7F2E6', 0.12)}" opacity="0.7"/>` +
      `<circle cx="330" cy="56" r="4" fill="${darken('#F7F2E6', 0.12)}" opacity="0.7"/>` +
      `<rect x="30" y="${H - 190}" width="60" height="190" fill="${back}"/>` +
      `<rect x="150" y="${H - 205}" width="54" height="205" fill="${back}"/>` +
      `<rect x="262" y="${H - 178}" width="56" height="178" fill="${back}"/>` +
      `<rect x="196" y="${H - 232}" width="10" height="30" fill="${back}"/>` +
      front(-8, 86, 152, 3, 5) +
      front(70, 70, 118, 2, 4) +
      front(132, 88, 176, 3, 6) +
      front(212, 72, 128, 2, 4) +
      front(276, 84, 158, 3, 5) +
      front(352, 60, 112, 2, 4) +
      `<line x1="176" y1="${H - 176}" x2="176" y2="${H - 206}" stroke="${INK}" stroke-width="2.6"/>` +
      `<circle cx="176" cy="${H - 208}" r="3.4" fill="${neonA}"/>` +
      `<line x1="318" y1="${H - 158}" x2="318" y2="${H - 182}" stroke="${INK}" stroke-width="2.6"/>` +
      `<circle cx="318" cy="${H - 184}" r="3" fill="${neonB}"/>` +
      `<rect x="142" y="${H - 156}" width="30" height="74" rx="5" fill="${darken(building, 0.15)}" stroke="${neonA}" stroke-width="3"/>` +
      `<rect x="142" y="${H - 156}" width="30" height="74" rx="5" fill="none" stroke="${neonA}" stroke-width="7" opacity="0.25"/>` +
      `<path d="M150 ${H - 144} L164 ${H - 144} M157 ${H - 144} L157 ${H - 132} M151 ${H - 124} L163 ${H - 124} L163 ${H - 114} L151 ${H - 114} Z M152 ${H - 104} L162 ${H - 96}" stroke="${neonA}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
      `<rect x="18" y="${H - 132}" width="52" height="40" rx="7" fill="${darken(building, 0.15)}" stroke="${neonB}" stroke-width="3"/>` +
      `<rect x="18" y="${H - 132}" width="52" height="40" rx="7" fill="none" stroke="${neonB}" stroke-width="7" opacity="0.25"/>` +
      `<path d="M28 ${H - 112} a 16 12 0 0 0 32 0 Z" fill="none" stroke="${neonB}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<path d="M30 ${H - 118} Q36 ${H - 124} 42 ${H - 118} M42 ${H - 118} Q48 ${H - 124} 54 ${H - 118}" stroke="${neonB}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
  );
}

function wavecrestArt(deep: string, light: string, foam: string, sun: string): string {
  const H = UPPER_H.wavecrest;
  const deepDark = darken(deep, 0.18);

  const claw = (x: number, y: number, s: number, flip = 1) =>
    `<g transform="translate(${x},${y}) scale(${flip},1)">` +
    `<circle cx="0" cy="0" r="${s}" fill="${foam}" stroke="${INK}" stroke-width="2.4"/>` +
    `<circle cx="${s * 1.5}" cy="${s * 0.5}" r="${s * 0.72}" fill="${foam}" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle cx="${s * 2.7}" cy="${s * 1.15}" r="${s * 0.5}" fill="${foam}" stroke="${INK}" stroke-width="2"/>` +
    `</g>`;

  return svg(
    SCENE_W,
    H,
    `<path d="M170 128 L232 46 Q238 40 244 46 L306 128 Z" fill="#8FA3C8" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/>` +
      `<path d="M216 68 L232 46 Q238 40 244 46 L260 68 Q252 78 238 70 Q226 80 216 68 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<circle cx="316" cy="52" r="30" fill="${sun}" stroke="${INK}" stroke-width="2.8"/>` +
      `<ellipse cx="306" cy="42" rx="8" ry="5" fill="#FFFFFF" opacity="0.3"/>` +
      `<path d="M180 ${H} L180 190 Q250 158 310 176 Q360 190 390 172 L390 ${H} Z" fill="${deep}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M228 186 Q270 170 316 180 M290 196 Q330 184 372 190" stroke="${light}" stroke-width="3.4" fill="none" opacity="0.8" stroke-linecap="round"/>` +
      claw(206, 176, 8) +
      claw(330, 170, 7) +
      `<path d="M-20 ${H} L-20 130 Q30 92 92 80 Q152 70 178 94 Q198 112 182 130 Q206 128 226 154 Q248 184 228 212 Q276 206 316 234 L344 ${H} Z" fill="${deep}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>` +
      `<path d="M182 130 Q160 136 152 122 Q146 108 162 100 Q150 116 166 122 Q178 126 182 130 Z" fill="${light}" opacity="0.9"/>` +
      `<path d="M-20 ${H} L-20 208 Q48 176 108 190 Q176 206 214 246 L222 ${H} Z" fill="${deepDark}" opacity="0.55"/>` +
      `<path d="M2 124 Q58 100 118 102 M-10 162 Q66 132 140 144 M22 200 Q94 178 164 196" stroke="${light}" stroke-width="3.6" fill="none" opacity="0.85" stroke-linecap="round"/>` +
      claw(66, 76, 10) +
      claw(120, 72, 9) +
      claw(166, 88, 9) +
      claw(190, 122, 8) +
      claw(224, 158, 8) +
      claw(238, 202, 7) +
      `<circle cx="112" cy="52" r="4.4" fill="${foam}" stroke="${INK}" stroke-width="1.8"/>` +
      `<circle cx="152" cy="62" r="3.4" fill="${foam}" stroke="${INK}" stroke-width="1.6"/>` +
      `<circle cx="186" cy="92" r="3.8" fill="${foam}" stroke="${INK}" stroke-width="1.6"/>` +
      `<circle cx="94" cy="36" r="2.6" fill="${foam}"/>` +
      `<circle cx="170" cy="44" r="2.4" fill="${foam}"/>`
  );
}

function moonstarsArt(sea: string, land: string, star: string): string {
  const H = UPPER_H.moonstars;

  const dots = [
    [0.12, 36, 2.5], [0.3, 88, 2], [0.62, 70, 2], [0.2, 150, 2], [0.7, 170, 2],
    [0.9, 210, 2.5], [0.06, 210, 2], [0.4, 190, 1.6], [0.55, 250, 2], [0.16, 300, 2],
    [0.84, 300, 1.6], [0.48, 330, 2.2], [0.94, 120, 2], [0.36, 20, 1.6],
  ]
    .map(([f, y, r]) => `<circle cx="${(f as number) * SCENE_W}" cy="${y}" r="${r}" fill="${star}" opacity="0.85"/>`)
    .join('');

  return svg(
    SCENE_W,
    H,
    dots +
      star4(0.46 * SCENE_W, 34, 8, star) +
      star4(0.78 * SCENE_W, 92, 6, star, 0.9) +
      star4(0.1 * SCENE_W, 120, 5, star, 0.8) +
      star4(0.62 * SCENE_W, 220, 6, star, 0.85) +
      star4(0.28 * SCENE_W, 260, 5, star, 0.75) +
      `<line x1="250" y1="236" x2="316" y2="212" stroke="${star}" stroke-width="2.6" stroke-linecap="round" opacity="0.7"/>` +
      `<line x1="262" y1="248" x2="314" y2="228" stroke="${star}" stroke-width="2" stroke-linecap="round" opacity="0.45"/>` +
      star4(320, 210, 7, '#FFFFFF') +
      `<g transform="translate(2,170)">` +
      `<circle cx="78" cy="104" r="54" fill="${sea}" opacity="0.18"/>` +
      `<circle cx="78" cy="104" r="44" fill="${sea}" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M46 84 Q58 70 76 74 Q88 78 84 92 Q76 104 58 100 Q44 96 46 84 Z" fill="${land}" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M92 118 Q108 112 114 124 Q112 136 96 138 Q84 134 92 118 Z" fill="${land}" stroke="${INK}" stroke-width="1.8"/>` +
      `<path d="M60 128 Q70 124 76 130 Q70 138 60 134 Z" fill="${land}" stroke="${INK}" stroke-width="1.6"/>` +
      `<path d="M42 110 Q56 114 70 112 M78 84 Q94 82 104 90" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.7" stroke-linecap="round"/>` +
      `<path d="M78 60 A 44 44 0 0 1 122 104" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.4"/>` +
      `</g>` +
      `<circle cx="330" cy="250" r="14" fill="#F4B740" stroke="${INK}" stroke-width="2.4"/>` +
      `<ellipse cx="330" cy="250" rx="26" ry="8" fill="none" stroke="${lighten('#F4B740', 0.2)}" stroke-width="3" transform="rotate(-16 330 250)"/>` +
      `<ellipse cx="322" cy="245" rx="4" ry="3" fill="#FFFFFF" opacity="0.5"/>`
  );
}

function garlandArt(lantern: string, gold: string, alt: string): string {
  const H = UPPER_H.garland;

  const rope = (y0: number, sag: number) =>
    `<path d="M0 ${y0} Q${SCENE_W / 2} ${y0 + sag} ${SCENE_W} ${y0 - 4}" fill="none" stroke="${INK}" stroke-width="3" opacity="0.7"/>`;

  const onRope = (y0: number, sag: number, f: number) => {
    const x = f * SCENE_W;
    const t = f;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + sag) + t * t * (y0 - 4);
    return { x, y };
  };

  let lanterns = '';
  for (const [f, i] of [0.08, 0.26, 0.44, 0.62, 0.8, 0.95].map((v, k) => [v, k] as const)) {
    const p = onRope(26, 38, f);
    lanterns += miniLantern(p.x, p.y, i % 3 === 0 ? gold : i % 2 ? alt : lantern, gold);
  }
  for (const [f, i] of [0.16, 0.36, 0.56, 0.76, 0.92].map((v, k) => [v, k] as const)) {
    const p = onRope(96, 34, f);
    lanterns += miniLantern(p.x, p.y, i % 2 ? lantern : alt, gold);
  }

  const confetti = [
    [40, 160, gold, 20], [120, 186, alt, -14], [210, 170, lantern, 30],
    [300, 192, gold, -24], [356, 168, alt, 12], [80, 206, lantern, -30],
  ]
    .map(
      ([x, y, c, r]) =>
        `<rect x="${x}" y="${y}" width="8" height="5" rx="1.5" fill="${c}" opacity="0.85" transform="rotate(${r} ${x} ${y})"/>`
    )
    .join('');

  return svg(
    SCENE_W,
    H,
    `<g transform="translate(0,140)">` +
      firework(60, 150, 34, gold, lantern) +
      firework(330, 158, 26, alt, gold) +
      star4(150, 140, 6, gold, 0.8) +
      star4(255, 150, 5, alt, 0.8) +
      rope(26, 38) +
      rope(96, 34) +
      lanterns +
      confetti +
      `</g>`
  );
}

export function upperArt(kind: Exclude<UpperKind, 'lanterns'>, colors: string[]): string {
  const [c0, c1, c2, c3] = colors;
  switch (kind) {
    case 'stalks':
      return stalksArt(c0, c1, c2);
    case 'noren':
      return norenArt(c0, c1, c2);
    case 'scroll':
      return scrollArt(c0, c1, c2);
    case 'branch':
      return branchArt(c0, c1, c2);
    case 'skyline':
      return skylineArt(c0, c1, c2, c3);
    case 'wavecrest':
      return wavecrestArt(c0, c1, c2, c3);
    case 'moonstars':
      return moonstarsArt(c0, c1, c2);
    case 'garland':
      return garlandArt(c0, c1, c2);
  }
}

type FloorColors = BackgroundConfig['floor'];

const RIM = 30;

function floorShell(cfg: FloorColors, pattern: string, rimDetail = ''): string {
  const { w, h } = FLOOR_FRAME;
  return svg(
    w,
    h,
    `<rect x="0" y="0" width="${w}" height="${h}" fill="${cfg.base}"/>` +
      pattern +
      `<path d="M0 ${h} L0 330 Q${w * 0.25} 322 ${w * 0.5} 330 Q${w * 0.75} 338 ${w} 328 L${w} ${h} Z" fill="${cfg.shade}" opacity="0.4"/>` +
      `<rect x="0" y="0" width="${w}" height="${RIM}" fill="${cfg.rim}"/>` +
      rimDetail +
      `<rect x="0" y="${RIM - 3}" width="${w}" height="3" fill="${INK}"/>`
  );
}

export function floorArt(kind: Exclude<FloorKind, 'steamer'>, cfg: FloorColors): string {
  const { w } = FLOOR_FRAME;
  const jitter = (i: number, m: number) => (((i * 47) % 100) / 100) * m;

  switch (kind) {
    case 'grass': {
      let tufts = '';
      for (let i = 0; i < 9; i++) {
        const x = (0.05 + ((i * 23) % 88) / 100) * w;
        const y = RIM + 26 + jitter(i + 2, 220);
        const g = darken(cfg.base, 0.28);
        tufts +=
          `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})">` +
          `<path d="M0 0 Q-4 -12 -8 -16 M2 0 Q2 -14 0 -20 M4 0 Q8 -12 12 -15" stroke="${g}" stroke-width="2.8" fill="none" stroke-linecap="round"/>` +
          `</g>`;
      }
      let flowers = '';
      for (let i = 0; i < 4; i++) {
        const x = (0.14 + ((i * 31) % 74) / 100) * w;
        const y = RIM + 60 + jitter(i + 5, 180);
        flowers +=
          `<g transform="translate(${x.toFixed(0)},${y.toFixed(0)})">` +
          `<circle cx="-4" cy="0" r="3" fill="#FFFFFF" opacity="0.9"/><circle cx="4" cy="0" r="3" fill="#FFFFFF" opacity="0.9"/><circle cx="0" cy="-5" r="3" fill="#FFFFFF" opacity="0.9"/>` +
          `<circle r="2" fill="#F4B740"/>` +
          `</g>`;
      }
      const streaks =
        `<path d="M${0.1 * w} ${RIM + 90} Q${0.3 * w} ${RIM + 84} ${0.46 * w} ${RIM + 92}" stroke="${lighten(cfg.base, 0.14)}" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>` +
        `<path d="M${0.55 * w} ${RIM + 160} Q${0.75 * w} ${RIM + 152} ${0.92 * w} ${RIM + 162}" stroke="${lighten(cfg.base, 0.14)}" stroke-width="5" fill="none" opacity="0.5" stroke-linecap="round"/>`;
      return floorShell(cfg, streaks + tufts + flowers);
    }

    case 'tatami': {
      let weave = '';
      for (let i = 0; i < 20; i++) {
        weave += `<line x1="0" y1="${RIM + 12 + i * 21}" x2="${w}" y2="${RIM + 12 + i * 21}" stroke="${cfg.line}" stroke-width="2" opacity="0.3"/>`;
        weave += `<line x1="0" y1="${RIM + 12 + i * 21 + 7}" x2="${w}" y2="${RIM + 12 + i * 21 + 7}" stroke="${cfg.line}" stroke-width="1.2" opacity="0.18"/>`;
      }
      const heri = [0.33, 0.66]
        .map((f) => {
          const x = f * w - 6;
          let stitches = '';
          for (let i = 0; i < 14; i++) {
            stitches += `<line x1="${x + 2.5}" y1="${RIM + 16 + i * 30}" x2="${x + 9.5}" y2="${RIM + 16 + i * 30}" stroke="${lighten(cfg.rim, 0.35)}" stroke-width="1.6" opacity="0.8"/>`;
          }
          return (
            `<rect x="${x}" y="${RIM}" width="12" height="${FLOOR_FRAME.h - RIM}" fill="${cfg.rim}" stroke="${INK}" stroke-width="2"/>` +
            stitches
          );
        })
        .join('');
      const sheen = `<path d="M${0.1 * w} ${RIM} L${0.3 * w} ${RIM} L${0.14 * w} ${FLOOR_FRAME.h} L${-0.06 * w} ${FLOOR_FRAME.h} Z" fill="#FFFFFF" opacity="0.08"/>`;
      return floorShell(cfg, weave + heri + sheen);
    }

    case 'counter': {
      let planks = '';
      for (let i = 0; i < 7; i++) {
        const y = RIM + 24 + i * 42;
        planks += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${cfg.line}" stroke-width="2.6" opacity="0.6"/>`;
        planks += `<path d="M${20 + jitter(i, 120)} ${y + 14} q 30 -5 60 0 t 60 2" stroke="${cfg.line}" stroke-width="1.6" fill="none" opacity="0.35"/>`;
        planks += `<path d="M${180 + jitter(i + 3, 140)} ${y + 28} q 26 4 52 0" stroke="${cfg.line}" stroke-width="1.4" fill="none" opacity="0.3"/>`;
      }
      const knots =
        `<ellipse cx="${0.24 * w}" cy="${RIM + 118}" rx="7" ry="4.4" fill="none" stroke="${cfg.line}" stroke-width="2" opacity="0.55"/>` +
        `<ellipse cx="${0.24 * w}" cy="${RIM + 118}" rx="2.6" ry="1.6" fill="${cfg.line}" opacity="0.55"/>` +
        `<ellipse cx="${0.72 * w}" cy="${RIM + 220}" rx="8" ry="5" fill="none" stroke="${cfg.line}" stroke-width="2" opacity="0.5"/>` +
        `<ellipse cx="${0.72 * w}" cy="${RIM + 220}" rx="3" ry="1.8" fill="${cfg.line}" opacity="0.5"/>`;
      let rimLines = '';
      for (let i = 0; i < 12; i++) {
        rimLines += `<line x1="${(i / 12) * w + 14}" y1="4" x2="${(i / 12) * w + 14}" y2="${RIM - 6}" stroke="${darken(cfg.rim, 0.16)}" stroke-width="2" opacity="0.5"/>`;
      }
      return floorShell(cfg, planks + knots, rimLines);
    }

    case 'sand': {
      let ripples = '';
      for (let r = 0; r < 6; r++) {
        const y = RIM + 34 + r * 52;
        const off = r % 2 ? 30 : 0;
        for (let i = 0; i < 6; i++) {
          ripples += `<path d="M${off + i * 68} ${y} q 22 10 44 0" stroke="${cfg.shade}" stroke-width="2.6" fill="none" opacity="0.55" stroke-linecap="round"/>`;
        }
      }
      let specks = '';
      for (let i = 0; i < 14; i++) {
        specks += `<circle cx="${(0.04 + ((i * 19) % 92) / 100) * w}" cy="${RIM + 20 + jitter(i + 3, 300)}" r="2" fill="${cfg.shade}" opacity="0.5"/>`;
      }
      const shell =
        `<g transform="translate(${0.2 * w},${RIM + 150})">` +
        `<path d="M-13 6 A 13 13 0 0 1 13 6 L0 6 Z M-13 6 L13 6" fill="#F6E7CE" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M-7 6 L-4 -5 M0 6 L0 -7 M7 6 L4 -5" stroke="${INK}" stroke-width="1.6" opacity="0.6"/>` +
        `</g>`;
      const starfish =
        `<g transform="translate(${0.76 * w},${RIM + 236}) rotate(12)">` +
        `<path d="M0 -13 L4 -4 L14 -3 L6 4 L8 13 L0 8 L-8 13 L-6 4 L-14 -3 L-4 -4 Z" fill="#F0A868" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<circle cx="0" cy="0" r="1.6" fill="${INK}" opacity="0.5"/>` +
        `</g>`;
      return floorShell(cfg, ripples + specks + shell + starfish);
    }

    case 'street': {
      let zebra = '';
      for (let i = 0; i < 7; i++) {
        zebra += `<rect x="${18 + i * 54}" y="${RIM + 12}" width="30" height="44" rx="3" fill="${cfg.line}" opacity="0.75"/>`;
      }
      let dashes = '';
      for (let i = 0; i < 7; i++) {
        dashes += `<rect x="${10 + i * 56}" y="${RIM + 150}" width="30" height="6" rx="3" fill="${cfg.line}" opacity="0.7"/>`;
      }
      const manhole =
        `<g transform="translate(${0.72 * w},${RIM + 230})">` +
        `<ellipse rx="26" ry="15" fill="${darken(cfg.base, 0.2)}" stroke="${INK}" stroke-width="2.6"/>` +
        `<ellipse rx="18" ry="10" fill="none" stroke="${INK}" stroke-width="1.8" opacity="0.6"/>` +
        `<line x1="-10" y1="-3" x2="10" y2="-3" stroke="${INK}" stroke-width="1.6" opacity="0.6"/>` +
        `<line x1="-10" y1="3" x2="10" y2="3" stroke="${INK}" stroke-width="1.6" opacity="0.6"/>` +
        `</g>`;
      const puddle =
        `<g transform="translate(${0.22 * w},${RIM + 260})">` +
        `<ellipse rx="34" ry="12" fill="#FF5C8A" opacity="0.16"/>` +
        `<ellipse rx="34" ry="12" fill="none" stroke="${lighten(cfg.base, 0.25)}" stroke-width="2" opacity="0.5"/>` +
        `<path d="M-14 -2 Q0 -7 14 -2" stroke="#FF5C8A" stroke-width="2.4" fill="none" opacity="0.5" stroke-linecap="round"/>` +
        `</g>`;
      return floorShell(cfg, zebra + dashes + manhole + puddle);
    }

    case 'moon': {
      const crater = (cx: number, cy: number, r: number) =>
        `<g transform="translate(${cx},${cy})">` +
        `<ellipse rx="${r}" ry="${r * 0.55}" fill="${darken(cfg.base, 0.16)}" stroke="${INK}" stroke-width="2.4"/>` +
        `<ellipse cx="${r * 0.08}" cy="${r * 0.1}" rx="${r * 0.66}" ry="${r * 0.34}" fill="${darken(cfg.base, 0.3)}"/>` +
        `<path d="M${-r * 0.7} ${-r * 0.28} Q0 ${-r * 0.62} ${r * 0.7} ${-r * 0.28}" stroke="${lighten(cfg.base, 0.18)}" stroke-width="2.4" fill="none" opacity="0.8"/>` +
        `</g>`;
      const rock = (x: number, y: number, s: number, rot: number) =>
        `<path d="M${x} ${y} l ${s} ${-s * 0.5} l ${s * 0.9} ${s * 0.6} l ${-s * 0.5} ${s * 0.7} l ${-s * 1.1} ${-s * 0.1} Z" fill="${cfg.shade}" stroke="${INK}" stroke-width="2" transform="rotate(${rot} ${x} ${y})"/>`;
      let dust = '';
      for (let i = 0; i < 12; i++) {
        dust += `<circle cx="${(0.05 + ((i * 21) % 90) / 100) * w}" cy="${RIM + 16 + jitter(i + 4, 320)}" r="1.8" fill="${cfg.shade}" opacity="0.5"/>`;
      }
      return floorShell(
        cfg,
        crater(0.16 * w, RIM + 66, 26) +
          crater(0.62 * w, RIM + 116, 18) +
          crater(0.84 * w, RIM + 52, 21) +
          crater(0.38 * w, RIM + 176, 15) +
          crater(0.12 * w, RIM + 260, 19) +
          rock(0.5 * w, RIM + 70, 9, 8) +
          rock(0.78 * w, RIM + 208, 11, -14) +
          rock(0.3 * w, RIM + 118, 7, 20) +
          dust
      );
    }

    case 'deck': {
      let planks = '';
      for (let i = 0; i < 9; i++) {
        const y = RIM + 20 + i * 36;
        planks += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${cfg.line}" stroke-width="2.4" opacity="0.55"/>`;
        planks += `<path d="M${30 + jitter(i, 160)} ${y + 12} q 24 -4 48 0" stroke="${cfg.line}" stroke-width="1.4" fill="none" opacity="0.3"/>`;
      }
      let joints = '';
      for (let i = 0; i < 8; i++) {
        const x = (0.1 + ((i * 27) % 80) / 100) * w;
        const y = RIM + 20 + (i % 4) * 72;
        joints +=
          `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 36}" stroke="${cfg.line}" stroke-width="2.2" opacity="0.55"/>` +
          `<circle cx="${x - 5}" cy="${y + 8}" r="1.8" fill="${cfg.line}" opacity="0.7"/>` +
          `<circle cx="${x + 5}" cy="${y + 28}" r="1.8" fill="${cfg.line}" opacity="0.7"/>`;
      }
      const confetti = [
        [0.3 * w, RIM + 90, '#EE3B30', 24], [0.66 * w, RIM + 60, '#F7C948', -18],
        [0.16 * w, RIM + 190, '#2E6BE6', 40], [0.82 * w, RIM + 150, '#EE3B30', -30],
      ]
        .map(([x, y, c, rot]) => `<rect x="${x}" y="${y}" width="9" height="5.5" rx="1.5" fill="${c}" opacity="0.85" transform="rotate(${rot} ${x} ${y})"/>`)
        .join('');
      return floorShell(cfg, planks + joints + confetti);
    }
  }
}
