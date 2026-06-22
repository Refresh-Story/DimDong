// Avatar de Dim : un petit DIM-SUM (raviole vapeur) en SVG, rendu "soft 3D".
// Pâte plissée sur le dessus, corps dodu, visage mignon. La couleur de la pâte
// vient de l'objet de catégorie "color" équipé (sinon crème par défaut).
// Accessoires empilés par z-index (champ `draw`) ; `image` géré en overlay.
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { DEFAULT_DOUGH, Item, ItemCategory, getItemById } from '@/data/items';

type Props = {
  size?: number;
  equipped: Partial<Record<ItemCategory, string>>;
  catalog: Item[];
};

// Repère de dessin : viewBox 200 x 260 puis mise à l'échelle.
const VB_W = 200;
const VB_H = 260;
const BODY_Z = 8;

export function DimAvatar({ size = 200, equipped, catalog }: Props) {
  const width = size;
  const height = (size * VB_H) / VB_W;

  const items = (Object.keys(equipped) as ItemCategory[])
    .map((cat) => getItemById(catalog, equipped[cat]))
    .filter((i): i is Item => !!i);

  // Couleur de la pâte = objet "color" équipé, sinon crème.
  const colorItem = getItemById(catalog, equipped.color);
  const dough = colorItem?.color ?? DEFAULT_DOUGH;
  const isRainbow = !!colorItem?.rainbow;

  const drawn = items.filter((i) => i.draw && !i.image);
  const imaged = items.filter((i) => i.image);

  const behind = drawn.filter((i) => (i.zIndex ?? 20) < BODY_Z).sort(byZ);
  const front = drawn.filter((i) => (i.zIndex ?? 20) >= BODY_Z).sort(byZ);

  // Overlays image : ceux dont le zIndex passe sous le corps (ex. cape) doivent
  // rester DERRIÈRE Dim — sinon ils le recouvriraient. On les rend avant le SVG.
  const imagedBehind = imaged.filter((i) => (i.zIndex ?? 20) < BODY_Z).sort(byZ);
  const imagedFront = imaged.filter((i) => (i.zIndex ?? 20) >= BODY_Z).sort(byZ);

  return (
    <View style={{ width, height }}>
      {imagedBehind.map((item) => (
        <Image
          key={item.id}
          source={{ uri: item.image! }}
          style={{ position: 'absolute', width, height, zIndex: item.zIndex ?? 20 }}
          contentFit="contain"
        />
      ))}

      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="doughGrad" x1="0" y1="0" x2={isRainbow ? '1' : '0'} y2="1">
            {isRainbow
              ? [
                  <Stop key="0" offset="0" stopColor="#FF9AA2" />,
                  <Stop key="1" offset="0.2" stopColor="#FFB347" />,
                  <Stop key="2" offset="0.4" stopColor="#FFE066" />,
                  <Stop key="3" offset="0.6" stopColor="#9BE08C" />,
                  <Stop key="4" offset="0.8" stopColor="#7FC7FF" />,
                  <Stop key="5" offset="1" stopColor="#C9A0FF" />,
                ]
              : [
                  <Stop key="0" offset="0" stopColor={lighten(dough, 0.2)} />,
                  <Stop key="1" offset="0.55" stopColor={dough} />,
                  <Stop key="2" offset="1" stopColor={darken(dough, 0.24)} />,
                ]}
          </LinearGradient>
          <LinearGradient id="pleatGrad" x1="0" y1="0" x2="0" y2="1">
            {isRainbow
              ? [
                  <Stop key="0" offset="0" stopColor="#FFFFFF" />,
                  <Stop key="1" offset="1" stopColor="#FFE6F2" />,
                ]
              : [
                  <Stop key="0" offset="0" stopColor={lighten(dough, 0.32)} />,
                  <Stop key="1" offset="1" stopColor={dough} />,
                ]}
          </LinearGradient>
          <RadialGradient id="gloss" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="botShade" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor={darken(dough, 0.3)} stopOpacity="0.4" />
            <Stop offset="0.7" stopColor={darken(dough, 0.3)} stopOpacity="0.1" />
            <Stop offset="1" stopColor={darken(dough, 0.3)} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ground" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#2E3A1F" stopOpacity="0.26" />
            <Stop offset="1" stopColor="#2E3A1F" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ombre de contact au sol */}
        <Ellipse cx={100} cy={244} rx={56} ry={11} fill="url(#ground)" />

        {behind.map((item) => (
          <Accessory key={item.id} item={item} />
        ))}

        <BaseBody dough={dough} isRainbow={isRainbow} />

        {front.map((item) => (
          <Accessory key={item.id} item={item} />
        ))}
      </Svg>

      {imagedFront.map((item) => (
        <Image
          key={item.id}
          source={{ uri: item.image! }}
          style={{ position: 'absolute', width, height, zIndex: item.zIndex ?? 20 }}
          contentFit="contain"
        />
      ))}
    </View>
  );
}

function byZ(a: Item, b: Item) {
  return (a.zIndex ?? 20) - (b.zIndex ?? 20);
}

// Corps dodu du dim-sum (base arrondie, légèrement resserrée vers le haut).
const BODY_PATH =
  'M100 70 C150 70 174 106 174 152 C174 202 144 224 100 224 C56 224 26 202 26 152 C26 106 50 70 100 70 Z';

// Position en x des plis de la pâte.
const PLEATS = [50, 75, 100, 125, 150];

function BaseBody({ dough, isRainbow }: { dough: string; isRainbow?: boolean }) {
  const footColor = darken(dough, 0.18);
  return (
    <G>
      {/* pieds */}
      <Ellipse cx={78} cy={226} rx={15} ry={9} fill={footColor} />
      <Ellipse cx={122} cy={226} rx={15} ry={9} fill={footColor} />

      {/* corps */}
      <Path d={BODY_PATH} fill="url(#doughGrad)" />
      {/* ombrage du bas (volume) */}
      <Ellipse cx={100} cy={196} rx={62} ry={32} fill="url(#botShade)" />
      {/* reflet brillant */}
      <Ellipse cx={74} cy={118} rx={32} ry={24} fill="url(#gloss)" />

      {/* plis de pâte sur le dessus */}
      {PLEATS.map((x, i) => (
        <Ellipse
          key={x}
          cx={x}
          cy={64}
          rx={17}
          ry={24}
          fill={isRainbow || i % 2 === 0 ? 'url(#pleatGrad)' : darken(dough, 0.1)}
        />
      ))}
      {/* lignes de pli */}
      {[62, 87, 112, 137].map((x) => (
        <Line key={x} x1={x} y1={48} x2={x} y2={84} stroke={darken(dough, 0.32)} strokeWidth={1.5} opacity={0.35} />
      ))}
      {/* petite brillance sur la pâte */}
      <Ellipse cx={66} cy={52} rx={7} ry={10} fill="#FFFFFF" opacity={0.18} />

      {/* joues */}
      <Ellipse cx={64} cy={152} rx={11} ry={7} fill="#F49EBC" opacity={0.5} />
      <Ellipse cx={136} cy={152} rx={11} ry={7} fill="#F49EBC" opacity={0.5} />
      {/* yeux */}
      <Eye cx={82} />
      <Eye cx={118} />
      {/* sourire */}
      <Path d="M86 162 Q100 176 114 162" stroke="#2B2B2B" strokeWidth={4} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Eye({ cx }: { cx: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={140} rx={8.5} ry={12} fill="#2B2B2B" />
      <Circle cx={cx - 3} cy={135} r={3} fill="#FFFFFF" />
      <Circle cx={cx + 2.5} cy={144} r={1.5} fill="#FFFFFF" opacity={0.7} />
    </G>
  );
}

function darken(hex: string, amount = 0.24): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function lighten(hex: string, amount = 0.3): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return hex;
  const n = parseInt(h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + 255 * amount));
  const g = Math.min(255, Math.round(((n >> 8) & 255) + 255 * amount));
  const b = Math.min(255, Math.round((n & 255) + 255 * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function Vol({ id, color }: { id: string; color: string }) {
  return (
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={lighten(color, 0.28)} />
        <Stop offset="0.55" stopColor={color} />
        <Stop offset="1" stopColor={darken(color, 0.28)} />
      </LinearGradient>
    </Defs>
  );
}

function Accessory({ item }: { item: Item }) {
  const c = item.color;
  const d = darken(c);
  const gid = `g-${item.id}`;

  switch (item.draw) {
    case 'tuft':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Path
            d="M62 50 Q60 14 84 38 Q88 10 100 34 Q112 10 122 40 Q142 16 138 54 Q100 38 62 50 Z"
            fill={`url(#${gid})`}
          />
          <Path d="M86 32 Q90 20 96 34" stroke={lighten(c, 0.35)} strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'cap':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Path d="M52 60 C54 14 146 14 148 60 Z" fill={`url(#${gid})`} />
          <Path d="M94 56 Q150 50 170 64 Q150 68 94 66 Z" fill={d} />
          <Ellipse cx={82} cy={34} rx={20} ry={11} fill="#FFFFFF" opacity={0.18} />
          <Circle cx={100} cy={20} r={5} fill={d} />
        </G>
      );
    case 'beanie':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Path d="M50 62 C52 10 148 10 150 62 Z" fill={`url(#${gid})`} />
          <Rect x={46} y={54} width={108} height={18} rx={9} fill={d} />
          <Ellipse cx={80} cy={32} rx={18} ry={11} fill="#FFFFFF" opacity={0.16} />
          <Circle cx={100} cy={11} r={11} fill="#FFFFFF" />
        </G>
      );
    case 'crown':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Polygon points="60,56 75,22 90,56 100,18 110,56 125,22 140,56" fill={`url(#${gid})`} />
          <Rect x={60} y={52} width={80} height={20} rx={4} fill={`url(#${gid})`} />
          <Rect x={60} y={52} width={80} height={6} rx={3} fill="#FFFFFF" opacity={0.25} />
          <Circle cx={80} cy={62} r={4.5} fill="#E24B4A" />
          <Circle cx={100} cy={62} r={4.5} fill="#3D7BE0" />
          <Circle cx={120} cy={62} r={4.5} fill="#1D9E75" />
        </G>
      );
    case 'glasses':
      return (
        <G>
          <Circle cx={82} cy={140} r={17} stroke={c} strokeWidth={5} fill="#BFE9FF" fillOpacity={0.18} />
          <Circle cx={118} cy={140} r={17} stroke={c} strokeWidth={5} fill="#BFE9FF" fillOpacity={0.18} />
          <Path d="M97 137 Q100 133 103 137" stroke={c} strokeWidth={4} fill="none" />
          <Path d="M65 136 L46 130" stroke={c} strokeWidth={4} strokeLinecap="round" />
          <Path d="M135 136 L154 130" stroke={c} strokeWidth={4} strokeLinecap="round" />
          <Path d="M73 133 L80 129" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        </G>
      );
    case 'sunglasses':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Ellipse cx={82} cy={140} rx={20} ry={15} fill={`url(#${gid})`} />
          <Ellipse cx={118} cy={140} rx={20} ry={15} fill={`url(#${gid})`} />
          <Rect x={98} y={136} width={6} height={5} fill={c} />
          <Path d="M62 135 L44 129" stroke={c} strokeWidth={4} strokeLinecap="round" />
          <Path d="M138 135 L156 129" stroke={c} strokeWidth={4} strokeLinecap="round" />
          <Path d="M72 134 L86 131" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
          <Path d="M108 134 L122 131" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        </G>
      );
    case 'bowtie':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Polygon points="100,192 76,180 76,204" fill={`url(#${gid})`} />
          <Polygon points="100,192 124,180 124,204" fill={`url(#${gid})`} />
          <Rect x={93} y={184} width={14} height={16} rx={4} fill={d} />
        </G>
      );
    case 'scarf':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Path d="M48 194 Q100 214 152 194 Q100 224 48 194 Z" fill={`url(#${gid})`} />
          <Path d="M122 206 L142 206 L139 240 L125 240 Z" fill={d} />
        </G>
      );
    case 'sneakers':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Shoe x={60} gid={gid} dark={d} />
          <Shoe x={104} gid={gid} dark={d} />
        </G>
      );
    case 'cape':
      return (
        <G>
          <Vol id={gid} color={c} />
          <Path d="M58 88 Q100 76 142 88 L156 214 Q100 246 44 214 Z" fill={`url(#${gid})`} opacity={0.97} />
        </G>
      );
    default:
      return null;
  }
}

function Shoe({ x, gid, dark }: { x: number; gid: string; dark: string }) {
  return (
    <G>
      <Path d={`M${x} 216 Q${x - 3} 236 ${x + 36} 236 L${x + 36} 216 Z`} fill={`url(#${gid})`} />
      <Rect x={x - 3} y={232} width={40} height={8} rx={4} fill="#FFFFFF" />
      <Path d={`M${x + 5} 221 L${x + 18} 221`} stroke={dark} strokeWidth={3} strokeLinecap="round" />
    </G>
  );
}

export default DimAvatar;
