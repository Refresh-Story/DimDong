import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { SCENE_W, UPPER_BOTTOM_ANCHORED, UPPER_H, upperArt } from '@/art/sceneArt';
import { BackgroundConfig, FLOOR_RATIO } from '@/data/backgrounds';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

type UpperConfig = BackgroundConfig['upper'];

export function Upper({ upper }: { upper: UpperConfig }) {
  const [c0, c1, c2] = upper.colors;
  if (upper.kind === 'lanterns') {
    return (
      <>
        <Lantern left={42} drop={64} scale={1} period={2600} body={c0} gold={c1} rib={c2} />
        <Lantern left={SCREEN_W - 92} drop={104} scale={0.85} period={3200} body={c0} gold={c1} rib={c2} />
      </>
    );
  }

  const xml = upperArt(upper.kind, upper.colors);
  const height = (SCREEN_W / SCENE_W) * UPPER_H[upper.kind];
  const anchor = UPPER_BOTTOM_ANCHORED.has(upper.kind)
    ? ({ position: 'absolute', left: 0, right: 0, bottom: `${FLOOR_RATIO * 100}%` } as const)
    : ({ position: 'absolute', left: 0, right: 0, top: 0 } as const);

  return (
    <View style={anchor} pointerEvents="none">
      <SvgXml xml={xml} width={SCREEN_W} height={height} />
    </View>
  );
}

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
