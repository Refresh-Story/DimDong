import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DimAvatar } from '@/components/DimAvatar';
import { Scene } from '@/components/Scene';
import { PrimaryButton } from '@/components/ui';
import { ProfileRecord, useGame } from '@/context/GameContext';
import { MAX_PROFILES } from '@/game/profiles';
import { beltForPlayer, levelFromXp } from '@/game/rules';
import { Fonts, Palette, Radius, Shadow, Spacing } from '@/theme';

export default function ProfilesScreen() {
  const { ready, profiles, catalog, createProfile, selectProfile, deleteProfile } = useGame();
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  // Profil choisi pendant la chorégraphie de sortie ; null = écran au repos.
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const pickedScale = useRef(new Animated.Value(1)).current;
  const othersFade = useRef(new Animated.Value(1)).current;

  async function pick(record: ProfileRecord) {
    if (leavingId) return;
    Haptics.selectionAsync().catch(() => {});
    setLeavingId(record.id);
    await selectProfile(record.id);
    // Beat de sortie : la card choisie pop, le reste s'estompe, puis fondu d'écran.
    Animated.parallel([
      Animated.spring(pickedScale, { toValue: 1.12, friction: 4, useNativeDriver: true }),
      Animated.timing(othersFade, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(() => router.replace('/'), 220);
  }

  function confirmDelete(record: ProfileRecord) {
    if (leavingId) return;
    Haptics.selectionAsync().catch(() => {});
    Alert.alert(
      'Supprimer ce dim-sum ?',
      `${record.player.name} perdra ses gemmes et ses objets.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteProfile(record.id) },
      ]
    );
  }

  async function create() {
    if (saving) return;
    const name = draftName.trim();
    if (!name) return;
    Keyboard.dismiss();
    setSaving(true);
    const id = await createProfile(name);
    if (id) {
      setCreating(false);
      router.replace('/');
    } else {
      setSaving(false);
    }
  }

  function openCreation() {
    Haptics.selectionAsync().catch(() => {});
    setDraftName('');
    setSaving(false);
    setCreating(true);
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Scene />
        <ActivityIndicator size="large" color={Palette.primaryDark} />
      </View>
    );
  }

  const empty = profiles.length === 0;

  return (
    <View style={{ flex: 1 }}>
      <Scene />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <Animated.View style={{ opacity: othersFade }}>
            <Text style={styles.title}>{empty ? 'Bienvenue !' : 'Qui joue ?'}</Text>
            <Text style={styles.subtitle}>
              {empty
                ? 'Crée ton premier compagnon pour commencer l’aventure.'
                : 'Choisis ton dim-sum pour jouer.'}
            </Text>
          </Animated.View>

          {empty ? (
            <Animated.View style={[styles.emptyStage, { opacity: othersFade }]}>
              <DimAvatar size={180} equipped={{}} catalog={catalog} />
              <PrimaryButton label="Créer mon dim-sum" onPress={openCreation} style={styles.emptyBtn} />
            </Animated.View>
          ) : (
            <View style={styles.grid}>
              {profiles.map((record) => {
                const level = levelFromXp(record.player.xp);
                const picked = leavingId === record.id;
                return (
                  <Animated.View
                    key={record.id}
                    style={[
                      styles.cardWrap,
                      picked
                        ? { transform: [{ scale: pickedScale }] }
                        : { opacity: othersFade, transform: [{ scale: othersFade.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
                    ]}>
                    <Pressable
                      onPress={() => pick(record)}
                      accessibilityRole="button"
                      accessibilityLabel={`Jouer avec ${record.player.name}`}
                      style={({ pressed }) => [styles.card, pressed && !leavingId && { transform: [{ scale: 0.96 }] }]}>
                      <DimAvatar
                        size={72}
                        equipped={record.player.equipped}
                        catalog={catalog}
                        level={level}
                        emotion={record.player.emotion}
                        belt={beltForPlayer(record.player.name, level, record.player.selectedBelt)}
                      />
                      <Text style={styles.cardName} numberOfLines={1}>{record.player.name}</Text>
                      <Text style={styles.cardLevel}>Niveau {level}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(record)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Supprimer ${record.player.name}`}
                      style={({ pressed }) => [styles.deleteBtn, pressed && { transform: [{ scale: 0.9 }] }]}>
                      <Text style={styles.deleteText}>×</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}

              {profiles.length < MAX_PROFILES && (
                <Animated.View style={[styles.cardWrap, { opacity: othersFade }]}>
                  <Pressable
                    onPress={openCreation}
                    accessibilityRole="button"
                    accessibilityLabel="Créer un nouveau dim-sum"
                    style={({ pressed }) => [styles.card, styles.newCard, pressed && { transform: [{ scale: 0.96 }] }]}>
                    <View style={styles.newBadge}>
                      <Text style={styles.newPlus}>+</Text>
                    </View>
                    <Text style={styles.cardName}>Nouveau</Text>
                    <Text style={styles.cardLevel}>dim-sum</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setCreating(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau dim-sum</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Nom du personnage"
              placeholderTextColor={Palette.inkSoft}
              style={styles.input}
              maxLength={16}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={create}
              submitBehavior="blurAndSubmit"
            />
            <PrimaryButton
              label={saving ? '...' : "C'est parti !"}
              onPress={create}
              disabled={saving || !draftName.trim()}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
  title: { fontSize: 40, fontFamily: Fonts.display, color: Palette.ink, letterSpacing: 1, textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Palette.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  emptyStage: { alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.xl },
  emptyBtn: { alignSelf: 'stretch' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cardWrap: { width: '44%' },
  card: {
    backgroundColor: Palette.white,
    borderRadius: Radius.xl,
    borderWidth: 3,
    borderColor: Palette.outline,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadow.card,
  },
  cardName: { fontSize: 18, fontFamily: Fonts.bodyBold, color: Palette.ink, marginTop: Spacing.sm, maxWidth: '100%' },
  cardLevel: { fontSize: 13, fontFamily: Fonts.body, color: Palette.inkSoft },
  deleteBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Palette.cardSoft,
    borderWidth: 2.5,
    borderColor: Palette.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  deleteText: { fontSize: 18, fontFamily: Fonts.bodyBold, color: Palette.ink, lineHeight: 21 },

  newCard: {
    backgroundColor: Palette.cardSoft,
    borderStyle: 'dashed',
    shadowOpacity: 0,
    elevation: 0,
  },
  newBadge: {
    width: 72,
    height: 94,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlus: { fontSize: 52, fontFamily: Fonts.display, color: Palette.inkSoft },

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
