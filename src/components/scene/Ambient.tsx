import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { SceneGeom } from '@/art/sceneGeom';
import { BackgroundConfig } from '@/data/backgrounds';
import { Palette } from '@/theme';

type AmbientConfig = BackgroundConfig['ambient'];

/**
 * Les particules suivent la géométrie de la scène. Auparavant elles se calaient sur un
 * `Dimensions.get` figé : dans la modale d'aperçu, les pétales tombaient d'une hauteur
 * d'écran entière dans une carte de 330 px et traversaient l'horizon.
 */
export function Ambient({ ambient, geom: g }: { ambient: AmbientConfig; geom: SceneGeom }) {
  switch (ambient.kind) {
    case 'none':
      return null;
    case 'steam':
      return (
        <>
          <SteamColumn left={g.w * 0.36} bottom={g.floorH} delay={0} color={ambient.color} />
          <SteamColumn left={g.w * 0.6} bottom={g.floorH} delay={1300} color={ambient.color} />
        </>
      );
    case 'fall':
      return (
        <>
          {Array.from({ length: 7 }).map((_, i) => (
            <FallingParticle key={i} index={i} geom={g} color={ambient.color} petal={ambient.shape === 'petal'} />
          ))}
        </>
      );
    case 'rise':
      return (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <RisingParticle key={i} index={i} geom={g} color={ambient.color} />
          ))}
        </>
      );
    case 'twinkle':
      return (
        <>
          {Array.from({ length: 8 }).map((_, i) => (
            <TwinkleParticle key={i} index={i} geom={g} color={ambient.color} />
          ))}
        </>
      );
  }
}

function SteamColumn({ left, bottom, delay, color }: { left: number; bottom: number; delay: number; color: string }) {
  return (
    <View style={{ position: 'absolute', bottom, left }} pointerEvents="none">
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

  const opacity = t.interpolate({ inputRange: [0, 0.18, 0.7, 1], outputRange: [0, 0.45, 0.25, 0] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -78] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.5] });

  return <Animated.View style={[styles.steamPuff, { left: x, backgroundColor: color, opacity, transform: [{ translateY }, { scale }] }]} />;
}

const frac = (i: number, step: number) => ((i * step) % 100) / 100;

function FallingParticle({ index, geom: g, color, petal }: { index: number; geom: SceneGeom; color: string; petal: boolean }) {
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
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, g.horizonY - 20] });
  const translateX = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, drift, drift * 0.4] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', petal ? '180deg' : '90deg'] });

  const size = 9 + (index % 3) * 3;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -20,
        left: (0.06 + frac(index, 29) * 0.88) * g.w,
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

function RisingParticle({ index, geom: g, color }: { index: number; geom: SceneGeom; color: string }) {
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
        bottom: g.floorH,
        left: (0.08 + frac(index, 31) * 0.84) * g.w,
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

function TwinkleParticle({ index, geom: g, color }: { index: number; geom: SceneGeom; color: string }) {
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
        top: 30 + frac(index, 43) * g.skyH * 0.6,
        left: (0.05 + frac(index, 23) * 0.9) * g.w,
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
