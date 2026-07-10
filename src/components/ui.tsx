import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

export function GemBadge({
  count,
  size = 'md',
  tone = 'card',
}: {
  count: number;
  size?: 'md' | 'lg';
  tone?: 'card' | 'chip';
}) {
  const big = size === 'lg';
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.25, friction: 4, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [count, scale]);

  return (
    <Animated.View
      style={[
        styles.gemBadge,
        tone === 'chip' && styles.gemBadgeChip,
        big && { paddingVertical: 8, paddingHorizontal: 16 },
        { transform: [{ scale }] },
      ]}>
      <View style={[styles.gem, big && { width: 22, height: 22 }]} />
      <Text style={[styles.gemText, big && { fontSize: 26 }]}>{count}</Text>
    </Animated.View>
  );
}

export function LevelMedallion({ level }: { level: number }) {
  return (
    <View style={styles.medallion}>
      <Text style={styles.medallionNum}>{level}</Text>
      <Text style={styles.medallionLabel}>NIV</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  color = Palette.primary,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  color?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: disabled ? Palette.locked : color },
        pressed && !disabled && styles.btnPressed,
        style,
      ]}>
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function Panel({
  children,
  style,
  tone = 'card',
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
  tone?: 'card' | 'paper';
}) {
  return (
    <View style={[styles.panel, tone === 'paper' && { backgroundColor: Palette.paper }, style]}>
      {children}
    </View>
  );
}

export function SpeedLines({
  size,
  color = Palette.ink,
  count = 28,
  innerRatio = 0.42,
  strokeWidth = 2,
  opacity = 0.18,
}: {
  size: number;
  color?: string;
  count?: number;
  innerRatio?: number;
  strokeWidth?: number;
  opacity?: number;
}) {
  const c = size / 2;
  const rOuter = size * 0.72;
  const rInner = size * innerRatio;
  const lines = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const jitter = 0.82 + ((i * 47) % 100) / 100 / 3;
    return {
      x1: c + cos * rInner,
      y1: c + sin * rInner,
      x2: c + cos * rOuter * jitter,
      y2: c + sin * rOuter * jitter,
      w: strokeWidth * (i % 3 === 0 ? 1.8 : 1),
    };
  });
  return (
    <Svg width={size} height={size} style={{ opacity }} pointerEvents="none">
      {lines.map((l, i) => (
        <Line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={color}
          strokeWidth={l.w}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  gemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 2.5,
    borderColor: Palette.outline,
    ...Shadow.card,
  },
  gem: {
    width: 16,
    height: 16,
    backgroundColor: Palette.gem,
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: Palette.outline,
  },
  gemText: { fontSize: 18, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 0.5 },
  gemBadgeChip: {
    backgroundColor: Palette.cardSoft,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  medallion: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Palette.accent,
    borderWidth: 3,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  medallionNum: { fontSize: 22, fontFamily: Fonts.display, color: Palette.ink, lineHeight: 24 },
  medallionLabel: {
    fontSize: 8,
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    letterSpacing: 1,
  },

  btn: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Palette.outline,
    ...Shadow.card,
  },
  btnPressed: { transform: [{ translateX: 3 }, { translateY: 4 }], shadowOpacity: 0 },
  btnText: {
    color: Palette.white,
    fontSize: 24,
    fontFamily: Fonts.display,
    letterSpacing: 1,
    textShadowColor: Palette.ink,
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 0,
  },

  chip: {
    backgroundColor: Palette.cardSoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outline,
  },
  chipText: { color: Palette.ink, fontFamily: Fonts.bodyBold, fontSize: 12 },

  panel: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.lg,
    ...Shadow.card,
  },
});
