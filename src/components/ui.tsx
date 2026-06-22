// Petits composants d'interface réutilisables pour Dim-Dong.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Palette, Radius, Shadow, Spacing } from '@/theme';

export function GemBadge({ count, size = 'md' }: { count: number; size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  // Le badge "pulse" quand le nombre de gemmes change (gain ou dépense).
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
      style={[styles.gemBadge, big && { paddingVertical: 8, paddingHorizontal: 16 }, { transform: [{ scale }] }]}>
      <View style={[styles.gem, big && { width: 22, height: 22 }]} />
      <Text style={[styles.gemText, big && { fontSize: 22 }]}>{count}</Text>
    </Animated.View>
  );
}

export function LevelBar({ level, progress }: { level: number; progress: number }) {
  return (
    <View style={styles.levelWrap}>
      <Text style={styles.levelText}>Niveau {level}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
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
        pressed && !disabled && { transform: [{ scale: 0.97 }] },
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

const styles = StyleSheet.create({
  gemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    ...Shadow.card,
  },
  gem: {
    width: 16,
    height: 16,
    backgroundColor: Palette.gem,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
    borderWidth: 2,
    borderColor: Palette.gemDark,
  },
  gemText: { fontSize: 16, fontWeight: '700', color: Palette.ink },

  levelWrap: { gap: 4 },
  levelText: { fontSize: 15, fontWeight: '700', color: Palette.primaryDark },
  track: {
    height: 14,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Palette.primary, borderRadius: Radius.pill },

  btn: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    ...Shadow.card,
  },
  btnText: { color: Palette.white, fontSize: 18, fontWeight: '800' },

  chip: {
    backgroundColor: Palette.cardSoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.pill,
  },
  chipText: { color: Palette.primaryDark, fontWeight: '700', fontSize: 12 },
});
