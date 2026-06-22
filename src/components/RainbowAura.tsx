// Effet spécial pour la pâte légendaire "Rainbow" : lueur pulsante + étoiles
// arc-en-ciel qui scintillent autour du personnage. API Animated native.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const RAINBOW = ['#FF7FA8', '#FFB347', '#FFE066', '#7FD489', '#5FB8FF', '#C9A0FF'];

// Position (en fraction de la boîte) + taille de chaque étoile.
const SPARKS = [
  { x: 0.12, y: 0.18, s: 0.13 },
  { x: 0.85, y: 0.12, s: 0.1 },
  { x: 0.92, y: 0.45, s: 0.14 },
  { x: 0.06, y: 0.5, s: 0.11 },
  { x: 0.22, y: 0.78, s: 0.12 },
  { x: 0.8, y: 0.8, s: 0.1 },
  { x: 0.5, y: 0.05, s: 0.12 },
  { x: 0.68, y: 0.6, s: 0.09 },
];

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

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.5] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: W, height: H }]}>
      {/* lueur arc-en-ciel pulsante derrière le personnage */}
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
      {/* étoiles scintillantes */}
      {SPARKS.map((sp, i) => {
        const v = sparks[i];
        const opacity = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
        const scale = v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1.1, 0.3] });
        const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
        return (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              left: sp.x * W,
              top: sp.y * H,
              fontSize: size * sp.s,
              color: RAINBOW[i % RAINBOW.length],
              opacity,
              transform: [{ scale }, { rotate }],
            }}>
            ✦
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0 },
  glow: { position: 'absolute', backgroundColor: '#FFD6F0' },
});

export default RainbowAura;
