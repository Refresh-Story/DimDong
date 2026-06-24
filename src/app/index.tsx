import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DimAvatar } from '@/components/DimAvatar';
import { RainbowAura } from '@/components/RainbowAura';
import { Scene } from '@/components/Scene';
import { GemBadge, LevelMedallion, PrimaryButton } from '@/components/ui';
import { useGame } from '@/context/GameContext';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

export default function HomeScreen() {
  const { ready, player, catalog, level, progress, setName } = useGame();
  const router = useRouter();

  // Édition du nom du personnage.
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  function openNameEditor() {
    setDraftName(player.name);
    setEditing(true);
  }

  async function saveName() {
    Keyboard.dismiss();
    await setName(draftName.trim() || 'Dim');
    setEditing(false);
  }

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
        {/* barre du haut : médaillon de niveau + nom/progression + gemmes */}
        <View style={styles.topRow}>
          <LevelMedallion level={level} />
          <Pressable
            style={styles.namePlate}
            onPress={openNameEditor}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Modifier le nom (${player.name})`}>
            <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          </Pressable>
          <GemBadge count={player.gems} tone="chip" />
        </View>

        {/* personnage */}
        <View style={styles.stage}>
          <Animated.View style={{ transform: [{ translateY: bob }] }}>
            {isRainbow && <RainbowAura size={210} />}
            <DimAvatar size={210} equipped={player.equipped} catalog={catalog} level={level} />
          </Animated.View>
        </View>

        {/* bouton brossage */}
        <Pressable
          style={({ pressed }) => [styles.brushBtn, pressed && { transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push('/timer')}>
          <Text style={styles.brushText}>Se brosser les dents</Text>
        </Pressable>

        {/* boutique / mes objets */}
        <View style={styles.bottomRow}>
          <NavCard label="Boutique" onPress={() => router.push('/shop')} />
          <NavCard label="Mes objets" onPress={() => router.push('/inventory')} />
        </View>
      </SafeAreaView>

      {/* modale : renommer le personnage */}
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setEditing(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau nom</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Nom du personnage"
              placeholderTextColor={Palette.inkSoft}
              style={styles.input}
              maxLength={16}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
              submitBehavior="blurAndSubmit"
            />
            <PrimaryButton label="Enregistrer" onPress={saveName} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function NavCard({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navCard, pressed && { transform: [{ scale: 0.97 }] }]}>
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
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card,
  },
  namePlate: { flex: 1, gap: 6 },
  name: { fontSize: 18, fontFamily: Fonts.bodyBold, color: Palette.ink },
  track: {
    height: 11,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outline,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Palette.accent2 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  brushBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  brushText: { color: Palette.white, fontSize: 26, fontFamily: Fonts.display, letterSpacing: 1 },

  bottomRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  navCard: {
    flex: 1,
    backgroundColor: Palette.cardSoft,
    borderRadius: Radius.lg,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadow.card,
  },
  navLabel: { fontSize: 18, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 0.5 },

  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalCard: {
    width: '100%',
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: Fonts.display,
    color: Palette.ink,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2.5,
    borderColor: Palette.outline,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    fontFamily: Fonts.bodyBold,
    color: Palette.ink,
    textAlign: 'center',
  },
});
