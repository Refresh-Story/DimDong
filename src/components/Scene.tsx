import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { DecorView } from '@/components/Decor';
import { Ambient } from '@/components/scene/Ambient';
import { Floor } from '@/components/scene/Floor';
import { Upper } from '@/components/scene/Upper';
import { SpeedLines } from '@/components/ui';
import { FLOOR_RATIO, getBackground } from '@/data/backgrounds';
import { Item } from '@/data/items';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

function Halftone({ opacity = 0.5, dot = Palette.screentoneMid }: { opacity?: number; dot?: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="halftone" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <Circle cx="3" cy="3" r="2" fill={dot} opacity={opacity} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#halftone)" />
    </Svg>
  );
}

export function Scene({
  children,
  decor = [],
  background,
}: {
  children?: React.ReactNode;
  decor?: Item[];
  background?: string;
}) {
  const cfg = getBackground(background);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.paper }]} />

      <Halftone opacity={cfg.halftone.opacity} dot={cfg.halftone.dot} />

      <View style={styles.speed} pointerEvents="none">
        <SpeedLines size={SCREEN_W * 1.3} color={cfg.speed.color} count={34} innerRatio={0.34} opacity={cfg.speed.opacity} />
      </View>

      <Upper upper={cfg.upper} />

      <Ambient ambient={cfg.ambient} />

      <View style={styles.floor}>
        <Floor floor={cfg.floor} />
      </View>

      {/* Objets posés sur la ligne d'horizon, au-dessus de la zone UI (émotions, boutons). */}
      <View style={styles.decorLayer} pointerEvents="none">
        {decor.map((item) => {
          const w = item.w ?? 90;
          return (
            <View
              key={item.id}
              style={{ position: 'absolute', bottom: -22, left: (item.x ?? 0.5) * SCREEN_W - w / 2 }}>
              <DecorView item={item} size={w} />
            </View>
          );
        })}
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  speed: {
    position: 'absolute',
    top: -SCREEN_W * 0.2,
    alignSelf: 'center',
    left: SCREEN_W * 0.5 - SCREEN_W * 0.65,
  },

  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${FLOOR_RATIO * 100}%`,
    overflow: 'hidden',
    borderTopWidth: 3,
    borderColor: Palette.outline,
  },

  decorLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: `${FLOOR_RATIO * 100}%`,
    height: 0,
  },
});
