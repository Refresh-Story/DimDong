// Éléments hauts de la scène (suspendus / horizon), par variante de décor.
// La variante `lanterns` reprend les deux lanternes balancées historiques ; les autres
// sont des compositions statiques d'aplats + contours encre (style manga existant).
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

import { SpeedLines } from '@/components/ui';
import { BackgroundConfig, FLOOR_RATIO } from '@/data/backgrounds';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

type UpperConfig = BackgroundConfig['upper'];

export function Upper({ upper }: { upper: UpperConfig }) {
  const [c0, c1, c2, c3] = upper.colors;
  switch (upper.kind) {
    case 'lanterns':
      return (
        <>
          <Lantern left={42} drop={64} scale={1} period={2600} body={c0} gold={c1} rib={c2} />
          <Lantern left={SCREEN_W - 92} drop={104} scale={0.85} period={3200} body={c0} gold={c1} rib={c2} />
        </>
      );
    case 'stalks':
      return (
        <>
          <Stalk left={10} width={30} stalk={c0} node={c1} leaf={c2} />
          <Stalk left={54} width={16} stalk={c1} node={c1} leaf={c2} />
          <Stalk left={SCREEN_W - 44} width={30} stalk={c0} node={c1} leaf={c2} />
        </>
      );
    case 'noren':
      return <Noren cloth={c0} motif={c1} accent={c2} />;
    case 'scroll':
      return <Scroll beam={c0} paper={c1} seal={c2} />;
    case 'branch':
      return <Branch wood={c0} blossom={c1} blossomLight={c2} />;
    case 'skyline':
      return <Skyline building={c0} neonA={c1} neonB={c2} window={c3} />;
    case 'wavecrest':
      return <WaveCrest deep={c0} light={c1} foam={c2} sun={c3} />;
    case 'moonstars':
      return <MoonStars sea={c0} land={c1} star={c2} />;
    case 'garland':
      return <Garland lantern={c0} gold={c1} alt={c2} />;
  }
}

// Lanterne suspendue : se balance doucement autour de son point d'accroche (haut).
// (Déplacée depuis Scene.tsx ; couleurs paramétrées pour être réutilisable.)
function Lantern({
  left,
  drop,
  scale,
  period,
  body = Palette.lantern,
  gold = Palette.lanternGold,
  rib = Palette.lanternDark,
}: {
  left: number;
  drop: number;
  scale: number;
  period: number;
  body?: string;
  gold?: string;
  rib?: string;
}) {
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const half = period / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: -1, duration: period, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sway, period]);

  const rotate = sway.interpolate({ inputRange: [-1, 1], outputRange: ['-3.5deg', '3.5deg'] });

  return (
    <View style={{ position: 'absolute', top: 0, left, alignItems: 'center', transform: [{ scale }] }} pointerEvents="none">
      <View style={styles.lanternString} />
      {/* pivot proche de la ficelle : translateY + rotate + translateY inverse */}
      <Animated.View style={{ marginTop: drop, transform: [{ translateY: 34 }, { rotate }, { translateY: -34 }] }}>
        <View style={[styles.lanternCap, { backgroundColor: gold }]} />
        <View style={[styles.lanternBody, { backgroundColor: body }]}>
          <View style={styles.lanternSheen} />
          <View style={[styles.lanternRib, { left: '34%', backgroundColor: rib }]} />
          <View style={[styles.lanternRib, { left: '64%', backgroundColor: rib }]} />
        </View>
        <View style={[styles.lanternCap, { backgroundColor: gold }]} />
        <View style={[styles.lanternTassel, { backgroundColor: gold }]} />
      </Animated.View>
    </View>
  );
}

// Tige de bambou verticale : fût + nœuds + quelques feuilles.
function Stalk({ left, width, stalk, node, leaf }: { left: number; width: number; stalk: string; node: string; leaf: string }) {
  return (
    <View style={{ position: 'absolute', top: 0, left, width, height: '58%' }} pointerEvents="none">
      <View style={{ flex: 1, backgroundColor: stalk, borderRadius: width / 2, borderWidth: 2.5, borderColor: Palette.outline }} />
      {[64, 148, 232, 316].map((top) => (
        <View key={top} style={{ position: 'absolute', top, left: 2, right: 2, height: 4, backgroundColor: node, opacity: 0.7, borderRadius: 2 }} />
      ))}
      {[
        { top: 88, rot: '-38deg', side: -18 },
        { top: 190, rot: '32deg', side: width - 6 },
        { top: 278, rot: '-26deg', side: -16 },
      ].map((l, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: l.top,
            left: l.side,
            width: 30,
            height: 10,
            borderRadius: 6,
            backgroundColor: leaf,
            borderWidth: 2,
            borderColor: Palette.outline,
            transform: [{ rotate: l.rot }],
          }}
        />
      ))}
    </View>
  );
}

// Rideau noren à pans, accroché en haut de l'écran.
function Noren({ cloth, motif, accent }: { cloth: string; motif: string; accent: string }) {
  const panelW = (SCREEN_W - 8 * 5) / 4;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="none">
      <View style={{ height: 10, backgroundColor: Palette.outline }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: panelW,
              height: i % 2 ? 78 : 88,
              backgroundColor: cloth,
              borderWidth: 2.5,
              borderTopWidth: 0,
              borderColor: Palette.outline,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {i === 1 && (
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: motif, borderWidth: 2.5, borderColor: Palette.outline }} />
            )}
            {i === 2 && <View style={{ width: 8, height: 40, borderRadius: 4, backgroundColor: accent, opacity: 0.9 }} />}
          </View>
        ))}
      </View>
    </View>
  );
}

// Poutre en bois + rouleau de calligraphie suspendu (dojo).
function Scroll({ beam, paper, seal }: { beam: string; paper: string; seal: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', top: 34, left: 0, right: 0, height: 14, backgroundColor: beam, borderTopWidth: 2.5, borderBottomWidth: 2.5, borderColor: Palette.outline }} />
      <View style={{ position: 'absolute', top: 48, left: SCREEN_W * 0.1, width: 72, alignItems: 'center' }}>
        <View style={{ width: 3, height: 18, backgroundColor: Palette.ink, opacity: 0.7 }} />
        <View style={{ width: 72, height: 10, borderRadius: 5, backgroundColor: beam, borderWidth: 2, borderColor: Palette.outline }} />
        <View style={{ width: 60, height: 140, backgroundColor: paper, borderWidth: 2.5, borderColor: Palette.outline, alignItems: 'center', paddingTop: 14, gap: 10 }}>
          {/* traits de calligraphie stylisés */}
          <View style={{ width: 7, height: 42, borderRadius: 3, backgroundColor: Palette.ink }} />
          <View style={{ width: 7, height: 28, borderRadius: 3, backgroundColor: Palette.ink }} />
          <View style={{ alignSelf: 'flex-end', marginRight: 8, width: 14, height: 14, backgroundColor: seal, borderWidth: 2, borderColor: Palette.outline }} />
        </View>
        <View style={{ width: 72, height: 10, borderRadius: 5, backgroundColor: beam, borderWidth: 2, borderColor: Palette.outline }} />
      </View>
    </View>
  );
}

// Branche de cerisier fleurie qui entre par le coin haut gauche.
function Branch({ wood, blossom, blossomLight }: { wood: string; blossom: string; blossomLight: string }) {
  const flowers = [
    { left: 26, top: 34, size: 26 },
    { left: 74, top: 60, size: 20 },
    { left: 120, top: 40, size: 30 },
    { left: 170, top: 72, size: 22 },
    { left: 214, top: 46, size: 18 },
  ];
  return (
    <View style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
      <View
        style={{
          position: 'absolute',
          top: 28,
          left: -34,
          width: 250,
          height: 14,
          borderRadius: 7,
          backgroundColor: wood,
          borderWidth: 2.5,
          borderColor: Palette.outline,
          transform: [{ rotate: '9deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 52,
          left: 96,
          width: 90,
          height: 10,
          borderRadius: 5,
          backgroundColor: wood,
          borderWidth: 2,
          borderColor: Palette.outline,
          transform: [{ rotate: '28deg' }],
        }}
      />
      {flowers.map((f, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: f.top,
            left: f.left,
            width: f.size,
            height: f.size,
            borderRadius: f.size / 2,
            backgroundColor: i % 2 ? blossomLight : blossom,
            borderWidth: 2,
            borderColor: Palette.outline,
          }}
        />
      ))}
    </View>
  );
}

// Silhouettes d'immeubles + enseignes néon, posées sur l'horizon (haut du sol).
function Skyline({ building, neonA, neonB, window: win }: { building: string; neonA: string; neonB: string; window: string }) {
  const buildings = [
    { left: 0, w: 0.2, h: 150 },
    { left: 0.17, w: 0.16, h: 108 },
    { left: 0.31, w: 0.22, h: 172 },
    { left: 0.51, w: 0.17, h: 122 },
    { left: 0.66, w: 0.2, h: 158 },
    { left: 0.84, w: 0.18, h: 118 },
  ];
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: `${FLOOR_RATIO * 100}%`, height: 180 }} pointerEvents="none">
      {buildings.map((b, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            left: b.left * SCREEN_W,
            width: b.w * SCREEN_W,
            height: b.h,
            backgroundColor: building,
            borderTopWidth: 2.5,
            borderColor: Palette.outline,
          }}>
          {Array.from({ length: 6 }).map((_, j) => (
            <View
              key={j}
              style={{
                position: 'absolute',
                top: 12 + (j % 3) * 26,
                left: 8 + Math.floor(j / 3) * 22,
                width: 8,
                height: 11,
                backgroundColor: win,
                opacity: (i + j) % 3 === 0 ? 0.95 : 0.45,
              }}
            />
          ))}
        </View>
      ))}
      {/* enseignes néon */}
      <View style={{ position: 'absolute', bottom: 148, left: SCREEN_W * 0.06, width: 58, height: 30, borderRadius: 6, borderWidth: 3, borderColor: neonA, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 32, height: 5, borderRadius: 3, backgroundColor: neonA }} />
      </View>
      <View style={{ position: 'absolute', bottom: 132, right: SCREEN_W * 0.08, width: 34, height: 62, borderRadius: 6, borderWidth: 3, borderColor: neonB, alignItems: 'center', justifyContent: 'space-evenly' }}>
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: neonB }} />
        <View style={{ width: 14, height: 5, borderRadius: 3, backgroundColor: neonB }} />
      </View>
    </View>
  );
}

// Crête de vague façon Hokusai + soleil levant, derrière le sol de sable.
function WaveCrest({ deep, light, foam, sun }: { deep: string; light: string; foam: string; sun: string }) {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: `${FLOOR_RATIO * 100}%`, height: 220 }} pointerEvents="none">
      {/* soleil levant */}
      <View style={{ position: 'absolute', top: -40, right: 42, width: 64, height: 64, borderRadius: 32, backgroundColor: sun, borderWidth: 2.5, borderColor: Palette.outline }} />
      {/* grande vague (gauche) + vague secondaire (droite), rondes en aplat */}
      <View style={{ position: 'absolute', bottom: -130, left: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: deep, borderWidth: 3, borderColor: Palette.outline }} />
      <View style={{ position: 'absolute', bottom: -150, left: -30, width: 220, height: 220, borderRadius: 110, backgroundColor: light, borderWidth: 2.5, borderColor: Palette.outline }} />
      <View style={{ position: 'absolute', bottom: -160, right: -60, width: 210, height: 210, borderRadius: 105, backgroundColor: deep, borderWidth: 3, borderColor: Palette.outline }} />
      {/* écume : griffes de mousse le long des crêtes */}
      {[
        { left: 24, bottom: 118 },
        { left: 78, bottom: 138 },
        { left: 136, bottom: 118 },
        { right: 96, bottom: 62 },
        { right: 44, bottom: 76 },
      ].map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            ...p,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: foam,
            borderWidth: 2.5,
            borderColor: Palette.outline,
          }}
        />
      ))}
    </View>
  );
}

// Terre vue de la Lune + étoiles.
function MoonStars({ sea, land, star }: { sea: string; land: string; star: string }) {
  const stars = [
    { left: 0.12, top: 36, s: 5 },
    { left: 0.3, top: 88, s: 4 },
    { left: 0.46, top: 30, s: 6 },
    { left: 0.62, top: 70, s: 4 },
    { left: 0.76, top: 34, s: 5 },
    { left: 0.88, top: 96, s: 6 },
    { left: 0.2, top: 150, s: 4 },
    { left: 0.7, top: 170, s: 4 },
    { left: 0.9, top: 210, s: 5 },
    { left: 0.06, top: 210, s: 4 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((st, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: st.top,
            left: st.left * SCREEN_W,
            width: st.s,
            height: st.s,
            borderRadius: st.s / 2,
            backgroundColor: star,
            opacity: 0.9,
          }}
        />
      ))}
      {/* la Terre, avec ses continents en aplat */}
      <View
        style={{
          position: 'absolute',
          top: 54,
          left: 26,
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: sea,
          borderWidth: 2.5,
          borderColor: Palette.outline,
          overflow: 'hidden',
        }}>
        <View style={{ position: 'absolute', top: 12, left: 8, width: 34, height: 24, borderRadius: 12, backgroundColor: land }} />
        <View style={{ position: 'absolute', bottom: 10, right: 6, width: 40, height: 26, borderRadius: 14, backgroundColor: land }} />
      </View>
    </View>
  );
}

// Guirlande de fête : deux cordes de petites lanternes + éclats de feux d'artifice.
function Garland({ lantern, gold, alt }: { lantern: string; gold: string; alt: string }) {
  const row = (top: number, offset: number, count: number) => (
    <View style={{ position: 'absolute', top, left: 0, right: 0 }} pointerEvents="none">
      <View style={{ height: 3, backgroundColor: Palette.ink, opacity: 0.6 }} />
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ position: 'absolute', top: 3, left: ((offset + i * (100 / count)) / 100) * SCREEN_W, alignItems: 'center' }}>
          <View style={{ width: 16, height: 5, borderRadius: 2, backgroundColor: gold, borderWidth: 1.5, borderColor: Palette.outline }} />
          <View
            style={{
              width: 24,
              height: 26,
              borderRadius: 12,
              backgroundColor: i % 2 ? alt : lantern,
              borderWidth: 2,
              borderColor: Palette.outline,
              marginTop: -1,
            }}
          />
        </View>
      ))}
    </View>
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* éclats de feux d'artifice (traits radiaux, centre vide) */}
      <View style={{ position: 'absolute', top: 118, left: SCREEN_W * 0.08 }}>
        <SpeedLines size={92} color={gold} count={14} innerRatio={0.3} strokeWidth={3} opacity={0.8} />
      </View>
      <View style={{ position: 'absolute', top: 150, right: SCREEN_W * 0.06 }}>
        <SpeedLines size={70} color={alt} count={12} innerRatio={0.3} strokeWidth={3} opacity={0.7} />
      </View>
      {row(28, 4, 6)}
      {row(84, 12, 5)}
    </View>
  );
}

const styles = StyleSheet.create({
  lanternString: { width: 3, height: 40, backgroundColor: Palette.ink, opacity: 0.7 },
  lanternCap: {
    width: 28,
    height: 9,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Palette.outline,
    alignSelf: 'center',
  },
  lanternBody: {
    width: 54,
    height: 46,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: Palette.outline,
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: -1,
  },
  lanternSheen: {
    position: 'absolute',
    top: 7,
    left: 9,
    width: 14,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    opacity: 0.35,
  },
  lanternRib: {
    position: 'absolute',
    top: 4,
    width: 2,
    height: 38,
    opacity: 0.6,
  },
  lanternTassel: {
    width: 5,
    height: 16,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Palette.outline,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
