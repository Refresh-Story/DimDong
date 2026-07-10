import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/theme';

const RAINBOW = ['#FF7FA8', '#FFB347', '#FFE066', '#7FD489', '#5FB8FF', '#C9A0FF'];

const SPARKS = [
  { x: 0.12, y: 0.18, s: 0.16 },
  { x: 0.85, y: 0.12, s: 0.12 },
  { x: 0.92, y: 0.45, s: 0.17 },
  { x: 0.06, y: 0.5, s: 0.13 },
  { x: 0.22, y: 0.78, s: 0.15 },
  { x: 0.8, y: 0.8, s: 0.12 },
  { x: 0.5, y: 0.05, s: 0.15 },
  { x: 0.68, y: 0.6, s: 0.11 },
];

const SPARKLE_D =
  'M0 -50 C6 -14 14 -6 50 0 C14 6 6 14 0 50 C-6 14 -14 6 -50 0 C-14 -6 -6 -14 0 -50 Z';

function Sparkle({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="-58 -58 116 116">
      <Path d={SPARKLE_D} fill={color} stroke={Palette.ink} strokeWidth={6} strokeLinejoin="round" />
    </Svg>
  );
}

export function RainbowAura({ size }: { size: number }) {
  const W = size;
  const H = size * 1.25;
  const glow = useRef(new Animated.Value(0)).current;
  const sparks = useRef(SPARKS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    const timers = sparks.map((v, i) =>
      setTimeout(() => {
        Animated.loop(
          Animated.timing(v, { toValue: 1, duration: 1100 + i * 90, useNativeDriver: true })
        ).start();
      }, i * 160)
    );

    return () => {
      glowLoop.stop();
      timers.forEach(clearTimeout);
    };
  }, [glow, sparks]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.42] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: W, height: H }]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: W * 0.9,
            height: W * 0.9,
            borderRadius: W * 0.45,
            top: H * 0.28,
            left: W * 0.05,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      {SPARKS.map((sp, i) => {
        const v = sparks[i];
        const opacity = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
        const scale = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.1, 0.3] });
        const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: sp.x * W,
              top: sp.y * H,
              opacity,
              transform: [{ scale }, { rotate }],
            }}>
            <Sparkle size={size * sp.s} color={RAINBOW[i % RAINBOW.length]} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0 },
  glow: { position: 'absolute', backgroundColor: '#FFE3F4' },
});

export default RainbowAura;
