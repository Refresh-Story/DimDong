import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { composeSceneSvg } from '@/art/sceneCompose';
import { sceneGeom } from '@/art/sceneGeom';
import { getBackground } from '@/data/backgrounds';
import { Item } from '@/data/items';
import { Palette, Radius } from '@/theme';

/**
 * Vignette de boutique. Elle rend le VRAI décor, à la taille de la case : l'art étant
 * généré pour sa boîte, la même source sert l'écran de jeu et un carré de 72 px.
 * Avant, la vignette fabriquait un faux carré à partir de deux couleurs, et ne
 * ressemblait donc pas à l'objet vendu.
 */
export function BackgroundThumb({ item, size = 72 }: { item: Item; size?: number }) {
  const cfg = getBackground(item.background);
  const xml = useMemo(() => {
    const g = sceneGeom(size, size);
    return composeSceneSvg(cfg, g, { scope: `t${item.id}`, ambientPhase: null });
  }, [cfg, item.id, size]);

  if (item.image) {
    return (
      <Image
        source={{ uri: item.image }}
        style={{ width: size, height: size, borderRadius: Radius.md }}
        contentFit="cover"
      />
    );
  }

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
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

export default BackgroundThumb;
