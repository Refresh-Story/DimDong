// Petits composants d'interface réutilisables pour Dim-Dong.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Palette, Radius, Shadow, Spacing } from '@/theme';

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
      style={[
        styles.gemBadge,
        tone === 'chip' && styles.gemBadgeChip,
        big && { paddingVertical: 8, paddingHorizontal: 16 },
        { transform: [{ scale }] },
      ]}>
      <View style={[styles.gem, big && { width: 22, height: 22 }]} />
      <Text style={[styles.gemText, big && { fontSize: 22 }]}>{count}</Text>
    </Animated.View>
  );
}

// Médaillon de niveau : pastille jade avec le niveau bien lisible (header d'accueil).
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
  // Variante "chip" : fond crème, sans ombre (s'intègre dans une surface déjà blanche).
  gemBadgeChip: {
    backgroundColor: Palette.cardSoft,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  medallion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionNum: { fontSize: 18, fontWeight: '800', color: Palette.white, lineHeight: 20 },
  medallionLabel: { fontSize: 8, fontWeight: '700', color: '#CFEBDF', letterSpacing: 0.5 },

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
