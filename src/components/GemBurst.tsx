// Petite gerbe de gemmes qui jaillit (récompense de fin de brossage).
// Utilise l'API Animated native (pas de reanimated).
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Palette } from '@/theme';

type Props = {
  count?: number;
  size?: number; // taille d'une gemme
  spread?: number; // distance max de projection
};

export function GemBurst({ count = 14, size = 18, spread = 150 }: Props) {
  // Une valeur de progression par gemme.
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
  }, [gems]);

  return (
    <View pointerEvents="none" style={styles.wrap}>
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
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Palette.gemDark,
  },
});

export default GemBurst;
