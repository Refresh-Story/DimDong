import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DimAvatar } from '@/components/DimAvatar';
import { RainbowAura } from '@/components/RainbowAura';
import { Scene } from '@/components/Scene';
import { GemBadge, LevelBar } from '@/components/ui';
import { useGame } from '@/context/GameContext';
import { Palette, Radius, Shadow, Spacing } from '@/theme';

export default function HomeScreen() {
  const { ready, player, catalog, level, progress } = useGame();
  const router = useRouter();

  // Petit rebond permanent de Dim.
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Scene />
        <ActivityIndicator size="large" color={Palette.primaryDark} />
      </View>
    );
  }

  if (!player.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  const placedDecor = catalog.filter((i) => player.placedDecor.includes(i.id));
  const isRainbow = !!catalog.find((i) => i.id === player.equipped.color)?.rainbow;

  return (
    <View style={{ flex: 1 }}>
      <Scene decor={placedDecor} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* barre du haut : nom + niveau + gemmes */}
        <View style={styles.topRow}>
          <View style={styles.namePlate}>
            <Text style={styles.name}>{player.name}</Text>
            <LevelBar level={level} progress={progress} />
          </View>
          <GemBadge count={player.gems} />
        </View>

        {/* personnage */}
        <View style={styles.stage}>
          <Animated.View style={{ transform: [{ translateY: bob }] }}>
            {isRainbow && <RainbowAura size={210} />}
            <DimAvatar size={210} equipped={player.equipped} catalog={catalog} />
          </Animated.View>
        </View>

        {/* bouton brossage */}
        <Pressable
          style={({ pressed }) => [styles.brushBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/timer')}>
          <Text style={styles.brushIcon}>🪥</Text>
          <Text style={styles.brushText}>Se brosser les dents</Text>
        </Pressable>

        {/* boutique / mes objets */}
        <View style={styles.bottomRow}>
          <NavCard label="Boutique" emoji="🛍️" onPress={() => router.push('/shop')} />
          <NavCard label="Mes objets" emoji="🧺" onPress={() => router.push('/inventory')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function NavCard({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navCard, pressed && { transform: [{ scale: 0.97 }] }]}>
      <Text style={styles.navEmoji}>{emoji}</Text>
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, paddingHorizontal: Spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.white,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card,
  },
  namePlate: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '800', color: Palette.ink },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  brushBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  brushIcon: { fontSize: 24 },
  brushText: { color: Palette.white, fontSize: 20, fontWeight: '800' },

  bottomRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  navCard: {
    flex: 1,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: 4,
    ...Shadow.card,
  },
  navEmoji: { fontSize: 28 },
  navLabel: { fontSize: 15, fontWeight: '800', color: Palette.primaryDark },
});
