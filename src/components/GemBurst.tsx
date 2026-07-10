import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Palette } from '@/theme';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

type Props = {
  count?: number;
  size?: number;
  spread?: number;
};

function impactPoints(spikes: number, outer: number, inner: number, c: number) {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(c + Math.cos(a) * r).toFixed(1)},${(c + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(' ');
}

export function GemBurst({ count = 14, size = 18, spread = 150 }: Props) {
  const impact = useRef(new Animated.Value(0)).current;
  const starSize = spread * 2.1;
  const points = useRef(impactPoints(14, 50, 21, 50)).current;

  const gems = useRef(
    Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = spread * (0.55 + Math.random() * 0.45);
      return {
        progress: new Animated.Value(0),
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40, // léger biais vers le haut
        rot: (Math.random() - 0.5) * 2,
        delay: Math.random() * 120,
      };
    })
  ).current;

  useEffect(() => {
    Animated.timing(impact, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    Animated.parallel(
      gems.map((g) =>
        Animated.timing(g.progress, {
          toValue: 1,
          duration: 1100,
          delay: g.delay,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [gems, impact]);

  const impactOpacity = impact.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.85, 0] });
  const impactScale = impact.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.25] });
  const impactRotate = impact.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '24deg'] });

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <AnimatedSvg
        width={starSize}
        height={starSize}
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          opacity: impactOpacity,
          transform: [{ scale: impactScale }, { rotate: impactRotate }],
        }}>
        <Polygon points={points} fill={Palette.accent} stroke={Palette.ink} strokeWidth={3} strokeLinejoin="round" />
      </AnimatedSvg>

      {gems.map((g, i) => {
        const translateX = g.progress.interpolate({ inputRange: [0, 1], outputRange: [0, g.dx] });
        const translateY = g.progress.interpolate({ inputRange: [0, 1], outputRange: [0, g.dy] });
        const opacity = g.progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
        const scale = g.progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.2, 0.7] });
        const rotate = g.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['45deg', `${45 + g.rot * 180}deg`],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.gem,
              {
                width: size,
                height: size,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }, { rotate }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  gem: {
    position: 'absolute',
    backgroundColor: Palette.gem,
    borderRadius: 3,
    borderWidth: 2.5,
    borderColor: Palette.ink,
  },
});

export default GemBurst;
