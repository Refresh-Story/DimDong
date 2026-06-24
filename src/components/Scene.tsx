// Décor de Dim-Dong : ambiance "salon de dim-sum" revisitée façon MANGA.
// Fond papier + trame (screentone) + traits de vitesse derrière le héros ; lanternes,
// vapeur et panier vapeur en bambou redessinés avec des contours d'encre francs et des
// ombres en aplat (cel) plutôt qu'en dégradés. Les décorations achetées se posent
// toujours sur le rebord du panier (positions inchangées : item.x / item.w).
//
// Animations : API `Animated` de React Native, useNativeDriver partout.
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import { DecorView } from '@/components/Decor';
import { SpeedLines } from '@/components/ui';
import { Item } from '@/data/items';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const STEAMER_RATIO = 0.4; // part basse occupée par le panier vapeur

// Trame manga (screentone) : champ de petits points réguliers, faible contraste.
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
}: {
  children?: React.ReactNode;
  decor?: Item[];
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* fond papier manga */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Palette.paper }]} />

      {/* trame de fond, légère, sur toute la surface */}
      <Halftone opacity={0.4} dot={Palette.screentoneMid} />

      {/* traits de vitesse derrière le héros (cadrage central, dynamisme manga) */}
      <View style={styles.speed} pointerEvents="none">
        <SpeedLines size={SCREEN_W * 1.3} color={Palette.ink} count={34} innerRatio={0.34} opacity={0.12} />
      </View>

      {/* "case ronde" qui encadre le personnage (spotlight manga) */}
      <View style={styles.spotlight} />
      <View style={styles.spotlightRing} />

      {/* lanternes suspendues qui se balancent */}
      <Lantern left={42} drop={64} scale={1} period={2600} />
      <Lantern left={SCREEN_W - 92} drop={104} scale={0.85} period={3200} />

      {/* vapeur qui s'élève du panier */}
      <SteamColumn left={SCREEN_W * 0.36} delay={0} />
      <SteamColumn left={SCREEN_W * 0.6} delay={1300} />

      {/* panier vapeur en bambou (aplats + contour encre) */}
      <View style={styles.steamer}>
        {/* corps du panier en aplat */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Palette.steamer }]} />
        {/* tressage horizontal (lignes d'encre fines) */}
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={[styles.weave, { top: 40 + i * 18 }]} />
        ))}
        {/* ombre en aplat (cel) dans le bas du panier, en screentone foncé */}
        <View style={styles.steamerShade} />

        {/* rebord du panier (lattes verticales contourées) */}
        <View style={styles.rim}>
          {Array.from({ length: Math.ceil(SCREEN_W / 20) }).map((_, i) => (
            <View key={i} style={styles.slat} />
          ))}
        </View>

        {/* décorations posées sur le rebord */}
        {decor.map((item) => {
          const w = item.w ?? 90;
          return (
            <View
              key={item.id}
              style={{ position: 'absolute', top: 30, left: (item.x ?? 0.5) * SCREEN_W - w / 2 }}>
              <DecorView item={item} size={w} />
            </View>
          );
        })}
      </View>

      {children}
    </View>
  );
}

// Lanterne suspendue : se balance doucement autour de son point d'accroche (haut).
function Lantern({ left, drop, scale, period }: { left: number; drop: number; scale: number; period: number }) {
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
      {/* pivot near string : translateY + rotate + translateY inverse */}
      <Animated.View style={{ marginTop: drop, transform: [{ translateY: 34 }, { rotate }, { translateY: -34 }] }}>
        <View style={styles.lanternCap} />
        <View style={styles.lanternBody}>
          <View style={styles.lanternSheen} />
          <View style={[styles.lanternRib, { left: '34%' }]} />
          <View style={[styles.lanternRib, { left: '64%' }]} />
        </View>
        <View style={styles.lanternCap} />
        <View style={styles.lanternTassel} />
      </Animated.View>
    </View>
  );
}

// Colonne de vapeur : 3 bouffées qui montent et s'estompent en boucle (décalées).
function SteamColumn({ left, delay }: { left: number; delay: number }) {
  return (
    <View style={{ position: 'absolute', bottom: `${STEAMER_RATIO * 100}%`, left }} pointerEvents="none">
      <Puff delay={delay} x={0} />
      <Puff delay={delay + 1000} x={12} />
      <Puff delay={delay + 2000} x={-6} />
    </View>
  );
}

function Puff({ delay, x }: { delay: number; x: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(t, { toValue: 1, duration: 3000, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, delay]);

  // opacité 0 aux deux extrémités → le reset de la boucle (1 → 0) est invisible.
  const opacity = t.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0, 0.45, 0.25, 0] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -78] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.5] });

  return <Animated.View style={[styles.steamPuff, { left: x, opacity, transform: [{ translateY }, { scale }] }]} />;
}

const styles = StyleSheet.create({
  speed: {
    position: 'absolute',
    top: -SCREEN_W * 0.2,
    alignSelf: 'center',
    left: SCREEN_W * 0.5 - SCREEN_W * 0.65,
  },

  // Spotlight rond derrière le héros (case ronde manga, contour encre).
  spotlight: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: Palette.white,
    opacity: 0.55,
  },
  spotlightRing: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 3,
    borderColor: Palette.outline,
    opacity: 0.5,
  },

  steamer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${STEAMER_RATIO * 100}%`,
    overflow: 'hidden',
    borderTopWidth: 3,
    borderColor: Palette.outline,
  },
  weave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Palette.steamerDark,
    opacity: 0.45,
  },
  steamerShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    backgroundColor: Palette.steamerDark,
    opacity: 0.35,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    flexDirection: 'row',
    backgroundColor: Palette.steamerRim,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: Palette.outline,
  },
  slat: {
    width: 14,
    height: 22,
    marginHorizontal: 3,
    backgroundColor: Palette.steamerDark,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Palette.outline,
    opacity: 0.85,
  },

  lanternString: { width: 3, height: 40, backgroundColor: Palette.ink, opacity: 0.7 },
  lanternCap: {
    width: 28,
    height: 9,
    backgroundColor: Palette.lanternGold,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Palette.outline,
    alignSelf: 'center',
  },
  lanternBody: {
    width: 54,
    height: 46,
    backgroundColor: Palette.lantern,
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
    backgroundColor: Palette.lanternDark,
    opacity: 0.6,
  },
  lanternTassel: {
    width: 5,
    height: 16,
    backgroundColor: Palette.lanternGold,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Palette.outline,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  steamPuff: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.steam,
    borderWidth: 2,
    borderColor: Palette.outline,
  },
});
