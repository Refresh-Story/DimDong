import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { floorArt } from '@/art/sceneArt';
import { BackgroundConfig, RIM_H } from '@/data/backgrounds';
import { Palette } from '@/theme';

const SCREEN_W = Dimensions.get('window').width;

type FloorConfig = BackgroundConfig['floor'];

export function Floor({ floor }: { floor: FloorConfig }) {
  if (floor.kind !== 'steamer') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SvgXml
          xml={floorArt(floor.kind, floor)}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMin slice"
        />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: floor.base }]} />
      {Array.from({ length: 7 }).map((_, i) => (
        <View key={i} style={[styles.hLine, { top: 40 + i * 18, backgroundColor: floor.line, opacity: 0.45 }]} />
      ))}
      <View style={[styles.shade, { backgroundColor: floor.shade }]} />
      <View style={[styles.rim, { backgroundColor: floor.rim }]}>
        {Array.from({ length: Math.ceil(SCREEN_W / 20) }).map((_, i) => (
          <View key={i} style={[styles.slat, { backgroundColor: floor.shade }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    opacity: 0.35,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: RIM_H,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: Palette.outline,
  },
  slat: {
    width: 14,
    height: 22,
    marginHorizontal: 3,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: Palette.outline,
    opacity: 0.85,
  },
});
