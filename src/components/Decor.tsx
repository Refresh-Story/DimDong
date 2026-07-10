import { Image } from 'expo-image';
import React from 'react';
import { SvgXml } from 'react-native-svg';

import { decorDoc, DECOR_FRAME } from '@/art/dimArt';
import { Item } from '@/data/items';

export function DecorView({ item, size = 90 }: { item: Item; size?: number }) {
  const height = (size * DECOR_FRAME.h) / DECOR_FRAME.w;

  if (item.image) {
    return <Image source={{ uri: item.image }} style={{ width: size, height }} contentFit="contain" />;
  }
  if (!item.decor) return null;

  return <SvgXml xml={decorDoc(item.decor, item.color)} width={size} height={height} />;
}

export default DecorView;
