// Ambiances animées de la scène. `steam` reprend les colonnes de vapeur historiques ;
// `fall` / `rise` / `twinkle` sont un système de particules générique (feuilles,
// pétales, écume, étincelles, étoiles) — 6 à 8 éléments animés `useNativeDriver`.
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

import { BackgroundConfig, FLOOR_RATIO } from '@/data/backgrounds';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;

type AmbientConfig = BackgroundConfig['ambient'];

export function Ambient({ ambient }: { ambient: AmbientConfig }) {
  switch (ambient.kind) {
    case 'none':
      return null;
    case 'steam':
      return (
        <>
          <SteamColumn left={SCREEN_W * 0.36} delay={0} color={ambient.color} />
          <SteamColumn left={SCREEN_W * 0.6} delay={1300} color={ambient.color} />
        </>
      );
    case 'fall':
      return (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <FallingParticle key={i} index={i} color={ambient.color} petal={ambient.shape === 'petal'} />
          ))}
        </>
      );
    case 'rise':
      return (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <RisingParticle key={i} index={i} color={ambient.color} />
          ))}
        </>
      );
    case 'twinkle':
      return (
        <>
          {Array.from({ length: 8 }).map((_, i) => (
            <TwinkleParticle key={i} index={i} color={ambient.color} />
          ))}
        </>
      );
  }
}

// Colonne de vapeur : 3 bouffées qui montent et s'estompent en boucle (décalées).
// (Déplacée depuis Scene.tsx ; couleur paramétrée.)
function SteamColumn({ left, delay, color }: { left: number; delay: number; color: string }) {
  return (
    <View style={{ position: 'absolute', bottom: `${FLOOR_RATIO * 100}%`, left }} pointerEvents="none">
      <Puff delay={delay} x={0} color={color} />
      <Puff delay={delay + 1000} x={12} color={color} />
      <Puff delay={delay + 2000} x={-6} color={color} />
    </View>
  );
}

function Puff({ delay, x, color }: { delay: number; x: number; color: string }) {
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

  return <Animated.View style={[styles.steamPuff, { left: x, backgroundColor: color, opacity, transform: [{ translateY }, { scale }] }]} />;
}

// Positions déterministes (pas de Math.random : stables entre rendus).
const frac = (i: number, step: number) => ((i * step) % 100) / 100;

// Particule qui tombe du haut de l'écran jusqu'au sol (feuille, pétale…).
function FallingParticle({ index, color, petal }: { index: number; color: string; petal: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(index * 640),
      Animated.loop(Animated.timing(t, { toValue: 1, duration: 5200 + index * 380, easing: Easing.linear, useNativeDriver: true })),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, index]);

  const drift = (frac(index, 37) - 0.5) * 70;
  const opacity = t.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 0.85, 0.6, 0] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_H * (1 - FLOOR_RATIO) - 20] });
  const translateX = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, drift, drift * 0.4] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', petal ? '180deg' : '90deg'] });

  const size = 9 + (index % 3) * 3;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -20,
        left: (0.06 + frac(index, 29) * 0.88) * SCREEN_W,
        width: petal ? size * 1.5 : size,
        height: size,
        borderRadius: petal ? size / 2 : size,
        backgroundColor: color,
        borderWidth: 1.5,
        borderColor: Palette.outline,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

// Particule qui monte depuis le rebord du sol (écume, étincelle…).
function RisingParticle({ index, color }: { index: number; color: string }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(index * 520),
      Animated.loop(Animated.timing(t, { toValue: 1, duration: 2600 + index * 240, easing: Easing.out(Easing.quad), useNativeDriver: true })),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, index]);

  const opacity = t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.8, 0.4, 0] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -96] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] });

  const size = 10 + (index % 3) * 4;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: `${FLOOR_RATIO * 100}%`,
        left: (0.08 + frac(index, 31) * 0.84) * SCREEN_W,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: Palette.outline,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

// Particule fixe qui scintille (étoile, néon…), dans la moitié haute de l'écran.
function TwinkleParticle({ index, color }: { index: number; color: string }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(index * 260),
      Animated.loop(
        Animated.sequence([
          Animated.timing(t, { toValue: 1, duration: 1200 + index * 160, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(t, { toValue: 0, duration: 1200 + index * 160, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [t, index]);

  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.95] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] });

  const size = 5 + (index % 3) * 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 30 + frac(index, 43) * SCREEN_H * 0.42,
        left: (0.05 + frac(index, 23) * 0.9) * SCREEN_W,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  steamPuff: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Palette.outline,
  },
});
