import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { animalDoc } from '@/art/dimArt';
import type { Item } from '@/data/items';

// Déphasage stable par item, pour que deux rendus du même compagnon ne
// respirent pas exactement en même temps que le dim ou qu'un autre aperçu.
function phaseOf(id: string): number {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return sum % 900;
}

/**
 * Un compagnon chibi. Statique par défaut (vignettes de la boutique et de
 * l'inventaire) ; `animated` ajoute l'idiome d'animation de l'app — respiration
 * douce (translateY + légère rotation, boucle native) et clignement des yeux
 * par échange de document SVG.
 */
export function AnimalView({ item, size = 60, animated = false }: { item: Item; size?: number; animated?: boolean }) {
  const phase = phaseOf(item.id);

  const idle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const seq = Animated.sequence([Animated.delay(phase), loop]);
    seq.start();
    return () => seq.stop();
  }, [animated, idle, phase]);

  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!animated) return;
    let close: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setBlink(true);
      close = setTimeout(() => setBlink(false), 150);
    }, 3500 + (phase % 1200));
    return () => {
      clearInterval(interval);
      if (close) clearTimeout(close);
    };
  }, [animated, phase]);

  if (!item.animal) return null;

  const xml = animalDoc(item.animal, item.color, { blink: animated && blink });
  if (!animated) return <SvgXml xml={xml} width={size} height={size} />;

  const translateY = idle.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const rotate = idle.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
      <SvgXml xml={xml} width={size} height={size} />
    </Animated.View>
  );
}

export default AnimalView;
