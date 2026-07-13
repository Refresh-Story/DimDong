
export const DRAW_FRAME = { w: 200, h: 260 };
export const DECOR_FRAME = { w: 100, h: 120 };

export type Emotion = 'joy' | 'sad' | 'angry' | 'serene' | 'scared';
export const DEFAULT_EMOTION: Emotion = 'joy';

const INK = '#16161D';

export const BODY_PATH =
  'M100 72 C150 72 176 108 176 154 C176 206 146 228 100 228 C54 228 24 206 24 154 C24 108 50 72 100 72 Z';

export function darken(hex: string, a = 0.24): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - a)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - a)));
  const b = Math.max(0, Math.round((n & 255) * (1 - a)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
export function lighten(hex: string, a = 0.3): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + 255 * a));
  const g = Math.min(255, Math.round(((n >> 8) & 255) + 255 * a));
  const b = Math.min(255, Math.round((n & 255) + 255 * a));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function svg(w: number, h: number, defs: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>`
  );
}

function sparkle(cx: number, cy: number, s: number, fill = '#FFE066'): string {
  const d = `M${cx} ${cy - s} C${cx + s * 0.12} ${cy - s * 0.28} ${cx + s * 0.28} ${cy - s * 0.12} ${cx + s} ${cy} C${cx + s * 0.28} ${cy + s * 0.12} ${cx + s * 0.12} ${cy + s * 0.28} ${cx} ${cy + s} C${cx - s * 0.12} ${cy + s * 0.28} ${cx - s * 0.28} ${cy + s * 0.12} ${cx - s} ${cy} C${cx - s * 0.28} ${cy - s * 0.12} ${cx - s * 0.12} ${cy - s * 0.28} ${cx} ${cy - s} Z`;
  return `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
}

const eye = (cx: number) =>
  `<ellipse cx="${cx}" cy="150" rx="13" ry="17" fill="${INK}"/>` +
  `<circle cx="${cx - 4}" cy="143" r="5" fill="#FFFFFF"/>` +
  `<circle cx="${cx + 4}" cy="157" r="2.4" fill="#FFFFFF" opacity="0.85"/>`;

const cheeks = (opacity = 0.85, fill = '#F08AA8') =>
  `<ellipse cx="52" cy="168" rx="12" ry="7" fill="${fill}" opacity="${opacity}"/>` +
  `<ellipse cx="148" cy="168" rx="12" ry="7" fill="${fill}" opacity="${opacity}"/>`;

// Visage selon l'émotion. Yeux centrés en cx=76/124 cy=150, bouche vers y 176-192 ;
// les sourcils doivent rester sous y≈114 pour ne pas toucher la couronne.
function face(emotion: Emotion): string {
  switch (emotion) {
    case 'sad':
      return (
        cheeks(0.5) +
        `<g stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round">` +
        `<path d="M63 131 Q73 124 88 130"/>` +
        `<path d="M137 131 Q127 124 112 130"/>` +
        `</g>` +
        `<ellipse cx="76" cy="152" rx="13" ry="15" fill="${INK}"/>` +
        `<circle cx="72" cy="146" r="4" fill="#FFFFFF"/>` +
        `<ellipse cx="124" cy="152" rx="13" ry="15" fill="${INK}"/>` +
        `<circle cx="120" cy="146" r="4" fill="#FFFFFF"/>` +
        `<path d="M67 172 C63 179 63 184 67 186 C71 184 71 179 67 172 Z" fill="#8FD3FF" stroke="${INK}" stroke-width="2.5"/>` +
        `<path d="M88 190 Q100 178 112 190" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
      );
    case 'angry':
      return (
        cheeks(0.85, '#E8657F') +
        `<g stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round">` +
        `<path d="M60 129 L90 141"/>` +
        `<path d="M140 129 L110 141"/>` +
        `</g>` +
        `<ellipse cx="76" cy="153" rx="12" ry="12" fill="${INK}"/>` +
        `<circle cx="73" cy="148" r="3" fill="#FFFFFF"/>` +
        `<ellipse cx="124" cy="153" rx="12" ry="12" fill="${INK}"/>` +
        `<circle cx="121" cy="148" r="3" fill="#FFFFFF"/>` +
        `<g stroke="#E5322B" stroke-width="3.5" fill="none" stroke-linecap="round">` +
        `<path d="M146 106 Q150 112 146 118"/>` +
        `<path d="M158 106 Q154 112 158 118"/>` +
        `<path d="M143 112 L149 112"/>` +
        `<path d="M155 112 L161 112"/>` +
        `</g>` +
        `<path d="M86 190 Q100 179 114 190" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`
      );
    case 'serene':
      return (
        cheeks() +
        `<g stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round">` +
        `<path d="M64 149 Q76 157 88 149"/>` +
        `<path d="M112 149 Q124 157 136 149"/>` +
        `</g>` +
        `<path d="M92 181 Q100 187 108 181" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
      );
    case 'scared':
      return (
        cheeks(0.35) +
        `<g stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round">` +
        `<path d="M62 121 Q76 114 90 121"/>` +
        `<path d="M110 121 Q124 114 138 121"/>` +
        `</g>` +
        `<circle cx="76" cy="150" r="14" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>` +
        `<circle cx="76" cy="152" r="4.5" fill="${INK}"/>` +
        `<circle cx="124" cy="150" r="14" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>` +
        `<circle cx="124" cy="152" r="4.5" fill="${INK}"/>` +
        `<path d="M154 116 C150 124 150 129 154 131 C158 129 158 124 154 116 Z" fill="#8FD3FF" stroke="${INK}" stroke-width="2.5"/>` +
        `<ellipse cx="100" cy="186" rx="8" ry="10" fill="${INK}"/>`
      );
    case 'joy':
    default:
      return (
        cheeks() +
        eye(76) +
        eye(124) +
        `<path d="M88 176 Q100 192 112 176 Q100 184 88 176 Z" fill="${INK}"/>` +
        `<path d="M96 182 Q100 187 105 182 Z" fill="#F08AA8"/>`
      );
  }
}

export function bodyInner(
  dough: string,
  opts: { rainbow?: boolean; id?: string; emotion?: Emotion } = {}
): string {
  const id = opts.id ?? 'b';
  const clip = `cb_${id}`;
  const rb = `rb_${id}`;
  const rainbow = !!opts.rainbow;

  const bodyFill = rainbow ? `url(#${rb})` : dough;
  const moundFill = bodyFill; // monticule = même remplissage que le corps (dégradé inclus)
  const foldColor = darken(rainbow ? '#DDDDDD' : dough, 0.26);
  const knotFill = rainbow ? '#FFFFFF' : lighten(dough, 0.08);

  const defs =
    `<clipPath id="${clip}"><path d="${BODY_PATH}"/></clipPath>` +
    (rainbow
      ? `<linearGradient id="${rb}" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="#FF9AA2"/><stop offset="0.25" stop-color="#FFCB69"/>` +
        `<stop offset="0.5" stop-color="#9BE08C"/><stop offset="0.75" stop-color="#7FC7FF"/>` +
        `<stop offset="1" stop-color="#C9A0FF"/></linearGradient>`
      : '');

  const crown =
    `<g transform="translate(100,80) scale(0.6) translate(-100,-80)">` +
    `<path d="M70 82 Q68 54 100 48 Q132 54 130 82" fill="${moundFill}" stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<g stroke="${foldColor}" stroke-width="2.6" fill="none" opacity="0.6" stroke-linecap="round">` +
    `<path d="M100 64 Q78 80 74 102"/>` +
    `<path d="M100 64 Q90 86 88 106"/>` +
    `<path d="M100 64 L100 108"/>` +
    `<path d="M100 64 Q110 86 112 106"/>` +
    `<path d="M100 64 Q122 80 126 102"/>` +
    `</g>` +
    `<path d="M100 44 Q113 47 109 60 Q100 55 95 63 Q90 49 100 44 Z" fill="${knotFill}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M99 52 Q104 55 100 60" stroke="${INK}" stroke-width="2" fill="none" opacity="0.55" stroke-linecap="round"/>` +
    `</g>`;

  const body =
    `<ellipse cx="78" cy="232" rx="16" ry="10" fill="${bodyFill}" stroke="${INK}" stroke-width="5"/>` +
    `<ellipse cx="122" cy="232" rx="16" ry="10" fill="${bodyFill}" stroke="${INK}" stroke-width="5"/>` +
    `<path d="${BODY_PATH}" fill="${bodyFill}"/>` +
    `<g clip-path="url(#${clip})">` +
    `<ellipse cx="64" cy="120" rx="15" ry="21" fill="#FFFFFF" opacity="0.4"/>` +
    `</g>` +
    `<path d="${BODY_PATH}" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    crown +
    face(opts.emotion ?? DEFAULT_EMOTION) +
    (rainbow ? sparkle(168, 60, 11) + sparkle(150, 96, 7, '#FFFFFF') + sparkle(40, 150, 8, '#FFB3DE') : '');

  return svg(DRAW_FRAME.w, DRAW_FRAME.h, defs, body);
}

export function bodyDoc(
  dough: string,
  opts: { rainbow?: boolean; id?: string; emotion?: Emotion } = {}
): string {
  return bodyInner(dough, opts);
}

export function accessoryInner(draw: string, c: string): string {
  const d = darken(c, 0.2);
  const hi = '<ellipse cx="80" cy="34" rx="18" ry="9" fill="#FFFFFF" opacity="0.18"/>';
  switch (draw) {
    case 'cap':
      return (
        `<g transform="translate(0,20)">` +
        `<path d="M92 60 Q158 54 176 70 Q156 76 92 68 Z" fill="${d}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M48 64 C50 16 152 16 154 64 Z" fill="${c}"/>` +
        hi +
        `<path d="M48 64 C50 16 152 16 154 64 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
        `<circle cx="101" cy="18" r="5" fill="${d}" stroke="${INK}" stroke-width="3"/>` +
        `</g>`
      );
    case 'beanie':
      return (
        `<g transform="translate(0,20)">` +
        `<path d="M48 66 C50 14 152 14 154 66 Z" fill="${c}"/>` +
        hi +
        `<path d="M48 66 C50 14 152 14 154 66 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
        `<rect x="44" y="58" width="112" height="20" rx="10" fill="${d}" stroke="${INK}" stroke-width="4"/>` +
        `<circle cx="101" cy="12" r="12" fill="${lighten(c, 0.32)}" stroke="${INK}" stroke-width="4"/>` +
        `</g>`
      );
    case 'crown':
      return (
        `<g transform="translate(0,20)">` +
        `<polygon points="58,50 76,16 94,48 100,12 106,48 124,16 142,50" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<rect x="56" y="44" width="88" height="18" rx="4" fill="${c}" stroke="${INK}" stroke-width="4"/>` +
        `<circle cx="78" cy="53" r="4" fill="#EE3B30" stroke="${INK}" stroke-width="2"/>` +
        `<circle cx="100" cy="53" r="4" fill="#2E6BE6" stroke="${INK}" stroke-width="2"/>` +
        `<circle cx="122" cy="53" r="4" fill="#1FA37A" stroke="${INK}" stroke-width="2"/>` +
        `</g>`
      );
    case 'glasses':
      return (
        `<circle cx="76" cy="150" r="17" fill="#BFE9FF" fill-opacity="0.25"/>` +
        `<circle cx="124" cy="150" r="17" fill="#BFE9FF" fill-opacity="0.25"/>` +
        `<path d="M93 150 Q100 145 107 150" stroke="${INK}" stroke-width="4" fill="none"/>` +
        `<path d="M59 146 L42 140" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M141 146 L158 140" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
        `<circle cx="76" cy="150" r="17" fill="none" stroke="${INK}" stroke-width="5"/>` +
        `<circle cx="124" cy="150" r="17" fill="none" stroke="${INK}" stroke-width="5"/>` +
        `<path d="M68 143 L74 139" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`
      );
    case 'sunglasses':
      return (
        `<ellipse cx="76" cy="150" rx="20" ry="15" fill="${c}"/>` +
        `<ellipse cx="124" cy="150" rx="20" ry="15" fill="${c}"/>` +
        `<rect x="96" y="146" width="8" height="6" rx="2" fill="${c}"/>` +
        `<ellipse cx="76" cy="150" rx="20" ry="15" fill="none" stroke="${INK}" stroke-width="4"/>` +
        `<ellipse cx="124" cy="150" rx="20" ry="15" fill="none" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M58 144 L42 138" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M142 144 L158 138" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M66 144 L80 140" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>` +
        `<path d="M114 144 L128 140" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`
      );
    case 'bowtie':
      return (
        `<g transform="translate(0,15)">` +
        `<path d="M100 192 C82 178 68 181 68 192 C68 203 82 206 100 192 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M100 192 C118 178 132 181 132 192 C132 203 118 206 100 192 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M82 187 Q86 192 82 197" stroke="${d}" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>` +
        `<path d="M118 187 Q114 192 118 197" stroke="${d}" stroke-width="2.5" fill="none" opacity="0.6" stroke-linecap="round"/>` +
        `<rect x="92" y="184" width="16" height="17" rx="5" fill="${d}" stroke="${INK}" stroke-width="4"/>` +
        `</g>`
      );
    case 'scarf':
      return (
        `<g transform="translate(0,17)">` +
        `<path d="M44 190 Q100 210 156 190 Q150 210 100 214 Q50 210 44 190 Z" fill="${c}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M118 206 Q140 206 142 214 L138 244 Q126 248 120 244 L118 210 Z" fill="${d}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
        `<path d="M122 216 L138 216 M122 224 L137 224 M123 232 L136 232" stroke="${INK}" stroke-width="1.6" opacity="0.4" stroke-linecap="round"/>` +
        `<path d="M60 196 Q100 210 140 196" stroke="${lighten(c, 0.16)}" stroke-width="2.5" fill="none" opacity="0.55"/>` +
        `</g>`
      );
    case 'sneakers': {
      const TY = 217;
      const shoe = (fc: number) =>
        `<rect x="${fc - 23}" y="${TY + 17}" width="46" height="10" rx="5" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M${fc - 21} ${TY + 19} Q${fc - 23} ${TY + 3} ${fc - 3} ${TY + 4} Q${fc + 8} ${TY + 5} ${fc + 11} ${TY + 12} Q${fc + 13} ${TY + 18} ${fc + 23} ${TY + 19} Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
        `<path d="M${fc + 10} ${TY + 14} Q${fc + 13} ${TY + 19} ${fc + 23} ${TY + 19} L${fc + 23} ${TY + 14} Q${fc + 16} ${TY + 13} ${fc + 10} ${TY + 14} Z" fill="#FFFFFF" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M${fc - 14} ${TY + 8} L${fc - 2} ${TY + 7}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M${fc - 14} ${TY + 13} L${fc - 2} ${TY + 12}" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
      return `<g transform="translate(156,0) scale(-1,1)">${shoe(78)}</g>` + shoe(122);
    }
    case 'cape':
      return (
        `<path d="M50 86 Q100 72 150 86 L182 234 Q150 224 138 244 Q120 224 100 244 Q80 224 62 244 Q50 224 18 234 Z" fill="${c}"/>` +
        `<path d="M100 80 L100 240" stroke="${d}" stroke-width="3" opacity="0.35"/>` +
        `<path d="M50 86 Q100 72 150 86 L182 234 Q150 224 138 244 Q120 224 100 244 Q80 224 62 244 Q50 224 18 234 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M58 84 Q100 92 142 84 Q138 76 100 75 Q62 76 58 84 Z" fill="${d}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
      );
    case 'katanas': {
      const blade = '#DCE3EC';
      const guard = '#C8A23E';
      const kat =
        `<rect x="92" y="26" width="16" height="10" rx="4" fill="${d}" stroke="${INK}" stroke-width="3.5"/>` +
        `<rect x="93" y="32" width="14" height="46" rx="6" fill="${c}" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M94 41 L106 51 M106 41 L94 51 M94 56 L106 66 M106 56 L94 66" stroke="${d}" stroke-width="2.4" opacity="0.8"/>` +
        `<ellipse cx="100" cy="82" rx="14" ry="7" fill="${guard}" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M95 88 L105 88 L104 232 L97 252 L95 238 Z" fill="${blade}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
        `<path d="M99 94 L99 232" stroke="#FFFFFF" stroke-width="2.4" opacity="0.6"/>`;
      return (
        `<g transform="rotate(32 100 150)">${kat}</g>` +
        `<g transform="rotate(-32 100 150)">${kat}</g>`
      );
    }
    case 'tuft':
      return (
        `<g transform="translate(0,30)">` +
        `<path d="M60 52 Q58 12 84 36 Q88 8 100 32 Q112 8 122 38 Q142 14 140 56 Q100 40 60 52 Z" fill="${c}"/>` +
        `<path d="M86 32 Q92 22 98 34" stroke="${lighten(c, 0.35)}" stroke-width="3" stroke-linecap="round" fill="none"/>` +
        `<path d="M60 52 Q58 12 84 36 Q88 8 100 32 Q112 8 122 38 Q142 14 140 56 Q100 40 60 52 Z" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
        `</g>`
      );
    default:
      return '';
  }
}

export function accessoryDoc(draw: string, color: string): string {
  return svg(DRAW_FRAME.w, DRAW_FRAME.h, '', accessoryInner(draw, color));
}

export function kimonoInner(jacket: string, belt: string, id = 'k'): string {
  const clip = `kc_${id}`;
  const under = darken(jacket, 0.12); // pan du dessous, un ton plus foncé
  const beltShade = darken(belt, 0.25);
  const defs = `<clipPath id="${clip}"><path d="${BODY_PATH}"/></clipPath>`;
  const body =
    `<g clip-path="url(#${clip})">` +
    `<path d="M182 186 L140 186 L100 201 L100 250 L182 250 Z" fill="${under}"/>` +
    `<path d="M18 186 L60 186 L100 201 L114 250 L18 250 Z" fill="${jacket}"/>` +
    `<path d="M140 186 L100 201 L110 201 L130 186 Z" fill="${under}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M60 186 L100 201 L90 201 L70 186 Z" fill="${jacket}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M18 186 L60 186 L100 201 L140 186 L182 186" stroke="${INK}" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<path d="M100 218 L114 250" stroke="${INK}" stroke-width="3" fill="none" opacity="0.4"/>` +
    `<rect x="12" y="200" width="176" height="18" fill="${belt}" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M14 209 L186 209" stroke="${beltShade}" stroke-width="2" opacity="0.5"/>` +
    `<path d="M14 214 L186 214" stroke="${beltShade}" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>` +
    `<path d="M92 213 Q78 228 62 237 L70 248 Q88 236 102 221 Z" fill="${belt}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="M83 226 Q78 231 72 236" stroke="${beltShade}" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>` +
    `<path d="M108 213 Q122 228 138 237 L130 248 Q112 236 98 221 Z" fill="${belt}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="M117 226 Q122 231 128 236" stroke="${beltShade}" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>` +
    `<path d="M89 197 Q100 191 111 197 Q119 205 113 216 Q100 223 87 216 Q81 205 89 197 Z" fill="${belt}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M96 200 Q94 207 97 214 M104 200 Q106 207 103 214" stroke="${beltShade}" stroke-width="2.2" fill="none" opacity="0.7" stroke-linecap="round"/>` +
    `<ellipse cx="95" cy="201" rx="5" ry="3" fill="#FFFFFF" opacity="0.25"/>` +
    `</g>`;
  return svg(DRAW_FRAME.w, DRAW_FRAME.h, defs, body);
}

export function kimonoDoc(jacket: string, belt: string, id?: string): string {
  return kimonoInner(jacket, belt, id);
}

export function decorInner(kind: string, c: string): string {
  const d = darken(c, 0.24);
  const shadow = '<ellipse cx="50" cy="114" rx="30" ry="6" fill="#16161D" opacity="0.12"/>';
  switch (kind) {
    case 'bonsai':
      return (
        shadow +
        `<path d="M32 96 L68 96 L64 112 L36 112 Z" fill="#C56B3A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
        `<rect x="29" y="88" width="42" height="10" rx="3" fill="#B5612F" stroke="${INK}" stroke-width="3"/>` +
        `<path d="M50 96 Q44 80 57 70" stroke="#6B4A2B" stroke-width="6" stroke-linecap="round" fill="none"/>` +
        `<ellipse cx="40" cy="64" rx="17" ry="11" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
        `<ellipse cx="64" cy="60" rx="17" ry="11" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
        `<ellipse cx="52" cy="48" rx="19" ry="12" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
        `<ellipse cx="46" cy="44" rx="7" ry="4" fill="#FFFFFF" opacity="0.25"/>`
      );
    case 'sakura':
      return (
        shadow +
        `<path d="M46 112 L46 62 Q46 54 54 52 L59 54 L55 112 Z" fill="#7A552E" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
        `<circle cx="34" cy="56" r="18" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="66" cy="54" r="18" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
        `<circle cx="50" cy="38" r="22" fill="${c}" stroke="${INK}" stroke-width="3"/>` +
        `<ellipse cx="44" cy="32" rx="9" ry="6" fill="#FFFFFF" opacity="0.3"/>` +
        [
          [34, 50],
          [60, 44],
          [48, 58],
          [66, 58],
        ]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#FFF0F5" stroke="${INK}" stroke-width="1.5"/>`)
          .join('')
      );
    case 'bamboo': {
      const stalk = (x: number, top: number, h: number, col: string) => {
        const segs = Math.floor(h / 16);
        let s = `<rect x="${x}" y="${top}" width="12" height="${h}" rx="5" fill="${col}" stroke="${INK}" stroke-width="3"/>`;
        for (let i = 0; i < segs; i++) {
          s += `<path d="M${x} ${top + 14 + i * 16} L${x + 12} ${top + 14 + i * 16}" stroke="${INK}" stroke-width="2" opacity="0.6"/>`;
        }
        return s;
      };
      return (
        shadow +
        stalk(40, 36, 78, c) +
        stalk(58, 50, 64, lighten(c, 0.12)) +
        `<path d="M52 44 Q72 32 86 40 Q70 48 52 48 Z" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
        `<path d="M48 60 Q30 50 18 58 Q34 66 50 64 Z" fill="${d}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`
      );
    }
    case 'lantern':
      return (
        shadow +
        `<rect x="48" y="108" width="4" height="6" fill="#7A552E"/>` +
        `<rect x="36" y="44" width="28" height="9" rx="3" fill="#F4C430" stroke="${INK}" stroke-width="3"/>` +
        `<ellipse cx="50" cy="78" rx="27" ry="26" fill="${c}" stroke="${INK}" stroke-width="3.5"/>` +
        `<path d="M36 60 Q33 78 36 96" stroke="${INK}" stroke-width="2" opacity="0.5" fill="none"/>` +
        `<path d="M64 60 Q67 78 64 96" stroke="${INK}" stroke-width="2" opacity="0.5" fill="none"/>` +
        `<ellipse cx="41" cy="68" rx="6" ry="9" fill="#FFFFFF" opacity="0.25"/>` +
        `<rect x="36" y="101" width="28" height="8" rx="3" fill="#F4C430" stroke="${INK}" stroke-width="3"/>` +
        `<rect x="46" y="107" width="8" height="11" rx="2" fill="#F4C430" stroke="${INK}" stroke-width="2.5"/>`
      );
    default:
      return '';
  }
}

export function decorDoc(kind: string, color: string): string {
  return svg(DECOR_FRAME.w, DECOR_FRAME.h, '', decorInner(kind, color));
}

export const BRUSH_FRAME = { w: 120, h: 64 };

// Brosse à dents de l'écran de brossage : tête à gauche (poils vers le haut,
// côté bouche), manche vers la droite, inclinaison de base incrustée.
export function toothbrushDoc(handleColor = '#FF4757'): string {
  const neck = darken(handleColor, 0.2);
  const head = lighten(handleColor, 0.3);
  const body =
    `<g transform="rotate(-18 30 24)">` +
    `<rect x="46" y="30" width="66" height="14" rx="7" fill="${handleColor}" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M56 34 L100 34" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>` +
    `<path d="M40 32 L52 30 L52 44 L40 42 Z" fill="${neck}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<rect x="10" y="30" width="36" height="14" rx="7" fill="${head}" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="13" y="18" width="30" height="13" rx="4" fill="#FFFFFF" stroke="${INK}" stroke-width="3.5"/>` +
    `<path d="M19 21 L19 28 M25 21 L25 28 M31 21 L31 28 M37 21 L37 28" stroke="${INK}" stroke-width="2" opacity="0.35" stroke-linecap="round"/>` +
    `<circle cx="12" cy="16" r="6.5" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="22" cy="11" r="5" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="33" cy="14" r="4.5" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5"/>` +
    sparkle(46, 12, 5, '#BDEBFF') +
    `</g>`;
  return svg(BRUSH_FRAME.w, BRUSH_FRAME.h, '', body);
}
