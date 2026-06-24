// Avatar de Dim : un petit DIM-SUM (raviole vapeur) en style manga.
// Le tracé vient de la SOURCE UNIQUE `@/art/dimArt` (mêmes formes que les PNG générés).
//
// Composition : chaque couche (corps + cosmétiques) occupe le même cadre 200×260 et est
// rendue en absolu, triée par `zIndex` (cape derrière le corps, chapeau devant, etc.).
//   - cosmétique avec `image` (PNG Firebase) → <Image>
//   - sinon `draw` → tracé manga via <SvgXml>
//   - corps : variante de couleur `image` si dispo, sinon tracé manga <SvgXml>
import { Image } from 'expo-image';
import React, { useId, useMemo } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { accessoryDoc, bodyDoc, kimonoDoc, DRAW_FRAME } from '@/art/dimArt';
import { DEFAULT_DOUGH, Item, ItemCategory, getItemById } from '@/data/items';
import { beltForLevel } from '@/game/rules';

type Props = {
  size?: number;
  equipped: Partial<Record<ItemCategory, string>>;
  catalog: Item[];
  // Niveau du joueur : pilote la couleur de la ceinture du kimono.
  level?: number;
};

const BODY_Z = 8;

type Layer = { key: string; z: number; img?: string; xml?: string };

export function DimAvatar({ size = 200, equipped, catalog, level = 1 }: Props) {
  const width = size;
  const height = (size * DRAW_FRAME.h) / DRAW_FRAME.w;

  // id unique par instance : évite les collisions d'ids <defs> entre SVG montés
  // (react-native-svg partage les ids globalement).
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const colorItem = getItemById(catalog, equipped.color);
  const dough = colorItem?.color ?? DEFAULT_DOUGH;
  const isRainbow = !!colorItem?.rainbow;

  const kimonoItem = getItemById(catalog, equipped.kimono);
  const beltColor = beltForLevel(level).color;

  const layers = useMemo<Layer[]>(() => {
    const out: Layer[] = [];

    // corps : variante de couleur (image) sinon tracé manga
    if (colorItem?.image) out.push({ key: 'body', z: BODY_Z, img: colorItem.image });
    else out.push({ key: 'body', z: BODY_Z, xml: bodyDoc(dough, { rainbow: isRainbow, id: uid }) });

    // Mode kimono : exclusif → seulement corps (couleur) + kimono (ceinture selon le niveau).
    if (kimonoItem) {
      out.push({
        key: kimonoItem.id,
        z: kimonoItem.zIndex ?? 10,
        xml: kimonoDoc(kimonoItem.color, beltColor, uid),
      });
      return out.sort((a, b) => a.z - b.z);
    }

    // cosmétiques équipés (hors couleur)
    for (const cat of Object.keys(equipped) as ItemCategory[]) {
      if (cat === 'color') continue;
      const it = getItemById(catalog, equipped[cat]);
      if (!it) continue;
      const z = it.zIndex ?? 20;
      if (it.image) out.push({ key: it.id, z, img: it.image });
      else if (it.draw) out.push({ key: it.id, z, xml: accessoryDoc(it.draw, it.color) });
    }

    return out.sort((a, b) => a.z - b.z);
  }, [equipped, catalog, colorItem?.image, dough, isRainbow, uid, kimonoItem, beltColor]);

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
