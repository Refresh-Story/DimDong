// Vignette d'un décor d'arrière-plan (boutique / inventaire) : mini-carte statique
// composée depuis la BackgroundConfig (ciel + pastille d'accent + bande de sol).
// Zéro animation, zéro SVG → coût quasi nul dans une grille.
// Deux modes, comme DecorView : `image` (PNG Firebase Storage) ou composition locale.
import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import { getBackground } from '@/data/backgrounds';
import { Item } from '@/data/items';
import { Palette, Radius } from '@/theme';

export function BackgroundThumb({ item, size = 72 }: { item: Item; size?: number }) {
  if (item.image) {
    return (
      <Image
        source={{ uri: item.image }}
        style={{ width: size, height: size, borderRadius: Radius.md }}
        contentFit="cover"
      />
    );
  }

  const cfg = getBackground(item.background);
  const accent = cfg.upper.colors[1] ?? cfg.upper.colors[0] ?? item.color;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.md,
        borderWidth: 2.5,
        borderColor: Palette.outline,
        overflow: 'hidden',
        backgroundColor: cfg.paper,
      }}>
      {/* pastille d'accent (soleil / lune / lanterne) */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.14,
          right: size * 0.14,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          backgroundColor: accent,
          borderWidth: 2,
          borderColor: Palette.outline,
        }}
      />
      {/* sol : rebord + aplat principal */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: size * 0.4, borderTopWidth: 2.5, borderColor: Palette.outline, backgroundColor: cfg.floor.base }}>
        <View style={{ height: size * 0.12, backgroundColor: cfg.floor.rim, borderBottomWidth: 2, borderColor: Palette.outline }} />
      </View>
    </View>
  );
}

export default BackgroundThumb;
