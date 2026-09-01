import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { speedLinePaths } from '@/art/sceneGeom';
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

/**
 * Message éclair au bas de l'écran. `flash` remplace le message en cours : deux actions
 * rapprochées ne se superposent pas, la dernière gagne et repousse la disparition.
 */
export function useToast(): { toast: string | null; flash: (msg: string) => void } {
  const [toast, setToast] = useState<string | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (hide.current) clearTimeout(hide.current);
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (hide.current) clearTimeout(hide.current);
    hide.current = setTimeout(() => setToast(null), 1800);
  }, []);

  return { toast, flash };
}

export function Toast({ message }: { message: string | null }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!message) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  }, [message, scale]);

  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, { transform: [{ scale }] }]}>
      <Text style={styles.toastText}>{message}</Text>
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
  // Géométrie partagée avec le compositeur de scène : les deux ne peuvent pas diverger.
  const lines = speedLinePaths(size, count, innerRatio, strokeWidth);
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
  gemText: { fontSize: 18, fontFamily: Fonts.digits, color: Palette.ink, letterSpacing: 0.5 },
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
  medallionNum: { fontSize: 22, fontFamily: Fonts.digits, color: Palette.ink, lineHeight: 28 },
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

  toast: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: Palette.ink,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    borderWidth: 2.5,
    borderColor: Palette.outline,
  },
  toastText: { color: Palette.white, fontFamily: Fonts.bodyBold },
});
