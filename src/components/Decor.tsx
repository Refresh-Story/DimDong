// Décorations du salon de dim-sum (bonsaï, cerisier, bambou, lanterne, théière).
// Utilisé dans la scène (Scene), la boutique et l'inventaire.
// Deux modes : `image` (PNG Firebase Storage, mode final) ou `decor` (SVG dessiné, fallback).
import { Image } from 'expo-image';
import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { Item } from '@/data/items';

function lighten(hex: string, a = 0.28) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + 255 * a));
  const g = Math.min(255, Math.round(((n >> 8) & 255) + 255 * a));
  const b = Math.min(255, Math.round((n & 255) + 255 * a));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function darken(hex: string, a = 0.26) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - a)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - a)));
  const b = Math.max(0, Math.round((n & 255) * (1 - a)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function DecorView({ item, size = 90 }: { item: Item; size?: number }) {
  const vbh = 120;
  const height = (size * vbh) / 100;

  // Mode final : image PNG depuis Firebase Storage (alignée sur le même canvas 100×120).
  if (item.image) {
    return (
      <Image
        source={{ uri: item.image }}
        style={{ width: size, height }}
        contentFit="contain"
      />
    );
  }

  const c = item.color;
  const gid = `d-${item.id}`;
  const grad = (
    <Defs>
      <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={lighten(c)} />
        <Stop offset="0.55" stopColor={c} />
        <Stop offset="1" stopColor={darken(c)} />
      </LinearGradient>
    </Defs>
  );

  return (
    <Svg width={size} height={height} viewBox={`0 0 100 ${vbh}`}>
      {grad}
      <Shape item={item} gid={gid} />
    </Svg>
  );
}

function Shape({ item, gid }: { item: Item; gid: string }) {
  const c = item.color;
  const fill = `url(#${gid})`;
  const shadow = <Ellipse cx={50} cy={114} rx={30} ry={6} fill="#2E3A1F" opacity={0.15} />;

  const dk = darken(c);

  switch (item.decor) {
    case 'bonsai':
      return (
        <G>
          {shadow}
          <Path d="M32 96 L68 96 L64 112 L36 112 Z" fill="#C56B3A" />
          <Rect x={29} y={90} width={42} height={8} rx={3} fill="#B5612F" />
          <Path d="M50 96 Q44 80 57 70" stroke="#6B4A2B" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Ellipse cx={40} cy={66} rx={16} ry={10} fill={fill} />
          <Ellipse cx={64} cy={62} rx={16} ry={10} fill={fill} />
          <Ellipse cx={52} cy={52} rx={18} ry={11} fill={fill} />
          <Ellipse cx={46} cy={48} rx={7} ry={4} fill="#FFFFFF" opacity={0.2} />
        </G>
      );
    case 'sakura':
      return (
        <G>
          {shadow}
          <Path d="M47 112 L47 64 Q47 56 54 54 L58 56 L55 112 Z" fill="#7A552E" />
          <Path d="M52 78 Q40 72 34 60" stroke="#7A552E" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Circle cx={34} cy={56} r={18} fill={fill} />
          <Circle cx={66} cy={54} r={18} fill={fill} />
          <Circle cx={50} cy={40} r={22} fill={fill} />
          <Ellipse cx={44} cy={34} rx={9} ry={6} fill="#FFFFFF" opacity={0.25} />
          {[
            [34, 50],
            [60, 44],
            [48, 60],
            [70, 60],
            [40, 66],
          ].map(([fx, fy], i) => (
            <Circle key={i} cx={fx} cy={fy} r={3} fill="#FFF0F5" />
          ))}
        </G>
      );
    case 'bamboo':
      return (
        <G>
          {shadow}
          <Stalk x={42} top={36} h={78} c={c} dk={dk} />
          <Stalk x={60} top={50} h={64} c={lighten(c, 0.1)} dk={dk} />
          <Path d="M52 44 Q70 34 84 40 Q70 46 52 48 Z" fill={c} />
          <Path d="M50 60 Q34 52 22 58 Q36 64 50 64 Z" fill={dk} />
          <Path d="M66 56 Q82 50 92 56 Q80 62 66 60 Z" fill={lighten(c, 0.12)} />
        </G>
      );
    case 'lantern':
      return (
        <G>
          {shadow}
          <Rect x={48} y={108} width={4} height={6} fill="#7A552E" />
          <Rect x={38} y={46} width={24} height={7} rx={3} fill="#F4C430" />
          <Ellipse cx={50} cy={78} rx={26} ry={25} fill={fill} />
          <Path d="M50 53 L50 103" stroke={dk} strokeWidth={1.5} opacity={0.4} />
          <Path d="M36 60 Q34 78 36 96" stroke={dk} strokeWidth={1.5} opacity={0.4} fill="none" />
          <Path d="M64 60 Q66 78 64 96" stroke={dk} strokeWidth={1.5} opacity={0.4} fill="none" />
          <Ellipse cx={42} cy={68} rx={6} ry={9} fill="#FFFFFF" opacity={0.2} />
          <Rect x={38} y={101} width={24} height={6} rx={3} fill="#F4C430" />
          <Rect x={47} y={107} width={6} height={10} rx={2} fill="#F4C430" />
        </G>
      );
    case 'teapot':
      return (
        <G>
          {shadow}
          <Path d="M24 82 Q8 78 11 66 Q18 74 30 78 Z" fill={fill} />
          <Path d="M76 74 Q94 72 90 94 Q86 98 80 94" stroke={c} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Ellipse cx={50} cy={86} rx={30} ry={24} fill={fill} />
          <Ellipse cx={50} cy={88} rx={30} ry={14} fill={dk} opacity={0.25} />
          <Ellipse cx={50} cy={64} rx={20} ry={8} fill={lighten(c, 0.1)} />
          <Circle cx={50} cy={58} r={5} fill={dk} />
          <Path d="M36 80 Q50 86 64 80" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.5} fill="none" />
        </G>
      );
    default:
      return null;
  }
}

function Stalk({ x, top, h, c, dk }: { x: number; top: number; h: number; c: string; dk: string }) {
  const segs = Math.floor(h / 16);
  return (
    <G>
      <Rect x={x} y={top} width={11} height={h} rx={5} fill={c} />
      {Array.from({ length: segs }).map((_, i) => (
        <Rect key={i} x={x} y={top + 14 + i * 16} width={11} height={2.5} fill={dk} opacity={0.5} />
      ))}
    </G>
  );
}

export default DecorView;
