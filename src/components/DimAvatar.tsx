import { Image } from 'expo-image';
import React, { useId, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { accessoryDoc, bodyDoc, kimonoDoc, DEFAULT_EMOTION, DRAW_FRAME, Emotion } from '@/art/dimArt';
import { DEFAULT_DOUGH, Item, ItemCategory, getItemById } from '@/data/items';
import { beltForLevel } from '@/game/rules';

type Props = {
  size?: number;
  equipped: Partial<Record<ItemCategory, string>>;
  catalog: Item[];
  level?: number;
  emotion?: Emotion;
};

const BODY_Z = 8;

type Layer = { key: string; z: number; img?: string; xml?: string };

export function DimAvatar({ size = 200, equipped, catalog, level = 1, emotion = DEFAULT_EMOTION }: Props) {
  const width = size;
  const height = (size * DRAW_FRAME.h) / DRAW_FRAME.w;

  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const colorItem = getItemById(catalog, equipped.color);
  const dough = colorItem?.color ?? DEFAULT_DOUGH;
  const isRainbow = !!colorItem?.rainbow;

  const kimonoItem = getItemById(catalog, equipped.kimono);
  const beltColor = beltForLevel(level).color;

  const layers = useMemo<Layer[]>(() => {
    const out: Layer[] = [];

    // Les corps PNG pré-rendus ont le visage "joie" cuit dedans : dès qu'une autre
    // émotion est active, on retombe sur le SVG pour afficher le bon visage.
    if (colorItem?.image && emotion === 'joy') out.push({ key: 'body', z: BODY_Z, img: colorItem.image });
    else out.push({ key: 'body', z: BODY_Z, xml: bodyDoc(dough, { rainbow: isRainbow, id: uid, emotion }) });

    if (kimonoItem) {
      out.push({
        key: kimonoItem.id,
        z: kimonoItem.zIndex ?? 10,
        xml: kimonoDoc(kimonoItem.color, beltColor, uid),
      });
      for (const cat of Object.keys(equipped) as ItemCategory[]) {
        if (cat === 'color' || cat === 'kimono') continue;
        const it = getItemById(catalog, equipped[cat]);
        if (!it || (it.zIndex ?? 20) >= BODY_Z) continue;
        if (it.image) out.push({ key: it.id, z: it.zIndex, img: it.image });
        else if (it.draw) out.push({ key: it.id, z: it.zIndex, xml: accessoryDoc(it.draw, it.color) });
      }
      return out.sort((a, b) => a.z - b.z);
    }

    for (const cat of Object.keys(equipped) as ItemCategory[]) {
      if (cat === 'color') continue;
      const it = getItemById(catalog, equipped[cat]);
      if (!it) continue;
      const z = it.zIndex ?? 20;
      if (it.image) out.push({ key: it.id, z, img: it.image });
      else if (it.draw) out.push({ key: it.id, z, xml: accessoryDoc(it.draw, it.color) });
    }

    return out.sort((a, b) => a.z - b.z);
  }, [equipped, catalog, colorItem?.image, dough, isRainbow, uid, kimonoItem, beltColor, emotion]);

  return (
    <View style={{ width, height }}>
      {layers.map((l) =>
        l.img ? (
          <Image
            key={l.key}
            source={{ uri: l.img }}
            style={{ position: 'absolute', width, height, zIndex: l.z }}
            contentFit="contain"
          />
        ) : (
          <View key={l.key} style={{ position: 'absolute', width, height, zIndex: l.z }}>
            <SvgXml xml={l.xml!} width={width} height={height} />
          </View>
        )
      )}
    </View>
  );
}

export default DimAvatar;
