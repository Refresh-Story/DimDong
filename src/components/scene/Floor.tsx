// Sol de la scène : remplit le conteneur bas de Scene (part FLOOR_RATIO de l'écran).
// La variante `steamer` reproduit exactement le panier vapeur historique ; les autres
// sont des compositions d'aplats + motifs (contours encre, ombres cel) dans le même
// style manga. Toutes gardent une bande « rebord » de RIM_H px en haut du sol, là où
// Scene pose les décorations achetées.
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { BackgroundConfig, RIM_H } from '@/data/backgrounds';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

type FloorConfig = BackgroundConfig['floor'];

// Pseudo-aléa déterministe (même rythme que SpeedLines) : stable entre rendus.
const jitter = (i: number, m: number) => ((i * 47) % 100) / 100 * m;

export function Floor({ floor }: { floor: FloorConfig }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* aplat principal */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: floor.base }]} />

      <FloorPattern floor={floor} />

      {/* ombre en aplat (cel) dans le bas du sol */}
      <View style={[styles.shade, { backgroundColor: floor.shade }]} />

      {/* bande « rebord » (les décorations achetées se posent dessus, à top: 30) */}
      {floor.kind === 'steamer' ? (
        <View style={[styles.rim, { backgroundColor: floor.rim }]}>
          {Array.from({ length: Math.ceil(SCREEN_W / 20) }).map((_, i) => (
            <View key={i} style={[styles.slat, { backgroundColor: floor.shade }]} />
          ))}
        </View>
      ) : (
        <View style={[styles.rim, { backgroundColor: floor.rim }]} />
      )}
    </View>
  );
}

// Motifs propres à chaque variante, entre l'aplat de base et le rebord.
function FloorPattern({ floor }: { floor: FloorConfig }) {
  switch (floor.kind) {
    case 'steamer':
      // tressage horizontal du panier (identique à l'ancien Scene)
      return (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.hLine, { top: 40 + i * 18, backgroundColor: floor.line, opacity: 0.45 }]} />
          ))}
        </>
      );

    case 'grass':
      // brins d'herbe éparpillés (petits traits inclinés)
      return (
        <>
          {Array.from({ length: 14 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: RIM_H + 14 + jitter(i + 3, 120),
                left: ((4 + ((i * 13) % 92)) / 100) * SCREEN_W,
                width: 3,
                height: 10 + jitter(i, 8),
                borderRadius: 2,
                backgroundColor: floor.shade,
                opacity: 0.55,
                transform: [{ rotate: i % 2 ? '14deg' : '-12deg' }],
              }}
            />
          ))}
        </>
      );

    case 'tatami':
      // nattes : lisières verticales + tressage horizontal serré
      return (
        <>
          {[0.33, 0.66].map((f) => (
            <View key={f} style={{ position: 'absolute', top: RIM_H, bottom: 0, left: f * SCREEN_W, width: 4, backgroundColor: floor.shade, opacity: 0.7 }} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={[styles.hLine, { top: RIM_H + 10 + i * 12, backgroundColor: floor.line, opacity: 0.25 }]} />
          ))}
        </>
      );

    case 'counter':
      // planches horizontales du comptoir
      return (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.hLine, { top: RIM_H + 18 + i * 22, backgroundColor: floor.line, opacity: 0.5 }]} />
          ))}
        </>
      );

    case 'sand':
      // sable moucheté
      return (
        <>
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: RIM_H + 12 + jitter(i + 5, 150),
                left: ((3 + ((i * 17) % 94)) / 100) * SCREEN_W,
                width: 6,
                height: 3,
                borderRadius: 2,
                backgroundColor: floor.shade,
                opacity: 0.5,
              }}
            />
          ))}
        </>
      );

    case 'street':
      // marquage central de la chaussée (tirets clairs)
      return (
        <>
          {Array.from({ length: Math.ceil(SCREEN_W / 52) }).map((_, i) => (
            <View
              key={i}
              style={{ position: 'absolute', top: '52%', left: i * 52 + 8, width: 28, height: 5, borderRadius: 2, backgroundColor: floor.line, opacity: 0.75 }}
            />
          ))}
        </>
      );

    case 'moon':
      // cratères (ellipses en aplat, contour encre)
      return (
        <>
          {[
            { left: 0.12, top: 52, w: 44 },
            { left: 0.58, top: 92, w: 30 },
            { left: 0.78, top: 48, w: 36 },
            { left: 0.34, top: 128, w: 26 },
          ].map((c, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: c.top,
                left: c.left * SCREEN_W,
                width: c.w,
                height: c.w * 0.55,
                borderRadius: c.w / 2,
                backgroundColor: floor.shade,
                borderWidth: 2,
                borderColor: Palette.outline,
                opacity: 0.6,
              }}
            />
          ))}
        </>
      );

    case 'deck':
      // plancher de fête : planches horizontales + jointures décalées
      return (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={[styles.hLine, { top: RIM_H + 12 + i * 18, backgroundColor: floor.line, opacity: 0.45 }]} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={`v${i}`}
              style={{
                position: 'absolute',
                top: RIM_H + 12 + (i % 3) * 36,
                left: ((12 + ((i * 29) % 76)) / 100) * SCREEN_W,
                width: 2,
                height: 18,
                backgroundColor: floor.line,
                opacity: 0.45,
              }}
            />
          ))}
        </>
      );
  }
}

const styles = StyleSheet.create({
  hLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    opacity: 0.35,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RIM_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: Palette.outline,
  },
  slat: {
    width: 14,
    height: 22,
    marginHorizontal: 3,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Palette.outline,
    opacity: 0.85,
  },
});
